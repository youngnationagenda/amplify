# Technical Design Document: Codebase Fixes

## Overview

This design addresses 11 requirements for fixing and standardizing the NetTribe Uniswap V3 deployment toolkit on Celo Sepolia. The project uses Hardhat 3 with ESM modules, ethers v6, and artifact-based deployment for Uniswap V3 periphery contracts. The fixes span module system consistency, security practices, deployment correctness, documentation accuracy, and code quality.

The changes are primarily refactoring and correction work — no new user-facing features are introduced. The goal is to bring the codebase to a consistent, correct, and secure state so that all scripts execute without errors and follow a uniform coding standard.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Module system | ESM with `import`/`export` | `package.json` declares `"type": "module"`, so all `.js` files must use ESM |
| Signer acquisition | `hre.network.connect()` → `ethers.getSigners()` | Centralizes network config in `hardhat.config.js`; avoids hardcoded private key usage in scripts |
| Address source of truth | `deployed-addresses.json` | Already used by `deploy-periphery.js` to persist addresses; other files sync from it |
| Test framework | `@nomicfoundation/hardhat-chai-matchers` | Already in `devDependencies`; provides `expect` and contract testing helpers |
| Artifact loading | `loadArtifact()` from utility library | Abstracts `createRequire` path resolution; consistent across all scripts |

## Architecture

The toolkit follows a simple script-based architecture where each deployment script is an independent entry point executed via Hardhat CLI:

```mermaid
graph TD
    A[hardhat.config.js] -->|provides hre| B[Deployment Scripts]
    B --> C[scripts/utils/uniswap.js]
    C -->|loadArtifact| D[node_modules/@uniswap/v3-periphery/artifacts]
    C -->|deployArtifact| E[Celo Sepolia Network]
    B -->|writes| F[deployed-addresses.json]
    F -->|syncs to| G[celo-sepolia-addresses.json]
    F -->|syncs to| H[.env]
    
    subgraph Scripts
        B1[deploy-periphery.js]
        B2[deploy-nfpm.js]
        B3[deploy-router.js]
        B4[deploy-quoter-v2.js]
        B5[deploy-all.js]
        B6[deploy-factory-local.js]
        B7[deploy-factory.mjs]
    end
    
    B --> B1
    B --> B2
    B --> B3
    B --> B4
    B --> B5
    B --> B6
    B --> B7
```

### Post-Fix Architecture Principles

1. **ESM Everywhere**: All `.js` files use `import`/`export` syntax. Only `deploy-factory.mjs` retains its `.mjs` extension (it already uses ESM).
2. **HRE-First**: Scripts obtain signers and providers exclusively through the Hardhat Runtime Environment — no direct `ethers.Wallet` or `ethers.JsonRpcProvider` instantiation.
3. **Single Address Authority**: `deployed-addresses.json` is the canonical record of deployed addresses. Other stores (`celo-sepolia-addresses.json`, `.env`) are synchronized derivatives.
4. **Utility Library as Facade**: `scripts/utils/uniswap.js` provides all shared functions (argument parsing, artifact loading, deployment, address parsing). Scripts import only what they use.

## Components and Interfaces

### 1. Utility Library (`scripts/utils/uniswap.js`)

**Status**: Already ESM. No changes required.

**Exported Functions Used by Fix Targets**:
- `parseArgs()` — CLI argument parser
- `getArgOrEnv(args, key, envName, fallback)` — argument/env resolution
- `requireValue(value, message)` — null/empty check
- `loadArtifact(group, relativePath)` — loads contract JSON artifact from node_modules
- `deployArtifact(hre, artifact, constructorArgs, libraries)` — deploys contract from artifact
- `getConnectedEthers(hre)` — returns ethers instance from HRE network connection
- `parseAddress(hre, value, label)` — validates and checksums an Ethereum address
- `parseBigInt(value, label)` — parses a bigint value
- `encodeBytes32String(hre, value)` — encodes a string to bytes32
- `encodeSqrtPriceX96({...})` — computes sqrt price for Uniswap pool
- `sortTokenPair(hre, tokenA, tokenB)` — sorts token pair by address
- `linkBytecode(artifact, libraries)` — links library references in bytecode

### 2. Scripts Requiring ESM Conversion

