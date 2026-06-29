# Implementation Plan: NetTribe Monorepo Infrastructure

## Overview

This implementation plan covers the CI/CD pipeline, testing infrastructure, Terraform modules, monitoring, secrets management, and shared configuration for the NetTribe monorepo. The plan establishes a layered approach: testing infrastructure first, then backend services and Terraform modules, followed by CI/CD integration, monitoring, and shared tooling.

## Tasks

- [x] 1. Set up testing infrastructure
  - [ ] 1.1 Install Vitest, @testing-library/react, and @testing-library/jest-dom as devDependencies at the monorepo root
    - _Requirements: 8.1, 8.5_
  - [ ] 1.2 Create vitest.config.ts at the monorepo root with workspace configuration pointing to apps/nettribexyz and apps/evtelemetryai
    - _Requirements: 8.1_
  - [ ] 1.3 Create apps/nettribexyz/vitest.config.ts with React plugin, jsdom environment, and coverage configuration (v8 provider, 80% threshold)
    - _Requirements: 8.5_
  - [ ] 1.4 Create apps/evtelemetryai/vitest.config.ts with React plugin, jsdom environment, and coverage configuration
    - _Requirements: 8.5_
  - [ ] 1.5 Add test scripts to root package.json: "test", "test:coverage", "test:nettribexyz", "test:telemetry"
    - _Requirements: 8.1_
  - [ ] 1.6 Install aws-sdk-client-mock and aws-sdk-client-mock-jest as devDependencies for Lambda integration tests
    - _Requirements: 8.2_
  - [ ] 1.7 Create apps/nettribexyz/src/__tests__/setup.ts with test environment setup (mock Amplify config)
    - _Requirements: 8.1_
  - [ ] 1.8 Create apps/evtelemetryai/src/__tests__/setup.ts with test environment setup
    - _Requirements: 8.1_

- [x] 2. Create telemetry pipeline Lambda tests
  - [ ] 2.1 Create amplify/functions/telemetry-ingest/handler.test.ts with unit tests for valid event processing (mock Firehose PutRecord)
    - _Requirements: 5.1, 8.2_
  - [ ] 2.2 Add test case for invalid payload rejection (missing required fields returns 400)
    - _Requirements: 5.7, 8.2_
  - [ ] 2.3 Add test case for Firehose error handling (PutRecord failure returns 500 with error details)
    - _Requirements: 5.1, 8.2_
  - [ ] 2.4 Create amplify/functions/athena-query/handler.test.ts with unit tests for query execution (mock Athena StartQueryExecution, GetQueryResults)
    - _Requirements: 5.5, 8.2_
  - [ ] 2.5 Add test case for Athena query timeout handling
    - _Requirements: 5.5, 8.2_

