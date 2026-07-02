// src/config/env.ts
import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
    "PORT",
    "DATABASE_URL",
    "JWT_SECRET",
    "EMAIL_USER",
    "EMAIL_PASS",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_CALLBACK_URL",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "GITHUB_CALLBACK_URL"
] as const;

for(const envVar of requiredEnvVars) {
    if(!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

export const env = {
   PORT: Number(process.env.PORT) || 5000,
   DATABASE_URL: process.env.DATABASE_URL!, 
   JWT_SECRET: process.env.JWT_SECRET!,
   EMAIL_USER: process.env.EMAIL_USER!,
   EMAIL_PASS: process.env.EMAIL_PASS!,
   FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
   GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
   GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
   GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL!,
   GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID!,
   GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET!,
   GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL!
}