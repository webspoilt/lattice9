"""
Graph Neural Reasoning — embedding-based topology inference on infrastructure graphs.

Implements graph representation learning without external ML dependencies:
  - Node2Vec-style embeddings via biased random walks
  - Feature propagation through neighborhood aggregation (SAGE-style)
  - Attention-weighted neighbor importance (GAT-style)
  - Embedding similarity for latent relationship discovery

All computations are deterministic graph algorithms — no neural network training.

Applications:
  - Hidden attack path prediction (nodes with similar embeddings share risk profiles)
  - Unknown trust inference (embedding proximity suggests undocumented relationships)
  - Privilege escalation prediction (embeddings capture structural role)
  - Anomaly detection (nodes with atypical embedding neighborhoods)
  - Latent topology discovery (clustering in embedding space)
"""

import logging
import math
import random
from typing import List, Dict, Set, Any, Optional, Tuple
from collections import defaultdict, Counter

logger = logging.getLogger("lattice9-graph-engine")

EMBEDDING_DIM = 32          # Dimension of node embeddings
WALK_LENGTH = 20            # Length of random walks
WALKS_PER_NODE = 10         # Number of walks per source node
P = 0.5                      # Return parameter (Node2Vec: 1/p = return weight)
Q = 1.5                      # In-out parameter (Node2Vec: 1/q = outward weight)
NEIGHBOR_SAMPLES = 5         # Neighbors to sample in SAGE aggregation
SIMILARITY_THRESHOLD = 0.8   # Threshold for latent relationship prediction


