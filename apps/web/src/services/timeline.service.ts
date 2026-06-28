import { apolloClient } from '@/services/apollo'
import { TIMELINE_QUERY } from '@/graphql/timeline.query'
import type { TimelineEvent } from '@/types'

/** Página de eventos retornada pelo campo timeline do GraphQL */
export interface TimelinePage {
  total: number
  items: TimelineEvent[]
}

interface TimelineQueryResult {
  timeline: TimelinePage
}

/**
 * Busca uma página de eventos de timeline via GraphQL.
 * fetchPolicy network-only garante dados frescos sem cache stale.
 */
export async function fetchTimelinePage(page: number, limit: number): Promise<TimelinePage> {
  const result = await apolloClient.query<TimelineQueryResult>({
    query: TIMELINE_QUERY,
    variables: { page, limit },
    fetchPolicy: 'network-only',
  })
  if (!result.data) throw new Error('Resposta vazia da API de timeline')
  return result.data.timeline
}
