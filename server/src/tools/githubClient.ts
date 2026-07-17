const GITHUB_TOKEN = process.env.GITHUB_PAT;
const GITHUB_API_URL = "https://api.github.com";

export class GithubClient {
  private static getHeaders() {
    if (!GITHUB_TOKEN) {
      throw new Error("GITHUB_TOKEN is not set in environment variables.");
    }
    return {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "AccessGuard-Agent",
    };
  }

  /**
   * Parses any GitHub URL or "owner/repo" string into the "owner/repo" format
   * required by the GitHub REST API.
   * Supports: https://github.com/owner/repo.git, git@github.com:owner/repo.git, owner/repo
   */
  public static parseRepo(repoInput: string): string {
    // Remove trailing .git
    let clean = repoInput.trim().replace(/\.git$/, "");
    // Handle SSH format: git@github.com:owner/repo
    const sshMatch = clean.match(/git@github\.com:(.+)/);
    if (sshMatch && sshMatch[1]) return sshMatch[1];
    // Handle HTTPS format: https://github.com/owner/repo
    const httpsMatch = clean.match(/github\.com\/(.+)/);
    if (httpsMatch && httpsMatch[1]) return httpsMatch[1];
    // Already in owner/repo format
    return clean;
  }

  /**
   * Retrieves the default branch (usually main or master) and its SHA.
   */
  public static async getDefaultBranch(repo: string): Promise<{ name: string; sha: string }> {
    const res = await fetch(`${GITHUB_API_URL}/repos/${repo}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch repo details: ${res.statusText}`);
    }
    const data = (await res.json()) as { default_branch: string };
    const branchName = data.default_branch || "main";

    const refRes = await fetch(`${GITHUB_API_URL}/repos/${repo}/git/ref/heads/${branchName}`, {
      headers: this.getHeaders(),
    });
    if (!refRes.ok) {
      throw new Error(`Failed to fetch ref for branch ${branchName}: ${refRes.statusText}`);
    }
    const refData = (await refRes.json()) as { object: { sha: string } };
    return { name: branchName, sha: refData.object.sha };
  }

  /**
   * Creates a new branch from the default branch.
   */
  public static async createBranch(repo: string, branchName: string): Promise<void> {
    const defaultBranch = await this.getDefaultBranch(repo);

    const res = await fetch(`${GITHUB_API_URL}/repos/${repo}/git/refs`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: defaultBranch.sha,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      // If branch already exists (status 422), we can ignore and reuse it
      if (res.status === 422 && err.includes("already exists")) {
        console.log(`[GithubClient] Branch ${branchName} already exists. Reusing.`);
        return;
      }
      throw new Error(`Failed to create branch: ${err}`);
    }
  }

  /**
   * Commits and pushes changes to a file on a specific branch.
   */
  public static async commitFile(
    repo: string,
    branchName: string,
    filePath: string,
    content: string,
    commitMessage: string
  ): Promise<void> {
    // Try to get current file SHA if it already exists on this branch
    let sha: string | undefined;
    try {
      const contentRes = await fetch(
        `${GITHUB_API_URL}/repos/${repo}/contents/${filePath}?ref=${branchName}`,
        {
          headers: this.getHeaders(),
        }
      );
      if (contentRes.ok) {
        const contentData = (await contentRes.json()) as { sha: string };
        sha = contentData.sha;
      }
    } catch {}

    const base64Content = Buffer.from(content, "utf-8").toString("base64");

    const res = await fetch(`${GITHUB_API_URL}/repos/${repo}/contents/${filePath}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        branch: branchName,
        sha,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to commit file ${filePath} to branch ${branchName}: ${err}`);
    }
  }

  /**
   * Creates a Pull Request from branchName to the default base branch.
   * Returns the PR HTML URL.
   */
  public static async createPullRequest(
    repo: string,
    branchName: string,
    title: string,
    body: string
  ): Promise<string> {
    const defaultBranch = await this.getDefaultBranch(repo);

    const res = await fetch(`${GITHUB_API_URL}/repos/${repo}/pulls`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        title,
        body,
        head: branchName,
        base: defaultBranch.name,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create Pull Request: ${err}`);
    }

    const data = (await res.json()) as { html_url: string };
    return data.html_url;
  }
}
