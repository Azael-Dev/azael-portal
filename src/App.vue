<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import WaveBackground from './components/WaveBackground.vue'
import HeroSection from './components/HeroSection.vue'
import SiteCard from './components/SiteCard.vue'
import FooterSection from './components/FooterSection.vue'

interface Site {
    url: string
    icon: string
    title: string
    description: string
}

const sites: Site[] = [
    {
        url: 'https://cfx.azael.dev/',
        icon: 'fas fa-store',
        title: 'CFX Store',
        description: 'จำหน่ายทรัพยากรสำหรับแพลตฟอร์ม FiveM/RedM ที่พัฒนาโดยเรา เหมาะสำหรับนักพัฒนาและเจ้าของเซิร์ฟเวอร์ทุกระดับ'
    },
    {
        url: 'https://bandb.azael.dev/',
        icon: 'fas fa-database',
        title: 'CFX BanDB',
        description: 'ฐานข้อมูลผู้เล่นที่ถูกแบนผ่านสคริปต์ Play Pass บนแพลตฟอร์ม FiveM/RedM โดยรวบรวมข้อมูลจากเซิร์ฟเวอร์ที่เข้าร่วม'
    },
    {
        url: 'https://docs.azael.dev/',
        icon: 'fas fa-book',
        title: 'Documentation',
        description: 'เอกสารและคู่มือการใช้งานสำหรับทุกโปรเจกต์ที่เราพัฒนาไว้ เพื่อให้คุณใช้งานได้สะดวกและเข้าใจง่าย'
    },
    {
        url: 'https://status.azael.dev/',
        icon: 'fas fa-heartbeat',
        title: 'Service Status',
        description: 'ตรวจสอบสถานะบริการทั้งหมดของเราแบบเรียลไทม์ พร้อมรับข้อมูลอัปเดตและแจ้งเตือนทันทีเมื่อเกิดปัญหา'
    }
]

const isLoaded = ref(false)

onMounted(() => {
    // Small delay to ensure smooth fade-in
    setTimeout(() => {
        isLoaded.value = true
    }, 100)
})
</script>

<template>
    <div class="transition-opacity duration-500 ease-in" :class="isLoaded ? 'opacity-100' : 'opacity-0'">
        <!-- Navbar -->
        <NavBar />

        <!-- Wave Background -->
        <WaveBackground />

        <!-- Main Content -->
        <div class="min-h-screen flex items-center justify-center relative pt-20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                <!-- Header -->
                <HeroSection />

                <!-- Sites Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-12 items-start">
                    <SiteCard v-for="(site, index) in sites" :key="site.url" :url="site.url" :icon="site.icon"
                        :title="site.title" :description="site.description" :delay="(index + 1) * 0.1" />
                </div>

                <!-- Footer -->
                <FooterSection />
            </div>
        </div>
    </div>
</template>
