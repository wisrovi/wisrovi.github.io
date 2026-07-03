# wisrovi.github.io (Wisrovi Legacy - Interactive Web RPG)

This repository hosts the official deployment of **Wisrovi Legacy**, an interactive Web RPG designed to showcase the custom software suite and Python engineering projects developed by **William Rodriguez (wisrovi)**.

The game is built using **Vanilla Javascript**, **HTML5**, and **WebGL/Three.js** for real-time 3D rendering.

---

## 🎮 Game Concept & Showcase

Instead of a traditional static resume, **Wisrovi Legacy** represents a dynamic portfolio where players can drive around a virtual university/science campus, complete missions, and learn about actual backend components:

*   **Custom Python ORMs & Libraries**: Each quest is themed around a library in the **wisrovi SUITE** (e.g., `wpipe`, `wsqlite`, `wredis`, `wkafka`, `wauth`).
*   **NeuralForge AI (train_service2) v2.0**: Specialized missions (Missions 7 & 8) introduce the player to the distributed MLOps training ecosystem, Optuna hyperparameter optimization, Redis priority queuing, and containerized YOLO pipelines.
*   **Educational Quests**: Interactions with servers, terminals, and NPCs output educational insights regarding microservices architecture, GIL bypassing, thread pools, and zero-trust cryptography.

---

## 🛠️ Tech Stack & Features

*   **3D Engine**: Three.js (WebGL renderer) for procedural terrain, zones, obstacles, and player vehicles.
*   **Modular UI**: Vanilla CSS and dynamic JavaScript panels for mission logging, resource trackers, achievement tracking, market upgrades, and interactive dialogues.
*   **State Management**: LocalStorage-based save & load mechanics (`F5` to save, `F9` to load).
*   **Micro-animations**: Smooth hover transitions, interactive prompts, and overlay panels for premium aesthetics.