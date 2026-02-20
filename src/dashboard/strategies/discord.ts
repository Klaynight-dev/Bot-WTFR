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

passport.use(new DiscordStrategy({
    clientID: clientId,
    clientSecret: clientSecret,
    callbackURL: process.env.CALLBACK_URL || 'http://localhost:3000/auth/discord/callback',
    scope: ['identify', 'guilds'],
    proxy: true
} as any, (accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) => {
    process.nextTick(() => {
        return done(null, profile)
    })
}))
