<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useStatusAlert, type StatusIssue, type ParsedStatusInfo } from '../composables/useStatusAlert'

const {
    issues,
    isLoading,
    parseIssueBody,
    isUpcoming,
    getAlertType,
    formatDate,
    dismissAlert,
    isAlertDismissed,
    getActiveIssue
} = useStatusAlert()

const isVisible = ref(false)
const isExpanded = ref(false)

// Get the first active (non-dismissed) issue
const activeIssue = computed<StatusIssue | null>(() => getActiveIssue())

// Parse the issue body for metadata
const parsedInfo = computed<ParsedStatusInfo | null>(() => {
    if (!activeIssue.value) return null
    return parseIssueBody(activeIssue.value.body || '')
})

// Determine alert type based on labels
const alertType = computed(() => {
    if (!activeIssue.value) return 'info'
    return getAlertType(activeIssue.value.labels)
})

// Get alert styling based on type
const alertStyles = computed(() => {
    switch (alertType.value) {
        case 'maintenance':
            return {
                bgColor: 'bg-amber-500/10',
                borderColor: 'border-amber-500/30',
                textColor: 'text-amber-400',
                iconColor: 'text-amber-400',
                icon: 'fas fa-wrench',
                glowColor: 'shadow-amber-500/20'
            }
        case 'status':
            return {
                bgColor: 'bg-red-500/10',
                borderColor: 'border-red-500/30',
                textColor: 'text-red-400',
                iconColor: 'text-red-400',
                icon: 'fas fa-exclamation-triangle',
                glowColor: 'shadow-red-500/20'
            }
        default:
            return {
                bgColor: 'bg-blue-500/10',
                borderColor: 'border-blue-500/30',
                textColor: 'text-blue-400',
                iconColor: 'text-blue-400',
                icon: 'fas fa-info-circle',
                glowColor: 'shadow-blue-500/20'
            }
    }
})

// Status text
const statusText = computed(() => {
    if (!parsedInfo.value) return ''

    if (isUpcoming(parsedInfo.value)) {
        return 'กำหนดการ'
    }

    return alertType.value === 'maintenance' ? 'กำลังปรับปรุง' : 'แจ้งเตือน'
})

// Handle dismiss
const handleDismiss = () => {
    if (activeIssue.value) {
        isVisible.value = false
        setTimeout(() => {
            dismissAlert(activeIssue.value!.id)
        }, 300)
    }
}

// Toggle expanded state
const toggleExpanded = () => {
    isExpanded.value = !isExpanded.value
}

// Show alert with animation after mount
onMounted(() => {
    setTimeout(() => {
        if (activeIssue.value && !isAlertDismissed(activeIssue.value.id)) {
            isVisible.value = true
        }
    }, 500)
})

// Watch for issues loaded
const checkAndShowAlert = () => {
    if (activeIssue.value && !isAlertDismissed(activeIssue.value.id)) {
        setTimeout(() => {
            isVisible.value = true
        }, 500)
    }
}

// Re-check when issues change
import { watch } from 'vue'
watch(issues, checkAndShowAlert)
</script>

