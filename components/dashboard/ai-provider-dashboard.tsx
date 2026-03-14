"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Zap, Clock, CheckCircle, XCircle, Target } from "lucide-react";

interface ProviderStatus {
  provider: string;
  available: boolean;
  requestsInWindow: number;
  limit: number;
}

interface TaskAssignments {
  brief: string;
  outline: string;
  draft: string;
  optimize: string;
  quick: string;
}

interface AIResponse {
  success: boolean;
  response?: string;
  provider?: string;
  model?: string;
  cached?: boolean;
  error?: string;
  taskType?: string;
}

export default function AIProviderDashboard() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [assignments, setAssignments] = useState<TaskAssignments | null>(null);
  const [loading, setLoading] = useState(false);
  const [testPrompt, setTestPrompt] = useState("Write a short paragraph about AI in content creation.");
  const [testResponse, setTestResponse] = useState<AIResponse | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [taskType, setTaskType] = useState<string>('quick');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/test");
      const data = await response.json();
      if (data.success) {
        setProviders(data.providers);
        setAssignments(data.taskAssignments);
      }
    } catch (error) {
      console.error("Failed to fetch provider status:", error);
    } finally {
      setLoading(false);
    }
  };

  const testAI = async () => {
    if (!testPrompt.trim()) return;
    
    setTestLoading(true);
    setTestResponse(null);
    
    try {
      const response = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: testPrompt, taskType })
      });
      
      const data = await response.json();
      setTestResponse(data);
      
      // Refresh status after test
      fetchStatus();
    } catch (error) {
      setTestResponse({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getStatusColor = (provider: ProviderStatus) => {
    if (!provider.available) return "destructive";
    if (provider.requestsInWindow > provider.limit * 0.8) return "warning";
    return "success";
  };

  const getStatusIcon = (provider: ProviderStatus) => {
    if (!provider.available) return <XCircle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI Provider Status</h2>
        <Button onClick={fetchStatus} disabled={loading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <Card key={provider.provider}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="capitalize">{provider.provider}</span>
                {getStatusIcon(provider)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant={getStatusColor(provider)} className="w-full justify-center">
                  {provider.available ? "Available" : "Rate Limited"}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Requests:</span>
                    <span>{provider.requestsInWindow}/{provider.limit}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${
                        provider.requestsInWindow > provider.limit * 0.8 
                          ? "bg-yellow-500" 
                          : "bg-green-500"
                      }`}
                      style={{ 
                        width: `${Math.min((provider.requestsInWindow / provider.limit) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {assignments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Task Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Brief</div>
                <Badge variant="outline" className="mt-1 capitalize">{assignments.brief}</Badge>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Outline</div>
                <Badge variant="outline" className="mt-1 capitalize">{assignments.outline}</Badge>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Draft</div>
                <Badge variant="outline" className="mt-1 capitalize">{assignments.draft}</Badge>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Optimize</div>
                <Badge variant="outline" className="mt-1 capitalize">{assignments.optimize}</Badge>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Quick</div>
                <Badge variant="outline" className="mt-1 capitalize">{assignments.quick}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Test AI Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Task Type</label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brief">Brief (OpenRouter)</SelectItem>
                  <SelectItem value="outline">Outline (OpenRouter)</SelectItem>
                  <SelectItem value="draft">Draft (Groq)</SelectItem>
                  <SelectItem value="optimize">Optimize (Gemini)</SelectItem>
                  <SelectItem value="quick">Quick (Gemini)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea
            placeholder="Enter a test prompt..."
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            rows={3}
          />
          <Button onClick={testAI} disabled={testLoading || !testPrompt.trim()}>
            {testLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Test AI
              </>
            )}
          </Button>

          {testResponse && (
            <div className="mt-4 p-4 border rounded-lg">
              {testResponse.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{testResponse.provider}</Badge>
                    <Badge variant="outline">{testResponse.model}</Badge>
                    <Badge variant="secondary">{testResponse.taskType}</Badge>
                    {testResponse.cached && (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Cached
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{testResponse.response}</p>
                </div>
              ) : (
                <div className="text-red-600 text-sm">
                  <strong>Error:</strong> {testResponse.error}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provider Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Fallback Order:</strong> Groq → OpenRouter → Gemini
            </div>
            <div>
              <strong>Caching:</strong> 5-minute TTL for identical requests
            </div>
            <div>
              <strong>Rate Limits:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Groq: 30 requests/minute (fastest)</li>
                <li>• OpenRouter: 20 requests/minute (free models)</li>
                <li>• Gemini: 15 requests/minute (Google free tier)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
