/**
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

