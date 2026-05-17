import { Outlet, Link, useLocation } from "react-router";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Network, GitBranch, Layers, Share2, Grid3x3, Clock, DollarSign, Shield, Zap, Brain } from "lucide-react";

const visualizations = [
  { path: "/attack-path", label: "Attack Path Analysis", icon: Network },
  { path: "/bayesian-propagation", label: "Bayesian Propagation", icon: GitBranch },
  { path: "/graph-topology", label: "Graph Topology", icon: Layers },
  { path: "/distributed-architecture", label: "Distributed Architecture", icon: Share2 },
  { path: "/graph-partitioning", label: "Graph Partitioning", icon: Grid3x3 },
  { path: "/temporal-mutation", label: "Temporal Mutation", icon: Clock },
  { path: "/attack-economics", label: "Attack Economics", icon: DollarSign },
  { path: "/topology-resistance", label: "Topology Resistance", icon: Shield },
  { path: "/event-propagation", label: "Event Propagation", icon: Zap },
  { path: "/operational-cognition", label: "Operational Cognition", icon: Brain },
];

export function VisualizationLayout() {
  const location = useLocation();
  
  return (
    <div className="flex h-screen bg-white text-black">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-gray-300 flex flex-col">
        <div className="p-6 border-b border-gray-300">
          <h1 className="font-mono tracking-tight">LATTICE9</h1>
          <p className="text-xs text-gray-600 mt-1 font-mono">Graph-Native Intelligence Platform</p>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-1">
            {visualizations.map((viz) => {
              const Icon = viz.icon;
              const isActive = location.pathname === viz.path || (location.pathname === "/" && viz.path === "/attack-path");
              
              return (
                <Link key={viz.path} to={viz.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start font-mono text-xs ${isActive ? "bg-black text-white" : ""}`}
                  >
                    <Icon className="mr-2 h-3 w-3" />
                    {viz.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </ScrollArea>
        
        <Separator />
        
        <div className="p-4">
          <div className="text-[10px] font-mono text-gray-500 space-y-1">
            <div>ARCH: Distributed</div>
            <div>PROTO: Graph-Native</div>
            <div>CLASS: Offensive Intel</div>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
