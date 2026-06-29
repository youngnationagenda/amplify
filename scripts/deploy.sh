#!/usr/bin/env bash
#
# deploy.sh
# Orchestrates the full NetTribe deployment:
#   1. Deploy Amplify backend (generates amplify_outputs.json)
#   2. Extract outputs into terraform.tfvars values
#   3. Run Terraform plan
#   4. Run Terraform apply (auto-approve for dev/staging, manual for prod)
#
# Usage:
#   ./scripts/deploy.sh <environment>
#   ./scripts/deploy.sh dev
#   ./scripts/deploy.sh staging
#   ./scripts/deploy.sh prod

set -euo pipefail

# ─── Configuration ─────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INFRA_DIR="$PROJECT_ROOT/infra"
AMPLIFY_OUTPUTS="$PROJECT_ROOT/amplify_outputs.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ─── Input Validation ──────────────────────────────────────────────────────────

if [ $# -lt 1 ]; then
  echo -e "${RED}ERROR: Environment argument required.${NC}"
  echo "Usage: $0 <environment>"
  echo "  Environments: dev, staging, prod"
  exit 1
fi

ENVIRONMENT="$1"

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
  echo -e "${RED}ERROR: Invalid environment '$ENVIRONMENT'. Must be one of: dev, staging, prod${NC}"
  exit 1
fi

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  NetTribe Deployment — Environment: ${ENVIRONMENT}${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# ─── Step 1: Deploy Amplify Backend ────────────────────────────────────────────

echo -e "${YELLOW}[1/4] Deploying Amplify backend...${NC}"

cd "$PROJECT_ROOT"

# Map environment to Amplify branch
case "$ENVIRONMENT" in
  prod)    BRANCH="main" ;;
  staging) BRANCH="staging" ;;
  dev)     BRANCH="develop" ;;
esac

echo "  Branch: $BRANCH"
echo "  Running: npx ampx pipeline-deploy --branch $BRANCH --app-id \$AMPLIFY_APP_ID"

if [ -z "${AMPLIFY_APP_ID:-}" ]; then
  echo -e "${RED}ERROR: AMPLIFY_APP_ID environment variable is not set.${NC}"
  echo "  Set it with: export AMPLIFY_APP_ID=<your-amplify-app-id>"
  exit 1
fi

npx ampx pipeline-deploy --branch "$BRANCH" --app-id "$AMPLIFY_APP_ID"

if [ ! -f "$AMPLIFY_OUTPUTS" ]; then
  echo -e "${RED}ERROR: amplify_outputs.json not found after deployment.${NC}"
  echo "  Expected at: $AMPLIFY_OUTPUTS"
  exit 1
fi

echo -e "${GREEN}  ✓ Amplify backend deployed successfully${NC}"
echo ""

# ─── Step 2: Extract Amplify Outputs ──────────────────────────────────────────

echo -e "${YELLOW}[2/4] Extracting Amplify outputs...${NC}"

"$SCRIPT_DIR/extract-amplify-outputs.sh"

echo -e "${GREEN}  ✓ Amplify outputs extracted${NC}"
echo ""

# ─── Step 3: Terraform Plan ───────────────────────────────────────────────────

echo -e "${YELLOW}[3/4] Running Terraform plan...${NC}"

cd "$INFRA_DIR"

# Initialize Terraform with environment-specific state key
terraform init \
  -backend-config="key=infra/${ENVIRONMENT}/terraform.tfstate" \
  -reconfigure

# Select var file based on environment
TFVARS_FILE="environments/${ENVIRONMENT}.tfvars"

if [ ! -f "$TFVARS_FILE" ]; then
  echo -e "${YELLOW}  WARNING: $TFVARS_FILE not found, using terraform.tfvars only${NC}"
  terraform plan -out=tfplan
else
  terraform plan -var-file="$TFVARS_FILE" -out=tfplan
fi

echo -e "${GREEN}  ✓ Terraform plan complete${NC}"
echo ""

# ─── Step 4: Terraform Apply ──────────────────────────────────────────────────

echo -e "${YELLOW}[4/4] Applying Terraform changes...${NC}"

if [ "$ENVIRONMENT" = "prod" ]; then
  echo -e "${YELLOW}  ⚠ Production deployment requires manual approval.${NC}"
  echo ""
  echo "  Review the plan above carefully."
  read -rp "  Type 'yes' to apply to production: " APPROVAL
  if [ "$APPROVAL" != "yes" ]; then
    echo -e "${RED}  Deployment cancelled.${NC}"
    rm -f tfplan
    exit 1
  fi
fi

terraform apply tfplan

rm -f tfplan

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Deployment to ${ENVIRONMENT} complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
