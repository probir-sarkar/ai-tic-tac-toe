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
