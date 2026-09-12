// ============================================================================
// Wisrovi's Interactive 2D CV & Research Universe - 2D World Generator
// Author: William Steve Rodriguez Villamizar (wisrovi)
// Pure 2D Top-Down Architecture (Zero Three.js, Zero WebGL)
// ============================================================================

export const WORLD_WIDTH = 2400;
export const WORLD_HEIGHT = 1600;
export const BASE_VIEWPORT_WIDTH = 1200;
export const BASE_VIEWPORT_HEIGHT = 800;
export const MINIMAP_SIZE = 180;
export const GEM_SELL_VALUE = 50;
export const COIN_TO_XP_RATE = 100;
export const XP_PER_COIN_TRADE = 50;
export const XP_PER_HEART = 15;

export const SHOP_ITEMS = [
    { id: 'speed_boost_1', name: 'Propulsores Mejorados', description: 'Aumenta tu velocidad de movimiento en un 33%.', cost: 100, effect: { type: 'SPEED_BOOST', value: 1.33 } },
    { id: 'interaction_range_1', name: 'Escáner de Largo Alcance', description: 'Aumenta tu rango de interacción un 50%.', cost: 120, effect: { type: 'INTERACTION_RANGE_BOOST', value: 1.5 } },
    { id: 'xp_boost_1', name: 'Módulo de Aprendizaje', description: 'Gana un 20% más de XP permanentemente.', cost: 200, effect: { type: 'XP_BOOST', value: 1.2 } },
    { id: 'magnet_1', name: 'Imán de Coleccionables', description: 'Atrae monedas y gemas cercanas automáticamente.', cost: 250, effect: { type: 'MAGNET_RANGE', value: 75 } },
    { id: 'coin_doubler_1', name: 'Duplicador de Monedas', description: '15% de probabilidad de duplicar las monedas recogidas.', cost: 400, effect: { type: 'COIN_DOUBLER_CHANCE', value: 0.15 } },
    { id: 'teleport_optimizer_1', name: 'Optimizador de Teletransporte', description: 'Reduce el coste de teletransporte en un 50%.', cost: 300, effect: { type: 'TELEPORT_COST_MULTIPLIER', value: 0.5 } },
    { id: 'amulet_of_wisdom', name: 'Amuleto de Sabiduría', description: 'Permite ganar 15 XP por cada Corazón de Datos recogido.', cost: 500, effect: { type: 'HEART_TO_XP', value: 1 } },
];

export class World2D {
    constructor() {
        this.width = WORLD_WIDTH;
        this.height = WORLD_HEIGHT;
        this.gameObjects = [];
        this.initWorldObjects();
    }

