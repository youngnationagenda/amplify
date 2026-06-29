# NetTribe Infrastructure (IaC)

Terraform modules for AWS resources not managed by Amplify Gen 2.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AWS Cloud                                          │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  API Gateway (HTTP API) — Unified Router                             │   │
│  │                                                                      │   │
│  │  POST /telemetry ──→ Lambda (telemetry-ingest)                       │   │
│  │  POST /athena    ──→ Lambda (athena-query)                           │   │
│  │  GET  /health    ──→ health check                                    │   │
│  │                                                                      │   │
│  │  Auth: Cognito JWT Authorizer                                        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────┐    ┌─────────────────────────────────────────┐    │
│  │  Amplify Gen 2       │    │  Telemetry Pipeline                     │    │
│  │                      │    │                                         │    │
│  │  • Cognito Auth      │    │  Lambda → Kinesis Firehose → S3 (GZIP) │    │
│  │  • AppSync GraphQL   │    │                     │                   │    │
│  │  • DynamoDB tables   │    │              Glue Catalog               │    │
│  │  • Lambda functions  │    │                     │                   │    │
│  │  • S3 + CloudFront   │    │              Athena Queries             │    │
│  │    (frontend hosting)│    │                                         │    │
│  └─────────────────────┘    └─────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────┐                                                    │
│  │  Blockchain (CI/CD)  │                                                    │
│  │                      │                                                    │
│  │  Hardhat compile +   │                                                    │
│  │  deploy to Celo      │                                                    │
│  │  (no runtime infra)  │                                                    │
│  └─────────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Modules

### `modules/telemetry-pipeline/`
- S3 bucket with lifecycle policies (IA at 90d, Glacier at 1yr, expire at 7yr)
- Kinesis Firehose delivery stream with GZIP compression
- Glue catalog database + table (partitioned by year/month/day)
- Athena workgroup with scan limits
- IAM roles for Firehose

### `modules/api-gateway/`
- HTTP API (API Gateway v2) with CORS
- Cognito JWT authorizer
- Routes: `/telemetry`, `/athena`, `/health`
- CloudWatch access logging

## What Amplify Manages (NOT in Terraform)

These are handled by `amplify/backend.ts`:
- Cognito User Pool + groups (admin, rider, investor, offsetter)
- AppSync GraphQL API + DynamoDB tables
- Lambda functions (athena-query, telemetry-ingest)
- Frontend hosting (S3 + CloudFront)

## Deployment Order

1. **First**: Deploy Amplify backend (`npx ampx pipeline-deploy`)
   - This creates Cognito, AppSync, DynamoDB, and Lambda functions
2. **Second**: Run Terraform with Amplify outputs
   - Grab Cognito User Pool ID and Lambda ARNs from `amplify_outputs.json`
   - Apply Terraform to create Firehose, S3, Glue, API Gateway

```bash
cd infra/
cp terraform.tfvars.example terraform.tfvars
# Fill in values from amplify_outputs.json
terraform init
terraform plan
terraform apply
```

## Environment Strategy

| Variable | Dev | Prod |
|----------|-----|------|
| `environment` | `dev` | `prod` |
| S3 bucket | `nettribe-telemetry-data-dev` | `nettribe-telemetry-data-prod` |
| Firehose | `nettribe-telemetry-stream-dev` | `nettribe-telemetry-stream-prod` |
| Athena DB | `nettribe_carbon_dev` | `nettribe_carbon_prod` |

## Cost Estimate (Dev)

| Service | Estimated Monthly Cost |
|---------|----------------------|
| Kinesis Firehose | ~$5 (low volume) |
| S3 (telemetry) | ~$2 |
| Athena queries | ~$1 (pay per scan) |
| API Gateway | ~$1 (first 1M requests free) |
| Lambda | ~$0 (free tier covers dev) |
| Amplify Hosting | ~$0 (free tier) |
| **Total (dev)** | **~$10/month** |


## Deployment Automation Scripts

The `scripts/` directory at the monorepo root contains automation scripts for managing infrastructure deployments.

### Prerequisites

- AWS CLI configured with valid credentials
- `jq` installed for JSON parsing
- Node.js 20+ with `npx` available
- Terraform >= 1.5.0 installed
- `AMPLIFY_APP_ID` environment variable set

### First-Time Setup

Before deploying infrastructure for the first time, bootstrap the Terraform state backend:

```bash
# Create S3 bucket and DynamoDB lock table
./scripts/bootstrap-state.sh

# Optionally specify a region (defaults to us-east-1)
./scripts/bootstrap-state.sh --region us-west-2
```

This creates:
- **S3 bucket** (`nettribe-terraform-state`) — stores Terraform state files with versioning and encryption
- **DynamoDB table** (`nettribe-terraform-locks`) — prevents concurrent Terraform operations

The script is idempotent — running it again will skip existing resources.

### Full Deployment

The `deploy.sh` script orchestrates the complete deployment pipeline:

```bash
# Deploy to dev environment
./scripts/deploy.sh dev

# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production (requires manual approval)
./scripts/deploy.sh prod
```

**Deployment steps (in order):**

1. **Amplify backend** — Runs `npx ampx pipeline-deploy` to deploy Cognito, AppSync, DynamoDB, and Lambda functions
2. **Extract outputs** — Parses `amplify_outputs.json` and updates `infra/terraform.tfvars` with Cognito User Pool ID and Lambda ARNs
3. **Terraform plan** — Initializes Terraform with the correct state key and generates an execution plan
4. **Terraform apply** — Applies the plan (auto-approve for dev/staging, manual confirmation for prod)

### Extract Amplify Outputs

If you need to extract Amplify outputs independently (e.g., after a manual Amplify deploy):

```bash
./scripts/extract-amplify-outputs.sh
```

This reads `amplify_outputs.json` from the project root and writes:
- `cognito_user_pool_id` → `infra/terraform.tfvars`
- `athena_lambda_arn` → `infra/terraform.tfvars`

### Script Reference

| Script | Purpose |
|--------|---------|
| `scripts/bootstrap-state.sh` | Create S3 state bucket + DynamoDB lock table (first-time only) |
| `scripts/deploy.sh <env>` | Full deployment: Amplify → extract → Terraform plan → apply |
| `scripts/extract-amplify-outputs.sh` | Parse amplify_outputs.json into terraform.tfvars values |
| `scripts/check-secrets.sh` | Pre-commit hook to detect accidentally staged secrets |

### Environment Configuration

Each environment uses a separate Terraform state file and variable file:

| Environment | State Key | Var File | Auto-Approve |
|-------------|-----------|----------|--------------|
| dev | `infra/dev/terraform.tfstate` | `environments/dev.tfvars` | Yes |
| staging | `infra/staging/terraform.tfstate` | `environments/staging.tfvars` | Yes |
| prod | `infra/prod/terraform.tfstate` | `environments/prod.tfvars` | No (manual) |

### Manual Deployment Steps

If you prefer to run each step individually:

```bash
# 1. Deploy Amplify backend
export AMPLIFY_APP_ID=<your-app-id>
npx ampx pipeline-deploy --branch develop --app-id $AMPLIFY_APP_ID

# 2. Extract outputs
./scripts/extract-amplify-outputs.sh

# 3. Initialize and plan
cd infra/
terraform init -backend-config="key=infra/dev/terraform.tfstate"
terraform plan -var-file=environments/dev.tfvars -out=tfplan

# 4. Apply
terraform apply tfplan
```
