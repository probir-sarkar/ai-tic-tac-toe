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
        'relative grid aspect-square w-full place-items-center rounded-xl border transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30',
        winning
          ? 'border-emerald-500/40 bg-emerald-50'
          : playable && !filled
            ? 'cursor-pointer border-zinc-200 bg-zinc-50 hover:border-zinc-400'
            : 'cursor-default border-zinc-100',
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
                'select-none text-4xl font-semibold leading-none',
                mark === 'X' ? 'text-zinc-900' : 'text-emerald-600',
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
          className="absolute right-2 bottom-1.5 text-[10px] font-medium tabular-nums text-zinc-400"
        >
          {Math.round(probability * 100)}%
        </motion.span>
      )}
    </button>
  )
}
