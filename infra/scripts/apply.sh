#!/usr/bin/env bash
###############################################################################
# apply.sh — Run terraform apply for a specific environment
#
# Usage:
#   ./infra/scripts/apply.sh <environment>
#
# Examples:
#   ./infra/scripts/apply.sh dev
#   ./infra/scripts/apply.sh staging
#   ./infra/scripts/apply.sh prod
#
# Notes:
#   - For dev and staging: applies automatically with -auto-approve
#   - For prod: requires manual confirmation (interactive prompt)
###############################################################################

set -euo pipefail

VALID_ENVS=("dev" "staging" "prod")
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

usage() {
  echo "Usage: $0 <environment>"
  echo ""
  echo "Available environments: ${VALID_ENVS[*]}"
  echo ""
  echo "Examples:"
  echo "  $0 dev        # Auto-approve"
  echo "  $0 staging    # Auto-approve"
  echo "  $0 prod       # Requires manual confirmation"
  exit 1
}

# Validate arguments
if [[ $# -lt 1 ]]; then
  echo "Error: Missing environment argument."
  usage
fi

ENV="$1"

# Validate environment name
VALID=false
for valid_env in "${VALID_ENVS[@]}"; do
  if [[ "$ENV" == "$valid_env" ]]; then
    VALID=true
    break
  fi
done

if [[ "$VALID" == "false" ]]; then
  echo "Error: Invalid environment '${ENV}'."
  echo "Valid environments: ${VALID_ENVS[*]}"
  exit 1
fi

TFVARS_FILE="${INFRA_DIR}/environments/${ENV}.tfvars"

# Verify tfvars file exists
if [[ ! -f "$TFVARS_FILE" ]]; then
  echo "Error: Variable file not found: ${TFVARS_FILE}"
  echo "Please create it from the example: cp ${TFVARS_FILE}.example ${TFVARS_FILE}"
  exit 1
fi

echo "═══════════════════════════════════════════════════════════"
echo "  Terraform Apply — Environment: ${ENV}"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Initialize with environment-specific backend key
echo "→ Initializing Terraform with backend key: infra/${ENV}/terraform.tfstate"
terraform -chdir="$INFRA_DIR" init \
  -backend-config="key=infra/${ENV}/terraform.tfstate" \
  -reconfigure

echo ""

# Production requires manual confirmation
if [[ "$ENV" == "prod" ]]; then
  echo "╔═══════════════════════════════════════════════════════════╗"
  echo "║  ⚠  PRODUCTION DEPLOYMENT — Manual confirmation required  ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  echo ""
  echo "→ Running terraform plan first..."
  terraform -chdir="$INFRA_DIR" plan \
    -var-file="environments/${ENV}.tfvars"

  echo ""
  echo "───────────────────────────────────────────────────────────"
  read -r -p "  Apply these changes to PRODUCTION? (yes/no): " CONFIRM
  echo "───────────────────────────────────────────────────────────"

  if [[ "$CONFIRM" != "yes" ]]; then
    echo ""
    echo "  Aborted. No changes applied to production."
    exit 0
  fi

  echo ""
  echo "→ Applying to production..."
  terraform -chdir="$INFRA_DIR" apply \
    -var-file="environments/${ENV}.tfvars"
else
  echo "→ Applying with auto-approve (${ENV} environment)..."
  terraform -chdir="$INFRA_DIR" apply \
    -var-file="environments/${ENV}.tfvars" \
    -auto-approve
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Apply complete for environment: ${ENV}"
echo "═══════════════════════════════════════════════════════════"
