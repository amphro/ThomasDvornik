# CLAUDE.md

> ***🤖 Claude generated · Human verified***

AI Labs features (Steelman, Vibe Check) use Cloudflare AI and KV bindings. They return 503 in local dev unless wrangler platform proxy is active (`npx wrangler login` first).

The `RATE_LIMIT` KV namespace in `wrangler.jsonc` must exist in the Cloudflare account and be bound before deploy.
