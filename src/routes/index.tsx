import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import {
  CELL_NAMES,
  GAME_LEVELS,
  LEVEL_LABELS,
  availableCells,
  boardStatusLabel,
  fallbackMove,
  getWinner,
  syntheticProbabilities,
} from '#/lib/tictactoe'
import type { Board, GameLevel, MoveResponse } from '#/lib/tictactoe'
import { requestAiMove as askAi } from '#/lib/aiMove'
import { CellButton } from '#/components/CellButton'
import { LevelButton } from '#/components/LevelButton'
import { Meter } from '#/components/Meter'
import { Panel, PanelTitle } from '#/components/Panel'
import { ThemeToggle } from '#/components/ThemeToggle'
import { ThinkingDots } from '#/components/ThinkingDots'

export const Route = createFileRoute('/')({ component: GamePage })

const INTENT_LABELS: Record<string, string> = {
  win: 'a winning move',
  block: 'blocking your threat',
  fork: 'setting up a fork',
  develop: 'developing its position',
}

const THINKING_MIN_MS = 350
const REVEAL_STAGGER_MS = 110
const MOVE_DELAY_MS = 250
const AI_MOVE_TIMEOUT_MS = 30_000

function emptyBoard(): Board {
  return Array(9).fill(null)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`AI did not respond within ${ms / 1000}s`))
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

function buildCellProbs(
  board: Board,
  chosen: number,
  probabilities: Record<string, number> | null,
): Record<number, number> {
  const filled = probabilities ?? syntheticProbabilities(board, chosen)
  const result: Record<number, number> = {}
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      result[i] = filled[CELL_NAMES[i]] ?? 0
    }
  }
  return result
}

const REVEAL_TOP = 3

function revealOrder(
  board: Board,
  probabilities: Record<number, number>,
): number[] {
  return availableCells(board)
    .filter((i) => (probabilities[i] ?? 0) > 0)
    .sort((a, b) => (probabilities[b] ?? 0) - (probabilities[a] ?? 0))
    .slice(0, REVEAL_TOP)
}

function localFallbackMove(forBoard: Board, reason: string): MoveResponse {
  return {
    cell: fallbackMove(forBoard, 'O'),
    source: 'fallback',
    reason,
    model: null,
    confidence: null,
    probabilities: null,
    intent: null,
    intentConfidence: null,
  }
}

