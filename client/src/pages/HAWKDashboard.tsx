import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CodeBlock } from "@/components/CodeBlock";
import { PipelineVisualizer } from "@/components/PipelineVisualizer";
import { AIChatBox } from "@/components/AIChatBox";
import type { Message } from "@/components/AIChatBox";
import { Loader2, Shield, Bug, FileText, MessageSquare, Grid3x3, Radar } from "lucide-react";
import { toast } from "sonner";

type ActiveTab = "recon" | "vulnerability" | "report" | "mentor" | "owasp";
type ChatMessage = Message;

// AI Mentor Chat Component
function MentorChat() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      role: "assistant" as const,
      content: "Welcome to HAWK AI Mentor! I'm here to help you with ethical hacking, penetration testing, and security concepts. Ask me about vulnerabilities, tools like Burp Suite, Nmap, FFUF, SQLmap, and Nuclei, or OWASP Top 10 categories.",
    },
  ]);
  const [isLoading, setIsLoading] = React.useState(false);

  const sendMessageMutation = trpc.chat.sendMessage.useMutation();

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMsg: ChatMessage = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await sendMessageMutation.mutateAsync({ message: content });
      const assistantMsg: ChatMessage = { role: "assistant", content: response.message };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      toast.error("Failed to get response from AI Mentor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AIChatBox
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
      placeholder="Ask me about vulnerabilities, tools, or OWASP categories..."
      height={500}
    />
  );
}

