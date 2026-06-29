# Requirements Document

## Introduction

This document specifies the requirements for the NetTribe monorepo infrastructure — covering the CI/CD deployment pipeline, backend services for all three applications (nettribexyz, evtelemetryai, nettribeblockchain), the testing strategy across the stack, and the integration of the chosen tech stack. The goal is a production-ready monorepo with automated deployments, environment isolation, comprehensive test coverage, and clear service boundaries.

## Glossary

- **Amplify_Pipeline**: The AWS Amplify CI/CD system that builds and deploys frontend and backend resources using amplify.yml configuration
- **Terraform_Runner**: The automation layer that applies Terraform modules for infrastructure not managed by Amplify (telemetry pipeline, API Gateway)
- **Platform_App**: The nettribexyz application — React frontend with Amplify backend (Cognito, AppSync, DynamoDB, Lambda)
- **Telemetry_App**: The evtelemetryai application — React frontend with Lambda ingestion backend and analytics pipeline
- **Blockchain_App**: The nettribeblockchain application — Hardhat smart contracts deployed to Celo Sepolia
- **Unified_API_Gateway**: The HTTP API (API Gateway v2) that routes requests across services with Cognito JWT authorization
- **Telemetry_Pipeline**: The data flow from Lambda → Kinesis Firehose → S3 (GZIP) → Glue Catalog → Athena
- **AppSync_API**: The GraphQL API layer backed by DynamoDB for platform CRUD operations
- **Test_Runner**: The system that executes unit, integration, and end-to-end tests across the monorepo
- **Environment**: A named deployment stage (dev, staging, prod) with isolated resources and configuration
- **State_Backend**: The S3 bucket and DynamoDB table used for Terraform remote state locking

## Requirements

### Requirement 1: Multi-App CI/CD Pipeline

**User Story:** As a developer, I want a single CI/CD pipeline that builds and deploys all three applications independently, so that changes to one app do not require redeploying the others.

#### Acceptance Criteria

1. WHEN a commit is pushed to a branch, THE Amplify_Pipeline SHALL build only the applications whose source files have changed
2. THE Amplify_Pipeline SHALL execute builds for Platform_App, Telemetry_App, and Blockchain_App as independent build steps within a single pipeline configuration
3. WHEN the Platform_App build step runs, THE Amplify_Pipeline SHALL deploy the Amplify backend (Cognito, AppSync, DynamoDB, Lambda) before building the frontend
4. WHEN the Blockchain_App build step runs, THE Amplify_Pipeline SHALL compile Solidity contracts using Hardhat and produce build artifacts without deploying runtime infrastructure
5. IF a build step fails for one application, THEN THE Amplify_Pipeline SHALL report the failure and continue building other applications that are not dependent on it
6. THE Amplify_Pipeline SHALL use Node.js version 20 for all build steps

### Requirement 2: Environment Isolation

**User Story:** As a platform operator, I want isolated dev, staging, and production environments, so that development work does not affect production users.

#### Acceptance Criteria

1. THE Terraform_Runner SHALL create separate resource instances for each Environment using environment-prefixed naming (e.g., nettribe-telemetry-data-dev, nettribe-telemetry-data-prod)
2. WHEN the Terraform_Runner applies configuration, THE State_Backend SHALL maintain separate state files per Environment
3. THE Amplify_Pipeline SHALL deploy Platform_App to separate Amplify environments based on the Git branch (main → prod, develop → dev, staging → staging)
4. WHILE operating in a non-production Environment, THE Unified_API_Gateway SHALL use a separate Cognito User Pool isolated from production users
5. THE Terraform_Runner SHALL support environment-specific variable files (terraform.tfvars) for each target Environment

### Requirement 3: Terraform Infrastructure Deployment

**User Story:** As a DevOps engineer, I want Terraform to manage all non-Amplify infrastructure with remote state and dependency ordering, so that infrastructure changes are auditable and reproducible.

#### Acceptance Criteria

