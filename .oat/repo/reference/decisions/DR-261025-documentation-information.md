---
id: DR-261025-documentation-information
title: Documentation information architecture
date: 2026-10-25
status: accepted
legacy_id: null
---

# Documentation information architecture

## Context

docs/ holds 13 flat reader pages (architecture, game rules, development, styling, configuration, testing, docs contributing, API reference, game-logic reference, data model, deployment, mobile operator runbook) under one authored docs/index.md. The index groups Contents under Concepts, Getting started, Reference, and Operations headings and separately routes to workspace READMEs. Readers are the maintainers and agents building and operating Sequence Online; no separate consumer track or independent QA verification exists. This record captures the existing structure for OAT docs tooling 0.3.33 conformance without restructuring.

## Decision

Adopt the Flat Small preset (flat-small): one shared reader track rooted at docs/, kept as flat pages with no directory layers. The root docs/index.md groups Contents by page type (Concepts, Getting started, Reference, Operations), at most ten entries per group. New pages go flat in docs/ under the matching group; cross-cutting facts stay canonical in one page (environment in configuration.md, testing strategy in testing.md) and other pages link to them. Workspace-specific detail stays in the workspace README, linked from the index Package documentation section. No verification overlay.

## Consequences

The authored section lives in docs/contributing.md under Information architecture and is mirrored in .oat/config.json documentation.ia. Re-evaluate the preset if docs/ grows toward about 15 reader pages or if a separate consumer or QA audience appears; moving to directories would be a restructure requiring its own approval. Page-length warnings on api-reference.md and mobile-operator-runbook.md remain open until a split is approved.
