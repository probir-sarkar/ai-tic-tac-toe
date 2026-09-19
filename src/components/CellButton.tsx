import { AnimatePresence, motion } from 'motion/react'
import type { ComponentProps } from 'react'
import { CELL_NAMES } from '#/lib/tictactoe'
import { cn } from '#/lib/utils'

const MARK_SPRING = { type: 'spring', stiffness: 500, damping: 24 } as const

export function CellButton({
  index,
  mark,
  winning,
  playable,
  thinking,
  probability,
  onCellClick,
  className,
  ...props
}: ComponentProps<'button'> & {
  index: number
  mark: string | null
  winning: boolean
  playable: boolean
  thinking: boolean
  probability: number | undefined
  onCellClick: (index: number) => void
}) {
  const filled = mark !== null
  return (
    <button
      type="button"
      onClick={() => onCellClick(index)}
      disabled={!playable || filled}
      aria-label={`${CELL_NAMES[index]}${filled ? ` — ${mark}` : ' — empty'}`}
      className={cn(
        'relative grid aspect-square w-full place-items-center rounded-2xl border-2 transition-all duration-150 outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25',
        winning
          ? 'border-emerald-500 bg-emerald-100 shadow-[0_10px_24px_-12px_rgba(16,185,129,0.7)] dark:border-emerald-400 dark:bg-emerald-500/15 dark:shadow-[0_10px_24px_-12px_rgba(16,185,129,0.6)]'
          : playable && !filled
            ? 'cursor-pointer border-zinc-300 bg-white shadow-sm hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-emerald-400'
            : 'cursor-default border-zinc-200 bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-900/60',
        thinking && 'animate-pulse',
        className,
      )}
      {...props}
    >
      <AnimatePresence>
        {mark && (
          <motion.span
            key={mark}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: winning ? [1.08, 1] : 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={
              winning ? { duration: 0.3, ease: 'easeOut' } : MARK_SPRING
            }
          >
            <span
              className={cn(
                'select-none text-5xl font-bold leading-none',
                mark === 'X'
                  ? 'text-zinc-950 dark:text-zinc-50'
                  : 'text-emerald-600 dark:text-emerald-400',
              )}
            >
              {mark}
            </span>
          </motion.span>
        )}
      </AnimatePresence>
      {probability !== undefined && !filled && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute right-2 bottom-1.5 text-[10px] font-semibold tabular-nums text-zinc-500 dark:text-zinc-400"
        >
          {Math.round(probability * 100)}%
        </motion.span>
      )}
    </button>
  )
}
