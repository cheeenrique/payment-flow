<script setup lang="ts">
import { ref, onMounted } from 'vue';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const status = ref<string>('checking...');

onMounted(async () => {
  try {
    const res = await fetch(`${apiUrl}/health`);
    const body = await res.json();
    status.value = body.status;
  } catch {
    status.value = 'unreachable';
  }
});
</script>

<template>
  <main>
    <h1>payment-flow</h1>
    <p>API: {{ apiUrl }}</p>
    <p>health: {{ status }}</p>
  </main>
</template>
