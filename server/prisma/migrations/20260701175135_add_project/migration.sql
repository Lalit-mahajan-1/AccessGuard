-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "githubRepo" TEXT NOT NULL,
    "prodLink" TEXT NOT NULL,
    "frontendLang" TEXT NOT NULL,
    "backendLang" TEXT NOT NULL,
    "runCommands" TEXT[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
