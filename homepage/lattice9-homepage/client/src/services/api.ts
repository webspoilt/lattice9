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

async function request(path: string, params?: Record<string, string>, method: string = 'GET') {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  }
  
  const response = await fetch(url.toString(), {
    method,
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

  getTopology: async (engagementId: string) => {
    const data = await request(`/algorithms/${engagementId}/topology`);
    return data as { nodes: GraphNode[]; links: GraphLink[] };
  },

  getExploitChains: async (engagementId: string) => {
    const data = await request(`/algorithms/${engagementId}/exploit-chains`);
    return data.exploit_chains;
  },

  getEvidenceLineage: async (engagementId: string) => {
    return request(`/evidence/${engagementId}/lineage`);
  },

  getEvidencePedigree: async (findingId: string) => {
    return request(`/evidence/${findingId}/pedigree`);
  },

  getEvolution: async (engagementId: string) => {
    return request(`/evolution/${engagementId}`);
  },

  getEntropy: async (engagementId: string) => {
    return request(`/entropy/${engagementId}`);
  },

  getBlastRadius: async (engagementId: string, nodeId: string) => {
    return request(`/blast/${engagementId}/${nodeId}`);
  },

  getBlastAll: async (engagementId: string) => {
    return request(`/blast/${engagementId}/all`);
  },

  getCredentialCascade: async (engagementId: string) => {
    return request(`/blast/${engagementId}/credential-cascade`);
  },

  simulateCredentialCompromise: async (engagementId: string, credentialId: string) => {
    return request(`/counterfactual/${engagementId}/credential-compromise`, { credential_id: credentialId }, 'POST');
  },

  simulateEdgeRemoval: async (engagementId: string, sourceId: string, targetId: string, relType: string) => {
    return request(`/counterfactual/${engagementId}/edge-removal`, { source_id: sourceId, target_id: targetId, rel_type: relType }, 'POST');
  },

  simulateDefenseAddition: async (engagementId: string, nodeId: string, defenseType: string, effectiveness: number = 0.8) => {
    return request(`/counterfactual/${engagementId}/defense-addition`, { node_id: nodeId, defense_type: defenseType, effectiveness: String(effectiveness) }, 'POST');
  },

  simulateComprehensive: async (engagementId: string) => {
    return request(`/counterfactual/${engagementId}/comprehensive`, undefined, 'POST');
  },

  getCausalRootCause: async (engagementId: string) => {
    return request(`/causal/${engagementId}/root-cause`);
  },

  getCausalWhatIf: async (engagementId: string, nodeId: string, action: string = 'remove') => {
    return request(`/causal/${engagementId}/what-if`, { node_id: nodeId, action }, 'POST');
  }
};
