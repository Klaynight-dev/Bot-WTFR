import passport from 'passport'
import { Strategy as DiscordStrategy } from 'passport-discord'
import { VerifyCallback } from 'passport-oauth2'

passport.serializeUser((user: any, done) => {
    done(null, user)
})

passport.deserializeUser((obj: any, done) => {
    done(null, obj)
})

const clientId = (process.env.CLIENT_ID || '').trim()
const clientSecret = (process.env.CLIENT_SECRET || '').trim()

if (!clientId || !clientSecret) {
    console.error('⚠️ [OAuth] CRITICAL: CLIENT_ID or CLIENT_SECRET is empty!')
    console.error(`  CLIENT_ID length: ${clientId.length}`)
    console.error(`  CLIENT_SECRET length: ${clientSecret.length}`)
    console.error('  OAuth login will NOT work. Check your environment variables.')
    console.error('  If using Docker, make sure to pass -e CLIENT_SECRET=... or use env_file.')
}

passport.use(new DiscordStrategy({
    clientID: clientId || 'MISSING',
    clientSecret: clientSecret || 'MISSING',
    callbackURL: process.env.CALLBACK_URL || 'http://localhost:3000/auth/discord/callback',
    scope: ['identify', 'guilds'],
    proxy: true
} as any, (accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) => {
    process.nextTick(() => {
        return done(null, profile)
    })
}))

