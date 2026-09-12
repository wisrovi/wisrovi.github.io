// ============================================================================
// Wisrovi's Interactive 2D CV & Research Universe - 2D UI Manager
// Author: William Steve Rodriguez Villamizar (wisrovi)
// Pure 2D Top-Down Architecture (Zero Three.js, Zero WebGL)
// Matches visual aesthetics, HUD, Minimap, Mission Arrow, and Modals of cv-game-v1.1
// ============================================================================

import { INITIAL_XP_TO_LEVEL_UP, PLAYER_WIDTH, PLAYER_HEIGHT } from '../game/playerVehicle.js';
import {
    GEM_SELL_VALUE,
    COIN_TO_XP_RATE,
    XP_PER_COIN_TRADE,
    SHOP_ITEMS,
    WORLD_WIDTH,
    WORLD_HEIGHT,
    MINIMAP_SIZE
} from '../game/worldGenerator.js';

export class UIManager2D {
    constructor(player, world, missions, skills, onAutoSave) {
        this.player = player;
        this.world = world;
        this.missions = missions;
        this.skills = skills;
        this.onAutoSave = onAutoSave;
        this.network = null;

        this.currentMissionIndex = 0;
        this.activeModal = null;
        this.currentActiveInteractable = null;
        this.showHud = true;
        this.menuView = 'main'; // 'main' | 'missions' | 'skills' | 'map'
        this.notificationTimeout = null;

        // Mount all DOM layout into #root
        this.mountDOM();
        this.bindEvents();
    }

    setNetwork(network) {
        this.network = network;
    }

