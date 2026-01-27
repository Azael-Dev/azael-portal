import { ref, onMounted } from 'vue'

// Cache configuration
const CACHE_KEY = 'github_status_cache'
const CACHE_TTL = 60 * 1000 // 1 minute in milliseconds

interface CachedData {
    timestamp: number
    data: StatusIssue[]
}

export interface StatusIssue {
    id: number
    number: number
    title: string
    body: string
    html_url: string
    state: string
    labels: Array<{
        id: number
        name: string
        color: string
    }>
    created_at: string
    updated_at: string
}

export interface ParsedStatusInfo {
    start?: Date
    end?: Date
    expectedDown?: string[]
    expectedDegraded?: string[]
    description: string
}

export function useStatusAlert() {
    const issues = ref<StatusIssue[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const isDismissed = ref(false)

    /**
     * Parse the issue body to extract metadata from HTML comments
     * Format:
     * <!--
     * start: 2026-01-22T22:30:00+07:00
     * end: 2026-01-22T23:30:00+07:00
     * expectedDegraded: base-api, script-license-api
     * -->
     */
    const parseIssueBody = (body: string): ParsedStatusInfo => {
        const result: ParsedStatusInfo = {
            description: body
        }

        // Extract metadata from HTML comments
        const commentMatch = body.match(/<!--\s*([\s\S]*?)\s*-->/)
        if (commentMatch) {
            const metadata = commentMatch[1]

            // Parse start time
            const startMatch = metadata.match(/start:\s*(.+)/)
            if (startMatch) {
                result.start = new Date(startMatch[1].trim())
            }

            // Parse end time
            const endMatch = metadata.match(/end:\s*(.+)/)
            if (endMatch) {
                result.end = new Date(endMatch[1].trim())
            }

            // Parse expected down services (completely unavailable)
            const downMatch = metadata.match(/expectedDown:\s*(.+)/)
            if (downMatch) {
                result.expectedDown = downMatch[1]
                    .trim()
                    .split(',')
                    .map(s => s.trim())
            }

            // Parse expected degraded services (partially affected)
            const degradedMatch = metadata.match(/expectedDegraded:\s*(.+)/)
            if (degradedMatch) {
                result.expectedDegraded = degradedMatch[1]
                    .trim()
                    .split(',')
                    .map(s => s.trim())
            }

            // Remove the comment from description
            result.description = body.replace(/<!--[\s\S]*?-->\s*/, '').trim()
        }

        return result
    }

    /**
     * Check if the issue is currently active (within scheduled time range)
     */
    const isActiveSchedule = (parsedInfo: ParsedStatusInfo): boolean => {
        const now = new Date()

        if (parsedInfo.start && parsedInfo.end) {
            return now >= parsedInfo.start && now <= parsedInfo.end
        }

        // If no time range specified, consider it active
        return true
    }

    /**
     * Check if the issue is upcoming (before scheduled start time)
     */
    const isUpcoming = (parsedInfo: ParsedStatusInfo): boolean => {
        const now = new Date()

        if (parsedInfo.start) {
            return now < parsedInfo.start
        }

        return false
    }

    /**
     * Determine the alert type based on labels
     */
    const getAlertType = (labels: StatusIssue['labels']): 'maintenance' | 'status' | 'info' => {
        const labelNames = labels.map(l => l.name.toLowerCase())

        if (labelNames.includes('maintenance')) {
            return 'maintenance'
        }

        if (labelNames.includes('status')) {
            return 'status'
        }

        return 'info'
    }

    /**
     * Format date for display
     */
    const formatDate = (date: Date): string => {
        return date.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        })
    }

    /**
     * Get cached data if still valid
     */
    const getCachedData = (): StatusIssue[] | null => {
        try {
            const cached = localStorage.getItem(CACHE_KEY)
            if (!cached) return null

            const parsedCache: CachedData = JSON.parse(cached)
            const now = Date.now()

            // Check if cache is still valid (within TTL)
            if (now - parsedCache.timestamp < CACHE_TTL) {
                // console.log('[StatusAlert] Using cached data, expires in:',
                //     Math.round((CACHE_TTL - (now - parsedCache.timestamp)) / 1000), 'seconds')
                return parsedCache.data
            }

            // Cache expired
            // console.log('[StatusAlert] Cache expired, fetching fresh data')
            return null
        } catch {
            // Invalid cache data
            localStorage.removeItem(CACHE_KEY)
            return null
        }
    }

    /**
     * Save data to cache
     */
    const setCachedData = (data: StatusIssue[]) => {
        try {
            const cacheData: CachedData = {
                timestamp: Date.now(),
                data
            }
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
            // console.log('[StatusAlert] Data cached for', CACHE_TTL / 1000, 'seconds')
        } catch (err) {
            // console.warn('[StatusAlert] Failed to cache data:', err)
        }
    }

    /**
     * Fetch status issues from GitHub API with caching
     */
    const fetchStatusIssues = async (forceRefresh = false) => {
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const cachedData = getCachedData()
            if (cachedData) {
                issues.value = cachedData
                return
            }
        }

        isLoading.value = true
        error.value = null

        try {
            const apiUrl = import.meta.env.VITE_GITHUB_API_URL
            const username = import.meta.env.VITE_GITHUB_USERNAME
            const repo = import.meta.env.VITE_GITHUB_STATUS_REPO
            const author = import.meta.env.VITE_GITHUB_STATUS_AUTHOR
            const state = import.meta.env.VITE_GITHUB_STATUS_STATE
            const labels = import.meta.env.VITE_GITHUB_STATUS_LABELS

            // Build the search query
            const query = `repo:${username}/${repo}+author:${author}+state:${state}+label:${labels}`
            const url = `${apiUrl}/search/issues?q=${query}&sort=created&order=desc`

            // console.log('[StatusAlert] Fetching from GitHub API...')

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            })

            if (!response.ok) {
                // If rate limited, try to use stale cache
                if (response.status === 403) {
                    const staleCache = localStorage.getItem(CACHE_KEY)
                    if (staleCache) {
                        const parsed: CachedData = JSON.parse(staleCache)
                        console.warn('[StatusAlert] Rate limited, using stale cache')
                        issues.value = parsed.data
                        return
                    }
                }
                throw new Error(`GitHub API error: ${response.status}`)
            }

            const data = await response.json()
            const items = data.items || []

            // Save to cache
            setCachedData(items)
            issues.value = items
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to fetch status'
            console.error('[StatusAlert] Error fetching status issues:', err)
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Dismiss the alert (stored in session storage)
     */
    const dismissAlert = (issueId: number) => {
        const dismissedAlerts = JSON.parse(sessionStorage.getItem('dismissedAlerts') || '[]')
        if (!dismissedAlerts.includes(issueId)) {
            dismissedAlerts.push(issueId)
            sessionStorage.setItem('dismissedAlerts', JSON.stringify(dismissedAlerts))
        }
        isDismissed.value = true
    }

    /**
     * Check if an alert has been dismissed
     */
    const isAlertDismissed = (issueId: number): boolean => {
        const dismissedAlerts = JSON.parse(sessionStorage.getItem('dismissedAlerts') || '[]')
        return dismissedAlerts.includes(issueId)
    }

    /**
     * Get the first active (non-dismissed) issue
     */
    const getActiveIssue = (): StatusIssue | null => {
        return issues.value.find(issue => !isAlertDismissed(issue.id)) || null
    }

    /**
     * Get affected services from issue labels (for status type)
     * Excludes system labels like 'status', 'maintenance'
     */
    const getAffectedServicesFromLabels = (labels: StatusIssue['labels']): string[] => {
        const systemLabels = ['status', 'maintenance', 'bug', 'enhancement', 'help wanted', 'question']
        return labels
            .filter(l => !systemLabels.includes(l.name.toLowerCase()))
            .map(l => l.name)
    }

    /**
     * Get all status issues (for showing multiple issues)
     */
    const getAllActiveIssues = (): StatusIssue[] => {
        return issues.value.filter(issue => !isAlertDismissed(issue.id))
    }

    onMounted(() => {
        fetchStatusIssues()
    })

    return {
        issues,
        isLoading,
        error,
        isDismissed,
        parseIssueBody,
        isActiveSchedule,
        isUpcoming,
        getAlertType,
        formatDate,
        fetchStatusIssues,
        dismissAlert,
        isAlertDismissed,
        getActiveIssue,
        getAffectedServicesFromLabels,
        getAllActiveIssues
    }
}
