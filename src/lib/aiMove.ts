import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { TypeSafeClient, choice } from '@typesafe-ai/sdk'
import {
  CELL_NAMES,
  availableCells,
  boardStatusLabel,
  fallbackMove,
} from '#/lib/tictactoe'
import type { Board, Cell, MoveResponse } from '#/lib/tictactoe'

function validateBoard(input: unknown): Board {
  if (
    !Array.isArray(input) ||
    input.length !== 9 ||
    !input.every((c) => c === 'X' || c === 'O' || c === null)
  ) {
    throw new Error('board must be an array of 9 cells, each "X", "O", or null')
  }
  return input as Board
}

export const requestAiMove = createServerFn({ method: 'POST' })
  .validator(validateBoard)
  .handler(async ({ data: board }): Promise<MoveResponse> => {
    const status = boardStatusLabel(board)
    const available = availableCells(board)

    if (status !== 'playing' || available.length === 0) {
      throw new Error(`Game is over (${status})`)
    }

    const apiKey = env.TYPESAFE_API_KEY
    if (!apiKey) {
      return fallbackResult(
        fallbackMove(board, 'O'),
        'TYPESAFE_API_KEY is not set',
      )
    }

    const client = new TypeSafeClient({ apiKey })

    try {
      const response = await client.systemOne({
        state: {
          game: 'tic-tac-toe',
          board_grid: [0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => board[r * 3 + c] ?? 'empty'),
          ),
          board_by_name: Object.fromEntries(
            CELL_NAMES.map((name, i) => [name, board[i] ?? 'empty']),
          ),
          players: { ai: 'O', human: 'X' },
          turn: 'O',
          moves_played: board.filter((c: Cell) => c !== null).length,
        },
        questions: {
          move: choice(
            'Which empty cell should O claim now? Play to win: complete a line of three O if possible; otherwise block an immediate X win; otherwise create a fork or strongest future threat.',
            Object.fromEntries(
              available.map((i) => [
                CELL_NAMES[i],
                `Empty cell in row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}.`,
              ]),
            ),
          ),
          intent: choice(
            'What is the main purpose of the move O should play now?',
            {
              win: 'Completes a line of three O and wins the game',
              block: 'Stops X from winning on their next turn',
              fork: 'Creates two simultaneous threats X cannot both block',
              develop:
                'Builds toward a future line; no immediate win or block exists',
            },
          ),
        },
      })

      const moveAnswer = response.answers.move
      const chosenIndex = CELL_NAMES.indexOf(
        moveAnswer.choice as (typeof CELL_NAMES)[number],
      )

      if (chosenIndex < 0 || !available.includes(chosenIndex)) {
        return fallbackResult(
          fallbackMove(board, 'O'),
          `Model returned unavailable cell "${moveAnswer.choice}"`,
        )
      }

      const probabilities: Record<string, number> = {}
      for (const [name, p] of Object.entries(moveAnswer.probabilities)) {
        probabilities[name] = Number(p.toFixed(3))
      }

      return {
        cell: chosenIndex,
        source: 'typesafe',
        model: response.model,
        confidence: moveAnswer.confidence,
        probabilities,
        intent: response.answers.intent.choice,
        intentConfidence: response.answers.intent.confidence,
      }
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'TypeSafe request failed'
      return fallbackResult(fallbackMove(board, 'O'), reason)
    }
  })

function fallbackResult(cell: number, reason: string): MoveResponse {
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