- [x] 3. Create Terraform environment configuration
  - [ ] 3.1 Create infra/environments/ directory with dev.tfvars, staging.tfvars, and prod.tfvars files containing environment-specific variable values
    - _Requirements: 2.1, 2.5, 3.5_
  - [ ] 3.2 Update infra/main.tf backend configuration to use environment-based state key pattern (infra/{environment}/terraform.tfstate)
    - _Requirements: 3.1_
  - [ ] 3.3 Create infra/scripts/plan.sh that accepts an environment argument and runs terraform plan with the correct tfvars file
    - _Requirements: 3.6_
  - [ ] 3.4 Create infra/scripts/apply.sh that accepts an environment argument, runs terraform apply, and requires manual confirmation for prod environment
    - _Requirements: 3.6_
  - [ ] 3.5 Add infra/environments/*.tfvars to .gitignore (keep .example files tracked)
    - _Requirements: 10.3_
  - [ ] 3.6 Create infra/environments/dev.tfvars.example and prod.tfvars.example as templates
    - _Requirements: 2.5, 10.3_

- [x] 4. Enhance API Gateway Terraform module
  - [ ] 4.1 Create infra/modules/api-gateway/cors.tf with environment-specific CORS configuration (localhost for dev, production domain for prod)
    - _Requirements: 4.5, 10.5_
  - [ ] 4.2 Add CloudWatch access logging to infra/modules/api-gateway/main.tf with structured JSON format (request ID, path, method, status, latency)
    - _Requirements: 4.6, 11.1_
  - [ ] 4.3 Add GET /health route without authorizer that returns 200 with JSON body {"status": "healthy"}
    - _Requirements: 4.3_
  - [ ] 4.4 Add variables for cors_allowed_origins as a list input to the api-gateway module
    - _Requirements: 4.5_
  - [ ] 4.5 Create infra/modules/api-gateway/outputs.tf exposing api_url, api_id, and log_group_arn
    - _Requirements: 4.1, 4.2_

- [x] 5. Complete telemetry pipeline Terraform module
  - [ ] 5.1 Add S3 lifecycle policy configuration to infra/modules/telemetry-pipeline/main.tf (Standard-IA at 90 days, Glacier at 365 days, expire at 2555 days)
    - _Requirements: 5.6_
  - [ ] 5.2 Add Athena workgroup with scan limit per query (configurable bytes-scanned-cutoff via variable)
    - _Requirements: 5.5_
  - [ ] 5.3 Add Glue catalog database and table definition with partition keys (year, month, day) matching the telemetry event schema
    - _Requirements: 5.4_
  - [ ] 5.4 Add Firehose delivery stream configuration with GZIP compression and S3 prefix pattern (year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/)
    - _Requirements: 5.2, 5.3_
  - [ ] 5.5 Create infra/modules/telemetry-pipeline/iam.tf with Firehose execution role (S3 write, Glue read permissions)
    - _Requirements: 5.1_

- [x] 6. Enhance CI/CD pipeline configuration
  - [ ] 6.1 Update amplify.yml to add test execution in preBuild phase for apps/nettribexyz (npm run test -- --run)
    - _Requirements: 1.1, 8.4_
  - [ ] 6.2 Update amplify.yml to add test execution in preBuild phase for apps/evtelemetryai (npm run test -- --run)
    - _Requirements: 1.1, 8.4_
  - [ ] 6.3 Update amplify.yml to add lint step in preBuild phase for apps/nettribexyz and apps/evtelemetryai
    - _Requirements: 8.4, 9.3_
  - [ ] 6.4 Update amplify.yml nettribeblockchain build to run contract tests (npx hardhat test) before compilation
    - _Requirements: 7.5, 8.7_
  - [ ] 6.5 Add cache configuration for pnpm store in the nettribeblockchain build step
    - _Requirements: 9.4_

- [x] 7. Set up secrets prevention and configuration
  - [ ] 7.1 Update .gitignore to include patterns for .env*, terraform.tfvars, amplify_outputs.json, and *.pem files
    - _Requirements: 10.3, 10.4_
  - [ ] 7.2 Create scripts/check-secrets.sh that scans staged files for secret patterns (.env, .tfvars, private keys) and exits with error if found
    - _Requirements: 10.4_
  - [ ] 7.3 Create .husky/pre-commit hook that runs scripts/check-secrets.sh before allowing commits
    - _Requirements: 10.4_
  - [ ] 7.4 Install husky as a devDependency and add "prepare": "husky" script to root package.json
    - _Requirements: 10.4_
  - [ ] 7.5 Create a .env.example file at the monorepo root documenting all required environment variables with placeholder values
    - _Requirements: 10.1, 10.2_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Set up monitoring and alarms (Terraform)
  - [ ] 9.1 Create infra/modules/monitoring/main.tf with CloudWatch log groups for API Gateway and Lambda functions using /nettribe/{environment}/ prefix
    - _Requirements: 11.1, 11.2_
  - [ ] 9.2 Add CloudWatch alarm for Lambda error rate (> 5 errors in 5 minutes) with SNS topic notification
    - _Requirements: 11.2_
  - [ ] 9.3 Add CloudWatch alarm for Firehose delivery freshness (> 300 seconds DataFreshness) with SNS notification
    - _Requirements: 11.3_
  - [ ] 9.4 Add CloudWatch alarm for Athena daily scan cost (> 10GB ProcessedBytes per day) with SNS notification
    - _Requirements: 11.4_
  - [ ] 9.5 Add monitoring module to infra/main.tf with environment variable
    - _Requirements: 11.1_
  - [ ] 9.6 Create infra/modules/monitoring/variables.tf and outputs.tf with alarm ARNs and SNS topic ARN outputs
    - _Requirements: 11.2_

- [x] 10. Create Terraform validation in CI
  - [ ] 10.1 Create .github/workflows/terraform-validate.yml that runs terraform init -backend=false and terraform validate on pull requests
    - _Requirements: 8.6_
  - [ ] 10.2 Add terraform fmt -check step to the workflow to enforce consistent formatting
    - _Requirements: 8.6_
  - [ ] 10.3 Add terraform plan step (using dev.tfvars.example) for PR review visibility
    - _Requirements: 8.6, 3.6_
  - [ ] 10.4 Configure the workflow to only trigger when files in infra/ directory are changed
    - _Requirements: 8.6_

- [x] 11. Set up E2E test framework
  - [ ] 11.1 Install Playwright as a devDependency in apps/nettribexyz
    - _Requirements: 8.3_
  - [ ] 11.2 Create apps/nettribexyz/playwright.config.ts with base URL configuration and browser settings
    - _Requirements: 8.3_
  - [ ] 11.3 Create apps/nettribexyz/e2e/auth.spec.ts with test stubs for sign-up, sign-in, and sign-out flows
    - _Requirements: 8.3_
  - [ ] 11.4 Create apps/nettribexyz/e2e/navigation.spec.ts with test stubs for main page navigation
    - _Requirements: 8.3_
  - [ ] 11.5 Add "test:e2e" script to apps/nettribexyz/package.json
    - _Requirements: 8.3_

- [x] 12. Create deployment automation scripts
  - [ ] 12.1 Create scripts/deploy.sh that orchestrates the full deployment: Amplify backend → extract outputs → Terraform plan → Terraform apply
    - _Requirements: 3.2, 3.5_
  - [ ] 12.2 Create scripts/extract-amplify-outputs.sh that parses amplify_outputs.json and generates terraform.tfvars values for cognito_user_pool_id and athena_lambda_arn
    - _Requirements: 3.2_
  - [ ] 12.3 Add documentation in infra/README.md for the deployment order and script usage
    - _Requirements: 3.1, 3.2_
  - [ ] 12.4 Create scripts/bootstrap-state.sh that creates the S3 state bucket and DynamoDB lock table for first-time setup
    - _Requirements: 3.1_

- [x] 13. Configure shared ESLint and TypeScript
  - [ ] 13.1 Create a shared ESLint flat config at the monorepo root (eslint.config.js) with TypeScript and React rules
    - _Requirements: 9.3_
  - [ ] 13.2 Ensure apps/nettribexyz and apps/evtelemetryai extend the root ESLint config without duplication
    - _Requirements: 9.3_
  - [ ] 13.3 Verify tsconfig.json configurations for each app use consistent compiler options (strict, ES2022 target, module resolution)
    - _Requirements: 9.1_
  - [ ] 13.4 Add "lint:all" script to root package.json that lints all TypeScript apps
    - _Requirements: 9.3_

- [ ] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- This feature is primarily Infrastructure as Code (Terraform, Amplify) and CI/CD pipeline configuration
- Property-based testing is not applicable — correctness is validated through infrastructure plan checks, integration tests, and smoke tests
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Tasks are ordered so that testing infrastructure is established first, enabling test-driven development for subsequent tasks
- Terraform modules (tasks 4, 5, 9) can be developed in parallel as they are independent modules

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "7.1", "13.1"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5", "1.6", "7.4", "13.2", "13.3"] },
    { "id": 2, "tasks": ["1.7", "1.8", "7.2", "7.5", "13.4"] },
    { "id": 3, "tasks": ["2.1", "3.1", "4.1", "5.1", "7.3"] },
    { "id": 4, "tasks": ["2.2", "2.3", "3.2", "4.2", "4.3", "5.2", "5.3"] },
    { "id": 5, "tasks": ["2.4", "2.5", "3.3", "3.4", "4.4", "4.5", "5.4", "5.5"] },
    { "id": 6, "tasks": ["3.5", "3.6", "6.1", "6.2", "6.3"] },
    { "id": 7, "tasks": ["6.4", "6.5", "9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3", "9.4", "9.5", "9.6"] },
    { "id": 9, "tasks": ["10.1", "10.2", "11.1"] },
    { "id": 10, "tasks": ["10.3", "10.4", "11.2"] },
    { "id": 11, "tasks": ["11.3", "11.4", "11.5", "12.1"] },
    { "id": 12, "tasks": ["12.2", "12.3", "12.4"] }
  ]
}
```
