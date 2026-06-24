*Claude generated, human verified.*

# thomasdvornik.com

My personal site. Built as an Astro 5 app running on Cloudflare Workers, with a couple of live AI demos in the AI Labs section.

## Stack

- **Astro 5** with Cloudflare adapter (server-side rendering)
- **Cloudflare Workers** for hosting and runtime
- **Cloudflare AI** for the AI Labs demos (llama-3.3-70b-instruct via Workers AI binding)
- **Cloudflare KV** for rate limiting (2 requests per tool per IP per day)
- **React** for interactive islands (`client:only`)
- **Tailwind CSS** via Vite plugin
- **TypeScript** throughout
- GitHub Actions deploys on push to `master`

## Running locally

```sh
npm install
npm run dev
```

Runs on port 4322. The AI Labs features use Cloudflare's Workers AI binding. They'll return a 503 in local dev unless you have `npx wrangler login` and an active platform proxy session.

## Deploying

```sh
npm run deploy
```

Builds and deploys to Cloudflare Workers via wrangler. Or push to `master` and GitHub Actions handles it. Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets.

## AI Labs

Two demos running against a live llama-3.3-70b-instruct model via Cloudflare AI:

- **Steelman**: Give it a position or decision. It returns the strongest counterargument, rates how defensible you are (1-10), and names your weaknesses.
- **Vibe Check**: Give it a technical or career decision. It returns a gut-check rating, what you might be missing, and what you got right.

Both are rate-limited per IP at the Cloudflare Workers level. No API key needed to use the site.
