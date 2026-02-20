/* ═══════════════════════════════════════════════
   WTFR Dashboard — Client JS
   Toast, Stats, Tabs, Commands, Config Forms, Logs
   ═══════════════════════════════════════════════ */

// ─── Toast Notification System ───
const Toast = {
    container: null,

    init() {
        this.container = document.getElementById('toast-container')
    },

    show(message, type = 'success', duration = 3500) {
        if (!this.container) this.init()
        if (!this.container) return
        const toast = document.createElement('div')
        toast.className = `toast toast--${type}`
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
            <span class="toast-message">${message}</span>
        `
        this.container.appendChild(toast)
        requestAnimationFrame(() => toast.classList.add('toast--visible'))
        setTimeout(() => {
            toast.classList.remove('toast--visible')
            toast.addEventListener('transitionend', () => toast.remove())
        }, duration)
    },

    success(msg) { this.show(msg, 'success') },
    error(msg) { this.show(msg, 'error') },
    info(msg) { this.show(msg, 'info') }
}

// ─── Tab System ───
const Tabs = {
    init() {
        const tabNav = document.getElementById('tabNav')
        if (!tabNav) return

        tabNav.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab

                // Update active button
                tabNav.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tab-btn--active'))
                btn.classList.add('tab-btn--active')

                // Update active content
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('tab-content--active'))
                const target = document.getElementById(`tab-${tabId}`)
                if (target) target.classList.add('tab-content--active')

                // Update URL without reload
                const url = new URL(window.location)
                url.searchParams.set('tab', tabId)
                history.replaceState({}, '', url)
            })
        })
    }
}

// ─── Config Form (General tab) ───
const ConfigForm = {
    init() {
        const form = document.getElementById('configForm')
        if (!form) return

        form.addEventListener('submit', async (e) => {
            e.preventDefault()
            const btn = document.getElementById('saveConfigBtn')

            // Collect data
            const data = {}
            form.querySelectorAll('input, select, textarea').forEach(el => {
                if (el.type === 'checkbox') {
                    data[el.name] = el.checked
                } else if (el.multiple) {
                    data[el.name] = Array.from(el.selectedOptions).map(o => o.value)
                } else {
                    data[el.name] = el.value
                }
            })

            btn.disabled = true
            btn.innerHTML = '<span class="pulse">Sauvegarde...</span>'

            try {
                const res = await fetch('/api/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                if (res.ok) {
                    Toast.success('Configuration sauvegardée !')
                } else {
                    const err = await res.json()
                    Toast.error(err.error || 'Erreur lors de la sauvegarde')
                }
            } catch {
                Toast.error('Erreur réseau')
            } finally {
                btn.disabled = false
                btn.innerHTML = '<img src="/assets/img/save.svg" alt="" class="icon"> Sauvegarder'
            }
        })
    }
}

// ─── Command Toggles ───
const Commands = {
    init() {
        const list = document.getElementById('commandsList')
        if (!list) return

        // Toggle handlers
        list.querySelectorAll('.command-toggle').forEach(toggle => {
            toggle.addEventListener('change', async () => {
                const name = toggle.dataset.command
                const enabled = toggle.checked

                try {
                    const res = await fetch(`/api/commands/${name}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ enabled })
                    })
                    if (res.ok) {
                        Toast.success(`/${name} ${enabled ? 'activée' : 'désactivée'}`)
                    } else {
                        toggle.checked = !enabled // Revert
                        Toast.error('Erreur lors de la modification')
                    }
                } catch {
                    toggle.checked = !enabled
                    Toast.error('Erreur réseau')
                }
            })
        })

        // Search
        const search = document.getElementById('commandSearch')
        if (search) {
            search.addEventListener('input', () => {
                const q = search.value.toLowerCase()
                list.querySelectorAll('.command-row').forEach(row => {
                    const name = row.dataset.command.toLowerCase()
                    row.style.display = name.includes(q) ? '' : 'none'
                })
            })
        }
    }
}

