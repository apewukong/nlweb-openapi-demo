import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function SchemaDataPanel() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSource, setNewSource] = useState({
    name: "",
    url: "",
    type: "schema_org",
    description: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: api.getStats,
    refetchInterval: 30000,
  });

  const addSourceMutation = useMutation({
    mutationFn: api.addDataSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setShowAddDialog(false);
      setNewSource({ name: "", url: "", type: "schema_org", description: "" });
      toast({
        title: "Data Source Added",
        description: "The new data source is being indexed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Source",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddSource = () => {
    if (!newSource.name || !newSource.url) {
      toast({
        title: "Required Fields Missing",
        description: "Please provide name and URL",
        variant: "destructive",
      });
      return;
    }

    addSourceMutation.mutate(newSource);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const formatLastUpdated = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-card border-b border-border px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Schema.org Data Sources</h2>
            <p className="text-muted-foreground mt-1">Manage and monitor indexed structured data</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-data-source">
                <i className="fas fa-plus mr-2"></i>
                Add Data Source
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Data Source</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="source-name">Name</Label>
                  <Input
                    id="source-name"
                    value={newSource.name}
                    onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                    placeholder="My Website"
                    data-testid="source-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="source-url">URL</Label>
                  <Input
                    id="source-url"
                    value={newSource.url}
                    onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                    placeholder="https://example.com/sitemap.xml"
                    data-testid="source-url-input"
                  />
                </div>
                <div>
                  <Label htmlFor="source-type">Type</Label>
                  <Select
                    value={newSource.type}
                    onValueChange={(value) => setNewSource({ ...newSource, type: value })}
                  >
                    <SelectTrigger data-testid="source-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="schema_org">Schema.org (Sitemap/Page)</SelectItem>
                      <SelectItem value="rss">RSS Feed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source-description">Description (Optional)</Label>
                  <Textarea
                    id="source-description"
                    value={newSource.description}
                    onChange={(e) => setNewSource({ ...newSource, description: e.target.value })}
                    placeholder="Brief description of this data source"
                    data-testid="source-description-input"
                  />
                </div>
                <Button
                  onClick={handleAddSource}
                  disabled={addSourceMutation.isPending}
                  className="w-full"
                  data-testid="submit-add-source"
                >
                  {addSourceMutation.isPending ? "Adding..." : "Add Data Source"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <div className="space-y-6">
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sites</p>
                    <p className="text-2xl font-bold" data-testid="total-sites-stat">
                      {statsData?.total_sites || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-globe text-primary text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Schema Objects</p>
                    <p className="text-2xl font-bold" data-testid="schema-objects-stat">
                      {statsData?.schema_objects || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-sitemap text-secondary text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Sync</p>
                    <p className="text-2xl font-bold" data-testid="last-sync-stat">
                      {statsData?.last_sync
                        ? formatLastUpdated(statsData.last_sync)
                        : "Never"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-sync-alt text-accent text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold" data-testid="success-rate-stat">
                      {statsData?.success_rate?.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-check-circle text-chart-1 text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Sources List */}
          <Card>
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold">Configured Data Sources</h3>
              </div>

              {(!statsData?.data_sources || statsData.data_sources.length === 0) ? (
                <div className="p-8 text-center">
                  <i className="fas fa-inbox text-4xl text-muted-foreground mb-4"></i>
                  <h4 className="text-lg font-medium mb-2">No Data Sources Configured</h4>
                  <p className="text-muted-foreground mb-4">
                    Add your first data source to start indexing Schema.org structured data
                  </p>
                  <Button onClick={() => setShowAddDialog(true)} data-testid="add-first-source">
                    <i className="fas fa-plus mr-2"></i>
                    Add Data Source
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Objects
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {statsData?.data_sources.map((source, index) => (
                        <tr key={index} className="hover:bg-muted/50" data-testid={`data-source-${index}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <i className={`fas ${source.type === 'rss' ? 'fa-rss' : 'fa-sitemap'} text-primary text-sm`}></i>
                              </div>
                              <div>
                                <p className="font-medium" data-testid={`source-name-${index}`}>
                                  {source.name}
                                </p>
                                <p className="text-sm text-muted-foreground" data-testid={`source-url-${index}`}>
                                  {source.url}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              source.type === 'rss' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                            }`}>
                              {source.type === 'rss' ? 'RSS Feed' : 'Schema.org'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className={`status-indicator ${
                                source.status === 'active' ? 'status-online' :
                                source.status === 'syncing' ? 'status-loading' :
                                'status-offline'
                              }`}></span>
                              <span className="text-sm capitalize" data-testid={`source-status-${index}`}>
                                {source.status}
                              </span>
                            </div>
                            {source.error && (
                              <p className="text-xs text-destructive mt-1">{source.error}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm" data-testid={`source-objects-${index}`}>
                            {source.object_count?.toLocaleString() || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground" data-testid={`source-updated-${index}`}>
                            {source.last_updated ? formatLastUpdated(source.last_updated) : "Never"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                                title="Sync now"
                                data-testid={`sync-source-${index}`}
                              >
                                <i className="fas fa-sync-alt text-sm"></i>
                              </button>
                              <button
                                className="p-2 text-muted-foreground hover:text-accent transition-colors"
                                title="Edit"
                                data-testid={`edit-source-${index}`}
                              >
                                <i className="fas fa-edit text-sm"></i>
                              </button>
                              <button
                                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                                title="Delete"
                                data-testid={`delete-source-${index}`}
                              >
                                <i className="fas fa-trash text-sm"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
