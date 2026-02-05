<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'

interface Props {
    url: string
    icon: string
    title: string
    description: string
    delay?: number
}

interface Emits {
    (e: 'click', url: string): void
}

const props = withDefaults(defineProps<Props>(), {
    delay: 0.1
})

const emit = defineEmits<Emits>()

const isVisible = ref(false)
const isTooltipVisible = ref(false)
let timeoutId: number | null = null

// Computed property for aria-label
const ariaLabel = computed(() => `${props.title} - ${props.description}`)

// Check if user prefers reduced motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

onMounted(() => {
    // Staggered entrance based on delay prop, respect motion preferences
    const entranceDelay = prefersReducedMotion ? 0 : props.delay * 1000 + 600
    timeoutId = window.setTimeout(() => {
        isVisible.value = true
    }, entranceDelay)
})

onBeforeUnmount(() => {
    if (timeoutId !== null) {
        clearTimeout(timeoutId)
    }
})

const handleClick = (event: MouseEvent) => {
    emit('click', props.url)
}

const showTooltip = () => {
    isTooltipVisible.value = true
}

const hideTooltip = () => {
    isTooltipVisible.value = false
}
</script>

<template>
    <div class="relative group">
        <a 
            :href="url" 
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="ariaLabel"
            class="site-card"
            :class="[
                'bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6',
                'no-underline text-current relative block',
                'transition-all duration-700',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
            ]"
            @click="handleClick"
            @mouseenter="showTooltip"
            @mouseleave="hideTooltip"
            @focus="showTooltip"
            @blur="hideTooltip"
        >
            <!-- Subtle gradient overlay on hover -->
            <div 
                class="absolute inset-0 rounded-xl transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent"
                :class="isTooltipVisible ? 'opacity-100' : 'opacity-0'"
                aria-hidden="true"
            ></div>
            
            <div class="relative z-10">
                <div class="flex items-center gap-4">
                    <!-- Icon -->
                    <div 
                        class="text-2xl text-white transition-transform duration-300"
                        :class="{ 'scale-110': isTooltipVisible }"
                        aria-hidden="true"
                    >
                        <i :class="icon"></i>
                    </div>
                    
                    <!-- Title -->
                    <div 
                        class="flex-1 text-lg font-semibold text-white transition-all duration-300"
                        :class="{ 'tracking-wide': isTooltipVisible }"
                    >
                        {{ title }}
                    </div>
                    
                    <!-- Right Arrow icon -->
                    <div 
                        class="text-white/50 transition-all duration-300"
                        :class="isTooltipVisible ? 'text-white translate-x-2' : ''"
                        aria-hidden="true"
                    >
                        <i class="fas fa-arrow-right text-sm"></i>
                    </div>
                </div>
                
                <!-- Description: always visible on mobile -->
                <div class="md:hidden mt-4 text-sm text-white/70 leading-relaxed">
                    {{ description }}
                </div>
            </div>
            
            <!-- Bottom border glow on hover -->
            <div 
                class="absolute bottom-0 left-0 right-0 h-[2px] transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                :class="isTooltipVisible ? 'opacity-100' : 'opacity-0'"
                aria-hidden="true"
            ></div>
        </a>
        
        <!-- Description tooltip: shown on hover/focus (desktop only) -->
        <div 
            class="hidden md:block absolute left-0 right-0 top-full mt-3 z-30 pointer-events-none transition-all duration-300"
            :class="isTooltipVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'"
            role="tooltip"
            :aria-hidden="!isTooltipVisible"
        >
            <!-- Arrow -->
            <div 
                class="absolute -top-2 left-6 w-4 h-4 rotate-45 bg-dark-100 border-l border-t border-white/20"
                aria-hidden="true"
            ></div>
            
            <!-- Tooltip content -->
            <div class="relative p-4 bg-dark-100 backdrop-blur-md border border-white/20 rounded-xl shadow-lg shadow-black/30">
                <div 
                    class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl"
                    aria-hidden="true"
                ></div>
                <div class="relative text-sm text-white/80 leading-relaxed">
                    {{ description }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.site-card {
    /* Additional hover effects can be defined here */
    transform-origin: center;
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
    .site-card,
    .site-card * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
</style>
