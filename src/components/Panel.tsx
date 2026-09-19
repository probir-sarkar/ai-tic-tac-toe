import type { ComponentProps, ReactNode } from 'react'
import { cn } from '#/lib/utils'

export function Panel({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs',
        className,
      )}
      {...props}
    />
  )
}

export function PanelTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
      {children}
    </h2>
  )
}
