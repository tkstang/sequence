---
title: Contributing to documentation
description: Authoring conventions, context, and Markdown navigation rules.
---

# Contributing to documentation

Maintain documentation for **Sequence Online** as authored Markdown pages. Start
from the [documentation index](index.md) to understand the intended audience and
where each topic belongs.

## Structure and context

- Give every Markdown-bearing directory an authored `index.md` with useful
  context: purpose, audience, ownership, and how its pages relate.
- Maintain a populated `## Contents` map. Link sibling pages as `page.md` and
  immediate child directories as `section/index.md`. Link only existing files.
- Asset-only directories do not need an index.
- Add `title` and `description` metadata to authored pages. Use relative `.md`
  links so navigation works when reading the repository directly.
- Keep each `description` between 40 and 160 characters and grounded in what
  the page actually covers.
- Group `## Contents` entries under `###` headings with at most ten entries per
  group. Contents links must stay inside `docs/`; link pages outside it (root
  `README.md`, `CONTRIBUTING.md`, workspace READMEs) from prose or the
  Package documentation section instead.
- Preserve existing local instructions and repository-specific guidance.

## Information architecture

The accepted record is
`.oat/repo/reference/decisions/DR-261025-documentation-information.md`
(preset: Flat Small, `flat-small`).

| Track | Readers | Organizing principle |
| --- | --- | --- |
| `docs/` | Maintainers and agents building and operating Sequence Online | Flat pages; the root index groups Contents by page type: Concepts, Getting started, Reference, and Operations |

- Add new pages flat in `docs/` and list them under the matching index group.
  Do not add directory layers; moving to directories is a restructure that
  needs its own approval.
- Keep one canonical page per fact: environment variables in
  `configuration.md`, the testing strategy in `testing.md`. Other pages link to
  them.
- Keep workspace-specific detail in the workspace README and route to it from
  the index Package documentation section.
- No verification overlay: there is no separate Product or QA reader track.
- Re-evaluate the preset when `docs/` approaches about 15 reader pages or a
  separate consumer or QA audience appears.

## Review and verification

Use `oat-docs-analyze` to identify content, metadata, and navigation gaps, then
`oat-docs-apply` for approved repairs. Adoption establishes entrypoints and
configuration; review the existing tree before treating it as complete.

Check relative links, Contents maps, metadata, and context after edits. Selected
existing tools: lint `none`, format `none`. Use repository
checks when available; this setup does not install tools or require a site build.

Run the docs checker before opening a PR; it must report zero errors:

```bash
oat docs check --target-dir docs
```

CI runs the same check on pull requests that touch `docs/` with the pinned
`@open-agent-toolkit/cli` devDependency (`pnpm exec oat docs check --target-dir docs`).

The authored index is not a generated manifest. If an optional inventory is
needed, run `oat docs generate-index` with an explicit output outside the
configured content tree and keep the authored entrypoint unchanged.
