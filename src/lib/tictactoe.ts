export type Player = 'X' | 'O'
export type Cell = Player | null
export type Board = Cell[]

export type MoveResponse = {
  cell: number
  source: 'typesafe' | 'fallback'
  model: string | null
  confidence: number | null
  probabilities: Record<string, number> | null
  intent: string | null
  intentConfidence: number | null
  reason?: string
}

export const CELL_NAMES = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'center',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
] as const

export const WINNING_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

export function getWinner(
  board: Board,
): { winner: Player; line: number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line }
    }
  }
  return null
}

export function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null)
}

export function availableCells(board: Board): number[] {
  return board.map((cell, i) => (cell === null ? i : -1)).filter((i) => i >= 0)
}

export function boardStatusLabel(
  board: Board,
): 'playing' | 'x_won' | 'o_won' | 'draw' {
  const result = getWinner(board)
  if (result) return result.winner === 'X' ? 'x_won' : 'o_won'
  if (isBoardFull(board)) return 'draw'
  return 'playing'
}

export function formatBoard(board: Board): string {
  const rows = [0, 1, 2].map((r) =>
    [0, 1, 2]
      .map((c) => {
        const i = r * 3 + c
        return `${CELL_NAMES[i]}=${board[i] ?? 'empty'}`
      })
      .join(', '),
  )
  return rows.join('\n')
}

export function boardAscii(board: Board): string {
  const mark = (cell: Cell) => cell ?? '-'
  const row = (r: number) =>
    [0, 1, 2].map((c) => mark(board[r * 3 + c])).join(' | ')
  return [row(0), '---+---+---', row(1), '---+---+---', row(2)].join('\n')
}

/** Cells where `player` wins immediately by playing there. */
export function immediateWinCells(board: Board, player: Player): number[] {
  return availableCells(board).filter((i) => {
    const test = [...board]
    test[i] = player
    return getWinner(test)?.winner === player
  })
}

function threatCount(board: Board, player: Player): number {
  return WINNING_LINES.filter((line) => {
    const cells = line.map((i) => board[i])
    return (
      cells.filter((c) => c === player).length === 2 &&
      cells.filter((c) => c === null).length === 1
    )
  }).length
}

export function createsFork(
  board: Board,
  cell: number,
  player: Player,
): boolean {
  const test = [...board]
  test[cell] = player
  return threatCount(test, player) >= 2
}

export function moveIntent(
  board: Board,
  cell: number,
  player: Player,
): 'win' | 'block' | 'fork' | 'develop' {
  const opponent: Player = player === 'X' ? 'O' : 'X'
  const testWin = [...board]
  testWin[cell] = player
  if (getWinner(testWin)?.winner === player) return 'win'

  const testBlock = [...board]
  testBlock[cell] = opponent
  if (getWinner(testBlock)?.winner === opponent) return 'block'

  if (createsFork(board, cell, player)) return 'fork'
  return 'develop'
}

/** Human-readable effect of playing `cell` as `player`. */
export function describeMove(
  board: Board,
  cell: number,
  player: Player,
): string {
  const intent = moveIntent(board, cell, player)
  const name = CELL_NAMES[cell]
  switch (intent) {
    case 'win':
      return `Play ${name} — wins the game for ${player} now.`
    case 'block':
      return `Play ${name} — blocks ${player === 'O' ? 'X' : 'O'} from winning next turn.`
    case 'fork':
      return `Play ${name} — creates two winning threats ${player === 'O' ? 'X' : 'O'} cannot both stop.`
    case 'develop':
      if (cell === 4) {
        return `Play ${name} — takes the center; strongest developing square.`
      }
      if ([0, 2, 6, 8].includes(cell)) {
        return `Play ${name} — takes a corner; opens multiple winning lines.`
      }
      return `Play ${name} — reasonable edge square when no immediate tactic exists.`
  }
}

export function buildTactics(board: Board, player: Player) {
  const opponent: Player = player === 'X' ? 'O' : 'X'
  const wins = immediateWinCells(board, player).map((i) => CELL_NAMES[i])
  const blocks = immediateWinCells(board, opponent).map((i) => CELL_NAMES[i])
  const forks = availableCells(board)
    .filter((i) => createsFork(board, i, player))
    .map((i) => CELL_NAMES[i])

  return {
    [`${player.toLowerCase()}_wins_by_playing`]: wins,
    [`must_block_${opponent.toLowerCase()}_at`]: blocks,
    [`${player.toLowerCase()}_forks_available`]: forks,
  }
}

/**
 * Deterministic fallback when the TypeSafe API is unavailable:
 * win now, else block, else center, else corner, else any.
 */
export function fallbackMove(board: Board, player: Player): number {
  const opponent: Player = player === 'X' ? 'O' : 'X'
  const available = availableCells(board)

  const findImmediate = (p: Player): number | undefined =>
    available.find((i) => {
      const test = [...board]
      test[i] = p
      return getWinner(test)?.winner === p
    })

  const preference = [4, 0, 2, 6, 8, 1, 3, 5, 7]
  return (
    findImmediate(player) ??
    findImmediate(opponent) ??
    preference.find((i) => available.includes(i)) ??
    available[0]
  )
}

export type GameLevel = 'easy' | 'medium' | 'hard'

export const GAME_LEVELS = ['easy', 'medium', 'hard'] as const

export const LEVEL_LABELS: Record<GameLevel, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export const LEVEL_DIFFICULTY: Record<GameLevel, number> = {
  easy: 3,
  medium: 6,
  hard: 10,
}

const MISTAKE_CHANCE: Record<GameLevel, number> = {
  easy: 0.4,
  medium: 0.15,
  hard: 0,
}

export function normalizeProbabilities(
  probs: Record<string, number>,
): Record<string, number> {
  const total = Object.values(probs).reduce((sum, p) => sum + p, 0)
  if (total <= 0) return probs
  const normalized: Record<string, number> = {}
  for (const [name, p] of Object.entries(probs)) {
    normalized[name] = Number((p / total).toFixed(3))
  }
  return normalized
}

export function syntheticProbabilities(
  board: Board,
  chosen: number,
): Record<string, number> {
  const available = availableCells(board)
  const raw: Record<string, number> = {}
  for (const i of available) {
    raw[CELL_NAMES[i]] = i === chosen ? 0.55 : 0.45 / (available.length - 1 || 1)
  }
  return normalizeProbabilities(raw)
}

function rankedCellsFromProbs(
  board: Board,
  probabilities: Record<string, number>,
): number[] {
  return availableCells(board)
    .map((i) => ({ i, p: probabilities[CELL_NAMES[i]] ?? 0 }))
    .sort((a, b) => b.p - a.p)
    .map(({ i }) => i)
}

export function pickMoveForLevel(
  board: Board,
  level: GameLevel,
  idealMove: number,
  probabilities: Record<string, number> | null,
): number {
  const mistakeChance = MISTAKE_CHANCE[level]
  if (mistakeChance <= 0 || !probabilities) return idealMove

  const ranked = rankedCellsFromProbs(board, probabilities)
  if (ranked.length > 1 && Math.random() < mistakeChance) {
    return ranked[1]
  }
  return idealMove
}
