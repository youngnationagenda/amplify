# Design Document

## Overview

This document describes the technical architecture and implementation design for the NetTribe monorepo infrastructure. It translates the requirements into concrete system components, data flows, deployment strategies, and testing patterns that can be directly implemented.

The NetTribe monorepo contains three applications (nettribexyz, evtelemetryai, nettribeblockchain) sharing a single CI/CD pipeline, with infrastructure managed by both AWS Amplify Gen 2 and Terraform. The architecture provides environment isolation, unified API routing, a serverless telemetry pipeline, and a layered testing strategy.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         NetTribe Monorepo                                        │
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │ apps/nettribexyz  │  │ apps/evtelemetryai│  │ apps/nettribeblockchain      │  │
│  │                   │  │                   │  │                              │  │
│  │ React + Vite +    │  │ React + Vite +    │  │ Hardhat + Solidity +         │  │
│  │ TailwindCSS +     │  │ MUI + wagmi       │  │ Uniswap V3 + Celo Sepolia   │  │
│  │ shadcn/ui + wagmi │  │                   │  │                              │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────────┬───────────────┘  │
│           │                      │                            │                   │
│  ┌────────┴──────────────────────┴────────────────────────────┴───────────────┐  │
│  │                        amplify.yml (CI/CD Pipeline)                         │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌────────────────────────────────┐  ┌────────────────────────────────────────┐ │
│  │  amplify/ (Gen 2 Backend)      │  │  infra/ (Terraform)                    │ │
│  │  • Auth (Cognito)              │  │  • modules/telemetry-pipeline/          │ │
│  │  • Data (AppSync+DynamoDB)     │  │  • modules/api-gateway/                │ │
│  │  • Functions (Lambda)          │  │  • S3 state backend                    │ │
│  └────────────────────────────────┘  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Technology Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Package manager (root) | npm workspaces | Already in use, native to Node 20 |
| Package manager (blockchain) | pnpm | Required by Hardhat 3 dependencies |
| Test framework (TS) | Vitest | Fast, native ESM, Vite-aligned |
| Test framework (Solidity) | Hardhat Test (Chai) | Native to Hardhat ecosystem |
| E2E framework | Playwright | Cross-browser, fast, TypeScript-first |
| IaC | Terraform | Already in use, multi-provider support |
| State management | S3 + DynamoDB | AWS-native, team already configured |
| Monitoring | CloudWatch | Native integration, no extra cost for basic use |
| CI/CD | Amplify pipeline | Already configured, branch-based deploys |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          AWS Cloud (us-east-1)                                   │
│                                                                                 │
│  ┌─── Amplify Hosting ───────────────────────────────────────────────────────┐  │
│  │                                                                           │  │
│  │  ┌─────────────────┐        ┌─────────────────┐                          │  │
│  │  │ nettribexyz      │        │ evtelemetryai    │                          │  │
│  │  │ S3 + CloudFront  │        │ S3 + CloudFront  │                          │  │
│  │  │ (React SPA)      │        │ (React SPA)      │                          │  │
│  │  └────────┬─────────┘        └────────┬─────────┘                          │  │
│  └───────────┼───────────────────────────┼───────────────────────────────────┘  │
│              │                            │                                      │
│  ┌───────────┼────────────────────────────┼──────────────────────────────────┐  │
│  │           ▼                            ▼                                  │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  API Gateway (HTTP API) — Unified Router                            │  │  │
│  │  │                                                                     │  │  │
│  │  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐    │  │  │
│  │  │  │ POST /telemetry │ POST /athena  │  │ GET /health (no auth)   │    │  │  │
│  │  │  └──────┬──────┘  └──────┬───────┘  └─────────────────────────┘    │  │  │
│  │  │         │                 │                                         │  │  │
│  │  │         │     Cognito JWT Authorizer                                │  │  │
│  │  └─────────┼─────────────────┼─────────────────────────────────────────┘  │  │
│  │            │                 │                                             │  │
│  │  ┌─────────┼─────────────────┼─────────────────────────────────────────┐  │  │
│  │  │  Lambda Functions                                                   │  │  │
│  │  │         │                 │                                         │  │  │
│  │  │  ┌──────▼──────┐  ┌──────▼──────┐                                  │  │  │
│  │  │  │ telemetry-  │  │ athena-     │                                  │  │  │
│  │  │  │ ingest      │  │ query       │                                  │  │  │
│  │  │  └──────┬──────┘  └──────┬──────┘                                  │  │  │
│  │  └─────────┼─────────────────┼─────────────────────────────────────────┘  │  │
│  │            │                 │                                             │  │
│  │            ▼                 ▼                                             │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                                │  │
│  │  │ Kinesis Firehose │  │ Athena          │                                │  │
│  │  │ (GZIP compress)  │  │ (query engine)  │                                │  │
│  │  └────────┬─────────┘  └────────┬────────┘                                │  │
│  │           │                      │                                         │  │
│  │           ▼                      ▼                                         │  │
│  │  ┌─────────────────────────────────────────┐                              │  │
│  │  │ S3 (telemetry data, partitioned by      │                              │  │
│  │  │      year/month/day)                    │                              │  │
│  │  └────────────────────┬────────────────────┘                              │  │
│  │                       │                                                    │  │
│  │                       ▼                                                    │  │
│  │  ┌─────────────────────────────────────────┐                              │  │
│  │  │ Glue Catalog (schema registry)          │                              │  │
│  │  └─────────────────────────────────────────┘                              │  │
│  │                                                                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Amplify Backend                                                    │  │  │
│  │  │                                                                     │  │  │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │  │  │
│  │  │  │ Cognito      │  │ AppSync      │  │ DynamoDB                 │  │  │  │
│  │  │  │ User Pool    │  │ GraphQL API  │  │ (10 tables)              │  │  │  │
│  │  │  │ + 4 groups   │  │              │  │                          │  │  │  │
│  │  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Deployment Workflow:**
1. Amplify deploys backend → generates `amplify_outputs.json`
2. Script extracts Cognito User Pool ID + Lambda ARNs
3. Values injected into `terraform.tfvars`
4. `terraform plan` runs for review
5. `terraform apply` (auto for dev/staging, manual approval for prod)