    mountDOM() {
        const root = document.getElementById('root');
        if (!root) return;

        root.innerHTML = `
        <div class="app-container">
            <!-- 2D Viewport -->
            <div class="game-viewport" id="gameViewport">
                <div class="background-animated"></div>
                <div class="particles">
                    ${Array.from({ length: 12 }).map((_, i) => `
                        <div class="particle" style="left: ${(i * 8.3).toFixed(1)}%; top: ${((i * 17) % 90).toFixed(1)}%; animation-delay: ${(i * 1.5).toFixed(1)}s;">
                            <div class="particle-content">
                                <div class="particle-body"></div>
                                <div class="particle-head"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- 2D Game World Container where entities live -->
                <div class="game-world" id="gameWorld"></div>
                <div class="vignette"></div>
            </div>

            <!-- Top Glassmorphic Bar -->
            <div class="top-bar">
                <div class="game-title">
                    <i class="fas fa-microchip" style="color: var(--xp-color); margin-right: 8px;"></i>Wisrovi's Interactive CV
                </div>
                <div class="top-bar-right">
                    <div class="player-stats-top">
                        <div class="player-level" id="hudLevel">Nv. 1</div>
                        <div class="xp-bar-container-top" id="hudXpContainer" title="0 / 100 XP">
                            <div class="xp-bar-top">
                                <div class="xp-fill-top" id="hudXpFill" style="width: 0%;"></div>
                            </div>
                        </div>
                        <div class="currency-top">
                            <div class="coin-display" title="Monedas">
                                <i class="fas fa-coins" style="color: #FFD700; margin-right: 5px;"></i>
                                <span id="hudCoins">50</span>
                            </div>
                            <div class="gem-display" style="display: flex; gap: 8px;">
                                <span title="Gemas Azules"><i class="fas fa-gem" style="color: #00aaff;"></i> <span id="hudGemBlue">0</span></span>
                                <span title="Gemas Verdes"><i class="fas fa-gem" style="color: #2ecc71;"></i> <span id="hudGemGreen">0</span></span>
                                <span title="Gemas Púrpuras"><i class="fas fa-gem" style="color: #9b59b6;"></i> <span id="hudGemPurple">0</span></span>
                                <span title="Gemas Ámbar"><i class="fas fa-gem" style="color: #f39c12;"></i> <span id="hudGemAmber">0</span></span>
                                <span title="Gemas Rojas"><i class="fas fa-gem" style="color: #e74c3c;"></i> <span id="hudGemRed">0</span></span>
                            </div>
                        </div>
                    </div>
                    <button class="hud-button" id="btnOpenMenu" aria-label="Abrir menú" title="Menú del Juego">
                        <i class="fas fa-gear"></i>
                    </button>
                </div>
            </div>

            <!-- UI Columns Overlay -->
            <div class="ui-container">
                <div class="hud-column left"></div>
                <div class="hud-column right" id="hudRightCol">
                    <!-- Active Mission Tracker -->
                    <div class="mission-tracker hud-box" id="missionTrackerBox">
                        <h3 id="trackerTitle">Cargando Misión...</h3>
                        <p id="trackerDesc">Explora el campus de investigación.</p>
                    </div>

                    <!-- Circular Minimap -->
                    <div class="minimap-container" id="minimapContainer">
                        <div class="minimap-background" id="minimapBackground">
                            <!-- Minimap dots injected here -->
                        </div>
                        <div class="minimap-dot player" id="minimapPlayerDot" style="left: 50%; top: 50%;"></div>
                    </div>
                </div>
            </div>

            <!-- Rotating Mission Guidance Arrow -->
            <div class="mission-arrow-container" id="missionArrowContainer">
                <div class="mission-arrow" id="missionArrowIcon">➤</div>
            </div>

            <!-- Controls Overlay Hint -->
            <div class="controls-overlay" id="controlsOverlay">
                <div class="hud-box">
                    <h4>Controles</h4>
                    <p class="controls-text">
                        <b>WASD / Flechas:</b> Mover<br/>
                        <b>Espacio / E:</b> Interactuar<br/>
                        <b>I:</b> Inventario / <b>M:</b> Menú / <b>B:</b> Mapa<br/>
                        <b>Esc:</b> Cerrar Ventanas
                    </p>
                    <p class="controls-text hint">Pulsa <b>'H'</b> para alternar la ayuda.</p>
                </div>
            </div>

            <!-- Toast / Notification Banner -->
            <div class="notification" id="notificationBanner" style="display: none;"></div>

            <!-- Dialogue Modal -->
            <div class="dialogue-overlay" id="dialogueModal" style="display: none;">
                <div class="dialogue-box">
                    <h3 id="dialogueNpcName">Ada, la Guía Científica</h3>
                    <p id="dialogueTextContent">¡Bienvenido al universo de investigación!</p>
                    <small id="dialogueSubText">Haz clic o pulsa 'Espacio' / 'Esc' para cerrar</small>
                </div>
            </div>

            <!-- Shop Modal (Chip the Merchant) -->
            <div class="modal-overlay" id="shopModal" style="display: none;">
                <div class="modal-box shop">
                    <div class="shop-container">
                        <h3><i class="fas fa-store"></i> Mercado de Chip</h3>
                        
                        <div class="shop-section">
                            <h4>Mejoras de Nave</h4>
                            <div class="shop-grid" id="shopItemsGrid"></div>
                        </div>

                        <div class="shop-section">
                            <h4>Mercado de Gemas</h4>
                            <div class="sell-gems-grid" id="sellGemsGrid"></div>
                        </div>

                        <div class="shop-section">
                            <h4>Entrenamiento & Telemetría</h4>
                            <div class="sell-gems-grid">
                                <div class="sell-gem-card">
                                    <p style="display: flex; align-items: center; gap: 8px;">
                                        <i class="fas fa-star" style="color: var(--xp-color);"></i>
                                        <span>Comprar <b>${XP_PER_COIN_TRADE} XP</b></span>
                                    </p>
                                    <button id="btnBuyXP">
                                        Coste: ${COIN_TO_XP_RATE} <i class="fas fa-coins" style="color: #FFD700; margin-left: 3px;"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button id="btnCloseShop" style="margin-top: 15px;">Cerrar Tienda</button>
                </div>
            </div>

            <!-- Inventory Modal -->
            <div class="modal-overlay" id="inventoryModal" style="display: none;">
                <div class="modal-box">
                    <h3><i class="fas fa-box-open"></i> Inventario</h3>
                    <div class="item-list" id="inventoryList"></div>
                    <button id="btnCloseInventory" style="margin-top: 20px;">Cerrar</button>
                </div>
            </div>

            <!-- Menu Modal (Missions, Skills, Map, Peers, Save) -->
            <div class="modal-overlay" id="menuModal" style="display: none;">
                <div class="modal-box wide">
                    <div id="menuMainView">
                        <h3><i class="fas fa-bars"></i> Menú del Juego</h3>
                        <div class="menu-options">
                            <button id="btnMenuMissions"><i class="fas fa-list-check"></i> Lista de Misiones</button>
                            <button id="btnMenuSkills"><i class="fas fa-diagram-project"></i> Árbol de Habilidades</button>
                            <button id="btnMenuMap"><i class="fas fa-map-location-dot"></i> Mapa del Mundo</button>
                            <button id="btnMenuPeers"><i class="fas fa-users"></i> Exploradores en Red</button>
                            <button id="btnMenuSave"><i class="fas fa-floppy-disk"></i> Guardar Progreso</button>
                        </div>
                        <p class="game-version">Wisrovi 2D Universe v1.2.1 • Pure Vanilla RPG</p>
                        <button id="btnCloseMenu" style="margin-top: 15px;">Cerrar</button>
                    </div>

                    <!-- Sub-view: Missions Roadmap -->
                    <div id="menuMissionsView" style="display: none;">
                        <h3><i class="fas fa-award"></i> 22 Hitos de Carrera & Doctorales</h3>
                        <div class="mission-list item-list" id="menuMissionsList"></div>
                        <button id="btnBackToMainMenuFromMissions" style="margin-top: 20px;">Volver al Menú</button>
                    </div>

                    <!-- Sub-view: Skill Tree -->
                    <div id="menuSkillsView" style="display: none;">
                        <h3><i class="fas fa-brain"></i> Árbol de Habilidades Especializadas</h3>
                        <div class="skill-tree-container" id="menuSkillsGrid"></div>
                        <button id="btnBackToMainMenuFromSkills" style="margin-top: 20px;">Volver al Menú</button>
                    </div>

                    <!-- Sub-view: World Map -->
                    <div id="menuMapView" style="display: none;">
                        <div class="world-map-wrapper" id="worldMapWrapper"></div>
                        <button id="btnBackToMainMenuFromMap" style="margin-top: 20px;">Volver al Menú</button>
                    </div>

                    <!-- Sub-view: Connected Peers -->
                    <div id="menuPeersView" style="display: none;">
                        <h3><i class="fas fa-satellite-dish"></i> Exploradores en el Campus P2P</h3>
                        <div class="item-list" id="menuPeersList"></div>
                        <button id="btnBackToMainMenuFromPeers" style="margin-top: 20px;">Volver al Menú</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    bindEvents() {
        // Top bar buttons
        document.getElementById('btnOpenMenu')?.addEventListener('click', () => this.openMenu('main'));

        // Modals close buttons
        document.getElementById('btnCloseShop')?.addEventListener('click', () => this.closeModal('shopModal'));
        document.getElementById('btnCloseInventory')?.addEventListener('click', () => this.closeModal('inventoryModal'));
        document.getElementById('btnCloseMenu')?.addEventListener('click', () => this.closeModal('menuModal'));

        // Menu sub-view navigations
        document.getElementById('btnMenuMissions')?.addEventListener('click', () => this.openMenu('missions'));
        document.getElementById('btnMenuSkills')?.addEventListener('click', () => this.openMenu('skills'));
        document.getElementById('btnMenuMap')?.addEventListener('click', () => this.openMenu('map'));
        document.getElementById('btnMenuPeers')?.addEventListener('click', () => this.openMenu('peers'));
        document.getElementById('btnMenuSave')?.addEventListener('click', () => {
            if (this.onAutoSave) this.onAutoSave();
            this.notify("¡Progreso guardado correctamente!", "success");
        });

        document.getElementById('btnBackToMainMenuFromMissions')?.addEventListener('click', () => this.openMenu('main'));
        document.getElementById('btnBackToMainMenuFromSkills')?.addEventListener('click', () => this.openMenu('main'));
        document.getElementById('btnBackToMainMenuFromMap')?.addEventListener('click', () => this.openMenu('main'));
        document.getElementById('btnBackToMainMenuFromPeers')?.addEventListener('click', () => this.openMenu('main'));

        // Dialogue overlay close on click
        document.getElementById('dialogueModal')?.addEventListener('click', () => {
            this.closeDialogue();
        });

        // Shop Buy XP
        document.getElementById('btnBuyXP')?.addEventListener('click', () => {
            if (this.player.coins >= COIN_TO_XP_RATE) {
                this.player.coins -= COIN_TO_XP_RATE;
                this.player.addXP(XP_PER_COIN_TRADE, (msg) => this.notify(msg));
                this.updateHUD();
                this.renderShop();
            } else {
                this.notify("No tienes suficientes monedas para comprar XP.", "error");
            }
        });

        // Global key shortcut handler
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();

            if (key === 'escape') {
                this.closeAllModals();
                return;
            }

            if (this.isModalOpen()) {
                if (key === ' ' || key === 'enter') {
                    if (this.activeModal === 'dialogueModal') {
                        this.closeDialogue();
                    }
                }
                return;
            }

            if (key === 'm') {
                this.openMenu('main');
            } else if (key === 'i') {
                this.openInventory();
            } else if (key === 'b') {
                this.openMenu('map');
            } else if (key === 'h') {
                const overlay = document.getElementById('controlsOverlay');
                if (overlay) {
                    overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
                }
            }
        });
    }

    isModalOpen() {
        return this.activeModal !== null;
    }

    openModal(modalId) {
        this.closeAllModals();
        const el = document.getElementById(modalId);
        if (el) {
            el.style.display = 'flex';
            this.activeModal = modalId;
        }
    }

    closeModal(modalId) {
        const el = document.getElementById(modalId);
        if (el) el.style.display = 'none';
        if (this.activeModal === modalId) {
            this.activeModal = null;
        }
    }

    closeAllModals() {
        const modals = ['dialogueModal', 'shopModal', 'inventoryModal', 'menuModal'];
        modals.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        this.activeModal = null;
    }

    openDialogue(title, text, subtitle = "Haz clic o pulsa 'Espacio' / 'Esc' para cerrar") {
        const nameEl = document.getElementById('dialogueNpcName');
        const textEl = document.getElementById('dialogueTextContent');
        const subEl = document.getElementById('dialogueSubText');

        if (nameEl) nameEl.innerHTML = title;
        if (textEl) textEl.innerHTML = text.replace(/\n/g, '<br/>');
        if (subEl) subEl.innerHTML = subtitle;

        this.openModal('dialogueModal');
    }

    closeDialogue() {
        this.closeModal('dialogueModal');
    }

    openShop() {
        this.renderShop();
        this.openModal('shopModal');
    }

    renderShop() {
        const grid = document.getElementById('shopItemsGrid');
        if (!grid) return;
        grid.innerHTML = '';

        SHOP_ITEMS.forEach(item => {
            const isPurchased = this.player.upgrades.includes(item.id) ||
                (item.effect.type === 'HEART_TO_XP' && this.player.hasHeartToXPAmulet);
            const discountedCost = Math.round(item.cost * (1 - (this.player.shopDiscount || 0)));
            const isAffordable = this.player.coins >= discountedCost;

            let cardClass = 'shop-item-card';
            if (isPurchased) cardClass += ' purchased';
            else if (!isAffordable) cardClass += ' unaffordable';

            const card = document.createElement('div');
            card.className = cardClass;
            card.innerHTML = `
                <div class="shop-item-header">
                    <div class="shop-item-icon"><i class="fas fa-bolt" style="color: var(--xp-color);"></i></div>
                    <h5>${item.name}</h5>
                </div>
                <p>${item.description}</p>
                <div class="shop-item-footer">
                    <div class="shop-item-cost">
                        <i class="fas fa-coins" style="color: #FFD700; margin-right: 5px;"></i> ${discountedCost}
                    </div>
                    <button ${isPurchased || !isAffordable ? 'disabled' : ''}>
                        ${isPurchased ? 'Comprado' : 'Comprar'}
                    </button>
                </div>
            `;

            if (!isPurchased && isAffordable) {
                card.querySelector('button').addEventListener('click', () => {
                    this.player.coins -= discountedCost;
                    this.player.applyUpgrade(item);
                    this.notify(`¡Adquiriste ${item.name}!`, 'success');
                    this.updateHUD();
                    this.renderShop();
                });
            }

            grid.appendChild(card);
        });

        // Gem Sell Cards
        const gemGrid = document.getElementById('sellGemsGrid');
        if (!gemGrid) return;
        gemGrid.innerHTML = '';

        const gemColors = {
            blue: '#00aaff',
            green: '#2ecc71',
            purple: '#9b59b6',
            amber: '#f39c12',
            red: '#e74c3c'
        };

        let hasAnyGem = false;
        for (const [color, count] of Object.entries(this.player.gems)) {
            if (count > 0) {
                hasAnyGem = true;
                const card = document.createElement('div');
                card.className = 'sell-gem-card';
                card.innerHTML = `
                    <p style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-gem" style="color: ${gemColors[color] || '#fff'};"></i>
                        Gema ${color.toUpperCase()} (x${count})
                    </p>
                    <button class="btn-sell-one">Vender 1 por ${GEM_SELL_VALUE} <i class="fas fa-coins" style="color: #FFD700;"></i></button>
                    ${count > 1 ? `<button class="sell-all-btn btn-sell-all">Vender Todo</button>` : ''}
                `;

                card.querySelector('.btn-sell-one')?.addEventListener('click', () => {
                    this.player.gems[color] -= 1;
                    this.player.coins += GEM_SELL_VALUE;
                    this.notify(`Vendiste 1 gema ${color} por ${GEM_SELL_VALUE} monedas.`, 'success');
                    this.updateHUD();
                    this.renderShop();
                });

                card.querySelector('.btn-sell-all')?.addEventListener('click', () => {
                    const totalValue = this.player.gems[color] * GEM_SELL_VALUE;
                    this.player.coins += totalValue;
                    this.player.gems[color] = 0;
                    this.notify(`Vendiste todas las gemas ${color} por ${totalValue} monedas.`, 'success');
                    this.updateHUD();
                    this.renderShop();
                });

                gemGrid.appendChild(card);
            }
        }

        if (!hasAnyGem) {
            gemGrid.innerHTML = `<p style="opacity: 0.7; text-align: center;">No tienes gemas para vender. ¡Completa misiones o explora el campus!</p>`;
        }
    }

    openInventory() {
        const list = document.getElementById('inventoryList');
        if (!list) return;
        list.innerHTML = '';

        if (!this.player.inventory || this.player.inventory.length === 0) {
            list.innerHTML = `
                <div class="list-item"><p>Tu inventario está vacío. Explora el campus y recolecta reliquias.</p></div>
                <div class="list-item"><b>Mejoras Instaladas:</b> ${this.player.upgrades.length} módulos activos.</div>
            `;
        } else {
            this.player.inventory.forEach(item => {
                const div = document.createElement('div');
                div.className = 'list-item';
                div.innerHTML = `<p><b>${item.name}</b> <span>x${item.quantity || 1}</span></p>`;
                list.appendChild(div);
            });
        }

        this.openModal('inventoryModal');
    }

    openMenu(subView = 'main') {
        const views = ['menuMainView', 'menuMissionsView', 'menuSkillsView', 'menuMapView', 'menuPeersView'];
        views.forEach(v => {
            const el = document.getElementById(v);
            if (el) el.style.display = 'none';
        });

        if (subView === 'main') {
            document.getElementById('menuMainView').style.display = 'block';
        } else if (subView === 'missions') {
            document.getElementById('menuMissionsView').style.display = 'block';
            this.renderMissionsRoadmap();
        } else if (subView === 'skills') {
            document.getElementById('menuSkillsView').style.display = 'block';
            this.renderSkillTree();
        } else if (subView === 'map') {
            document.getElementById('menuMapView').style.display = 'block';
            this.renderWorldMap();
        } else if (subView === 'peers') {
            document.getElementById('menuPeersView').style.display = 'block';
            this.renderPeersList();
        }

        this.openModal('menuModal');
    }

    renderMissionsRoadmap() {
        const container = document.getElementById('menuMissionsList');
        if (!container) return;
        container.innerHTML = '';

        this.missions.forEach(m => {
            const item = document.createElement('div');
            item.className = `list-item mission-item ${m.status}`;
            item.innerHTML = `
                <div class="mission-info">
                    <div class="mission-status-icon">
                        ${m.status === 'completada' ? '<i class="fas fa-check-circle" style="color: var(--color-completed); font-size: 1.2em;"></i>' : ''}
                        ${m.status === 'bloqueada' ? '<i class="fas fa-lock" style="color: var(--color-locked); font-size: 1.2em;"></i>' : ''}
                        ${m.status === 'disponible' ? '<div class="status-dot available"></div>' : ''}
                    </div>
                    <div class="mission-details">
                        <b>#${m.id} ${m.titulo}</b>
                        <p>${m.descripcion}</p>
                    </div>
                </div>
                <div class="mission-rewards">
                    <div class="reward-item"><i class="fas fa-coins" style="color: #FFD700;"></i> <span>${m.recompensa_monedas}</span></div>
                    <div class="reward-item"><i class="fas fa-star" style="color: var(--xp-color);"></i> <span>${m.recompensa_xp}</span></div>
                </div>
            `;

            container.appendChild(item);
        });
    }

    renderSkillTree() {
        const container = document.getElementById('menuSkillsGrid');
        if (!container) return;
        container.innerHTML = '';

        this.skills.forEach(s => {
            const isUnlocked = this.player.unlockedSkills.includes(s.id);
            const node = document.createElement('div');
            node.className = `skill-node ${isUnlocked ? 'unlocked' : 'available'}`;
            node.innerHTML = `
                <div class="skill-icon-container" style="color: ${s.color || '#00aaff'};">
                    <i class="fas ${s.icon || 'fa-code-branch'}"></i>
                </div>
                <div class="skill-details">
                    <h4>${s.name}</h4>
                    <p>${s.description}</p>
                    <div class="skill-footer">
                        <span style="font-size: 0.75em; color: ${isUnlocked ? 'var(--color-completed)' : 'var(--color-available)'};">
                            ${isUnlocked ? '✓ ACTIVADA' : 'DISPONIBLE'}
                        </span>
                    </div>
                </div>
                ${isUnlocked ? '<div class="skill-unlocked-check">✓</div>' : ''}
            `;

            container.appendChild(node);
        });
    }

    renderWorldMap() {
        const wrapper = document.getElementById('worldMapWrapper');
        if (!wrapper) return;

        const MAP_DISPLAY_WIDTH = 640;
        const scale = MAP_DISPLAY_WIDTH / WORLD_WIDTH;
        const MAP_DISPLAY_HEIGHT = WORLD_HEIGHT * scale;

        const activeM = this.missions.find(m => m.status === 'disponible');
        let targetObj = null;
        if (activeM) {
            targetObj = this.world.gameObjects.find(o => o.missionId === activeM.id) ||
                        this.world.gameObjects.find(o => o.id === activeM.zona);
        }

        wrapper.innerHTML = `
            <h3>Mapa del Campus Universitario</h3>
            <div class="world-map-container" style="width: ${MAP_DISPLAY_WIDTH}px; height: ${MAP_DISPLAY_HEIGHT}px;">
                ${this.world.gameObjects
                    .filter(obj => obj.type === 'building' || obj.type === 'obstacle')
                    .map(obj => `
                        <div class="world-map-object ${obj.type}" style="left: ${obj.x * scale}px; top: ${obj.y * scale}px; width: ${obj.width * scale}px; height: ${obj.height * scale}px; background-color: ${obj.color || '#555'};">
                            <span class="world-map-object-tooltip">${obj.name || obj.id}</span>
                        </div>
                    `).join('')}

                ${this.world.gameObjects
                    .filter(obj => obj.type === 'npc')
                    .map(obj => `
                        <div class="world-map-object npc" style="left: ${(obj.x + obj.width / 2) * scale - 4}px; top: ${(obj.y + obj.height / 2) * scale - 4}px; width: 8px; height: 8px; background-color: ${obj.color || '#AD1AAD'};">
                            <span class="world-map-object-tooltip">${obj.name}</span>
                        </div>
                    `).join('')}

                ${targetObj ? `
                    <div class="world-map-object mission-target" style="left: ${(targetObj.x + targetObj.width / 2) * scale - 5}px; top: ${(targetObj.y + targetObj.height / 2) * scale - 5}px; width: 10px; height: 10px; background-color: #f1c40f; border-radius: 50%;"></div>
                ` : ''}

                <div class="world-map-object player" style="left: ${this.player.x * scale - 4}px; top: ${this.player.y * scale - 4}px; width: 8px; height: 8px;"></div>
            </div>
            <div class="world-map-legend">
                <div class="legend-item"><div class="legend-swatch player"></div><span>Tú</span></div>
                <div class="legend-item"><div class="legend-swatch npc"></div><span>NPC</span></div>
                <div class="legend-item"><div class="legend-swatch mission"></div><span>Objetivo</span></div>
            </div>
        `;
    }

    renderPeersList() {
        const container = document.getElementById('menuPeersList');
        if (!container) return;
        container.innerHTML = '';

        if (!this.network) {
            container.innerHTML = `<div class="list-item"><p>Red local inicializándose...</p></div>`;
            return;
        }

        const peers = this.network.getConnectedPeers();
        if (peers.length === 0) {
            container.innerHTML = `
                <div class="list-item" style="text-align: center; flex-direction: column;">
                    <i class="fas fa-satellite-dish" style="font-size: 2em; margin-bottom: 10px; color: var(--xp-color);"></i>
                    <p>No hay otros jugadores conectados en este momento.<br/><small>Abre otra pestaña en este navegador para explorar en tiempo real.</small></p>
                </div>
            `;
            return;
        }

        peers.forEach(p => {
            const row = document.createElement('div');
            row.className = 'list-item';
            row.innerHTML = `
                <div>
                    <b>${p.name || 'Explorador'}</b>
                    <small>Nivel ${p.level || 1} • X: ${p.x}, Y: ${p.y}</small>
                </div>
                <button class="btn-send-peer-coins" style="padding: 6px 12px; font-size: 0.8em;">
                    Enviar 25 <i class="fas fa-coins" style="color: #FFD700;"></i>
                </button>
            `;

            row.querySelector('.btn-send-peer-coins').addEventListener('click', () => {
                if (this.network.sendCoins(p.id, 25)) {
                    this.player.coins -= 25;
                    this.updateHUD();
                    this.notify(`¡Enviaste 25 monedas a ${p.name || 'Explorador'}!`, 'success');
                } else {
                    this.notify("No tienes suficientes monedas para transferir.", "error");
                }
            });

            container.appendChild(row);
        });
    }

    notify(message, type = 'info') {
        const banner = document.getElementById('notificationBanner');
        if (!banner) return;

        banner.innerHTML = message;
        banner.style.display = 'block';

        if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
        this.notificationTimeout = setTimeout(() => {
            banner.style.display = 'none';
        }, 3200);
    }

    updateHUD() {
        // Player stats
        const lvlEl = document.getElementById('hudLevel');
        if (lvlEl) lvlEl.innerText = `Nv. ${this.player.level}`;

        const xpRequired = Math.round(INITIAL_XP_TO_LEVEL_UP * Math.pow(1.45, this.player.level - 1));
        const fillEl = document.getElementById('hudXpFill');
        if (fillEl) {
            const pct = Math.min(100, Math.max(0, (this.player.xp / xpRequired) * 100));
            fillEl.style.width = `${pct}%`;
        }

        const xpContainer = document.getElementById('hudXpContainer');
        if (xpContainer) {
            xpContainer.title = `${Math.round(this.player.xp)} / ${xpRequired} XP`;
        }

        const coinsEl = document.getElementById('hudCoins');
        if (coinsEl) coinsEl.innerText = this.player.coins;

        // Gems
        const gemBlue = document.getElementById('hudGemBlue');
        if (gemBlue) gemBlue.innerText = this.player.gems.blue || 0;

        const gemGreen = document.getElementById('hudGemGreen');
        if (gemGreen) gemGreen.innerText = this.player.gems.green || 0;

        const gemPurple = document.getElementById('hudGemPurple');
        if (gemPurple) gemPurple.innerText = this.player.gems.purple || 0;

        const gemAmber = document.getElementById('hudGemAmber');
        if (gemAmber) gemAmber.innerText = this.player.gems.amber || 0;

        const gemRed = document.getElementById('hudGemRed');
        if (gemRed) gemRed.innerText = this.player.gems.red || 0;

        // Active Mission Tracker
        const activeMission = this.missions.find(m => m.status === 'disponible');
        const trackerTitle = document.getElementById('trackerTitle');
        const trackerDesc = document.getElementById('trackerDesc');

        if (activeMission) {
            if (trackerTitle) trackerTitle.innerText = `#${activeMission.id} ${activeMission.titulo}`;
            if (trackerDesc) trackerDesc.innerText = activeMission.descripcion;
        } else {
            if (trackerTitle) trackerTitle.innerText = "¡Carrera y Tesis Completadas!";
            if (trackerDesc) trackerDesc.innerText = "Has desbloqueado el Laurel Doctoral de William Rodriguez.";
        }

        // Minimap & Mission Arrow
        this.updateMinimap(activeMission);
        this.updateMissionArrow(activeMission);
    }

    updateMinimap(activeMission) {
        const bg = document.getElementById('minimapBackground');
        if (!bg) return;

        const minimapScale = MINIMAP_SIZE / (WORLD_WIDTH * 0.4);
        const mapCenterX = this.player.x * minimapScale;
        const mapCenterY = this.player.y * minimapScale;

        const transformX = MINIMAP_SIZE / 2 - mapCenterX;
        const transformY = MINIMAP_SIZE / 2 - mapCenterY;

        bg.style.width = `${WORLD_WIDTH * minimapScale}px`;
        bg.style.height = `${WORLD_HEIGHT * minimapScale}px`;
        bg.style.transform = `translate(${transformX}px, ${transformY}px)`;

        // Render dots for NPCs and Mission Target
        let dotsHTML = '';
        this.world.gameObjects.filter(o => o.type === 'npc').forEach(npc => {
            dotsHTML += `
                <div class="minimap-dot npc" style="left: ${npc.x * minimapScale}px; top: ${npc.y * minimapScale}px;"></div>
            `;
        });

        if (activeMission) {
            const targetObj = this.world.gameObjects.find(o => o.missionId === activeMission.id) ||
                              this.world.gameObjects.find(o => o.id === activeMission.zona);
            if (targetObj) {
                dotsHTML += `
                    <div class="minimap-dot mission" style="left: ${(targetObj.x + targetObj.width / 2) * minimapScale}px; top: ${(targetObj.y + targetObj.height / 2) * minimapScale}px;"></div>
                `;
            }
        }

        bg.innerHTML = dotsHTML;
    }

    updateMissionArrow(activeMission) {
        const arrowContainer = document.getElementById('missionArrowContainer');
        const arrowIcon = document.getElementById('missionArrowIcon');
        if (!arrowContainer || !arrowIcon) return;

        if (!activeMission) {
            arrowContainer.style.display = 'none';
            return;
        }

        const targetObj = this.world.gameObjects.find(o => o.missionId === activeMission.id) ||
                          this.world.gameObjects.find(o => o.id === activeMission.zona);

        if (!targetObj) {
            arrowContainer.style.display = 'none';
            return;
        }

        arrowContainer.style.display = 'flex';
        const playerCenterX = this.player.x + PLAYER_WIDTH / 2;
        const playerCenterY = this.player.y + PLAYER_HEIGHT / 2;
        const targetCenterX = targetObj.x + targetObj.width / 2;
        const targetCenterY = targetObj.y + targetObj.height / 2;

        const angle = Math.atan2(targetCenterY - playerCenterY, targetCenterX - playerCenterX) * (180 / Math.PI);
        arrowIcon.style.transform = `rotate(${angle}deg)`;
    }
}

