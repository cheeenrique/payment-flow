<script setup lang="ts">
import { usePaymentsStore } from '@/stores/payments.store'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { formatCurrency, formatDateTime } from '@/utils/format'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from '@/components/ui/table'

const store = usePaymentsStore()
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>ID</TableHead>
        <TableHead>Cobrança</TableHead>
        <TableHead>Valor</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Método</TableHead>
        <TableHead>Data</TableHead>
      </TableRow>
    </TableHeader>

    <TableBody>
      <!-- Estado vazio: nenhum pagamento carregado -->
      <TableEmpty v-if="store.list.length === 0" :colspan="6">
        Nenhum pagamento encontrado.
      </TableEmpty>

      <TableRow
        v-for="payment in store.list"
        :key="payment.id"
      >
        <!-- ID truncado nos primeiros 8 caracteres -->
        <TableCell class="font-mono text-xs">{{ payment.id.slice(0, 8) }}</TableCell>
        <TableCell class="font-mono text-xs">{{ payment.chargeId.slice(0, 8) }}</TableCell>
        <TableCell>{{ formatCurrency(payment.amount) }}</TableCell>
        <TableCell>
          <StatusBadge :status="payment.status" />
        </TableCell>
        <TableCell class="capitalize">{{ payment.method }}</TableCell>
        <TableCell>{{ formatDateTime(payment.createdAt) }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
