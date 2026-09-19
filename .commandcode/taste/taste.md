# Taste

## Tooling
- Uses bun as the package manager; explicitly rejects npm commands (corrected "npm install" with "use bun"). Prefer `bun install` / `bunx` / `bun run` in all suggested commands. Confidence: 0.85

## Styling
- Prefers Tailwind CSS over CSS-in-JS (asked to remove StyleX and migrate to Tailwind). Confidence: 0.8
- Expects a `cn()` helper (clsx + tailwind-merge, shadcn convention) for conditional className composition rather than template strings. Confidence: 0.7

## Code style
- Wants clean, minimal component structure; asks for "clean code" and prefers small extracted components with typed props (e.g. `ComponentProps<'button'> & { active?: boolean }`, `className` merged via `cn`, props spread). Confidence: 0.65
