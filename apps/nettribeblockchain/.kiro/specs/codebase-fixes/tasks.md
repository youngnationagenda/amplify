# Implementation Plan: Codebase Fixes

## Overview

This plan addresses 11 requirements for fixing and standardizing the NetTribe Uniswap V3 deployment toolkit. Tasks are ordered to minimize conflicts: security fix first (no code dependencies), then ESM conversion, then script fixes, then documentation and cleanup.

## Tasks

- [x] 1. Protect private keys from version control (Requirement 3)
  - [x] 1.1 Add .env exclusion rules to .gitignore and create .env.example
    - Append `.env` and `.env.*` patterns to the end of `.gitignore`
    - Create `.env.example` with all environment variable names from `.env`, replacing private keys with `your_private_key_here` and keeping non-secret values (RPC URLs, contract addresses, chain IDs, token addresses, pool params) intact
    - Add a header comment in `.env.example` instructing developers to copy it to `.env` and fill in secrets
    - Run `git rm --cached .env` to untrack the file while preserving it on disk
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. Rename contract file and create test (Requirements 9, 8)
  - [x] 2.1 Rename Lock.sol to SimpleStorage.sol
    - Rename `contracts/Lock.sol` to `contracts/SimpleStorage.sol` (file content already defines `SimpleStorage` contract)
    - Search all `.js`, `.mjs`, `.sh`, `.yml`, and `.json` files for references to `Lock.sol` and update to `SimpleStorage.sol`
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 2.2 Create SimpleStorage.test.js replacing empty MyContract.test.js
    - Delete `test/MyContract.test.js`
    - Create `test/SimpleStorage.test.js` with a `describe("SimpleStorage")` block
    - Include an `it("should store and retrieve a value")` test that deploys SimpleStorage, calls `store(42)`, and asserts `retrieve()` returns `42n`
    - Use ESM imports: `import hre from "hardhat"` and `import { expect } from "chai"`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [~] 3. Checkpoint - Ensure contract compiles and test structure is valid
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Convert CommonJS scripts to ESM and fix imports (Requirements 1, 2, 11)
  - [~] 4.1 Convert deploy-nfpm.js to ESM with correct imports
    - Replace `const hre = require("hardhat")` with `import hre from "hardhat"`
    - Replace `const { ... } = require("./utils/uniswap.js")` with ESM named imports
    - Import list: `deployArtifact, encodeBytes32String, getArgOrEnv, getConnectedEthers, loadArtifact, parseAddress, parseArgs, requireValue`
    - Remove unused imports: `encodeSqrtPriceX96`, `parseBigInt`, `sortTokenPair`
    - Ensure `deployArtifact` is included (currently missing, causes ReferenceError)
    - Ensure `encodeBytes32String` is included (used in script body)
    - _Requirements: 1.1, 1.2, 1.6, 1.7, 2.3_

  - [~] 4.2 Convert deploy-router.js to ESM with correct imports
    - Replace `const hre = require("hardhat")` with `import hre from "hardhat"`
    - Replace `const { ... } = require("./utils/uniswap.js")` with ESM named imports
    - Import list: `deployArtifact, getArgOrEnv, getConnectedEthers, loadArtifact, parseAddress, parseArgs, requireValue`
    - Remove unused imports: `encodeSqrtPriceX96`, `parseBigInt`, `sortTokenPair`
    - Add missing `deployArtifact` import
    - _Requirements: 1.1, 1.3, 1.6, 1.7, 2.1, 11.1, 11.3_

  - [~] 4.3 Convert deploy-quoter-v2.js to ESM with correct imports
    - Replace `const hre = require("hardhat")` with `import hre from "hardhat"`
    - Replace `const { ... } = require("./utils/uniswap.js")` with ESM named imports
    - Import list: `deployArtifact, getArgOrEnv, getConnectedEthers, loadArtifact, parseAddress, parseArgs, requireValue`
    - Remove unused imports: `encodeSqrtPriceX96`, `parseBigInt`, `sortTokenPair`
    - Add missing `deployArtifact` import
    - _Requirements: 1.1, 1.4, 1.6, 1.7, 2.2, 11.2, 11.3_

  - [~] 4.4 Convert deploy-factory-local.js to ESM
    - Replace `const hre = require("hardhat")` with `import hre from "hardhat"`
    - Update script to use `getConnectedEthers(hre)` pattern instead of `hre.ethers.getContractFactory`
    - _Requirements: 1.1, 1.5, 1.6_