export default function HAWKDashboard() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("recon");
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);

  // Queries
  const targetsQuery = trpc.targets.list.useQuery(undefined, {
    enabled: !!user,
  });

  const reconStatusQuery = trpc.recon.getStatus.useQuery(
    { targetId: selectedTargetId! },
    { 
      enabled: !!selectedTargetId,
      refetchInterval: (data) => {
        const isFinished = data?.every(s => s.status === "completed" || s.status === "failed");
        return isFinished ? false : 3000;
      }
    }
  );

  const findingsQuery = trpc.vulnerability.getFindings.useQuery(
    { targetId: selectedTargetId! },
    { enabled: !!selectedTargetId }
  );

  const reportsQuery = trpc.reports.list.useQuery(
    { targetId: selectedTargetId! },
    { enabled: !!selectedTargetId }
  );

  // Mutations
  const createTargetMutation = trpc.targets.create.useMutation();
  const startReconMutation = trpc.recon.startPipeline.useMutation();
  const analyzeVulnMutation = trpc.vulnerability.analyze.useMutation();
  const generateReportMutation = trpc.reports.generate.useMutation();

  // Form states
  const [targetUrl, setTargetUrl] = useState("");
  const [authStatement, setAuthStatement] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [vulnType, setVulnType] = useState("headers");
  const [vulnContent, setVulnContent] = useState("");
  const [reportTitle, setReportTitle] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const handleCreateTarget = async () => {
    if (!targetUrl) {
      toast.error("Please enter a target URL");
      return;
    }

    if (!isConfirmed || authStatement.length < 20) {
      toast.error("You must provide a valid authorization statement and confirm permission.");
      return;
    }

    try {
      await createTargetMutation.mutateAsync({
        domain: targetUrl,
        authorizationStatement: authStatement,
        confirmed: isConfirmed,
        scopePatterns: ["Authorized testing only"],
      });
      setTargetUrl("");
      setAuthStatement("");
      setIsConfirmed(false);
      await targetsQuery.refetch();
      toast.success("Target authorized and added successfully");
    } catch (error) {
      toast.error("Failed to create target");
    }
  };

  const handleStartRecon = async () => {
    if (!selectedTargetId) {
      toast.error("Please select a target");
      return;
    }

    try {
      await startReconMutation.mutateAsync({
        targetId: selectedTargetId,
      });
      await reconStatusQuery.refetch();
      toast.success("Recon pipeline started");
    } catch (error) {
      toast.error("Failed to start recon");
    }
  };

  const handleAnalyzeVuln = async () => {
    if (!selectedTargetId || !vulnContent) {
      toast.error("Please select a target and enter content");
      return;
    }

    try {
      await analyzeVulnMutation.mutateAsync({
        targetId: selectedTargetId,
        type: vulnType as any,
        content: vulnContent,
      });
      setVulnContent("");
      await findingsQuery.refetch();
      toast.success("Vulnerability analysis completed");
    } catch (error) {
      toast.error("Failed to analyze vulnerability");
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedTargetId || !reportTitle) {
      toast.error("Please select a target and enter a report title");
      return;
    }

    try {
      await generateReportMutation.mutateAsync({
        targetId: selectedTargetId,
        title: reportTitle,
      });
      setReportTitle("");
      await reportsQuery.refetch();
      toast.success("Report generated successfully");
    } catch (error) {
      toast.error("Failed to generate report");
    }
  };

  const pipelineStages = [
    { id: "recon", label: "Recon", icon: <Radar className="w-4 h-4" />, status: "pending" as const },
    { id: "tech_stack", label: "Tech Stack", icon: <Grid3x3 className="w-4 h-4" />, status: "pending" as const },
    { id: "port_scan", label: "Scanning", icon: <Bug className="w-4 h-4" />, status: "pending" as const },
    { id: "assessment", label: "Assessment", icon: <FileText className="w-4 h-4" />, status: "pending" as const },
    { id: "forensics", label: "Forensics Audit", icon: <Shield className="w-4 h-4" />, status: "pending" as const },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                <Radar className="w-6 h-6 text-slate-950 font-bold" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-cyan-300">⬡ HAWK</h1>
                <p className="text-xs text-slate-400">Ethical Security Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900 text-green-300 border border-green-700 text-xs font-medium">
                <Shield className="w-3 h-3" />
                Authorized only
              </div>
              <div className="text-sm text-slate-400">
                Welcome, <span className="text-cyan-300 font-medium">{user?.name || "User"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Target Selection & Authorization Gate */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-cyan-300">Targets</h2>
            <div className="px-2 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-900 text-[10px] uppercase tracking-wider font-bold">
              Ethical Gate Required
            </div>
          </div>
          
          <Card className="bg-slate-900/50 border-slate-700 p-6 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 uppercase mb-2">Target URL / Domain</label>
                  <Input
                    type="url"
                    placeholder="https://target.example.com"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="input-cyberpunk w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 uppercase mb-2">Authorization Statement</label>
                  <Textarea
                    placeholder="I, [Name], certify that I have explicit written permission to perform security testing on this target..."
                    value={authStatement}
                    onChange={(e) => setAuthStatement(e.target.value)}
                    className="input-cyberpunk min-h-[100px] text-sm"
                  />
                </div>
              </div>
              
              <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-amber-400">
                    <Shield className="w-5 h-5 shrink-0" />
                    <p className="text-xs leading-relaxed">
                      Testing targets without explicit permission is illegal and unethical. HAWK logs all authorization statements and your current IP for legal non-repudiation.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="confirm-auth"
                      checked={isConfirmed}
                      onChange={(e) => setIsConfirmed(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                    />
                    <label htmlFor="confirm-auth" className="text-sm text-slate-300 cursor-pointer select-none">
                      I confirm I have explicit permission to test this target.
                    </label>
                  </div>
                </div>
                
                <Button
                  onClick={handleCreateTarget}
                  disabled={createTargetMutation.isPending || !isConfirmed || authStatement.length < 20}
                  className="btn-cyberpunk primary w-full mt-4"
                >
                  {createTargetMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Authorize & Add Target
                </Button>
              </div>
            </div>
          </Card>

          {targetsQuery.data && targetsQuery.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {targetsQuery.data.map((target) => (
                <button
                  key={target.id}
                  onClick={() => setSelectedTargetId(target.id)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    selectedTargetId === target.id
                      ? "border-cyan-500 bg-cyan-900 text-cyan-300"
                      : "border-slate-700 bg-slate-800 hover:border-slate-600"
                  }`}
                >
                  <div className="font-mono text-sm">{target.domain}</div>
                  <div className="text-xs text-slate-400 mt-1">Status: {target.status}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              No targets yet. Add one above to get started.
            </div>
          )}
        </div>

        {/* Feature Tabs */}
        {selectedTargetId && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-slate-800 border border-slate-700 mb-6">
              <TabsTrigger value="recon" className="data-[state=active]:bg-cyan-900 data-[state=active]:text-cyan-300">
                <Radar className="w-4 h-4 mr-2" />
                Recon
              </TabsTrigger>
              <TabsTrigger value="triage" className="data-[state=active]:bg-cyan-900 data-[state=active]:text-cyan-300">
                <Grid3x3 className="w-4 h-4 mr-2" />
                Triage
              </TabsTrigger>
              <TabsTrigger value="vulnerability" className="data-[state=active]:bg-cyan-900 data-[state=active]:text-cyan-300">
                <Bug className="w-4 h-4 mr-2" />
                Scanner
              </TabsTrigger>
              <TabsTrigger value="report" className="data-[state=active]:bg-cyan-900 data-[state=active]:text-cyan-300">
                <FileText className="w-4 h-4 mr-2" />
                Report
              </TabsTrigger>
              <TabsTrigger value="mentor" className="data-[state=active]:bg-cyan-900 data-[state=active]:text-cyan-300">
                <MessageSquare className="w-4 h-4 mr-2" />
                Mentor
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="data-[state=active]:bg-cyan-900 data-[state=active]:text-cyan-300">
                <Radar className="w-4 h-4 mr-2" />
                Analysis
              </TabsTrigger>
              <TabsTrigger value="owasp" className="data-[state=active]:bg-cyan-900 data-[state=active]:text-cyan-300">
                <Grid3x3 className="w-4 h-4 mr-2" />
                OWASP
              </TabsTrigger>
            </TabsList>

            {/* Triage Tab */}
            <TabsContent value="triage" className="space-y-6">
              <Card className="bg-slate-900 border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                  <h3 className="text-sm font-mono font-bold text-slate-300">OPERATOR TRIAGE CENTER</h3>
                  <div className="text-[10px] text-slate-500 font-mono">SIGNAL: {findingsQuery.data?.length || 0} FINDINGS DETECTED</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-800/50 border-b border-slate-700">
                        <th className="p-3 font-mono text-slate-500">SEVERITY</th>
                        <th className="p-3 font-mono text-slate-500">TITLE</th>
                        <th className="p-3 font-mono text-slate-500">SOURCE</th>
                        <th className="p-3 font-mono text-slate-500">CONFIDENCE</th>
                        <th className="p-3 font-mono text-slate-500">STATUS</th>
                        <th className="p-3 font-mono text-slate-500">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {findingsQuery.data?.map((finding) => (
                        <React.Fragment key={finding.id}>
                          <tr className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-3"><SeverityBadge severity={finding.severity as any} /></td>
                            <td className="p-3 font-medium text-slate-200">{finding.title}</td>
                            <td className="p-3 text-slate-400 font-mono">{finding.sourceTool || "Unknown"}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-cyan-500" 
                                    style={{ width: `${(parseFloat(finding.confidence || "1") * 100)}%` }} 
                                  />
                                </div>
                                <span className="text-[10px] text-slate-500">{(parseFloat(finding.confidence || "1") * 100).toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                finding.status === "open" ? "bg-amber-900/30 text-amber-500" : "bg-green-900/30 text-green-500"
                              }`}>
                                {finding.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <Button variant="ghost" size="sm" className="h-7 text-[10px] font-mono hover:bg-slate-700" onClick={() => {
                                const el = document.getElementById(`evidence-${finding.id}`);
                                if (el) el.classList.toggle('hidden');
                              }}>
                                VIEW_EVIDENCE
                              </Button>
                            </td>
                          </tr>
                          <tr id={`evidence-${finding.id}`} className="hidden bg-slate-950/50">
                            <td colSpan={6} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <div className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Raw Evidence / Marker</div>
                                  <CodeBlock code={finding.evidence || "No evidence string captured"} language="text" className="text-[10px] opacity-80" />
                                </div>
                                <div>
                                  <div className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Remediation</div>
                                  <p className="text-xs text-slate-300 leading-relaxed">{finding.remediation}</p>
                                </div>
                                {finding.rawRequest && (
                                  <div className="col-span-1">
                                    <div className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Raw Request</div>
                                    <CodeBlock code={finding.rawRequest} language="http" className="text-[10px] opacity-80" />
                                  </div>
                                )}
                                {finding.rawResponse && (
                                  <div className="col-span-1">
                                    <div className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Raw Response</div>
                                    <CodeBlock code={finding.rawResponse} language="http" className="text-[10px] opacity-80" />
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                  {(!findingsQuery.data || findingsQuery.data.length === 0) && (
                    <div className="p-8 text-center text-slate-500 text-xs font-mono">
                      NO FINDINGS TO TRIAGE. RUN SCANNER TO GENERATE DATA.
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="recon" className="space-y-6">
              <div className="flex justify-end gap-2 mb-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900 border border-slate-700">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Global Kill Switch:</span>
                  <div className="w-12 h-6 bg-slate-950 rounded-full border border-slate-800 p-1 flex items-center cursor-pointer group" onClick={() => toast.warning("GLOBAL_KILL_SWITCH: ACCESS_DENIED (ADMIN_ONLY)")}>
                    <div className="w-4 h-4 bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-slate-900 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-cyan-300 mb-4 font-mono">ENGINE_PIPELINE_v3.5</h3>
                  <PipelineVisualizer stages={pipelineStages} className="mb-6" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-6"
                      onClick={() => handleStartRecon()}
                      disabled={startReconMutation.isPending || (reconStatusQuery.data?.[0]?.status === "in_progress")}
                    >
                      {startReconMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
                      INITIALIZE_SOVEREIGN_5_STAGES
                    </Button>
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 py-6 font-mono">
                      <ShieldCheck className="w-5 h-5 mr-2" />
                      DOWNLOAD_AUDIT_REPORT
                    </Button>
                  </div>

                  {reconStatusQuery.data && reconStatusQuery.data.length > 0 && (
                    <div className="mt-8 space-y-4">
                      <h4 className="text-sm font-bold font-mono text-slate-400 border-b border-slate-800 pb-2">PIPELINE_OUTPUT_LOGS:</h4>
                      {reconStatusQuery.data.map((result) => (
                        <div key={result.stage} className="p-3 bg-slate-950/30 rounded border border-slate-800 hover:border-slate-700 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs font-bold text-cyan-500 uppercase">{result.stage}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              result.status === "completed" ? "bg-green-900/30 text-green-500" : "bg-blue-900/30 text-blue-400"
                            }`}>{result.status}</span>
                          </div>
                          {result.output && (
                            <CodeBlock
                              code={JSON.stringify(result.output, null, 2)}
                              language="json"
                              className="text-[10px] opacity-70"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="bg-slate-900 border-slate-700 p-6 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                    <h3 className="text-sm font-mono font-bold text-cyan-300">SOVEREIGN_ADVISOR</h3>
                  </div>
                  <div className="flex-1 bg-slate-950/50 rounded border border-slate-800 p-4 font-mono text-[11px] text-slate-400 overflow-y-auto">
                    <div className="space-y-4">
                      <div className="text-cyan-500 border-b border-cyan-900/50 pb-1 mb-2">STRATEGIC_GUIDANCE:</div>
                      <p>1. <span className="text-slate-200">RECON</span>: Deepen asset discovery via authenticated API crawling.</p>
                      <p>2. <span className="text-slate-200">SCANNING</span>: Priority scan on open SSH (Port 22) for brute-force vulnerability.</p>
                      <p>3. <span className="text-slate-200">ASSESSMENT</span>: Tech stack signature suggests outdated WordPress (CVE-2024-XXXX).</p>
                      <p>4. <span className="text-slate-200">DEFENSIVE_AUDIT</span>: Check for 'log clearing' patterns using the Forensics module.</p>
                      <div className="pt-4 text-[10px] text-slate-600 italic">-- END_OF_ADVISORY --</div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Vulnerability Tab */}
            <TabsContent value="vulnerability" className="space-y-6">
              <Card className="bg-slate-900 border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-cyan-300 mb-4">Vulnerability Analyzer</h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Data Type</label>
                    <select
                      value={vulnType}
                      onChange={(e) => setVulnType(e.target.value)}
                      className="input-cyberpunk w-full"
                    >
                      <option value="headers">HTTP Headers</option>
                      <option value="request">HTTP Request</option>
                      <option value="response">HTTP Response</option>
                      <option value="url">URL</option>
                      <option value="js">JavaScript</option>
                      <option value="error">Error Page</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
                    <Textarea
                      value={vulnContent}
                      onChange={(e) => setVulnContent(e.target.value)}
                      placeholder="Paste HTTP data, code, or error messages..."
                      className="input-cyberpunk min-h-32"
                    />
                  </div>
                  <Button
                    onClick={handleAnalyzeVuln}
                    disabled={analyzeVulnMutation.isPending}
                    className="btn-cyberpunk primary w-full"
                  >
                    {analyzeVulnMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Analyze
                  </Button>
                </div>

                {findingsQuery.data && findingsQuery.data.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-300">Findings:</h4>
                    {findingsQuery.data.map((finding) => (
                      <div key={finding.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-slate-100">{finding.title}</h5>
                          <SeverityBadge severity={finding.severity as any} />
                        </div>
                        {finding.cwe && (
                          <div className="text-xs text-slate-400 mb-2">
                            <span className="text-cyan-400">CWE:</span> {finding.cwe}
                          </div>
                        )}
                        {finding.evidence && (
                          <div className="mb-2">
                            <div className="text-xs text-slate-400 mb-1">Evidence:</div>
                            <CodeBlock code={finding.evidence} language="text" className="text-xs" />
                          </div>
                        )}
                        {finding.remediation && (
                          <div className="text-sm text-slate-300 mt-2">
                            <span className="text-green-400 font-medium">Remediation:</span> {finding.remediation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Report Tab */}
            <TabsContent value="report" className="space-y-6">
              <Card className="bg-slate-900 border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-cyan-300 mb-4">Report Builder</h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Report Title</label>
                    <Input
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      placeholder="e.g., Security Assessment Report"
                      className="input-cyberpunk"
                    />
                  </div>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={generateReportMutation.isPending}
                    className="btn-cyberpunk primary w-full"
                  >
                    {generateReportMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Generate Report
                  </Button>
                </div>

                {reportsQuery.data && reportsQuery.data.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-300">Generated Reports:</h4>
                    {reportsQuery.data.map((report) => (
                      <div key={report.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                        <h5 className="font-semibold text-slate-100 mb-2">{report.title}</h5>
                        <div className="text-xs text-slate-400 mb-2">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </div>
                        {report.content && (
                          <CodeBlock code={report.content} language="markdown" className="text-xs" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Mentor Tab */}
            <TabsContent value="mentor" className="space-y-6">
              <Card className="bg-slate-900 border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-cyan-300 mb-4">AI Mentor</h3>
                <MentorChat />
              </Card>
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="intelligence" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Top Attack Paths */}
                <Card className="lg:col-span-1 bg-slate-900 border-slate-700 p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-mono font-bold text-cyan-300">TOP_ATTACK_PATHS</h3>
                    <Radar className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {[
                      { id: 1, path: "Laravel -> Debug -> RCE", prob: "0.82", critical: true },
                      { id: 2, path: "Auth -> JWT -> IDOR", prob: "0.45", critical: false },
                      { id: 3, path: "API -> Entropy -> Secret", prob: "0.68", critical: true },
                    ].map((p) => (
                      <div key={p.id} className={`p-3 rounded border cursor-pointer transition-colors ${
                        p.critical ? "bg-cyan-950/20 border-cyan-800/50 hover:bg-cyan-900/30" : "bg-slate-950/50 border-slate-800 hover:bg-slate-900/50"
                      }`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-mono text-slate-500">PATH_{p.id}</span>
                          <span className="text-[10px] font-bold text-cyan-400">{Math.round(parseFloat(p.prob) * 100)}% Confidence</span>
                        </div>
                        <div className="text-xs font-bold text-slate-200 truncate">{p.path}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Finding Details */}
                <Card className="lg:col-span-3 bg-slate-900 border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-mono font-bold text-cyan-300">FINDING_DETAILS</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-950/50 rounded border border-slate-800">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-md font-bold text-slate-100 font-mono uppercase tracking-tight">Laravel Debug Exposure</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-mono">Target: api.target.com</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] text-cyan-500 uppercase font-bold mb-1">Confidence Score</div>
                          <div className="flex items-center gap-2">
                            <div className="text-xl font-bold text-slate-100">0.982</div>
                            <div className="text-xs text-slate-500 font-mono">± 0.04</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Evidence */}
                        <div className="space-y-3">
                          <div className="text-[10px] text-slate-500 font-bold uppercase mb-2 border-b border-slate-800 pb-1">Evidence Chain</div>
                          {[
                            { type: "DET", name: "Header Match (X-Powered-By)", conf: 0.98 },
                            { type: "STAT", name: "Response Timing Anomaly", conf: 0.75 },
                            { type: "HEU", name: "Entropy Secret Signature", conf: 0.85 }
                          ].map((e, i) => (
                            <div key={i} className="flex items-center gap-3 group">
                              <div className={`w-2 h-2 rounded-full ${e.conf > 0.9 ? "bg-green-500" : "bg-cyan-500"}`} />
                              <div className="flex-1">
                                <div className="text-[11px] text-slate-300 font-mono">{e.name}</div>
                                <div className="text-[9px] text-slate-600 font-mono">P: {e.conf}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Analysis Notes */}
                        <div className="space-y-3 p-4 bg-slate-900/50 rounded border border-slate-800/50">
                          <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Analysis Notes</div>
                          <div className="space-y-3">
                             <div className="text-[10px] text-slate-400">01: Detected Laravel via headers.</div>
                             <div className="text-[10px] text-slate-400">02: Found timing anomaly at /api/v1.</div>
                             <div className="text-[10px] text-slate-400">03: Recommended: Directory bruteforce for debug endpoints.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* OWASP Tab */}
            <TabsContent value="owasp" className="space-y-6">
              <Card className="bg-slate-900 border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-cyan-300 mb-4">OWASP Top 10</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "A01:2021-Broken Access Control",
                    "A02:2021-Cryptographic Failures",
                    "A03:2021-Injection",
                    "A04:2021-Insecure Design",
                    "A05:2021-Security Misconfiguration",
                    "A06:2021-Vulnerable and Outdated Components",
                    "A07:2021-Identification and Authentication Failures",
                    "A08:2021-Software and Data Integrity Failures",
                    "A09:2021-Logging and Monitoring Failures",
                    "A10:2021-Server-Side Request Forgery (SSRF)",
                  ].map((category) => (
                    <button
                      key={category}
                      className="p-3 rounded-lg border border-slate-700 bg-slate-800 hover:border-cyan-500 hover:text-cyan-300 transition-all text-left text-sm font-medium"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
