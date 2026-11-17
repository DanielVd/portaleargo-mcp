# Contributing

## Commit attribution

Use Conventional Commit subjects (for example, `fix:`, `feat:`, `docs:`, `test:`). For AI-assisted changes where the maintainer requests Codex credit, use this Git commit trailer:

```
Co-authored-by: Codex <codex@openai.com>
```

GitHub associates this address with [Codex](https://github.com/codex) and its profile avatar. Do not use the `chatgpt-codex-connector[bot]` address for this credit. Place the trailer in the commit message, not in a custom PR-description section. Preserve human and automation authors accurately.

## Pull requests

Use the existing pull request template. In `Validation`, describe only tests actually performed and their results, including when runtime tests were not necessary. Keep fixes and releases on short-lived branches; GitHub is configured to delete the source branch after merge.