- [ ] 5. Fix deploy-all.js constructor arguments, artifact path, and HRE usage (Requirements 5, 6, 10)
  - [~] 5.1 Refactor deploy-all.js to use HRE and fix constructor args
    - Remove direct `ethers.Wallet` and `ethers.JsonRpcProvider` instantiation
    - Import `hre` from `"hardhat"` and use `getConnectedEthers(hre)` + `getSigners()` for signer
    - Import `deployArtifact`, `getConnectedEthers`, `parseAddress`, `requireValue`, `getArgOrEnv`, `parseArgs` from utility library
    - Read factory, wrappedNative, and positionDescriptor addresses from env/args using `getArgOrEnv` + `requireValue` + `parseAddress`
    - Pass constructor args: NFPM `[factory, wrappedNative, positionDescriptor]`, QuoterV2 `[factory, wrappedNative]`, SwapRouter `[factory, wrappedNative]`
    - Fix QuoterV2 artifact path from `"QuoterV2.sol/QuoterV2.json"` to `"lens/QuoterV2.sol/QuoterV2.json"`
    - Validate all required addresses before deployment; terminate with descriptive error if missing/invalid
    - Log deployed address for each contract on success
    - Remove unused `parseBigInt` import
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 10.1, 10.2, 10.3, 10.5_

- [ ] 6. Standardize deploy-periphery.js to use HRE (Requirement 10)
  - [~] 6.1 Refactor deploy-periphery.js to use getConnectedEthers(hre)
    - Replace `import { ethers } from "ethers"` with `import hre from "hardhat"`
    - Use `const ethers = await getConnectedEthers(hre)` and `const [signer] = await ethers.getSigners()` instead of direct `ethers.Wallet`/`JsonRpcProvider`
    - Import `getConnectedEthers` and `deployArtifact` from utility library
    - Remove direct `new ethers.JsonRpcProvider(...)` and `new ethers.Wallet(...)` calls
    - Remove unused imports: `parseBigInt`, `sortTokenPair`
    - Keep existing deployment logic (already passes correct constructor args) but use `deployArtifact` or ethers from HRE for contract factories
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [~] 7. Checkpoint - Ensure all converted scripts have valid ESM syntax
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Reconcile factory address in celo-sepolia-addresses.json (Requirement 4)
  - [x] 8.1 Update celo-sepolia-addresses.json to match deployed-addresses.json
    - Update `uniswap.factoryV3` from `0x9406cc6185a346906296840746125a0e44976454` to `0xE0af690969AFff1A07b23555a6B7C716395Af80D`
    - Update `uniswap.wrappedNativeToken` to `0x2cE73DC897A3E10b3FF3F86470847c36ddB735cf`
    - Update `uniswap.nftDescriptor` to `0x361bC5feF1984A3b29783be55245ce62Df4eECc5`
    - Update `uniswap.positionDescriptor` to `0x97BF8815406d46DB826f01e79Fb10d2eEb6eb424`
    - Update `uniswap.nonfungiblePositionManager` to `0xCdBa728Aec5800822e6d111216cfEDd30cF8Bcf0`
    - Update `uniswap.swapRouter` to `0xb079af89E162c14C1A824Ac728c14299E7d29bd4`
    - Update `uniswap.quoterV2` to `0xb0aa9aE7eE99B98a5c8c48C3d53C7222cf991931`
    - Ensure all addresses use EIP-55 checksummed format
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 9. Correct README file extension references (Requirement 7)
  - [x] 9.1 Fix .mjs references to .js in README.md
    - Replace `deploy-periphery.mjs` with `deploy-periphery.js`
    - Replace `deploy-nfpm.mjs` with `deploy-nfpm.js`
    - Replace `deploy-router.mjs` with `deploy-router.js`
    - Replace `deploy-quoter-v2.mjs` with `deploy-quoter-v2.js`
    - Replace `create-pool.mjs` with `create-pool.js`
    - Replace `mint-liquidity.mjs` with `mint-liquidity.js`
    - Preserve `deploy-factory.mjs` reference (legitimate .mjs file)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [~] 10. Final checkpoint - Ensure all changes are consistent
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks are ordered to minimize conflicts: .gitignore/.env first (no code deps), then contract rename/test, then ESM conversion, then script logic fixes, then data files and docs
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The design has no Correctness Properties section, so property-based tests are not applicable to this feature
- All scripts use JavaScript (ESM) as dictated by `"type": "module"` in package.json

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "8.1", "9.1"] },
    { "id": 1, "tasks": ["2.2", "4.1", "4.2", "4.3", "4.4"] },
    { "id": 2, "tasks": ["5.1", "6.1"] }
  ]
}
```
