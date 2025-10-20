import * as THREE from 'three';

// Cache para texturas y materiales
const textureCache = new Map();
const materialCache = new Map();

let scene, camera, renderer;

function init() {
    console.log("Inicializando renderer optimizado...");
    
    // --- Escena ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e); // Fondo oscuro tech
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.015); // Niebla exponencial para mejor rendimiento

    // --- Cámara ---
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 150); // Reducido far plane para rendimiento
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // --- Renderizador con configuración optimizada ---
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: 'high-performance',
        precision: 'highp',
        stencil: false // Desactivado si no se necesita
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limitar pixel ratio para rendimiento
    
    // Optimizaciones de renderizado
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras de calidad
    renderer.outputEncoding = THREE.sRGBEncoding; // Mejor representación de color
    
    // Añadir el canvas del renderizador al contenedor HTML
    const container = document.getElementById('game-container');
    if (container) {
        container.appendChild(renderer.domElement);
    } else {
        console.error("Error: Contenedor del juego 'game-container' no encontrado.");
        document.body.appendChild(renderer.domElement); // Fallback
    }

    // Prevent canvas from capturing keyboard focus
    renderer.domElement.tabIndex = -1;

    // --- Luces optimizadas ---
    const ambientLight = new THREE.AmbientLight(0x404060, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    
    // Optimización de sombras
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    directionalLight.shadow.bias = -0.0005;
    
    scene.add(directionalLight);

    // --- Event Listener para Redimensionar Ventana ---
    window.addEventListener('resize', onWindowResize, false);

    console.log("Motor de renderizado Three.js inicializado con optimizaciones.");
}

// Función para cargar texturas con caché
function loadTexture(path) {
    if (textureCache.has(path)) {
        return textureCache.get(path);
    }
    
    const texture = new THREE.TextureLoader().load(path);
    
    // Optimizaciones de textura
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 1;
    
    textureCache.set(path, texture);
    return texture;
}

// Función para crear materiales con caché
function createMaterial(type, params) {
    const key = type + JSON.stringify(params);
    
    if (materialCache.has(key)) {
        return materialCache.get(key);
    }
    
    let material;
    
    switch(type) {
        case 'standard':
            material = new THREE.MeshStandardMaterial(params);
            break;
        case 'basic':
            material = new THREE.MeshBasicMaterial(params);
            break;
        case 'phong':
            material = new THREE.MeshPhongMaterial(params);
            break;
        default:
            material = new THREE.MeshStandardMaterial(params);
    }
    
    materialCache.set(key, material);
    return material;
}

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function render() {
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Función para liberar recursos correctamente
function disposeObject(obj) {
    if (!obj) return;
    
    // Liberar geometrías y materiales
    if (obj.geometry) {
        obj.geometry.dispose();
    }
    
    if (obj.material) {
        if (Array.isArray(obj.material)) {
            obj.material.forEach(material => {
                if (material.map) material.map.dispose();
                material.dispose();
            });
        } else {
            if (obj.material.map) obj.material.map.dispose();
            obj.material.dispose();
        }
    }
    
    // Recursivamente liberar hijos
    if (obj.children && obj.children.length > 0) {
        for (let i = obj.children.length - 1; i >= 0; i--) {
            disposeObject(obj.children[i]);
        }
    }
}

// Exportar funciones y variables necesarias
export { 
    init, 
    render, 
    scene, 
    camera, 
    loadTexture, 
    createMaterial, 
    disposeObject 
};