// ─── Leveling Form ───
const LevelingForm = {
    init() {
        const form = document.getElementById('levelingForm')
        if (!form) return

        form.addEventListener('submit', async (e) => {
            e.preventDefault()
            const btn = document.getElementById('saveLevelingBtn')

            const data = {}
            form.querySelectorAll('input, select, textarea').forEach(el => {
                if (el.type === 'checkbox') {
                    data[el.name] = el.checked
                } else if (el.type === 'number') {
                    data[el.name] = parseInt(el.value) || 0
                } else {
                    data[el.name] = el.value
                }
            })

            btn.disabled = true
            btn.innerHTML = '<span class="pulse">Sauvegarde...</span>'

            try {
                const res = await fetch('/api/leveling', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                if (res.ok) {
                    Toast.success('Leveling sauvegardé !')
                } else {
                    const err = await res.json()
                    Toast.error(err.error || 'Erreur')
                }
            } catch {
                Toast.error('Erreur réseau')
            } finally {
                btn.disabled = false
                btn.innerHTML = '<img src="/assets/img/save.svg" alt="" class="icon"> Sauvegarder leveling'
            }
        })
    }
}

// ─── Logs System ───
const Logs = {
    currentPage: 1,

    init() {
        const btn = document.getElementById('loadMoreLogs')
        if (!btn) return

        btn.addEventListener('click', () => this.loadMore())

        // Filters
        const sourceFilter = document.getElementById('logSourceFilter')
        const actionFilter = document.getElementById('logActionFilter')

        if (sourceFilter) sourceFilter.addEventListener('change', () => this.refresh())
        if (actionFilter) {
            let timeout
            actionFilter.addEventListener('input', () => {
                clearTimeout(timeout)
                timeout = setTimeout(() => this.refresh(), 300)
            })
        }
    },

    async refresh() {
        this.currentPage = 1
        const list = document.getElementById('logsList')
        if (list) list.innerHTML = '<p class="text-muted text-center">Chargement...</p>'
        await this.loadMore(true)
    },

    async loadMore(replace = false) {
        const source = document.getElementById('logSourceFilter')?.value || ''
        const action = document.getElementById('logActionFilter')?.value || ''

        try {
            const params = new URLSearchParams({
                page: replace ? '1' : String(this.currentPage),
                source, action
            })
            const res = await fetch(`/api/logs?${params}`)
            if (!res.ok) return

            const data = await res.json()
            const list = document.getElementById('logsList')

            if (replace) list.innerHTML = ''

            if (data.logs.length === 0 && replace) {
                list.innerHTML = '<p class="text-muted text-center">Aucun log trouvé.</p>'
                return
            }

            data.logs.forEach(log => {
                const icons = {
                    'config.update': '⚙️', 'command.toggle': '🔧',
                    'leveling.update': '📊', 'panel.login': '🔑'
                }
                const icon = icons[log.action] || '📋'
                const time = new Date(log.createdAt).toLocaleString('fr-FR', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                })

                const entry = document.createElement('div')
                entry.className = `log-entry log-entry--${log.source}`
                entry.innerHTML = `
                    <span class="log-icon">${icon}</span>
                    <div class="log-content">
                        <span class="log-action">${log.action}</span>
                        <span class="log-user">par <strong>${log.userName}</strong></span>
                    </div>
                    <span class="log-time">${time}</span>
                    <span class="log-source-badge log-source--${log.source}">${log.source}</span>
                `
                list.appendChild(entry)
            })

            this.currentPage = data.page + 1

            const loadBtn = document.getElementById('loadMoreLogs')
            if (loadBtn) {
                loadBtn.style.display = data.page >= data.pages ? 'none' : ''
            }
        } catch {
            Toast.error('Erreur chargement des logs')
        }
    }
}

// ─── Live Stats ───
const LiveStats = {
    async fetch() {
        try {
            const res = await fetch('/api/stats')
            if (!res.ok) return
            const data = await res.json()
            const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val }
            set('stat-uptime', data.uptime)
            set('stat-guilds', data.guilds)
            set('stat-members', data.members)
            set('stat-commands', data.commands)
        } catch { }
    },
    start() {
        this.fetch()
        setInterval(() => this.fetch(), 30000)
    }
}

// ─── Mobile Menu ───
const MobileMenu = {
    init() {
        const btn = document.getElementById('mobileMenuBtn')
        const nav = document.getElementById('navRight')
        if (!btn || !nav) return
        btn.addEventListener('click', () => {
            btn.classList.toggle('active')
            nav.classList.toggle('nav-mobile-open')
        })
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                btn.classList.remove('active')
                nav.classList.remove('nav-mobile-open')
            })
        })
    }
}

// ─── Init All ───
document.addEventListener('DOMContentLoaded', () => {
    Toast.init()
    MobileMenu.init()
    Tabs.init()
    ConfigForm.init()
    Commands.init()
    LevelingForm.init()
    Logs.init()
    LiveStats.start()
})