| Script | Current Issues | Fix |
|--------|---------------|-----|
| `deploy-nfpm.js` | Uses `require()`, missing `deployArtifact` import | Convert to ESM, add `deployArtifact` and `encodeBytes32String` to imports |
| `deploy-router.js` | Uses `require()`, unused imports, missing `deployArtifact` | Convert to ESM, trim imports to used set + `deployArtifact` |
| `deploy-quoter-v2.js` | Uses `require()`, unused imports, missing `deployArtifact` | Convert to ESM, trim imports to used set + `deployArtifact` |
| `deploy-factory-local.js` | Uses `require()` | Convert to ESM, use `getConnectedEthers(hre)` pattern |

### 3. `deploy-all.js` Fixes

**Current Issues**:
- Instantiates `ethers.Wallet` and `ethers.JsonRpcProvider` directly
- Passes no constructor arguments to NFPM, QuoterV2, or SwapRouter
- Uses wrong artifact path for QuoterV2 (`QuoterV2.sol/QuoterV2.json` instead of `lens/QuoterV2.sol/QuoterV2.json`)

**Fix Design**:
- Replace direct ethers usage with `getConnectedEthers(hre)` + `getSigners()`
- Pass correct constructor arguments:
  - NFPM: `[factory, wrappedNative, positionDescriptor]`
  - QuoterV2: `[factory, wrappedNative]`
  - SwapRouter: `[factory, wrappedNative]`
- Fix QuoterV2 artifact path to `lens/QuoterV2.sol/QuoterV2.json`
- Add address validation before deployment

### 4. `deploy-periphery.js` Standardization

**Current Issues**:
- Instantiates `ethers.Wallet` and `ethers.JsonRpcProvider` directly
- Imports unused functions (`parseBigInt`, `sortTokenPair`)

**Fix Design**:
- Accept `hre` from Hardhat CLI and use `getConnectedEthers(hre)` for signers
- Remove unused imports
- Keep existing deployment logic (it already passes correct constructor args)

### 5. Security: `.env` and Private Key Protection

**Changes**:
- Add `.env` and `.env.*` patterns to `.gitignore`
- Create `.env.example` with placeholder values for secrets
- Remove `.env` from Git index (`git rm --cached .env`)

### 6. Address Registry Reconciliation

**Current State**:
- `deployed-addresses.json` factory: `0xE0af690969AFff1A07b23555a6B7C716395Af80D`
- `celo-sepolia-addresses.json` factoryV3: `0x9406cc6185a346906296840746125a0e44976454`
- `.env` UNISWAP_V3_FACTORY: `0xE0af690969AFff1A07b23555a6B7C716395Af80D`

**Fix**: Align `celo-sepolia-addresses.json` to match `deployed-addresses.json` (the authoritative source) for all Uniswap contract addresses. The `.env` already has the correct factory address.

### 7. Contract Rename and Test File

- Rename `contracts/Lock.sol` → `contracts/SimpleStorage.sol` (contents already define `SimpleStorage`)
- Replace empty `test/MyContract.test.js` with `test/SimpleStorage.test.js` containing a meaningful test

### 8. README Corrections

- Replace `.mjs` references with `.js` for scripts that are actually `.js` files
- Preserve `.mjs` for `deploy-factory.mjs` which legitimately uses that extension

## Data Models

### Address Registry Structure

**`deployed-addresses.json`** (authoritative):
```json
{
  "factory": "<EIP-55 checksummed address>",
  "wrappedNative": "<EIP-55 checksummed address>",
  "nftDescriptor": "<EIP-55 checksummed address>",
  "positionDescriptor": "<EIP-55 checksummed address>",
  "nfpm": "<EIP-55 checksummed address>",
  "swapRouter": "<EIP-55 checksummed address>",
  "quoterV2": "<EIP-55 checksummed address>"
}
```

**`celo-sepolia-addresses.json`** (derivative):
```json
{
  "network": { /* unchanged */ },
  "uniswap": {
    "factoryV3": "<matches deployed-addresses.json factory>",
    "wrappedNativeToken": "<matches deployed-addresses.json wrappedNative>",
    "nftDescriptor": "<matches deployed-addresses.json nftDescriptor>",
    "positionDescriptor": "<matches deployed-addresses.json positionDescriptor>",
    "nonfungiblePositionManager": "<matches deployed-addresses.json nfpm>",
    "swapRouter": "<matches deployed-addresses.json swapRouter>",
    "quoterV2": "<matches deployed-addresses.json quoterV2>"
  },
  "tokens": { /* unchanged */ }
}
```

