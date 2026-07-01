#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# Net Tribe Carbon — Task Automation Runner
# Runs all automation tasks: docs, cleanup, and API scaffolding
# ─────────────────────────────────────────────────────────────────

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Net Tribe Carbon — Task Automation      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 24 ]; then
  echo -e "${RED}Error: Node.js >= 24 required (found v${NODE_VERSION})${NC}"
  exit 1
fi

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
fi

# ─── Documentation Generation ──────────────────────────────────
echo ""
echo -e "${GREEN}[1/5] Generating API documentation...${NC}"
npm run automate -- docs:api
echo -e "${GREEN}  ✓ API docs generated${NC}"

echo ""
echo -e "${GREEN}[2/5] Generating component documentation...${NC}"
npm run automate -- docs:components
echo -e "${GREEN}  ✓ Component docs generated${NC}"

# ─── Code Cleanup ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}[3/5] Formatting code...${NC}"
npm run automate -- clean:format
echo -e "${GREEN}  ✓ Code formatted${NC}"

echo ""
echo -e "${GREEN}[4/5] Linting and auto-fixing...${NC}"
npm run automate -- clean:lint || {
  echo -e "${YELLOW}  ⚠ Some lint issues remain (manual fix required)${NC}"
}

# ─── API Scaffolding ───────────────────────────────────────────
echo ""
echo -e "${GREEN}[5/5] Scaffolding GraphQL hooks...${NC}"
npm run automate -- scaffold:graphql
echo -e "${GREEN}  ✓ GraphQL hooks generated${NC}"

# ─── Summary ───────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   All automation tasks completed!         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "Generated outputs:"
echo "  • docs/api/          — API documentation"
echo "  • docs/components/   — Component documentation"
echo "  • src/hooks/generated/ — GraphQL CRUD hooks"
echo ""
