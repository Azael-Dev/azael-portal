<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
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
    getActiveIssue,
    getAffectedServicesFromLabels
} = useStatusAlert()

const isVisible = ref(false)
const isExpanded = ref(false)

// Get the first active (non-dismissed) issue
const activeIssue = computed<StatusIssue | null>(() => getActiveIssue())

// Get all status issues (for aggregated display)
const allStatusIssues = computed<StatusIssue[]>(() => {
    return issues.value.filter((issue: StatusIssue) => {
        const labels = issue.labels.map((l: { name: string }) => l.name.toLowerCase())
        return labels.includes('status') && !isAlertDismissed(issue.id)
    })
})

// Check if we have status type alert
const hasStatusAlert = computed(() => allStatusIssues.value.length > 0)

// Get all affected services from all status issues
const allStatusAffectedServices = computed(() => {
    const services: Array<{ name: string; issueTitle: string; issueUrl: string }> = []
    allStatusIssues.value.forEach((issue: StatusIssue) => {
        const affectedServices = getAffectedServicesFromLabels(issue.labels)
        affectedServices.forEach(service => {
            services.push({
                name: service,
                issueTitle: issue.title,
                issueUrl: issue.html_url
            })
        })
    })
    return services
})

// Parse the issue body for metadata
const parsedInfo = computed<ParsedStatusInfo | null>(() => {
    if (!activeIssue.value) return null
    return parseIssueBody(activeIssue.value.body || '')
})

// Determine alert type based on labels
const alertType = computed(() => {
    // If we have any status issues, prioritize showing them
    if (hasStatusAlert.value) return 'status'
    if (!activeIssue.value) return 'info'
    return getAlertType(activeIssue.value.labels)
})

// Check if maintenance is upcoming (before start time)
const isMaintenanceUpcoming = computed(() => {
    if (!parsedInfo.value || alertType.value !== 'maintenance') return false
    return isUpcoming(parsedInfo.value)
})

// Get alert styling based on type and timing
const alertStyles = computed(() => {
    // Maintenance - upcoming (blue) vs active (amber)
    if (alertType.value === 'maintenance') {
        if (isMaintenanceUpcoming.value) {
            // Upcoming maintenance - use blue/primary color
            return {
                bgColor: 'bg-primary-500/10',
                borderColor: 'border-primary-500/40',
                textColor: 'text-primary-400',
                iconColor: 'text-primary-400',
                icon: 'fas fa-calendar-alt',
                glowColor: 'rgba(20, 184, 166, 0.15)',
                badgeBg: 'bg-primary-500/20',
                pulseColor: 'bg-primary-500'
            }
        } else {
            // Active maintenance - use amber color
            return {
                bgColor: 'bg-amber-500/10',
                borderColor: 'border-amber-500/40',
                textColor: 'text-amber-400',
                iconColor: 'text-amber-400',
                icon: 'fas fa-wrench',
                glowColor: 'rgba(245, 158, 11, 0.15)',
                badgeBg: 'bg-amber-500/20',
                pulseColor: 'bg-amber-500'
            }
        }
    }

    // Status issue - red
    if (alertType.value === 'status') {
        return {
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/40',
            textColor: 'text-red-400',
            iconColor: 'text-red-400',
            icon: 'fas fa-exclamation-triangle',
            glowColor: 'rgba(239, 68, 68, 0.15)',
            badgeBg: 'bg-red-500/20',
            pulseColor: 'bg-red-500'
        }
    }

    // Default info - blue/primary
    return {
        bgColor: 'bg-primary-500/10',
        borderColor: 'border-primary-500/40',
        textColor: 'text-primary-400',
        iconColor: 'text-primary-400',
        icon: 'fas fa-info-circle',
        glowColor: 'rgba(20, 184, 166, 0.15)',
        badgeBg: 'bg-primary-500/20',
        pulseColor: 'bg-primary-500'
    }
})

// Status text
const statusText = computed(() => {
    if (alertType.value === 'status') {
        const count = allStatusIssues.value.length
        return count > 1 ? `${count} Issues Found` : 'Service Alert'
    }

    if (alertType.value === 'maintenance') {
        if (isMaintenanceUpcoming.value) {
            return 'Scheduled Maintenance'
        }
        return 'Maintenance In Progress'
    }

    return 'Notice'
})

// Combined services (down + degraded) for display
const hasAffectedServices = computed(() => {
    return (parsedInfo.value?.expectedDown?.length || 0) > 0 ||
        (parsedInfo.value?.expectedDegraded?.length || 0) > 0 ||
        allStatusAffectedServices.value.length > 0
})

