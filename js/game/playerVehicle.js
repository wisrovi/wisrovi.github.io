// ============================================================================
// Wisrovi's Interactive 2D CV & Research Universe - 2D Player Controller
// Author: William Steve Rodriguez Villamizar (wisrovi)
// Pure 2D Top-Down Architecture (Zero Three.js, Zero WebGL)
// ============================================================================

import { WORLD_WIDTH, WORLD_HEIGHT, XP_PER_HEART } from './worldGenerator.js';

export const PLAYER_INITIAL_SPEED = 180; // px/sec
export const PLAYER_WIDTH = 35;
export const PLAYER_HEIGHT = 35;
export const PLAYER_INTERACTION_RANGE = 55;
export const INITIAL_XP_TO_LEVEL_UP = 100;

export class Player2D {
    constructor(world) {
        this.world = world;

        // Position & Dimensions
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.x = 1180;
        this.y = 1350; // Near Ada at the start
        this.prevX = this.x;
        this.prevY = this.y;

        // Movement & Controls
        this.speed = PLAYER_INITIAL_SPEED;
        this.isMoving = false;
        this.interactionRange = PLAYER_INTERACTION_RANGE;
        this.interactionTarget = null;
        this.magnetRange = 0;
        this.coinDoublerChance = 0;
        this.teleportCostMultiplier = 1.0;
        this.shopDiscount = 0;
        this.gemSellBonus = 0;
        this.teleportCostBonus = 0;
        this.hasHeartToXPAmulet = false;

        // Career Progression Stats
        this.name = "Wisrovi Navigator";
        this.level = 1;
        this.xp = 0;
        this.xpBoost = 1.0;
        this.coins = 50;
        this.gems = {
            blue: 2,
            green: 1,
            purple: 0,
            amber: 0,
            red: 0
        };
        this.inventory = [];
        this.unlockedSkills = [];
        this.upgrades = [];

        // Input state
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            ArrowUp: false,
            ArrowLeft: false,
            ArrowDown: false,
            ArrowRight: false
        };

