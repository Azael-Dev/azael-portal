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
    <div class="relative group">
        <a :href="url" target="_blank"
            class="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 no-underline text-current relative card-hover-effect transition-all duration-700 block"
            :class="isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'"
        >
            <!-- Subtle gradient overlay on hover -->
            <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
            
            <div class="relative z-10">
                <div class="flex items-center gap-4">
                    <div class="text-2xl text-white transition-all duration-300 group-hover:scale-110">
                        <i :class="icon"></i>
                    </div>
                    <div class="flex-1 text-lg font-semibold text-white transition-all duration-300 group-hover:tracking-wide">{{ title }}</div>
                    <!-- Right Arrow icon -->
                    <div class="text-white/50 group-hover:text-white group-hover:translate-x-2 transition-all duration-300">
                        <i class="fas fa-arrow-right text-sm"></i>
                    </div>
                </div>
                <!-- Description: always visible on mobile -->
                <div class="md:hidden mt-4 text-sm text-dark-900/80 leading-relaxed">
                    {{ description }}
                </div>
            </div>
            
            <!-- Bottom border glow on hover -->
            <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </a>
        
        <!-- Description tooltip: shown on hover (desktop only) -->
        <div class="hidden md:block absolute left-0 right-0 top-full mt-3 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-30">
            <!-- Arrow -->
            <div class="absolute -top-2 left-6 w-4 h-4 rotate-45 bg-dark-100 border-l border-t border-white/20"></div>
            <!-- Tooltip content -->
            <div class="relative p-4 bg-dark-100 backdrop-blur-md border border-white/20 rounded-xl shadow-lg shadow-black/30">
                <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl"></div>
                <div class="relative text-sm text-white/80 leading-relaxed">
                    {{ description }}
                </div>
            </div>
        </div>
    </div>
</template>
