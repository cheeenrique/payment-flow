import { gql } from '@apollo/client'

// Query de timeline paginada — retorna page type com total e itens
export const TIMELINE_QUERY = gql`
  query Timeline($page: Int!, $limit: Int!) {
    timeline(page: $page, limit: $limit) {
      total
      items {
        id
        eventType
        aggregateId
        aggregateType
        correlationId
        timestamp
      }
    }
  }
`
