import express from 'express'
import session from 'express-session'
import passport from 'passport'
import path from 'path'
import { Client } from 'discord.js'
import './strategies/discord' // Import strategy
import authRoutes from './routes/auth'
import indexRoutes from './routes/index'

export function startDashboard(client: Client) {
    const app = express()
    const PORT = process.env.PORT || 3000

    app.set('trust proxy', 1)

    // Session Setup
    app.use(session({
        secret: process.env.SESSION_SECRET || 'super_secret_key_change_me',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 60000 * 60 * 24 * 7 // 1 week
        }
    }))

    // Passport Init
    app.use(passport.initialize())
    app.use(passport.session())

    // View Engine
    app.set('view engine', 'ejs')
    app.set('views', path.join(__dirname, 'views'))

    // Static Files
    app.use(express.static(path.join(__dirname, '../../public')))
    app.use('/assets', express.static(path.join(__dirname, '../../contents')))

    // Middleware to expose client to routes
    app.use((req, res, next) => {
        (req as any).bot = client
        next()
    })

    // Routes
    app.use('/auth', authRoutes)
    app.use('/', indexRoutes)

    app.listen(PORT, () => {
        console.log(`🌐 Dashboard is running on http://localhost:${PORT}`)
    })
}
