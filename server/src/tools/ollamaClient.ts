import http from "http";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/generate";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "qwen2.5-coder:1.5b";

export class OllamaClient {
  // Reset cache on each module load so model changes in .env take effect after restart
  private static activeModel: string | null = null;

  /**
   * Fetches installed models from Ollama to find a fallback if the default model is missing.
   * Uses native http to avoid any undici headers timeout issues.
   */
  private static async getModelToUse(): Promise<string> {
    if (this.activeModel) return this.activeModel;

    try {
      const tagsUrl = OLLAMA_URL.replace("/generate", "/tags");
      const installedModels = await new Promise<string[]>((resolve, reject) => {
        const url = new URL(tagsUrl);
        const req = http.get({
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          timeout: 10000, // 10 seconds timeout for tags list
        }, (res) => {
          let data = "";
          res.setEncoding("utf-8");
          res.on("data", (chunk) => { data += chunk; });
          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(data) as { models?: { name: string }[] };
                resolve(parsed.models?.map((m) => m.name) || []);
              } catch (e) {
                reject(e);
              }
            } else {
              reject(new Error(`Ollama tags status: ${res.statusCode}`));
            }
          });
        });
        req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
        req.on("error", (e) => { reject(e); });
      });

      if (installedModels.length > 0) {
        const hasExact = installedModels.includes(DEFAULT_MODEL);
        const matched = installedModels.find(
          (name) => name.split(":")[0] === DEFAULT_MODEL.split(":")[0]
        );

        if (hasExact) {
          this.activeModel = DEFAULT_MODEL;
        } else if (matched) {
          this.activeModel = matched;
        } else {
          this.activeModel = installedModels[0] || DEFAULT_MODEL;
          console.log(`[Ollama] Model "${DEFAULT_MODEL}" not found. Falling back to "${this.activeModel}".`);
        }
        return this.activeModel!;
      }
    } catch (err: any) {
      console.warn("[Ollama] Could not query tags endpoint, using default model value.", err.message);
    }

    this.activeModel = DEFAULT_MODEL;
    return DEFAULT_MODEL;
  }

  /**
   * Generates a response from the Ollama model for a given prompt.
   * Uses native Node http module with a configured 5-minute timeout.
   */
  public static async generate(prompt: string, jsonFormat = false): Promise<string> {
    const model = await this.getModelToUse();

    return new Promise((resolve, reject) => {
      const url = new URL(OLLAMA_URL);
      const postData = JSON.stringify({
        model,
        prompt,
        stream: false,
        format: jsonFormat ? "json" : undefined,
      });

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 600000, // 10 minutes timeout limit
      };

      const req = http.request(options, (res) => {
        let data = "";
        res.setEncoding("utf-8");
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            let errMsg = res.statusMessage || `Status Code: ${res.statusCode}`;
            try {
              const errJson = JSON.parse(data);
              if (errJson.error) errMsg = errJson.error;
            } catch {}
            reject(new Error(`Ollama model generation failed: ${errMsg}`));
          } else {
            try {
              const parsed = JSON.parse(data) as { response: string };
              resolve(parsed.response);
            } catch (err) {
              reject(new Error(`Failed to parse Ollama JSON response: ${data}`));
            }
          }
        });
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Ollama request timed out (5 minutes limit exceeded)"));
      });

      req.on("error", (err) => {
        console.error("[OllamaClient] Native http request failed. Error:", err);
        reject(err);
      });

      req.write(postData);
      req.end();
    });
  }
}
