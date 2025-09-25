import { QueryRequest, SearchResponse, Config, Stats, MCPRequest, MCPResponse, LogEntry, HealthResponse } from "@shared/schema";

const API_BASE = "/api";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(response.status, error.error || error.message || "API request failed");
  }

  return response.json();
}

export const api = {
  // NLWeb Ask endpoint
  async ask(request: QueryRequest): Promise<SearchResponse> {
    return apiRequest<SearchResponse>("/ask", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  // Model Context Protocol endpoint
  async mcp(request: MCPRequest): Promise<MCPResponse> {
    return apiRequest<MCPResponse>("/mcp", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  // Configuration management
  async getConfig(): Promise<Config> {
    return apiRequest<Config>("/config");
  },

  async updateConfig(config: Partial<Config>): Promise<{ message: string }> {
    return apiRequest("/config", {
      method: "POST",
      body: JSON.stringify(config),
    });
  },

  // Data sources management
  async getStats(): Promise<Stats> {
    return apiRequest<Stats>("/data-sources");
  },

  async addDataSource(source: { name: string; url: string; type: string; description?: string }): Promise<{ message: string }> {
    return apiRequest("/data-sources", {
      method: "POST", 
      body: JSON.stringify(source),
    });
  },

  // System logs
  async getLogs(): Promise<{ logs: LogEntry[] }> {
    return apiRequest<{ logs: LogEntry[] }>("/logs");
  },

  // Health check
  async getHealth(): Promise<HealthResponse> {
    return apiRequest<HealthResponse>("/health");
  },

  // API testing
  async testEndpoint(testRequest: {
    endpoint: string;
    method: string;
    headers: Record<string, string>;
    body: any;
  }): Promise<{
    status: number;
    headers: Record<string, string>;
    body: any;
    response_time: string;
  }> {
    return apiRequest("/test", {
      method: "POST",
      body: JSON.stringify(testRequest),
    });
  },
};
