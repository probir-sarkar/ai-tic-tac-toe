import type { ComponentProps } from 'react'
import { cn } from '#/lib/utils'

export function LevelButton({
  active,
  ...props
}: ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'h-8 rounded-lg text-xs font-semibold tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30',
        active
          ? 'bg-zinc-950 text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-950'
          : 'border border-zinc-300 bg-white text-zinc-600 hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-50 dark:hover:text-zinc-50',
        props.className,
      )}
      {...props}
    />
  )
}
