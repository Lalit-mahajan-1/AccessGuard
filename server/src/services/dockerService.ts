import { exec } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

const CONTAINER_TTL_MS = 5 * 60 * 1000;

interface RunProjectOptions {
  githubRepo: string;
  runCommands: string[];
}

export const cloneAndRun = async ({ githubRepo, runCommands }: RunProjectOptions) => {
  const projectId = randomUUID();
  const containerName = `audit-${projectId}`;

  const logs: string[] = [];
  const log = (msg: string) => {
    const line = `[Docker][${projectId.slice(0, 8)}] ${msg}`;
    console.log(line);
    logs.push(msg);
  };

  try {
    // Build the command chain to run INSIDE container
    const shellCmd = [
      'apt-get update -qq && apt-get install -y git -qq',   // ensure git exists
      `git clone ${githubRepo} /app`,
      'cd /app',
      ...runCommands,
    ].join(' && ');

    log(`🐳 Starting container ${containerName}...`);
    log(`⚙️  Commands: git clone + ${runCommands.join(' && ')}`);

    // No volume mount! Everything happens inside container's filesystem
    const dockerCmd = `docker run -d --name ${containerName} -w / node:20 sh -c "${shellCmd}"`;
    const { stdout } = await execAsync(dockerCmd);
    const containerId = stdout.trim();

    log(`✅ Container running → ID: ${containerId.slice(0, 12)}`);
    log(`⏰ Auto-destroy scheduled in ${CONTAINER_TTL_MS / 1000}s`);

    setTimeout(() => destroyContainer(containerName), CONTAINER_TTL_MS);

    return {
      success: true,
      projectId,
      containerId,
      containerName,
      logs,
    };
  } catch (err: any) {
    log(`❌ ERROR: ${err.message}`);
    return { success: false, projectId, logs, error: err.message };
  }
};

export const destroyContainer = async (containerName: string) => {
  const log = (msg: string) => console.log(`[Docker][cleanup] ${msg}`);

  try {
    log(`🛑 Stopping ${containerName}...`);
    await execAsync(`docker stop ${containerName}`);
    log(`✅ Stopped`);

    log(`🗑️  Removing ${containerName}...`);
    await execAsync(`docker rm ${containerName}`);
    log(`✅ Removed`);

    return { success: true };
  } catch (err: any) {
    log(`❌ Cleanup error: ${err.message}`);
    return { success: false, error: err.message };
  }
};

export const cloneRepo = async ({ githubRepo, containerName }: { githubRepo: string; containerName: string }) => {
  await execAsync(`docker run -d --name ${containerName} --memory=512m --cpus=0.5 node:20-slim sleep infinity`);
  await execAsync(`docker exec ${containerName} sh -c "apt-get update -qq && apt-get install -y git -qq && git clone ${githubRepo} /app"`);
};

export const runInContainer = async (containerName: string, command: string) => {
  return await execAsync(`docker exec ${containerName} sh -c "${command}"`, {
    maxBuffer: 10 * 1024 * 1024 // 10MB
  });
};

export const stopContainer = destroyContainer;