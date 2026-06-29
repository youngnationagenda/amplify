# Implementation Plan: Task Automation

## Overview

Implement a CLI-based developer automation system for the Net Tribe Carbon platform. The system provides a unified `npm run automate` entry point that orchestrates documentation generation, code cleanup, and API scaffolding tasks. Built with `tsx` for direct TypeScript execution, Zod for config validation, and the TypeScript Compiler API for static analysis.

## Tasks

- [ ] 1. Set up project structure and core interfaces
  - [ ] 1.1 Create directory structure and core type definitions
    - Create `scripts/lib/` directory
    - Create `scripts/__tests__/properties/`, `scripts/__tests__/unit/`, `scripts/__tests__/integration/` directories
    - Define shared interfaces in `scripts/lib/types.ts`: `CLIArgs`, `TaskDefinition`, `TaskResult`, `TaskRegistry`, `CLIFlags`
    - Add `vitest` and `fast-check` to devDependencies in `package.json`
    - Add scripts to `package.json`: `"automate": "tsx scripts/automate.ts"`, `"test:automate": "vitest --run scripts/__tests__/"`, `"test:automate:props": "vitest --run scripts/__tests__/properties/"`
    - _Requirements: 1.1, 1.2_

  - [ ] 1.2 Implement config loader with Zod validation
    - Create `scripts/lib/config.ts`
    - Define `AutomateConfigSchema` using Zod with task-level `enabled`, `outputDir`, `include`, `exclude` fields
    - Implement `loadConfig()` that reads `.automaterc.json`, returns defaults when file is missing, and reports parse/schema errors with line number or key path
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 1.3 Implement task registry
    - Create `scripts/lib/registry.ts`
    - Implement `TaskRegistry` as a `Map<string, TaskDefinition>` with `register()` and `resolve()` methods
    - Register placeholder handlers for all 7 tasks: `docs:api`, `docs:components`, `clean:format`, `clean:lint`, `clean:dead-code`, `scaffold:graphql`, `scaffold:rest`
    - _Requirements: 1.2, 1.3_

  - [ ] 1.4 Implement CLI entry point with argument parsing and task execution
    - Create `scripts/automate.ts`
    - Parse CLI arguments: task names (comma-separated), `--ci`, `--timeout`, `--json` flags
    - Display available task list when invoked without arguments or whitespace-only input (exit 0)
    - Print error with valid task names to stderr for unrecognized tasks (exit 1)
    - Execute tasks sequentially in normal mode (halt on first failure)
    - Execute all tasks in CI mode (continue on failure, JSON output)
    - Implement timeout via `AbortController` with bounds validation [10, 3600]
    - Set process exit code based on results
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 2. Checkpoint - Verify core infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Implement Amplify schema parser
  - [ ] 3.1 Create Amplify schema parser using TypeScript Compiler API
    - Create `scripts/lib/schema-parser.ts`
    - Parse `amplify/data/resource.ts` using `ts.createSourceFile` and AST traversal
    - Extract model definitions with fields (name, type, required, default values)
    - Extract secondary indexes (field names)
    - Extract authorization rules (identity type, groups, allowed operations)
    - Extract enum definitions and their values
    - Return `SchemaParseResult` with `models: ParsedModel[]` and `enums: ParsedEnum[]`
    - _Requirements: 3.1, 3.2, 3.4, 3.6_

  - [ ]* 3.2 Write property test for schema parser
    - **Property 5: API doc generation produces correctly named files with complete content**
    - **Property 6: Enum documentation completeness**
    - **Validates: Requirements 3.1, 3.2, 3.4**

