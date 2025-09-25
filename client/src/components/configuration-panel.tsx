import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Config } from "@shared/schema";

export default function ConfigurationPanel() {
  const [config, setConfig] = useState<Config | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configData, isLoading } = useQuery({
    queryKey: ["config"],
    queryFn: api.getConfig,
  });

  const updateConfigMutation = useMutation({
    mutationFn: (updatedConfig: Partial<Config>) => api.updateConfig(updatedConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
      toast({
        title: "Configuration Saved",
        description: "Settings have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (configData) {
      setConfig(configData);
    }
  }, [configData]);

  const handleSave = (section: keyof Config) => {
    if (!config) return;
    
    updateConfigMutation.mutate({
      [section]: config[section],
    });
  };

  if (isLoading || !config) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-card border-b border-border px-8 py-6">
        <h2 className="text-2xl font-semibold">Configuration Settings</h2>
        <p className="text-muted-foreground mt-1">Configure OpenAI API parameters and NLWeb settings</p>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl space-y-8">
          {/* OpenAI Configuration */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <i className="fas fa-brain mr-3 text-primary"></i>
                OpenAI API Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="api-key">API Key Status</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`status-indicator ${config.openai.has_api_key ? "status-online" : "status-offline"}`}></span>
                    <span className="text-sm">
                      {config.openai.has_api_key ? "API key configured" : "API key missing"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Managed via OPENAI_API_KEY environment variable
                  </p>
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Select
                    value={config.openai.model}
                    onValueChange={(value) =>
                      setConfig({ ...config, openai: { ...config.openai, model: value } })
                    }
                  >
                    <SelectTrigger data-testid="model-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="temperature">
                    Temperature: {config.openai.temperature}
                  </Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.openai.temperature}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        openai: { ...config.openai, temperature: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full mt-2"
                    data-testid="temperature-slider"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Focused</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="max-tokens">
                    Max Tokens: {config.openai.max_tokens}
                  </Label>
                  <input
                    type="range"
                    min="100"
                    max="4000"
                    step="100"
                    value={config.openai.max_tokens}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        openai: { ...config.openai, max_tokens: parseInt(e.target.value) },
                      })
                    }
                    className="w-full mt-2"
                    data-testid="max-tokens-slider"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>100</span>
                    <span>4000</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleSave("openai")}
                disabled={updateConfigMutation.isPending}
                className="mt-6"
                data-testid="save-openai-config"
              >
                <i className="fas fa-save mr-2"></i>
                Save OpenAI Configuration
              </Button>
            </CardContent>
          </Card>

          {/* NLWeb Configuration */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <i className="fas fa-globe mr-3 text-secondary"></i>
                NLWeb Server Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="server-host">Server Host</Label>
                  <Input
                    id="server-host"
                    value={config.nlweb.server_host}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        nlweb: { ...config.nlweb, server_host: e.target.value },
                      })
                    }
                    data-testid="server-host-input"
                  />
                </div>

                <div>
                  <Label htmlFor="server-port">Server Port</Label>
                  <Input
                    id="server-port"
                    type="number"
                    value={config.nlweb.server_port}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        nlweb: { ...config.nlweb, server_port: parseInt(e.target.value) },
                      })
                    }
                    data-testid="server-port-input"
                  />
                </div>

                <div>
                  <Label htmlFor="vector-db">Vector Database</Label>
                  <Select
                    value={config.nlweb.vector_db}
                    onValueChange={(value) =>
                      setConfig({ ...config, nlweb: { ...config.nlweb, vector_db: value } })
                    }
                  >
                    <SelectTrigger data-testid="vector-db-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="memory">In-Memory</SelectItem>
                      <SelectItem value="qdrant">Qdrant</SelectItem>
                      <SelectItem value="elasticsearch">Elasticsearch</SelectItem>
                      <SelectItem value="postgres">PostgreSQL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="embedding-model">Embedding Model</Label>
                  <Select
                    value={config.nlweb.embedding_model}
                    onValueChange={(value) =>
                      setConfig({ ...config, nlweb: { ...config.nlweb, embedding_model: value } })
                    }
                  >
                    <SelectTrigger data-testid="embedding-model-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-embedding-ada-002">text-embedding-ada-002</SelectItem>
                      <SelectItem value="text-embedding-3-small">text-embedding-3-small</SelectItem>
                      <SelectItem value="text-embedding-3-large">text-embedding-3-large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mcp-enabled"
                    checked={config.nlweb.mcp_enabled}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        nlweb: { ...config.nlweb, mcp_enabled: !!checked },
                      })
                    }
                    data-testid="mcp-enabled-checkbox"
                  />
                  <Label htmlFor="mcp-enabled">Enable Model Context Protocol (MCP) server</Label>
                </div>
              </div>

              <Button
                onClick={() => handleSave("nlweb")}
                disabled={updateConfigMutation.isPending}
                className="mt-6"
                data-testid="save-nlweb-config"
              >
                <i className="fas fa-save mr-2"></i>
                Save NLWeb Configuration
              </Button>
            </CardContent>
          </Card>

          {/* Error Handling Configuration */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <i className="fas fa-shield-alt mr-3 text-accent"></i>
                Error Handling & Retry Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="retry-attempts">Retry Attempts</Label>
                  <Input
                    id="retry-attempts"
                    type="number"
                    min="1"
                    max="10"
                    value={config.error_handling.retry_attempts}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        error_handling: {
                          ...config.error_handling,
                          retry_attempts: parseInt(e.target.value),
                        },
                      })
                    }
                    data-testid="retry-attempts-input"
                  />
                </div>

                <div>
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min="5"
                    max="120"
                    value={config.error_handling.timeout}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        error_handling: { ...config.error_handling, timeout: parseInt(e.target.value) },
                      })
                    }
                    data-testid="timeout-input"
                  />
                </div>

                <div>
                  <Label htmlFor="backoff-strategy">Backoff Strategy</Label>
                  <Select
                    value={config.error_handling.backoff_strategy}
                    onValueChange={(value) =>
                      setConfig({
                        ...config,
                        error_handling: { ...config.error_handling, backoff_strategy: value as any },
                      })
                    }
                  >
                    <SelectTrigger data-testid="backoff-strategy-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exponential">Exponential</SelectItem>
                      <SelectItem value="linear">Linear</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable-fallback"
                    checked={config.error_handling.enable_fallback}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        error_handling: { ...config.error_handling, enable_fallback: !!checked },
                      })
                    }
                    data-testid="enable-fallback-checkbox"
                  />
                  <Label htmlFor="enable-fallback">Enable fallback to cached responses when API fails</Label>
                </div>
              </div>

              <Button
                onClick={() => handleSave("error_handling")}
                disabled={updateConfigMutation.isPending}
                className="mt-6"
                data-testid="save-error-config"
              >
                <i className="fas fa-save mr-2"></i>
                Save Error Handling Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
