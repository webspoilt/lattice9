# HAWK: Offensive Graph Intelligence Engine (v3.5)

> **Status**: Experimental Prototype. Built to solve data exhaustion in large-scale reconnaissance.

I got tired of running a dozen tools and ending up with 10,000 lines of unvalidated garbage. HAWK is my personal attempt to move from "running tools" to "reasoning about infrastructure." 

It treats reconnaissance as a graph problem and vulnerability discovery as a probabilistic evidence chain.

---

## 🛠 The Architecture

```ascii
       [ TARGET ]
           |
    +------+------+
    |             |
 [ DNS ]     [ SERVICE ] <--- Scrapling (Stealth)
    |             |
    +------+------+
           |
    [ ASSET GRAPH ] <--- Spectral Partitioning (Graph Laplacian)
           |
    [ EVIDENCE FUSION ] <--- Bayesian Update (P(H|E))
           |
    +------+------+
    |             |
 [ PATH A ]   [ PATH B ] <--- Decision Compression
    |             |
    +-------------+
           |
     [ OPERATOR ]
```

---

## 🧠 Why this exists

Modern recon is broken. You don't need more data; you need **Decision Compression**.

### 1. The Graph is the Source of Truth
I don't care about a list of subdomains. I care about how they are coupled. HAWK uses **Spectral Graph Theory** to partition the attack surface. By calculating the **Graph Laplacian Spectrum**, the engine identifies clusters of assets that share "trust gravity." 

If I find a vulnerability in a high-centrality node, I know the blast radius is massive.

### 2. Evidence > Findings
A finding is just a hypothesis. HAWK treats it that way. Every conclusion is reached via a **Bayesian Evidence Fusion** pipeline:

$$P(H|E) = \frac{P(E|H) \cdot P(H)}{P(E)}$$

If the headers say Laravel, but the timing anomalies don't match, the confidence score drops. HAWK only shows you what it can prove, or what it is mathematically confident about.

---

## ⚡️ Key Modules

- **Graph Engine**: Uses `networkx` to model asset relationships. Identifies "chokepoint" assets.
- **Probabilistic Core**: A custom `AnalysisEngine` that propagates uncertainty through finding chains.
- **Stealth Recon**: Wraps `Scrapling` for high-speed, WAF-resistant crawling.
- **Dashboard**: A React/Vite frontend for "Mission Control" visualization.

---

## 🚀 Running the Prototype

This is an experimental tool. It expects you to know what you're doing.

### Engine Setup
```bash
cd server-py
pip install -r requirements.txt
python main.py
```

### Dashboard Setup
```bash
pnpm install
pnpm run dev
```

---

## ⚠️ Caveats

1. **Experimental**: This is my research prototype. The API might change. The math might be tweaked.
2. **Resource Intensive**: Large graph analysis (`nx.laplacian_spectrum`) can be heavy on RAM for 10k+ nodes.
3. **Offensive Nature**: This tool is designed for authorized testing. Don't be a jerk.

---

## 🗺 Roadmap (What I'm building next)

- [ ] **Autonomous Exploit Validation**: Gating execution behind the reasoning engine.
- [ ] **Episodic Memory**: Saving graph states across sessions.
- [ ] **Custom Scoring Modules**: Plug-and-play Bayesian models for specific tech stacks.

---

Built by a single founder for operators who care about ground truth.

**[LICENSE](LICENSE)** (MIT) | **[CONTRIBUTING](CONTRIBUTING.md)**
