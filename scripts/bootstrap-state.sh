#!/usr/bin/env bash
#
# bootstrap-state.sh
# Creates the S3 state bucket and DynamoDB lock table for Terraform remote state.
# This script is idempotent — it checks if resources exist before creating them.
#
# Usage:
#   ./scripts/bootstrap-state.sh
#   ./scripts/bootstrap-state.sh --region us-east-1
#
# Prerequisites:
#   - AWS CLI configured with appropriate credentials
#   - Permissions to create S3 buckets and DynamoDB tables

set -euo pipefail

# ─── Configuration ─────────────────────────────────────────────────────────────

STATE_BUCKET="nettribe-terraform-state"
LOCK_TABLE="nettribe-terraform-locks"
REGION="${1:-us-east-1}"

# Strip --region flag if provided
if [ "$REGION" = "--region" ]; then
  REGION="${2:-us-east-1}"
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  NetTribe Terraform State Bootstrap${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Region: $REGION"
echo "  Bucket: $STATE_BUCKET"
echo "  Table:  $LOCK_TABLE"
echo ""

# ─── Prerequisite Checks ──────────────────────────────────────────────────────

if ! command -v aws &> /dev/null; then
  echo -e "${RED}ERROR: AWS CLI is required but not installed.${NC}"
  echo "  Install from: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
  exit 1
fi

# Verify AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
  echo -e "${RED}ERROR: AWS credentials not configured or expired.${NC}"
  echo "  Run 'aws configure' or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
  exit 1
fi

echo "  AWS Account: $(aws sts get-caller-identity --query Account --output text)"
echo ""

# ─── Create S3 State Bucket ───────────────────────────────────────────────────

echo -e "${YELLOW}[1/2] Checking S3 state bucket...${NC}"

if aws s3api head-bucket --bucket "$STATE_BUCKET" 2>/dev/null; then
  echo -e "${GREEN}  ✓ Bucket '$STATE_BUCKET' already exists. Skipping creation.${NC}"
else
  echo "  Creating bucket: $STATE_BUCKET"

  # us-east-1 doesn't use LocationConstraint
  if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket \
      --bucket "$STATE_BUCKET" \
      --region "$REGION"
  else
    aws s3api create-bucket \
      --bucket "$STATE_BUCKET" \
      --region "$REGION" \
      --create-bucket-configuration LocationConstraint="$REGION"
  fi

  # Enable versioning for state recovery
  aws s3api put-bucket-versioning \
    --bucket "$STATE_BUCKET" \
    --versioning-configuration Status=Enabled

  # Enable server-side encryption
  aws s3api put-bucket-encryption \
    --bucket "$STATE_BUCKET" \
    --server-side-encryption-configuration '{
      "Rules": [{
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        },
        "BucketKeyEnabled": true
      }]
    }'

  # Block public access
  aws s3api put-public-access-block \
    --bucket "$STATE_BUCKET" \
    --public-access-block-configuration '{
      "BlockPublicAcls": true,
      "IgnorePublicAcls": true,
      "BlockPublicPolicy": true,
      "RestrictPublicBuckets": true
    }'

  echo -e "${GREEN}  ✓ Bucket '$STATE_BUCKET' created with versioning and encryption enabled.${NC}"
fi

echo ""

# ─── Create DynamoDB Lock Table ────────────────────────────────────────────────

echo -e "${YELLOW}[2/2] Checking DynamoDB lock table...${NC}"

if aws dynamodb describe-table --table-name "$LOCK_TABLE" --region "$REGION" &> /dev/null; then
  echo -e "${GREEN}  ✓ Table '$LOCK_TABLE' already exists. Skipping creation.${NC}"
else
  echo "  Creating table: $LOCK_TABLE"

  aws dynamodb create-table \
    --table-name "$LOCK_TABLE" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION" \
    --tags \
      Key=Project,Value=nettribe \
      Key=ManagedBy,Value=bootstrap-script \
      Key=Purpose,Value=terraform-state-locking

  echo "  Waiting for table to become active..."
  aws dynamodb wait table-exists --table-name "$LOCK_TABLE" --region "$REGION"

  echo -e "${GREEN}  ✓ Table '$LOCK_TABLE' created successfully.${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Bootstrap complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Next steps:"
echo "    1. Deploy Amplify backend: npx ampx pipeline-deploy"
echo "    2. Extract outputs: ./scripts/extract-amplify-outputs.sh"
echo "    3. Initialize Terraform: cd infra && terraform init"
echo "    4. Or run the full deployment: ./scripts/deploy.sh dev"
