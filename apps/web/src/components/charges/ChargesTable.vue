<script setup lang="ts">
import { useChargesStore } from '@/stores/charges.store'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from '@/components/ui/table'

const store = useChargesStore()
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>ID</TableHead>
        <TableHead>Cliente</TableHead>
        <TableHead>Valor</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Data</TableHead>
      </TableRow>
    </TableHeader>

    <TableBody>
      <!-- Estado vazio: nenhuma cobrança carregada -->
      <TableEmpty v-if="store.list.length === 0" :colspan="5">
        Nenhuma cobrança encontrada.
      </TableEmpty>

      <TableRow
        v-for="charge in store.list"
        :key="charge.id"
      >
        <!-- ID truncado nos primeiros 8 caracteres -->
        <TableCell class="font-mono text-xs">{{ charge.id?.slice(0, 8) ?? '—' }}</TableCell>
        <TableCell>{{ charge.customerId }}</TableCell>
        <TableCell>{{ formatCurrency(charge.amount) }}</TableCell>
        <TableCell>
          <StatusBadge :status="charge.status" />
        </TableCell>
        <TableCell>{{ formatDate(charge.createdAt) }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