**`.env`** (derivative, relevant fields):
```
UNISWAP_V3_FACTORY=<matches deployed-addresses.json factory>
UNISWAP_NFT_DESCRIPTOR=<matches deployed-addresses.json nftDescriptor>
UNISWAP_POSITION_DESCRIPTOR=<matches deployed-addresses.json positionDescriptor>
UNISWAP_NFPM_ADDRESS=<matches deployed-addresses.json nfpm>
UNISWAP_SWAP_ROUTER=<matches deployed-addresses.json swapRouter>
UNISWAP_QUOTER_V2=<matches deployed-addresses.json quoterV2>
```

### `.env.example` Template

```
# Network
CELO_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
CHAIN_ID=11142220

# Deployer credentials (REPLACE with your own)
PRIVATE_KEY=your_private_key_here
DEPLOYER_ADDRESS=your_deployer_address_here

# Uniswap V3 deployed contracts
UNISWAP_V3_FACTORY=0xE0af690969AFff1A07b23555a6B7C716395Af80D
WRAPPED_NATIVE_TOKEN=0x2cE73DC897A3E10b3FF3F86470847c36ddB735cf
NATIVE_CURRENCY_LABEL=CELO

# Token addresses
TOKEN_NTC=0xde6dbd244fbe84141a97dde4043029d9c61767ae
TOKEN_NTEV=0xcdb1d119eda8f7a04a820b5002ef2ea8b189bb18
TOKEN_USDC=0x01c5c0122039549ad1493b8220cabedd739bc44e
```

### ESM Import Pattern (Target State for Converted Scripts)

```javascript
import hre from "hardhat";
import {
  getArgOrEnv,
  getConnectedEthers,
  loadArtifact,
  parseAddress,
  parseArgs,
  requireValue,
  deployArtifact
} from "./utils/uniswap.js";
```

### SimpleStorage Test Structure

```javascript
import hre from "hardhat";
import { expect } from "chai";

describe("SimpleStorage", function () {
  it("should store and retrieve a value", async function () {
    const ethers = (await hre.network.connect()).ethers;
    const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    const storage = await SimpleStorage.deploy();
    await storage.waitForDeployment();

    await storage.store(42);
    expect(await storage.retrieve()).to.equal(42n);
  });
});
```

## Correctness Properties

**Property-based testing is NOT applicable to this feature.**

This feature consists of:
- Module system conversion (static refactoring)
- Import fixes (code organization)
- Security configuration (.gitignore, .env management)
- Data file reconciliation (address consistency)
- Documentation corrections (README text)
- File renaming (code organization)
- Constructor argument fixes (deployment wiring)

None of these create or modify pure functions with meaningful input variation. The acceptance criteria are verifiable through static analysis (grep/lint), smoke tests (file existence/content checks), and integration tests (running scripts and verifying output). There are no universal properties that hold "for all inputs" — the changes are about bringing a finite set of files into a correct, consistent state.

## Error Handling

### Script Execution Errors

| Error Condition | Handling Strategy |
|----------------|-------------------|
| Script run outside Hardhat CLI (`node scripts/deploy-x.js` directly) | Scripts import `hre` from `"hardhat"` — if not run via Hardhat CLI, the import fails with a clear error. The `hardhat` package throws: "This script must be run through Hardhat" |
| Missing required address (factory, wrappedNative, positionDescriptor) | `requireValue()` throws with a descriptive message before any deployment transaction is attempted |
| Invalid Ethereum address format | `parseAddress()` (wrapping ethers `getAddress()`) throws with the invalid value and label |
| Artifact not found (invalid path or missing package) | `loadArtifact()` uses `createRequire` which throws a standard Node.js MODULE_NOT_FOUND error with the attempted path |
| Library linking failure (missing library address for linked bytecode) | `linkBytecode()` throws identifying the missing library |
| Deployment transaction failure (revert, out of gas, nonce issues) | ethers throws at `factory.deploy()` or `waitForDeployment()` — caught by top-level `.catch()` which logs and exits with code 1 |

### Git Operations (Requirement 3)

| Error Condition | Handling Strategy |
|----------------|-------------------|
| `.env` not tracked (already untracked) | `git rm --cached .env` will report "did not match any files" — this is acceptable and non-fatal |
| `.env.example` already exists | Overwrite with correct content — idempotent operation |

### Address Reconciliation (Requirement 4)

| Error Condition | Handling Strategy |
|----------------|-------------------|
| Addresses don't match across files | Report mismatch with file name, field name, expected value, and actual value. This is informational — the fix script updates the files to match |
| Address fails EIP-55 validation | `getAddress()` throws — fix by re-checksumming with ethers before writing |

### Test Execution (Requirement 8)

