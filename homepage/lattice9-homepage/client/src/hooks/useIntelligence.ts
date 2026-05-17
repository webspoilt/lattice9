import { useState, useEffect } from 'react';
import { api, GraphNode, GraphLink, AttackPath } from '../services/api';

export function useIntelligence(engagementId: string) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [paths, setPaths] = useState<AttackPath[]>([]);
  const [exploitChains, setExploitChains] = useState<any[]>([]);
  const [evolution, setEvolution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!engagementId) return;
    setLoading(true);
    try {
      const [topoData, pathData, chainData, evoData] = await Promise.all([
        api.getTopology(engagementId),
        api.getAttackPaths(engagementId),
        api.getExploitChains(engagementId),
        api.getEvolution(engagementId).catch(() => null), // Graceful fallback if Neo4j is operational but PostgreSQL tables are empty in sandbox
      ]);
      
      setNodes(topoData.nodes || []);
      setLinks(topoData.links || []);
      setPaths(pathData || []);
      setExploitChains(chainData || []);
      setEvolution(evoData || null);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [engagementId]);

  return { nodes, links, paths, exploitChains, evolution, loading, error, refresh };
}
