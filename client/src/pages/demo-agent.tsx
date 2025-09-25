import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import QueryInterface from "@/components/query-interface";
import ConfigurationPanel from "@/components/configuration-panel";
import SchemaDataPanel from "@/components/schema-data-panel";
import ApiTestingPanel from "@/components/api-testing-panel";
import SystemLogsPanel from "@/components/system-logs-panel";
import { api } from "@/lib/api";

type Tab = "query" | "config" | "schema" | "api" | "logs";

export default function DemoAgent() {
  const [activeTab, setActiveTab] = useState<Tab>("query");

  const { data: healthData } = useQuery({
    queryKey: ["health"],
    queryFn: api.getHealth,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: statsData } = useQuery({
    queryKey: ["stats"],
    queryFn: api.getStats,
    refetchInterval: 60000, // Refresh every minute
  });

  const tabs = [
    { id: "query" as Tab, label: "Query Interface", icon: "fas fa-search" },
    { id: "config" as Tab, label: "Configuration", icon: "fas fa-cog" },
    { id: "schema" as Tab, label: "Schema.org Data", icon: "fas fa-sitemap" },
    { id: "api" as Tab, label: "API Testing", icon: "fas fa-code" },
    { id: "logs" as Tab, label: "System Logs", icon: "fas fa-list" },
  ];

  const getStatusIndicator = (service: string) => {
    if (!healthData?.services) return "status-offline";
    const status = healthData.services[service as keyof typeof healthData.services];
    return status === "online" ? "status-online" : "status-offline";
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex-shrink-0 flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-robot text-primary-foreground text-lg"></i>
            </div>
            <div>
              <h1 className="text-lg font-semibold">NLWeb Agent</h1>
              <p className="text-xs text-muted-foreground">OpenAI Integration Demo</p>
            </div>
          </div>

          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                data-testid={`nav-${tab.id}`}
              >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Status indicators */}
        <div className="mt-auto p-6 border-t border-border">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`status-indicator ${getStatusIndicator("nlweb_server")}`}></span>
                <span className="text-muted-foreground">NLWeb Server</span>
              </div>
              <span className="text-muted-foreground">v1.2.3</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`status-indicator ${getStatusIndicator("openai_api")}`}></span>
                <span className="text-muted-foreground">OpenAI API</span>
              </div>
              <span className="text-muted-foreground">GPT-4</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`status-indicator ${getStatusIndicator("vector_store")}`}></span>
                <span className="text-muted-foreground">Vector Store</span>
              </div>
              <span className="text-muted-foreground">
                {statsData?.vector_store?.total_documents || 0} docs
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {healthData?.status === "unhealthy" && (
          <div className="bg-destructive text-destructive-foreground px-4 py-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>Service unavailable: {healthData.error}</span>
          </div>
        )}

        {activeTab === "query" && <QueryInterface />}
        {activeTab === "config" && <ConfigurationPanel />}
        {activeTab === "schema" && <SchemaDataPanel />}
        {activeTab === "api" && <ApiTestingPanel />}
        {activeTab === "logs" && <SystemLogsPanel />}
      </main>
    </div>
  );
}
