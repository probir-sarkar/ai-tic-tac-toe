import { createFileRoute } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import {
  CELL_NAMES,
  boardStatusLabel,
  fallbackMove,
  getWinner,
} from '#/lib/tictactoe'
import type { Board, MoveResponse } from '#/lib/tictactoe'
import { requestAiMove as askJev } from '#/lib/aiMove'

export const Route = createFileRoute('/')({ component: GamePage })

const INTENT_LABELS: Record<string, string> = {
  win: 'a winning move',
  block: 'blocking your threat',
  fork: 'setting up a fork',
  develop: 'developing its position',
}

const markSpring = { type: 'spring', stiffness: 500, damping: 24 } as const

const thinkingPulse = stylex.keyframes({
  '0%, 100%': { backgroundColor: 'rgba(79, 184, 178, 0.07)' },
  '50%': { backgroundColor: 'rgba(79, 184, 178, 0.2)' },
})

const styles = stylex.create({
  page: {
    width: 'min(560px, calc(100% - 2rem))',
    marginInline: 'auto',
    paddingBlock: 'clamp(2.25rem, 6vw, 4rem)',
  },
  kicker: {
    margin: 0,
    marginBottom: '0.5rem',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    fontWeight: 700,
    fontSize: '0.69rem',
    color: 'var(--kicker)',
  },
  title: {
    margin: 0,
    marginBottom: '0.6rem',
    fontFamily: '"Fraunces", Georgia, serif',
    fontSize: 'clamp(2rem, 6vw, 2.9rem)',
    lineHeight: 1.05,
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: 'var(--sea-ink)',
  },
  subtitle: {
    margin: 0,
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: 'var(--sea-ink-soft)',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    marginTop: '1.75rem',
    marginInline: '0.25rem',
    marginBottom: '0.85rem',
    minHeight: '2.25rem',
  },
  status: {
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--sea-ink)',
  },
  dot: {
    width: '0.55rem',
    height: '0.55rem',
    borderRadius: '999px',
    backgroundColor: 'var(--lagoon)',
    flexShrink: 0,
  },
  dotPalm: { backgroundColor: 'var(--palm)' },
  dotsWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
  boardCard: {
    borderRadius: '1.5rem',
    border: '1px solid var(--line)',
    background:
      'linear-gradient(165deg, var(--surface-strong), var(--surface))',
    boxShadow:
      '0 1px 0 var(--inset-glint) inset, 0 22px 44px rgba(30, 90, 72, 0.1), 0 6px 18px rgba(23, 58, 64, 0.08)',
    padding: '0.9rem',
    backdropFilter: 'blur(4px)',
  },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.6rem',
  },
  cell: {
    aspectRatio: '1 / 1',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '1rem',
    border: '1px solid var(--line)',
    background: 'color-mix(in oklab, var(--surface-strong) 55%, transparent)',
    padding: 0,
    cursor: 'pointer',
    transitionProperty: 'border-color, transform, box-shadow',
    transitionDuration: '160ms',
    transitionTimingFunction: 'ease',
    ':hover': {
      borderColor: 'color-mix(in oklab, var(--lagoon-deep) 45%, var(--line))',
      transform: 'translateY(-1px)',
    },
    ':focus-visible': {
      outline: 'none',
      boxShadow:
        '0 0 0 3px color-mix(in oklab, var(--lagoon) 30%, transparent)',
    },
    ':disabled': { cursor: 'default' },
  },
  cellThinking: {
    animationName: thinkingPulse,
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    cursor: 'progress',
  },
  cellWin: {
    borderColor: 'color-mix(in oklab, var(--lagoon-deep) 60%, var(--line))',
    background: 'color-mix(in oklab, var(--lagoon) 16%, var(--surface-strong))',
    boxShadow: '0 0 0 3px color-mix(in oklab, var(--lagoon) 22%, transparent)',
  },
  mark: {
    fontSize: 'clamp(2.4rem, 9vw, 3.2rem)',
    fontWeight: 800,
    lineHeight: 1,
    userSelect: 'none',
  },
  markX: { color: 'var(--lagoon-deep)' },
  markO: { color: 'var(--palm)' },
  panel: {
    marginTop: '1.25rem',
    borderRadius: '1.25rem',
    border: '1px solid var(--line)',
    background: 'color-mix(in oklab, var(--chip-bg) 80%, transparent)',
    padding: '1.1rem 1.2rem',
  },
  panelHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    marginBottom: '0.85rem',
  },
  panelTitle: {
    margin: 0,
    fontSize: '0.8rem',
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--sea-ink-soft)',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    borderRadius: '999px',
    border: '1px solid var(--chip-line)',
    backgroundColor: 'var(--chip-bg)',
    padding: '0.3rem 0.65rem',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--sea-ink-soft)',
  },
  pillDot: {
    width: '0.45rem',
    height: '0.45rem',
    borderRadius: '999px',
    backgroundColor: 'var(--lagoon-deep)',
    flexShrink: 0,
  },
  meterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '0.55rem',
  },
  meterLabel: {
    width: '6.8rem',
    flexShrink: 0,
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--sea-ink-soft)',
    overflowWrap: 'anywhere',
  },
  meterTrack: {
    flex: 1,
    height: '0.5rem',
    borderRadius: '999px',
    backgroundColor: 'color-mix(in oklab, var(--line) 55%, transparent)',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, var(--lagoon), var(--palm))',
  },
  meterValue: {
    width: '2.8rem',
    flexShrink: 0,
    textAlign: 'right',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--sea-ink)',
  },
  intentText: {
    margin: 0,
    marginTop: '0.85rem',
    fontSize: '0.85rem',
    lineHeight: 1.5,
    color: 'var(--sea-ink-soft)',
  },
  alert: {
    margin: 0,
    marginTop: '0.85rem',
    borderRadius: '0.85rem',
    border: '1px solid rgba(193, 126, 42, 0.3)',
    background: 'rgba(193, 126, 42, 0.1)',
    padding: '0.7rem 0.85rem',
    fontSize: '0.8rem',
    lineHeight: 1.5,
    color: 'var(--sea-ink)',
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '1.4rem',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    border:
      '1px solid color-mix(in oklab, var(--lagoon-deep) 34%, var(--line))',
    borderRadius: '0.85rem',
    background: 'color-mix(in oklab, var(--lagoon) 22%, var(--surface-strong))',
    color: 'var(--sea-ink)',
    padding: '0.72rem 1.1rem',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    transitionProperty: 'background, transform',
    transitionDuration: '160ms',
    transitionTimingFunction: 'ease',
    ':hover': {
      transform: 'translateY(-1px)',
      background:
        'color-mix(in oklab, var(--lagoon) 30%, var(--surface-strong))',
    },
    ':focus-visible': {
      outline: 'none',
      boxShadow:
        '0 0 0 3px color-mix(in oklab, var(--lagoon) 30%, transparent)',
    },
    ':disabled': { cursor: 'not-allowed', opacity: 0.55, transform: 'none' },
  },
  retry: { marginInline: '0.5rem' },
  hint: {
    margin: 0,
    marginTop: '1rem',
    textAlign: 'center',
    fontSize: '0.8rem',
    color: 'var(--sea-ink-soft)',
  },
})