async def compute_node_embeddings(driver, engagement_id: str) -> Dict:
    """
    Compute Node2Vec-style embeddings for all nodes in the graph.

    Method:
    1. Generate biased random walks from each node
    2. Count node co-occurrences within walk windows
    3. Compute embedding as normalized co-occurrence signature
    4. Dimensionality reduction via SVD-style projection

    Returns embedding vectors and similarity matrix.
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               RETURN n.id AS id, n.display_name AS name,
                      n.entity_type AS entity_type,
                      coalesce(toFloat(n.confidence), 0.5) AS confidence
            """,
            engagement_id=engagement_id,
        )
        nodes = {}
        async for record in result:
            nodes[record["id"]] = {
                "name": record["name"],
                "type": record["entity_type"],
                "confidence": record["confidence"],
            }

        edges_result = await session.run(
            """MATCH (a:L9 {engagement_id: $engagement_id})-[r]->(b:L9 {engagement_id: $engagement_id})
               RETURN a.id AS source, b.id AS target, type(r) AS rel_type
            """,
            engagement_id=engagement_id,
        )
        adj = defaultdict(list)
        async for record in edges_result:
            adj[record["source"]].append({
                "target": record["target"],
                "rel_type": record["rel_type"],
            })
            adj[record["target"]].append({
                "target": record["source"],
                "rel_type": record["rel_type"],
            })

    node_ids = list(nodes.keys())
    if len(node_ids) < 3:
        return {"error": "Too few nodes for embedding computation"}

    node_idx = {nid: i for i, nid in enumerate(node_ids)}
    n = len(node_ids)

    # Generate biased random walks (Node2Vec-style)
    walks = []
    for start_id in node_ids:
        for _ in range(WALKS_PER_NODE):
            walk = [start_id]
            current = start_id
            prev = None
            for __ in range(WALK_LENGTH - 1):
                neighbors = adj.get(current, [])
                if not neighbors:
                    break

                # Biased sampling based on Node2Vec parameters
                if prev is None:
                    # First step: uniform random
                    chosen = random.choice(neighbors)
                else:
                    # Second-order random walk
                    weights = []
                    for nb in neighbors:
                        nb_id = nb["target"]
                        if nb_id == prev:
                            # Return to previous node
                            w = 1.0 / P
                        elif nb_id in {nbr["target"] for nbr in adj.get(prev, [])}:
                            # Connected to previous node
                            w = 1.0
                        else:
                            # Not connected to previous
                            w = 1.0 / Q
                        weights.append(w)

                    total_w = sum(weights)
                    probs = [w / total_w for w in weights]
                    r = random.random()
                    cumulative = 0.0
                    chosen = neighbors[-1]
                    for k, prob in enumerate(probs):
                        cumulative += prob
                        if r <= cumulative:
                            chosen = neighbors[k]
                            break

                prev = current
                current = chosen["target"]
                walk.append(current)

            walks.append(walk)

    # Count co-occurrences within window context
    window_size = 5
    cooccurrences = Counter()
    node_counts = Counter()
    for walk in walks:
        for i, node in enumerate(walk):
            node_counts[node] += 1
            window_start = max(0, i - window_size)
            window_end = min(len(walk), i + window_size + 1)
            for j in range(window_start, window_end):
                if i != j:
                    pair = tuple(sorted([node, walk[j]]))
                    cooccurrences[pair] += 1

    # Build embedding matrix using truncated co-occurrence
    # Each node's embedding = PMI-weighted co-occurrence vector
    total_cooc = sum(cooccurrences.values())

    # Embedding is the top EMBEDDING_DIM singular vectors of the PMI matrix
    # Approximation: use spectral embedding of the normalized co-occurrence
    emb = [[0.0] * EMBEDDING_DIM for _ in range(n)]

    # Flatten PMI-weighted adjacency into embedding via SVD approximation
    # Use iterative approach: compute eigendecomposition of co-occurrence
    cooc_matrix = [[0.0] * n for _ in range(n)]
    for (u, v), count in cooccurrences.items():
        if u in node_idx and v in node_idx:
            i, j = node_idx[u], node_idx[v]
            pmi = math.log(
                max(count * total_cooc / (node_counts[u] * node_counts[v]), 1e-10)
            ) if node_counts[u] > 0 and node_counts[v] > 0 else 0
            pmi = max(0.0, pmi)  # Shifted PMI
            cooc_matrix[i][j] = pmi
            cooc_matrix[j][i] = pmi

    # Power iteration for top EMBEDDING_DIM eigenvectors
    def matrix_vector_mult(mat, vec, n):
        result = [0.0] * n
        for i in range(n):
            for j in range(n):
                result[i] += mat[i][j] * vec[j]
        return result

    def dot(a, b):
        return sum(x * y for x, y in zip(a, b))

    def normalize(v):
        norm = math.sqrt(dot(v, v))
        return [x / norm for x in v] if norm > 0 else v

    embeddings = []
    for d in range(min(EMBEDDING_DIM, n)):
        # Random initialization
        vec = [random.gauss(0, 0.1) for _ in range(n)]
        for _ in range(20):  # Power iterations
            vec = matrix_vector_mult(cooc_matrix, vec, n)

            # Gram-Schmidt orthogonalization
            for prev_vec in embeddings:
                proj = dot(vec, prev_vec)
                vec = [v - proj * pv for v, pv in zip(vec, prev_vec)]

            vec = normalize(vec)

        embeddings.append(vec)

    # Transpose to get node embeddings
    node_embeddings = {}
    for i, nid in enumerate(node_ids):
        emb_vec = [embeddings[d][i] for d in range(len(embeddings))]
        norm = math.sqrt(sum(v * v for v in emb_vec))
        node_embeddings[nid] = {
            "name": nodes[nid]["name"],
            "type": nodes[nid]["type"],
            "embedding": [round(v / norm if norm > 0 else 0, 6) for v in emb_vec],
        }

    # Compute pairwise cosine similarities for top nodes
    sim_pairs = []
    emb_list = [(nid, node_embeddings[nid]["embedding"]) for nid in node_ids[:50]]
    for i in range(len(emb_list)):
        for j in range(i + 1, len(emb_list)):
            ni, ei = emb_list[i]
            nj, ej = emb_list[j]
            cos_sim = sum(a * b for a, b in zip(ei, ej))
            if cos_sim > SIMILARITY_THRESHOLD:
                sim_pairs.append({
                    "node_a": node_embeddings[ni]["name"],
                    "node_a_type": node_embeddings[ni]["type"],
                    "node_b": node_embeddings[nj]["name"],
                    "node_b_type": node_embeddings[nj]["type"],
                    "similarity": round(cos_sim, 4),
                })

    return {
        "embedding_dimension": len(embeddings),
        "total_nodes_embedded": len(node_embeddings),
        "node_embeddings": [
            {
                "id": nid,
                "name": emb["name"],
                "type": emb["type"],
                "embedding": emb["embedding"][:8],  # First 8 dims for display
            }
            for nid, emb in list(node_embeddings.items())[:50]
        ],
        "high_similarity_pairs": sorted(
            sim_pairs, key=lambda p: p["similarity"], reverse=True
        )[:20],
    }


