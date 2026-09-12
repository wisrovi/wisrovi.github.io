// ============================================================================
// Wisrovi Legacy 2.0 - IndexedDB Storage Engine (wticket Database Pattern)
// Author: William Steve Rodriguez Villamizar (wisrovi)
// ============================================================================

const DB_NAME = 'wisrovi_game_db';
const DB_VERSION = 2;

// Storage Stores modeled after wticket DB architecture
export const STORE_PLAYER = 'player_profile';
export const STORE_INVENTORY = 'inventory';
export const STORE_MISSIONS = 'missions_state';
export const STORE_SKILLS = 'unlocked_skills';
export const STORE_TRANSACTIONS = 'peer_transactions';
export const STORE_SYNC = 'sync_metadata';

let dbInstance = null;

export async function initGameDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (e) => {
            console.error("[GameDB] Error opening IndexedDB:", e);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            console.log("[GameDB] IndexedDB initialized successfully:", DB_NAME);
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log("[GameDB] Upgrading schema to version", DB_VERSION);

            if (!db.objectStoreNames.contains(STORE_PLAYER)) {
                db.createObjectStore(STORE_PLAYER, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_INVENTORY)) {
                db.createObjectStore(STORE_INVENTORY, { keyPath: 'itemId' });
            }
            if (!db.objectStoreNames.contains(STORE_MISSIONS)) {
                db.createObjectStore(STORE_MISSIONS, { keyPath: 'missionId' });
            }
            if (!db.objectStoreNames.contains(STORE_SKILLS)) {
                db.createObjectStore(STORE_SKILLS, { keyPath: 'skillId' });
            }
            if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
                db.createObjectStore(STORE_TRANSACTIONS, { keyPath: 'txId' });
            }
            if (!db.objectStoreNames.contains(STORE_SYNC)) {
                db.createObjectStore(STORE_SYNC, { keyPath: 'id' });
            }
        };
    });
}

async function getStore(storeName, mode = 'readonly') {
    const db = await initGameDB();
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
}

export async function getFromDB(storeName, key) {
    try {
        const store = await getStore(storeName, 'readonly');
        return new Promise((resolve, reject) => {
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.error(`[GameDB] getFromDB failed for ${storeName}/${key}:`, err);
        return null;
    }
}

export async function getAllFromDB(storeName) {
    try {
        const store = await getStore(storeName, 'readonly');
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.error(`[GameDB] getAllFromDB failed for ${storeName}:`, err);
        return [];
    }
}

export async function saveToDB(storeName, data) {
    try {
        const store = await getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const req = store.put(data);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.error(`[GameDB] saveToDB failed for ${storeName}:`, err);
        return false;
    }
}

export async function deleteFromDB(storeName, key) {
    try {
        const store = await getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const req = store.delete(key);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.error(`[GameDB] deleteFromDB failed for ${storeName}/${key}:`, err);
        return false;
    }
}

export async function clearStoreDB(storeName) {
    try {
        const store = await getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const req = store.clear();
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.error(`[GameDB] clearStoreDB failed for ${storeName}:`, err);
        return false;
    }
}

// Cloudflare Worker / D1 Sync Architecture (wticket pattern)
const CLOUD_API_URL = 'https://wticket-api.wisrovi-rodriguez.workers.dev';

export async function syncStateToCloud(playerData) {
    try {
        const payload = {
            sql: `
                CREATE TABLE IF NOT EXISTS game_saves (
                    player_id TEXT PRIMARY KEY,
                    name TEXT,
                    level INTEGER,
                    xp INTEGER,
                    coins INTEGER,
                    gems_json TEXT,
                    skills_json TEXT,
                    last_saved INTEGER
                );
                INSERT INTO game_saves (player_id, name, level, xp, coins, gems_json, skills_json, last_saved)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(player_id) DO UPDATE SET
                    name=excluded.name,
                    level=excluded.level,
                    xp=excluded.xp,
                    coins=excluded.coins,
                    gems_json=excluded.gems_json,
                    skills_json=excluded.skills_json,
                    last_saved=excluded.last_saved;
            `,
            params: [
                playerData.id || 'active_player',
                playerData.name || 'Wisrovi Navigator',
                playerData.level || 1,
                playerData.xp || 0,
                playerData.coins || 0,
                JSON.stringify(playerData.gems || {}),
                JSON.stringify(Array.from(playerData.skills || [])),
                Date.now()
            ]
        };

        const res = await fetch(CLOUD_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            console.log('[CloudSync] Game state successfully synced to Cloudflare D1!');
            await saveToDB(STORE_SYNC, { id: 'last_cloud_sync', timestamp: Date.now() });
            return true;
        }
    } catch (e) {
        console.warn('[CloudSync] Offline or cloud unreachable, state kept in local IndexedDB:', e.message);
    }
    return false;
}

export async function fetchStateFromCloud(playerId = 'active_player') {
    try {
        const res = await fetch(CLOUD_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sql: "SELECT * FROM game_saves WHERE player_id = ? LIMIT 1",
                params: [playerId]
            })
        });

        if (res.ok) {
            const data = await res.json();
            if (data.success && data.result && data.result[0]?.results?.length > 0) {
                const row = data.result[0].results[0];
                return {
                    id: row.player_id,
                    name: row.name,
                    level: row.level,
                    xp: row.xp,
                    coins: row.coins,
                    gems: JSON.parse(row.gems_json || '{}'),
                    skills: JSON.parse(row.skills_json || '[]'),
                    lastSaved: row.last_saved
                };
            }
        }
    } catch (e) {
        console.warn('[CloudSync] Could not fetch remote save:', e.message);
    }
    return null;
}

