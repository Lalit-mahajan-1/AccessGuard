# 🛠️ Prisma Setup Guide for AccessGuard

## 📋 Prerequisites

1. **PostgreSQL** installed on your machine
2. **Node.js** v18 or higher
3. **Git** clone the repo

---

## 🚀 Initial Setup (First Time Only)

### 1. Install dependencies
```bash
cd server
npm install
2. Create .env file
Copy .env.example to .env:

Bash

copy .env.example .env
Then edit .env and add your PostgreSQL connection string:

env

DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/accessguard"
PORT=5000
Replace USERNAME and PASSWORD with your PostgreSQL credentials.

3. Generate Prisma Client
Bash

npx prisma generate
4. Run migrations to setup database
Bash

npx prisma migrate dev
✅ Done! You can now run the server:

Bash

npm run dev
📚 Common Prisma Commands
🔄 npx prisma generate
What it does: Generates the Prisma Client based on your schema.

When to run:

After cloning the repo
After changing schema.prisma
After pulling new changes from Git
Bash

npx prisma generate
🆕 npx prisma migrate dev --name <name>
What it does: Creates a new migration and applies it to your database.

When to run:

After adding/removing/modifying models in schema.prisma
Bash

npx prisma migrate dev --name add_user_model
Naming tips:

✅ add_user_model
✅ add_email_to_user
✅ remove_phone_field
❌ update (too vague)
🔄 npx prisma migrate deploy
What it does: Applies pending migrations (used in production).

When to run:

On production servers
In CI/CD pipelines
Bash

npx prisma migrate deploy
📥 npx prisma db pull
What it does: Pulls the database schema into schema.prisma (reverse engineer).

When to run:

When DB schema was changed manually outside Prisma
Bash

npx prisma db pull
📤 npx prisma db push
What it does: Pushes schema changes directly to DB without creating migration files.

When to run:

For quick prototyping (NOT recommended for production)
Bash

npx prisma db push
🎨 npx prisma studio
What it does: Opens a GUI to view/edit your database in the browser.

When to run:

Anytime you want to see your data visually
Bash

npx prisma studio
Opens at: http://localhost:5555

🔄 npx prisma migrate reset
What it does: Drops all data and re-runs all migrations.

⚠️ WARNING: This deletes ALL your data!

When to run:

During development when you want a fresh database
Bash

npx prisma migrate reset
✅ npx prisma validate
What it does: Checks if your schema.prisma is valid.

Bash

npx prisma validate
🎨 npx prisma format
What it does: Auto-formats your schema.prisma file.

Bash

npx prisma format
🔥 Typical Workflow
Scenario 1: You just cloned the repo
Bash

cd server
npm install
copy .env.example .env
# Edit .env with your DATABASE_URL
npx prisma generate
npx prisma migrate dev
npm run dev
Scenario 2: You pulled new changes from Git
Bash

git pull
npm install
npx prisma migrate dev
npm run dev
Scenario 3: You added a new model in schema.prisma
Bash

npx prisma migrate dev --name add_post_model
Scenario 4: You want to see your data
Bash

npx prisma studio
Scenario 5: Database is messed up, want to reset
Bash

npx prisma migrate reset
🆘 Troubleshooting
Error: PrismaClient is unable to be run in the browser
→ Run npx prisma generate

Error: Environment variable not found: DATABASE_URL
→ Check your .env file exists and has DATABASE_URL

Error: Can't reach database server
→ Make sure PostgreSQL is running on your machine

Error: Migration failed
→ Try npx prisma migrate reset (⚠️ deletes data)

TypeScript can't find PrismaClient
→ Run npx prisma generate then restart VS Code TS server:
Ctrl + Shift + P → "TypeScript: Restart TS Server"

📞 Need Help?
Prisma Docs: https://www.prisma.io/docs
Schema Reference: https://pris.ly/d/prisma-schema
text


---

## 📝 Also Create `.env.example`

Banao `server/.env.example`:

```env
# PostgreSQL Database URL
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/accessguard"

# Server Port
PORT=5000
🎯 Update Main README.md
Apne project ke main README.md me ye add karo:

Markdown

## 🛠️ Setup

### Backend (Server)
See [server/PRISMA_GUIDE.md](./server/PRISMA_GUIDE.md) for database setup.

Quick start:
\`\`\`bash
cd server
npm install
copy .env.example .env
# Edit .env with your DATABASE_URL
npx prisma generate
npx prisma migrate dev
npm run dev
\`\`\`
✅ Steps to Add These Files
Bash

# Create the guide
cd server
# Create PRISMA_GUIDE.md and paste the content above

# Create .env.example
# Create .env.example and paste the content above

# Commit and push
git add PRISMA_GUIDE.md .env.example
git commit -m "docs: add prisma setup guide for contributors"
git push origin main
