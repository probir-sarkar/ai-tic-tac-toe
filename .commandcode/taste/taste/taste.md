# Taste
- Uses bun as the package manager; explicitly rejects npm commands (corrected "npm install" with "use bun"). Prefer `bun install` / `bunx` / `bun run` in all suggested commands. Confidence: 0.85
- Prefers `lucide-react` for icons (explicitly requested it for the dark mode toggle). Confidence: 0.75
- Prefers Tailwind CSS over CSS-in-JS (asked to remove StyleX and migrate to Tailwind). Confidence: 0.8
- Expects a `cn()` helper (clsx + tailwind-merge, shadcn convention) for conditional className composition rather than template strings. Confidence: 0.7
- Dislikes washed-out, low-contrast designs (criticized a UI as "too lite"); wants weight and visual depth — stronger contrast, bolder/larger type, visible borders, darker ink, and layered shadows rather than pale greys and flat surfaces. Confidence: 0.6
- Wants clean, minimal component structure; asks for "clean code" and prefers small extracted components with typed props (e.g. `ComponentProps<'button'> & { active?: boolean }`, `className` merged via `cn`, props spread). Confidence: 0.65
- Communicates in terse, lowercase, unpunctuated fragments that reference prior context implicitly (e.g. "if 0% possibilies then ignore and reduce time also"); expects the agent to infer the intended scope and state its interpretation of ambiguous asks rather than block on questions (e.g. "remove local ai and only three level please easy medium and hard"). Confidence: 0.6