// Default initial state generator
export function getInitialPlayerData() {
    return {
        id: 'active_player',
        name: 'Wisrovi Navigator',
        level: 1,
        xp: 0,
        xpNext: 100,
        coins: 150,
        gems: {
            blue: 5,     // Foundational core / utilities
            green: 2,    // Databases & caching
            purple: 1,   // Agentic FastMCP & LLM
            amber: 0,    // MLOps & NeuralForge
            red: 0       // Doctoral Frontiers & Research
        },
        speedBoost: 1.0,
        radarRadius: 18.0,
        inventoryCapacity: 30,
        position: { x: 0, y: 0.5, z: 0 },
        rotation: 0,
        createdAt: Date.now(),
        lastSaved: Date.now()
    };
}

export const FALLBACK_MISSIONS = [
  {
    "id": 1,
    "era": "foundational",
    "titulo": "Génesis Electrónica & Señales DSP",
    "fase": "Fase 1: Fundamentos (UDI 2010–2016)",
    "descripcion": "Comienza tu viaje en los laboratorios de Ingeniería Electrónica. Aprende cómo el procesamiento digital de señales (DSP), los microcontroladores y la automatización forjaron la base de ingeniería de William Rodriguez.",
    "recompensa_xp": 100,
    "recompensa_monedas": 150,
    "recompensa_gemas": { "blue": 5 },
    "desbloquea_skill": "dsp_filtering",
    "zona": "campus_electronica",
    "target_coord": { "x": -25, "z": -20 },
    "dialogo_npc": "¡Bienvenido, colega! Antes de las redes neuronales profundas y los clústeres GPU, todo empezó aquí, con señales analógicas, filtros Kalman y transformadas rápidas de Fourier en la UDI. Recoge el osciloscopio DSP y calibra la señal.",
    "objeto_interaccion": "osciloscopio_dsp",
    "badge": "🎓 Ing. Electrónico"
  },
  {
    "id": 2,
    "era": "foundational",
    "titulo": "ProcessAudio & Espectrogramas Mel",
    "fase": "Fase 1: Procesamiento de Audio",
    "descripcion": "Descubre la librería ProcessAudio en PyPI. Implementa transformadores Scikit-learn para extraer características espectrales (MFCC, Mel-spectrograms) y data augmentation para modelos de voz y sonido.",
    "recompensa_xp": 150,
    "recompensa_monedas": 200,
    "recompensa_gemas": { "blue": 6 },
    "desbloquea_skill": "audio_augment",
    "zona": "taller_audio",
    "target_coord": { "x": 20, "z": -25 },
    "dialogo_npc": "ProcessAudio estandariza la ingeniería de audio como transformadores compatibles con Scikit-learn. Así convertimos formas de onda complejas en tensores de alta fidelidad.",
    "objeto_interaccion": "rack_audio_dsp",
    "badge": "🎵 Audio DSP Specialist"
  },
  {
    "id": 3,
    "era": "ecosystem",
    "titulo": "Sol Central: WPipe & SQLite WAL",
    "fase": "Fase 2: Arquitectura Base Python",
    "descripcion": "Llega al corazón del Macro Sistema Solar: WPipe. Aprende cómo el motor desacoplado de pipelines sortea el GIL de Python, registra estados transaccionales con SQLite WAL y permite checkpoints sin pérdida de progreso.",
    "recompensa_xp": 250,
    "recompensa_monedas": 300,
    "recompensa_gemas": { "blue": 10, "green": 4 },
    "desbloquea_skill": "gil_bypass",
    "zona": "nucleo_wpipe",
    "target_coord": { "x": 0, "z": 0 },
    "dialogo_npc": "¡Has llegado al Sol Central! WPipe no es solo un orquestador: es el núcleo que sostiene todo el ecosistema. Su aislamiento de memoria y modo WAL en SQLite garantizan tolerancia a fallos total.",
    "objeto_interaccion": "monolito_wpipe",
    "badge": "☀️ WPipe Architect"
  },
  {
    "id": 4,
    "era": "ecosystem",
    "titulo": "Streaming Reactivo con WKafka",
    "fase": "Fase 2: Mensajería Distribuida",
    "descripcion": "Inspecciona el nodo WKafka (~1,558 descargas/mes en PyPI). Configura decoradores reactivos, reconexión automática y serialización de eventos de alta velocidad para streaming en tiempo real.",
    "recompensa_xp": 300,
    "recompensa_monedas": 350,
    "recompensa_gemas": { "blue": 8, "green": 5 },
    "desbloquea_skill": "kafka_streamer",
    "zona": "torre_kafka",
    "target_coord": { "x": 35, "z": 10 },
    "dialogo_npc": "WKafka abstrae el boilerplate de Apache Kafka con decoradores declarativos en Python. Millones de mensajes fluyen sin interrupción entre productores y consumidores distribuidos.",
    "objeto_interaccion": "cluster_kafka_node",
    "badge": "⚡ Kafka Stream Master"
  },
  {
    "id": 5,
    "era": "ecosystem",
    "titulo": "Caché Atómico & Distributed Locks con WRedis",
    "fase": "Fase 2: Persistencia & Concurrencia",
    "descripcion": "Conéctate al clúster WRedis (~798 descargas/mes). Implementa Distributed Locks atómicos con Redlock, decoradores de memoización distribuida y algoritmos de rate-limiting Token-Bucket.",
    "recompensa_xp": 350,
    "recompensa_monedas": 400,
    "recompensa_gemas": { "green": 10 },
    "desbloquea_skill": "atomic_locks",
    "zona": "redis_vault",
    "target_coord": { "x": -35, "z": 15 },
    "dialogo_npc": "En alta concurrencia, las carreras de hilos destruyen bases de datos. WRedis introduce distributed locks atómicos y decoradores que protegen recursos críticos en microsegundos.",
    "objeto_interaccion": "consola_redis_lock",
    "badge": "🔒 Distributed Lock Master"
  },
  {
    "id": 6,
    "era": "ecosystem",
    "titulo": "TableSync Reactivo: WSQLite & WPostgreSQL",
    "fase": "Fase 2: Mapeo Relacional Moderno",
    "descripcion": "Domina WSQLite y WPostgreSQL. Descubre cómo TableSync inspecciona automáticamente modelos Pydantic v2 y sincroniza esquemas relacionales sin necesidad de complejas migraciones manuales.",
    "recompensa_xp": 400,
    "recompensa_monedas": 450,
    "recompensa_gemas": { "green": 12 },
    "desbloquea_skill": "tablesync_orm",
    "zona": "boveda_databases",
    "target_coord": { "x": -20, "z": 35 },
    "dialogo_npc": "Con TableSync, tus modelos Pydantic son la única fuente de verdad. El ORM infiere tipos, claves foráneas e índices y migra esquemas SQLite y PostgreSQL de manera transparente.",
    "objeto_interaccion": "altar_tablesync",
    "badge": "💾 Polyglot Database Expert"
  },
  {
    "id": 7,
    "era": "ecosystem",
    "titulo": "Zero Trust Criptográfico: WAuth & WFabricSecurity",
    "fase": "Fase 2: Ciberseguridad & Criptografía",
    "descripcion": "Accede a la bóveda de seguridad. Configura claves salted con huella de hardware (WAuth) y valida contratos inteligentes de Hyperledger Fabric con firmas digitales ECDSA P-256 (WFabricSecurity).",
    "recompensa_xp": 450,
    "recompensa_monedas": 500,
    "recompensa_gemas": { "green": 8, "purple": 5 },
    "desbloquea_skill": "zero_trust_guard",
    "zona": "boveda_seguridad",
    "target_coord": { "x": 25, "z": 30 },
    "dialogo_npc": "Zero Trust significa no confiar en nadie. WAuth ata credenciales a la máquina física con sales no exportables y WFabricSecurity sella cada byte con criptografía elíptica P-256.",
    "objeto_interaccion": "boveda_cripto",
    "badge": "🛡️ Zero Trust Cryptographer"
  },
  {
    "id": 8,
    "era": "ecosystem",
    "titulo": "Gobernador de Recursos: WContainer & WClickHouse",
    "fase": "Fase 2: Contenedores & Analítica Columnar",
    "descripcion": "Automatiza Docker SDK con WContainer para gobernar cuotas VRAM/CPU y conecta streams de telemetría a bases de datos columnares OLAP con WClickHouse.",
    "recompensa_xp": 450,
    "recompensa_monedas": 500,
    "recompensa_gemas": { "green": 8, "amber": 5 },
    "desbloquea_skill": "container_governor",
    "zona": "puerto_contenedores",
    "target_coord": { "x": -15, "z": -35 },
    "dialogo_npc": "WContainer gestiona cuotas de memoria GPU y escaneos de vulnerabilidades, mientras WClickHouse procesa miles de eventos por segundo para telemetría.",
    "objeto_interaccion": "dock_wcontainer",
    "badge": "📦 Container & Big Data Lead"
  },
  {
    "id": 9,
    "era": "education",
    "titulo": "Maestría Oficial en IA (VIU 2023–2024)",
    "fase": "Fase 3: Especialización Académica en Deep Learning",
    "descripcion": "Culmina el Máster Universitario Oficial en Inteligencia Artificial (Universidad Internacional de Valencia). Perfecciona redes neuronales profundas, visión artificial y NLP.",
    "recompensa_xp": 500,
    "recompensa_monedas": 550,
    "recompensa_gemas": { "purple": 10 },
    "desbloquea_skill": "deep_learning_mastery",
    "zona": "aula_magna_viu",
    "target_coord": { "x": -35, "z": -15 },
    "dialogo_npc": "La formación rigurosa en la VIU consolidó el puente entre el procesamiento de señales DSP clásico y las arquitecturas neuronales profundas contemporáneas.",
    "objeto_interaccion": "birrete_academico",
    "badge": "🎓 M.Sc. Artificial Intelligence"
  },
  {
    "id": 10,
    "era": "vision",
    "titulo": "Entrenamiento & Telemetría YOLO con WYOLO",
    "fase": "Fase 3: Visión Artificial para Producción",
    "descripcion": "Implementa el wrapper oficial WYOLO en PyPI. Automatiza pipelines de entrenamiento para YOLOv8, YOLOv11 y YOLO26 con sincronización de pesos en MinIO S3 y métricas en MLflow.",
    "recompensa_xp": 550,
    "recompensa_monedas": 600,
    "recompensa_gemas": { "purple": 8, "amber": 6 },
    "desbloquea_skill": "yolo_optimizer",
    "zona": "hangar_wyolo",
    "target_coord": { "x": 15, "z": 40 },
    "dialogo_npc": "WYOLO unifica el ciclo de entrenamiento de Computer Vision: desde el preprocesamiento de tensores hasta la exportación a ONNX y TensorRT para inferencia edge.",
    "objeto_interaccion": "terminal_wyolo",
    "badge": "🎯 Computer Vision Specialist"
  },
  {
    "id": 11,
    "era": "mcp",
    "titulo": "Constelación FastMCP: La Mente de los Agentes LLM",
    "fase": "Fase 4: Inteligencia Artificial Agéntica",
    "descripcion": "Entra en el Mini Sistema Solar Agéntico. Conecta Claude, Antigravity y Cursor a los 6 servidores FastMCP oficiales (wpipe-mcp, wyoloservice-mcp, wredis-mcp, etc.).",
    "recompensa_xp": 600,
    "recompensa_monedas": 650,
    "recompensa_gemas": { "purple": 15 },
    "desbloquea_skill": "mcp_agentic_flow",
    "zona": "hub_mcp_agentes",
    "target_coord": { "x": 0, "z": 45 },
    "dialogo_npc": "El protocolo MCP permite a los LLMs actuar con herramientas reales en lugar de solo generar texto. Nuestros 6 servidores conectan agentes directamente a clústeres GPU y datastores.",
    "objeto_interaccion": "matriz_mcp_hub",
    "badge": "🤖 Agentic Systems Engineer"
  },
  {
    "id": 12,
    "era": "mlops",
    "titulo": "NeuralForge AI: Ruteo Celery & Prioridades Estrictas",
    "fase": "Fase 4: Plataforma Flagship MLOps (train_service_2)",
    "descripcion": "Despliega el stack de NeuralForge AI (FastAPI :23442, Redis :23438, Postgres :23436, MinIO :23448). Configura el ruteo estricto de colas Celery: private > gpus_high > gpus_med > gpus_low.",
    "recompensa_xp": 650,
    "recompensa_monedas": 700,
    "recompensa_gemas": { "amber": 10, "purple": 8 },
    "desbloquea_skill": "cluster_orchestrator",
    "zona": "datacenter_neuralforge",
    "target_coord": { "x": 45, "z": -15 },
    "dialogo_npc": "NeuralForge AI coordina servidores GPU heterogéneos. Si un nodo privado requiere cómputo urgente, la cola estricta de Redis desaloja tareas menores sin perder datos.",
    "objeto_interaccion": "consola_gateway_23442",
    "badge": "⚡ Distributed MLOps Lead"
  },
  {
    "id": 13,
    "era": "mlops",
    "titulo": "Sweeps Genéticos con Optuna & TPESampler",
    "fase": "Fase 4: Optimización de Hiperparámetros",
    "descripcion": "Inicia un estudio genético en wyoloservice2_manager. Observa cómo el muestreador bayesiano TPESampler explora el hiperespacio de YOLO sin colisiones en PostgreSQL.",
    "recompensa_xp": 700,
    "recompensa_monedas": 750,
    "recompensa_gemas": { "amber": 12 },
    "desbloquea_skill": "optuna_tpe_tuning",
    "zona": "laboratorio_optuna",
    "target_coord": { "x": 50, "z": 5 },
    "dialogo_npc": "Optimizar decenas de parámetros a ciegas es inviable. Optuna TPESampler predice la probabilidad de mejora y dirige la GPU a las configuraciones más prometedoras.",
    "objeto_interaccion": "terminal_optuna_sweep",
    "badge": "🧬 Genetic Sweep Specialist"
  },
  {
    "id": 14,
    "era": "mlops",
    "titulo": "El Guardián del Silicio: Demonio GPU Invoker",
    "fase": "Fase 4: Control de Hardware & Samba CIFS",
    "descripcion": "Configura wyoloservice2_invoker en los nodos de entrenamiento. Controla el gobernador dinámico de cuotas VRAM, la telemetría térmica y los montajes seguros Samba CIFS.",
    "recompensa_xp": 750,
    "recompensa_monedas": 800,
    "recompensa_gemas": { "amber": 14 },
    "desbloquea_skill": "invoker_guardian",
    "zona": "nodo_invoker_gpu",
    "target_coord": { "x": 40, "z": -25 },
    "dialogo_npc": "El demonio Invoker es el centinela de cada máquina GPU. Asegura que ningún contenedor sature la VRAM y gestiona montajes de red CIFS para leer datasets compartidos.",
    "objeto_interaccion": "servidor_invoker",
    "badge": "🛡️ Hardware Resource Governor"
  },
  {
    "id": 15,
    "era": "mlops",
    "titulo": "El Ciclo Forense de 22 Pasos en Worker Efímero",
    "fase": "Fase 4: Contenedores Aislados & Auditoría XAI",
    "descripcion": "Ejecuta un contenedor Docker efímero (wtrain / wpipe). Completa los 22 pasos del ciclo de vida: verificación de polígonos, Grad-CAM P3-P5, Deletion/Insertion AUC y reporte LLM.",
    "recompensa_xp": 800,
    "recompensa_monedas": 850,
    "recompensa_gemas": { "amber": 16, "red": 5 },
    "desbloquea_skill": "forensic_xai_audit",
    "zona": "hangar_gpu_workers",
    "target_coord": { "x": 35, "z": -40 },
    "dialogo_npc": "Cada contenedor de entrenamiento nace, ejecuta su pipeline de 22 pasos con telemetría en tiempo real y muere sin dejar residuos. La auditoría XAI post-entrenamiento es completamente determinista.",
    "objeto_interaccion": "pod_docker_worker",
    "badge": "🐳 Ephemeral Container Lead"
  },
  {
    "id": 16,
    "era": "forensics",
    "titulo": "Auditoría Cuantitativa: Deletion & Insertion AUC",
    "fase": "Fase 5: XAI de Alta Fidelidad",
    "descripcion": "Verifica la fidelidad de las explicaciones visuales. Mide la caída de confianza al remover píxeles clave (Deletion AUC) y la recuperación progresiva (Insertion AUC) en capas P3, P4 y P5.",
    "recompensa_xp": 850,
    "recompensa_monedas": 900,
    "recompensa_gemas": { "amber": 10, "red": 8 },
    "desbloquea_skill": "xai_fidelity_metric",
    "zona": "laboratorio_xai",
    "target_coord": { "x": -30, "z": -45 },
    "dialogo_npc": "Un mapa de calor bonito no garantiza causalidad. Con Deletion e Insertion AUC medimos matemáticamente si la red realmente usa esas características visuales para clasificar.",
    "objeto_interaccion": "curvas_auc_xai",
    "badge": "🔍 Quantitative XAI Auditor"
  },
  {
    "id": 17,
    "era": "forensics",
    "titulo": "Inyección de Ruido Sensórico & Ataques Adversarios FGSM",
    "fase": "Fase 5: Resiliencia & Robustez",
    "descripcion": "Somete los detectores a perturbaciones adversarias Fast Gradient Sign Method (FGSM/PGD) y ruido de sensor simulado (Gaussiano, Poisson, desenfoque) para evaluar la degradación de mAP.",
    "recompensa_xp": 900,
    "recompensa_monedas": 950,
    "recompensa_gemas": { "red": 10 },
    "desbloquea_skill": "adversarial_shield",
    "zona": "camara_degradacion",
    "target_coord": { "x": -40, "z": -30 },
    "dialogo_npc": "En entornos críticos del mundo real, una cámara sucia o un ataque intencionado pueden engañar al modelo. Probamos el modelo bajo condiciones extremas antes de certificarlo.",
    "objeto_interaccion": "inyector_ruido_sensor",
    "badge": "🛡️ Adversarial Robustness Lead"
  },
  {
    "id": 18,
    "era": "phd",
    "titulo": "Causal Saliency Regularization (CSR): Rompiendo Clever Hans",
    "fase": "Fase 6: Investigación Doctoral de Frontera (PHD-03)",
    "descripcion": "Estudia el manuscrito PHD-03 (DOI: 10.5281/zenodo.22716676). Aplica regularización causal mediante Jacobiano truncado detach(alpha) en PAFPN para erradicar correlaciones espurias del fondo.",
    "recompensa_xp": 1000,
    "recompensa_monedas": 1000,
    "recompensa_gemas": { "red": 12, "amber": 10 },
    "desbloquea_skill": "causal_saliency_math",
    "zona": "observatorio_doctoral",
    "target_coord": { "x": -45, "z": -40 },
    "dialogo_npc": "Los detectores a menudo aciertan por razones equivocadas: el efecto Clever Hans. CSR penaliza los gradientes no causales en el PAFPN durante el entrenamiento, garantizando que el modelo mire el objeto y no el fondo.",
    "objeto_interaccion": "manuscrito_csr_ieee",
    "badge": "🔬 Causal AI Researcher"
  },
  {
    "id": 19,
    "era": "phd",
    "titulo": "Predicción de Domain Shift sin Etiquetas vía FID",
    "fase": "Fase 6: Generalización & Transferencia Sim-to-Real",
    "descripcion": "Analiza la correlación entre Fréchet Inception Distance (FID) en espacios latentes profundos y la pérdida de mAP50 al desplegar modelos en nuevos entornos operacionales.",
    "recompensa_xp": 1050,
    "recompensa_monedas": 1100,
    "recompensa_gemas": { "red": 14 },
    "desbloquea_skill": "domain_shift_predictor",
    "zona": "laboratorio_generalizacion",
    "target_coord": { "x": -25, "z": 45 },
    "dialogo_npc": "Etiquetar datos en producción es carísimo. Calculando la distancia FID entre representaciones profundas, podemos predecir si el rendimiento caerá antes de desplegar.",
    "objeto_interaccion": "sensor_fid_shift",
    "badge": "📊 Domain Shift Modeler"
  },
  {
    "id": 20,
    "era": "phd",
    "titulo": "Verificación Formal LTL de Agentes MCP",
    "fase": "Fase 6: Métodos Formales & Model Checking (PHD-02)",
    "descripcion": "Examina PHD-02. Modela autómatas síncronos con especificaciones LTL de seguridad y vivacidad para servidores FastMCP, demostrando matemáticamente la ausencia de deadlocks.",
    "recompensa_xp": 1150,
    "recompensa_monedas": 1200,
    "recompensa_gemas": { "red": 16 },
    "desbloquea_skill": "formal_ltl_verification",
    "zona": "templo_verificacion_formal",
    "target_coord": { "x": -50, "z": 0 },
    "dialogo_npc": "En sistemas críticos, las pruebas unitarias no bastan: se requiere verificación formal. Demostramos matemáticamente mediante model checking que los protocolos FastMCP jamás caen en estados de bloqueo mutuo.",
    "objeto_interaccion": "automata_ltl_checker",
    "badge": "📐 Formal Methods Scholar"
  },
  {
    "id": 21,
    "era": "phd",
    "titulo": "Self-Healing MLOps: Recuperación Autónoma en Clústeres GPU",
    "fase": "Fase 6: Resiliencia Distribuida (PHD-01)",
    "descripcion": "Estudia PHD-01. Audita el framework de auto-reparación que detecta anomalías GPU (CUDA OOM, fallos de heartbeat, divergencia de gradientes) y reconcilia el estado de Celery sin intervención humana.",
    "recompensa_xp": 1250,
    "recompensa_monedas": 1300,
    "recompensa_gemas": { "red": 18, "amber": 12 },
    "desbloquea_skill": "self_healing_core",
    "zona": "reactor_self_healing",
    "target_coord": { "x": 25, "z": -45 },
    "dialogo_npc": "Self-Healing MLOps convierte clústeres frágiles en infraestructuras autónomas y resilientes capaces de diagnosticar y solucionar patologías de entrenamiento sobre la marcha.",
    "objeto_interaccion": "consola_self_healing",
    "badge": "🔄 Self-Healing Architect"
  },
  {
    "id": 22,
    "era": "phd",
    "titulo": "Conformal Prediction & La Cima de los 26 Preprints CERN/Zenodo",
    "fase": "Fase 6: Tesis Doctoral & Certificación Científica Máxima",
    "descripcion": "Culmina tu travesía en la Cúpula de Investigación. Integra Conformal Prediction con garantías de cobertura libre de distribución en muestras finitas y desbloquea el laurel doctoral de William Rodriguez (ORCID: 0009-0005-0710-1861).",
    "recompensa_xp": 2000,
    "recompensa_monedas": 2500,
    "recompensa_gemas": { "red": 30, "amber": 25, "purple": 25, "green": 25, "blue": 25 },
    "desbloquea_skill": "conformal_doctorate_mastery",
    "zona": "cupula_zenodo_cern",
    "target_coord": { "x": 0, "z": -50 },
    "dialogo_npc": "¡Has recorrido el camino completo! Desde los circuitos analógicos de pregrado hasta los 26 preprints oficiales con DOI en CERN/Zenodo, la plataforma NeuralForge AI y la propuesta doctoral. Eres un Maestro del Ecosistema Wisrovi.",
    "objeto_interaccion": "zenodo_monolith_26",
    "badge": "👑 Doctoral Fellowship Laureate"
  }
];

