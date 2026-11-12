# Issue and pull request writing standard

Use this standard for GitHub issues, pull requests and Planforge tasks. Keep the existing meaning and evidence; do not rewrite historical observations as if they were newly verified.

## Titles

- GitHub PRs and implementation issues: use an imperative, concise Conventional Commit prefix such as `fix:`, `feat:`, `docs:`, `test:`, `refactor:` or `chore:`. Include a scope only when useful.
- Planforge: use a short descriptive title (e.g., `Argo MCP: consegna allegati come file`). Planforge's issue key already identifies the task.
- Avoid all-caps, filler, unsupported success claims and multiple topics in one title.

## GitHub issues

Use **Problem** (bug) or **Objective** (feature), then **Reproduction/Context**, **Expected behavior/Proposed changes**, **Acceptance criteria**, and **Validation and limitations**.

Keep steps measurable. On completion, update the same sections with real results instead of appending a second, contradictory report.

## Pull requests

Use these headings in English, in order:

1. **Summary**: what changes, why, and a link to the issue.
2. **Changes**: implementation details that matter to reviewers.
3. **Validation**: exact commands, results, and live/manual test coverage.
4. **Scope and safety**: affected components, compatibility, credentials/privacy, regressions, limitations.

For documentation-only changes, a short note in **Validation** (e.g., `Documentation-only; no runtime tests performed`) is better than invented test results. Avoid empty, irrelevant sections.

## Planforge issues

Use rich text, not pasted HTML source. Preferred Italian headings:

- **Obiettivo** or **Problema**
- **Contesto** or **Analisi** (only if useful)
- **Attività** for planned work, **Implementazione** for completed work
- **Verifiche**, distinguishing passed, not run and residual tests
- **Criteri di accettazione** for unfinished tasks, **Limiti** and **Riferimenti** if applicable

Keep the issue's actual workflow state authoritative. Do not leave a stale `In progress` sentence in a closed issue. The **ChatGPT Link** must stay in its dedicated custom field rather than only in the description.

## General rules

- Prefer direct sentences and concrete evidence: `npm test: 14/14 passed`, not `fully tested` if only unit tests ran.
- Keep credentials, signed storage URLs, student personal data and other secrets out of issues, PRs and logs.
- Use Markdown for GitHub and the Planforge rich-text format in Planforge.
- Do not use em dashes, decorative badges, emojis, generic cheerleading or speculative results in technical work items.
- Preserve history and scope; make substantive code changes through a reviewable PR instead of pushing directly to the public repository's default branch.
