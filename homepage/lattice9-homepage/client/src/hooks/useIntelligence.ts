import { useState, useEffect } from 'react';
import { api, GraphNode, AttackPath } from '../services/api';

export function useIntelligence(engagementId: string) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [paths, setPaths] = useState<AttackPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!engagementId) return;
    setLoading(true);
    try {
      const [nodeData, pathData] = await Promise.all([
        api.getCentrality(engagementId),
        api.getAttackPaths(engagementId),
      ]);
      setNodes(nodeData);
      setPaths(pathData);
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

  return { nodes, paths, loading, error, refresh };
}
