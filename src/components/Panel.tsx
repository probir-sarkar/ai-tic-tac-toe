import type { ComponentProps, ReactNode } from 'react'
import { cn } from '#/lib/utils'

export function Panel({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_1px_2px_rgba(9,9,11,0.06),0_16px_32px_-20px_rgba(9,9,11,0.4)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_1px_2px_rgba(0,0,0,0.6),0_16px_32px_-20px_rgba(0,0,0,0.9)]',
        className,
      )}
      {...props}
    />
  )
}

export function PanelTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
      {children}
    </h2>
  )
}
