# Mathematical Foundations of Lattice9

## Reference Manual — v9.0.0-RC1

---

## 1. Graph Model

### 1.1 Formal Definition

$$G_t = (V_t, E_t, W_t, C_t, T_t)$$

| Symbol | Domain | Description |
|---|---|---|
| $V_t$ | $\{v \mid \tau(v) \in \mathcal{T}\}$ | Typed entity set |
| $E_t$ | $V_t \times \mathcal{R} \times V_t$ | Directed typed edge set |
| $W_t$ | $E_t \to \mathbb{R}^4$ | Multi-dimensional edge weights |
| $C_t$ | $V_t \cup E_t \to [0,1]$ | Confidence distribution |
| $T_t$ | $V_t \cup E_t \to \mathbb{R}^2$ | Bitemporal validity intervals |

Entity type taxonomy:
$$\mathcal{T} = \{\text{host}, \text{service}, \text{credential}, \text{identity}, \text{finding}, \text{vulnerability}, \text{evidence}, \text{trust\\_zone}, \text{domain}, \text{objective}\}$$

Relationship type taxonomy:
$$\mathcal{R} = \{\text{TRUSTS}, \text{AUTHENTICATES\\_TO}, \text{HOSTS}, \text{EXPLOITS}, \text{PRIVILEGE\\_ESCALATION}, \text{HAS\\_FINDING}, \text{NETWORK\\_REACH}, \text{DEPENDS\\_ON}, \text{DATA\\_FLOW}, \text{ATTACK\\_PATH}, \text{RESOLVES\\_TO}, \text{OWNS}, \text{MEMBER\\_OF}\}$$

### 1.2 Attack Path

$$P_i = \langle v_0, e_1, v_1, e_2, \dots, e_k, v_k \rangle$$

Constraint: $\forall j \in [1,k]: \text{source}(e_j) = v_{j-1} \land \text{target}(e_j) = v_j \land \text{Pre}(v_{j-1}, e_j, v_j) = \text{true}$

Optimal path set:
$$\mathcal{P}^* = \arg\max_{P \in \mathcal{P}} \mathcal{U}(P)$$

---

## 2. Field Theory

### 2.1 Attack Pressure

$$\Phi(v) = \sum_{u \in V \setminus \{v\}} \text{Risk}(u) \cdot \frac{\kappa(u,v)^\beta}{d(u,v)^\alpha} \cdot (1 - \delta(v))$$

Parameters: $\alpha = 2.0$ (distance decay), $\beta = 1.5$ (trust amplification), $\delta \in [0, 0.3]$ (damping)

### 2.2 Risk Score

$$\text{Risk}(v) = C(v) \cdot S(v)$$

Where $S(v)$ is the severity score derived from entity type or CVSS.

### 2.3 Gravity Wells

$$\mathcal{W} = \{v \in V \mid \Phi(v) \geq \max_u \Phi(u) \cdot \gamma\}, \quad \gamma = 0.6$$

### 2.4 Field Gradient

$$\nabla\Phi(v) = \sum_{u \in N(v)} (\Phi(u) - \Phi(v)) \cdot \kappa(v,u) \cdot \hat{e}_{vu}$$

Gradient magnitude:
$$\|\nabla\Phi(v)\| = \sqrt{\sum_{u \in N(v)} ((\Phi(u) - \Phi(v)) \cdot \kappa(v,u))^2}$$

### 2.5 Privilege Density

$$\rho_{\text{priv}}(v) = \rho_{\text{base}}(\tau(v)) \cdot (1 + |\text{Reach}(v)| \cdot 0.1) \cdot C(v)$$

| Entity Type | $\rho_{\text{base}}$ |
|---|---|
| credential | 0.8 |
| privilege | 0.9 |
| identity | 0.6 |
| domain | 1.0 |
| service | 0.5 |
| host | 0.4 |
| endpoint | 0.2 |

---

## 3. Resistance Theory

### 3.1 Edge Resistance

$$R(e) = \frac{\text{DF}(e)}{\text{TP}(e)}$$

### 3.2 Traversal Probability