function GamePage() {
  const [board, setBoard] = useState<Board>(emptyBoard)
  const [busy, setBusy] = useState(false)
  const [aiPhase, setAiPhase] = useState<'idle' | 'thinking' | 'revealing'>('idle')
  const [cellProbs, setCellProbs] = useState<Record<number, number>>({})
  const [ai, setAi] = useState<MoveResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [level, setLevel] = useState<GameLevel>('medium')
  const [gameId, setGameId] = useState(0)
  const gameIdRef = useRef(0)

  const result = getWinner(board)
  const status = boardStatusLabel(board)
  const canChangeLevel = !busy && board.every((c) => c === null)
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

  async function revealProbs(
    allProbs: Record<number, number>,
    order: number[],
    gid: number,
  ): Promise<boolean> {
    setAiPhase('revealing')
    for (const cellIndex of order) {
      if (gameIdRef.current !== gid) return false
      setCellProbs((prev) => ({ ...prev, [cellIndex]: allProbs[cellIndex] ?? 0 }))
      await delay(REVEAL_STAGGER_MS)
    }
    await delay(MOVE_DELAY_MS)
    return gameIdRef.current === gid
  }

  async function runAiSequence(forBoard: Board, gid: number, gameLevel: GameLevel) {
    setBusy(true)
    setError(null)
    setAi(null)
    setCellProbs({})
    setAiPhase('thinking')

    try {
      const data = await withTimeout(
        askAi({ data: { board: forBoard, level: gameLevel } }),
        AI_MOVE_TIMEOUT_MS,
      )
      if (gameIdRef.current !== gid) return

      const allProbs = buildCellProbs(forBoard, data.cell, data.probabilities)
      const order = revealOrder(forBoard, allProbs)

      await delay(THINKING_MIN_MS)
      if (gameIdRef.current !== gid) return
      if (!(await revealProbs(allProbs, order, gid))) return

      applyAiMove(data, gid)
    } catch (err) {
      if (gameIdRef.current !== gid) return
      const fallback = localFallbackMove(
        forBoard,
        err instanceof Error ? err.message : 'TypeSafe request failed',
      )
      const allProbs = buildCellProbs(forBoard, fallback.cell, fallback.probabilities)
      if (!(await revealProbs(allProbs, revealOrder(forBoard, allProbs), gid))) {
        return
      }

      applyAiMove(fallback, gid)
    } finally {
      if (gameIdRef.current === gid) {
        setAiPhase('idle')
        setCellProbs({})
        setBusy(false)
      }
    }
  }

  function playCell(i: number) {
    if (!myTurn || board[i] !== null) return
    const next = [...board]
    next[i] = 'X'
    setAi(null)
    setBoard(next)
    if (boardStatusLabel(next) !== 'playing') return
    void runAiSequence(next, gameIdRef.current, level)
  }

  function reset() {
    gameIdRef.current += 1
    setGameId(gameIdRef.current)
    setBoard(emptyBoard())
    setAi(null)
    setError(null)
    setBusy(false)
    setAiPhase('idle')
    setCellProbs({})
  }

  function statusContent() {
    if (aiPhase === 'thinking') {
      return (
        <>
          AI is thinking
          <ThinkingDots />
        </>
      )
    }
    if (aiPhase === 'revealing') return 'Showing move probabilities…'
    if (status === 'x_won') return 'You win'
    if (status === 'o_won') return 'AI wins'
    if (status === 'draw') return 'Draw'
    if (error) return 'AI request failed.'
    return 'Your turn'
  }

  const topCells = ai?.probabilities
    ? Object.entries(ai.probabilities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, REVEAL_TOP)
    : []

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-5 px-5 py-14">
      <header className="relative text-center">
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>
        <h1 className="text-xs font-bold uppercase tracking-[0.35em] text-zinc-950 dark:text-zinc-50">
          Tic-Tac-Toe
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          You play{' '}
          <span className="font-semibold text-zinc-950 dark:text-zinc-50">X</span> · AI
          plays{' '}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">O</span>
        </p>
      </header>

      <p className="flex h-5 items-center justify-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {statusContent()}
      </p>

      <div
        key={gameId}
        role="grid"
        aria-label="Game board"
        className="grid grid-cols-3 gap-2"
      >
        {board.map((cell, i) => (
          <CellButton
            key={i}
            index={i}
            mark={cell}
            winning={result?.line.includes(i) ?? false}
            playable={myTurn}
            thinking={aiPhase === 'thinking' && cell === null}
            probability={cellProbs[i]}
            onCellClick={playCell}
          />
        ))}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={reset}
          disabled={busy}
          className="rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_-10px_rgba(9,9,11,0.8)] transition-colors hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-950 dark:shadow-[0_10px_20px_-10px_rgba(0,0,0,0.9)] dark:hover:bg-white"
        >
          New game
        </button>
      </div>

      <Panel>
        <div className="mb-3">
          <PanelTitle>Difficulty</PanelTitle>
        </div>
        <div role="group" aria-label="Difficulty level" className="grid grid-cols-3 gap-1">
          {GAME_LEVELS.map((n) => (
            <LevelButton
              key={n}
              active={level === n}
              disabled={!canChangeLevel}
              aria-label={`${LEVEL_LABELS[n]} difficulty`}
              aria-pressed={level === n}
              onClick={() => setLevel(n)}
            >
              {LEVEL_LABELS[n]}
            </LevelButton>
          ))}
        </div>
      </Panel>

      <Panel aria-live="polite">
        <div className="mb-3 flex items-center justify-between gap-3">
          <PanelTitle>AI analysis</PanelTitle>
          {ai && (
            <span className="max-w-36 truncate rounded-full border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {ai.source === 'fallback' ? 'local fallback' : (ai.model ?? 'typesafe')}
            </span>
          )}
        </div>

        {!ai && !error && aiPhase === 'idle' && (
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Make a move — the AI will show its read of the position here.
          </p>
        )}

        {ai?.source === 'typesafe' && (
          <div className="flex flex-col gap-2">
            {ai.confidence != null && <Meter label="confidence" value={ai.confidence} />}
            {topCells.map(([name, p]) => (
              <Meter key={name} label={name} value={p} />
            ))}
            {ai.intent && (
              <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                AI plays{' '}
                <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {CELL_NAMES[ai.cell]}
                </span>{' '}
                — {INTENT_LABELS[ai.intent] ?? ai.intent}.
              </p>
            )}
          </div>
        )}

        {ai?.source === 'fallback' && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            TypeSafe was unreachable ({ai.reason ?? 'unknown error'}), so the AI played a
            locally computed move.
          </p>
        )}

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            {error}
            <button
              type="button"
              onClick={() => void runAiSequence(board, gameIdRef.current, level)}
              disabled={busy}
              className="shrink-0 rounded-md border border-amber-300 px-2 py-1 font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/15"
            >
              Retry
            </button>
          </div>
        )}
      </Panel>
    </main>
  )
}
