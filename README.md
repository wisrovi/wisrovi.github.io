# Wisrovi Legacy (Interactive Web RPG Portfolio)

<p align="center">
  <a href="https://wisrovi.github.io"><img src="https://img.shields.io/badge/Live_Game-Play_Now-00f0ff?style=for-the-badge&logo=three.js&logoColor=black" alt="Live Game" /></a>
  <a href="https://orcid.org/0009-0005-0710-1861"><img src="https://img.shields.io/badge/ORCID-0009--0005--0710--1861-A6CE39?style=for-the-badge&logo=orcid&logoColor=white" alt="ORCID" /></a>
  <a href="https://wisrovi.dev"><img src="https://img.shields.io/badge/Portal-wisrovi.dev-111827?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Portal" /></a>
  <a href="https://pypi.org/user/wisrovi/"><img src="https://img.shields.io/badge/PyPI-26+_Packages-3775A9?style=for-the-badge&logo=pypi&logoColor=white" alt="PyPI" /></a>
  <a href="https://linkedin.com/in/wisrovi-rodriguez"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
</p>

This repository hosts the official deployment of **Wisrovi Legacy**, an interactive Web RPG designed to showcase the scientific research publications, custom software suite, and distributed MLOps architectures developed by **William Steve Rodriguez Villamizar (wisrovi)**.

The game is built purely using **Vanilla JavaScript**, **HTML5**, and **WebGL/Three.js** for real-time procedural 3D rendering—no heavy game engines or bundlers required.

```mermaid
flowchart LR
    A["Virtual Science Campus"] --> B["Python Suite Quests (wpipe, wredis, wauth)"]
    A --> C["NeuralForge AI Operations (Missions 7 & 8)"]
    A --> D["Scientific Research Hub (26 Preprints & DOIs)"]
    
    style A fill:#1e293b,color:#fff,stroke:#38bdf8,stroke-width:2px
    style B fill:#1e293b,color:#fff,stroke:#818cf8,stroke-width:2px
    style C fill:#1e293b,color:#fff,stroke:#34d399,stroke-width:2px
    style D fill:#1e293b,color:#fff,stroke:#f87171,stroke-width:2px
```

---

## 🎮 Game Concept & Interactive Showcase

Instead of a traditional static resume, **Wisrovi Legacy** represents an interactive simulation where players drive around a virtual university/science campus, complete quests, and learn about real-world software components:

* **Custom Python ORMs & Libraries (The wisrovi SUITE)**: Quests are themed around real libraries authored by William Rodriguez (e.g., `wpipe`, `wsqlite`, `wredis`, `wkafka`, `wauth`).
* **NeuralForge AI (Distributed YOLO Cluster)**: Dedicated missions (Missions 7 & 8) introduce the distributed training ecosystem, Optuna evolutionary hyperparameter optimization, strict Redis priority queues (`private > high > medium > low`), and ephemeral Docker worker execution.
* **Scientific Research Hub**: Explores research foundations covering quantitative Explainable AI (Grad-CAM/Eigen-CAM fidelity), causal saliency regularization, conformal prediction, and formal verification with Linear Temporal Logic (LTL).
* **Educational Quests**: Direct interactions with server racks, terminals, and NPCs provide concrete insights into microservices architecture, GIL bypassing, thread pools, and zero-trust cryptography.

---

## 🛠️ Technical Architecture & Features

* **3D Procedural Engine**: Three.js WebGL renderer with canvas-generated procedural building facade textures, dynamic asphalt lanes, ramps, and vehicle physics (acceleration, drifting, collisions).
* **Modular Glassmorphic UI**: Vanilla CSS & JavaScript panels for real-time mission tracking, resource balances (coins, multi-color gems, XP), upgrade marketplace, and dialogues.
* **State Persistence**: LocalStorage-based save & load mechanics (`F5` to save state, `F9` to load state).
* **Zero Dependencies**: Fast startup with zero bundling pipeline; runs directly on GitHub Pages via ES6 modules.

---

## 👨‍💻 About the Author

* **Author**: William Steve Rodriguez Villamizar (wisrovi)
* **Role**: Principal AI Engineer & Applied AI Solutions Architect | Scientific Researcher
* **Publications**: 26 scientific preprints with official CERN Zenodo DOIs | [ORCID: 0009-0005-0710-1861](https://orcid.org/0009-0005-0710-1861)
* **Open Source Suite**: 26+ Python packages published on [PyPI](https://pypi.org/user/wisrovi/)
* **Portfolio**: [wisrovi.dev](https://wisrovi.dev) | [LinkedIn](https://linkedin.com/in/wisrovi-rodriguez)