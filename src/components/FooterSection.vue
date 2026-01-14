<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

const isVisible = ref(false)

const copyrightYear = computed(() => {
    return new Date().getFullYear()
})

const copyrightOwner = computed(() => {
    const host = window.location.hostname

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
        return host
    }

    const parts = host.split('.')
    if (parts.length < 2) return host

    const name = parts[parts.length - 2]
    const tld  = parts[parts.length - 1]

    const titleName = name
        .split(/[-_]/)
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ')

    if (tld === 'dev') {
        return `${titleName} ${tld.charAt(0).toUpperCase() + tld.slice(1)}`
    }

    return titleName
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
        <p>&copy;{{ copyrightYear }} {{ copyrightOwner }}, All rights reserved.</p>
    </div>
</template>
