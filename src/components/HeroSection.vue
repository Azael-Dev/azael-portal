<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isVisible = ref(false)
const titleVisible = ref(false)
const subtitleVisible = ref(false)

onMounted(() => {
  // Staggered animation timing
  setTimeout(() => {
    isVisible.value = true
  }, 200)
  
  setTimeout(() => {
    titleVisible.value = true
  }, 400)
  
  setTimeout(() => {
    subtitleVisible.value = true
  }, 700)
})
</script>

<template>
    <div class="text-center">
        <h1
            class="text-4xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-tighter mb-6 max-lg:mt-12 text-center transition-all duration-1000"
            :class="titleVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-sm'"
        >
            <span class="inline-block animate-logo-float logo-glow">Azael</span> Dev
        </h1>
        <p 
            class="text-lg sm:text-xl text-dark-900/80 text-center mb-12 sm:mb-16 font-normal transition-all duration-1000 delay-100"
            :class="subtitleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
        >
            Simply living, constantly learning, always building.
        </p>
    </div>
</template>
