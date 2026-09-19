import { createServerFn } from '@tanstack/react-start'
import { aiMoveRequestSchema } from '#/lib/schemas'
import { generateAiMove } from '#/lib/aiMove.server'

export const requestAiMove = createServerFn({ method: 'POST' })
  .validator(aiMoveRequestSchema)
  .handler(async ({ data }) => generateAiMove(data))
