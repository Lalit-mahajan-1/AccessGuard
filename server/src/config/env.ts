import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
    "PORT",
    // "DATABASE_URL"
] as const;

for(const envVar of requiredEnvVars)
{
    if(!process.env[envVar])
    {
        throw new Error(
            `missing required environment varables: ${envVar}`
        );
    }
}

export const env = {
   PORT: Number(process.env.PORT),
//   DATABASE_URL: process.env.DATABASE_URL!, 

}