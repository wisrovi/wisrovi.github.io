import * as THREE from 'three';

// Educational snippets related to projects
const eduSnippets = {
    wiliutils: "wiliutils es una colección de utilidades de Python para logging, manejo de archivos y más. ¡Fundamental para empezar!",
    wkafka: "wkafka simplifica la interacción con Apache Kafka, un sistema clave para manejar flujos de datos en tiempo real.",
    wredis: "wredis facilita el uso de Redis, una base de datos en memoria ultrarrápida, ideal para caché y colas.",
    wcontainer: "wcontainer ayuda a gestionar contenedores Docker, esenciales para desplegar aplicaciones de forma aislada y consistente.",
    facial_recognition: "Este proyecto explora cómo identificar caras usando IA. ¡Requiere entender bien los datos y modelos!",
    wyoloservice: "wyoloservice es un sistema complejo para entrenar y servir modelos YOLO (You Only Look Once) para detección de objetos.",
    optuna: "Optuna es una herramienta para optimizar hiperparámetros de modelos de IA, ¡clave para obtener el mejor rendimiento!"
};

const npcData = {
    "profesor_lumen": {
        name: "Profesor Lumen",
        role: "Mentor inicial",
        position: new THREE.Vector3(5, 0, 5),
        // Updated dialogue with educational hint
        dialogue: `¡Bienvenido, ${'Wisrovi Rodriguez'}! Tu viaje para reconstruir el legado de Wisrovi comienza aquí. Empieza por lo básico: explora el campus y busca el panel de logs. ${eduSnippets.wiliutils}`,
        color: 0x00ff00, // Green
        patrolRadius: 3
    },
    "tecnico_otto": {
        name: "Técnico Otto",
        role: "Instalador de módulos",
        position: new THREE.Vector3(-10, 0, 15),
        // Updated dialogue with educational hint
        dialogue: `Necesitas un módulo de análisis, ¿verdad? O quizás reparar algo como esos contenedores... ${eduSnippets.wcontainer} Puedo ayudarte si tienes las piezas.`, 
        color: 0xffa500, // Orange
        patrolRadius: 2
    },
    "analista_vega": {
        name: "Analista Vega",
        role: "Tutor de análisis de datos",
        position: new THREE.Vector3(15, 0, -10),
        // Updated dialogue with educational hint
        dialogue: `Los datos son la clave. Ya sea analizando logs faciales o flujos de Kafka, entenderlos es poder. ${eduSnippets.facial_recognition} ${eduSnippets.wkafka}`,
        color: 0x00ffff, // Cyan
        patrolRadius: 3
    },
    "ia_yulia": {
        name: "IA Yulia",
        role: "Núcleo de Yoloservice",
        position: new THREE.Vector3(-15, 0, -15),
        // Updated dialogue with educational hint and clearer riddle
        dialogue: `Soy Yulia, el núcleo de wyoloservice. ${eduSnippets.wyoloservice} [Acertijo] Proceso imágenes sin ver, aprendo sin memoria fija. Para optimizarme, busca la herramienta que explora posibilidades... ¿Su nombre rima con 'fortuna'? ${eduSnippets.optuna}`,
        color: 0x800080, // Purple
        patrolRadius: 0 // Stays in place
    },
    "mercader_torus": {
        name: "Mercader Torus",
        role: "Comerciante del mercado local",
        position: new THREE.Vector3(25, 0, 25),
        dialogue: "¡Monedas brillantes por mejoras útiles! ¿Velocidad, detección, análisis? ¡Lo tengo todo para acelerar tu búsqueda!",
        color: 0xffff00, // Yellow
        patrolRadius: 1
    }
};

class NPC {
    constructor(id, scene) {
        this.id = id;
        this.data = npcData[id];
        if (!this.data) {
            console.error(`NPC data not found for id: ${id}`);
            return;
        }
        this.scene = scene;
        this.name = this.data.name;
        this.dialogue = this.data.dialogue; // Use the potentially updated dialogue

        // Simple visual placeholder
        const geometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 16);
        const material = new THREE.MeshStandardMaterial({ color: this.data.color || 0xcccccc });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.data.position);
        this.mesh.position.y = 1.5 / 2; // Adjust height
        this.mesh.userData.interactable = true;
        this.mesh.userData.npcId = this.id;
        this.mesh.userData.name = this.name; // Add name to userData for interaction prompt
        this.scene.add(this.mesh);
        
        this.createNameLabel();

        // Animation properties
        this.initialRotationY = this.mesh.rotation.y;
        this.rotationAmplitude = Math.PI / 8;
        this.rotationSpeed = 0.5;

        // Patrol properties
        this.patrolCenter = this.data.position.clone();
        this.patrolRadius = this.data.patrolRadius || 0;
        this.patrolSpeed = 0.5 + Math.random() * 0.5; // Randomize speed slightly
        this.patrolTarget = this.getRandomPatrolPoint();
        this.isMoving = this.patrolRadius > 0;
    }

    getRandomPatrolPoint() {
        if (this.patrolRadius <= 0) return this.patrolCenter.clone();
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.patrolRadius;
        const target = this.patrolCenter.clone();
        target.x += Math.cos(angle) * radius;
        target.z += Math.sin(angle) * radius;
        target.y = this.mesh.position.y; // Keep same height
        return target;
    }

    createNameLabel() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = 'Bold 20px Arial';
        const textWidth = context.measureText(this.name).width;

        canvas.width = textWidth + 10; // Add padding
        canvas.height = 30; 
        context.font = 'Bold 20px Arial';
        context.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Background
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'rgba(255, 255, 255, 0.95)';
        context.fillText(this.name, 5, 22);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const material = new THREE.SpriteMaterial({ map: texture, sizeAttenuation: false }); // sizeAttenuation false keeps size constant
        const sprite = new THREE.Sprite(material);
        
        // Set scale based on canvas size to control its rendered size
        const aspect = canvas.width / canvas.height;
        sprite.scale.set(aspect * 0.5, 0.5, 1.0);

        // Set initial position
        sprite.position.copy(this.mesh.position);
        sprite.position.y += 1.5; // Position label above the mesh

        this.scene.add(sprite);
        this.nameLabel = sprite;
    }

    getInteractionData() {
        return {
            type: 'npc',
            id: this.id,
            name: this.name,
            dialogue: this.dialogue
        };
    }

    update(deltaTime, time) {
        // Rotation animation
        this.mesh.rotation.y = this.initialRotationY + Math.sin(time * this.rotationSpeed) * this.rotationAmplitude;

        // Patrol movement
        if (this.isMoving) {
            const direction = this.patrolTarget.clone().sub(this.mesh.position);
            direction.y = 0; // Ignore vertical difference for movement direction
            const distanceToTarget = direction.length();

            if (distanceToTarget > 0.1) { // If not close enough to target
                direction.normalize();
                const moveDistance = this.patrolSpeed * deltaTime;
                this.mesh.position.add(direction.multiplyScalar(moveDistance));
                // Optional: Make NPC face the direction they are moving (can be jittery)
                // this.mesh.lookAt(this.patrolTarget.x, this.mesh.position.y, this.patrolTarget.z);
            } else {
                // Reached target, get a new one
                this.patrolTarget = this.getRandomPatrolPoint();
            }
        }
        
        // Keep the label above the mesh
        if (this.nameLabel) {
            this.nameLabel.position.copy(this.mesh.position);
            this.nameLabel.position.y += 1.5; // Adjust height as needed
        }
    }
}

export { NPC, npcData, eduSnippets }; // Export eduSnippets too
