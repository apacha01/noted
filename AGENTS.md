# Repository guidance

## Testing policy

Only write tests for the most fundamental architectural and domain pieces.

- Keep the test suite deliberately small.
- Test only stable, pure invariants whose failure would undermine the application as a whole, such as the canonical pitch inventory and note-name mappings.
- Do not add UI, component, integration, end-to-end, snapshot, styling, browser-behavior, or implementation-detail tests unless the user explicitly requests them.
- Do not add a test merely because a feature or bug fix was implemented.
- Prefer type checking and a production build for general validation.
- Before adding a test dependency, confirm that it is required by a fundamental test and cannot be avoided.
