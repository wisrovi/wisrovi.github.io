// ============================================================================
// Wisrovi's Interactive 2D CV & Research Universe - Main Game Engine
// Author: William Steve Rodriguez Villamizar (wisrovi)
// Pure 2D Top-Down Architecture (Zero Three.js, Zero WebGL)
// ============================================================================

import {
    initGameDB,
    getFromDB,
    saveToDB,
    STORE_PLAYER,
    STORE_MISSIONS,
    STORE_SKILLS,
    getInitialPlayerData,
    syncStateToCloud,
    FALLBACK_MISSIONS,
    FALLBACK_SKILLS
} from './db/gameDB.js';

import { World2D, WORLD_WIDTH, WORLD_HEIGHT } from './game/worldGenerator.js?v=20260912';
import { Player2D, PLAYER_WIDTH, PLAYER_HEIGHT } from './game/playerVehicle.js?v=20260912';
import { UIManager2D } from './ui/uiManager.js?v=20260912';
import { NetworkManager } from './network/networkManager.js?v=20260912';

class GameEngine2D {
    constructor() {
        this.world = null;
        this.player = null;
        this.ui = null;
        this.network = null;
        this.missions = [];
        this.skills = [];

        this.lastTime = performance.now();
        this.isRunning = false;
        this.domElementsMap = new Map(); // objectId -> HTMLElement
        this.peerElementsMap = new Map(); // peerId -> HTMLElement
        this.playerElem = null;

        this.cameraX = 0;
        this.cameraY = 0;
    }

