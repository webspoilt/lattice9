import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Radar, Shield, Bug, FileText, MessageSquare, Terminal, Zap, Lock } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-cyan-500/30">
      {/* Hero Section */}
      <header className="relative overflow-hidden border-b border-slate-900 bg-black py-24">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-cyan-500/10 to-transparent blur-3xl pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="flex items-center gap-4 group">
              <div className="w-16 h-16 rounded-xl bg-slate-900 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all">
                <Radar className="w-10 h-10 text-cyan-400 animate-pulse" />
              </div>
              <div className="text-left">
                <h1 className="text-5xl font-black text-white tracking-tighter">⬡ LATTICE9</h1>
                <p className="text-indigo-500 font-mono text-sm tracking-[0.2em] uppercase">Offensive Intelligence OS</p>
              </div>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold text-white max-w-4xl leading-[1.1]">
              Engineered for <span className="text-cyan-500">High-Integrity</span> Security Research.
            </h2>
            
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
              Move beyond simulated reconnaissance. Lattice9 combines local graph-native reasoning with deterministic offensive intelligence and enforced ethical authorization.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {isAuthenticated ? (
                <Button 
                  onClick={() => navigate("/dashboard")}
                  className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-8 py-6 text-lg rounded-none skew-x-[-10deg] transition-all"
                >
                  <span className="skew-x-[10deg] flex items-center gap-2">
                    <Terminal className="w-5 h-5" /> ENTER COMMAND CENTER
                  </span>
                </Button>
              ) : (
                <Button 
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-8 py-6 text-lg rounded-none skew-x-[-10deg] transition-all"
                >
                  <span className="skew-x-[10deg] flex items-center gap-2">
                    <Lock className="w-5 h-5" /> INITIALIZE SESSION
                  </span>
                </Button>
              )}
              <Button 
                variant="outline"
                className="border-slate-800 hover:bg-slate-900 text-white font-bold px-8 py-6 text-lg rounded-none skew-x-[-10deg] transition-all"
              >
                <span className="skew-x-[10deg]">DOCUMENTATION</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Terminal Preview */}
      <section className="py-20 bg-[#050505]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-t-lg bg-slate-900 border-x border-t border-slate-800 p-2 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
            <div className="ml-4 text-[10px] font-mono text-slate-500">l9_session_active --target:infra.lattice9.io</div>
          </div>
          <div className="bg-black border-x border-b border-slate-800 p-8 font-mono text-sm space-y-2 shadow-2xl">
            <div className="text-indigo-500">operator@lattice9:~$ <span className="text-white">initialize_reasoning --target example.com</span></div>
            <div className="text-slate-500">[INFO] Loading Security Engine v0.1.0...</div>
            <div className="text-slate-500">[INFO] Verifying Ethical Authorization Log... [OK]</div>
            <div className="text-slate-500">[RECON] Running DNS Lookup via FastAPI...</div>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="text-green-500/80 p-2 bg-green-500/5 rounded border border-green-500/20">
                A: 93.184.216.34
              </div>
              <div className="text-amber-500/80 p-2 bg-amber-500/5 rounded border border-amber-500/20">
                MX: mail.example.com
              </div>
            </div>
            <div className="text-slate-500">[RECON] Stage 2: Tech Stack Fingerprinting...</div>
            <div className="text-cyan-500 animate-pulse">_</div>
          </div>
        </div>
      </section>

      {/* The Manifesto */}
      <section className="py-24 border-y border-slate-900 bg-slate-950/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-white tracking-tight">The Pentester's Manifesto</h3>
              <div className="space-y-4 text-slate-400 leading-relaxed">
                <p>
                  Most security platforms are just "Concept Cars"—fancy interfaces wrapped around simulated logic. Lattice9 is built on three uncompromising pillars:
                </p>
                <div className="space-y-4 pt-4">
                  <div className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Deterministic Execution</h4>
                      <p className="text-sm">We don't guess. Every finding is backed by real tool output and verifiable evidence.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded bg-amber-900/30 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Legal Non-Repudiation</h4>
                      <p className="text-sm">Built-in authorization logs protect researchers and organizations alike.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Local-First Privacy</h4>
                      <p className="text-sm">Runs via Ollama. Your security intelligence never leaves your infrastructure.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-slate-900 border border-slate-800 rounded-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Bug className="w-6 h-6 text-red-500" />
                  <h4 className="text-lg font-bold text-white uppercase tracking-wider">Active Vulnerability Analysis</h4>
                </div>
                <div className="space-y-4">
                  <div className="h-2 bg-slate-800 rounded-full w-3/4"></div>
                  <div className="h-2 bg-slate-800 rounded-full w-full"></div>
                  <div className="h-2 bg-slate-800 rounded-full w-1/2"></div>
                  <div className="pt-4 border-t border-slate-800 mt-6 flex justify-between">
                    <div className="text-[10px] font-mono text-slate-500">CWE-693</div>
                    <div className="text-[10px] font-mono text-red-500 font-bold uppercase">Critical</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900 text-center text-slate-600 text-sm">
        <p>© 2026 Lattice9: Offensive Intelligence Operating System. All rights reserved.</p>
      </footer>
    </div>
  );
}