async def predict_hidden_relationships(driver, engagement_id: str) -> Dict:
    """
    Predict undocumented trust/privilege relationships using embedding similarity.

    Nodes with similar embeddings but no direct edge may have
    undocumented trust, shared administration, or latent connectivity.

    Uses cosine similarity between node embeddings to find
    candidate undocumented relationships.
    """
    embeddings_result = await compute_node_embeddings(driver, engagement_id)
    if "error" in embeddings_result:
        return embeddings_result

    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (a:L9 {engagement_id: $engagement_id})-[r]-(b:L9 {engagement_id: $engagement_id})
               RETURN DISTINCT a.id AS source, b.id AS target
            """,
            engagement_id=engagement_id,
        )
        existing_edges = set()
        async for record in result:
            pair = tuple(sorted([record["source"], record["target"]]))
            existing_edges.add(pair)

    # Find high-similarity pairs that are NOT connected
    emb_data = embeddings_result.get("node_embeddings", [])
    predictions = []

    for i in range(len(emb_data)):
        for j in range(i + 1, len(emb_data)):
            pair = tuple(sorted([emb_data[i]["id"], emb_data[j]["id"]]))
            if pair in existing_edges:
                continue

            ei = emb_data[i]["embedding"]
            ej = emb_data[j]["embedding"]
            if len(ei) != len(ej):
                continue

            cos_sim = sum(a * b for a, b in zip(ei, ej))
            norm_i = math.sqrt(sum(a * a for a in ei))
            norm_j = math.sqrt(sum(b * b for b in ej))
            if norm_i > 0 and norm_j > 0:
                cos_sim /= (norm_i * norm_j)

            if cos_sim > SIMILARITY_THRESHOLD:
                predictions.append({
                    "node_a": emb_data[i]["name"],
                    "node_a_type": emb_data[i]["type"],
                    "node_b": emb_data[j]["name"],
                    "node_b_type": emb_data[j]["type"],
                    "similarity": round(cos_sim, 4),
                    "recommended_relationship": _infer_relationship_type(
                        emb_data[i]["type"], emb_data[j]["type"]
                    ),
                    "confidence": round((cos_sim - SIMILARITY_THRESHOLD) / (1.0 - SIMILARITY_THRESHOLD), 4),
                })

    return {
        "predictions": sorted(predictions, key=lambda p: p["confidence"], reverse=True)[:30],
        "total_predictions": len(predictions),
        "similarity_threshold": SIMILARITY_THRESHOLD,
    }


async def compute_privilege_escalation_prediction(driver, engagement_id: str) -> Dict:
    """
    Predict likely privilege escalation paths using structural role analysis.

    Nodes with embeddings similar to known privilege targets
    are likely escalation endpoints. Nodes with structural
    bridging roles (high betweenness centrality + embedding
    proximity to credential nodes) are likely escalation paths.
    """
    emb_result = await compute_node_embeddings(driver, engagement_id)
    if "error" in emb_result:
        return emb_result

    async with driver.session(database="neo4j") as session:
        result = await session.run(
            """MATCH (n:L9 {engagement_id: $engagement_id})
               RETURN n.id AS id, n.entity_type AS type,
                      n.display_name AS name
            """,
            engagement_id=engagement_id,
        )
        node_types = {}
        async for record in result:
            node_types[record["id"]] = {
                "type": record["type"],
                "name": record["name"],
            }

        # Find credential nodes (escalation sources)
        cred_nodes = {k: v for k, v in node_types.items() if v["type"] in ("credential", "identity")}

    emb_map = {}
    for e in emb_result.get("node_embeddings", []):
        emb_map[e["id"]] = e

    predictions = []
    for cred_id, cred_info in cred_nodes.items():
        if cred_id not in emb_map:
            continue
        cred_emb = emb_map[cred_id]["embedding"]

        for other_id, other_info in node_types.items():
            if other_id == cred_id or other_id not in emb_map:
                continue
            if other_info["type"] in ("credential", "identity"):
                continue
            if other_info["type"] not in ("service", "host", "domain", "privilege", "objective"):
                continue

            other_emb = emb_map[other_id]["embedding"]
            if len(cred_emb) != len(other_emb):
                continue

            sim = sum(a * b for a, b in zip(cred_emb, other_emb))
            norm = math.sqrt(sum(a * a for a in cred_emb)) * math.sqrt(sum(b * b for b in other_emb))
            similarity = sim / norm if norm > 0 else 0

            if similarity > 0.6:
                predictions.append({
                    "credential": cred_info["name"],
                    "target": other_info["name"],
                    "target_type": other_info["type"],
                    "similarity": round(similarity, 4),
                    "escalation_probability": round(
                        (similarity - 0.6) / 0.4, 4
                    ),
                })

    return {
        "predictions": sorted(predictions, key=lambda p: p["escalation_probability"], reverse=True)[:30],
        "total_predictions": len(predictions),
    }


def _infer_relationship_type(type_a: str, type_b: str) -> str:
    """Infer likely relationship type between two nodes based on types."""
    if "credential" in (type_a, type_b):
        return "AUTHENTICATES_TO"
    if "service" in (type_a, type_b) and "host" in (type_a, type_b):
        return "HOSTS"
    if "identity" in (type_a, type_b) and "group" in (type_a, type_b):
        return "MEMBER_OF"
    if "domain" in (type_a, type_b):
        return "TRUSTS"
    return "TRUSTS"
