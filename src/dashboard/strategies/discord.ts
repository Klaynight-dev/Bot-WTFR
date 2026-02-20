import passport from 'passport'
import { Strategy as DiscordStrategy } from 'passport-discord'
import { VerifyCallback } from 'passport-oauth2'

passport.serializeUser((user: any, done) => {
    done(null, user)
})

passport.deserializeUser((obj: any, done) => {
    done(null, obj)
})

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    callbackURL: process.env.CALLBACK_URL || 'http://localhost:3000/auth/discord/callback',
    scope: ['identify', 'guilds']
}, (accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) => {
    process.nextTick(() => {
        return done(null, profile)
    })
}))
