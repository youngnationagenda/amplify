#!/usr/bin/env bash
#
# check-secrets.sh
# Scans staged files for accidental secret commits.
# Exits with code 1 if potential secrets are detected.

set -euo pipefail

RED='\033[0;31m'
NC='\033[0m' # No Color

SECRETS_FOUND=0

# Get list of staged files (added, copied, modified, renamed)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# 1. Check filenames for sensitive patterns
FILENAME_PATTERNS=(
  '\.env$'
  '\.env\.'
  '\.tfvars$'
  '\.pem$'
  'amplify_outputs\.json$'
)

for file in $STAGED_FILES; do
  for pattern in "${FILENAME_PATTERNS[@]}"; do
    if echo "$file" | grep -qE "$pattern"; then
      # Allow .env.example and .tfvars.example files
      if echo "$file" | grep -qE '\.example$'; then
        continue
      fi
      echo -e "${RED}ERROR: Potentially sensitive file staged for commit: ${file}${NC}"
      SECRETS_FOUND=1
    fi
  done
done

# 2. Check file contents for common secret patterns
CONTENT_PATTERNS=(
  'PRIVATE_KEY='
  'aws_secret_access_key'
  'AWS_SECRET_ACCESS_KEY'
  'aws_access_key_id'
  'AWS_ACCESS_KEY_ID'
  'CELO_PRIVATE_KEY='
  'GEMINI_API_KEY='
  '-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----'
  'sk-[a-zA-Z0-9]{20,}'
)

for file in $STAGED_FILES; do
  # Skip binary files and deleted files
  if ! git show ":$file" > /dev/null 2>&1; then
    continue
  fi

  for pattern in "${CONTENT_PATTERNS[@]}"; do
    if git show ":$file" | grep -qE "$pattern" 2>/dev/null; then
      echo -e "${RED}ERROR: Secret pattern detected in ${file}: ${pattern}${NC}"
      SECRETS_FOUND=1
      break
    fi
  done
done

if [ "$SECRETS_FOUND" -eq 1 ]; then
  echo ""
  echo -e "${RED}Commit blocked: Potential secrets detected in staged files.${NC}"
  echo "If these are intentional (e.g., example files), use 'git commit --no-verify' to bypass."
  exit 1
fi

exit 0
