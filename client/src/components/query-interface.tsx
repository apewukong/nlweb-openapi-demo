import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { SearchResponse, QueryRequest } from "@shared/schema";

export default function QueryInterface() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const { toast } = useToast();

  const { data: statsData } = useQuery({
    queryKey: ["stats"],
    queryFn: api.getStats,
  });

  const queryMutation = useMutation({
    mutationFn: (request: QueryRequest) => api.ask(request),
    onSuccess: (data) => {
      setResults(data);
      toast({
        title: "Query Successful",
        description: `Found ${data.numberOfItems} results in ${data.processingTime}s`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Query Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }

    queryMutation.mutate({
      query: query.trim(),
      mode: "search",
    });
  };

  const exampleQueries = [
    "Find restaurants in San Francisco with outdoor seating",
    "Hotels near Union Square with spa services", 
    "Technology conferences in 2024",
    "Museums with free admission",
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Natural Language Query Interface</h2>
            <p className="text-muted-foreground mt-1">
              Ask questions about Schema.org structured data using natural language
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-2 bg-muted rounded-lg">
              <i className="fas fa-database text-secondary"></i>
              <span className="text-sm font-medium">
                {statsData?.total_sites || 0} sites indexed
              </span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-muted rounded-lg">
              <i className="fas fa-clock text-accent"></i>
              <span className="text-sm font-medium">
                {statsData?.schema_objects || 0} objects
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Query Input Panel */}
        <div className="w-2/5 border-r border-border bg-card">
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">Natural Language Query</label>
              <div className="relative">
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-32 resize-none"
                  placeholder="Ask me anything about the indexed websites... For example: 'Find restaurants in San Francisco with outdoor seating' or 'Show me all technology events happening this month'"
                  data-testid="query-input"
                />
                <div className="absolute bottom-3 right-3 flex space-x-2">
                  <button
                    onClick={() => setQuery("")}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Clear"
                    data-testid="clear-query"
                  >
                    <i className="fas fa-trash text-sm"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleSubmit}
                disabled={queryMutation.isPending}
                className="flex-1"
                data-testid="submit-query"
              >
                {queryMutation.isPending ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-search mr-2"></i>
                    Search with NLWeb
                  </>
                )}
              </Button>
            </div>

            {/* Example Queries */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center">
                <i className="fas fa-lightbulb mr-2 text-muted-foreground"></i>
                Example Queries
              </h4>
              <div className="space-y-2">
                {exampleQueries.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(example)}
                    className="w-full p-3 bg-muted rounded-lg cursor-pointer hover:bg-accent/10 transition-colors text-left"
                    data-testid={`example-query-${index}`}
                  >
                    <p className="text-sm text-foreground">{example}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="flex-1 bg-background overflow-auto">
          <div className="p-6">
            {queryMutation.isPending && (
              <div className="text-center py-12" data-testid="loading-state">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-muted-foreground">Processing your query with OpenAI and NLWeb...</p>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>✓ Query received and validated</p>
                  <p>⟳ Analyzing with OpenAI GPT-4...</p>
                  <p>⋯ Searching Schema.org data...</p>
                </div>
              </div>
            )}

            {results && !queryMutation.isPending && (
              <div className="space-y-6" data-testid="results-container">
                {/* Query Summary */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <i className="fas fa-search text-primary text-sm"></i>
                        </div>
                        <div>
                          <h3 className="font-semibold">Query Results</h3>
                          <p className="text-sm text-muted-foreground">
                            Found {results.numberOfItems} items matching your criteria
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <i className="fas fa-clock"></i>
                        <span>Response time: {results.processingTime}s</span>
                      </div>
                    </div>

                    {results.aiResponse && (
                      <div className="bg-muted p-4 rounded-lg mb-4">
                        <p className="text-sm font-medium mb-2">AI Analysis</p>
                        <p className="text-sm">{results.aiResponse}</p>
                      </div>
                    )}

                    <div className="syntax-highlight">
                      <pre>
                        <code>{JSON.stringify(results, null, 2)}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Results */}
                {results.mainEntity.map((item, index) => (
                  <Card key={index} className="response-card">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg" data-testid={`result-name-${index}`}>
                            {item.name || "Unnamed Item"}
                          </h4>
                          <p className="text-muted-foreground" data-testid={`result-description-${index}`}>
                            {item.description || "No description available"}
                          </p>
                          {item.address && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {typeof item.address === "string"
                                ? item.address
                                : item.address?.streetAddress || "Address available"}
                            </p>
                          )}
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                          {item["@type"]}
                        </span>
                      </div>

                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm font-medium mb-2">Schema.org Data</p>
                        <div className="font-mono text-xs text-muted-foreground">
                          "@type": "{item["@type"]}"
                          {item.name && `, "name": "${item.name}"`}
                          {item.description && `, "description": "${item.description.substring(0, 100)}..."`}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {results.numberOfItems === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">{results.message || "No results found"}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
