<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

const isVisible = ref(false)

const copyrightYear = computed(() => {
    const startYear = 2025
    const currentYear = new Date().getFullYear()

    if (currentYear > startYear) {
        return `${startYear}-${currentYear}`
    }
    return `${startYear}`
})

onMounted(() => {
    setTimeout(() => {
        isVisible.value = true
    }, 1200)
})
</script>

<template>
    <div 
        class="text-center py-12 text-dark-600 text-sm lg:fixed lg:bottom-0 lg:left-0 lg:right-0 transition-all duration-700"
        :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
    >
        <p>&copy;{{ copyrightYear }} All rights reserved.</p>
    </div>
</template>
