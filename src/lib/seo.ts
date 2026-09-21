export const SITE_NAME = 'AI Tic-Tac-Toe'
export const SITE_TAGLINE = 'Play against TypeSafe AI with live move probabilities'
export const SITE_TITLE = 'AI Tic-Tac-Toe | TypeSafe AI with move probabilities'
export const META_DESCRIPTION =
  'Free tic-tac-toe vs TypeSafe AI. Pick Easy, Medium, or Hard, watch move probabilities before each play, and see confidence scores in real time.'
export const SOCIAL_DESCRIPTION =
  'Free tic-tac-toe against TypeSafe AI. Three difficulty levels and live move probabilities before every AI play.'
export const SITE_DESCRIPTION =
  'Free browser tic-tac-toe against an AI powered by TypeSafe System One. Choose Easy, Medium, or Hard difficulty, watch the AI reveal move probabilities before each play, and see confidence scores and tactical intent in real time. Built with TanStack Start on Cloudflare Workers.'
export const SITE_KEYWORDS = [
  'AI tic-tac-toe',
  'tic tac toe AI',
  'play tic-tac-toe online',
  'TypeSafe AI game',
  'AI board game',
  'move probabilities',
  'browser game',
  'free tic-tac-toe',
  'TanStack Start',
  'Cloudflare Workers',
].join(', ')

const DEFAULT_SITE_URL = 'https://ai-tic-tac-toe.probir.dev'

export function getSiteUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL as string | undefined
  if (configured) return configured.replace(/\/$/, '')
  return DEFAULT_SITE_URL
}

export function absoluteUrl(path = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getSiteUrl()}${normalized}`
}

export const OG_IMAGE = {
  url: '/og-image.jpg',
  width: 1672,
  height: 941,
  type: 'image/jpeg',
  alt: 'AI Tic-Tac-Toe — play against TypeSafe AI with visible move probabilities on a 3×3 board',
} as const

export function webApplicationJsonLd() {
  const siteUrl = getSiteUrl()
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: siteUrl,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    image: absoluteUrl(OG_IMAGE.url),
    featureList: [
      'Three difficulty levels: Easy, Medium, Hard',
      'AI move probability reveal before each play',
      'Confidence meters and tactical intent labels',
      'Local fallback when the AI service is unreachable',
      'Light and dark theme',
    ],
    author: {
      '@type': 'Organization',
      name: 'AI Tic-Tac-Toe',
    },
  }
}

export function videoGameJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: getSiteUrl(),
    genre: ['Board Game', 'Strategy', 'Puzzle'],
    gamePlatform: 'Web browser',
    playMode: 'SinglePlayer',
    numberOfPlayers: {
      '@type': 'QuantitativeValue',
      minValue: 1,
      maxValue: 1,
    },
    characterAttribute: [
      { '@type': 'Thing', name: 'Human player', description: 'Plays X' },
      { '@type': 'Thing', name: 'AI opponent', description: 'Plays O via TypeSafe System One' },
    ],
  }
}

export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is AI Tic-Tac-Toe?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'AI Tic-Tac-Toe is a free web game where you play X against an AI opponent (O) powered by TypeSafe System One models. Before each AI move, the app reveals top cell probabilities and shows confidence and intent analysis.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do difficulty levels work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Easy lets the AI make more exploratory moves. Medium balances tactics and model judgment. Hard enforces winning and blocking moves when available, then uses the strongest AI evaluation.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does the game work without an API key?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'Yes. If TypeSafe or OpenRouter credentials are missing or unreachable, the server falls back to a locally computed tactical move so gameplay continues.',
        },
      },
      {
        '@type': 'Question',
        name: 'What technology powers this app?',
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            'The frontend uses TanStack Start and React 19. AI moves are generated server-side on Cloudflare Workers via TypeSafe SDK and OpenRouter. Styling uses Tailwind CSS v4.',
        },
      },
    ],
  }
}

export function llmsTxt(): string {
  const siteUrl = getSiteUrl()
  return `# ${SITE_NAME}

> ${SITE_TAGLINE}

${SITE_DESCRIPTION}

## Canonical URL
${siteUrl}

## What this project is
A single-page browser game where a human plays tic-tac-toe (X) against an AI (O). The AI uses TypeSafe System One structured choice models to evaluate empty cells, then the UI animates probability bars for the top candidate moves before placing O.

## Key features
- Difficulty: Easy, Medium, Hard
- Live AI analysis panel with confidence, probabilities, and intent (win, block, fork, develop)
- Graceful local fallback when the AI backend is unavailable
- Accessible board controls and light/dark theme
- Server-rendered SEO, Open Graph metadata, JSON-LD, sitemap, and robots.txt

## How to play
1. Open ${siteUrl}
2. Pick a difficulty before the first move
3. Tap an empty cell to play X
4. Watch AI thinking, probability reveal, and final move
5. Start a new game anytime with the reset button

## Tech stack
- TanStack Start + TanStack Router (React 19)
- Cloudflare Workers deployment
- TypeSafe AI SDK (@typesafe-ai/sdk) with OpenRouter
- Tailwind CSS v4

## Public routes
- Home: ${siteUrl}/
- Sitemap: ${siteUrl}/sitemap.xml
- Robots: ${siteUrl}/robots.txt
- LLMs: ${siteUrl}/llms.txt

## License
Open source — see repository README for details.
`
}
