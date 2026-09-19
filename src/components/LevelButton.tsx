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
        'h-7 rounded-md text-xs font-medium tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30',
        active
          ? 'bg-zinc-900 text-white'
          : 'border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700',
        props.className,
      )}
      {...props}
    />
  )
}
