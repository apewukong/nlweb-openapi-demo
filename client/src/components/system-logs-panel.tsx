import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { LogEntry } from "@shared/schema";

export default function SystemLogsPanel() {
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const { toast } = useToast();

  const { data: logsData, isLoading } = useQuery({
    queryKey: ["logs"],
    queryFn: api.getLogs,
    refetchInterval: autoRefresh ? 5000 : false, // Refresh every 5 seconds if enabled
  });

  const handleExportLogs = () => {
    if (logsData?.logs) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logsData.logs, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `nlweb-logs-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      toast({
        title: "Logs Exported",
        description: "System logs have been downloaded",
      });
    }
  };

  const handleClearLogs = () => {
    toast({
      title: "Clear Logs",
      description: "This would clear the system logs (demo mode)",
      variant: "destructive",
    });
  };

  // Filter logs based on current filters
  const filteredLogs = logsData?.logs?.filter((log: LogEntry) => {
    if (levelFilter !== "all" && log.level.toLowerCase() !== levelFilter.toLowerCase()) {
      return false;
    }
    if (sourceFilter !== "all" && log.source !== sourceFilter) {
      return false;
    }
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case "ERROR":
        return "bg-destructive/10 text-destructive";
      case "WARN":
        return "bg-accent/10 text-accent";
      case "INFO":
        return "bg-chart-1/10 text-chart-1";
      case "DEBUG":
        return "bg-secondary/10 text-secondary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "nlweb":
        return "fas fa-globe";
      case "openai":
        return "fas fa-brain";
      case "vector-db":
        return "fas fa-database";
      case "mcp":
        return "fas fa-exchange-alt";
      default:
        return "fas fa-info-circle";
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-card border-b border-border px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">System Logs</h2>
            <p className="text-muted-foreground mt-1">Monitor NLWeb and OpenAI API activity</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={handleExportLogs}
              variant="outline"
              data-testid="export-logs"
            >
              <i className="fas fa-download mr-2"></i>
              Export Logs
            </Button>
            <Button
              onClick={handleClearLogs}
              variant="outline"
              data-testid="clear-logs"
            >
              <i className="fas fa-trash mr-2"></i>
              Clear Logs
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Log Filters */}
        <div className="bg-muted px-8 py-4 border-b border-border">
          <div className="flex items-center space-x-4">
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-40" data-testid="level-filter">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="warn">Warnings</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40" data-testid="source-filter">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="nlweb">NLWeb</SelectItem>
                <SelectItem value="openai">OpenAI API</SelectItem>
                <SelectItem value="vector-db">Vector DB</SelectItem>
                <SelectItem value="mcp">MCP Server</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-48"
              data-testid="search-logs"
            />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={(checked) => setAutoRefresh(!!checked)}
                data-testid="auto-refresh-checkbox"
              />
              <label htmlFor="auto-refresh" className="text-sm cursor-pointer">
                Auto-refresh
              </label>
            </div>

            <div className="text-sm text-muted-foreground">
              {filteredLogs.length} of {logsData?.logs?.length || 0} entries
            </div>
          </div>
        </div>

        {/* Log Entries */}
        <div className="flex-1 overflow-auto bg-background">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="loading-spinner"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <i className="fas fa-inbox text-4xl text-muted-foreground mb-4"></i>
                <h4 className="text-lg font-medium mb-2">No Log Entries</h4>
                <p className="text-muted-foreground">
                  {logsData?.logs?.length === 0 
                    ? "No logs have been generated yet" 
                    : "No logs match your current filters"}
                </p>
              </div>
            </div>
          ) : (
            <div className="font-mono text-sm leading-6">
              {filteredLogs.map((entry: LogEntry, index: number) => (
                <div
                  key={index}
                  className="flex border-b border-border hover:bg-muted/30 transition-colors"
                  data-testid={`log-entry-${index}`}
                >
                  <div className="w-32 p-4 text-muted-foreground bg-card border-r border-border shrink-0">
                    <span data-testid={`log-timestamp-${index}`}>
                      {entry.timestamp}
                    </span>
                  </div>
                  
                  <div className="w-16 p-4 text-center border-r border-border shrink-0">
                    <span 
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getLevelColor(entry.level)}`}
                      data-testid={`log-level-${index}`}
                    >
                      {entry.level}
                    </span>
                  </div>
                  
                  <div className="w-24 p-4 border-r border-border shrink-0">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <i className={`${getSourceIcon(entry.source)} text-xs`}></i>
                      <span data-testid={`log-source-${index}`}>
                        {entry.source}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-4" data-testid={`log-message-${index}`}>
                    <span className={entry.level === "ERROR" ? "text-destructive" : ""}>
                      {entry.message}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="bg-muted px-8 py-2 border-t border-border">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>Auto-refresh: {autoRefresh ? "On" : "Off"}</span>
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="status-indicator status-online"></span>
              <span>Log streaming active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
