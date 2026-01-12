<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const waveRef = ref<HTMLElement | null>(null)
let vantaEffect: ReturnType<typeof VANTA.WAVES> | null = null
let snowflakesInstance: Snowflakes | null = null

const SNOW_CONFIG = {
    MAX_SIZE: 16
}

const SNOW_SEASON = {
    START_MONTH: 12, // December
    END_MONTH: 1     // January
}

const checkSnowSeason = (): boolean => {
    const date = new Date()
    const month = date.getMonth() + 1
    return month === SNOW_SEASON.START_MONTH || month === SNOW_SEASON.END_MONTH
}

const getSnowCount = (): number => {
    const date = new Date()
    const month = date.getMonth() + 1
    const day = date.getDate()

    if (month === SNOW_SEASON.START_MONTH) {
        return day // 1-31 snowflakes based on date in December
    } else if (month === SNOW_SEASON.END_MONTH) {
        const lastDay = new Date(date.getFullYear(), SNOW_SEASON.START_MONTH, 0).getDate()
        return Math.max(1, lastDay - day) // Decreasing snowflakes in January
    }
    return 0
}

const initSnowflakes = () => {
    if (checkSnowSeason() && typeof Snowflakes !== 'undefined') {
        const snowColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--snowflake-color').trim() || '#ffffff'

        snowflakesInstance = new Snowflakes({
            color: snowColor,
            count: getSnowCount(),
            maxSize: SNOW_CONFIG.MAX_SIZE
        })
    }
}

const initVanta = () => {
    if (typeof VANTA !== 'undefined' && waveRef.value) {
        try {
            vantaEffect = VANTA.WAVES({
                el: waveRef.value,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00,
                scale: 1.00,
                scaleMobile: 1.00,
                color: 0x0,
                waveSpeed: 0.60
            })
        } catch (e) {
            console.error('Vanta.js error:', e)
        }
    }
}

onMounted(() => {
    initVanta()
    initSnowflakes()
})

onUnmounted(() => {
    if (vantaEffect) {
        vantaEffect.destroy()
    }
    if (snowflakesInstance) {
        snowflakesInstance.destroy()
    }
})
</script>

<template>
    <!-- Wave Background -->
    <div ref="waveRef" id="wave-bg" class="fixed top-0 left-0 w-full h-full z-[1] bg-transparent"></div>

    <!-- Grid Background (hidden by default, can be enabled) -->
    <div id="grid-bg" class="hidden fixed top-0 left-0 w-full h-full z-[1]" style="
      background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 50px 50px;
    "></div>
</template>
