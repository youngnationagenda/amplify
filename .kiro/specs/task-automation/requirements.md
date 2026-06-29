# Requirements Document

## Introduction

The Task Automation feature provides an internal developer tooling system for the Net Tribe Carbon platform that automates repetitive development tasks. It covers three core domains: documentation generation and management, code cleanup and quality enforcement, and API integration scaffolding for both GraphQL (AppSync) and REST endpoints. The system runs as CLI commands and optional CI/CD pipeline steps integrated into the existing Vite/TypeScript development workflow.

## Glossary

- **Automation_Engine**: The core system that orchestrates and executes automated development tasks
- **Doc_Generator**: The subsystem responsible for generating and updating documentation artifacts
- **Code_Cleaner**: The subsystem responsible for automated code formatting, linting, and dead-code removal
- **API_Scaffolder**: The subsystem responsible for generating typed API client code from schema definitions
- **Schema_Source**: The Amplify data schema definition file (`amplify/data/resource.ts`) that serves as the source of truth for GraphQL models
- **Task_Runner**: The CLI interface that developers use to invoke automation commands
- **Task_Config**: A configuration file that defines which automations are enabled and their parameters
- **Generated_Output**: Files produced by the automation system, marked with header comments indicating they are auto-generated

## Requirements

### Requirement 1: Task Runner CLI Interface

**User Story:** As a developer, I want a unified CLI command to run automation tasks, so that I can invoke documentation, cleanup, and scaffolding operations without remembering multiple tool-specific commands.

#### Acceptance Criteria

1. THE Task_Runner SHALL provide a single entry point command (`npm run automate`) that accepts a task name argument and exits with code 0 on success or code 1 on failure
2. WHEN the Task_Runner is invoked without arguments or with only whitespace, THE Task_Runner SHALL display a list of available automation tasks with a one-line description per task printed to stdout, and exit with code 0
3. WHEN the Task_Runner is invoked with a task name that does not match any registered task, THE Task_Runner SHALL print an error message indicating the unrecognized task name followed by the list of valid task names to stderr, and exit with code 1
4. THE Task_Runner SHALL support running up to 10 tasks in sequence via comma-separated task names passed as a single argument
5. WHEN a task in a sequence fails (exits with a non-zero code or throws an unhandled exception), THE Task_Runner SHALL halt execution of remaining tasks, print to stderr the name of the failed task and the associated error message, and exit with code 1

### Requirement 2: Task Configuration

**User Story:** As a developer, I want to configure automation behavior through a config file, so that I can customize which tasks run and how they behave without modifying source code.

#### Acceptance Criteria

1. WHEN the Automation_Engine starts execution, THE Automation_Engine SHALL read configuration from a `.automaterc.json` file located in the project root directory before executing any tasks
2. WHEN no `.automaterc.json` file exists in the project root, THE Automation_Engine SHALL execute all registered tasks using their built-in default settings without requiring user intervention
3. THE Task_Config SHALL support enabling or disabling individual tasks via a boolean flag per task identifier
4. THE Task_Config SHALL support task-specific parameters including output directory paths and file inclusion glob patterns as key-value pairs within each task's configuration object
5. IF the Task_Config contains invalid JSON, THEN THE Automation_Engine SHALL report a parse error that includes the line number and nature of the syntax error, and exit with a non-zero code
6. IF the Task_Config contains valid JSON but includes unrecognized keys or values that fail type validation, THEN THE Automation_Engine SHALL report an error identifying the invalid key or value and exit with a non-zero code

### Requirement 3: API Documentation Generation

**User Story:** As a developer, I want to auto-generate API documentation from the Amplify schema, so that I always have up-to-date docs reflecting the current data models and their authorization rules.

#### Acceptance Criteria

1. WHEN the `docs:api` task is invoked, THE Doc_Generator SHALL parse the Schema_Source and produce one Markdown file per model, named using the model name in kebab-case (e.g., `carbon-credit.md`)
2. THE Doc_Generator SHALL include for each model: field names, field types, required status, default values, secondary indexes (with indexed field names), and authorization rules broken down by allowed identity (owner, group, authenticated) and permitted operations (create, read, update, delete)
3. THE Doc_Generator SHALL accept an output directory path via a CLI argument, defaulting to `docs/api/` when not provided, and SHALL create the directory if it does not exist
4. WHEN the Schema_Source contains enum types, THE Doc_Generator SHALL document all enum values in a dedicated `enums.md` file within the output directory, listing each enum with its possible values
5. THE Generated_Output SHALL include a header comment on the first line of each generated file containing the generation timestamp in ISO 8601 format and the relative path to the Schema_Source file
6. IF the Schema_Source file is missing or contains syntax errors that prevent parsing, THEN THE Doc_Generator SHALL exit with a non-zero exit code and print an error message indicating the parsing failure reason to standard error

