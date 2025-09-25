import { z } from "zod";

// Query Request Schema
export const queryRequestSchema = z.object({
  query: z.string().min(1, "Query is required"),
  mode: z.enum(["search", "chat"]).default("search"),
  prev: z.string().optional(),
});

export type QueryRequest = z.infer<typeof queryRequestSchema>;

// Configuration Schemas
export const openaiConfigSchema = z.object({
  model: z.string().default("gpt-4"),
  temperature: z.number().min(0).max(1).default(0.7),
  max_tokens: z.number().min(1).max(4000).default(2048),
  has_api_key: z.boolean(),
});

export const nlwebConfigSchema = z.object({
  server_host: z.string().default("0.0.0.0"),
  server_port: z.number().default(5000),
  vector_db: z.string().default("memory"),
  embedding_model: z.string().default("text-embedding-ada-002"),
  mcp_enabled: z.boolean().default(true),
});

export const errorHandlingConfigSchema = z.object({
  retry_attempts: z.number().min(1).max(10).default(3),
  timeout: z.number().min(5).max(120).default(30),
  backoff_strategy: z.enum(["exponential", "linear", "fixed"]).default("exponential"),
  enable_fallback: z.boolean().default(true),
});

export const configSchema = z.object({
  openai: openaiConfigSchema,
  nlweb: nlwebConfigSchema,
  error_handling: errorHandlingConfigSchema,
});

export type OpenAIConfig = z.infer<typeof openaiConfigSchema>;
export type NLWebConfig = z.infer<typeof nlwebConfigSchema>;
export type ErrorHandlingConfig = z.infer<typeof errorHandlingConfigSchema>;
export type Config = z.infer<typeof configSchema>;

// Data Source Schema
export const dataSourceSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  type: z.enum(["schema_org", "rss"]),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "syncing", "error"]).default("inactive"),
  object_count: z.number().default(0),
  last_updated: z.number().optional(),
  error: z.string().optional(),
});

export type DataSource = z.infer<typeof dataSourceSchema>;

// Schema.org Object Schema
export const schemaOrgObjectSchema = z.object({
  "@type": z.string(),
  "@context": z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  address: z.any().optional(),
  aggregateRating: z.any().optional(),
  priceRange: z.string().optional(),
  servesCuisine: z.string().optional(),
  amenityFeature: z.array(z.any()).optional(),
}).passthrough(); // Allow additional properties

export type SchemaOrgObject = z.infer<typeof schemaOrgObjectSchema>;

// Search Response Schema
export const searchResponseSchema = z.object({
  "@context": z.string().optional(),
  "@type": z.literal("SearchResultsPage"),
  mainEntity: z.array(schemaOrgObjectSchema),
  query: z.string(),
  numberOfItems: z.number(),
  processingTime: z.number(),
  source: z.string().optional(),
  aiResponse: z.string().optional(),
  usage: z.object({
    prompt_tokens: z.number().optional(),
    completion_tokens: z.number().optional(),
    total_tokens: z.number().optional(),
  }).optional(),
  context: z.string().optional(),
  message: z.string().optional(),
});

export type SearchResponse = z.infer<typeof searchResponseSchema>;

// MCP Request Schema
export const mcpRequestSchema = z.object({
  jsonrpc: z.literal("2.0").default("2.0"),
  method: z.string(),
  params: z.record(z.any()).default({}),
  id: z.union([z.string(), z.number()]).optional(),
});

export type MCPRequest = z.infer<typeof mcpRequestSchema>;

// MCP Response Schema  
export const mcpResponseSchema = z.object({
  jsonrpc: z.literal("2.0"),
  result: z.any().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
  }).optional(),
  id: z.union([z.string(), z.number()]).optional(),
});

export type MCPResponse = z.infer<typeof mcpResponseSchema>;

// Log Entry Schema
export const logEntrySchema = z.object({
  timestamp: z.string(),
  level: z.enum(["ERROR", "WARN", "INFO", "DEBUG"]),
  source: z.string(),
  message: z.string(),
});

export type LogEntry = z.infer<typeof logEntrySchema>;

// Statistics Schema
export const statsSchema = z.object({
  total_sites: z.number(),
  schema_objects: z.number(),
  last_sync: z.number().nullable(),
  success_rate: z.number(),
  data_sources: z.array(dataSourceSchema),
  vector_store: z.object({
    total_documents: z.number(),
    total_embeddings: z.number(),
    indexed_count: z.number(),
    document_types: z.record(z.number()),
    embedding_dimension: z.number(),
  }),
});

export type Stats = z.infer<typeof statsSchema>;

// Health Check Schema
export const healthResponseSchema = z.object({
  status: z.enum(["healthy", "unhealthy"]),
  timestamp: z.number(),
  services: z.object({
    nlweb_server: z.string(),
    openai_api: z.string(),
    vector_store: z.string(),
    mcp_server: z.string(),
  }).optional(),
  stats: z.any().optional(),
  error: z.string().optional(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