export const FALLBACK_SKILLS = [
  {
    "id": "dsp_filtering",
    "name": "Filtro DSP Antiruido",
    "icon": "fa-wave-square",
    "color": "#38bdf8",
    "description": "Mejora la precisión de los sensores y aumenta la velocidad base del vehículo en +10%.",
    "buff": { "speedMultiplier": 1.10 }
  },
  {
    "id": "audio_augment",
    "name": "Resonancia Espectral (ProcessAudio)",
    "icon": "fa-music",
    "color": "#06b6d4",
    "description": "Emite ondas de pulso que duplican el radio de detección de monedas y gemas.",
    "buff": { "radarMultiplier": 1.25 }
  },
  {
    "id": "gil_bypass",
    "name": "Bypass de GIL (WPipe Core)",
    "icon": "fa-sun",
    "color": "#f59e0b",
    "description": "Desbloquea el turbo de CPU: la aceleración del vehículo aumenta un 25%.",
    "buff": { "accelerationMultiplier": 1.25 }
  },
  {
    "id": "kafka_streamer",
    "name": "Particionado Masivo (WKafka)",
    "icon": "fa-stream",
    "color": "#f97316",
    "description": "Permite recolectar flujos continuos de eventos, multiplicando las recompensas de monedas en +20%.",
    "buff": { "coinMultiplier": 1.20 }
  },
  {
    "id": "atomic_locks",
    "name": "Candado Atómico (WRedis)",
    "icon": "fa-lock",
    "color": "#ef4444",
    "description": "Protege el estado del vehículo, reduciendo el frenado y la fricción por derrape.",
    "buff": { "driftControl": 1.20 }
  },
  {
    "id": "tablesync_orm",
    "name": "TableSync Reactivo (WSqlite/WPostgres)",
    "icon": "fa-database",
    "color": "#10b981",
    "description": "Optimiza la memoria y duplica la capacidad del inventario (bolsa de mano).",
    "buff": { "capacityBonus": 20 }
  },
  {
    "id": "zero_trust_guard",
    "name": "Criptografía Zero Trust (WAuth/WFabric)",
    "icon": "fa-shield-halved",
    "color": "#8b5cf6",
    "description": "Cifra la sesión y otorga invulnerabilidad temporal al colisionar con obstáculos.",
    "buff": { "shieldActive": true }
  },
  {
    "id": "mcp_agentic_flow",
    "name": "Agente Autónomo FastMCP",
    "icon": "fa-robot",
    "color": "#a855f7",
    "description": "Un dron agéntico satélite acompaña a tu vehículo recolectando gemas cercanas automáticamente.",
    "buff": { "autoLoot": true }
  },
  {
    "id": "cluster_orchestrator",
    "name": "Prioridad Celery GPU (NeuralForge)",
    "icon": "fa-microchip",
    "color": "#eab308",
    "description": "Otorga acceso a la cola prioritaria de GPU: velocidad máxima +30%.",
    "buff": { "speedMultiplier": 1.30 }
  },
  {
    "id": "optuna_tpe_tuning",
    "name": "Afinación Bayesiana TPESampler",
    "icon": "fa-dna",
    "color": "#ec4899",
    "description": "Calcula trayectorias óptimas aumentando la ganancia de experiencia (XP) en +35%.",
    "buff": { "xpMultiplier": 1.35 }
  },
  {
    "id": "forensic_xai_audit",
    "name": "Visión Grad-CAM Multiescala",
    "icon": "fa-eye",
    "color": "#14b8a6",
    "description": "Ilumina zonas y misiones en el minimapa con mapas de calor de alta fidelidad.",
    "buff": { "minimapEnhanced": true }
  },
  {
    "id": "causal_saliency_math",
    "name": "Causal Saliency Regularization (PHD-03)",
    "icon": "fa-brain",
    "color": "#bef264",
    "description": "Penaliza distracciones no causales: el vehículo ignora colisiones leves con bordes de carretera.",
    "buff": { "obstaclePenetration": true }
  },
  {
    "id": "formal_ltl_verification",
    "name": "Verificación Formal LTL (PHD-02)",
    "icon": "fa-compass-drafting",
    "color": "#60a5fa",
    "description": "Garantía matemática de vivacidad y ausencia de bloqueos: reseteo instantáneo de posición.",
    "buff": { "instantRecovery": true }
  },
  {
    "id": "container_governor",
    "name": "Gobernador VRAM (WContainer)",
    "icon": "fa-boxes-stacked",
    "color": "#10b981",
    "description": "Limita el consumo de recursos e incrementa la velocidad de recolección de gemas en +20%.",
    "buff": { "gemSpeedMultiplier": 1.20 }
  },
  {
    "id": "deep_learning_mastery",
    "name": "Maestría en Deep Learning (VIU)",
    "icon": "fa-graduation-cap",
    "color": "#a855f7",
    "description": "Graduación oficial en IA: duplica la tasa de ganancia de XP al completar misiones.",
    "buff": { "xpMultiplier": 1.50 }
  },
  {
    "id": "yolo_optimizer",
    "name": "Optimizador YOLO (WYOLO)",
    "icon": "fa-crosshairs",
    "color": "#f97316",
    "description": "Aceleración de inferencia y aumento de velocidad máxima del vehículo en +25%.",
    "buff": { "speedMultiplier": 1.25 }
  },
  {
    "id": "invoker_guardian",
    "name": "Centinela Invoker (GPU Guard)",
    "icon": "fa-shield-cat",
    "color": "#eab308",
    "description": "Protege los motores contra recalentamiento, reduciendo la desaceleración a cero.",
    "buff": { "heatControl": true }
  },
  {
    "id": "xai_fidelity_metric",
    "name": "Métrica Deletion/Insertion AUC",
    "icon": "fa-chart-line",
    "color": "#06b6d4",
    "description": "Mide fidelidad de explicaciones: revela la ubicación de todas las gemas ocultas en el radar.",
    "buff": { "radarGemsReveal": true }
  },
  {
    "id": "adversarial_shield",
    "name": "Defensa Adversaria FGSM",
    "icon": "fa-shield",
    "color": "#ef4444",
    "description": "Escudo de inmunidad contra perturbaciones y ruidos de sensor en el terreno.",
    "buff": { "noiseImmunity": true }
  },
  {
    "id": "domain_shift_predictor",
    "name": "Oráculo Domain Shift vía FID",
    "icon": "fa-satellite",
    "color": "#8b5cf6",
    "description": "Predice el rendimiento latente: incrementa en +40% el radio de atracción magnética.",
    "buff": { "radarMultiplier": 1.40 }
  },
  {
    "id": "self_healing_core",
    "name": "Núcleo Self-Healing (PHD-01)",
    "icon": "fa-heart-pulse",
    "color": "#ec4899",
    "description": "Auto-reparación autónoma en caso de impacto con obstáculos o fallos en el clúster.",
    "buff": { "autoRepair": true }
  },
  {
    "id": "conformal_doctorate_mastery",
    "name": "Corona Doctoral Zenodo (PHD Laureate)",
    "icon": "fa-crown",
    "color": "#fbbf24",
    "description": "Aura dorada permanente con todas las estadísticas maximizadas y reconocimiento en el campus virtual.",
    "buff": { "masteryAura": true, "allStatsBoost": 1.5 }
  }
];

