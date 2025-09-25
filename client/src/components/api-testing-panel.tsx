import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function ApiTestingPanel() {
  const [endpoint, setEndpoint] = useState("/ask");
  const [method, setMethod] = useState("POST");
  const [headers, setHeaders] = useState(JSON.stringify({
    "Content-Type": "application/json",
    "Authorization": "Bearer ...",
    "X-API-Version": "2024-01"
  }, null, 2));
  const [requestBody, setRequestBody] = useState(JSON.stringify({
    "query": "Find Italian restaurants in downtown San Francisco with outdoor seating",
    "mode": "search",
    "options": {
      "temperature": 0.7,
      "max_tokens": 2048,
      "include_metadata": true
    }
  }, null, 2));
  const [response, setResponse] = useState<any>(null);
  const { toast } = useToast();

  const testMutation = useMutation({
    mutationFn: (testRequest: any) => api.testEndpoint(testRequest),
    onSuccess: (data) => {
      setResponse(data);
      toast({
        title: "API Test Successful",
        description: `Response received with status ${data.status}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "API Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendRequest = () => {
    try {
      const parsedHeaders = JSON.parse(headers);
      const parsedBody = JSON.parse(requestBody);

      testMutation.mutate({
        endpoint,
        method,
        headers: parsedHeaders,
        body: parsedBody,
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your headers and request body formatting",
        variant: "destructive",
      });
    }
  };

  const handleCopyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      toast({
        title: "Copied",
        description: "Response copied to clipboard",
      });
    }
  };

  const endpointOptions = [
    { value: "/ask", label: "NLWeb /ask - Natural Language Query" },
    { value: "/mcp", label: "NLWeb /mcp - Model Context Protocol" },
    { value: "/config", label: "Configuration Management" },
    { value: "/data-sources", label: "Data Sources Management" },
    { value: "/health", label: "Health Check" },
  ];

  const exampleBodies = {
    "/ask": {
      "query": "Find Italian restaurants in downtown San Francisco with outdoor seating",
      "mode": "search"
    },
    "/mcp": {
      "jsonrpc": "2.0",
      "method": "ask",
      "params": {
        "query": "Search for hotels in New York",
        "context": ""
      },
      "id": 1
    },
    "/config": {},
    "/data-sources": {
      "name": "Example Site",
      "url": "https://example.com/sitemap.xml",
      "type": "schema_org",
      "description": "Example Schema.org data source"
    },
    "/health": {}
  };

  const handleEndpointChange = (newEndpoint: string) => {
    setEndpoint(newEndpoint);
    const exampleBody = exampleBodies[newEndpoint as keyof typeof exampleBodies] || {};
    setRequestBody(JSON.stringify(exampleBody, null, 2));
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-card border-b border-border px-8 py-6">
        <h2 className="text-2xl font-semibold">API Testing Interface</h2>
        <p className="text-muted-foreground mt-1">Test NLWeb and OpenAI API endpoints directly</p>
      </header>

      <div className="flex-1 flex">
        {/* Request Panel */}
        <div className="w-1/2 border-r border-border bg-card">
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">Endpoint</label>
              <Select value={endpoint} onValueChange={handleEndpointChange}>
                <SelectTrigger data-testid="endpoint-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {endpointOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">HTTP Method</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="GET"
                    checked={method === "GET"}
                    onChange={(e) => setMethod(e.target.value)}
                    className="text-primary border-border focus:ring-ring"
                    data-testid="method-get"
                  />
                  <span className="text-sm">GET</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="POST"
                    checked={method === "POST"}
                    onChange={(e) => setMethod(e.target.value)}
                    className="text-primary border-border focus:ring-ring"
                    data-testid="method-post"
                  />
                  <span className="text-sm">POST</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Request Headers</label>
              <div className="syntax-highlight">
                <Textarea
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  className="h-24 resize-none bg-transparent border-none font-mono text-sm"
                  data-testid="headers-textarea"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Request Body</label>
              <div className="syntax-highlight">
                <Textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="h-48 resize-none bg-transparent border-none font-mono text-sm"
                  data-testid="body-textarea"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleSendRequest}
                disabled={testMutation.isPending}
                className="flex-1"
                data-testid="send-request"
              >
                {testMutation.isPending ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Send Request
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                title="Save as preset"
                data-testid="save-preset"
              >
                <i className="fas fa-bookmark"></i>
              </Button>
              <Button
                variant="outline"
                title="Load preset"
                data-testid="load-preset"
              >
                <i className="fas fa-folder-open"></i>
              </Button>
            </div>
          </div>
        </div>

        {/* Response Panel */}
        <div className="flex-1 bg-background">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Response</h3>
              {response && (
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${
                      response.status < 400 ? 'bg-chart-1' : 'bg-destructive'
                    }`}></span>
                    <span className="text-muted-foreground">
                      Status: <span className="font-medium" data-testid="response-status">
                        {response.status}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-clock text-muted-foreground"></i>
                    <span className="text-muted-foreground">
                      Time: <span className="font-medium" data-testid="response-time">
                        {response.response_time || "N/A"}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!response && !testMutation.isPending && (
              <div className="text-center py-12">
                <i className="fas fa-paper-plane text-4xl text-muted-foreground mb-4"></i>
                <h4 className="text-lg font-medium mb-2">Ready to Test</h4>
                <p className="text-muted-foreground">Configure your request and click "Send Request" to see the response</p>
              </div>
            )}

            {testMutation.isPending && (
              <div className="text-center py-12">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-muted-foreground">Sending request...</p>
              </div>
            )}

            {response && (
              <div className="space-y-6" data-testid="response-container">
                {/* Response Headers */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Response Headers</h4>
                  <div className="syntax-highlight">
                    <pre className="text-sm">
                      <code>
                        {Object.entries(response.headers || {})
                          .map(([key, value]) => `${key}: ${value}`)
                          .join('\n')}
                      </code>
                    </pre>
                  </div>
                </div>

                {/* Response Body */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Response Body</h4>
                  <div className="syntax-highlight max-h-96 overflow-auto">
                    <pre className="text-sm">
                      <code data-testid="response-body">
                        {JSON.stringify(response.body, null, 2)}
                      </code>
                    </pre>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <Button
                    onClick={handleCopyResponse}
                    variant="outline"
                    data-testid="copy-response"
                  >
                    <i className="fas fa-copy mr-2"></i>
                    Copy Response
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response, null, 2));
                      const downloadAnchorNode = document.createElement('a');
                      downloadAnchorNode.setAttribute("href", dataStr);
                      downloadAnchorNode.setAttribute("download", "api-response.json");
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }}
                    data-testid="export-json"
                  >
                    <i className="fas fa-download mr-2"></i>
                    Export JSON
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