**Branch Strategy:**

| Branch | Environment | Auto-deploy |
|--------|-------------|-------------|
| main | prod | Yes |
| staging | staging | Yes |
| develop | dev | Yes |
| feature/* | preview | Manual |

## Components and Interfaces

### 1. CI/CD Pipeline (amplify.yml)

The pipeline uses Amplify's multi-app format. Each app is an independent build unit.

**Build Order:**
1. `apps/nettribexyz` — Backend deploy (ampx pipeline-deploy) → Frontend build (vite build)
2. `apps/evtelemetryai` — Frontend build only (backend is Terraform-managed)
3. `apps/nettribeblockchain` — Compile only (pnpm + hardhat compile)

**Change Detection:** Amplify natively handles per-app builds via `appRoot`. Only apps with changed files trigger builds.

**Test Integration:**
```yaml
# Added to each app's preBuild phase
phases:
  preBuild:
    commands:
      - npm ci
      - npm run test -- --run  # Vitest single-run
      - npm run lint
```

### 2. Terraform Infrastructure

**Module Structure:**
```
infra/
├── main.tf                    # Root module, provider config
├── variables.tf               # Input variables
├── outputs.tf                 # Output values
├── terraform.tfvars.example   # Template for env vars
├── environments/
│   ├── dev.tfvars             # Dev environment values
│   ├── staging.tfvars         # Staging environment values
│   └── prod.tfvars            # Prod environment values
├── modules/
│   ├── telemetry-pipeline/
│   │   ├── main.tf            # S3, Firehose, Glue, Athena
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── iam.tf             # IAM roles for Firehose
│   └── api-gateway/
│       ├── main.tf            # HTTP API, routes, authorizer
│       ├── variables.tf
│       ├── outputs.tf
│       └── cors.tf            # CORS configuration
└── scripts/
    ├── plan.sh                # terraform plan wrapper
    └── apply.sh               # terraform apply with approval gate
```

**State Backend Configuration:**
```hcl
backend "s3" {
  bucket         = "nettribe-terraform-state"
  key            = "infra/${var.environment}/terraform.tfstate"
  region         = "us-east-1"
  dynamodb_table = "nettribe-terraform-locks"
  encrypt        = true
}
```

### 3. API Gateway

**Route Configuration:**

| Route | Method | Lambda | Auth | Description |
|-------|--------|--------|------|-------------|
| /telemetry | POST | telemetry-ingest | JWT | Ingest IoT telemetry events |
| /athena | POST | athena-query | JWT | Execute Athena queries |
| /health | GET | (inline) | None | Health check endpoint |

**CORS Configuration per Environment:**
```hcl
cors_configuration {
  allow_origins = var.environment == "prod" 
    ? ["https://nettribe.xyz"] 
    : ["http://localhost:5173", "http://localhost:3000"]
  allow_methods = ["GET", "POST", "OPTIONS"]
  allow_headers = ["Authorization", "Content-Type"]
  max_age       = 3600
}
```

**JWT Authorizer:**
- Issuer: Cognito User Pool endpoint
- Audience: Cognito App Client ID
- Token source: Authorization header (Bearer token)

### 4. Telemetry Pipeline

**Data Flow:**
```
IoT Device → Frontend → POST /telemetry → Lambda → Firehose → S3 → Glue → Athena
                                            │
                                            ├── Validate payload schema
                                            ├── Enrich with timestamp + partition keys
                                            └── PutRecord to Firehose
```

**S3 Partition Strategy:**
```
s3://nettribe-telemetry-data-{env}/
  year=2024/
    month=01/
      day=15/
        firehose-delivery-stream-1-2024-01-15-00-00-00.gz
```

**Lifecycle Policy:**

| Transition | Days | Storage Class |
|-----------|------|---------------|
| Current | 0-89 | Standard |
| IA | 90-364 | Standard-IA |
| Glacier | 365-2554 | Glacier |
| Expire | 2555+ | Deleted |

### 5. Secrets Management

**Secret Sources:**

| Secret | Storage | Injection Point |
|--------|---------|-----------------|
| Cognito Pool ID | Amplify env vars | Build-time (VITE_*) |
| API Gateway URL | Amplify env vars | Build-time (VITE_*) |
| Celo private key | Amplify env vars | Build-time (Hardhat config) |
| Firehose stream name | Terraform vars | Lambda env vars |
| AWS credentials | IAM roles | Runtime (Lambda execution role) |

**Prevention Controls:**
- `.gitignore` includes: `.env`, `*.tfvars` (not .example), `amplify_outputs.json`
- Pre-commit hook validates no secrets in staged files
- Amplify build fails if `.env` or `terraform.tfvars` detected in commit

### 6. Monitoring

**CloudWatch Structure:**
```
/nettribe/{environment}/
  ├── api-gateway/       # Access logs (JSON structured)
  ├── lambda/
  │   ├── telemetry-ingest/
  │   └── athena-query/
  ├── firehose/          # Delivery errors
  └── pipeline/          # Build metrics
```

**Alarms:**

| Alarm | Metric | Threshold | Action |
|-------|--------|-----------|--------|
| Lambda errors | Errors count | > 5 in 5 min | SNS notification |
| Firehose failures | DeliveryToS3.DataFreshness | > 300 seconds | SNS notification |
| Athena cost | ProcessedBytes | > 10GB/day | SNS notification |
| API 5xx rate | 5XXError | > 1% of requests | SNS notification |

## Data Models

### Telemetry Event Schema

```typescript
interface TelemetryEvent {
  deviceId: string;          // IoT device identifier
  riderId: string;           // Associated rider
  motorcycleId: string;      // Associated motorcycle
  timestamp: string;         // ISO 8601 timestamp
  latitude: number;          // GPS latitude
  longitude: number;         // GPS longitude
  speedKmh: number;          // Current speed
  batteryLevel: number;      // Battery percentage (0-100)
  energyConsumedKwh: number; // Energy used since last event
  distanceKm: number;        // Distance since last event
}
```

### Platform Data Models (AppSync + DynamoDB)

The following models are managed by Amplify Gen 2 data resource with owner-based authorization:

| Model | Key | Secondary Indexes | Authorization |
|-------|-----|-------------------|---------------|
| Profile | id (owner) | — | Owner read/write, Admin read |
| UserRole | id | userId | Owner read, Admin read/write |
| Rider | id | userId | Owner read/write, Admin read |
| Motorcycle | id | currentRiderId | Owner read/write, Admin read |
| Ride | id | riderId | Owner read/write, Admin read |
| CarbonCredit | id | — | Owner read, Admin read/write |
| CarbonPurchase | id | — | Owner read/write, Admin read |
| InitialCarbonOffering | id | icoId | Public read, Admin write |
| IcoPurchase | id | — | Owner read/write, Admin read |
| BurnedCredit | id | — | Owner read, Admin read/write |

### Terraform State Model

```hcl
# State Backend
S3 Bucket: nettribe-terraform-state
  └── infra/{environment}/terraform.tfstate

DynamoDB Table: nettribe-terraform-locks
  └── LockID (partition key)
```

### Resource Naming Convention

All infrastructure resources follow environment-prefixed naming:
- `nettribe-telemetry-data-{env}` — S3 telemetry bucket
- `nettribe-firehose-{env}` — Kinesis Firehose stream
- `nettribe-glue-db-{env}` — Glue database
- `nettribe-api-{env}` — API Gateway
- `nettribe-terraform-state` — State bucket (shared across environments)
- `nettribe-terraform-locks` — Lock table (shared across environments)

## Correctness Properties

This feature is primarily Infrastructure as Code (Terraform, Amplify) and CI/CD pipeline configuration. Property-based testing is not applicable here — the infrastructure is declarative configuration, not functions with varied input/output behavior. Instead, correctness is validated through infrastructure plan checks, integration tests, and smoke tests.

The following properties describe invariants that the infrastructure must maintain, validated through integration tests and infrastructure assertions:

### Property 1: Deployment Idempotency

*For any* given commit, running the full pipeline twice SHALL produce identical deployed artifacts and infrastructure state with no additional changes on the second run.

**Validates: Requirements 1.1, 3.1**

### Property 2: Environment Isolation

*For any* pair of environments (dev, staging, prod), resources provisioned for one environment SHALL be inaccessible from another environment's configuration, IAM roles, or network paths.

**Validates: Requirements 2.1, 2.2, 2.4**

### Property 3: Auth Token Validation

*For any* valid Cognito JWT token, the API Gateway authorizer SHALL accept the request; for any expired or malformed token, the authorizer SHALL reject with 401.

**Validates: Requirements 4.4**

### Property 4: Telemetry Data Integrity

*For any* valid telemetry event accepted by the ingest Lambda, the event SHALL be queryable via Athena within the expected S3 partition path (year/month/day) after Firehose delivery.

**Validates: Requirements 5.1, 5.3, 5.4**

### Property 5: Build Independence

*For any* change scoped to a single app directory, the pipeline SHALL trigger only that app's build step and leave other apps' artifacts unchanged.

**Validates: Requirements 1.1, 1.2, 1.5**

### Property 6: Terraform State Consistency

*For any* successful `terraform apply`, the state file SHALL reflect the actual deployed infrastructure with zero drift when immediately followed by a `terraform plan`.

**Validates: Requirements 3.1, 3.5**

### Property 7: Secret Exclusion

*For any* commit containing files matching secret patterns (`.env`, `*.tfvars`), the pipeline SHALL fail the build and prevent deployment.

**Validates: Requirements 10.4**

## Error Handling

### Pipeline Failures

| Failure Scenario | Handling Strategy |
|-----------------|-------------------|
| Build failure in one app | Report failure, continue building independent apps (Req 1.5) |
| Terraform plan with destructive changes (prod) | Halt and require manual approval (Req 3.6) |
| Test suite failure on PR | Block merge, report failing tests (Req 8.4) |
| Secret detected in commit | Fail build immediately with warning message (Req 10.4) |

### Telemetry Pipeline Errors

| Failure Scenario | Handling Strategy |
|-----------------|-------------------|
| Invalid telemetry payload | Return 400 with descriptive error, do not write to Firehose (Req 5.7) |
| Firehose delivery failure | CloudWatch alarm triggers SNS notification, Firehose retries automatically |
| Athena query cost exceeded | Cost alert notification, workgroup enforces scan limit (Req 5.5) |
| Lambda execution failure | CloudWatch alarm, automatic retry (1x), DLQ for persistent failures |

### API Gateway Errors

| Failure Scenario | Handling Strategy |
|-----------------|-------------------|
| Invalid/expired JWT token | Return 401 Unauthorized response (Req 4.4) |
| Lambda timeout | Return 504 Gateway Timeout, log to CloudWatch |
| CORS preflight failure | Return appropriate CORS headers with 200 for OPTIONS |
| Unmatched route | Return 404 Not Found |

### Terraform Errors

| Failure Scenario | Handling Strategy |
|-----------------|-------------------|
| State lock contention | Wait and retry; alert if lock held > 10 minutes |
| Resource creation failure | Terraform marks as tainted, next apply recreates |
| Missing input variables | `terraform plan` fails with clear variable error |
| Provider API rate limiting | Exponential backoff built into AWS provider |

## Testing Strategy

### Test Layers

```
┌─────────────────────────────────────────────────────────┐
│  E2E Tests (Playwright)                                 │
│  • Auth flows, full page interactions                   │
├─────────────────────────────────────────────────────────┤
│  Integration Tests (Vitest + AWS SDK mocks)             │
│  • Lambda → Firehose, Lambda → Athena                  │
│  • AppSync resolver logic                              │
├─────────────────────────────────────────────────────────┤
│  Unit Tests                                             │
│  • Vitest: React components, hooks, utilities           │
│  • Hardhat: Solidity contract logic                     │
├─────────────────────────────────────────────────────────┤
│  Static Analysis                                        │
│  • ESLint, TypeScript compiler, terraform validate      │
└─────────────────────────────────────────────────────────┘
```

### Test Configuration per App

| App | Unit Framework | Integration | E2E |
|-----|----------------|-------------|-----|
| nettribexyz | Vitest + React Testing Library | Vitest + aws-sdk-client-mock | Playwright |
| evtelemetryai | Vitest + React Testing Library | Vitest + aws-sdk-client-mock | — |
| nettribeblockchain | Hardhat + Chai | Hardhat network fork | — |
| infra/ | — | terraform validate + plan | — |

### Coverage Strategy

- Minimum 80% line coverage for new TypeScript code
- Coverage reports generated by Vitest (v8 provider)
- Contract test coverage via Hardhat's solidity-coverage plugin
- CI blocks merge if coverage drops below threshold

### Infrastructure Validation

Since this feature is primarily IaC, the following validation approaches replace property-based testing:

- **`terraform validate`** — Syntax and configuration correctness
- **`terraform plan` (dry-run)** — Validates resource changes before applying
- **Snapshot tests** — Compare `terraform plan` output against expected baselines for each environment
- **Policy checks** — Verify all resources have required tags (Project, ManagedBy, Environment)
- **Integration smoke tests** — Post-deploy verification that API Gateway responds, Lambda executes, Firehose delivers

### Test Execution in Pipeline

```yaml
# Per-app preBuild phase
phases:
  preBuild:
    commands:
      - npm ci
      - npm run test -- --run    # Vitest single-run (no watch mode)
      - npm run lint

# Infrastructure validation (separate step)
- terraform init
- terraform validate
- terraform plan -var-file=environments/${ENV}.tfvars
```
