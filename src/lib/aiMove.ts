import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { TypeSafeClient, choice } from '@typesafe-ai/sdk'
import {
  CELL_NAMES,
  GAME_LEVELS,
  LEVEL_DIFFICULTY,
  availableCells,
  boardAscii,
  boardStatusLabel,
  buildTactics,
  describeMove,
  fallbackMove,
  formatBoard,
  immediateWinCells,
  moveIntent,
  pickMoveForLevel,
} from '#/lib/tictactoe'
import type { Board, GameLevel, MoveResponse } from '#/lib/tictactoe'

function validateRequest(input: unknown): { board: Board; level: GameLevel } {
  if (typeof input !== 'object' || input === null) {
    throw new Error('request must be an object with board and level')
  }
  const { board, level } = input as { board: unknown; level: unknown }
  if (
    !Array.isArray(board) ||
    board.length !== 9 ||
    !board.every((c) => c === 'X' || c === 'O' || c === null)
  ) {
    throw new Error('board must be an array of 9 cells, each "X", "O", or null')
  }
  const n = level as GameLevel
  if (!GAME_LEVELS.includes(n)) {
    throw new Error('level must be "easy", "medium", or "hard"')
  }
  return { board: board as Board, level: n }
}

function tacticalMove(
  board: Board,
  cell: number,
  source: MoveResponse['source'],
  model: string | null,
  reason?: string,
): MoveResponse {
  const intent = moveIntent(board, cell, 'O')
  return {
    cell,
    source,
    model,
    confidence: 1,
    probabilities: { [CELL_NAMES[cell]]: 1 },
    intent,
    intentConfidence: 1,
    reason,
  }
}

function correctTacticalMove(board: Board, chosenIndex: number): number {
  const wins = immediateWinCells(board, 'O')
  if (wins.length > 0) return wins[0]

  const blocks = immediateWinCells(board, 'X')
  if (blocks.length > 0) return blocks[0]

  return chosenIndex
}

export const requestAiMove = createServerFn({ method: 'POST' })
  .validator(validateRequest)
  .handler(async ({ data }): Promise<MoveResponse> => {
    const { board, level } = data
    const status = boardStatusLabel(board)
    const available = availableCells(board)

    if (status !== 'playing' || available.length === 0) {
      throw new Error(`Game is over (${status})`)
    }

    if (level !== 'easy') {
      const wins = immediateWinCells(board, 'O')
      if (wins.length > 0) {
        return tacticalMove(board, wins[0], 'typesafe', 'rules')
      }

      const blocks = immediateWinCells(board, 'X')
      if (blocks.length > 0) {
        return tacticalMove(board, blocks[0], 'typesafe', 'rules')
      }
    }

    const apiKey = env.TYPESAFE_API_KEY
    if (!apiKey) {
      return tacticalMove(
        board,
        fallbackMove(board, 'O'),
        'fallback',
        null,
        'TYPESAFE_API_KEY is not set',
      )
    }

    const tactics = buildTactics(board, 'O')
    const client = new TypeSafeClient({ apiKey })

    try {
      const response = await client.systemOne({
        state: {
          game: 'tic-tac-toe',
          rules:
            '3x3 tic-tac-toe. You are O. X is the human opponent. Rows are top/middle/bottom; columns are left/center/right.',
          turn: 'O',
          board_text: formatBoard(board),
          board_ascii: boardAscii(board),
          empty_cells: available.map((i) => CELL_NAMES[i]),
          tactics,
          difficulty_level: LEVEL_DIFFICULTY[level],
        },
        questions: {
          move: choice(
            [
              'Which empty cell should O play now?',
              'Read `tactics.o_wins_by_playing` first — if it lists a cell, pick that winning move.',
              'Otherwise read `tactics.must_block_x_at` — if it lists a cell, pick that block.',
              'Otherwise pick the option whose description gives O the strongest position.',
              'Use `board_ascii` and `board_text` to understand the live position.',
            ].join(' '),
            Object.fromEntries(
              available.map((i) => [
                CELL_NAMES[i],
                describeMove(board, i, 'O'),
              ]),
            ),
          ),
        },
      })

      const moveAnswer = response.answers.move
      let idealIndex = CELL_NAMES.indexOf(
        moveAnswer.choice as (typeof CELL_NAMES)[number],
      )

      if (idealIndex < 0 || !available.includes(idealIndex)) {
        idealIndex = fallbackMove(board, 'O')
      } else if (level === 'hard') {
        idealIndex = correctTacticalMove(board, idealIndex)
      }

      const probabilities: Record<string, number> = {}
      for (const [name, p] of Object.entries(moveAnswer.probabilities)) {
        probabilities[name] = Number(p.toFixed(3))
      }

      const chosenIndex = pickMoveForLevel(
        board,
        level,
        idealIndex,
        probabilities,
      )

      const intent = moveIntent(board, chosenIndex, 'O')
      const overridden = chosenIndex !== idealIndex

      return {
        cell: chosenIndex,
        source: 'typesafe',
        model: response.model,
        confidence: moveAnswer.confidence,
        probabilities,
        intent,
        intentConfidence: overridden ? 1 : moveAnswer.confidence,
        reason: overridden ? `Adjusted for ${level} difficulty` : undefined,
      }
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'TypeSafe request failed'
      return tacticalMove(
        board,
        fallbackMove(board, 'O'),
        'fallback',
        null,
        reason,
      )
    }
  })
