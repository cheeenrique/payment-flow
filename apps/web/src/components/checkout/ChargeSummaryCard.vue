<script setup lang="ts">
import { computed } from 'vue'
import type { CheckoutView } from '@/types'
import { formatCurrency } from '@/utils/format'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const props = defineProps<{ view: CheckoutView }>()

const formattedAmount = computed(() => formatCurrency(props.view.amount))
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-3xl font-bold">{{ formattedAmount }}</CardTitle>
      <p v-if="view.description" class="text-muted-foreground text-sm mt-1">
        {{ view.description }}
      </p>
    </CardHeader>
    <CardContent class="flex items-center justify-between">
      <span v-if="view.customerName" class="text-sm text-muted-foreground">
        Para: {{ view.customerName }}
      </span>
      <StatusBadge :status="view.status" />
    </CardContent>
  </Card>
</template>