        this.setupKeyboardListeners();
    }

    setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
                this.keys[key] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
                this.keys[key] = false;
            }
        });
    }

    resetKeys() {
        for (const k in this.keys) {
            this.keys[k] = false;
        }
    }

    update(deltaTime, isPaused = false) {
        if (isPaused) {
            this.isMoving = false;
            return;
        }

        let dx = 0;
        let dy = 0;

        if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
        if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) dx += 1;

        this.isMoving = dx !== 0 || dy !== 0;

        let newX = this.x;
        let newY = this.y;

        if (this.isMoving) {
            const magnitude = Math.sqrt(dx * dx + dy * dy);
            const moveX = (dx / magnitude) * this.speed * deltaTime;
            const moveY = (dy / magnitude) * this.speed * deltaTime;

            newX += moveX;
            newY += moveY;

            // Collision check against static buildings & obstacles
            if (this.world.checkCollision(newX, newY, this.width, this.height)) {
                if (!this.world.checkCollision(this.x, newY, this.width, this.height)) {
                    newX = this.x;
                } else if (!this.world.checkCollision(newX, this.y, this.width, this.height)) {
                    newY = this.y;
                } else {
                    newX = this.x;
                    newY = this.y;
                }
            }

            // World bounds clamping
            newX = Math.max(10, Math.min(newX, WORLD_WIDTH - this.width - 10));
            newY = Math.max(10, Math.min(newY, WORLD_HEIGHT - this.height - 10));

            this.prevX = this.x;
            this.prevY = this.y;
            this.x = newX;
            this.y = newY;
        }

        // Update closest interaction target
        this.updateInteractionTarget();

        // Magnet suction for nearby collectibles
        this.updateMagnetPull(deltaTime);
    }

    updateInteractionTarget() {
        let closest = null;
        let minDistance = Infinity;
        const playerCenterX = this.x + this.width / 2;
        const playerCenterY = this.y + this.height / 2;

        for (const obj of this.world.gameObjects) {
            if (obj.collectibleType || obj.type === 'obstacle') continue;

            let targetX = obj.x + obj.width / 2;
            let targetY = obj.y + obj.height / 2;

            if (obj.type === 'building' && obj.door) {
                targetX = obj.x + obj.door.x + obj.door.width / 2;
                targetY = obj.y + obj.door.y + obj.door.height / 2;
            }

            const dist = Math.hypot(targetX - playerCenterX, targetY - playerCenterY);
            if (dist < this.interactionRange && dist < minDistance) {
                minDistance = dist;
                closest = obj;
            }
        }

        this.interactionTarget = closest;
    }

    updateMagnetPull(deltaTime) {
        if (this.magnetRange <= 0) return;

        const playerCenterX = this.x + this.width / 2;
        const playerCenterY = this.y + this.height / 2;
        const pullRadius = (this.width / 2) + this.magnetRange;

        for (const obj of this.world.gameObjects) {
            if (!obj.collectibleType) continue;

            const objCenterX = obj.x + obj.width / 2;
            const objCenterY = obj.y + obj.height / 2;
            const dist = Math.hypot(objCenterX - playerCenterX, objCenterY - playerCenterY);

            if (dist < pullRadius && dist > 1) {
                const pullSpeed = 220 * deltaTime;
                obj.x -= ((objCenterX - playerCenterX) / dist) * pullSpeed;
                obj.y -= ((objCenterY - playerCenterY) / dist) * pullSpeed;
            }
        }
    }

    collectItem(item, onNotify) {
        if (item.collectibleType === 'coin') {
            const isDouble = Math.random() < this.coinDoublerChance;
            const value = (item.value || 5) * (isDouble ? 2 : 1);
            this.coins += value;
            if (onNotify) onNotify(`+${value} Monedas${isDouble ? ' (¡Duplicadas!)' : ''}`, 'coin');
        } else if (item.collectibleType === 'gem') {
            const color = item.gemType || 'blue';
            this.gems[color] = (this.gems[color] || 0) + 1;
            if (onNotify) onNotify(`+1 Gema ${color.toUpperCase()}`, 'gem');
        } else if (item.collectibleType === 'heart') {
            const xpGained = this.hasHeartToXPAmulet ? XP_PER_HEART : 5;
            this.addXP(xpGained, onNotify);
            if (onNotify) onNotify(`+${xpGained} XP (Corazón de Datos)`, 'xp');
        }
    }

    addXP(amount, onNotify) {
        let earned = Math.round(amount * this.xpBoost);
        this.xp += earned;

        let xpRequired = Math.round(INITIAL_XP_TO_LEVEL_UP * Math.pow(1.45, this.level - 1));
        while (this.xp >= xpRequired) {
            this.level++;
            this.xp -= xpRequired;
            xpRequired = Math.round(INITIAL_XP_TO_LEVEL_UP * Math.pow(1.45, this.level - 1));
            if (onNotify) onNotify(`🎉 ¡SUBISTE DE NIVEL! Nivel ${this.level}`, 'level');
        }
    }

    addCoins(amount) {
        this.coins += Math.round(amount);
    }

    addGems(gemDict) {
        for (const [color, count] of Object.entries(gemDict)) {
            this.gems[color] = (this.gems[color] || 0) + count;
        }
    }

    applyUpgrade(upgrade) {
        if (this.upgrades.includes(upgrade.id)) return;
        this.upgrades.push(upgrade.id);

        if (upgrade.effect.type === 'SPEED_BOOST') this.speed *= upgrade.effect.value;
        if (upgrade.effect.type === 'INTERACTION_RANGE_BOOST') this.interactionRange *= upgrade.effect.value;
        if (upgrade.effect.type === 'XP_BOOST') this.xpBoost *= upgrade.effect.value;
        if (upgrade.effect.type === 'MAGNET_RANGE') this.magnetRange += upgrade.effect.value;
        if (upgrade.effect.type === 'COIN_DOUBLER_CHANCE') this.coinDoublerChance = Math.max(this.coinDoublerChance, upgrade.effect.value);
        if (upgrade.effect.type === 'TELEPORT_COST_MULTIPLIER') this.teleportCostMultiplier = upgrade.effect.value;
        if (upgrade.effect.type === 'HEART_TO_XP') this.hasHeartToXPAmulet = true;
    }
}