    initWorldObjects() {
        // 1. Key NPCs
        const npcs = [
            { id: 'npc_ada', x: 1180, y: 1420, width: 32, height: 46, type: 'npc', name: 'Ada, la Guía', color: '#AD1AAD', role: 'Guía de Misiones' },
            { id: 'npc_charles', x: 2100, y: 350, width: 32, height: 46, type: 'npc', name: 'Charles, el Ingeniero', color: '#D55E00', role: 'Ingeniero Core' },
            { id: 'npc_vendor', x: 1300, y: 1250, width: 40, height: 50, type: 'npc', name: 'Chip, el Mercader', color: '#0072B2', role: 'Comerciante' },
            { id: 'npc_vincent', x: 1850, y: 700, width: 32, height: 46, type: 'npc', name: 'Vincent, el Visionario', color: '#5a189a', role: 'Visionario AI' }
        ];

        // 2. Thematic Buildings (Representing Career Phases, Libraries, and Doctoral Frontiers)
        const buildings = [
            { id: 'campus_electronica', x: 150, y: 150, width: 220, height: 140, type: 'building', name: 'Campus Electrónica (UDI)', color: '#009E73', door: { x: 95, y: 110, width: 30, height: 30 } },
            { id: 'taller_audio', x: 450, y: 140, width: 200, height: 150, type: 'building', name: 'Taller Audio (ProcessAudio)', color: '#0072B2', door: { x: 85, y: 120, width: 30, height: 30 } },
            { id: 'nucleo_wpipe', x: 1050, y: 100, width: 260, height: 170, type: 'building', name: 'Núcleo WPipe (Sol Central)', color: '#D55E00', door: { x: 115, y: 140, width: 30, height: 30 } },
            { id: 'torre_kafka', x: 1450, y: 130, width: 210, height: 160, type: 'building', name: 'Torre Kafka (wkafka)', color: '#E69F00', door: { x: 90, y: 130, width: 30, height: 30 } },
            { id: 'redis_vault', x: 1800, y: 140, width: 220, height: 150, type: 'building', name: 'Redis Vault (wredis)', color: '#CC79A7', door: { x: 95, y: 120, width: 30, height: 30 } },

            { id: 'boveda_databases', x: 150, y: 480, width: 230, height: 150, type: 'building', name: 'Bóveda Databases (wsqlite & wpostgresql)', color: '#56B4E9', door: { x: 100, y: 120, width: 30, height: 30 } },
            { id: 'boveda_seguridad', x: 500, y: 500, width: 220, height: 140, type: 'building', name: 'Bóveda Seguridad (wauth & wFabricSecurity)', color: '#444444', door: { x: 95, y: 110, width: 30, height: 30 } },
            { id: 'puerto_contenedores', x: 1450, y: 460, width: 240, height: 160, type: 'building', name: 'Puerto Contenedores (wcontainer & wclickhouse)', color: '#607D8B', door: { x: 105, y: 130, width: 30, height: 30 } },
            { id: 'aula_magna_viu', x: 1850, y: 460, width: 240, height: 160, type: 'building', name: 'Aula Magna (Máster IA VIU)', color: '#8B4513', door: { x: 105, y: 130, width: 30, height: 30 } },

            { id: 'hangar_wyolo', x: 150, y: 800, width: 240, height: 160, type: 'building', name: 'Hangar WYOLO (YOLOv8/11/26)', color: '#00aaff', door: { x: 105, y: 130, width: 30, height: 30 } },
            { id: 'hub_mcp_agentes', x: 500, y: 800, width: 250, height: 160, type: 'building', name: 'Hub MCP Agentes (Constelación FastMCP)', color: '#663399', door: { x: 110, y: 130, width: 30, height: 30 } },
            { id: 'datacenter_neuralforge', x: 1400, y: 800, width: 270, height: 180, type: 'building', name: 'Datacenter NeuralForge AI (:23442)', color: '#1a535c', door: { x: 120, y: 150, width: 30, height: 30 } },
            { id: 'laboratorio_optuna', x: 1800, y: 800, width: 240, height: 160, type: 'building', name: 'Laboratorio Optuna (TPESampler)', color: '#e74c3c', door: { x: 105, y: 130, width: 30, height: 30 } },

            { id: 'nodo_invoker_gpu', x: 150, y: 1120, width: 240, height: 150, type: 'building', name: 'Nodo Invoker GPU (Daemon Silicio)', color: '#2c3e50', door: { x: 105, y: 120, width: 30, height: 30 } },
            { id: 'hangar_gpu_workers', x: 500, y: 1120, width: 250, height: 160, type: 'building', name: 'Hangar Workers (22 Pasos wtrain)', color: '#34495e', door: { x: 110, y: 130, width: 30, height: 30 } },
            { id: 'laboratorio_xai', x: 880, y: 1120, width: 230, height: 150, type: 'building', name: 'Laboratorio XAI (Grad-CAM & AUC)', color: '#16a085', door: { x: 100, y: 120, width: 30, height: 30 } },
            { id: 'camara_degradacion', x: 1450, y: 1120, width: 230, height: 150, type: 'building', name: 'Cámara Degradación (FGSM & Ruido)', color: '#c0392b', door: { x: 100, y: 120, width: 30, height: 30 } },
            { id: 'observatorio_doctoral', x: 1800, y: 1120, width: 250, height: 160, type: 'building', name: 'Observatorio Doctoral (CSR & Jacobiano)', color: '#8e44ad', door: { x: 110, y: 130, width: 30, height: 30 } },

            { id: 'laboratorio_generalizacion', x: 200, y: 1380, width: 240, height: 150, type: 'building', name: 'Lab Generalización (FID Domain Shift)', color: '#27ae60', door: { x: 105, y: 120, width: 30, height: 30 } },
            { id: 'templo_verificacion_formal', x: 550, y: 1380, width: 240, height: 150, type: 'building', name: 'Templo Verificación Formal (LTL)', color: '#2980b9', door: { x: 105, y: 120, width: 30, height: 30 } },
            { id: 'reactor_self_healing', x: 1450, y: 1380, width: 240, height: 150, type: 'building', name: 'Reactor Self-Healing (Resiliencia GPU)', color: '#d35400', door: { x: 105, y: 120, width: 30, height: 30 } },
            { id: 'cupula_zenodo_cern', x: 1800, y: 1380, width: 270, height: 160, type: 'building', name: 'Cúpula Zenodo / CERN (26 Preprints)', color: '#7f8c8d', door: { x: 120, y: 130, width: 30, height: 30 } }
        ];

        // 3. Interactive Mission Terminal Objects (one per mission)
        const missionObjects = [
            { id: 'osciloscopio_dsp', x: 235, y: 310, width: 30, height: 30, type: 'object', name: 'Osciloscopio DSP', color: '#00FFFF', missionId: 1 },
            { id: 'rack_audio_dsp', x: 535, y: 310, width: 30, height: 30, type: 'object', name: 'Rack Audio ProcessAudio', color: '#00aaff', missionId: 2 },
            { id: 'monolito_wpipe', x: 1165, y: 290, width: 35, height: 35, type: 'object', name: 'Monolito WPipe', color: '#FFD700', missionId: 3 },
            { id: 'cluster_kafka_node', x: 1535, y: 310, width: 30, height: 30, type: 'object', name: 'Nodo WKafka Stream', color: '#E69F00', missionId: 4 },
            { id: 'consola_redis_lock', x: 1885, y: 310, width: 30, height: 30, type: 'object', name: 'Consola WRedis Lock', color: '#CC79A7', missionId: 5 },

            { id: 'altar_tablesync', x: 245, y: 650, width: 30, height: 30, type: 'object', name: 'Altar TableSync ORM', color: '#56B4E9', missionId: 6 },
            { id: 'boveda_cripto', x: 585, y: 660, width: 30, height: 30, type: 'object', name: 'Bóveda Criptográfica Zero Trust', color: '#00ffaa', missionId: 7 },
            { id: 'dock_wcontainer', x: 1545, y: 640, width: 30, height: 30, type: 'object', name: 'Terminal WContainer & ClickHouse', color: '#607D8B', missionId: 8 },
            { id: 'birrete_academico', x: 1945, y: 640, width: 30, height: 30, type: 'object', name: 'Birrete Académico VIU', color: '#FFD700', missionId: 9 },

            { id: 'terminal_wyolo', x: 245, y: 980, width: 30, height: 30, type: 'object', name: 'Terminal WYOLO Suite', color: '#00aaff', missionId: 10 },
            { id: 'matriz_mcp_hub', x: 600, y: 980, width: 35, height: 35, type: 'object', name: 'Matriz FastMCP Hub', color: '#9b59b6', missionId: 11 },
            { id: 'consola_gateway_23442', x: 1510, y: 1000, width: 35, height: 35, type: 'object', name: 'Consola Gateway NeuralForge (:23442)', color: '#1abc9c', missionId: 12 },
            { id: 'terminal_optuna_sweep', x: 1895, y: 980, width: 30, height: 30, type: 'object', name: 'Terminal Sweep Optuna TPE', color: '#e74c3c', missionId: 13 },

            { id: 'servidor_invoker', x: 245, y: 1290, width: 30, height: 30, type: 'object', name: 'Servidor Daemon Invoker GPU', color: '#34495e', missionId: 14 },
            { id: 'pod_docker_worker', x: 605, y: 1300, width: 32, height: 32, type: 'object', name: 'Pod Efímero Worker 22 Pasos', color: '#2ecc71', missionId: 15 },
            { id: 'curvas_auc_xai', x: 975, y: 1290, width: 30, height: 30, type: 'object', name: 'Consola Deletion/Insertion AUC', color: '#16a085', missionId: 16 },
            { id: 'inyector_ruido_sensor', x: 1545, y: 1290, width: 30, height: 30, type: 'object', name: 'Inyector de Ruido & FGSM', color: '#e74c3c', missionId: 17 },
            { id: 'manuscrito_csr_ieee', x: 1905, y: 1300, width: 30, height: 30, type: 'object', name: 'Manuscrito Causal Saliency CSR', color: '#8e44ad', missionId: 18 },

            { id: 'sensor_fid_shift', x: 300, y: 1545, width: 30, height: 30, type: 'object', name: 'Sensor Latente FID Shift', color: '#27ae60', missionId: 19 },
            { id: 'automata_ltl_checker', x: 650, y: 1545, width: 30, height: 30, type: 'object', name: 'Verificador Formal LTL FastMCP', color: '#2980b9', missionId: 20 },
            { id: 'consola_self_healing', x: 1550, y: 1545, width: 30, height: 30, type: 'object', name: 'Consola Self-Healing MLOps', color: '#d35400', missionId: 21 },
            { id: 'monumento_zenodo_preprints', x: 1915, y: 1550, width: 35, height: 35, type: 'object', name: 'Monumento Doctoral CERN / Zenodo', color: '#f1c40f', missionId: 22 }
        ];

        // 4. Obstacles (Natural barriers and campus scenery)
        const obstacles = [
            { id: 'campus_rock_1', x: 800, y: 450, width: 80, height: 70, type: 'obstacle', color: '#616161' },
            { id: 'campus_rock_2', x: 860, y: 500, width: 60, height: 60, type: 'obstacle', color: '#505050' },
            { id: 'forest_north_1', x: 700, y: 120, width: 140, height: 160, type: 'obstacle', color: '#2E7D32' },
            { id: 'forest_center', x: 1050, y: 550, width: 180, height: 140, type: 'obstacle', color: '#1B5E20' },
            { id: 'forest_east', x: 2150, y: 700, width: 150, height: 220, type: 'obstacle', color: '#2E7D32' },
            { id: 'campus_lake', x: 850, y: 800, width: 220, height: 150, type: 'obstacle', color: '#0077b6' },
            { id: 'forest_south_1', x: 1100, y: 1350, width: 160, height: 150, type: 'obstacle', color: '#1B5E20' }
        ];

        // 5. Distributed Collectibles (Coins, 5 Gem Colors, and Hearts)
        const collectibles = this.generateCollectibles([...npcs, ...buildings, ...missionObjects, ...obstacles]);

        this.gameObjects = [
            ...npcs,
            ...buildings,
            ...missionObjects,
            ...obstacles,
            ...collectibles
        ];
    }

