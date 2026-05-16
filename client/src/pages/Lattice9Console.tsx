import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CodeBlock } from "@/components/CodeBlock";
import { Logo } from "@/components/Logo";
import { 
  Loader2, 
  Shield, 
  Bug, 
  FileText, 
  Network, 
  Activity, 
  Layers, 
  Fingerprint,
  Zap,
  ChevronRight,
  Database,
  Search,
  AlertTriangle,
  Server,
  Share2
} from "lucide-react";
import { toast } from "sonner";

export default function Lattice9Console() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("intelligence");
  const [selectedEngagementId, setSelectedEngagementId] = useState<string | null>(null);
  const [newEngagementName, setNewEngagementName] = useState("");
  const [authStatement, setAuthStatement] = useState("");

  // Queries
  const engagementsQuery = trpc.engagements.list.useQuery(undefined, {
    enabled: !!user,
  });

  const findingsQuery = trpc.exposure.getFindings.useQuery(
    { engagementId: selectedEngagementId! },
    { enabled: !!selectedEngagementId }
  );

  const runsQuery = trpc.collection.getRuns.useQuery(
    { engagementId: selectedEngagementId! },
    { enabled: !!selectedEngagementId, refetchInterval: 5000 }
  );

  // Mutations
  const createEngagementMutation = trpc.engagements.create.useMutation();
  const startCollectionMutation = trpc.collection.startCollection.useMutation();

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
      toast.success("Operational context initialized");
    } catch (e) {
      toast.error("Context initialization failed");
    }
  };

  const handleStartCollection = async () => {
    if (!selectedEngagementId) return;
    try {
      await startCollectionMutation.mutateAsync({ engagementId: selectedEngagementId });
      toast.success("Intelligence capture initiated");
      await runsQuery.refetch();
    } catch (e) {
      toast.error("Capture failed to trigger");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center font-mono">
        <div className="text-zinc-500 text-xs tracking-widest uppercase">Lattice9_CORE_BOOT [INITIALIZING]...</div>
      </div>
    );
  }

  const selectedEngagement = engagementsQuery.data?.find(e => e.id === selectedEngagementId);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-400 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Global Status Bar */}
      <div className="h-9 bg-black border-b border-white/5 flex items-center justify-between px-6 text-[10px] font-mono tracking-tighter">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 uppercase">Status:</span>
            <span className="text-emerald-500 font-bold uppercase">System_Nominal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 uppercase">Entropy:</span>
            <span className="text-zinc-300">0.841bits</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-500">
            <Layers className="w-3 h-3" />
            <span>Core: 5.0.0-L9</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 uppercase">Operator:</span>
            <span className="text-zinc-300 uppercase">{user?.displayName || user?.email || "Anonymous"}</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        </div>
      </div>

      <div className="flex h-[calc(100vh-36px)]">
        {/* Navigation Sidebar */}
        <div className="w-72 border-r border-white/5 bg-[#0e0e10] flex flex-col">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3 mb-8">
              <Logo className="h-7" />
            </div>

            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-mono uppercase text-zinc-400 rounded-none h-10"
              onClick={() => setSelectedEngagementId(null)}
            >
              <Zap className="w-3 h-3 text-indigo-400" />
              Initialize New Context
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            <h2 className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] px-2 mb-3">Operational Contexts</h2>
            {engagementsQuery.data?.map(e => (
              <button
                key={e.id}
                onClick={() => setSelectedEngagementId(e.id)}
                className={`w-full group px-3 py-3 rounded-none text-left transition-all border-l-2 ${
                  selectedEngagementId === e.id 
                    ? "bg-white/[0.03] border-indigo-500 text-zinc-100" 
                    : "hover:bg-white/[0.02] border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold tracking-tight truncate">{e.name}</span>
                  <ChevronRight className={`w-3 h-3 transition-transform ${selectedEngagementId === e.id ? "rotate-90 text-indigo-400" : "text-zinc-800"}`} />
                </div>
                <div className="text-[9px] font-mono opacity-40 uppercase tracking-tighter">{e.status} • V.{e.scopeVersion}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Intelligence Surface */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[#0a0a0b]">
          {selectedEngagementId ? (
            <>
              {/* Context Header */}
              <div className="px-8 py-6 border-b border-white/5 flex items-end justify-between bg-white/[0.01]">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-white tracking-tight">{selectedEngagement?.name}</h2>
                    <div className="px-1.5 py-0.5 rounded-sm bg-zinc-800 border border-white/5 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                      L9_CTX: {selectedEngagementId.slice(0, 8)}
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-600 font-mono tracking-tight max-w-2xl line-clamp-1">
                    {selectedEngagement?.authorizationStatement}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 px-6 rounded-none text-[10px] uppercase tracking-widest"
                    onClick={handleStartCollection}
                    disabled={startCollectionMutation.isPending}
                  >
                    {startCollectionMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Network className="w-3 h-3 mr-2" />}
                    Initiate Capture
                  </Button>
                </div>
              </div>

              {/* Workbench Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-8 border-b border-white/5 flex items-center justify-between bg-[#0e0e10]/50">
                  <TabsList className="bg-transparent h-11 gap-8 p-0">
                    {["intelligence", "evidence", "telemetry", "reports"].map(tab => (
                      <TabsTrigger 
                        key={tab}
                        value={tab} 
                        className="data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 h-full rounded-none px-0 text-[10px] font-mono font-bold uppercase tracking-[0.15em] border-b-2 border-transparent transition-all"
                      >
                        {tab}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="flex items-center gap-4 text-zinc-600 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <Bug className="w-3 h-3 text-red-500/70" />
                      <span>{findingsQuery.data?.length || 0} Vulnerabilities</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Server className="w-3 h-3 text-indigo-500/70" />
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
                          <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.2em]">Graph_Correlation_Priority</h3>
                          <Fingerprint className="w-4 h-4 text-zinc-800" />
                        </div>
                        <div className="space-y-2">
                          {findingsQuery.data?.map(f => (
                            <div 
                              key={f.id} 
                              className="p-4 bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 rounded-none transition-all cursor-pointer group"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <SeverityBadge severity={f.severity as any} />
                                <span className="text-[9px] font-mono text-zinc-600 uppercase">Conf: {f.confidence}</span>
                              </div>
                              <h4 className="text-xs font-bold text-zinc-200 mb-3 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{f.title}</h4>
                              <div className="flex items-center gap-2">
                                <div className="h-0.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500/40" style={{ width: '85%' }} />
                                </div>
                                <span className="text-[8px] font-mono text-zinc-600 font-bold uppercase tracking-widest">Validated</span>
                              </div>
                            </div>
                          ))}
                          {(!findingsQuery.data || findingsQuery.data.length === 0) && (
                            <div className="p-12 border border-dashed border-white/5 rounded-none text-center text-zinc-700 text-[10px] font-mono uppercase tracking-widest">
                              Intelligence synthesis pending...
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reasoning Trace Canvas */}
                      <div className="col-span-12 xl:col-span-8 space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.2em]">Attack_Path_Reasoning & Temporal_Exposure</h3>
                          <div className="flex items-center gap-3">
                            <Activity className="w-3.5 h-3.5 text-indigo-500" />
                          </div>
                        </div>

                        <Card className="bg-[#0e0e10] border-white/5 p-8 relative overflow-hidden group rounded-none">
                          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                          
                          <div className="relative z-10 space-y-12">
                            {findingsQuery.data && findingsQuery.data.length > 0 ? (
                              findingsQuery.data.slice(0, 4).map((f, i) => (
                                <div className="flex flex-col gap-8" key={f.id}>
                                  <div className="flex items-start gap-6">
                                    <div className="w-6 h-6 border border-zinc-700 flex items-center justify-center shrink-0 text-[10px] font-mono text-zinc-500 bg-zinc-900">
                                      {String(i + 1).padStart(2, "0")}
                                    </div>
                                    <div className="space-y-2 flex-1">
                                      <div className="text-[10px] font-mono text-indigo-500 uppercase font-bold tracking-[0.2em]">
                                        {f.sourceTool || "Observation"}_{f.severity}
                                      </div>
                                      <p className="text-[13px] text-zinc-300 leading-relaxed max-w-xl font-medium">
                                        {f.evidence || f.title || "No evidence captured"}
                                      </p>
                                      <div className="flex gap-2 pt-1 flex-wrap">
                                        <span className="text-[9px] font-mono text-zinc-600 px-1.5 py-0.5 border border-white/5 bg-white/[0.02]">
                                          CWE: {f.cwe || "N/A"}
                                        </span>
                                        <span className="text-[9px] font-mono text-zinc-600 px-1.5 py-0.5 border border-white/5 bg-white/[0.02]">
                                          CONF: {f.confidence}
                                        </span>
                                        <span className="text-[9px] font-mono text-zinc-600 px-1.5 py-0.5 border border-white/5 bg-white/[0.02]">
                                          STATE: {f.validationState}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {i < Math.min(findingsQuery.data.length, 4) - 1 && (
                                    <div className="h-8 w-px bg-zinc-800 ml-[11.5px]" />
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="flex items-start gap-6">
                                <div className="w-6 h-6 border border-zinc-700 flex items-center justify-center shrink-0 text-[10px] font-mono text-zinc-500 bg-zinc-900">01</div>
                                <div className="space-y-2">
                                  <div className="text-[10px] font-mono text-zinc-500 uppercase font-bold tracking-[0.2em]">Reasoning Trace</div>
                                  <p className="text-[13px] text-zinc-500 leading-relaxed max-w-xl font-medium italic">
                                    Initiate intelligence capture to populate reasoning trace...
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="evidence" className="h-full m-0 p-8 overflow-y-auto">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-10 pb-4 border-b border-white/5">
                        <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.2em]">Evidence_Lineage_Vault</h3>
                        <div className="relative">
                          <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                          <Input className="h-9 bg-black border-white/5 pl-9 w-72 text-[11px] font-mono rounded-none" placeholder="Search lineage hashes..." />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {findingsQuery.data?.map(f => (
                          <div key={f.id} className="p-5 bg-white/[0.01] border border-white/5 rounded-none hover:bg-white/[0.02] transition-all group">
                             <div className="flex items-center justify-between mb-4 text-[9px] font-mono uppercase tracking-widest">
                               <span className="text-zinc-500">Source: {f.sourceTool}</span>
                               <span className="text-zinc-700">L9_UID: {f.id.slice(0, 8)}</span>
                             </div>
                             <div className="mb-5">
                               <CodeBlock code={f.evidence || ""} language="text" className="text-[10px] opacity-50 font-mono" />
                             </div>
                             <div className="flex justify-between items-center pt-4 border-t border-white/5">
                               <div className="text-[9px] font-mono text-zinc-700 tracking-tighter uppercase">Last_Observed: {new Date(f.updatedAt || "").toLocaleString()}</div>
                               <Button variant="ghost" className="h-7 text-[9px] font-mono text-indigo-500 hover:bg-indigo-500/5 rounded-none uppercase">Correlate</Button>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="telemetry" className="h-full m-0 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto space-y-6">
                       <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.2em] mb-10 pb-4 border-b border-white/5">Infrastructure_Telemetry_History</h3>
                       <div className="space-y-2">
                         {runsQuery.data?.map(run => (
                           <div key={run.id} className="flex items-center gap-6 p-4 bg-white/[0.01] border border-white/5 rounded-none">
                             <div className="w-9 h-9 border border-white/5 bg-white/[0.02] flex items-center justify-center shrink-0">
                               {run.status === "pending" ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" /> : <Shield className="w-3.5 h-3.5 text-zinc-600" />}
                             </div>
                             <div className="flex-1">
                               <div className="flex items-center justify-between mb-1">
                                 <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-tight">Run_{run.id.slice(0, 8)}</span>
                                 <span className={`text-[9px] font-mono font-bold uppercase ${run.status === 'pending' ? 'text-indigo-500' : 'text-zinc-600'}`}>{run.status}</span>
                               </div>
                               <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">
                                 <span>Profile: {run.collectionProfile}</span>
                                 <span>Scope: v{run.scopeVersion}</span>
                                 <span>Timestamp: {new Date(run.createdAt).toLocaleString()}</span>
                               </div>
                             </div>
                             <Button variant="outline" className="h-8 border-white/10 bg-transparent text-[9px] font-mono hover:bg-white/5 rounded-none uppercase tracking-widest px-4">View_Log</Button>
                           </div>
                         ))}
                       </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="reports" className="h-full m-0 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto space-y-10">
                      <div className="flex items-center justify-between border-b border-white/5 pb-8">
                        <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.2em]">Operational_Intelligence_Synthesis</h3>
                        <Button className="h-9 bg-zinc-200 text-black font-bold text-[10px] uppercase px-8 rounded-none hover:bg-white tracking-widest">Export_Intelligence</Button>
                      </div>
                      <div className="prose prose-invert prose-zinc max-w-none">
                        <h1 className="text-white text-4xl font-bold tracking-tighter uppercase mb-2">Intelligence_Summary</h1>
                        <p className="text-zinc-600 font-mono text-[10px] uppercase mb-12 tracking-widest border-l-2 border-indigo-500 pl-4">Lattice9 Core Engine // CTX: {selectedEngagement?.name}</p>
                        
                        {findingsQuery.data && findingsQuery.data.length > 0 && findingsQuery.data.some(f => f.severity === "critical") && (
                          <div className="p-8 bg-white/[0.01] border border-red-900/10 border-l-4 border-l-red-600 rounded-none mb-12">
                            <h2 className="text-red-600 text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              CRITICAL_PATH_EXPOSURE
                            </h2>
                            <p className="text-zinc-300 text-sm leading-relaxed mb-6 font-medium">
                              {findingsQuery.data.filter(f => f.severity === "critical").length} critical findings identified. Review evidence and validate before reporting.
                            </p>
                          </div>
                        )}

                        <h2 className="text-white text-lg font-bold tracking-tighter uppercase mb-6 border-b border-white/10 pb-3">Analyzed_Exposures</h2>
                        <div className="space-y-12">
                          {findingsQuery.data?.map(f => (
                            <div key={f.id} className="space-y-6">
                              <div className="flex items-center justify-between">
                                <h3 className="text-zinc-200 text-sm font-bold uppercase tracking-tight">{f.title}</h3>
                                <SeverityBadge severity={f.severity as any} />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                  <h4 className="text-[10px] font-mono text-zinc-600 uppercase mb-3 tracking-widest">Technical_Provenance</h4>
                                  <CodeBlock code={f.evidence || ""} language="text" className="text-[10px] bg-black/40 border-white/5 opacity-80" />
                                </div>
                                <div>
                                  <h4 className="text-[10px] font-mono text-zinc-600 uppercase mb-3 tracking-widest">Tactical_Remediation</h4>
                                  <p className="text-zinc-400 text-[13px] leading-relaxed font-medium">{f.remediation}</p>
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
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative bg-gradient-to-b from-[#0e0e10] to-[#0a0a0b]">
               <div className="max-w-md space-y-10 relative z-10">
                 <Logo className="h-12 mx-auto mb-4" variant="icon" />
                 <div className="space-y-3">
                   <h2 className="text-2xl font-bold text-white tracking-tighter uppercase">Infrastructure_Analysis_Pending</h2>
                   <p className="text-zinc-600 text-[13px] font-medium tracking-tight leading-relaxed max-w-sm mx-auto">
                     Select an operational context or initialize a new sovereign session to begin graph-native attack path synthesis.
                   </p>
                 </div>
                 
                 <Card className="bg-white/[0.01] border-white/5 p-8 text-left space-y-6 rounded-none">
                   <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5 pb-3">Context_Initialization</h3>
                   <div className="space-y-5">
                     <div className="space-y-2">
                       <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Operational_Name</label>
                       <Input 
                        className="bg-black border-white/5 h-11 text-zinc-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500 rounded-none" 
                        placeholder="e.g., L9_ALPHA_CORP"
                        value={newEngagementName}
                        onChange={(e) => setNewEngagementName(e.target.value)}
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Ethical_Authorization_Audit_Log</label>
                       <textarea 
                        className="w-full h-28 bg-black border border-white/5 rounded-none p-4 text-zinc-300 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all resize-none" 
                        placeholder="Log explicit permission statement for immutable audit..."
                        value={authStatement}
                        onChange={(e) => setAuthStatement(e.target.value)}
                       />
                     </div>
                     <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 uppercase tracking-[0.2em] text-[10px] rounded-none"
                      onClick={handleCreateEngagement}
                      disabled={createEngagementMutation.isPending}
                     >
                       {createEngagementMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                       Initialize_Lattice9_Session
                     </Button>
                   </div>
                 </Card>

                 <div className="flex items-center justify-center gap-8 text-[9px] font-mono text-zinc-800 uppercase tracking-[0.3em]">
                   <div className="flex items-center gap-2">
                     <Shield className="w-3 h-3" />
                     <span>Immutable_Audit</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <Database className="w-3 h-3" />
                     <span>Provenance_Locked</span>
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
