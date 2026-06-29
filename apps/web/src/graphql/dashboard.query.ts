import { gql } from '@apollo/client'

// Query agregada do dashboard — campos conforme DashboardSummary do backend
export const DASHBOARD_SUMMARY = gql`
  query DashboardSummary {
    dashboard {
      charges {
        total
        pending
        awaitingPayment
        paid
        canceled
        expired
        failed
      }
      payments {
        total
        pending
        processing
        approved
        failed
        expired
      }
      invoices {
        total
        requested
        processing
        issued
        failed
      }
      approvalRate
    }
  }
`
