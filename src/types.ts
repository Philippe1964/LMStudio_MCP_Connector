/**
 * [AI-GENERATED FILE]
 * This file was generated and architected with the assistance of AI
 * (Google Antigravity / Gemini 3.8 Flash & LM Studio local).
 * Verified and validated by automated strict Quality Gate (TypeScript strict, test suites).
 *
 * JSON-RPC 2.0 & Model Context Protocol (MCP) Type Definitions
 */

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcErrorObject {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcResponseSuccess {
  jsonrpc: "2.0";
  id: string | number;
  result: unknown;
}

export interface JsonRpcResponseError {
  jsonrpc: "2.0";
  id: string | number | null;
  error: JsonRpcErrorObject;
}

export type JsonRpcResponse = JsonRpcResponseSuccess | JsonRpcResponseError;

export interface McpToolInputSchema {
  type: "object";
  properties: Record<
    string,
    {
      type: string;
      description?: string;
      items?: Record<string, unknown>;
    }
  >;
  required?: string[];
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: McpToolInputSchema;
}

export interface McpTextContent {
  type: "text";
  text: string;
}

export interface McpToolResult {
  content: McpTextContent[];
  isError?: boolean;
}

export interface LmStudioModel {
  id: string;
  object: string;
  owned_by?: string;
}

export interface LmStudioModelsResponse {
  data: LmStudioModel[];
}

export interface LmStudioChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LmStudioChatPayload {
  model: string;
  messages: LmStudioChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface LmStudioChatResponse {
  id?: string;
  model?: string;
  choices?: Array<{
    index?: number;
    message?: {
      role?: string;
      content?: string;
      reasoning_content?: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LmStudioEmbeddingPayload {
  model: string;
  input: string | string[];
}

export interface LmStudioEmbeddingResponse {
  data?: Array<{
    embedding: number[];
    index: number;
  }>;
  model?: string;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface HealthCheckResult {
  status: "ONLINE" | "OFFLINE";
  endpoint: string;
  latencyMs: number;
  activeModelsCount: number;
  modelNames: string[];
}

export type InstanceRole = "chat" | "embeddings" | "all";
export type InstanceHealth = "ONLINE" | "OFFLINE" | "DEGRADED" | "UNKNOWN";

export interface InstanceConfig {
  id: string;
  name?: string | undefined;
  url: string;
  roles: InstanceRole[];
  priority?: number | undefined;
}

export interface InstanceMetrics {
  totalRequests: number;
  failedRequests: number;
  inFlightRequests: number;
  latencyMs: number;
  lastCheckedAt?: number | undefined;
  loadedModels: string[];
}

export interface InstanceRuntimeState {
  config: InstanceConfig;
  health: InstanceHealth;
  metrics: InstanceMetrics;
  consecutiveFailures: number;
}

export interface PoolStatusReport {
  instances: Array<InstanceRuntimeState & { activeModelNames: string[] }>;
  activeCount: number;
  totalCount: number;
  allOffline: boolean;
}

export const REMOTE_FALLBACK_DIRECTIVE =
  "⚠️ [LM STUDIO OFFLINE - REMOTE FALLBACK REQUIRED]\n" +
  "No local LM Studio instances are currently reachable.\n" +
  "Antigravity is instructed to immediately fulfill this user request using its native remote LLM capabilities without failing the turn.";


