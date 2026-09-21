# AI Tic-Tac-Toe

Play tic-tac-toe against an AI powered by [TypeSafe System One](https://typesafe.ai). Choose a difficulty, make your move as **X**, and watch the AI reveal move probabilities before playing **O**.

Built with [TanStack Start](https://tanstack.com/start), deployed on [Cloudflare Workers](https://workers.cloudflare.com).

## Features

- Three difficulty levels: Easy, Medium, Hard
- Live AI analysis with confidence meters and tactical intent
- Animated probability reveal before each AI move
- Local fallback when the AI service is unreachable
- Light and dark theme
- SEO, Open Graph, JSON-LD, sitemap, robots.txt, and llms.txt

## Getting started

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create a `.env` file for local development:

```bash
TYPESAFE_API_KEY=your_typesafe_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

For production on Cloudflare Workers:

```bash
wrangler secret put TYPESAFE_API_KEY
wrangler secret put OPENROUTER_API_KEY
```

Set your public site URL for canonical links and social previews:

```bash
# .env (local) or wrangler.jsonc vars (production)
VITE_SITE_URL=https://your-domain.com
```

If `VITE_SITE_URL` is not set, the app defaults to `https://ai-tic-tac-toe.workers.dev`.

## Scripts

```bash
bun run dev       # Start dev server on port 3000
bun run build     # Production build (includes static prerender)
bun run deploy    # Build and deploy to Cloudflare Workers
bun run lint      # ESLint
bun run format    # Prettier + ESLint fix
bun run check     # Prettier check
```

## Deploy

```bash
wrangler login
bun run deploy
```

The project uses the Cloudflare Vite plugin (`vite.config.ts`) and `wrangler.jsonc`.

## SEO and AI discoverability

Metadata is centralized in `src/lib/seo.ts` and applied via TanStack Router `head` options.

| Asset / route | Purpose |
|---|---|
| `public/favicon.svg` | Site icon |
| `public/apple-touch-icon.png` | iOS home screen icon (rendered from favicon) |
| `public/og-image.jpg` | Open Graph / Twitter preview image |
| `public/site.webmanifest` | PWA manifest |
| `/sitemap.xml` | Search engine sitemap |
| `/robots.txt` | Crawler rules (includes GPTBot, Claude-Web, PerplexityBot) |
| `/llms.txt` | Machine-readable project summary for AI systems |

Structured data (JSON-LD) on the home page:

- `WebApplication`
- `VideoGame`
- `FAQPage`

## Tech stack

- TanStack Start + TanStack Router (React 19)
- TypeSafe AI SDK (`@typesafe-ai/sdk`) via OpenRouter
- Tailwind CSS v4
- Cloudflare Workers

## Project structure

```
src/
  routes/           # File-based routes (__root, index, robots.txt, sitemap.xml, llms.txt)
  lib/
    seo.ts          # Site metadata, JSON-LD, llms.txt content
    tictactoe.ts    # Game logic
    aiMove.server.ts
  components/       # UI components
public/             # Static assets (favicon, OG image, manifest)
```

## License

Open source.
