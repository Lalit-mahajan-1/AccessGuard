import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { prisma } from '../lib/prisma.js';
import { env } from './env.js';

// Setup Google Strategy
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // 1. Try to find user by providerId
          let user = await prisma.user.findFirst({
            where: { providerId: profile.id, provider: 'GOOGLE' },
          });

          if (user) {
            return done(null, user);
          }

          // 2. Fallback: try to find user by email
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await prisma.user.findUnique({ where: { email } });
            
            if (user) {
              // Account Linking: Local account exists, link it to Google
              user = await prisma.user.update({
                where: { email },
                data: {
                  provider: 'GOOGLE', // Update provider to reflect linked status
                  providerId: profile.id,
                },
              });
              return done(null, user);
            }
          }

          // 3. User does not exist, create new
          const name = profile.displayName || profile.name?.givenName || 'User';
          user = await prisma.user.create({
            data: {
              name,
              email: email || `${profile.id}@google.com`, // Fallback email
              provider: 'GOOGLE',
              providerId: profile.id,
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error, false);
        }
      }
    )
  );
}

// Setup GitHub Strategy
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
        scope: ['user:email'],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // 1. Try to find user by providerId
          let user = await prisma.user.findFirst({
            where: { providerId: profile.id, provider: 'GITHUB' },
          });

          if (user) {
            return done(null, user);
          }

          // 2. Fallback: try to find user by email
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await prisma.user.findUnique({ where: { email } });
            
            if (user) {
              // Account Linking: Local account exists, link it to GitHub
              user = await prisma.user.update({
                where: { email },
                data: {
                  provider: 'GITHUB',
                  providerId: profile.id,
                },
              });
              return done(null, user);
            }
          }

          // 3. User does not exist, create new
          const name = profile.displayName || profile.username || 'User';
          user = await prisma.user.create({
            data: {
              name,
              email: email || `${profile.id}@github.com`, // Fallback email
              provider: 'GITHUB',
              providerId: profile.id,
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error, false);
        }
      }
    )
  );
}

// We do not strictly need serializeUser/deserializeUser if we don't rely on 
// session-based authentication across requests (we use JWT instead). 
// But express-session with passport requires them.
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
