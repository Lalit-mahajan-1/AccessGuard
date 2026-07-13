// controllers/repoController.ts
import type { Response } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { cloneRepo, destroyContainer, runInContainer } from '../services/dockerService.js';
import { randomUUID } from 'crypto';

export const detectRepo = async (req: AuthRequest, res: Response): Promise<void> => {
  const { githubRepo, prodLink } = req.body;

  if (!githubRepo || !prodLink) {
    res.status(400).json({ success: false, error: 'githubRepo and prodLink are required' });
    return;
  }

  const containerName = `detect-${randomUUID()}`;

  try {
    await cloneRepo({ githubRepo, containerName });

    const { stdout: findOutput } = await runInContainer(
      containerName,
      `find /app -name "package.json" -not -path "*/node_modules/*" | sort`
    );

    const packagePaths = findOutput.trim().split('\n').filter(Boolean);

    if (packagePaths.length === 0) {
      res.status(422).json({ success: false, error: 'No package.json found. Only JavaScript projects are supported.' });
      return;
    }

    const projects = [];

    for (const pkgPath of packagePaths) {
      const { stdout: pkgRaw } = await runInContainer(containerName, `cat ${pkgPath}`);

      try {
        const pkg = JSON.parse(pkgRaw);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        const scripts = Object.keys(pkg.scripts || {});
        const folder = pkgPath.replace('/app/', '').replace('/package.json', '') || 'root';

        const { stdout: hasBun }  = await runInContainer(containerName, `test -f /app/bun.lockb && echo yes || echo no`);
        const { stdout: hasPnpm } = await runInContainer(containerName, `test -f /app/pnpm-lock.yaml && echo yes || echo no`);
        const { stdout: hasYarn } = await runInContainer(containerName, `test -f /app/yarn.lock && echo yes || echo no`);

        const packageManager = hasBun.trim() === 'yes' ? 'bun'
          : hasPnpm.trim() === 'yes' ? 'pnpm'
          : hasYarn.trim() === 'yes' ? 'yarn'
          : 'npm';

        const framework = deps['next'] ? 'next'
          : deps['vite'] ? 'vite'
          : deps['react'] ? 'react'
          : deps['vue'] ? 'vue'
          : deps['express'] || deps['fastify'] || deps['hono'] ? 'node-server'
          : 'node';

        const runCommands = scripts
          .filter(s => ['lint', 'build', 'test', 'typecheck'].includes(s))
          .map(s => `${packageManager} run ${s}`);

        projects.push({
          folder,
          framework,
          packageManager,
          hasTypeScript: !!deps['typescript'],
          scripts,
          runCommands,
          dependencies: Object.keys(deps),
        });

      } catch {
        continue;
      }
    }

    res.json({
      success: true,
      githubRepo,
      prodLink,
      meta: {
        type: projects.length > 1 ? 'monorepo' : 'single',
        projects,
      },
    });

  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    await destroyContainer(containerName);
  }
};