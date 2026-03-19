<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import WaveBackground from '../components/WaveBackground.vue'
import FooterSection from '../components/FooterSection.vue'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TebexPackage {
    id: number
    name: string
    quantity: number
    base_price: number
    sales_tax: number
    total_price: number
    gift_username_id: number | null
    gift_username: string | null
    in_recovery: boolean
}

interface TebexBasket {
    ident: string
    complete: boolean
    email: string | null
    username: string | null
    base_price: number
    sales_tax: number
    total_price: number
    currency: string
    packages: TebexPackage[]
    coupons: unknown[]
    giftcards: unknown[]
    creator_code: string | null
    roundup: boolean | null
    cancel_url: string
    complete_url: string | null
    complete_auto_redirect: boolean
}

type PageState = 'loading' | 'success' | 'failed' | 'error'

// ─── Composable Setup ─────────────────────────────────────────────────────────

const route = useRoute()

// ─── Query Params ─────────────────────────────────────────────────────────────

const game = computed(() => (route.query.game as string) ?? '')
const server = computed(() => (route.query.server as string) ?? '')
const token = computed(() => (route.query.token as string) ?? '')
const basket = computed(() => (route.query.basket as string) ?? '')
const success = computed(() => route.query.success === 'true')

// ─── State ────────────────────────────────────────────────────────────────────

const pageState = ref<PageState>('loading')
const basketData = ref<TebexBasket | null>(null)
const errorMsg = ref('')
const isLoaded = ref(false)
const copySuccess = ref(false)

// ─── Computed Helpers ─────────────────────────────────────────────────────────

const gameLabel = computed(() => {
    const map: Record<string, string> = { fivem: 'FiveM', redm: 'RedM' }
    return map[game.value.toLowerCase()] ?? game.value.toUpperCase()
})

const gameIcon = computed(() => {
    const map: Record<string, string> = { fivem: 'fas fa-gamepad', redm: 'fas fa-gamepad' }
    return map[game.value.toLowerCase()] ?? 'fas fa-gamepad'
})

const formatCurrency = (amount: number, currency: string) => {
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
    // Strip the ISO currency code prefix (e.g. "US$" → "$")
    return formatted.replace(/^[A-Z]{2}(\$|£|€|¥|฿)/, '$1')
}


// ─── API Fetch ────────────────────────────────────────────────────────────────

const fetchBasket = async () => {
    if (!token.value || !basket.value) {
        errorMsg.value = 'พารามิเตอร์ไม่ครบถ้วน ไม่สามารถดึงข้อมูลตะกร้าสินค้าได้'
        pageState.value = 'error'
        return
    }

    try {
        const url = `https://headless.tebex.io/api/accounts/${encodeURIComponent(token.value)}/baskets/${encodeURIComponent(basket.value)}`
        const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })

        if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            errorMsg.value = (body as { message?: string }).message ?? `HTTP ${res.status}`
            pageState.value = 'error'
            return
        }

        const json = await res.json() as { data: TebexBasket }
        basketData.value = json.data
        pageState.value = success.value ? 'success' : 'failed'
    } catch (err) {
        errorMsg.value = err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อกับ Tebex API ได้'
        pageState.value = 'error'
    }
}

// ─── Launch Game Client ─────────────────────────────────────────────────────

const launchGame = () => {
    const scheme = game.value.toLowerCase() === 'redm' ? 'redm' : 'fivem'
    window.location.href = `${scheme}://`
}

// ─── Go Home ────────────────────────────────────────────────────────────────
const goHome = () => {
    window.location.href = '/'
}

// ─── Copy Basket ID ───────────────────────────────────────────────────────────

const copyBasketId = async () => {
    if (!basket.value) return
    const text = basket.value
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text)
            copySuccess.value = true
            setTimeout(() => { copySuccess.value = false }, 2000)
            return
        } catch {
            // fall through to execCommand
        }
    }
    // Fallback for HTTP / older browsers
    try {
        const el = document.createElement('textarea')
        el.value = text
        el.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
        document.body.appendChild(el)
        el.focus()
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
        copySuccess.value = true
        setTimeout(() => { copySuccess.value = false }, 2000)
    } catch {
        // ignore
    }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
    setTimeout(() => { isLoaded.value = true }, 100)

    await new Promise(resolve => setTimeout(resolve, 3000))

    if (!success.value) {
        await fetchBasket()
        if (pageState.value !== 'error') pageState.value = 'failed'
    } else {
        await fetchBasket()
    }

    history.replaceState(null, '', '/callback/cfx-tebex-basket-auth')
})
</script>