$$\text{TP}(e) = (1 - R_{\text{base}}(r)) \cdot C(e) \cdot \prod_{d \in D} (1 - \epsilon_d)$$

### 3.3 Path Resistance

$$R(P) = \sum_{e \in P} R(e)$$

### 3.4 Segmentation Conductivity

$$\text{Cond}(S_a, S_b) = \frac{|\{(u,v) \in E \mid u \in S_a, v \in S_b\}|}{\min(|S_a|, |S_b|)}$$

---

## 4. Wave Propagation

### 4.1 Continuous Model

$$\frac{\partial C}{\partial t} = D \nabla^2 C - \lambda C + S(x,t)$$

### 4.2 Discrete Update

$$C(t + \Delta t) = C(t) + \Delta t \left( -D \cdot L \cdot C(t) - \lambda \cdot C(t) + S(t) \right)$$

### 4.3 Graph Laplacian

$$L = D_g - A$$

Where $D_g$ is the degree matrix and $A$ is the weighted adjacency matrix.

### 4.4 Stability Condition (CFL)

$$\Delta t \leq \frac{1}{\max_i \deg(v_i)}$$

---

## 5. Game Theory

### 5.1 Minimax Value Function

$$V^*(s) = \max_{a \in \mathcal{A}(s)} \min_{d \in \mathcal{D}(s)} \mathbb{E}\left[ R(s,a,d) + \gamma V(s') \right]$$

### 5.2 Reward Function

$$R(s,a,d) = \text{PG}(\text{target}(a)) \cdot (1 - P_{\text{det}}(d)) - P_{\text{det}}(d) \cdot \text{DC} - \delta_{\text{contain}} \cdot \text{CC}$$

Where $P_{\text{det}}(d)$ is the detection probability of defender action $d$, DC is detection cost, and CC is containment cost.

### 5.3 Convergence Condition

Value iteration converges when $\max_s |V_{k+1}(s) - V_k(s)| < \epsilon$. For $\gamma = 0.9$, $\epsilon = 0.01$, convergence occurs within:

$$k_{\max} = \frac{\log \epsilon}{\log \gamma} \approx 44 \text{ iterations}$$

---

## 6. Economics

### 6.1 Path Utility

$$\mathcal{U}(P) = \frac{\sum_{v \in P} \text{PG}(v) \cdot \prod_{e \in P} \text{PP}(e)}{\text{DR}(P) \cdot \sum_{e \in P} \text{OC}(e)}$$

### 6.2 Aggregate Detection Risk

$$\text{DR}(P) = 1 - \left(1 - \frac{1}{|P|} \sum_{e \in P} \text{DR}(e)\right)^{|P|}$$

### 6.3 Campaign Marginal Utility

$$\text{MU}(k) = \frac{\sum_{i=1}^k \mathcal{U}(P_i)}{\sum_{i=1}^k \text{OC}(P_i)}$$

### 6.4 Stealth Rating

$$\text{SR}(P) = \frac{1}{|P|} \sum_{v \in P} \text{SA}(\tau(v))$$

---

## 7. Entropy

### 7.1 Path Space Entropy

$$H(G) = -\sum_{P \in \mathcal{P}} p(P) \log p(P), \quad p(P) = \frac{\mathcal{U}(P)}{\sum_{P' \in \mathcal{P}} \mathcal{U}(P')}$$

### 7.2 Normalized Entropy

$$H_{\text{norm}}(G) = \frac{H(G)}{\log |\mathcal{P}|}$$

### 7.3 Compromise Inevitability

$$\iota(v) = \min\left(1, \frac{\Phi(v)}{\max_u \Phi(u)} \cdot \frac{\text{PG}(v)}{\max_u \text{PG}(u)} \cdot 1.5\right)$$

---

## 8. Causal Inference

### 8.1 Bayesian Causal Network

$$P(\text{exposure} \mid \text{compromise}, \text{trust}, \text{privilege}) = \frac{P(\text{compromise}) \cdot P(\text{trust} \mid \text{compromise}) \cdot P(\text{privilege} \mid \text{trust})}{P(\text{exposure})}$$

### 8.2 Intervention Effect

$$\Delta\mathcal{U}(G \setminus \{e\}) = \sum_{P \ni e} \mathcal{U}(P)$$

### 8.3 Root Cause Score

$$\text{RC}(v) = \frac{|\{P \in \mathcal{P} \mid v \in P\}|}{|\mathcal{P}|} \cdot \frac{\sum_{P \ni v} \mathcal{U}(P)}{\sum_{P \in \mathcal{P}} \mathcal{U}(P)}$$

---

## 9. Attractor Dynamics

### 9.1 Attractor Strength

$$A(v) = \alpha \cdot \frac{\text{inflow}(v)}{\max \text{inflow}} + \beta \cdot \rho_{\text{priv}}(v) + \gamma \cdot \frac{\text{outflow}(v)}{\max \text{outflow}}$$

With $\alpha = 0.4$, $\beta = 0.35$, $\gamma = 0.25$.

### 9.2 Topological Instability

$$\sigma(v) = \left| \Phi(v) - \frac{1}{|N(v)|} \sum_{u \in N(v)} \Phi(u) \right|$$

High $\sigma$ indicates nodes at topology boundaries where small changes have large effects.

---

## 10. Information Geometry

### 10.1 Manifold Coordinates

$$M(v) = \langle C(v), \rho_{\text{priv}}(v), \text{conn}(v), \delta(v) \rangle$$

### 10.2 Riemannian Edge Weight

$$w(u,v) = w_{\text{risk}} \cdot |C(u) - C(v)| + w_{\text{priv}} \cdot |\rho_{\text{priv}}(u) - \rho_{\text{priv}}(v)| + w_{\text{conn}} \cdot |\text{conn}(u) - \text{conn}(v)| + w_{\text{def}} \cdot |\delta(u) - \delta(v)|$$

Default: $\langle w_{\text{risk}}, w_{\text{priv}}, w_{\text{conn}}, w_{\text{def}} \rangle = \langle 1.0, 1.5, 0.5, 2.0 \rangle$

### 10.3 Curvature (Ollivier-Ricci)

$$\kappa(u,v) = 1 - \frac{W(m_u, m_v)}{d(u,v)}$$

Approximated locally as:

$$\kappa(v) \approx \frac{\text{Var}_{u \in N(v)} C(u)}{\max_{w \in V} \text{Var}_{x \in N(w)} C(x)}$$

---

## 11. Graph Neural Embeddings

### 11.1 Second-Order Random Walk Bias

$$\pi_{vx} = \begin{cases} 1/p & \text{if } d(t, x) = 0 \\ 1 & \text{if } d(t, x) = 1 \\ 1/q & \text{if } d(t, x) = 2 \end{cases}$$

Where $t = c_{i-2}$ and $p=0.5$, $q=1.5$.

### 11.2 Embedding Extraction

Shifted Positive Pointwise Mutual Information:

$$\text{PPMI}(u,v) = \max\left(0, \log \frac{\text{cooc}(u,v) \cdot \sum_{x,y} \text{cooc}(x,y)}{\text{count}(u) \cdot \text{count}(v)}\right)$$

Embedding via truncated spectral decomposition of PPMI matrix (dimension $d = 32$).

### 11.3 Cosine Similarity

$$\text{sim}(u,v) = \frac{\text{emb}(u) \cdot \text{emb}(v)}{\|\text{emb}(u)\| \cdot \|\text{emb}(v)\|}$$

Hidden relationship threshold: $\text{sim}(u,v) > 0.8$ for undocumented relationship prediction.

---

## 12. Confidence Propagation

### 12.1 Bayesian Update

$$P(v \mid e_1, \dots, e_n) = \frac{P(v) \cdot \prod_i P(e_i \mid v)}{\prod_i P(e_i)}$$

### 12.2 Evidence Aggregation

$$C(v) = \text{sigmoid}\left(\sum_{e \in \text{support}(v)} w_e \cdot C(e) - \sum_{e \in \text{contradict}(v)} w_e \cdot C(e)\right)$$

### 12.3 Temporal Decay

$$C_t(v) = C_0(v) \cdot e^{-\lambda \cdot (t - t_{\text{last}})}$$
