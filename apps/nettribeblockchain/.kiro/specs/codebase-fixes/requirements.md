# Requirements Document

## Introduction

This specification covers critical, moderate, and minor fixes to the NetTribe Uniswap V3 deployment toolkit on Celo Sepolia. The project uses Hardhat 3 with ESM modules, ethers v6, and artifact-based deployment scripts for Uniswap V3 periphery contracts. Multiple issues have been identified across module system consistency, security practices, deployment correctness, documentation accuracy, and code quality. This document defines the requirements for resolving all identified issues.

## Glossary

- **Deployment_Toolkit**: The collection of Hardhat scripts, configuration, and utilities that deploy and manage Uniswap V3 contracts on Celo Sepolia
- **Script_Module_System**: The JavaScript module format (ESM or CommonJS) used by deployment scripts in the project
- **Utility_Library**: The shared module at scripts/utils/uniswap.js that exports helper functions for deployment scripts
- **Address_Registry**: The JSON files (deployed-addresses.json, celo-sepolia-addresses.json) and .env variables that record deployed contract addresses
- **Deploy_All_Script**: The scripts/deploy-all.js file that deploys NFPM, QuoterV2, and SwapRouter in a single execution
- **Gitignore_Configuration**: The .gitignore file that controls which files are excluded from version control
- **Contract_File**: A Solidity source file in the contracts/ directory
- **Test_Suite**: The test files in the test/ directory that validate contract behavior
- **README_Documentation**: The README.md file documenting project usage and commands
- **Hardhat_Runtime_Environment**: The hre object provided by Hardhat 3 that gives access to network connections, ethers, and signers

## Requirements

### Requirement 1: Convert CommonJS Scripts to ESM

**User Story:** As a developer, I want all deployment scripts to use ES module syntax, so that the scripts execute without runtime errors in the ESM-configured project.

#### Acceptance Criteria

1. WHILE the project package.json declares "type": "module", THE Script_Module_System SHALL use ES module import/export syntax (no require() or module.exports statements) in all JavaScript files under the scripts/ directory including subdirectories
2. WHEN scripts/deploy-nfpm.js is executed via `hardhat run`, THE Script_Module_System SHALL complete execution with exit code 0 and without ERR_REQUIRE_ESM or ERR_MODULE_NOT_FOUND errors
3. WHEN scripts/deploy-router.js is executed via `hardhat run`, THE Script_Module_System SHALL complete execution with exit code 0 and without ERR_REQUIRE_ESM or ERR_MODULE_NOT_FOUND errors
4. WHEN scripts/deploy-quoter-v2.js is executed via `hardhat run`, THE Script_Module_System SHALL complete execution with exit code 0 and without ERR_REQUIRE_ESM or ERR_MODULE_NOT_FOUND errors
5. WHEN scripts/deploy-factory-local.js is executed via `hardhat run`, THE Script_Module_System SHALL complete execution with exit code 0 and without ERR_REQUIRE_ESM or ERR_MODULE_NOT_FOUND errors
6. IF a JavaScript file under scripts/ contains a CommonJS require() call for a local module or hardhat import, THEN THE Script_Module_System SHALL replace it with an equivalent ESM import statement that resolves the same bindings
7. WHEN any converted script imports from scripts/utils/uniswap.js, THE Script_Module_System SHALL use named ESM imports matching the exported function names (parseArgs, getArgOrEnv, requireValue, loadArtifact, deployArtifact, getConnectedEthers, parseAddress, parseBigInt, sortTokenPair, encodeSqrtPriceX96, encodeBytes32String)
8. IF a converted script references CommonJS-only globals (__dirname, __filename), THEN THE Script_Module_System SHALL replace them with ESM equivalents using import.meta.url

### Requirement 2: Add Missing deployArtifact Import

**User Story:** As a developer, I want all scripts that call deployArtifact() to import it from the utility library, so that deployment scripts do not fail with undefined function errors.

#### Acceptance Criteria

1. WHEN scripts/deploy-router.js is executed, THE System SHALL have `deployArtifact` included in the import statement from `./utils/uniswap.js` so that the call to `deployArtifact(hre, artifact, [factory, wrappedNative])` resolves without a ReferenceError
2. WHEN scripts/deploy-quoter-v2.js is executed, THE System SHALL have `deployArtifact` included in the import statement from `./utils/uniswap.js` so that the call to `deployArtifact(hre, artifact, [factory, wrappedNative])` resolves without a ReferenceError
3. WHEN scripts/deploy-nfpm.js is executed, THE System SHALL have `deployArtifact` included in the import statement from `./utils/uniswap.js` so that all calls to `deployArtifact()` within the script resolve without a ReferenceError
4. WHEN any script imports `deployArtifact` from scripts/utils/uniswap.js, THE Utility_Library SHALL continue to export `deployArtifact` as a named export with its existing function signature `(hre, artifact, constructorArgs = [], libraries = {})`
5. IF a deployment script calls `deployArtifact` without having imported it, THEN THE System SHALL fail with a ReferenceError at the call site, indicating the function is not defined — this is the condition the fix must eliminate