    async start() {
        console.log("🎮 [Wisrovi 2D Universe] Starting 2D Top-Down Engine...");

        // 1. Initialize IndexedDB & Player Save
        await initGameDB();
        let savedProfile = await getFromDB(STORE_PLAYER, 'active_player');
        if (!savedProfile) {
            savedProfile = getInitialPlayerData();
            await saveToDB(STORE_PLAYER, savedProfile);
        }

        // 2. Load Missions & Skills with status
        this.missions = FALLBACK_MISSIONS.map((m, idx) => ({
            ...m,
            status: idx === 0 ? 'disponible' : 'bloqueada',
            paso_actual: 0,
            pasos: [
                {
                    descripcion: `Habla con Ada o dirígete a ${m.zona || m.titulo}.`,
                    tipo: 'interactuar',
                    objetoId: 'npc_ada'
                },
                {
                    descripcion: `Interactúa con ${m.objeto_interaccion || 'el terminal'} en ${m.fase}.`,
                    tipo: 'interactuar',
                    objetoId: m.objeto_interaccion
                }
            ]
        }));
        this.skills = FALLBACK_SKILLS;

        // 3. Initialize 2D World
        this.world = new World2D();

        // 4. Initialize 2D Player
        this.player = new Player2D(this.world);
        this.hydratePlayer(savedProfile);

        // 5. Initialize 2D UI Manager
        this.ui = new UIManager2D(
            this.player,
            this.world,
            this.missions,
            this.skills,
            () => this.saveGameState()
        );

        // 6. Initialize P2P Broadcast Network
        this.network = new NetworkManager(
            this.player,
            (peerId, peerData) => this.handlePeerUpdate(peerId, peerData),
            (eventType, data) => this.handlePeerEvent(eventType, data)
        );
        this.network.init();
        this.ui.setNetwork(this.network);

        // 7. Mount Static World DOM Objects
        this.mountWorldDOM();

        // 8. Bind Click & Interaction Inputs
        this.bindInteractionInputs();

        // 9. Start Main Animation Loop
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));

        // 10. Periodic Auto-Save every 6 seconds
        setInterval(() => this.saveGameState(), 6000);

        this.ui.notify("¡Bienvenido al Universo 2D de Wisrovi! Usa WASD o flechas para moverte.");
        console.log("🚀 [Wisrovi 2D Universe] Running cleanly at 60 FPS!");
    }

    hydratePlayer(profile) {
        if (!profile) return;
        this.player.level = profile.level || 1;
        this.player.xp = profile.xp || 0;
        this.player.coins = profile.coins || 50;
        if (profile.gems) this.player.gems = { ...this.player.gems, ...profile.gems };
        if (profile.skills && Array.isArray(profile.skills)) {
            this.player.unlockedSkills = profile.skills;
        }
    }

    async saveGameState() {
        const payload = {
            id: 'active_player',
            name: this.player.name,
            level: this.player.level,
            xp: this.player.xp,
            coins: this.player.coins,
            gems: this.player.gems,
            skills: this.player.unlockedSkills,
            upgrades: this.player.upgrades,
            lastSaved: Date.now()
        };
        await saveToDB(STORE_PLAYER, payload);
        syncStateToCloud(payload);
    }

    mountWorldDOM() {
        const worldContainer = document.getElementById('gameWorld');
        if (!worldContainer) return;
        worldContainer.style.width = `${WORLD_WIDTH}px`;
        worldContainer.style.height = `${WORLD_HEIGHT}px`;
        worldContainer.innerHTML = '';

        // Render all game objects as styled DOM elements
        this.world.gameObjects.forEach(obj => {
            const el = document.createElement('div');
            el.id = `go_${obj.id}`;
            el.className = `game-object ${obj.type} ${obj.collectibleType || ''}`;
            el.style.left = `${obj.x}px`;
            el.style.top = `${obj.y}px`;
            el.style.width = `${obj.width}px`;
            el.style.height = `${obj.height}px`;

            if (obj.color && !obj.collectibleType) {
                el.style.backgroundColor = obj.color;
            }

            if (obj.gemColor) {
                el.style.backgroundColor = obj.gemColor;
            }

            // Name label for buildings and NPCs
            if (obj.name) {
                const label = document.createElement('div');
                label.className = 'object-name';
                label.textContent = obj.name;
                el.appendChild(label);
            }

            // Door element for buildings
            if (obj.type === 'building' && obj.door) {
                const door = document.createElement('div');
                door.className = 'door';
                door.style.left = `${obj.door.x}px`;
                door.style.top = `${obj.door.y}px`;
                door.style.width = `${obj.door.width}px`;
                door.style.height = `${obj.door.height}px`;
                el.appendChild(door);
            }

            worldContainer.appendChild(el);
            this.domElementsMap.set(obj.id, el);
        });

        // Mount Player Element
        const pEl = document.createElement('div');
        pEl.id = 'playerEntity';
        pEl.className = 'player';
        pEl.style.width = `${PLAYER_WIDTH}px`;
        pEl.style.height = `${PLAYER_HEIGHT}px`;
        pEl.innerHTML = `
            <div class="player-body">
                <div class="player-cockpit"></div>
            </div>
        `;
        worldContainer.appendChild(pEl);
        this.playerElem = pEl;
    }

    bindInteractionInputs() {
        window.addEventListener('keydown', (e) => {
            if (['e', 'enter', ' '].includes(e.key.toLowerCase())) {
                this.triggerInteraction();
            }
        });

        // Click on viewport / object to interact
        const viewport = document.getElementById('gameViewport');
        if (viewport) {
            viewport.addEventListener('click', (e) => {
                if (e.target.closest('.modal-overlay') || e.target.closest('.top-bar') || e.target.closest('.hud-box') || e.target.closest('.hud-button')) {
                    return;
                }
                this.triggerInteraction();
            });
        }
    }

    triggerInteraction() {
        if (this.ui.isModalOpen()) return;

        const target = this.player.interactionTarget;
        if (!target) return;

        // 1. NPC Ada Interaction
        if (target.id === 'npc_ada') {
            const activeM = this.missions.find(m => m.status === 'disponible');
            this.ui.openDialogue(
                "Ada, la Guía Científica",
                `¡Hola explorador! Soy Ada. Estás en la plataforma de investigación de William Rodriguez. Explora el campus, completa los 22 hitos y recolecta gemas para desbloquear el árbol de habilidades.`,
                "Objetivo actual: " + (activeM ? activeM.titulo : "¡Explora libremente!")
            );
            return;
        }

        // 2. Chip The Merchant
        if (target.id === 'npc_vendor') {
            this.ui.openShop();
            return;
        }

        // 3. Charles The Core Engineer
        if (target.id === 'npc_charles') {
            this.ui.openDialogue(
                "Charles, el Ingeniero Core",
                "Aquí en los nodos de cómputo construimos la suite de 23 paquetes en PyPI: wpipe, wkafka, wredis, wsqlite y wcontainer. ¡Cada módulo garantiza escalabilidad sin fallos!",
                "Visita el Núcleo WPipe o la Torre Kafka."
            );
            return;
        }

        // 4. Vincent The Visionary
        if (target.id === 'npc_vincent') {
            this.ui.openDialogue(
                "Vincent, el Visionario AI",
                "Las 26 publicaciones científicas en CERN/Zenodo y el Máster en IA demuestran que la visión artificial explicable (XAI) y la verificación formal son el futuro de la ingeniería.",
                "Consulta los 26 preprints en la Cúpula CERN."
            );
            return;
        }

        // 5. Mission Terminal Objects
        if (target.missionId) {
            const mission = this.missions.find(m => m.id === target.missionId);
            if (mission) {
                if (mission.status === 'disponible') {
                    // Complete mission
                    mission.status = 'completada';
                    this.player.addXP(mission.recompensa_xp || 100, (msg) => this.ui.notify(msg));
                    this.player.addCoins(mission.recompensa_monedas || 150);
                    if (mission.recompensa_gemas) this.player.addGems(mission.recompensa_gemas);

                    // Unlock next mission
                    const nextM = this.missions.find(m => m.status === 'bloqueada');
                    if (nextM) nextM.status = 'disponible';

                    this.ui.openDialogue(
                        `¡Misión Cumplida! #${mission.id} ${mission.titulo}`,
                        `${mission.dialogo_npc || mission.descripcion}\n\nRecompensas: +${mission.recompensa_xp} XP, +${mission.recompensa_monedas} Monedas.`,
                        nextM ? `Siguiente misión desbloqueada: #${nextM.id} ${nextM.titulo}` : "¡Completaste toda la trayectoria científica!"
                    );
                    this.ui.updateHUD();
                    this.saveGameState();
                } else if (mission.status === 'completada') {
                    this.ui.openDialogue(
                        `Terminal Registrado #${mission.id}`,
                        `Este hito científico ya fue superado con éxito.\n\n${mission.descripcion}`,
                        `Estado: COMPLETADA ✓`
                    );
                } else {
                    this.ui.openDialogue(
                        `Terminal Bloqueado #${mission.id}`,
                        `Debes completar las misiones previas antes de poder certificar este hito doctoral.`,
                        `Completa la misión activa primero.`
                    );
                }
            }
            return;
        }

        // 6. Generic Building / Object info
        this.ui.openDialogue(
            target.name || "Estructura de Campus",
            `Has llegado a ${target.name || 'este edificio'}. Representa una pieza fundamental de la arquitectura de sistemas distribuidos y MLOps de William Rodriguez.`
        );
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        const isPaused = this.ui.isModalOpen();

        // 1. Update Player Physics, Collision & Movement
        this.player.update(deltaTime, isPaused);

        // 2. Check Collectible Overlaps & Suction
        this.checkCollectiblePickups();

        // 3. Render Positions & Camera
        this.renderWorld();

        // 4. Update HUD Components
        this.ui.updateHUD();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    checkCollectiblePickups() {
        const pLeft = this.player.x;
        const pRight = this.player.x + this.player.width;
        const pTop = this.player.y;
        const pBottom = this.player.y + this.player.height;

        const remaining = [];
        for (const obj of this.world.gameObjects) {
            if (!obj.collectibleType) {
                remaining.push(obj);
                continue;
            }

            // AABB Collision check
            const overlaps = (
                pLeft < obj.x + obj.width &&
                pRight > obj.x &&
                pTop < obj.y + obj.height &&
                pBottom > obj.y
            );

            if (overlaps) {
                // Collect
                this.player.collectItem(obj, (msg) => this.ui.notify(msg));
                const el = this.domElementsMap.get(obj.id);
                if (el && el.parentNode) el.parentNode.removeChild(el);
                this.domElementsMap.delete(obj.id);
            } else {
                remaining.push(obj);
                // Update DOM position if it was pulled by magnet
                const el = this.domElementsMap.get(obj.id);
                if (el) {
                    el.style.left = `${obj.x}px`;
                    el.style.top = `${obj.y}px`;
                }
            }
        }
        this.world.gameObjects = remaining;
    }

    renderWorld() {
        const viewport = document.getElementById('gameViewport');
        const worldContainer = document.getElementById('gameWorld');
        if (!viewport || !worldContainer) return;

        const viewportWidth = viewport.clientWidth || 1200;
        const viewportHeight = viewport.clientHeight || 800;

        // Center camera on player, clamped to world boundaries
        const targetCamX = (this.player.x + PLAYER_WIDTH / 2) - viewportWidth / 2;
        const targetCamY = (this.player.y + PLAYER_HEIGHT / 2) - viewportHeight / 2;

        this.cameraX = Math.max(0, Math.min(targetCamX, WORLD_WIDTH - viewportWidth));
        this.cameraY = Math.max(0, Math.min(targetCamY, WORLD_HEIGHT - viewportHeight));

        worldContainer.style.transform = `translate(${-this.cameraX}px, ${-this.cameraY}px)`;

        // Update player DOM element
        if (this.playerElem) {
            this.playerElem.style.left = `${this.player.x}px`;
            this.playerElem.style.top = `${this.player.y}px`;

            if (this.player.hasHeartToXPAmulet) {
                this.playerElem.classList.add('player-with-amulet');
            }
        }

        // Show/Hide interaction prompt over target
        const target = this.player.interactionTarget;
        const existingPrompt = document.getElementById('worldInteractionPrompt');

        if (target && !this.ui.isModalOpen()) {
            if (!existingPrompt) {
                const prompt = document.createElement('div');
                prompt.id = 'worldInteractionPrompt';
                prompt.className = 'interaction-prompt';
                prompt.innerHTML = `Presiona <b>E</b> para interactuar con <b>${target.name || 'Terminal'}</b>`;
                worldContainer.appendChild(prompt);
            } else {
                existingPrompt.innerHTML = `Presiona <b>E</b> para interactuar con <b>${target.name || 'Terminal'}</b>`;
                existingPrompt.style.left = `${target.x + target.width / 2 - 100}px`;
                existingPrompt.style.top = `${target.y - 45}px`;
                existingPrompt.style.display = 'flex';
            }
        } else if (existingPrompt) {
            existingPrompt.style.display = 'none';
        }
    }

    handlePeerUpdate(peerId, peerData) {
        const worldContainer = document.getElementById('gameWorld');
        if (!worldContainer) return;

        let peerElem = this.peerElementsMap.get(peerId);
        if (!peerElem) {
            peerElem = document.createElement('div');
            peerElem.className = 'player peer';
            peerElem.style.width = `${PLAYER_WIDTH}px`;
            peerElem.style.height = `${PLAYER_HEIGHT}px`;
            peerElem.innerHTML = `
                <div class="player-body" style="background-color: #e67e22;">
                    <div class="player-cockpit"></div>
                </div>
                <div class="object-name">${peerData.name || 'Explorador'}</div>
            `;
            worldContainer.appendChild(peerElem);
            this.peerElementsMap.set(peerId, peerElem);
        }

        peerElem.style.left = `${peerData.x}px`;
        peerElem.style.top = `${peerData.y}px`;
    }

    handlePeerEvent(type, data) {
        if (type === 'peer_join') {
            this.ui.notify(`¡${data.name || 'Otro explorador'} se ha unido al campus!`);
        } else if (type === 'peer_leave') {
            const peerElem = this.peerElementsMap.get(data.peerId);
            if (peerElem && peerElem.parentNode) peerElem.parentNode.removeChild(peerElem);
            this.peerElementsMap.delete(data.peerId);
        }
    }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameEngine2D();
    window.gameEngine = game;
    game.start().catch(err => {
        console.error("[Wisrovi 2D Engine] Fatal start error:", err);
    });
});
