const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
const ENGINE_KEY = import.meta.env.VITE_ENGINE_KEY || 'lattice9-default-key';

export interface GraphNode {
  id: string;
  display_name: string;
  entity_type: string;
  confidence: number;
  influence_score?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  weight: number;
}

export interface AttackPath {
  node_ids: string[];
  node_names: string[];
  rel_types: string[];
  composite_score: number;
}

async function request(path: string, params?: Record<string, string>) {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'x-lattice9-key': ENGINE_KEY,
    },
  });
  
  if (!response.ok) {
    throw new Error(`L9_ENGINE_ERROR::${response.status}`);
  }
  
  return response.json();
}

export const api = {
  getGraphSummary: async (engagementId: string) => {
    return request(`/algorithms/${engagementId}`);
  },
  
  getAttackPaths: async (engagementId: string, maxDepth: number = 6) => {
    const data = await request(`/algorithms/${engagementId}/paths`, { max_depth: String(maxDepth) });
    return data.paths as AttackPath[];
  },

  getCentrality: async (engagementId: string) => {
    const data = await request(`/algorithms/${engagementId}`, { algorithm: 'centrality' });
    return data.result.nodes as GraphNode[];
  },

  getExploitChains: async (engagementId: string) => {
    const data = await request(`/algorithms/${engagementId}/exploit-chains`);
    return data.exploit_chains;
  },

  getEvidenceLineage: async (engagementId: string) => {
    return request(`/evidence/${engagementId}/lineage`);
  }
};