// Handle dismiss - for status, dismiss all status issues
const handleDismiss = () => {
    isVisible.value = false
    setTimeout(() => {
        if (alertType.value === 'status') {
            allStatusIssues.value.forEach((issue: StatusIssue) => {
                dismissAlert(issue.id)
            })
        } else if (activeIssue.value) {
            dismissAlert(activeIssue.value.id)
        }
    }, 400)
}

// Toggle expanded state
const toggleExpanded = () => {
    isExpanded.value = !isExpanded.value
}

// Show alert with animation after mount
onMounted(() => {
    setTimeout(() => {
        if ((hasStatusAlert.value || activeIssue.value) && 
            (hasStatusAlert.value || !isAlertDismissed(activeIssue.value!.id))) {
            isVisible.value = true
        }
    }, 1500)
})

// Watch for issues loaded
const checkAndShowAlert = () => {
    if ((hasStatusAlert.value || activeIssue.value)) {
        setTimeout(() => {
            isVisible.value = true
        }, 1500)
    }
}

// Status page URL
const statusPageUrl = import.meta.env.VITE_STATUS_URL || '#'

// Format description with links support
const formattedDescription = computed(() => {
    if (!parsedInfo.value?.description) return ''
    
    let text = parsedInfo.value.description.substring(0, 350)
    
    // Convert markdown links [text](url) to HTML (before other formatting)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary-400 hover:text-primary-300 underline transition-colors">$1</a>')
    
    // Convert bold text **text** to HTML
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
    
    // Convert headers ### to styled spans
    text = text.replace(/^###\s+(.+)$/gm, '<div class="font-bold text-gray-200 mt-2 mb-1">$1</div>')
    
    // Convert bullet points - to HTML list items
    text = text.replace(/^-\s+(.+)$/gm, '<div class="flex gap-2 ml-2 mb-1"><span class="text-primary-400 mt-1">•</span><span>$1</span></div>')
    
    // Remove other markdown formatting
    text = text.replace(/\*([^*]+)\*/g, '$1') // italic
    text = text.replace(/`([^`]+)`/g, '<code class="text-primary-300 text-xs">$1</code>') // code
    
    return text + '...'
})

// Re-check when issues change
watch(issues, checkAndShowAlert)
</script>

<template>
    <!-- Status Alert Banner -->
    <Transition name="alert-slide">
        <div v-if="(hasStatusAlert || activeIssue) && isVisible && !isLoading"
            class="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
            <div :class="[
                'alert-card rounded-2xl border backdrop-blur-xl transition-all duration-500',
                alertStyles.bgColor,
                alertStyles.borderColor,
                isExpanded ? 'shadow-2xl' : 'shadow-xl'
            ]" :style="{ boxShadow: `0 8px 32px -4px ${alertStyles.glowColor}, 0 0 0 1px ${alertStyles.glowColor}` }">
                <!-- Main Alert Header -->
                <div class="p-4">
                    <div class="flex items-start gap-4">
                        <!-- Icon with glow effect -->
                        <div class="relative flex-shrink-0">
                            <div :class="[
                                'w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-105',
                                alertStyles.badgeBg
                            ]">
                                <i :class="[alertStyles.icon, alertStyles.iconColor, 'text-xl']"></i>
                            </div>
                            <!-- Pulse indicator for active alerts -->
                            <span v-if="alertType === 'status' || (alertType === 'maintenance' && !isMaintenanceUpcoming)" 
                                class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                <span :class="[
                                    'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                                    alertStyles.pulseColor
                                ]"></span>
                                <span :class="[
                                    'relative inline-flex rounded-full h-3.5 w-3.5',
                                    alertStyles.pulseColor
                                ]"></span>
                            </span>
                        </div>

                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <!-- Status Badge -->
                            <div class="flex items-center gap-2 flex-wrap mb-2">
                                <span :class="[
                                    'inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold tracking-wide uppercase',
                                    alertStyles.badgeBg,
                                    alertStyles.textColor
                                ]">
                                    <i :class="[alertStyles.icon, 'mr-1.5 text-[10px]']"></i>
                                    {{ statusText }}
                                </span>
                                <span v-if="alertType === 'status' && allStatusIssues.length > 1" 
                                    class="text-xs text-gray-500">
                                    Multiple services affected
                                </span>
                            </div>

                            <!-- Title - for status show summary, for others show issue title -->
                            <h3 v-if="alertType === 'status'" class="text-white font-semibold text-sm leading-snug mb-2">
                                Some services are currently experiencing issues
                            </h3>
                            <h3 v-else-if="activeIssue" class="text-white font-semibold text-sm leading-snug mb-2">
                                {{ activeIssue.title }}
                            </h3>

                            <!-- Time Range (for maintenance) -->
                            <div v-if="alertType !== 'status' && (parsedInfo?.start || parsedInfo?.end)"
                                class="flex items-center gap-2 text-xs text-gray-400 mb-3">
                                <i class="fas fa-clock text-gray-500"></i>
                                <span v-if="parsedInfo?.start" class="font-medium">{{ formatDate(parsedInfo.start) }}</span>
                                <span v-if="parsedInfo?.start && parsedInfo?.end" class="text-gray-600">→</span>
                                <span v-if="parsedInfo?.end" class="font-medium">{{ formatDate(parsedInfo.end) }}</span>
                            </div>

                            <!-- Affected Services Preview (collapsed view) -->
                            <div v-if="hasAffectedServices && !isExpanded" class="flex flex-wrap gap-1.5">
                                <!-- Status type: show all affected services from all issues -->
                                <template v-if="alertType === 'status'">
                                    <span v-for="(service, index) in allStatusAffectedServices.slice(0, 4)" :key="index"
                                        class="service-tag inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-red-500/15 text-red-300 border border-red-500/30 transition-all duration-200 hover:bg-red-500/25">
                                        <span class="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 animate-pulse"></span>
                                        {{ service.name }}
                                    </span>
                                    <span v-if="allStatusAffectedServices.length > 4"
                                        class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-dark-300/60 text-gray-400 border border-dark-400/30">
                                        +{{ allStatusAffectedServices.length - 4 }} more
                                    </span>
                                </template>

                                <!-- Maintenance type: show down/degraded services -->
                                <template v-else>
                                    <!-- Down services (red) -->
                                    <span v-for="service in (parsedInfo?.expectedDown || []).slice(0, 2)" :key="'down-' + service"
                                        class="service-tag inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-red-500/15 text-red-300 border border-red-500/30">
                                        <span class="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5"></span>
                                        {{ service }}
                                    </span>
                                    <!-- Degraded services -->
                                    <span v-for="service in (parsedInfo?.expectedDegraded || []).slice(0, 2)" :key="'degraded-' + service"
                                        :class="[
                                            'service-tag inline-flex items-center px-2.5 py-1 rounded-lg text-xs border',
                                            isMaintenanceUpcoming
                                                ? 'bg-primary-500/15 text-primary-300 border-primary-500/30'
                                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                        ]">
                                        <span :class="[
                                            'w-1.5 h-1.5 rounded-full mr-1.5',
                                            isMaintenanceUpcoming ? 'bg-primary-400' : 'bg-amber-400'
                                        ]"></span>
                                        {{ service }}
                                    </span>
                                    <!-- More indicator -->
                                    <span v-if="((parsedInfo?.expectedDown?.length || 0) + (parsedInfo?.expectedDegraded?.length || 0)) > 4"
                                        class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-dark-300/60 text-gray-400 border border-dark-400/30">
                                        +{{ ((parsedInfo?.expectedDown?.length || 0) + (parsedInfo?.expectedDegraded?.length || 0)) - 4 }} more
                                    </span>
                                </template>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex-shrink-0 flex items-center gap-1">
                            <!-- Expand/Collapse Button -->
                            <button @click="toggleExpanded"
                                class="action-btn p-2.5 rounded-xl hover:bg-white/10 transition-all duration-200 text-gray-400 hover:text-white cursor-pointer"
                                :title="isExpanded ? 'Collapse' : 'Expand'">
                                <i :class="['fas text-sm transition-transform duration-300', isExpanded ? 'fa-chevron-up rotate-0' : 'fa-chevron-down']"></i>
                            </button>

                            <!-- Dismiss Button -->
                            <button @click="handleDismiss"
                                class="action-btn p-2.5 rounded-xl hover:bg-white/10 transition-all duration-200 text-gray-400 hover:text-white cursor-pointer"
                                title="Dismiss">
                                <i class="fas fa-times text-sm"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Expanded Content -->
                <Transition name="expand">
                    <div v-if="isExpanded" class="px-4 pb-4 overflow-hidden">
                        <div class="pt-4 border-t border-white/10">
                            <!-- All Affected Services -->
                            <div v-if="hasAffectedServices" class="mb-4">
                                <h4 class="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                    <i class="fas fa-server text-[10px]"></i>
                                    Affected Services
                                </h4>

                                <!-- Status type: show all services from all issues -->
                                <template v-if="alertType === 'status'">
                                    <div class="space-y-2">
                                        <div v-for="(service, index) in allStatusAffectedServices" :key="index"
                                            class="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20 transition-all duration-200 hover:bg-red-500/15">
                                            <div class="flex items-center gap-3 flex-1 min-w-0">
                                                <span class="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0"></span>
                                                <div class="flex-1 min-w-0">
                                                    <div class="text-sm text-red-300 truncate">
                                                        <span class="font-medium">{{ service.name }}</span>
                                                        <span class="text-xs text-gray-400 ml-2">{{ service.issueTitle }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <a :href="service.issueUrl" target="_blank" rel="noopener noreferrer"
                                                class="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1 flex-shrink-0 ml-2">
                                                <span class="hidden sm:inline">View Details</span>
                                                <i class="fas fa-external-link-alt text-[10px]"></i>
                                            </a>
                                        </div>
                                    </div>
                                </template>

                                <!-- Maintenance type: show down and degraded separately -->
                                <template v-else>
                                    <!-- Down services -->
                                    <div v-if="parsedInfo?.expectedDown?.length" class="mb-4">
                                        <p class="text-xs text-red-400 mb-2 flex items-center font-medium">
                                            <i class="fas fa-times-circle mr-1.5"></i>
                                            Temporarily Unavailable
                                        </p>
                                        <div class="flex flex-wrap gap-2">
                                            <span v-for="service in parsedInfo.expectedDown" :key="'down-' + service"
                                                class="inline-flex items-center px-3 py-1.5 rounded-xl text-xs bg-red-500/15 text-red-300 border border-red-500/30">
                                                <span class="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></span>
                                                {{ service }}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Degraded services -->
                                    <div v-if="parsedInfo?.expectedDegraded?.length">
                                        <p :class="[
                                            'text-xs mb-2 flex items-center font-medium',
                                            isMaintenanceUpcoming ? 'text-primary-400' : 'text-amber-400'
                                        ]">
                                            <i class="fas fa-exclamation-circle mr-1.5"></i>
                                            May Be Affected
                                        </p>
                                        <div class="flex flex-wrap gap-2">
                                            <span v-for="service in parsedInfo.expectedDegraded" :key="'degraded-' + service"
                                                :class="[
                                                    'inline-flex items-center px-3 py-1.5 rounded-xl text-xs border',
                                                    isMaintenanceUpcoming
                                                        ? 'bg-primary-500/15 text-primary-300 border-primary-500/30'
                                                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                                ]">
                                                <span :class="[
                                                    'w-1.5 h-1.5 rounded-full mr-2',
                                                    isMaintenanceUpcoming ? 'bg-primary-400' : 'bg-amber-400'
                                                ]"></span>
                                                {{ service }}
                                            </span>
                                        </div>
                                    </div>
                                </template>
                            </div>

                            <!-- Description Preview (for maintenance) -->
                            <div v-if="alertType !== 'status' && parsedInfo?.description" class="mb-4">
                                <h4 class="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                                    <i class="fas fa-info-circle text-[10px]"></i>
                                    Description
                                </h4>
                                <p class="text-sm text-gray-300 leading-relaxed line-clamp-3" v-html="formattedDescription"></p>
                            </div>

                            <!-- View More Link -->
                            <a v-if="alertType !== 'status' && activeIssue" 
                                :href="activeIssue.html_url" target="_blank" rel="noopener noreferrer" :class="[
                                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                                alertStyles.badgeBg,
                                alertStyles.textColor,
                                'hover:brightness-125 hover:scale-[1.02] hover:shadow-lg'
                            ]">
                                <span>View More Details</span>
                                <i class="fas fa-external-link-alt text-xs"></i>
                            </a>

                            <!-- Status page link for status alerts -->
                            <a v-if="alertType === 'status'" 
                                :href="statusPageUrl" target="_blank" rel="noopener noreferrer"
                                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 bg-red-500/20 text-red-400 hover:brightness-125 hover:scale-[1.02] hover:shadow-lg">
                                <span>View All Status</span>
                                <i class="fas fa-external-link-alt text-xs"></i>
                            </a>
                        </div>
                    </div>
                </Transition>
            </div>
        </div>
    </Transition>

    <!-- Loading Skeleton -->
    <Transition name="fade">
        <div v-if="isLoading" class="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
            <div class="rounded-2xl border border-dark-300/30 bg-dark-200/80 backdrop-blur-xl p-4">
                <div class="flex items-start gap-4 animate-pulse">
                    <div class="w-12 h-12 rounded-xl bg-dark-400/50"></div>
                    <div class="flex-1">
                        <div class="h-6 bg-dark-400/50 rounded-lg w-36 mb-3"></div>
                        <div class="h-4 bg-dark-400/50 rounded w-3/4 mb-2"></div>
                        <div class="h-3 bg-dark-400/50 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>
