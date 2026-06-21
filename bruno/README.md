# Bruno API Collection

This directory contains the Bruno collection for local Sequence API smoke
testing. It exercises Better Auth endpoints and tRPC HTTP routes without using
the browser UI.

## Requirements

Start the API locally first:

```bash
pnpm --filter @sequence/api dev
```

Use the `local` Bruno environment:

- `baseUrl=http://localhost:3001`
- `webOrigin=http://localhost:3000`

The collection relies on Bruno runtime variables set by earlier requests, so run
requests in sequence within each folder.

## Auth Folder

Run in order:

1. `signup`
2. `login`
3. `session`

`signup` generates a unique `bruno+<timestamp>@example.com` email and stores it
as the `email` variable for the later requests.

## Game Folder

Run in order:

1. `signup-host`
2. `create`
3. `preview`
4. `set-team`
5. `my-games`
6. `history-record`
7. `create-local`
8. `make-move`

The folder creates a host account, creates a remote lobby, captures `gameId` and
`inviteCode`, checks preview/team/my-games/history surfaces, creates a local
pass-and-play game, then exercises the `game.makeMove` rule-violation contract.

The final move intentionally targets a wild corner and should return a typed
`BAD_REQUEST` rule violation.

## Safety

- Do not commit Bruno generated variables, secrets, cookies, or local run state.
- Keep environment values local unless they are safe defaults.
- Use disposable local/test databases for collection runs.
- Do not point the collection at production unless you are intentionally doing
  operator smoke testing with disposable accounts.
