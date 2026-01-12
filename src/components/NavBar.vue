<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const scrolled = ref(false)

const handleScroll = () => {
  scrolled.value = window.pageYOffset > 10
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const reloadPage = () => {
  window.location.reload()
}
</script>

<template>
  <nav ref="navbarRef"
    class="fixed w-full backdrop-blur-md border-b border-white/10 z-50 transition-all duration-300 navbar-enter"
    :class="scrolled ? 'bg-black/95' : 'bg-black/80'">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
      <div @click="reloadPage" class="text-xl font-bold text-white no-underline flex items-center gap-3 cursor-pointer group">
        <img src="/assets/images/logo.gif" alt="LOGO" class="w-8 h-8 rounded-full object-cover transition-transform duration-300 group-hover:scale-110" />
        <span class="uppercase transition-all duration-300 group-hover:tracking-wider">Azael Dev</span>
      </div>
      <div class="flex items-center gap-6 lg:gap-8">
        <a href="https://github.com/Azael-Dev" target="_blank"
          class="text-dark-900 no-underline text-base transition-all duration-300 flex items-center gap-2 hover:text-white icon-bounce">
          <i class="fab fa-github text-xl transition-transform duration-300"></i>
          <span class="hidden md:inline uppercase">GitHub</span>
        </a>
        <a href="https://discord.azael.dev" target="_blank"
          class="text-dark-900 no-underline text-base transition-all duration-300 flex items-center gap-2 hover:text-white icon-bounce">
          <i class="fab fa-discord text-xl transition-transform duration-300"></i>
          <span class="hidden md:inline uppercase">Discord</span>
        </a>
      </div>
    </div>
  </nav>
</template>