### Requirement 3: Protect Private Keys from Version Control

**User Story:** As a developer, I want private keys excluded from version control, so that deployer credentials and test account keys are not exposed in the repository.

#### Acceptance Criteria

1. THE Gitignore_Configuration SHALL include rules that exclude `.env` and all `.env.*` variant files (such as `.env.local`, `.env.production`) from version control
2. WHEN a developer clones the repository, THE Deployment_Toolkit SHALL provide a `.env.example` file that lists every environment variable present in the project's `.env` file, with secret values (private keys and sensitive credentials) replaced by a descriptor string (e.g., `your_private_key_here`) and non-secret values (RPC URLs, contract addresses, chain IDs, numeric parameters) populated with their actual or representative values
3. THE Deployment_Toolkit SHALL NOT store any hexadecimal string of 64 characters representing a private key in any file tracked by version control
4. IF the `.env` file is currently tracked by version control, THEN THE Deployment_Toolkit SHALL remove it from the Git index (untrack it) while preserving the local file on disk, so that subsequent commits no longer include it
5. WHEN a developer clones the repository, THE Deployment_Toolkit SHALL include documentation in the README or `.env.example` file header that instructs the developer to copy `.env.example` to `.env` and populate the secret placeholder values before running deployment scripts

### Requirement 4: Reconcile Factory Address Inconsistency

**User Story:** As a developer, I want a single source of truth for deployed contract addresses, so that scripts and documentation reference the correct factory address.

#### Acceptance Criteria

1. THE Address_Registry SHALL designate deployed-addresses.json as the authoritative source for all deployed contract addresses, and the factoryV3 field in celo-sepolia-addresses.json and the UNISWAP_V3_FACTORY variable in the .env file SHALL contain the same address value as the factory field in deployed-addresses.json
2. WHEN a redeployment occurs, THE Address_Registry SHALL update the factory, nfpm, swapRouter, and quoterV2 addresses in deployed-addresses.json, celo-sepolia-addresses.json, and the .env file to match the newly deployed contract addresses within the same deployment session
3. THE Address_Registry SHALL store all Ethereum addresses in EIP-55 checksummed format across celo-sepolia-addresses.json, deployed-addresses.json, and the .env file so that a case-sensitive string comparison between corresponding address fields yields equality
4. IF an address in celo-sepolia-addresses.json or .env does not match the corresponding address in deployed-addresses.json when compared as case-insensitive hex strings, THEN THE Address_Registry SHALL report the mismatched file name, field name, expected value, and actual value

### Requirement 5: Fix deploy-all.js Constructor Arguments

**User Story:** As a developer, I want the deploy-all.js script to pass required constructor arguments to each contract, so that deployed contracts are functional.

#### Acceptance Criteria

1. WHEN the Deploy_All_Script deploys NonfungiblePositionManager, THE Deploy_All_Script SHALL pass the factory address, WETH9 address, and position descriptor address (in that order) as constructor arguments, where each address is read from environment variables or the deployed-addresses configuration
2. WHEN the Deploy_All_Script deploys QuoterV2, THE Deploy_All_Script SHALL pass the factory address and WETH9 address (in that order) as constructor arguments, where each address is read from environment variables or the deployed-addresses configuration
3. WHEN the Deploy_All_Script deploys SwapRouter, THE Deploy_All_Script SHALL pass the factory address and WETH9 address (in that order) as constructor arguments, where each address is read from environment variables or the deployed-addresses configuration
4. IF any required constructor argument address (factory, WETH9, or position descriptor) is not available or is an invalid Ethereum address at the time of deployment, THEN THE Deploy_All_Script SHALL terminate with an error message indicating which address is missing or invalid, without attempting the deployment transaction
5. WHEN all three contracts are deployed successfully, THE Deploy_All_Script SHALL log the deployed address of each contract to the console

### Requirement 6: Fix deploy-all.js QuoterV2 Artifact Path

**User Story:** As a developer, I want deploy-all.js to load the correct QuoterV2 artifact, so that the deployment uses the actual QuoterV2 contract bytecode.

#### Acceptance Criteria

1. WHEN the Deploy_All_Script loads the QuoterV2 artifact, THE Deploy_All_Script SHALL call loadArtifact with group "periphery" and relative path "lens/QuoterV2.sol/QuoterV2.json", resolving to "@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json"
2. IF the QuoterV2 artifact path cannot be resolved by loadArtifact, THEN THE Deploy_All_Script SHALL terminate with a non-zero exit code and output an error message indicating the module was not found
3. WHEN the Deploy_All_Script successfully loads the QuoterV2 artifact, THE Deploy_All_Script SHALL use the artifact's abi and bytecode fields to deploy the QuoterV2 contract

### Requirement 7: Correct README File Extension References

**User Story:** As a developer, I want the README to reference the correct file extensions, so that documentation commands match the actual script filenames.

#### Acceptance Criteria