<template>
    <div class="transition-opacity duration-500 ease-in" :class="isLoaded ? 'opacity-100' : 'opacity-0'">

        <!-- Navbar -->
        <NavBar />

        <!-- Wave Background -->
        <WaveBackground />

        <!-- Main Content -->
        <div class="min-h-screen flex items-center justify-center relative pt-20 pb-24 px-4">
            <div class="w-full max-w-md relative z-10">

                <!-- ── Loading ─────────────────────────────────── -->
                <div v-if="pageState === 'loading'" class="flex flex-col items-center gap-6 text-center py-20">
                    <div class="relative">
                        <div class="w-20 h-20 rounded-full border-2 border-white/10 border-t-dark-800 animate-spin">
                        </div>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <i class="fas fa-shopping-cart text-dark-800 text-xl"></i>
                        </div>
                    </div>
                    <p class="text-dark-900 text-sm uppercase tracking-widest">กำลังตรวจสอบตะกร้าสินค้า…</p>
                </div>

                <!-- ── Success ─────────────────────────────────── -->
                <div v-else-if="pageState === 'success'"
                    class="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden animate-fade-in-scale">

                    <!-- Header band -->
                    <div
                        class="bg-linear-to-r from-primary-600/30 via-primary-500/20 to-transparent border-b border-primary-500/20 px-6 py-5 flex items-center gap-4">
                        <div
                            class="w-10 h-10 rounded-full bg-primary-500/20 border border-primary-500/40 flex items-center justify-center shrink-0">
                            <i class="fas fa-check text-primary-400"></i>
                        </div>
                        <div>
                            <h1 class="text-white font-bold text-lg leading-tight">ยืนยันตะกร้าสินค้าสำเร็จ</h1>
                            <p class="text-primary-400 text-xs mt-0.5">Basket Authenticated</p>
                        </div>
                        <div class="ml-auto shrink-0">
                            <span
                                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/40 text-primary-300 text-xs font-medium uppercase tracking-wider">
                                <span class="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse inline-block"></span>
                                Verified
                            </span>
                        </div>
                    </div>

                    <div class="px-5 py-5 space-y-2">

                        <!-- ── Info Rows: Game / Server / Username / Basket ── -->
                        <div
                            class="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 h-10">
                            <i :class="[gameIcon, 'text-dark-600 text-xs w-4 text-center shrink-0']"></i>
                            <span class="text-dark-700 text-xs uppercase tracking-wider w-18 shrink-0">Game</span>
                            <span class="text-white font-medium text-xs truncate">{{ gameLabel }}</span>
                        </div>

                        <div
                            class="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 h-10">
                            <i class="fas fa-server text-dark-600 text-xs w-4 text-center shrink-0"></i>
                            <span class="text-dark-700 text-xs uppercase tracking-wider w-18 shrink-0">Server</span>
                            <span class="text-white font-medium text-xs truncate" :title="server">{{ server || '—'
                                }}</span>
                        </div>

                        <div v-if="basketData?.username"
                            class="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 h-10">
                            <i class="fas fa-user text-dark-600 text-xs w-4 text-center shrink-0"></i>
                            <span class="text-dark-700 text-xs uppercase tracking-wider w-18 shrink-0">Username</span>
                            <span class="text-white font-medium text-xs truncate">{{ basketData.username }}</span>
                        </div>

                        <div
                            class="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 h-10">
                            <i class="fas fa-fingerprint text-dark-600 text-xs w-4 text-center shrink-0"></i>
                            <span class="text-dark-700 text-xs uppercase tracking-wider w-18 shrink-0">Basket ID</span>
                            <code
                                class="text-dark-800 text-xs font-mono truncate flex-1 min-w-0">{{ basket || '—' }}</code>
                            <button @click="copyBasketId"
                                class="shrink-0 text-xs flex items-center gap-1 px-2 py-1 rounded-lg border transition-all duration-200"
                                :class="copySuccess
                                    ? 'border-primary-500/50 text-primary-400 bg-primary-500/10'
                                    : 'border-white/10 text-dark-700 hover:text-white hover:border-white/20 bg-white/5 cursor-pointer'">
                                <i :class="copySuccess ? 'fas fa-check' : 'fas fa-copy'"></i>
                            </button>
                        </div>

                        <!-- ── Packages ── -->
                        <div v-if="basketData?.packages?.length">
                            <p class="text-dark-700 text-xs uppercase tracking-wider px-1 pt-2 pb-1.5">รายการสินค้า</p>

                            <div class="space-y-2">
                                <div v-for="pkg in basketData.packages" :key="pkg.id"
                                    class="flex items-center justify-between bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 h-10">
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <i class="fas fa-box text-dark-600 text-xs shrink-0 w-4 text-center"></i>
                                        <span class="text-white text-xs font-medium truncate">{{ pkg.name }}</span>
                                        <span v-if="pkg.quantity > 1"
                                            class="shrink-0 text-xs bg-white/10 border border-white/10 rounded-full px-1.5 py-0.5 text-dark-800 leading-none">
                                            ×{{ pkg.quantity }}
                                        </span>
                                    </div>
                                    <span class="text-primary-400 font-semibold text-xs shrink-0 ml-3">
                                        {{ formatCurrency(pkg.total_price, basketData.currency) }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Action -->
                        <div class="pt-3">
                            <button @click="launchGame"
                                class="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:border-white/30 transition-all duration-300 text-xs font-semibold tracking-wide cursor-pointer">
                                ดำเนินการต่อใน {{ gameLabel }}
                            </button>
                        </div>

                    </div>
                </div>

                <!-- ── Failed (success=false) ──────────────────── -->
                <div v-else-if="pageState === 'failed'"
                    class="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden animate-fade-in-scale">

                    <!-- Header band -->
                    <div
                        class="bg-linear-to-r from-red-600/20 via-red-500/10 to-transparent border-b border-red-500/20 px-6 py-5 flex items-center gap-4">
                        <div
                            class="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                            <i class="fas fa-xmark text-red-400"></i>
                        </div>
                        <div>
                            <h1 class="text-white font-bold text-lg leading-tight">ตะกร้าสินค้าถูกยกเลิก</h1>
                            <p class="text-red-400 text-xs mt-0.5">Basket Cancelled</p>
                        </div>
                        <div class="ml-auto shrink-0">
                            <span
                                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-medium uppercase tracking-wider">
                                <span class="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"></span>
                                Cancelled
                            </span>
                        </div>
                    </div>

                    <div class="px-5 py-5 space-y-2">

                        <!-- ── Info Rows ── -->
                        <div
                            class="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 h-10">
                            <i :class="[gameIcon, 'text-dark-600 text-xs w-4 text-center shrink-0']"></i>
                            <span class="text-dark-700 text-xs uppercase tracking-wider w-18 shrink-0">Game</span>
                            <span class="text-white font-medium text-xs truncate">{{ gameLabel }}</span>
                        </div>

                        <div
                            class="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 h-10">
                            <i class="fas fa-server text-dark-600 text-xs w-4 text-center shrink-0"></i>
                            <span class="text-dark-700 text-xs uppercase tracking-wider w-18 shrink-0">Server</span>
                            <span class="text-white font-medium text-xs truncate" :title="server">{{ server || '—'
                                }}</span>
                        </div>

                        <div v-if="basketData?.username"
                            class="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 h-10">
                            <i class="fas fa-user text-dark-600 text-xs w-4 text-center shrink-0"></i>
                            <span class="text-dark-700 text-xs uppercase tracking-wider w-18 shrink-0">Username</span>
                            <span class="text-white font-medium text-xs truncate">{{ basketData.username }}</span>
                        </div>

                        <div
                            class="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 h-10">
                            <i class="fas fa-fingerprint text-dark-600 text-xs w-4 text-center shrink-0"></i>
                            <span class="text-dark-700 text-xs uppercase tracking-wider w-18 shrink-0">Basket ID</span>
                            <code
                                class="text-dark-800 text-xs font-mono truncate flex-1 min-w-0">{{ basket || '—' }}</code>
                            <button @click="copyBasketId"
                                class="shrink-0 text-xs flex items-center gap-1 px-2 py-1 rounded-lg border transition-all duration-200"
                                :class="copySuccess
                                    ? 'border-primary-500/50 text-primary-400 bg-primary-500/10'
                                    : 'border-white/10 text-dark-700 hover:text-white hover:border-white/20 bg-white/5 cursor-pointer'">
                                <i :class="copySuccess ? 'fas fa-check' : 'fas fa-copy'"></i>
                            </button>
                        </div>

                        <div
                            class="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-dark-800 leading-relaxed">
                            ตะกร้าสินค้าถูกยกเลิกหรือยืนยันไม่สำเร็จ กรุณากลับไปที่ {{ gameLabel }} และลองใหม่อีกครั้ง
                            หรือติดต่อผู้ดูแลเซิร์ฟเวอร์หากปัญหายังคงอยู่
                        </div>

                        <div class="pt-3">
                            <button @click="launchGame"
                                class="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:border-white/30 transition-all duration-300 text-xs font-semibold tracking-wide cursor-pointer">
                                ดำเนินการต่อใน {{ gameLabel }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ── Error ───────────────────────────────────── -->
                <div v-else
                    class="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden animate-fade-in-scale">

                    <div
                        class="bg-linear-to-r from-amber-600/20 via-amber-500/10 to-transparent border-b border-amber-500/20 px-6 py-5 flex items-center gap-4">
                        <div
                            class="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                            <i class="fas fa-triangle-exclamation text-amber-400"></i>
                        </div>
                        <div>
                            <h1 class="text-white font-bold text-lg leading-tight">เกิดข้อผิดพลาด</h1>
                            <p class="text-amber-400 text-xs mt-0.5">API Error</p>
                        </div>
                    </div>

                    <div class="px-5 py-5 space-y-3">
                        <div class="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
                            <p class="text-dark-800 text-xs leading-relaxed">{{ errorMsg }}</p>
                        </div>

                        <div v-if="gameLabel" class="pt-3">
                            <button @click="launchGame"
                                class="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:border-white/30 transition-all duration-300 text-xs font-semibold tracking-wide cursor-pointer">
                                ดำเนินการต่อใน {{ gameLabel }}
                            </button>
                        </div>

                        <div v-else class="pt-3">
                            <button @click="goHome"
                                class="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:border-white/30 transition-all duration-300 text-xs font-semibold tracking-wide cursor-pointer">
                                ปิดและกลับหน้าหลัก
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </div>

        <!-- Footer -->
        <FooterSection />

    </div>
</template>