### Requirement 4: Component Documentation Generation

**User Story:** As a developer, I want to auto-generate component documentation from TypeScript props interfaces, so that the team can quickly reference available components and their APIs.

#### Acceptance Criteria

1. WHEN the `docs:components` task is invoked, THE Doc_Generator SHALL recursively scan all `.tsx` files in `src/components/` and extract interfaces used as props by exported React components
2. WHEN generating documentation for a component, THE Doc_Generator SHALL produce a Markdown file per component in a `docs/components/` output directory, listing each prop's name, TypeScript type, required or optional status, and default value if one is assigned in the destructuring signature
3. WHEN a component has JSDoc comments on the interface or its individual properties, THE Doc_Generator SHALL include the description text in the generated documentation alongside the corresponding prop entry
4. WHEN grouping documentation output, THE Doc_Generator SHALL organize components by their immediate subdirectory (rider, investor, wallet, celo, ui) and place components located directly in `src/components/` under a "shared" group
5. THE Generated_Output SHALL include a table of contents with anchor links to each component's documentation section
6. WHEN the `docs:components` task completes successfully, THE Doc_Generator SHALL print a summary to stdout indicating the number of components processed and the output directory path
7. IF a `.tsx` file exports a component that has no identifiable props interface, THEN THE Doc_Generator SHALL include that component in the output with an indication that it accepts no props

### Requirement 5: Code Formatting Automation

**User Story:** As a developer, I want automated code formatting applied consistently across the codebase, so that code style remains uniform without manual effort.

#### Acceptance Criteria

1. WHEN the `clean:format` task is invoked, THE Code_Cleaner SHALL format all files with `.ts` and `.tsx` extensions in the project according to the project Prettier configuration
2. IF no Prettier configuration file exists in the project root, THEN THE Code_Cleaner SHALL use a default configuration with 2-space indentation, single quotes, trailing commas set to "all", a print width of 100 characters, and semicolons enabled; this default indentation of 2 spaces SHALL always be enforced regardless of any project-level Prettier indentation settings
3. WHEN formatting completes, THE Code_Cleaner SHALL print to standard output the number of files that were reformatted and the number of files that were already compliant
4. THE Code_Cleaner SHALL skip files in `node_modules/`, `dist/`, `.amplify/`, and all path patterns listed in the project `.gitignore` file
5. IF a file cannot be parsed due to syntax errors, THEN THE Code_Cleaner SHALL skip that file, print a warning to standard output identifying the file path, and continue processing the remaining files

### Requirement 6: Dead Code Detection

**User Story:** As a developer, I want to identify unused exports, components, and variables, so that I can keep the codebase lean during the Supabase-to-Amplify migration.

#### Acceptance Criteria

1. WHEN the `clean:dead-code` task is invoked, THE Code_Cleaner SHALL perform static analysis across all TypeScript and TSX files in `src/` and report every exported symbol that is not imported or referenced by any other file within the project, excluding `node_modules/` and `dist/` from the search scope
2. WHEN the analysis runs, THE Code_Cleaner SHALL identify unused imports in each file and report, for each occurrence, the file path, the import name, and the line number where the import appears
3. WHEN the analysis runs, THE Code_Cleaner SHALL identify components in `src/components/` (including subdirectories) that are not statically imported by any other file in `src/` and report the component file path and exported component name
4. WHEN an unused item is found in the `src/integrations/supabase/` directory, THE Code_Cleaner SHALL flag the item with a "migration-candidate" label in the report output, distinguishing it from other unused items
5. WHEN the `clean:dead-code` task is invoked with a `--json` flag, THE Code_Cleaner SHALL write the report to a JSON file in the project root named `dead-code-report.json` containing an array of entries each with fields: file path, symbol name, category (unused-export, unused-import, or unused-component), and migration-candidate flag; WHEN no unused items are detected, THE Code_Cleaner SHALL still create the file containing an empty array
6. WHEN the analysis completes, THE Code_Cleaner SHALL print a summary to the terminal listing the total count of unused items found per category (unused exports, unused imports, unused components, migration candidates)
7. IF no unused items are detected during analysis, THEN THE Code_Cleaner SHALL print a message indicating zero dead code items were found and exit with a zero exit code

### Requirement 7: GraphQL API Client Scaffolding

**User Story:** As a developer, I want to auto-generate typed CRUD hook wrappers from the Amplify schema, so that I can use consistent data access patterns across the React application.

