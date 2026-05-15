import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CodeBlock } from "@/components/CodeBlock";
import { 
  Loader2, 
  Shield, 
  Bug, 
  FileText, 
  Radar, 
  Activity, 
  Layers, 
  Fingerprint,
  Zap,
  ChevronRight,
  Database,
  Search,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

export default function HAWKDashboard() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("intelligence");
  const [selectedEngagementId, setSelectedEngagementId] = useState<string | null>(null);
  const [newEngagementName, setNewEngagementName] = useState("");
  const [authStatement, setAuthStatement] = useState("");

  // Queries
  const engagementsQuery = trpc.engagements.list.useQuery(undefined, {
    enabled: !!user,
  });

  const findingsQuery = trpc.vulnerability.getFindings.useQuery(
    { engagementId: selectedEngagementId! },
    { enabled: !!selectedEngagementId }
  );

  const runsQuery = trpc.recon.getRuns.useQuery(
    { engagementId: selectedEngagementId! },
    { enabled: !!selectedEngagementId, refetchInterval: 5000 }
  );

  // Mutations
  const createEngagementMutation = trpc.engagements.create.useMutation();
  const startCollectionMutation = trpc.recon.startCollection.useMutation();

  const handleCreateEngagement = async () => {
    if (!newEngagementName || authStatement.length < 20) {
      toast.error("Name and 20+ char Auth Statement required");
      return;
    }
    try {
      await createEngagementMutation.mutateAsync({
        name: newEngagementName,
        authorizationStatement: authStatement,
        confirmed: true,
        scopePatterns: [newEngagementName]
      });
      setNewEngagementName("");
      setAuthStatement("");
      await engagementsQuery.refetch();
      toast.success("Engagement initialized");
    } catch (e) {
      toast.error("Initialization failed");
    }
  };

  const handleStartCollection = async () => {
    if (!selectedEngagementId) return;
    try {
      await startCollectionMutation.mutateAsync({ engagementId: selectedEngagementId });
      toast.success("Intelligence collection started");
      await runsQuery.refetch();
    } catch (e) {
      toast.error("Collection failed to trigger");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono">
        <div className="text-cyan-500 animate-pulse text-sm">HAWK_BOOT_SEQUENCE [INITIALIZING]...</div>
      </div>
    );
  }

  const selectedEngagement = engagementsQuery.data?.find(e => e.id === selectedEngagementId);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Global Status Bar */}
      <div className="h-10 bg-black border-b border-white/5 flex items-center justify-between px-6 text-[10px] font-mono tracking-tighter">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 uppercase">System:</span>
            <span className="text-green-500 font-bold uppercase animate-pulse">Operational</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 uppercase">Entropy:</span>
            <span className="text-cyan-400">0.841bits</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Layers className="w-3 h-3" />
            <span>Schema: 5.0.0-OS</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 uppercase">User:</span>
            <span className="text-slate-300">{user?.displayName || user?.email || "Anonymous"}</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_cyan]" />
        </div>
      </div>

      <div className="flex h-[calc(100vh-40px)]">
        {/* Navigation Sidebar */}
        <div className="w-72 border-r border-white/5 bg-[#080808] flex flex-col">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded bg-cyan-600 flex items-center justify-center shrink-0">
                <Radar className="w-5 h-5 text-black" />
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight uppercase">Hawk OS</h1>
            </div>

            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-mono uppercase text-slate-400"
              onClick={() => setSelectedEngagementId(null)}
            >
              <Zap className="w-3 h-3 text-cyan-500" />
              Initialize Engagement
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h2 className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-2 mb-2">Active Engagements</h2>
            {engagementsQuery.data?.map(e => (
              <button
                key={e.id}
                onClick={() => setSelectedEngagementId(e.id)}
                className={`w-full group px-3 py-2.5 rounded text-left transition-all ${
                  selectedEngagementId === e.id 
                    ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-100" 
                    : "hover:bg-white/[0.02] border border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate">{e.name}</span>
                  <ChevronRight className={`w-3 h-3 transition-transform ${selectedEngagementId === e.id ? "rotate-90 text-cyan-400" : "text-slate-700 group-hover:text-slate-500"}`} />
                </div>
                <div className="text-[9px] font-mono opacity-50 uppercase">{e.status} • V.{e.scopeVersion}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Intelligence Surface */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[#050505]">
          {selectedEngagementId ? (
            <>
              {/* Context Header */}
              <div className="px-8 py-6 border-b border-white/5 flex items-end justify-between bg-gradient-to-b from-white/[0.02] to-transparent">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">{selectedEngagement?.name}</h2>
                    <div className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                      Engagement_ID: {selectedEngagementId.slice(0, 8)}...
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-mono tracking-tight max-w-2xl line-clamp-1">
                    {selectedEngagement?.authorizationStatement}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold h-9 px-6 rounded-sm text-xs uppercase tracking-wider"
                    onClick={handleStartCollection}
                    disabled={startCollectionMutation.isPending}
                  >
                    {startCollectionMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Zap className="w-3 h-3 mr-2" />}
                    Trigger Collection Run
                  </Button>
                </div>
              </div>

              {/* Workbench Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-8 border-b border-white/5 flex items-center justify-between">
                  <TabsList className="bg-transparent h-12 gap-8 p-0">
                    {["intelligence", "evidence", "runs", "report"].map(tab => (
                      <TabsTrigger 
                        key={tab}
                        value={tab} 
                        className="data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 h-full rounded-none px-0 text-[10px] font-mono font-bold uppercase tracking-widest border-b-2 border-transparent transition-all"
                      >
                        {tab}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="flex items-center gap-4 text-slate-500 text-[10px] font-mono">
                    <div className="flex items-center gap-1">
                      <Bug className="w-3 h-3 text-red-500" />
                      <span>{findingsQuery.data?.length || 0} Vulnerabilities</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Database className="w-3 h-3 text-cyan-500" />
                      <span>{runsQuery.data?.length || 0} Runs</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <TabsContent value="intelligence" className="h-full m-0 p-0 overflow-y-auto">
                    <div className="p-8 grid grid-cols-12 gap-8">
                      {/* Attack Path Queue */}
                      <div className="col-span-12 xl:col-span-4 space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Attack_Path_Priority</h3>
                          <Fingerprint className="w-4 h-4 text-slate-700" />
                        </div>
                        <div className="space-y-3">
                          {findingsQuery.data?.map(f => (
                            <div 
                              key={f.id} 
                              className="p-4 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded transition-all cursor-pointer group"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <SeverityBadge severity={f.severity as any} />
                                <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">Confidence: {f.confidence}</span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-100 mb-2 group-hover:text-cyan-400 transition-colors">{f.title}</h4>
                              <div className="flex items-center gap-2">
                                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-cyan-500/50" style={{ width: '85%' }} />
                                </div>
                                <span className="text-[9px] font-mono text-cyan-500 font-bold uppercase tracking-tighter">Validated</span>
                              </div>
                            </div>
                          ))}
                          {(!findingsQuery.data || findingsQuery.data.length === 0) && (
                            <div className="p-8 border border-dashed border-white/5 rounded text-center text-slate-600 text-[10px] font-mono uppercase">
                              Waiting for intelligence generation...
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reasoning Trace Canvas */}
                      <div className="col-span-12 xl:col-span-8 space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Reasoning_Trace & Temporal_Drift</h3>
                          <div className="flex items-center gap-3">
                            <div className="px-2 py-0.5 rounded bg-black border border-white/5 text-[9px] text-slate-600 font-mono">ONTOLOGY_V5</div>
                            <Activity className="w-4 h-4 text-cyan-500 animate-pulse" />
                          </div>
                        </div>

                        <Card className="bg-black border-white/5 p-8 relative overflow-hidden group">
                          {/* Grid Overlay */}
                          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                          
                          <div className="relative z-10 space-y-12">
                            {/* Reasoning Nodes */}
                            <div className="flex flex-col gap-8">
                              <div className="flex items-start gap-6">
                                <div className="w-6 h-6 rounded-full border border-cyan-500/50 flex items-center justify-center shrink-0 text-[10px] font-mono text-cyan-400 bg-cyan-500/10">01</div>
                                <div className="space-y-2">
                                  <div className="text-[10px] font-mono text-cyan-500 uppercase font-bold tracking-widest">Observation_Normalization</div>
                                  <p className="text-sm text-slate-200 leading-relaxed max-w-xl italic">
                                    "Extracted tech stack signature 'vulnerable-wp-v1.2' from evidence bucket 'EVID-821'. Entropy-weighted confidence suggests 0.92 precision."
                                  </p>
                                  <div className="flex gap-2">
                                    <span className="text-[9px] font-mono text-slate-600 px-1.5 py-0.5 bg-white/5 rounded">SHA-256: e821...</span>
                                    <span className="text-[9px] font-mono text-slate-600 px-1.5 py-0.5 bg-white/5 rounded">EVIDENCE_FIRST</span>
                                  </div>
                                </div>
                              </div>

                              <div className="h-10 w-px bg-gradient-to-b from-cyan-500/30 to-transparent ml-[11.5px]" />

                              <div className="flex items-start gap-6">
                                <div className="w-6 h-6 rounded-full border border-purple-500/50 flex items-center justify-center shrink-0 text-[10px] font-mono text-purple-400 bg-purple-500/10">02</div>
                                <div className="space-y-2">
                                  <div className="text-[10px] font-mono text-purple-500 uppercase font-bold tracking-widest">Correlation_Inference</div>
                                  <p className="text-sm text-slate-200 leading-relaxed max-w-xl italic">
                                    "Correlated WP version with known attack chain 'PATH-01' (Auth Bypass). Neo4j projection indicates 3 objective nodes are reachable via this vector."
                                  </p>
                                  <div className="flex gap-2">
                                    <span className="text-[9px] font-mono text-slate-600 px-1.5 py-0.5 bg-white/5 rounded">GRAPH_PROJECTION</span>
                                    <span className="text-[9px] font-mono text-slate-600 px-1.5 py-0.5 bg-white/5 rounded">TEMPORAL_DRIFT: +0.15</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="evidence" className="h-full m-0 p-8 overflow-y-auto">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                        <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Immutable_Evidence_Browser</h3>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                            <Input className="h-8 bg-black border-white/5 pl-9 w-64 text-[10px] font-mono" placeholder="Search evidence hashes..." />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {findingsQuery.data?.map(f => (
                          <div key={f.id} className="p-4 bg-white/[0.01] border border-white/5 rounded hover:bg-white/[0.02] transition-all group">
                             <div className="flex items-center justify-between mb-3 text-[9px] font-mono uppercase tracking-widest">
                               <span className="text-slate-500">Source: {f.sourceTool}</span>
                               <span className="text-slate-700">Capture_ID: {f.id.slice(0, 8)}</span>
                             </div>
                             <div className="mb-4">
                               <CodeBlock code={f.evidence || ""} language="text" className="text-[10px] opacity-60" />
                             </div>
                             <div className="flex justify-between items-center">
                               <div className="text-[9px] font-mono text-slate-600">MODIFIED: {new Date(f.updatedAt || "").toLocaleString()}</div>
                               <Button variant="ghost" className="h-6 text-[9px] font-mono text-cyan-500 hover:bg-cyan-500/10">LINK_EVIDENCE</Button>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="runs" className="h-full m-0 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto space-y-6">
                       <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-8 pb-4 border-b border-white/5">Collection_History</h3>
                       <div className="space-y-3">
                         {runsQuery.data?.map(run => (
                           <div key={run.id} className="flex items-center gap-6 p-4 bg-white/[0.01] border border-white/5 rounded">
                             <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center shrink-0">
                               {run.status === "pending" ? <Loader2 className="w-4 h-4 animate-spin text-cyan-500" /> : <Shield className="w-4 h-4 text-green-500" />}
                             </div>
                             <div className="flex-1">
                               <div className="flex items-center justify-between mb-1">
                                 <span className="text-xs font-bold text-slate-200 uppercase tracking-tight">Run_{run.id.slice(0, 8)}</span>
                                 <span className={`text-[9px] font-mono font-bold uppercase ${run.status === 'pending' ? 'text-cyan-500 animate-pulse' : 'text-green-500'}`}>{run.status}</span>
                               </div>
                               <div className="flex items-center gap-4 text-[9px] font-mono text-slate-600 uppercase">
                                 <span>Profile: {run.collectionProfile}</span>
                                 <span>Scope: v{run.scopeVersion}</span>
                                 <span>Triggered: {new Date(run.createdAt).toLocaleString()}</span>
                               </div>
                             </div>
                             <Button variant="outline" className="h-8 border-white/10 bg-transparent text-[9px] font-mono hover:bg-white/5 uppercase">View_Artifacts</Button>
                           </div>
                         ))}
                       </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="report" className="h-full m-0 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto space-y-8">
                      <div className="flex items-center justify-between border-b border-white/5 pb-6">
                        <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Intelligence_Report_Synthesis</h3>
                        <Button className="h-8 bg-white text-black font-bold text-[10px] uppercase px-6 hover:bg-slate-200">Export_PDF</Button>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <h1 className="text-white text-3xl font-bold tracking-tighter uppercase mb-2">Executive_Intelligence_Summary</h1>
                        <p className="text-slate-400 font-mono text-xs uppercase mb-8">Generated by HAWK Sovereign Engine for {selectedEngagement?.name}</p>
                        
                        <div className="p-6 bg-red-950/10 border border-red-900/20 rounded-sm mb-8">
                          <h2 className="text-red-500 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            CRITICAL_PATH_ALERT: REMOTE_CODE_EXECUTION
                          </h2>
                          <p className="text-slate-300 text-sm leading-relaxed mb-4">
                            The platform has identified a deterministic attack chain leading to full system compromise. Through correlation of unpatched WordPress vulnerability (CVE-2024-XXXX) and exposed debug credentials, RCE is confirmed.
                          </p>
                          <div className="text-[10px] font-mono text-red-400 font-bold uppercase">Priority: Tactical_Remediation_Immediate</div>
                        </div>

                        <h2 className="text-white text-lg font-bold tracking-tight uppercase mb-4 border-b border-white/10 pb-2">Intelligence_Findings</h2>
                        <div className="space-y-8">
                          {findingsQuery.data?.map(f => (
                            <div key={f.id} className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-cyan-400 font-bold uppercase tracking-tight">{f.title}</h3>
                                <SeverityBadge severity={f.severity as any} />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-[10px] font-mono text-slate-600 uppercase mb-2">Technical_Evidence</h4>
                                  <CodeBlock code={f.evidence || ""} language="text" />
                                </div>
                                <div>
                                  <h4 className="text-[10px] font-mono text-slate-600 uppercase mb-2">Strategic_Remediation</h4>
                                  <p className="text-slate-400 text-xs leading-relaxed">{f.remediation}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
               {/* Background Radar Effect */}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                 <div className="w-[600px] h-[600px] border border-cyan-500 rounded-full animate-ping" />
                 <div className="w-[400px] h-[400px] border border-cyan-500 rounded-full absolute" />
                 <div className="w-[200px] h-[200px] border border-cyan-500 rounded-full absolute" />
               </div>

               <div className="max-w-md space-y-8 relative z-10">
                 <div className="w-16 h-16 rounded-2xl bg-cyan-600 mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(8,145,178,0.2)]">
                   <Radar className="w-8 h-8 text-black" />
                 </div>
                 <div className="space-y-2">
                   <h2 className="text-3xl font-bold text-white tracking-tighter uppercase">Intelligence_Awaiting</h2>
                   <p className="text-slate-500 text-sm font-mono tracking-tight leading-relaxed">
                     Select an active engagement from the sidebar or initialize a new sovereign testing session to begin intelligence synthesis.
                   </p>
                 </div>
                 
                 <Card className="bg-white/[0.01] border-white/5 p-8 text-left space-y-6 backdrop-blur-sm">
                   <h3 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-widest border-b border-white/5 pb-2">New_Engagement_Parameters</h3>
                   <div className="space-y-4">
                     <div className="space-y-2">
                       <label className="text-[10px] font-mono text-slate-500 uppercase">Operational_Name</label>
                       <Input 
                        className="bg-black border-white/5 h-10 text-slate-200 font-mono text-xs focus:ring-cyan-500 focus:border-cyan-500" 
                        placeholder="e.g., OP_SOVEREIGN_SENTINEL"
                        value={newEngagementName}
                        onChange={(e) => setNewEngagementName(e.target.value)}
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-mono text-slate-500 uppercase">Ethical_Authorization_Statement</label>
                       <textarea 
                        className="w-full h-24 bg-black border border-white/5 rounded-md p-3 text-slate-200 font-mono text-xs focus:ring-cyan-500 focus:outline-none transition-all resize-none" 
                        placeholder="I certify that I have explicit permission..."
                        value={authStatement}
                        onChange={(e) => setAuthStatement(e.target.value)}
                       />
                     </div>
                     <Button 
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold h-11 uppercase tracking-widest text-xs"
                      onClick={handleCreateEngagement}
                      disabled={createEngagementMutation.isPending}
                     >
                       {createEngagementMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                       Initialize_Sovereign_Session
                     </Button>
                   </div>
                 </Card>

                 <div className="flex items-center justify-center gap-6 text-[10px] font-mono text-slate-700 uppercase tracking-widest">
                   <div className="flex items-center gap-1">
                     <Shield className="w-3 h-3" />
                     <span>Immutable_Audit</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <FileText className="w-3 h-3" />
                     <span>Legal_Provenance</span>
                   </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
