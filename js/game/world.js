import * as THREE from 'three';
import { NPC, npcData } from './npc.js';

// --- City Layout Configuration ---
const cityConfig = {
    streetWidth: 5,
    streetColor: 0x555555,
    buildingSpacing: 15, // Spacing between building centers
    signHeight: 1.2, // Reduced from 3 to 1.2 for better proportion with the car
    signColor: 0xeeeeee,
    signTextColor: 'black',
    signFontSize: 6 // Reduced from 16 to 6 for better proportion with the car
};

// --- Texture Functions ---
function createBuildingTexture(color, windowColor = 0xaaccff, rows = 5, cols = 4) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Background color (building facade)
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add windows
    const windowWidth = canvas.width / (cols * 2);
    const windowHeight = canvas.height / (rows * 2);
    const windowSpacingX = canvas.width / cols;
    const windowSpacingY = canvas.height / rows;
    
    ctx.fillStyle = `#${windowColor.toString(16).padStart(6, '0')}`;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * windowSpacingX + windowSpacingX/2 - windowWidth/2;
            const y = row * windowSpacingY + windowSpacingY/2 - windowHeight/2;
            ctx.fillRect(x, y, windowWidth, windowHeight);
        }
    }
    
    // Add some details (horizontal lines between floors)
    ctx.fillStyle = '#000000';
    for (let row = 1; row < rows; row++) {
        ctx.fillRect(0, row * windowSpacingY - 2, canvas.width, 2);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createStreetTexture(color = 0x555555, lineColor = 0xffffff) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Background color (asphalt)
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add center line
    ctx.fillStyle = `#${lineColor.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, canvas.height/2 - 5, canvas.width, 10);
    
    // Add dashed side lines
    ctx.setLineDash([20, 20]);
    ctx.strokeStyle = `#${lineColor.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(canvas.width, 20);
    ctx.moveTo(0, canvas.height - 20);
    ctx.lineTo(canvas.width, canvas.height - 20);
    ctx.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createGroundTexture(color = 0x333344) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Background color
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some noise/texture
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2 + 1;
        const brightness = Math.floor(Math.random() * 40) + 20; // Darker specs
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness+10})`;
        ctx.fillRect(x, y, size, size);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10); // Repeat the texture to cover large ground
    return texture;
}

// --- UPDATED: Zone Data with City Positions ---
// Reorganizing zones into a grid-like city layout
const zoneData = {
    "campus_vision": { 
        position: new THREE.Vector3(0, 0, cityConfig.buildingSpacing), // North
        size: new THREE.Vector3(10, 0.2, 8), 
        color: 0x4682B4, // Steel Blue
        structures: [
            { type: 'building', size: new THREE.Vector3(8, 6, 6), offset: new THREE.Vector3(0, 0, 0), id: 'building_campus_1', name: 'Campus Visión' }
        ]
    },
    "taller_audio": { 
        position: new THREE.Vector3(cityConfig.buildingSpacing, 0, 0), // East
        size: new THREE.Vector3(8, 0.2, 8), 
        color: 0x8A2BE2, // Blue Violet
        structures: [
            { type: 'building', size: new THREE.Vector3(6, 5, 6), offset: new THREE.Vector3(0, 0, 0), id: 'building_audio_1', name: 'Taller Audio' }
        ]
    },
    "canalizaciones_datos": { 
        position: new THREE.Vector3(0, 0, -cityConfig.buildingSpacing), // South
        size: new THREE.Vector3(10, 0.2, 8), 
        color: 0xD2691E, // Chocolate
        structures: [
            // Replacing pipes with a 'Data Center' building
            { type: 'building', size: new THREE.Vector3(8, 4, 6), offset: new THREE.Vector3(0, 0, 0), id: 'building_data_center_1', name: 'Centro Datos' }
        ]
    },
    "torre_kafka": { 
        position: new THREE.Vector3(-cityConfig.buildingSpacing, 0, 0), // West
        size: new THREE.Vector3(8, 0.2, 8), 
        color: 0x2F4F4F, // Dark Slate Gray
        structures: [
            { type: 'tower', size: new THREE.Vector3(4, 10, 4), offset: new THREE.Vector3(0, 0, 0), id: 'tower_kafka_1', name: 'Torre Kafka' }
        ]
    },
    "lab_gpu_redis": { 
        position: new THREE.Vector3(cityConfig.buildingSpacing, 0, cityConfig.buildingSpacing * 2), // North-East
        size: new THREE.Vector3(8, 0.2, 8), 
        color: 0x006400, // Dark Green
        structures: [
            { type: 'building', size: new THREE.Vector3(6, 4, 8), offset: new THREE.Vector3(0, 0, 0), id: 'building_lab_gpu_1', name: 'Lab GPU' }
        ]
    },
    "redis_hub": { 
        position: new THREE.Vector3(cityConfig.buildingSpacing * 2, 0, cityConfig.buildingSpacing), // East-North
        size: new THREE.Vector3(8, 0.2, 8), 
        color: 0xFF6347, // Tomato
        structures: [
            { type: 'building', size: new THREE.Vector3(6, 5, 6), offset: new THREE.Vector3(0, 0, 0), id: 'building_redis_1', name: 'Redis Hub' }
        ]
    },
    "centro_yoloservice": { 
        position: new THREE.Vector3(-cityConfig.buildingSpacing, 0, cityConfig.buildingSpacing * 2), // North-West
        size: new THREE.Vector3(8, 0.2, 8), 
        color: 0x4B0082, // Indigo
        structures: [
            { type: 'building', size: new THREE.Vector3(6, 6, 6), offset: new THREE.Vector3(0, 0, 0), id: 'building_yolo_1', name: 'Centro Yolo' }
        ]
    },
    "mercado": { 
        position: new THREE.Vector3(-cityConfig.buildingSpacing * 2, 0, -cityConfig.buildingSpacing), // West-South
        size: new THREE.Vector3(8, 0.2, 8), 
        color: 0xDAA520, // Goldenrod
        structures: [
            { type: 'building', size: new THREE.Vector3(7, 3, 7), offset: new THREE.Vector3(0, 0, 0), id: 'building_market_1', name: 'Mercado' }
        ]
    }
};

// --- Interactable Objects Data ---
const interactableData = [
    // Campus Vision
    { 
        id: 'log_panel_1', 
        position: new THREE.Vector3(0, 1, cityConfig.buildingSpacing + 4), 
        size: new THREE.Vector3(1.5, 1.5, 0.2), 
        color: 0x66ccff,
        interactionType: 'log_panel',
        interactionText: 'Presiona [E] para leer el panel de logs',
        name: 'Panel de Logs wiliutils',
        educationalText: 'wiliutils es una biblioteca de utilidades para Python que facilita operaciones comunes como manejo de archivos, procesamiento de texto y operaciones matemáticas. Desarrollada por Wisrovi Rodriguez, esta biblioteca simplifica tareas repetitivas y proporciona funciones optimizadas para análisis de datos. Ver más en: https://github.com/wisrovi/wiliutils'
    },
    {
        id: 'buzon_terminal_1',
        position: new THREE.Vector3(3, 1, cityConfig.buildingSpacing + 3),
        size: new THREE.Vector3(1, 1.5, 1),
        color: 0x3399cc,
        interactionType: 'deposit_item',
        interactionText: 'Presiona [E] para depositar el chip',
        name: 'Buzón Terminal',
        educationalText: 'Este buzón permite enviar configuraciones a los sistemas de procesamiento distribuido. Los chips de configuración contienen parámetros específicos para optimizar el rendimiento de los servicios.'
    },
    {
        id: 'buzon_digital_logs_faciales',
        position: new THREE.Vector3(-3, 1, cityConfig.buildingSpacing + 3),
        size: new THREE.Vector3(1, 1.5, 1),
        color: 0x33cc99,
        interactionType: 'read_mailbox',
        interactionText: 'Presiona [E] para revisar logs faciales',
        name: 'Buzón Digital',
        educationalText: 'El sistema de reconocimiento facial desarrollado por Wisrovi Rodriguez utiliza redes neuronales convolucionales para detectar y reconocer rostros en imágenes y video. Los logs muestran métricas de precisión y rendimiento del modelo entrenado.'
    },

    // Taller Audio
    {
        id: 'chip_wkafka_1',
        position: new THREE.Vector3(cityConfig.buildingSpacing + 3, 1, 2),
        size: new THREE.Vector3(0.5, 0.5, 0.5),
        color: 0xffcc00,
        interactionType: 'collectible_item',
        interactionText: 'Presiona [E] para recoger el chip',
        itemId: 'chip_wkafka',
        itemName: 'Chip de Configuración WKafka',
        itemDescription: 'Chip que contiene configuraciones para el sistema de mensajería wkafka',
        name: 'Chip WKafka'
    },

    // Torre Kafka
    {
        id: 'terminal_kafka_test_1',
        position: new THREE.Vector3(-cityConfig.buildingSpacing - 2, 1, 3),
        size: new THREE.Vector3(1.2, 1.8, 0.8),
        color: 0x66ff66,
        interactionType: 'activate_terminal',
        interactionText: 'Presiona [E] para activar terminal',
        name: 'Terminal de Simulación',
        educationalText: 'wkafka es un sistema de mensajería basado en Apache Kafka, optimizado para aplicaciones de IoT y procesamiento de eventos en tiempo real. Esta terminal permite enviar eventos de prueba para verificar la integridad del sistema de colas y la correcta distribución de mensajes entre consumidores.'
    },

    // Redis Hub
    {
        id: 'panel_redis_map_1',
        position: new THREE.Vector3(cityConfig.buildingSpacing * 2 + 2, 1, cityConfig.buildingSpacing + 2),
        size: new THREE.Vector3(1.5, 1.5, 0.2),
        color: 0xff6666,
        interactionType: 'read_panel',
        interactionText: 'Presiona [E] para ver el mapa del clúster',
        name: 'Panel del Mapa de Clúster',
        educationalText: 'wredis es una implementación optimizada de Redis para aplicaciones distribuidas. El mapa del clúster muestra la arquitectura de nodos maestro-esclavo, la distribución de datos y las estrategias de replicación para garantizar alta disponibilidad y rendimiento.'
    },

    // Lab GPU
    {
        id: 'repair_module_1',
        position: new THREE.Vector3(cityConfig.buildingSpacing + 3, 1, cityConfig.buildingSpacing * 2 - 2),
        size: new THREE.Vector3(1.2, 1.2, 1.2),
        color: 0x9966ff,
        interactionType: 'repair_module',
        interactionText: 'Presiona [E] para reparar el módulo',
        name: 'Módulo Defectuoso',
        educationalText: 'wcontainer es un sistema de contenedores optimizado para cargas de trabajo de machine learning. Este módulo gestiona la asignación de recursos GPU para entrenamiento paralelo de modelos, balanceando la carga entre múltiples tarjetas gráficas.'
    },

    // Centro Yoloservice
    {
        id: 'terminal_yolo_main_1',
        position: new THREE.Vector3(-cityConfig.buildingSpacing - 2, 1, cityConfig.buildingSpacing * 2 - 1),
        size: new THREE.Vector3(1.2, 1.8, 0.8),
        color: 0xff99cc,
        interactionType: 'view_terminal',
        interactionText: 'Presiona [E] para visualizar arquitectura',
        name: 'Terminal Principal',
        educationalText: 'wyoloservice implementa el algoritmo YOLO (You Only Look Once) para detección de objetos en tiempo real. La arquitectura muestra cómo se procesan las imágenes a través de la red neuronal convolucional, generando predicciones de ubicación y clasificación de objetos en una sola pasada.'
    },
    {
        id: 'controlador_optuna_1',
        position: new THREE.Vector3(-cityConfig.buildingSpacing - 3, 1, cityConfig.buildingSpacing * 2 + 2),
        size: new THREE.Vector3(1, 1.5, 1),
        color: 0x99ffcc,
        interactionType: 'activate_node',
        interactionText: 'Presiona [E] para activar Optuna',
        name: 'Controlador de Optuna',
        educationalText: 'Optuna es un framework de optimización automática de hiperparámetros para modelos de machine learning. El controlador implementado por Wisrovi permite ajustar automáticamente parámetros como learning rate, batch size y arquitectura de red para maximizar la precisión del modelo YOLO.'
    },

    // Centro Datos - Nuevas misiones
    {
        id: 'panel_wml_architecture_1',
        position: new THREE.Vector3(0, 1, -cityConfig.buildingSpacing - 2),
        size: new THREE.Vector3(1.5, 1.5, 0.2),
        color: 0x4488ff,
        interactionType: 'read_panel',
        interactionText: 'Presiona [E] para explorar WML',
        name: 'Panel Arquitectura WML',
        educationalText: 'WML es un framework completo de machine learning que unifica preprocesamiento, entrenamiento, evaluación y deployment de modelos. Incluye módulos especializados para computer vision, procesamiento de lenguaje natural y aprendizaje profundo con optimizaciones de rendimiento.'
    },
    {
        id: 'dashboard_wmonitor_1',
        position: new THREE.Vector3(3, 1, -cityConfig.buildingSpacing - 1),
        size: new THREE.Vector3(1.2, 1.8, 0.8),
        color: 0xff6666,
        interactionType: 'view_dashboard',
        interactionText: 'Presiona [E] para configurar WMonitor',
        name: 'Dashboard WMonitor',
        educationalText: 'WMonitor es una plataforma de monitoreo distribuida que utiliza machine learning para detectar anomalías, predecir fallos y optimizar automáticamente el rendimiento. Recopila métricas de CPU, memoria, red y aplicación para proporcionar insights en tiempo real.'
    },

    // Mercado - Nuevas misiones
    {
        id: 'demo_wapi_interactive_1',
        position: new THREE.Vector3(-cityConfig.buildingSpacing * 2 - 2, 1, -cityConfig.buildingSpacing + 1),
        size: new THREE.Vector3(1.2, 1.8, 0.8),
        color: 0x66ff99,
        interactionType: 'view_demo',
        interactionText: 'Presiona [E] para probar WAPI',
        name: 'Demo Interactiva WAPI',
        educationalText: 'WAPI es un framework web moderno para APIs RESTful que incluye validación automática, documentación OpenAPI generada dinámicamente, middleware integrado y soporte completo para operaciones asíncronas. Simplifica el desarrollo de servicios web escalables.'
    },
    {
        id: 'terminal_wdbmigrate_1',
        position: new THREE.Vector3(-cityConfig.buildingSpacing * 2 + 2, 1, -cityConfig.buildingSpacing - 2),
        size: new THREE.Vector3(1.2, 1.8, 0.8),
        color: 0xff99ff,
        interactionType: 'run_migration',
        interactionText: 'Presiona [E] para ejecutar migración',
        name: 'Terminal WDBMigrate',
        educationalText: 'WDBMigrate es una herramienta de migración de bases de datos que soporta múltiples motores con características avanzadas como rollbacks automáticos, validación de integridad de datos y migraciones condicionales. Garantiza actualizaciones seguras de esquemas en producción.'
    }
];

// --- Street and Ramp Data ---
const streetData = [
    // Main cross streets
    {
        start: new THREE.Vector3(-cityConfig.buildingSpacing * 3, 0, 0),
        end: new THREE.Vector3(cityConfig.buildingSpacing * 3, 0, 0),
        width: cityConfig.streetWidth
    },
    {
        start: new THREE.Vector3(0, 0, -cityConfig.buildingSpacing * 3),
        end: new THREE.Vector3(0, 0, cityConfig.buildingSpacing * 3),
        width: cityConfig.streetWidth
    },
    // Connecting streets
    {
        start: new THREE.Vector3(cityConfig.buildingSpacing, 0, 0),
        end: new THREE.Vector3(cityConfig.buildingSpacing, 0, cityConfig.buildingSpacing * 2),
        width: cityConfig.streetWidth
    },
    {
        start: new THREE.Vector3(cityConfig.buildingSpacing, 0, cityConfig.buildingSpacing),
        end: new THREE.Vector3(cityConfig.buildingSpacing * 2, 0, cityConfig.buildingSpacing),
        width: cityConfig.streetWidth
    },
    {
        start: new THREE.Vector3(-cityConfig.buildingSpacing, 0, 0),
        end: new THREE.Vector3(-cityConfig.buildingSpacing, 0, cityConfig.buildingSpacing * 2),
        width: cityConfig.streetWidth
    },
    {
        start: new THREE.Vector3(-cityConfig.buildingSpacing * 2, 0, -cityConfig.buildingSpacing),
        end: new THREE.Vector3(-cityConfig.buildingSpacing, 0, -cityConfig.buildingSpacing),
        width: cityConfig.streetWidth
    }
];

// Ramps for jumping
const rampData = [
    {
        position: new THREE.Vector3(cityConfig.buildingSpacing/2, 0, cityConfig.buildingSpacing/2),
        size: new THREE.Vector3(4, 1.5, 4),
        rotation: new THREE.Euler(-Math.PI/8, Math.PI/4, 0)
    },
    {
        position: new THREE.Vector3(-cityConfig.buildingSpacing/2, 0, -cityConfig.buildingSpacing/2),
        size: new THREE.Vector3(4, 1.2, 4),
        rotation: new THREE.Euler(-Math.PI/10, -Math.PI/4, 0)
    },
    {
        position: new THREE.Vector3(cityConfig.buildingSpacing/2, 0, -cityConfig.buildingSpacing*1.5),
        size: new THREE.Vector3(5, 1.8, 4),
        rotation: new THREE.Euler(-Math.PI/6, Math.PI/6, 0)
    }
];

// --- Direction Signs Data ---
const signData = [
    {
        position: new THREE.Vector3(2, 0.5, 2),
        text: "→ Taller Audio",
        rotation: new THREE.Euler(0, Math.PI/4, 0)
    },
    {
        position: new THREE.Vector3(-2, 0.5, 2),
        text: "← Torre Kafka",
        rotation: new THREE.Euler(0, -Math.PI/4, 0)
    },
    {
        position: new THREE.Vector3(0, 0.5, 5),
        text: "↑ Campus Visión",
        rotation: new THREE.Euler(0, 0, 0)
    },
    {
        position: new THREE.Vector3(0, 0.5, -5),
        text: "↓ Centro Datos",
        rotation: new THREE.Euler(0, Math.PI, 0)
    },
    {
        position: new THREE.Vector3(cityConfig.buildingSpacing - 2, 0.5, cityConfig.buildingSpacing),
        text: "↗ Redis Hub",
        rotation: new THREE.Euler(0, Math.PI/4, 0)
    },
    {
        position: new THREE.Vector3(-cityConfig.buildingSpacing + 2, 0.5, cityConfig.buildingSpacing),
        text: "↖ Centro Yolo",
        rotation: new THREE.Euler(0, -Math.PI/4, 0)
    }
];

class World {
    constructor(scene) {
        this.scene = scene;
        this.zones = {};
        this.npcs = {};
        this.interactables = [];
        this.streetMeshes = [];
        this.collisionObjects = [];
        this.groundTexture = createGroundTexture(0x336633); // Green-ish ground
        this.groundMesh = null; // Will hold the ground mesh
        this.streetTexture = createStreetTexture();
        
        // Create world elements
        this.createGround();
        this.createZones();
        this.createStreets();
        this.createRamps();
        this.createInteractables();
        this.createNPCs();
        this.createSigns();
        
        console.log("World created with", 
            Object.keys(this.zones).length, "zones,", 
            this.interactables.length, "interactables,",
            Object.keys(this.npcs).length, "NPCs");
    }
    
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            map: this.groundTexture,
            roughness: 0.8,
            metalness: 0.2
        });
        this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        this.groundMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        this.groundMesh.position.y = -0.1; // Slightly below y=0
        this.scene.add(this.groundMesh);
    }
    
    createZones() {
        for (const [id, data] of Object.entries(zoneData)) {
            // Create zone platform
            const zoneGeometry = new THREE.BoxGeometry(data.size.x, data.size.y, data.size.z);
            const zoneMaterial = new THREE.MeshStandardMaterial({ color: data.color });
            const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial);
            zoneMesh.position.copy(data.position);
            zoneMesh.position.y = data.size.y / 2; // Position at half height
            this.scene.add(zoneMesh);
            
            // Create zone structures
            if (data.structures) {
                for (const structure of data.structures) {
                    let structureMesh;
                    
                    // Create building texture with zone color
                    const buildingTexture = createBuildingTexture(data.color);
                    
                    if (structure.type === 'building') {
                        const buildingGeometry = new THREE.BoxGeometry(
                            structure.size.x, structure.size.y, structure.size.z
                        );
                        const buildingMaterial = new THREE.MeshStandardMaterial({ 
                            map: buildingTexture,
                            roughness: 0.7,
                            metalness: 0.3
                        });
                        structureMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
                    } else if (structure.type === 'tower') {
                        const towerGeometry = new THREE.CylinderGeometry(
                            structure.size.x / 2, structure.size.x / 2, structure.size.y, 16
                        );
                        const towerMaterial = new THREE.MeshStandardMaterial({ 
                            map: buildingTexture,
                            roughness: 0.7,
                            metalness: 0.3
                        });
                        structureMesh = new THREE.Mesh(towerGeometry, towerMaterial);
                        
                        // Add antenna or spire to tower
                        const spireGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
                        const spireMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
                        const spireMesh = new THREE.Mesh(spireGeometry, spireMaterial);
                        spireMesh.position.y = structure.size.y / 2 + 1;
                        structureMesh.add(spireMesh);
                    }
                    
                    if (structureMesh) {
                        structureMesh.position.copy(data.position);
                        structureMesh.position.y = data.size.y + structure.size.y / 2; // Position on platform
                        structureMesh.position.add(structure.offset);
                        
                        // Store ID for interaction
                        structureMesh.userData.id = structure.id;
                        structureMesh.userData.name = structure.name;
                        
                        this.scene.add(structureMesh);
                        
                        // Add to collision objects
                        this.collisionObjects.push(structureMesh);
                    }
                    
                    // Create floating zone name (reduced size)
                    const textSprite = this.createTextSprite(
                        structure.name,
                        0xffffff, // White text
                        cityConfig.signFontSize * 0.8, // Slightly smaller than signs
                        data.color
                    );
                    textSprite.position.copy(data.position);
                    textSprite.position.y = data.size.y + structure.size.y + 0.8; // Position above structure
                    this.scene.add(textSprite);
                }
            }
            
            // Store zone
            this.zones[id] = {
                mesh: zoneMesh,
                data: data
            };
        }
    }
    
    createStreets() {
        const streetMaterial = new THREE.MeshStandardMaterial({ 
            map: this.streetTexture,
            roughness: 0.9,
            metalness: 0.1
        });
        
        for (const street of streetData) {
            // Calculate street length and orientation
            const direction = new THREE.Vector3().subVectors(street.end, street.start);
            const length = direction.length();
            
            // Create street mesh
            const streetGeometry = new THREE.PlaneGeometry(street.width, length);
            const streetMesh = new THREE.Mesh(streetGeometry, streetMaterial);
            
            // Position and rotate street
            const midpoint = new THREE.Vector3().addVectors(street.start, street.end).multiplyScalar(0.5);
            streetMesh.position.copy(midpoint);
            streetMesh.position.y = 0.01; // Slightly above ground to avoid z-fighting
            
            // Rotate to align with direction
            streetMesh.rotation.x = -Math.PI / 2; // Make horizontal
            const angle = Math.atan2(direction.x, direction.z);
            streetMesh.rotation.z = angle;
            
            this.scene.add(streetMesh);
            this.streetMeshes.push(streetMesh);
        }
    }
    
    createRamps() {
        // Create ramps for jumping
        const rampMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x777777,
            roughness: 0.8,
            metalness: 0.2
        });
        
        for (const ramp of rampData) {
            const rampGeometry = new THREE.BoxGeometry(ramp.size.x, ramp.size.y, ramp.size.z);
            const rampMesh = new THREE.Mesh(rampGeometry, rampMaterial);
            
            rampMesh.position.copy(ramp.position);
            rampMesh.position.y = ramp.size.y / 2; // Position at half height
            rampMesh.rotation.copy(ramp.rotation);
            
            this.scene.add(rampMesh);
            this.collisionObjects.push(rampMesh);
            
            // Add "JUMP" text to the ramp
            const textSprite = this.createTextSprite("JUMP", 0xffff00, cityConfig.signFontSize * 0.7, 0x555555);
            
            // Position text above ramp
            const textOffset = new THREE.Vector3(0, 1, 0);
            textSprite.position.copy(ramp.position).add(textOffset);
            
            this.scene.add(textSprite);
        }
    }
    
    createInteractables() {
        for (const data of interactableData) {
            // Create base geometry based on size
            const geometry = new THREE.BoxGeometry(data.size.x, data.size.y, data.size.z);
            const material = new THREE.MeshStandardMaterial({ 
                color: data.color,
                emissive: data.color,
                emissiveIntensity: 0.2,
                roughness: 0.5,
                metalness: 0.5
            });
            const mesh = new THREE.Mesh(geometry, material);
            
            // Position
            mesh.position.copy(data.position);
            
            // Store interaction data
            mesh.userData = { ...data };
            
            // Add to scene and tracking
            this.scene.add(mesh);
            this.interactables.push(mesh);
            
            // Add floating name label (smaller size)
            const textSprite = this.createTextSprite(
                data.name, 
                0xffffff, // White text
                cityConfig.signFontSize * 0.6, // Smaller than zone labels
                data.color
            );
            textSprite.position.copy(data.position);
            textSprite.position.y += data.size.y / 2 + 0.5; // Position above object
            this.scene.add(textSprite);
        }
    }
    
    createNPCs() {
        // Create NPCs from data
        for (const [id, data] of Object.entries(npcData)) {
            const npc = new NPC(id, this.scene);
            this.npcs[id] = npc;
        }
    }
    
    createSigns() {
        // Create direction signs
        for (const sign of signData) {
            // Create sign post
            const postGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
            const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
            const postMesh = new THREE.Mesh(postGeometry, postMaterial);
            postMesh.position.copy(sign.position);
            postMesh.position.y = 0.5; // Half height
            this.scene.add(postMesh);
            
            // Create sign board
            const signGeometry = new THREE.BoxGeometry(1.2, 0.4, 0.05);
            const signMaterial = new THREE.MeshStandardMaterial({ color: cityConfig.signColor });
            const signMesh = new THREE.Mesh(signGeometry, signMaterial);
            signMesh.position.copy(sign.position);
            signMesh.position.y = 1.0; // Top of post
            signMesh.rotation.copy(sign.rotation);
            this.scene.add(signMesh);
            
            // Create text sprite for sign
            const textSprite = this.createTextSprite(
                sign.text, 
                cityConfig.signTextColor, 
                cityConfig.signFontSize,
                cityConfig.signColor
            );
            textSprite.position.copy(sign.position);
            textSprite.position.y = 1.0;
            textSprite.rotation.copy(sign.rotation);
            this.scene.add(textSprite);
        }
    }
    
    createTextSprite(text, textColor, fontSize, backgroundColor) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size based on text length
        context.font = `${fontSize}px Arial`;
        const textMetrics = context.measureText(text);
        const canvasWidth = textMetrics.width + fontSize; // Add some padding
        const canvasHeight = fontSize * 2;
        canvas.width = this.powerOf2(canvasWidth); // Use power of 2 for better texture performance
        canvas.height = this.powerOf2(canvasHeight);
        
        // Draw background if provided
        if (backgroundColor !== undefined) {
            context.fillStyle = `#${backgroundColor.toString(16).padStart(6, '0')}`;
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Draw text
        context.font = `${fontSize}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = textColor;
        context.fillText(text, canvas.width / 2, canvas.height / 2); // Centered
        
        // Create sprite
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        // Scale sprite
        // Use a fixed world-space size for better consistency and less visual clutter
        const aspect = canvas.width / canvas.height;
        sprite.scale.set(0.5 * aspect, 0.5, 1.0);
        
        return sprite;
    }

    powerOf2(v) {
        let p = 2;
        while (p < v) { p *= 2; }
        return p;
    }
    
    update(deltaTime) {
        // Update NPCs
        for (const npc of Object.values(this.npcs)) {
            npc.update(deltaTime);
        }
    }
    
    // Get all objects that can be collided with (structures)
    getCollisionObjects(structuresOnly = false) {
        if (structuresOnly) {
            // Return only buildings and structures, not ground
            return this.collisionObjects;
        }
        
        // Return all collision objects including zone platforms
        return [
            ...this.collisionObjects,
            this.groundMesh, // IMPORTANT: Always include the ground for raycasting
            ...Object.values(this.zones).map(zone => zone.mesh)
        ];
    }
    
    // Get all interactable objects
    getInteractableObjects() {
        return [
            ...this.interactables,
            ...Object.values(this.npcs).map(npc => npc.mesh)
        ];
    }
}

export { World };
