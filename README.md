# HAWK: Offensive Intelligence & Reconnaissance Engine

HAWK is a high-performance penetration testing intelligence engine designed to bridge the gap between raw data collection and actionable offensive operations. By combining graph-based asset modeling with probabilistic evidence fusion, HAWK allows security engineers to prioritize attack paths and automate the discovery of critical vulnerabilities at scale.

---

## 📖 Table of Contents

- [Core Philosophy](#core-philosophy)
- [Key Features](#key-features)
- [Technical Architecture](#technical-architecture)
  - [Graph Intelligence](#graph-intelligence)
  - [Probabilistic Scoring](#probabilistic-scoring)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Engine Setup](#engine-setup)
  - [Dashboard Setup](#dashboard-setup)
- [Usage Guide](#usage-guide)
- [Roadmap](#roadmap)
- [License](#license)

---

## 🏛 Core Philosophy

Modern reconnaissance often results in "data exhaustion"—a state where an operator is overwhelmed by thousands of unvalidated findings. HAWK was built to solve this by focusing on **Decision Compression**. 

The platform does not just run tools; it synthesizes observations into high-fidelity intelligence findings. It treats every finding as a hypothesis that must be proven or disproven through an evidence chain, reducing the noise-to-signal ratio significantly.

---

## ✨ Key Features

### 1. Graph-Based Asset Modeling
HAWK models infrastructure as a graph rather than a list. By analyzing the relationships between domains, IPs, and endpoints, the engine can identify:
- **Infrastructure Chokepoints**: Assets that, if compromised, expose the largest percentage of the network.
- **Trust Relationships**: Shared authentication systems or internal API dependencies.
- **Shadow Infrastructure**: Unlinked assets discovered through spectral clustering.

### 2. Probabilistic Evidence Fusion
Findings are not binary. HAWK uses Bayesian inference to weigh evidence from multiple sources:
- **Deterministic**: Direct matches (e.g., specific version headers).
- **Statistical**: Anomalies in response timing or payload behavior.
- **Heuristic**: Structural signatures and entropy analysis.

### 3. Stealthy Reconnaissance
Integrated with the **Scrapling** engine, HAWK performs high-speed crawling and enumeration using advanced stealth techniques to bypass common WAF and rate-limiting protections.

---

## ⚙️ Technical Architecture

### Graph Intelligence
The engine uses the **Graph Laplacian Spectrum** to partition the network into logical clusters. This allows HAWK to automatically segment a large target environment into functional areas (e.g., Auth services, Public APIs, Internal Infrastructure) without prior knowledge.

### Probabilistic Scoring
Confidence scores are calculated using the following Bayesian update model:

$$P(H|E) = \frac{P(E|H) \cdot P(H)}{P(E)}$$

Where:
- $H$ is the hypothesis (e.g., "Target is vulnerable to RCE").
- $E$ is the evidence (e.g., "Detected debug mode").
- $P(H|E)$ is the posterior probability used to prioritize the finding in the dashboard.

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** (for the analysis engine)
- **Node.js 20+** (for the dashboard)
- **pnpm** (recommended for package management)
- **Docker** (optional, for containerized deployment)

### Engine Setup
1. Clone the repository and navigate to the engine directory:
   ```bash
   git clone https://github.com/webspoilt/hawk-pentest-platform.git
   cd hawk-pentest-platform/server-py
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your HAWK_ENGINE_KEY
   ```
4. Start the FastAPI server:
   ```bash
   python main.py
   ```

### Dashboard Setup
1. Navigate to the root directory:
   ```bash
   pnpm install
   ```
2. Start the development server:
   ```bash
   pnpm run dev
   ```

---

## 🛠 Usage Guide

1. **Target Ingestion**: Add a new domain or IP range to the dashboard.
2. **Analysis Pipeline**: The engine will automatically initiate the multi-stage recon pipeline (DNS, Service Discovery, Crawling).
3. **Attack Path Review**: Navigate to the **Analysis** tab to view the top 3 attack paths prioritized by the engine.
4. **Evidence Audit**: Click on any finding to view its **Reasoning Trace** and the evidence chain powering the score.

---

## 🗺 Roadmap

- [ ] **Autonomous Execution**: Integrated exploit validation modules.
- [ ] **Memory Persistence**: Cross-mission intelligence retention.
- [ ] **Advanced Clustering**: Integration of spectral graph theory for shadow asset discovery.
- [ ] **Collaborative Mode**: Multi-operator support for large-scale team engagements.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