#### Acceptance Criteria

1. WHEN the `scaffold:graphql` task is invoked, THE API_Scaffolder SHALL parse the Schema_Source (`amplify/data/resource.ts`) and generate one TypeScript file per model in the configured output directory (default: `src/hooks/generated/`), named using the pattern `use{ModelName}.ts`
2. THE API_Scaffolder SHALL generate hooks for list, get, create, update, and delete operations per model, each returning React Query hook results with typed data
3. THE API_Scaffolder SHALL use the existing Amplify typed client from `@/integrations/amplify/client` in generated hooks for all data operations
4. THE Generated_Output SHALL include TypeScript types inferred from the Schema_Source model field definitions, ensuring type-safe parameters and return values
5. THE API_Scaffolder SHALL output generated hook files to a configurable directory (default: `src/hooks/generated/`) and SHALL create the directory if it does not exist
6. WHEN the Schema_Source changes, THE API_Scaffolder SHALL regenerate only the hooks for models whose field definitions, authorization rules, or secondary indexes have been modified since the last generation, determined by comparing a stored hash of each model's definition

### Requirement 8: REST API Client Scaffolding

**User Story:** As a developer, I want to generate typed REST API client functions from an OpenAPI specification, so that external service integrations have consistent error handling and type safety.

#### Acceptance Criteria

1. WHEN the `scaffold:rest` task is invoked, THE API_Scaffolder SHALL read an OpenAPI 3.0 or 3.1 specification file from a path specified via a configuration option and write the generated client module to a configurable output directory
2. WHEN the `scaffold:rest` task is invoked, THE API_Scaffolder SHALL generate a typed TypeScript client module containing one exported async function per unique operation (HTTP method + path combination), where each function accepts typed parameters for path parameters, query parameters, and request body (when defined in the spec) and returns a typed response
3. WHEN the `scaffold:rest` task is invoked, THE API_Scaffolder SHALL generate Zod validation schemas for each request body schema and each response schema defined in the OpenAPI specification
4. IF the OpenAPI specification file is missing, THEN THE API_Scaffolder SHALL exit with a non-zero status and report an error message that includes the expected file path
5. IF the OpenAPI specification file is present but fails structural validation against the OpenAPI 3.x standard, THEN THE API_Scaffolder SHALL exit with a non-zero status and report an error message that identifies the location and nature of the validation failure
6. THE Generated_Output SHALL include request/response TypeScript interfaces derived from the OpenAPI schemas
7. WHEN a generated client function receives a non-2xx HTTP response, THE Generated_Output SHALL throw a typed error that includes the HTTP status code and response body, enabling callers to handle failures without inspecting raw responses
8. IF the configured output directory already contains a previously generated client module, THEN THE API_Scaffolder SHALL overwrite the existing generated files without prompting

### Requirement 9: Lint and Fix Automation

**User Story:** As a developer, I want a single command that runs ESLint with auto-fix, so that common lint issues are resolved automatically without manual intervention.

#### Acceptance Criteria

1. WHEN the `clean:lint` task is invoked, THE Code_Cleaner SHALL execute ESLint with the auto-fix flag on all TypeScript and TSX files in the project, respecting the existing ESLint configuration in `eslint.config.js`
2. WHEN linting completes, THE Code_Cleaner SHALL print to stdout the count of issues fixed and the count of remaining issues that require manual resolution
3. WHEN lint errors remain after auto-fix, THE Code_Cleaner SHALL exit with a non-zero code
4. WHEN all lint issues are fixed or no issues are found (remaining issue count is 0), THE Code_Cleaner SHALL exit with code 0 regardless of any non-lint ESLint execution errors

### Requirement 10: CI/CD Integration

**User Story:** As a developer, I want the automation tasks to be runnable in CI/CD pipelines, so that documentation stays current and code quality is enforced on every pull request.

#### Acceptance Criteria

1. THE Automation_Engine SHALL support a `--ci` flag that outputs results in JSON format containing, for each task: task name, status (pass, warning, or error), duration in milliseconds, and a list of finding messages
2. WHILE running in CI mode, IF any task produces warnings or errors, THEN THE Automation_Engine SHALL exit with code 1
3. THE Automation_Engine SHALL accept a `--timeout` option (in seconds, minimum 10, maximum 3600, default 120) that sets the maximum allowed duration per task
4. IF a task exceeds the configured timeout, THEN THE Automation_Engine SHALL terminate the task and include a timeout error entry in the JSON output with the task name and elapsed duration
5. WHILE running in CI mode, IF a task fails or times out, THEN THE Automation_Engine SHALL continue executing remaining tasks before exiting with a non-zero code
