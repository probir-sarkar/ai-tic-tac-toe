import { z } from 'zod'
import { GAME_LEVELS } from '#/lib/tictactoe'

export const aiMoveRequestSchema = z.object({
  board: z.array(z.enum(['X', 'O']).nullable()).length(9),
  level: z.enum(GAME_LEVELS),
})

export type AiMoveRequest = z.infer<typeof aiMoveRequestSchema>
