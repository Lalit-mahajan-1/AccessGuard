// src/config/env.ts
import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
    "PORT",
    "DATABASE_URL",
    "JWT_SECRET",
    "EMAIL_USER",
    "EMAIL_PASS",
] as const;

for(const envVar of requiredEnvVars) {
    if(!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

export const env = {
   PORT: Number(process.env.PORT),
   DATABASE_URL: process.env.DATABASE_URL!, 
   JWT_SECRET: process.env.JWT_SECRET!,
   EMAIL_USER: process.env.EMAIL_USER!,
   EMAIL_PASS: process.env.EMAIL_PASS!,
   FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
}