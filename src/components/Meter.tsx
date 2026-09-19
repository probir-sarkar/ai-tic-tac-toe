import { motion } from 'motion/react'

export function Meter({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-24 shrink-0 truncate font-medium text-zinc-600 dark:text-zinc-300">
        {label}
      </span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <motion.span
          className="block h-full rounded-full bg-emerald-600 dark:bg-emerald-400"
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        />
      </span>
      <span className="w-9 shrink-0 text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {pct}%
      </span>
    </div>
  )
}