1. THE README_Documentation SHALL reference every script filename in example commands using the extension that matches the actual file present in the scripts/ directory (e.g., .js for files stored as .js, .mjs for files stored as .mjs)
2. WHEN the README_Documentation provides example commands for deployment scripts, THE README_Documentation SHALL use the filenames deploy-periphery.js, deploy-nfpm.js, deploy-router.js, and deploy-quoter-v2.js
3. WHEN the README_Documentation provides example commands for pool creation or liquidity minting, THE README_Documentation SHALL use the filenames create-pool.js and mint-liquidity.js
4. IF a script file legitimately uses the .mjs extension in the repository (e.g., deploy-factory.mjs), THEN THE README_Documentation SHALL preserve the .mjs extension when referencing that file

### Requirement 8: Create Meaningful Test File

**User Story:** As a developer, I want the test file to contain at least a placeholder test structure, so that the test directory is not misleadingly empty.

#### Acceptance Criteria

1. THE Test_Suite SHALL contain a test file named `SimpleStorage.test.js` in the `test/` directory, replacing the empty `MyContract.test.js` file
2. THE Test_Suite SHALL structure the test file with at least one `describe` block and at least one `it` block that executes without syntax or runtime errors when `hardhat test` is run
3. WHEN a developer runs `hardhat test`, THE Test_Suite SHALL include at least one passing test that deploys the SimpleStorage contract, calls `store` with a known uint256 value, then asserts that `retrieve` returns that same value
4. IF the SimpleStorage contract fails to deploy during test execution, THEN THE Test_Suite SHALL report a test failure with an error indicating the deployment did not succeed

### Requirement 9: Rename Misleading Contract File

**User Story:** As a developer, I want the contract filename to reflect its contents, so that developers can locate contracts without confusion.

#### Acceptance Criteria

1. THE Contract_File containing the SimpleStorage contract SHALL be named SimpleStorage.sol and located in the contracts/ directory
2. WHEN the contract file is renamed, THE Deployment_Toolkit SHALL search all .js, .mjs, .sh, .yml, and .json files in the repository for references to the old filename "Lock.sol" and update each occurrence to "SimpleStorage.sol"
3. WHEN the contract file rename and reference updates are complete, THE Deployment_Toolkit SHALL verify that the Solidity compiler successfully compiles the contracts/ directory with no errors

### Requirement 10: Standardize Hardhat 3 API Usage

**User Story:** As a developer, I want all deployment scripts to use the Hardhat Runtime Environment consistently, so that network configuration and signer management are centralized.

#### Acceptance Criteria

1. WHEN a deployment script requires a signer, THE Deployment_Toolkit SHALL obtain the signer by calling getSigners() on the ethers instance returned from the Hardhat_Runtime_Environment connection (e.g., via getConnectedEthers(hre)), and SHALL NOT instantiate ethers.Wallet directly with a private key string
2. WHEN a deployment script requires a provider, THE Deployment_Toolkit SHALL use the provider embedded in the Hardhat_Runtime_Environment network connection and SHALL NOT construct a standalone JsonRpcProvider from an RPC URL environment variable
3. THE Deployment_Toolkit SHALL ensure that every JavaScript file in the scripts/ directory that deploys contracts (deploy-all.js, deploy-periphery.js, deploy-factory.mjs, deploy-nfpm.js, deploy-quoter-v2.js, deploy-router.js) contains zero direct instantiations of ethers.Wallet or ethers.JsonRpcProvider
4. IF a deployment script is executed outside of the Hardhat Runtime Environment (e.g., invoked directly via node rather than via the Hardhat CLI), THEN THE Deployment_Toolkit SHALL terminate with a non-zero exit code and an error message indicating that the script must be run through Hardhat
5. THE Deployment_Toolkit SHALL define all network RPC URLs and account private keys exclusively in hardhat.config.js network entries, so that no deployment script reads PRIVATE_KEY or RPC URL environment variables directly for provider or signer construction

### Requirement 11: Remove Unused Imports

**User Story:** As a developer, I want scripts to import only the functions they use, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. WHEN scripts/deploy-router.js declares imports from the Utility_Library, THE Script_Module_System SHALL include only the functions that are directly referenced in the script body: getArgOrEnv, getConnectedEthers, loadArtifact, parseAddress, parseArgs, requireValue, and deployArtifact
2. WHEN scripts/deploy-quoter-v2.js declares imports from the Utility_Library, THE Script_Module_System SHALL include only the functions that are directly referenced in the script body: getArgOrEnv, getConnectedEthers, loadArtifact, parseAddress, parseArgs, requireValue, and deployArtifact
3. THE Script_Module_System SHALL NOT import encodeSqrtPriceX96, parseBigInt, or sortTokenPair in scripts/deploy-router.js or scripts/deploy-quoter-v2.js
4. WHEN unused imports are removed from scripts/deploy-router.js or scripts/deploy-quoter-v2.js, THE Script_Module_System SHALL preserve the existing script execution behavior such that the script completes successfully with identical console output when invoked with valid arguments
