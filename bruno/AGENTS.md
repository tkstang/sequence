# Bruno Collection Instructions

This directory is a Bruno API smoke collection.

- Keep `.bru` files deterministic and safe to run against local/test databases.
- Do not commit generated cookies, request history, secrets, or environment
  overrides.
- Preserve the request order inside folders; later requests depend on variables
  captured by earlier requests.
- Use `{{baseUrl}}` and `{{webOrigin}}` variables instead of hard-coded local or
  production hosts.
- Prefer disposable `example.com` test identities generated in pre-request
  scripts.
- If adding production smoke requests, document that they must use disposable
  accounts and must not mutate real user data.

See `bruno/README.md` for how to run the collection in Bruno.
