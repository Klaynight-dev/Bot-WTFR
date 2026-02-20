/* ═══════════════════════════════════════════════
   WTFR Dashboard — Client JS
   Modular: Toast, Stats, AJAX Save, Mobile Menu
   ═══════════════════════════════════════════════ */

// ─── Toast Notification System ───
const Toast = {
    container: null,

    init() {
        this.container = document.getElementById('toast-container')
    },

    show(message, type = 'success', duration = 3500) {
        if (!this.container) this.init()
        const toast = document.createElement('div')
        toast.className = `toast toast--${type}`
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
            <span class="toast-message">${message}</span>
        `
        this.container.appendChild(toast)

        // Trigger animation
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

// ─── Live Stats Fetcher ───
const LiveStats = {
    intervalId: null,

    async fetch() {
        try {
            const res = await fetch('/api/stats')
            if (!res.ok) return
            const data = await res.json()

            // Update index page stats
            const setEl = (id, val) => {
                const el = document.getElementById(id)
                if (el) el.textContent = val
            }

            setEl('stat-uptime', data.uptime)
            setEl('stat-guilds', data.guilds)
            setEl('stat-members', data.members)
            setEl('stat-commands', data.commands)

            // Update dashboard page stats
            setEl('live-uptime', data.uptime)
            setEl('live-guilds', data.guilds)
            setEl('live-members', data.members)
            setEl('live-commands', data.commands)
        } catch {
            // Silently fail — user is likely on the login page
        }
    },

    start(intervalMs = 30000) {
        this.fetch() // Immediate
        this.intervalId = setInterval(() => this.fetch(), intervalMs)
    },

    stop() {
        if (this.intervalId) clearInterval(this.intervalId)
    }
}

// ─── AJAX Settings Save ───
const SettingsForm = {
    init() {
        const form = document.getElementById('settingsForm')
        if (!form) return

        form.addEventListener('submit', async (e) => {
            e.preventDefault()
            const guildId = form.dataset.guildId
            const saveBtn = document.getElementById('saveBtn')

            // Collect form data
            const data = {}
            const inputs = form.querySelectorAll('input, select')
            inputs.forEach(input => {
                if (input.type === 'checkbox') {
                    data[input.name] = input.checked
                } else {
                    data[input.name] = input.value
                }
            })

            // Visual feedback
            saveBtn.disabled = true
            saveBtn.innerHTML = '<span class="pulse">Sauvegarde...</span>'

            try {
                const res = await fetch(`/api/guild/${guildId}/settings`, {
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
            } catch (err) {
                Toast.error('Erreur réseau — vérifiez votre connexion')
            } finally {
                saveBtn.disabled = false
                saveBtn.innerHTML = '<img src="/assets/img/save.svg" alt="" class="icon"> Sauvegarder'
            }
        })
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

        // Close on link click
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                btn.classList.remove('active')
                nav.classList.remove('nav-mobile-open')
            })
        })
    }
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
    Toast.init()
    MobileMenu.init()
    SettingsForm.init()
    LiveStats.start()
})
