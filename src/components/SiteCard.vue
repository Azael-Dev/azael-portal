<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
    url: string
    icon: string
    title: string
    description: string
    delay?: number
}

const props = withDefaults(defineProps<Props>(), {
    delay: 0.1
})

const isVisible = ref(false)

onMounted(() => {
    // Staggered entrance based on delay prop
    setTimeout(() => {
        isVisible.value = true
    }, props.delay * 1000 + 600) // Base delay + card delay
})
</script>

<template>
    <a :href="url" target="_blank"
        class="group bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 no-underline text-current relative overflow-hidden card-hover-effect transition-all duration-700"
        :class="isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'"
    >
        <!-- Subtle gradient overlay on hover -->
        <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div class="relative z-10">
            <div class="flex items-center gap-4 mb-4">
                <div class="text-2xl text-white transition-all duration-300 group-hover:scale-110 group-hover:text-primary-500">
                    <i :class="icon"></i>
                </div>
                <div class="text-lg font-semibold text-white transition-all duration-300 group-hover:tracking-wide">{{ title }}</div>
            </div>
            <div class="text-sm text-dark-900/80 group-hover:text-dark-900 transition-colors duration-300 leading-relaxed">
                {{ description }}
            </div>
        </div>
        
        <!-- Bottom border glow on hover -->
        <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </a>
</template>
