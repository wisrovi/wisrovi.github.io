# Wisrovi Legacy 2.0 (Interactive Web RPG Portfolio)

<p align="center">
  <a href="https://wisrovi.github.io"><img src="https://img.shields.io/badge/Live_Game-Play_Now-00f0ff?style=for-the-badge&logo=three.js&logoColor=black" alt="Live Game" /></a>
  <a href="https://orcid.org/0009-0005-0710-1861"><img src="https://img.shields.io/badge/ORCID-0009--0005--0710--1861-A6CE39?style=for-the-badge&logo=orcid&logoColor=white" alt="ORCID" /></a>
  <a href="https://wisrovi.dev"><img src="https://img.shields.io/badge/Portal-wisrovi.dev-111827?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Portal" /></a>
  <a href="https://pypi.org/user/wisrovi/"><img src="https://img.shields.io/badge/PyPI-23_Packages-3775A9?style=for-the-badge&logo=pypi&logoColor=white" alt="PyPI" /></a>
  <a href="https://linkedin.com/in/wisrovi-rodriguez"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
</p>

This repository hosts the official deployment of **Wisrovi Legacy 2.0**, an interactive Web RPG designed to showcase the complete engineering and scientific research career of **William Steve Rodriguez Villamizar (wisrovi)**—from foundational electronic engineering and audio signal processing DSP (2010), through the 23-package PyPI Binary Universe and the NeuralForge AI distributed MLOps platform, to his doctoral research frontiers (26 CERN/Zenodo preprints).

```mermaid
flowchart LR
    A["Virtual Science Campus"] --> B["Python Suite (wpipe, wkafka, wredis)"]
    A --> C["FastMCP Constellation & NeuralForge AI"]
    A --> D["Doctoral Research (26 Preprints & LTL Verification)"]
    
    style A fill:#1e293b,color:#fff,stroke:#38bdf8,stroke-width:2px
    style B fill:#1e293b,color:#fff,stroke:#818cf8,stroke-width:2px
    style C fill:#1e293b,color:#fff,stroke:#34d399,stroke-width:2px
    style D fill:#1e293b,color:#fff,stroke:#f87171,stroke-width:2px
```

---

## 🎮 Game Concept & RPG Mechanics (Adapted from `cv-game-v1.1`)

* **22 Step-by-Step Educational Missions**: Spanning 6 chronological phases from Electronic Engineering (UDI 2010–2016) and `ProcessAudio`, through the 23 PyPI libraries, FastMCP agents, NeuralForge AI (the 22-step forensic worker lifecycle), to doctoral research (Causal Saliency Regularization, Conformal Prediction, Formal LTL Verification).
* **Dual Perk Skill Tree**: 18 unlockable skills providing tangible gameplay buffs (speed boosts, radar radius, magnetic coin attraction, XP multipliers, and obstacle immunity).
* **Multi-Gem Economy**: 5 colored gems (Blue, Green, Amber, Purple, Red) plus coins with dynamic spawning across the campus.
* **Magnetic Attraction (`magnetRange`)**: Automatically draws nearby coins and gems toward the player's vehicle in real time.
* **Non-Violent Collaborative Multiplayer**: Peer-to-peer presence synchronization via `BroadcastChannel` with player inspect cards and real-time coin gifting.

---

## ☁️ Storage Architecture (wticket Cloud Pattern)

* **Dual-Tier Hybrid Persistence**:
  * **Tier 1 (Local Zero-Latency)**: High-speed IndexedDB engine (`wisrovi_game_db`) mirroring `wticket`'s object store architecture (`player_profile`, `inventory`, `missions_state`, `unlocked_skills`, `sync_metadata`). Works 100% offline.
  * **Tier 2 (Cloud D1 Database)**: Background synchronization with Cloudflare Workers + D1 SQL database (`https://wticket-api.wisrovi-rodriguez.workers.dev`), allowing cross-device save synchronization and global leaderboards.

---

## 👨‍💻 About the Author

* **Author**: William Steve Rodriguez Villamizar (wisrovi)
* **Role**: Principal AI Engineer & AI Solutions Architect | Ph.D. Candidate in AI & Formal Verification
* **Publications**: 26 scientific preprints with official CERN Zenodo DOIs | [ORCID: 0009-0005-0710-1861](https://orcid.org/0009-0005-0710-1861)
* **Open Source Suite**: 23 official Python packages published on [PyPI](https://pypi.org/user/wisrovi/) (Binary Universe architecture with 6 FastMCP servers)
* **Portfolio**: [wisrovi.dev](https://wisrovi.dev) | [LinkedIn](https://linkedin.com/in/wisrovi-rodriguez)

---

## 👤 Autor & Afiliación Oficial

* **William Steve Rodriguez Villamizar (Wisrovi)**
* **Cargo:** Principal AI Engineer & Applied AI Solutions Architect | Scientific Researcher
* 📧 **Email:** [wisrovi.rodriguez@gmail.com](mailto:wisrovi.rodriguez@gmail.com) / [wisrovi@wisrovi.dev](mailto:wisrovi@wisrovi.dev)
* 🌐 **Portal Oficial:** [wisrovi.dev](https://wisrovi.dev)
* 💼 **LinkedIn:** [wisrovi-rodriguez](https://www.linkedin.com/in/wisrovi-rodriguez/)
* 🆔 **ORCID:** [0009-0005-0710-1861](https://orcid.org/0009-0005-0710-1861)
* 📦 **PyPI:** [pypi.org/user/wisrovi/](https://pypi.org/user/wisrovi/)
* 🐙 **GitHub:** [@wisrovi](https://github.com/wisrovi)