| Error Condition | Handling Strategy |
|----------------|-------------------|
| SimpleStorage contract fails to compile | `hardhat test` reports compilation error before running tests |
| SimpleStorage fails to deploy in test | Test framework catches the deployment revert and reports test failure with deployment error details |
| Assertion failure (retrieve returns wrong value) | Chai/expect reports expected vs actual with diff |

## Testing Strategy

### Approach

Since this feature is primarily refactoring and correctness fixes (not new business logic), the testing strategy emphasizes:

1. **Static Analysis / Lint Checks** — Verify code patterns (no `require()`, no unused imports, no private keys in tracked files)
2. **Smoke Tests** — Verify file existence, content structure, and configuration correctness
3. **Integration Tests** — Verify scripts execute successfully end-to-end
4. **Unit Tests** — One meaningful test for the SimpleStorage contract

### Test Categories

#### 1. Static Analysis Tests (Automated Checks)

These verify the codebase meets structural requirements without executing scripts:

| Check | Target Files | Validation |
|-------|-------------|------------|
| No `require()` in scripts | `scripts/*.js` | Grep for `require(` — should return 0 matches |
| No `module.exports` in scripts | `scripts/*.js` | Grep for `module.exports` — should return 0 matches |
| No `__dirname`/`__filename` | `scripts/*.js` | Grep for `__dirname\|__filename` — should return 0 matches |
| No `ethers.Wallet` in deploy scripts | `scripts/deploy-*.js` | Grep for `new ethers.Wallet` — should return 0 matches |
| No `ethers.JsonRpcProvider` in deploy scripts | `scripts/deploy-*.js` | Grep for `new ethers.JsonRpcProvider` — should return 0 matches |
| No private keys in tracked files | All tracked files | Grep for 64-char hex strings — should return 0 matches (excluding .env which is untracked) |
| `.env` not in git index | `.env` | `git ls-files .env` returns empty |
| `.gitignore` includes `.env` | `.gitignore` | File contains `.env` pattern |
| No unused imports in deploy-router.js | `scripts/deploy-router.js` | Import list matches: `deployArtifact, getArgOrEnv, getConnectedEthers, loadArtifact, parseAddress, parseArgs, requireValue` |
| No unused imports in deploy-quoter-v2.js | `scripts/deploy-quoter-v2.js` | Import list matches same set as deploy-router.js |
| README uses .js extensions | `README.md` | References to deploy-nfpm, deploy-router, deploy-quoter-v2 use .js not .mjs |
| README preserves .mjs for factory | `README.md` | deploy-factory.mjs reference preserved |
| Contract file renamed | `contracts/` | `SimpleStorage.sol` exists, `Lock.sol` does not |
| No references to Lock.sol | All files | Grep for "Lock.sol" returns 0 matches |

#### 2. Address Consistency Tests

| Check | Validation |
|-------|------------|
| Factory address matches across files | `deployed-addresses.json.factory` == `celo-sepolia-addresses.json.uniswap.factoryV3` == `.env UNISWAP_V3_FACTORY` |
| All addresses are EIP-55 checksummed | Each address passes `ethers.getAddress(addr) === addr` |
| QuoterV2 artifact path is correct | `deploy-all.js` calls `loadArtifact("periphery", "lens/QuoterV2.sol/QuoterV2.json")` |

#### 3. Integration Tests (Require Hardhat Environment)

| Test | Validation |
|------|------------|
| `hardhat compile` succeeds | Exit code 0, no errors for `contracts/SimpleStorage.sol` |
| `hardhat test` passes | SimpleStorage.test.js store/retrieve test passes |
| Scripts parse without errors | Each converted script can be imported without syntax errors (ESM validation) |

#### 4. Unit Test: SimpleStorage Contract

A single `describe`/`it` block that:
1. Deploys `SimpleStorage`
2. Calls `store(42)`
3. Asserts `retrieve()` returns `42`

This validates both the contract and the test infrastructure (Hardhat 3 + chai matchers).

### Why Property-Based Testing Does Not Apply

Property-based testing is not appropriate for this feature because:

- **No pure functions with varying inputs** are being created or modified. The utility library (`scripts/utils/uniswap.js`) already exists and is not being changed.
- **The requirements are about code structure and configuration**, not algorithmic behavior. "All scripts use ESM" is a static property of the source code, not a runtime property of program execution.
- **The input space is finite and small** — there are exactly 7 scripts to convert, 3 JSON files to reconcile, and 1 test to write.
- **Side-effect-heavy operations** — deployment scripts interact with blockchain nodes; their correctness depends on external state, not input variation.

The appropriate testing tools are static analysis (grep, AST parsing), smoke tests (file checks), and integration tests (run scripts end-to-end).