1. THE Terraform_Runner SHALL store state in an S3 bucket with DynamoDB locking to prevent concurrent modifications
2. WHEN the Amplify backend deploys first, THE Terraform_Runner SHALL accept Cognito User Pool ID and Lambda ARNs as input variables from Amplify outputs
3. THE Terraform_Runner SHALL provision the Telemetry_Pipeline module (S3 bucket, Kinesis Firehose, Glue Catalog, Athena workgroup)
4. THE Terraform_Runner SHALL provision the Unified_API_Gateway module (HTTP API, Cognito JWT authorizer, route integrations)
5. WHEN Terraform applies changes, THE Terraform_Runner SHALL tag all resources with Project, ManagedBy, and Environment tags
6. IF the Terraform plan contains destructive changes to production resources, THEN THE Terraform_Runner SHALL require manual approval before applying

### Requirement 4: Unified API Gateway Routing

**User Story:** As a frontend developer, I want a single API endpoint that routes to all backend services with consistent authentication, so that I do not need to manage multiple API URLs.

#### Acceptance Criteria

1. THE Unified_API_Gateway SHALL route POST /telemetry requests to the telemetry-ingest Lambda function
2. THE Unified_API_Gateway SHALL route POST /athena requests to the athena-query Lambda function
3. THE Unified_API_Gateway SHALL route GET /health requests to a health check endpoint that returns a 200 status without authentication
4. WHEN a request is received on authenticated routes, THE Unified_API_Gateway SHALL validate the Cognito JWT token and reject requests with invalid or expired tokens with a 401 response
5. THE Unified_API_Gateway SHALL enable CORS with allowed origins configured per Environment (localhost for dev, production domain for prod)
6. THE Unified_API_Gateway SHALL log all requests to CloudWatch with request ID, path, status code, and latency

### Requirement 5: Telemetry Pipeline Backend

**User Story:** As a data engineer, I want telemetry data ingested, stored, and queryable through a serverless pipeline, so that ride telemetry can be analyzed without managing servers.

#### Acceptance Criteria

1. WHEN the telemetry-ingest Lambda receives a valid telemetry event, THE Telemetry_Pipeline SHALL write the event to Kinesis Firehose within 1 second
2. THE Telemetry_Pipeline SHALL compress data using GZIP format before writing to S3
3. THE Telemetry_Pipeline SHALL partition S3 data by year/month/day for efficient Athena queries
4. THE Telemetry_Pipeline SHALL register the S3 data in the Glue Catalog with a schema matching the telemetry event format
5. WHEN an Athena query is executed, THE Telemetry_Pipeline SHALL enforce a scan limit per query via the Athena workgroup to control costs
6. THE Telemetry_Pipeline SHALL apply S3 lifecycle policies: transition to Infrequent Access at 90 days, Glacier at 1 year, expire at 7 years
7. IF the telemetry-ingest Lambda receives an invalid event payload, THEN THE Telemetry_Pipeline SHALL return a 400 error with a descriptive message and not write to Firehose

### Requirement 6: Platform Backend (AppSync + DynamoDB)

**User Story:** As a platform developer, I want a GraphQL API with role-based access to DynamoDB models, so that the frontend can perform CRUD operations with authorization enforced at the API layer.

#### Acceptance Criteria

1. THE AppSync_API SHALL expose GraphQL queries and mutations for all data models: Profile, UserRole, Rider, Motorcycle, Ride, CarbonCredit, CarbonPurchase, InitialCarbonOffering, IcoPurchase, BurnedCredit
2. THE AppSync_API SHALL enforce owner-based authorization so that users can only read and modify their own records unless they belong to the admin group
3. WHEN a user belongs to the admin group, THE AppSync_API SHALL grant read access to all records and write access as defined per model
4. THE AppSync_API SHALL use Cognito User Pool as the default authorization mode
5. WHEN a DynamoDB model defines secondary indexes, THE AppSync_API SHALL support efficient queries on those indexed fields (userId, riderId, currentRiderId, icoId)

### Requirement 7: Blockchain CI/CD

**User Story:** As a smart contract developer, I want automated compilation and optional deployment of contracts in the pipeline, so that contract builds are reproducible and deployment is controlled.

#### Acceptance Criteria