- [ ] 4. Implement documentation generation tasks
  - [ ] 4.1 Implement `docs:api` task handler
    - Create `scripts/lib/tasks/docs-api.ts`
    - Use schema parser to get models and enums
    - Generate one Markdown file per model named in kebab-case (e.g., `carbon-credit.md`)
    - Include fields, types, required status, defaults, secondary indexes, and auth rules in each file
    - Generate `enums.md` with all enum definitions and values
    - Add ISO 8601 timestamp + source path header comment to each generated file
    - Create output directory if it doesn't exist (default: `docs/api/`)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 4.2 Write property test for generated file header format
    - **Property 7: Generated file header format**
    - **Validates: Requirements 3.5**

  - [ ] 4.3 Implement component props parser using TypeScript Compiler API
    - Create `scripts/lib/component-parser.ts`
    - Recursively scan `.tsx` files in `src/components/`
    - Identify exported React components and their props interfaces
    - Extract prop name, TypeScript type, required/optional status, default value from destructuring
    - Extract JSDoc descriptions from interface and property comments
    - Determine group from immediate subdirectory (rider, investor, wallet, celo, ui) or "shared"
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7_

  - [ ] 4.4 Implement `docs:components` task handler
    - Create `scripts/lib/tasks/docs-components.ts`
    - Use component parser to get all component definitions
    - Generate one Markdown file per component in `docs/components/` (or configured output dir)
    - Organize by subdirectory group
    - Generate table of contents with anchor links
    - Include "no props" indication for components without props interfaces
    - Print summary (component count + output path) on success
    - Add ISO 8601 timestamp header to generated files
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 4.5 Write property tests for component documentation
    - **Property 8: Component prop extraction completeness**
    - **Property 9: JSDoc inclusion in component docs**
    - **Property 10: Component grouping by subdirectory**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [ ] 5. Checkpoint - Verify documentation generation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement code cleanup tasks
  - [ ] 6.1 Implement `clean:format` task handler
    - Create `scripts/lib/tasks/clean-format.ts`
    - Use Prettier Node API to format all `.ts` and `.tsx` files
    - Apply project Prettier config or default (2-space indent, single quotes, trailing commas "all", print width 100, semicolons)
    - Enforce 2-space indentation regardless of project config
    - Skip files matching `node_modules/`, `dist/`, `.amplify/`, and `.gitignore` patterns
    - Skip unparseable files with a warning
    - Print summary: files reformatted count + already-compliant count
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 6.2 Implement `clean:lint` task handler
    - Create `scripts/lib/tasks/clean-lint.ts`
    - Use ESLint Node API with auto-fix on all `.ts` and `.tsx` files
    - Respect existing `eslint.config.js` configuration
    - Print count of issues fixed and remaining issues
    - Exit non-zero when lint errors remain after auto-fix; exit 0 when all resolved
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 6.3 Implement dead code analyzer
    - Create `scripts/lib/dead-code.ts`
    - Use TypeScript Compiler API to build module dependency graph across `src/`
    - Detect unused exports (exported symbols not imported by any other file)
    - Detect unused imports (imported bindings not referenced in file)
    - Detect unused components (components not statically imported by any file in `src/`)
    - Flag items in `src/integrations/supabase/` as `migrationCandidate: true`
    - Skip files that fail to parse gracefully
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 6.4 Implement `clean:dead-code` task handler
    - Create `scripts/lib/tasks/clean-dead-code.ts`
    - Use dead code analyzer to produce report
    - Support `--json` flag to write `dead-code-report.json` (empty array when no items found)
    - Print summary with counts per category (unused exports, imports, components, migration candidates)
    - Print "zero dead code items" message and exit 0 when nothing found
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 6.5 Write property tests for dead code detection
    - **Property 11: File exclusion filter correctness**
    - **Property 12: Dead code detection accuracy — unused exports**
    - **Property 13: Dead code detection accuracy — unused imports**
    - **Property 14: Migration candidate labeling**
    - **Property 15: Dead code JSON report serialization round-trip**
    - **Validates: Requirements 5.4, 6.1, 6.2, 6.4, 6.5**

