#!/usr/bin/env bash
###############################################################################
# plan.sh — Run terraform plan for a specific environment
#
# Usage:
#   ./infra/scripts/plan.sh <environment>
#
# Examples:
#   ./infra/scripts/plan.sh dev
#   ./infra/scripts/plan.sh staging
#   ./infra/scripts/plan.sh prod
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
  echo "  $0 dev"
  echo "  $0 staging"
  echo "  $0 prod"
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
echo "  Terraform Plan — Environment: ${ENV}"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Initialize with environment-specific backend key
echo "→ Initializing Terraform with backend key: infra/${ENV}/terraform.tfstate"
terraform -chdir="$INFRA_DIR" init \
  -backend-config="key=infra/${ENV}/terraform.tfstate" \
  -reconfigure

echo ""
echo "→ Running terraform plan..."
terraform -chdir="$INFRA_DIR" plan \
  -var-file="environments/${ENV}.tfvars" \
  -out="${ENV}.tfplan"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Plan complete. Review the output above."
echo "  To apply: ./infra/scripts/apply.sh ${ENV}"
echo "═══════════════════════════════════════════════════════════"