1. WHEN the Blockchain_App build step runs, THE Amplify_Pipeline SHALL install pnpm and use it to install dependencies
2. THE Amplify_Pipeline SHALL compile all Solidity contracts using Hardhat and produce ABI and bytecode artifacts
3. WHEN deploying to Celo Sepolia, THE Blockchain_App SHALL use deployment scripts located in the scripts/ directory with private keys provided via environment variables
4. THE Blockchain_App SHALL store deployed contract addresses in a JSON file (deployed-addresses.json) that can be consumed by the Platform_App frontend
5. IF contract compilation fails, THEN THE Amplify_Pipeline SHALL fail the Blockchain_App build step and output the Solidity compiler error

### Requirement 8: Testing Strategy

**User Story:** As a quality engineer, I want a layered testing strategy covering unit, integration, and end-to-end tests across all apps, so that regressions are caught before deployment.

#### Acceptance Criteria

1. THE Test_Runner SHALL execute unit tests for each application in isolation using Vitest for TypeScript/React code and Hardhat test for Solidity contracts
2. THE Test_Runner SHALL execute integration tests that verify Lambda functions interact correctly with AWS services (Firehose, Athena, DynamoDB) using mocked AWS SDK calls
3. THE Test_Runner SHALL execute end-to-end tests for the Platform_App that verify authentication flows, GraphQL mutations, and data model interactions
4. WHEN a pull request is opened, THE Amplify_Pipeline SHALL run the full test suite and block merging if any test fails
5. THE Test_Runner SHALL generate code coverage reports and enforce a minimum coverage threshold of 80% for new code in TypeScript modules
6. THE Test_Runner SHALL validate Terraform configurations using terraform validate and terraform plan in a dry-run mode before applying changes
7. THE Test_Runner SHALL execute smart contract tests using Hardhat's testing framework to verify contract logic before deployment

### Requirement 9: Shared Configuration and Dependencies

**User Story:** As a developer, I want shared tooling configuration at the monorepo root with per-app overrides, so that code style and build settings are consistent without duplicating config.

#### Acceptance Criteria

1. THE Platform_App and Telemetry_App SHALL share dependencies defined in the root package.json using npm workspaces
2. THE Blockchain_App SHALL maintain an independent pnpm workspace that does not conflict with the npm workspace root
3. THE Test_Runner SHALL use a shared ESLint configuration at the monorepo root that applies to all TypeScript applications
4. THE Amplify_Pipeline SHALL cache node_modules and .npm directories between builds to reduce build times
5. WHEN a shared dependency version is updated at the root, THE Platform_App and Telemetry_App SHALL both use the updated version without manual intervention

### Requirement 10: Secrets and Configuration Management

**User Story:** As a DevOps engineer, I want secrets and environment-specific configuration managed securely and injected at build/runtime, so that sensitive values are never committed to source control.

#### Acceptance Criteria

1. THE Amplify_Pipeline SHALL inject environment variables (Cognito pool ID, API Gateway URL, Firehose stream name) into frontend builds from Amplify environment variable configuration
2. THE Blockchain_App SHALL receive private keys for Celo deployment via environment variables configured in the CI/CD system, not from source-committed files
3. THE Terraform_Runner SHALL accept sensitive variables (Cognito User Pool ID, Lambda ARNs) via terraform.tfvars files that are excluded from version control by .gitignore
4. IF a .env file or terraform.tfvars file is detected in a commit, THEN THE Amplify_Pipeline SHALL fail the build with a warning about committed secrets
5. THE Unified_API_Gateway SHALL retrieve CORS allowed origins from environment-specific configuration rather than hardcoded values

### Requirement 11: Monitoring and Observability

**User Story:** As a platform operator, I want centralized logging and alerting across all services, so that I can detect and diagnose issues quickly.

#### Acceptance Criteria

1. THE Unified_API_Gateway SHALL log all API requests to CloudWatch Logs with structured JSON format including request ID, path, method, status, and response time
2. WHEN a Lambda function execution fails, THE Telemetry_Pipeline SHALL publish a CloudWatch alarm that triggers a notification
3. THE Telemetry_Pipeline SHALL emit custom CloudWatch metrics for ingestion rate (events per minute) and Firehose delivery failures
4. WHEN Athena query costs exceed a configured threshold per day, THE Telemetry_Pipeline SHALL trigger a cost alert notification
5. THE Amplify_Pipeline SHALL report build status (success/failure/duration) as CloudWatch metrics for pipeline health monitoring
