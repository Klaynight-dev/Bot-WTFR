import { Router } from 'express'
import passport from 'passport'

const router = Router()

router.get('/discord', passport.authenticate('discord'))

router.get('/discord/callback', (req, res, next) => {
    passport.authenticate('discord', (err: any, user: any, info: any) => {
        if (err) {
            console.error('❌ [Dashboard Auth] OAuth2 Error Details:', err)
            // Passport-oauth2 often puts the raw Discord response in err.oauthError
            if (err.oauthError) {
                try {
                    console.error('📦 Raw Discord Response:', JSON.parse(err.oauthError.data))
                } catch {
                    console.error('📦 Raw Discord Response (data):', err.oauthError.data)
                }
            }
            return res.status(500).send(`Erreur d'authentification Discord. Détails techniques : ${err.message || 'Inconnu'}`)
        }
        if (!user) {
            console.error('⚠️ [Dashboard Auth] No user returned:', info)
            return res.redirect('/')
        }
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                console.error('❌ [Dashboard Auth] Login error:', loginErr)
                return next(loginErr)
            }
            return res.redirect('/dashboard')
        })
    })(req, res, next)
})

router.get('/diag', (req, res) => {
    const clientId = (process.env.CLIENT_ID || '').trim()
    const clientSecret = (process.env.CLIENT_SECRET || '').trim()
    res.json({
        clientId: `${clientId.charAt(0)}...${clientId.slice(-1)} (len: ${clientId.length})`,
        clientSecret: `${clientSecret.charAt(0)}...${clientSecret.slice(-1)} (len: ${clientSecret.length})`,
        callbackUrl: process.env.CALLBACK_URL,
        node_env: process.env.NODE_ENV
    })
})

router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err)
        res.redirect('/')
    })
})

export default router