<template>
    <!-- Status Alert Banner -->
    <Transition name="alert-slide">
        <div v-if="activeIssue && isVisible && !isLoading"
            class="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
            <div :class="[
                'rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300',
                alertStyles.bgColor,
                alertStyles.borderColor,
                alertStyles.glowColor,
                isExpanded ? 'shadow-xl' : 'shadow-lg'
            ]">
                <!-- Main Alert Header -->
                <div class="p-4">
                    <div class="flex items-start gap-3">
                        <!-- Icon -->
                        <div :class="[
                            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                            alertStyles.bgColor
                        ]">
                            <i :class="[alertStyles.icon, alertStyles.iconColor, 'text-lg animate-pulse']"></i>
                        </div>

                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <!-- Status Badge & Title -->
                            <div class="flex items-center gap-2 flex-wrap">
                                <span :class="[
                                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                    alertStyles.bgColor,
                                    alertStyles.textColor
                                ]">
                                    {{ statusText }}
                                </span>
                                <h3 class="text-white font-medium text-sm truncate">
                                    {{ activeIssue.title }}
                                </h3>
                            </div>

                            <!-- Time Range (if available) -->
                            <div v-if="parsedInfo?.start || parsedInfo?.end" class="mt-1 flex items-center gap-2 text-xs text-gray-400">
                                <i class="fas fa-clock"></i>
                                <span v-if="parsedInfo.start">{{ formatDate(parsedInfo.start) }}</span>
                                <span v-if="parsedInfo.start && parsedInfo.end">→</span>
                                <span v-if="parsedInfo.end">{{ formatDate(parsedInfo.end) }}</span>
                            </div>

                            <!-- Affected Services (collapsed view) -->
                            <div v-if="parsedInfo?.expectedDegraded && !isExpanded" class="mt-2 flex flex-wrap gap-1">
                                <span v-for="service in parsedInfo.expectedDegraded.slice(0, 3)" :key="service"
                                    class="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-dark-300/50 text-gray-300">
                                    {{ service }}
                                </span>
                                <span v-if="parsedInfo.expectedDegraded.length > 3"
                                    class="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-dark-300/50 text-gray-400">
                                    +{{ parsedInfo.expectedDegraded.length - 3 }} อื่นๆ
                                </span>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex-shrink-0 flex items-center gap-1">
                            <!-- Expand/Collapse Button -->
                            <button @click="toggleExpanded"
                                class="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white cursor-pointer"
                                :title="isExpanded ? 'ย่อ' : 'ขยาย'">
                                <i :class="['fas', isExpanded ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                            </button>

                            <!-- Dismiss Button -->
                            <button @click="handleDismiss"
                                class="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white cursor-pointer"
                                title="ปิด">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Expanded Content -->
                <Transition name="expand">
                    <div v-if="isExpanded" class="px-4 pb-4">
                        <div class="pt-3 border-t border-white/10">
                            <!-- All Affected Services -->
                            <div v-if="parsedInfo?.expectedDegraded" class="mb-3">
                                <h4 class="text-xs font-medium text-gray-400 mb-2">บริการที่ได้รับผลกระทบ</h4>
                                <div class="flex flex-wrap gap-1">
                                    <span v-for="service in parsedInfo.expectedDegraded" :key="service"
                                        class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-dark-300/50 text-gray-300">
                                        <i class="fas fa-server mr-1 text-[10px]"></i>
                                        {{ service }}
                                    </span>
                                </div>
                            </div>

                            <!-- Description Preview -->
                            <div v-if="parsedInfo?.description" class="mb-3">
                                <h4 class="text-xs font-medium text-gray-400 mb-2">รายละเอียด</h4>
                                <p class="text-sm text-gray-300 line-clamp-3">
                                    {{ parsedInfo.description.replace(/[#*`]/g, '').substring(0, 200) }}...
                                </p>
                            </div>

                            <!-- View More Link -->
                            <a :href="activeIssue.html_url" target="_blank" rel="noopener noreferrer" :class="[
                                'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                                alertStyles.bgColor,
                                alertStyles.textColor,
                                'hover:brightness-125'
                            ]">
                                <span>ดูรายละเอียดเพิ่มเติม</span>
                                <i class="fas fa-external-link-alt text-xs"></i>
                            </a>
                        </div>
                    </div>
                </Transition>
            </div>
        </div>
    </Transition>

    <!-- Loading Skeleton (optional) -->
    <Transition name="fade">
        <div v-if="isLoading" class="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
            <div class="rounded-xl border border-dark-300/30 bg-dark-200/50 backdrop-blur-md p-4 animate-pulse">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-dark-400/50"></div>
                    <div class="flex-1">
                        <div class="h-4 bg-dark-400/50 rounded w-3/4 mb-2"></div>
                        <div class="h-3 bg-dark-400/50 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
/* Alert slide animation */
.alert-slide-enter-active,
.alert-slide-leave-active {
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.alert-slide-enter-from {
    opacity: 0;
    transform: translate(-50%, -20px);
}

.alert-slide-leave-to {
    opacity: 0;
    transform: translate(-50%, -20px);
}

/* Expand animation */
.expand-enter-active,
.expand-leave-active {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
    opacity: 0;
    max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
    opacity: 1;
    max-height: 300px;
}

/* Fade animation */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Line clamp utility */
.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
