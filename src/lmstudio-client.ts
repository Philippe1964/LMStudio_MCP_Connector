/**
 * [AI-GENERATED FILE]
 * This file was generated and architected with the assistance of AI
 * (Google Antigravity / Gemini 3.8 Flash & LM Studio local).
 * Verified and validated by automated strict Quality Gate (TypeScript strict, test suites).
 *
 * LM Studio REST API Client (OpenAI compatible)
 */

import type {
  HealthCheckResult,
  LmStudioChatPayload,
  LmStudioChatResponse,
  LmStudioEmbeddingPayload,
  LmStudioEmbeddingResponse,
  LmStudioModelsResponse,
} from "./types.js";
import type { ServerConfig } from "./config.js";

export class LmStudioClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fallbackChatModel: string;
  private readonly fallbackEmbedModel: string;

  constructor(config: ServerConfig) {
    this.baseUrl = config.baseUrl;
    this.timeoutMs = config.timeoutMs;
    this.fallbackChatModel = config.fallbackChatModel;
    this.fallbackEmbedModel = config.fallbackEmbedModel;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async request<T>(endpoint: string, method: "GET" | "POST" = "GET", body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `LM Studio HTTP ${response.status} (${response.statusText}) at ${endpoint}: ${errorText}`
        );
      }
      return (await response.json()) as T;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`LM Studio request timed out after ${this.timeoutMs}ms at ${url}`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async listModels(): Promise<LmStudioModelsResponse> {
    return this.request<LmStudioModelsResponse>("/v1/models", "GET");
  }

  public async getDefaultModel(type: "chat" | "embedding" = "chat"): Promise<string> {
    try {
      const modelsData = await this.listModels();
      const models = modelsData.data || [];

      if (type === "embedding") {
        const embedModel = models.find(
          (m) => m.id && (m.id.toLowerCase().includes("embed") || m.id.toLowerCase().includes("nomic"))
        );
        if (embedModel) return embedModel.id;
      } else {
        const chatModel = models.find((m) => m.id && !m.id.toLowerCase().includes("embed"));
        if (chatModel) return chatModel.id;
      }

      if (models.length > 0 && models[0]?.id) {
        return models[0].id;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[lmstudio-mcp] Failed to auto-detect model: ${msg}`);
    }

    return type === "embedding" ? this.fallbackEmbedModel : this.fallbackChatModel;
  }

  public async chatCompletion(payload: LmStudioChatPayload): Promise<LmStudioChatResponse> {
    return this.request<LmStudioChatResponse>("/v1/chat/completions", "POST", payload);
  }

  public async generateEmbedding(payload: LmStudioEmbeddingPayload): Promise<LmStudioEmbeddingResponse> {
    return this.request<LmStudioEmbeddingResponse>("/v1/embeddings", "POST", payload);
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const modelsData = await this.listModels();
      const latencyMs = Date.now() - startTime;
      const models = modelsData.data || [];
      return {
        status: "ONLINE",
        endpoint: this.baseUrl,
        latencyMs,
        activeModelsCount: models.length,
        modelNames: models.map((m) => m.id),
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      return {
        status: "OFFLINE",
        endpoint: this.baseUrl,
        latencyMs,
        activeModelsCount: 0,
        modelNames: [],
      };
    }
  }
}

