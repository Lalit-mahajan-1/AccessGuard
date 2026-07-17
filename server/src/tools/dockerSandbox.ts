import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

export class DockerSandbox {
  /**
   * Spints up a node container, clones a github repo, and runs dependency install.
   * Returns the container name.
   */
  public static async createSandbox(githubRepo: string, sandboxId: string, subFolders: string[] = []): Promise<string> {
    const containerName = `sandbox-${sandboxId}`;
    
    // Stop and remove any conflicting container with the same name
    try {
      await execAsync(`docker stop ${containerName}`).catch(() => {});
      await execAsync(`docker rm ${containerName}`).catch(() => {});
    } catch {}

    // Start container
    await execAsync(`docker run -d --name ${containerName} --memory=512m --cpus=0.5 node:20-slim sleep infinity`);
    
    try {
      // Clone repository into /app inside container
      await execAsync(`docker exec ${containerName} sh -c "apt-get update -qq && apt-get install -y git -qq && git clone ${githubRepo} /app"`);
      
      // Install dependencies in each folder (root or monorepo subfolders)
      const folders = subFolders.length > 0 ? subFolders : ["."];
      for (const folder of folders) {
        console.log(`[DockerSandbox] Installing dependencies in: ${folder}`);
        await execAsync(`docker exec ${containerName} sh -c "cd /app/${folder} && (test -f package-lock.json && npm clean-install || test -f yarn.lock && yarn install || npm install)"`).catch(err => {
          console.warn(`[DockerSandbox] Warning: npm install failed in /app/${folder}: ${err.message}`);
        });
      }
    } catch (err: any) {
      console.warn(`[DockerSandbox] Clone/install warnings for ${containerName}: ${err.message}`);
    }

    return containerName;
  }

  /**
   * Reads a file's content from the sandbox app directory.
   */
  public static async readFile(containerName: string, filePath: string): Promise<string> {
    const { stdout } = await execAsync(`docker exec ${containerName} cat /app/${filePath}`);
    return stdout;
  }

  /**
   * Writes content to a file inside the sandbox app directory.
   * Uses docker cp from a host temp file to avoid escaping and format issues.
   */
  public static async writeFile(containerName: string, filePath: string, content: string): Promise<void> {
    const tmpDir = path.resolve("./tmp_sandbox");
    await fs.mkdir(tmpDir, { recursive: true });
    
    const tempFileName = `${containerName}-${Date.now()}.tmp`;
    const tempFilePath = path.join(tmpDir, tempFileName);
    await fs.writeFile(tempFilePath, content, "utf-8");
    
    try {
      // Ensure target directory exists inside container
      const targetDir = path.dirname(filePath);
      if (targetDir !== "." && targetDir !== "/") {
        await execAsync(`docker exec ${containerName} mkdir -p /app/${targetDir}`);
      }
      
      // Copy host temp file to container destination
      await execAsync(`docker cp ${tempFilePath} ${containerName}:/app/${filePath}`);
    } finally {
      // Delete temporary host file
      await fs.unlink(tempFilePath).catch(() => {});
    }
  }

  /**
   * Executes a command within the sandbox app directory.
   * Returns stdout, stderr, and the exit code.
   */
  public static async executeCommand(containerName: string, command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
      const { stdout, stderr } = await execAsync(`docker exec ${containerName} sh -c "cd /app && ${command}"`, {
        maxBuffer: 10 * 1024 * 1024 // 10MB
      });
      return { stdout, stderr, exitCode: 0 };
    } catch (err: any) {
      return {
        stdout: err.stdout || "",
        stderr: err.stderr || err.message || "",
        exitCode: err.code !== undefined ? err.code : 1
      };
    }
  }

  /**
   * Stops and removes the sandbox container.
   */
  public static async cleanupSandbox(containerName: string): Promise<void> {
    try {
      await execAsync(`docker stop ${containerName}`);
      await execAsync(`docker rm ${containerName}`);
    } catch (err: any) {
      console.error(`[DockerSandbox] Cleanup error for ${containerName}: ${err.message}`);
    }
  }
}