const AI_MOVE_TIMEOUT_MS = 30_000

function emptyBoard(): Board {
  return Array(9).fill(null)
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`Jev did not respond within ${ms / 1000}s`))
    }, ms)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function localFallbackMove(forBoard: Board, reason: string): MoveResponse {
  const cell = fallbackMove(forBoard, 'O')
  return {
    cell,
    source: 'fallback',
    reason,
    model: null,
    confidence: null,
    probabilities: null,
    intent: null,
    intentConfidence: null,
  }
}

function Meter({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div {...stylex.props(styles.meterRow)}>
      <span {...stylex.props(styles.meterLabel)}>{label}</span>
      <span {...stylex.props(styles.meterTrack)}>
        <motion.span
          {...stylex.props(styles.meterFill)}
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </span>
      <span {...stylex.props(styles.meterValue)}>{pct}%</span>
    </div>
  )
}

function ThinkingDots() {
  return (
    <span {...stylex.props(styles.dotsWrap)} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          {...stylex.props(styles.dot)}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.18,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  )
}

function GamePage() {
  const [board, setBoard] = useState<Board>(emptyBoard)
  const [busy, setBusy] = useState(false)
  const [ai, setAi] = useState<MoveResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gameId, setGameId] = useState(0)
  const gameIdRef = useRef(0)

  const result = getWinner(board)
  const status = boardStatusLabel(board)
  const myTurn = status === 'playing' && !busy && !error

  function applyAiMove(data: MoveResponse, gid: number) {
    if (gameIdRef.current !== gid) return
    setAi(data)
    setBoard((prev) =>
      prev[data.cell] == null
        ? prev.map((c, i) => (i === data.cell ? 'O' : c))
        : prev,
    )
  }

  async function requestAiMove(forBoard: Board, gid: number) {
    setBusy(true)
    setError(null)
    try {
      const data = await withTimeout(askJev({ data: forBoard }), AI_MOVE_TIMEOUT_MS)
      applyAiMove(data, gid)
    } catch (err) {
      if (gameIdRef.current !== gid) return
      const reason =
        err instanceof Error ? err.message : 'TypeSafe request failed'
      applyAiMove(localFallbackMove(forBoard, reason), gid)
    } finally {
      if (gameIdRef.current === gid) setBusy(false)
    }
  }

  function playCell(i: number) {
    if (!myTurn || board[i] !== null) return
    const next = [...board]
    next[i] = 'X'
    setAi(null)
    setBoard(next)
    if (boardStatusLabel(next) !== 'playing') return
    void requestAiMove(next, gameIdRef.current)
  }

  function reset() {
    const next = gameIdRef.current + 1
    gameIdRef.current = next
    setGameId(next)
    setBoard(emptyBoard())
    setAi(null)
    setError(null)
    setBusy(false)
  }

  function statusContent() {
    if (busy) {
      return (
        <>
          Jev is thinking
          <ThinkingDots />
        </>
      )
    }
    if (status === 'x_won') return 'You win!'
    if (status === 'o_won') return 'Jev wins this round'
    if (status === 'draw') return 'A draw — well played'
    if (error) return 'Hmm, Jev stalled.'
    return 'Your turn — place an X'
  }

  const dotStyle =
    busy || status === 'o_won'
      ? styles.dotPalm
      : status === 'playing'
        ? null
        : styles.cellWin

  const topCells = ai?.probabilities
    ? Object.entries(ai.probabilities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
    : []

  return (
    <main {...stylex.props(styles.page)}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <p {...stylex.props(styles.kicker)}>TypeSafe · TanStack Start</p>
        <h1 {...stylex.props(styles.title)}>Tic-Tac-Toe vs Jev</h1>
        <p {...stylex.props(styles.subtitle)}>
          You play X and move first. After each of your moves, Jev — TypeSafe's
          System One model — picks its square as a Choice question over the live
          board state.
        </p>
      </motion.div>

      <div {...stylex.props(styles.statusRow)}>
        <p {...stylex.props(styles.status)}>
          <span {...stylex.props(styles.dot, dotStyle)} />
          {statusContent()}
        </p>
      </div>

      <div {...stylex.props(styles.boardCard)}>
        <div {...stylex.props(styles.board)} key={gameId} role="grid">
          {board.map((cell, i) => {
            const winning = result?.line.includes(i) ?? false
            const isThinkingCell = busy && cell === null
            return (
              <button
                key={i}
                type="button"
                onClick={() => playCell(i)}
                disabled={!myTurn || cell !== null}
                aria-label={`${CELL_NAMES[i]}${cell ? ` — ${cell}` : ' — empty'}`}
                {...stylex.props(
                  styles.cell,
                  isThinkingCell && styles.cellThinking,
                  winning && styles.cellWin,
                )}
              >
                <AnimatePresence>
                  {cell && (
                    <motion.span
                      key={cell}
                      initial={{ scale: 0, opacity: 0, rotate: -20 }}
                      animate={{
                        scale: winning ? [1.14, 0.95, 1.05, 1] : 1,
                        opacity: 1,
                        rotate: 0,
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={
                        winning
                          ? { duration: 0.45, ease: 'easeOut' }
                          : markSpring
                      }
                    >
                      <span
                        {...stylex.props(
                          styles.mark,
                          cell === 'X' ? styles.markX : styles.markO,
                        )}
                      >
                        {cell}
                      </span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )
          })}
        </div>
      </div>

      <section {...stylex.props(styles.panel)} aria-live="polite">
        <div {...stylex.props(styles.panelHead)}>
          <h2 {...stylex.props(styles.panelTitle)}>Jev's read</h2>
          <span {...stylex.props(styles.pill)}>
            <span {...stylex.props(styles.pillDot)} />
            {ai?.source === 'fallback'
              ? 'local fallback'
              : (ai?.model ?? 'jev-latest')}
          </span>
        </div>

        {!ai && !error && (
          <p {...stylex.props(styles.subtitle)}>
            Make a move — Jev's read of the position will appear here.
          </p>
        )}

        {ai?.source === 'typesafe' && (
          <>
            {ai.confidence != null && (
              <Meter label="confidence" value={ai.confidence} />
            )}
            {topCells.map(([name, p]) => (
              <Meter key={name} label={name} value={p} />
            ))}
            {ai.intent && (
              <p {...stylex.props(styles.intentText)}>
                Jev plays{' '}
                <strong>{CELL_NAMES[ai.cell] ?? `cell ${ai.cell}`}</strong> — it
                sees this as {INTENT_LABELS[ai.intent] ?? ai.intent}.
              </p>
            )}
          </>
        )}

        {ai?.source === 'fallback' && (
          <p {...stylex.props(styles.alert)}>
            TypeSafe was unreachable ({ai.reason ?? 'unknown error'}), so Jev
            played a locally computed move.
          </p>
        )}

        {error && (
          <p {...stylex.props(styles.alert)}>
            {error}{' '}
            <button
              type="button"
              onClick={() => void requestAiMove(board, gameIdRef.current)}
              disabled={busy}
              {...stylex.props(styles.button, styles.retry)}
            >
              Retry
            </button>
          </p>
        )}
      </section>

      <div {...stylex.props(styles.controls)}>
        <button
          type="button"
          onClick={reset}
          disabled={busy}
          {...stylex.props(styles.button)}
        >
          New game
        </button>
      </div>

      <p {...stylex.props(styles.hint)}>
        Every Jev move is one TypeSafe request: the board goes in as state, the
        chosen square and its probabilities come back.
      </p>
    </main>
  )
}