    generateCollectibles(staticObjects) {
        const items = [];
        const gemColors = [
            { color: '#00aaff', type: 'blue', value: 1 },
            { color: '#2ecc71', type: 'green', value: 1 },
            { color: '#9b59b6', type: 'purple', value: 1 },
            { color: '#f39c12', type: 'amber', value: 1 },
            { color: '#e74c3c', type: 'red', value: 1 }
        ];

        const isColliding = (x, y, size) => {
            const margin = 18;
            for (const obj of staticObjects) {
                if (x < obj.x + obj.width + margin &&
                    x + size + margin > obj.x &&
                    y < obj.y + obj.height + margin &&
                    y + size + margin > obj.y) {
                    return true;
                }
            }
            return false;
        };

        // 40 Coins
        for (let i = 0; i < 40; i++) {
            let x, y, collides;
            let attempts = 0;
            do {
                x = 50 + Math.random() * (this.width - 120);
                y = 50 + Math.random() * (this.height - 120);
                collides = isColliding(x, y, 16);
                attempts++;
            } while (collides && attempts < 50);

            if (!collides) {
                items.push({
                    id: `coin_${i}`,
                    x, y, width: 16, height: 16,
                    type: 'object',
                    collectibleType: 'coin',
                    value: 5
                });
            }
        }

        // 25 Gems (5 of each color)
        let gemIdx = 0;
        for (const gemMeta of gemColors) {
            for (let j = 0; j < 5; j++) {
                let x, y, collides;
                let attempts = 0;
                do {
                    x = 50 + Math.random() * (this.width - 120);
                    y = 50 + Math.random() * (this.height - 120);
                    collides = isColliding(x, y, 20);
                    attempts++;
                } while (collides && attempts < 50);

                if (!collides) {
                    items.push({
                        id: `gem_${gemIdx++}`,
                        x, y, width: 18, height: 18,
                        type: 'object',
                        collectibleType: 'gem',
                        gemColor: gemMeta.color,
                        gemType: gemMeta.type,
                        value: gemMeta.value
                    });
                }
            }
        }

        // 12 Hearts
        for (let k = 0; k < 12; k++) {
            let x, y, collides;
            let attempts = 0;
            do {
                x = 50 + Math.random() * (this.width - 120);
                y = 50 + Math.random() * (this.height - 120);
                collides = isColliding(x, y, 20);
                attempts++;
            } while (collides && attempts < 50);

            if (!collides) {
                items.push({
                    id: `heart_${k}`,
                    x, y, width: 20, height: 20,
                    type: 'object',
                    collectibleType: 'heart',
                    value: XP_PER_HEART
                });
            }
        }

        return items;
    }

    checkCollision(x, y, width, height) {
        for (const obj of this.gameObjects) {
            if ((obj.type === 'obstacle' || obj.type === 'building') && !obj.collectibleType) {
                if (x < obj.x + obj.width &&
                    x + width > obj.x &&
                    y < obj.y + obj.height &&
                    y + height > obj.y) {
                    return true;
                }
            }
        }
        return false;
    }
}
