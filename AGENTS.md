# Repository Guidelines

- NO CHANGE IS ALLOWED IN THIS FILE UNLESS USER SPECIFICALLY ASKED FOR IT in a prompt that mentions "add to AGENTS.md etc etc...".
- Anytime a prompt contains the tag #donotact, or is evidently a question (contains a question mark or starts with interrogative phrasing like "why"), do not act directly on the basis of the prompt; only discuss it with the user and offer actionable options.

## Project Structure & Module Organization

## Build, Test, and Development Commands

### Automation Tags

### Integration Test Run Procedure

## Workspace Constraints

## Coding Style & Naming Conventions
- When you make a change to a file, focus on maintaining the original formatting, structure, coding style and indentation. trigger a warning when you cannot do it for some reason. Add only the necessary code you need to add for whatever you are doing. DO NOT CHANGE THE NAMES OF VARIABLES, FUNCTION NAMES, STRUCTURES - IF YOU NEED TO, ASK!
- Documentation files (guides, prompts, etc.) must use UPPERCASE names (e.g., `NETWORK_NOTES.md`).
- When writing docs/prompts, reference code by symbols (functions/classes/identifiers) instead of brittle line numbers; assume lines shift over time.

## Testing Guidelines
- Keep tests deterministic and fast; gate longer performance runs locally or mark with `skip:` when necessary.

## Commit & Pull Request Guidelines
- Commits: write concise, imperative messages, using fewer words to explain what was done.
- every successful change should be recorded in `CHANGELOG.md` matching the file format. Each point should be descriptive of what was done: a bit more descriptive than commit messages, maybe pointing also at the file / line number where the change was made
- In case you will find a WIP.md file in the current branch where you got invoked, read it and use it as instruction base to continue the job you were doing

## Standard Merge Workflows

## Security & Configuration Tips
- Avoid secrets in code.
- NSD discovery type is defined in `lib/network/nsd.dart`; coordinate with companion apps before changing.

## Optimization Mindset
- When proposing or making optimizations, first ask: “What is this function/block doing, and what feature would be affected if I removed it?” Make that consideration explicit to the user before suggesting or applying changes.
