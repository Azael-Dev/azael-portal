import { ref, onMounted } from 'vue'

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

            // Parse expected degraded services
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
     * Fetch status issues from GitHub API
     */
    const fetchStatusIssues = async () => {
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

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            })

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`)
            }

            const data = await response.json()
            issues.value = data.items || []
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to fetch status'
            console.error('Error fetching status issues:', err)
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
        getActiveIssue
    }
}