- [ ] 7. Checkpoint - Verify code cleanup tasks
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement API scaffolding tasks
  - [ ] 8.1 Implement GraphQL hook generator
    - Create `scripts/lib/graphql-scaffolder.ts`
    - Use schema parser to get model definitions
    - Generate one `use{ModelName}.ts` file per model in configured output dir (default: `src/hooks/generated/`)
    - Generate hooks for list, get, create, update, and delete operations per model
    - Import from `@/integrations/amplify/client` in generated hooks
    - Include type-safe parameters and return types inferred from model fields
    - Add ISO 8601 timestamp header to generated files
    - Create output directory if it doesn't exist
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 8.2 Implement hash-based incremental generation for GraphQL scaffolder
    - Create `.automate-cache.json` management in `scripts/lib/cache.ts`
    - Compute SHA-256 hash of each model's definition (fields, auth rules, indexes)
    - Compare against stored hashes to determine changed models
    - Regenerate only files for models with changed hashes
    - Update cache file after successful generation
    - _Requirements: 7.6_

  - [ ] 8.3 Implement `scaffold:graphql` task handler
    - Create `scripts/lib/tasks/scaffold-graphql.ts`
    - Wire GraphQL scaffolder with cache-based incremental generation
    - Report generated/skipped file counts in task result
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 8.4 Write property tests for GraphQL scaffolding
    - **Property 16: GraphQL hook generation completeness**
    - **Property 17: Incremental GraphQL generation**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.6**

  - [ ] 8.5 Implement REST client generator
    - Create `scripts/lib/rest-scaffolder.ts`
    - Parse OpenAPI 3.x spec from configured file path
    - Generate one exported async function per unique operation (method + path)
    - Generate typed parameters for path params, query params, and request body
    - Generate TypeScript interfaces from OpenAPI schemas
    - Generate Zod validation schemas for request/response bodies
    - Throw typed errors (with status code + response body) on non-2xx responses
    - Overwrite existing generated files without prompting
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.6, 8.7, 8.8_

  - [ ] 8.6 Implement `scaffold:rest` task handler
    - Create `scripts/lib/tasks/scaffold-rest.ts`
    - Wire REST scaffolder with config (spec path, output dir)
    - Handle missing spec file (exit non-zero with path in error)
    - Handle invalid spec (exit non-zero with validation failure location)
    - Add ISO 8601 timestamp header to generated files
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 8.7 Write property tests for REST scaffolding
    - **Property 18: REST client generation from OpenAPI spec**
    - **Property 19: Zod schema generation from OpenAPI**
    - **Property 20: REST client typed error on non-2xx response**
    - **Validates: Requirements 8.2, 8.3, 8.6, 8.7**

- [ ] 9. Checkpoint - Verify API scaffolding tasks
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Wire everything together and CI integration
  - [ ] 10.1 Register all task handlers in the registry and finalize CLI
    - Update `scripts/lib/registry.ts` to import and register all 7 implemented task handlers
    - Verify sequential execution halts on first failure in normal mode
    - Verify CI mode executes all tasks and produces JSON output
    - Verify timeout enforcement with AbortController
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ] 10.2 Create default `.automaterc.json` configuration file
    - Create `.automaterc.json` in project root with all tasks enabled
    - Set default output directories per the design spec
    - Set `scaffold:rest` to disabled by default (no OpenAPI spec yet)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 10.3 Write property tests for CLI routing and CI mode
    - **Property 1: CLI argument routing correctness**
    - **Property 2: Sequential task failure halts remaining tasks**
    - **Property 3: Config validation rejects invalid input**
    - **Property 4: Task enablement follows config flags**
    - **Property 21: CI mode JSON output completeness**
    - **Property 22: CI mode continues on failure**
    - **Property 23: Timeout validation bounds**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 2.3, 2.5, 2.6, 10.1, 10.3, 10.5**

  - [ ]* 10.4 Write unit tests for config loader, schema parser, and component parser
    - Test config loading with missing file returns defaults
    - Test output directory creation when missing
    - Test file header timestamp format (ISO 8601 examples)
    - Test components without props interfaces included with "no props"
    - Test zero dead-code-items message
    - Test ESLint remaining issues → exit code mapping
    - _Requirements: 2.2, 3.5, 4.7, 6.7, 9.3_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project already has `zod`, `tsx`, `typescript`, and `eslint` as dependencies
- `vitest` and `fast-check` need to be added as devDependencies in task 1.1
- All generated code uses TypeScript with ESM module format
- The `@/` path alias resolves to `./src` per Vite config

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2", "4.3", "6.1", "6.2"] },
    { "id": 5, "tasks": ["4.1", "4.4", "6.3"] },
    { "id": 6, "tasks": ["4.2", "4.5", "6.4", "8.1"] },
    { "id": 7, "tasks": ["6.5", "8.2", "8.5"] },
    { "id": 8, "tasks": ["8.3", "8.6"] },
    { "id": 9, "tasks": ["8.4", "8.7"] },
    { "id": 10, "tasks": ["10.1", "10.2"] },
    { "id": 11, "tasks": ["10.3", "10.4"] }
  ]
}
```
