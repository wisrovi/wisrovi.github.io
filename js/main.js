import * as THREE from 'three';
import { init as initRenderer, render, scene, camera } from '/js/engine/renderer.js';
import { init as initInput, wasInteractionKeyPressed, wasInventoryKeyPressed, wasHelpKeyPressed, resetKeys } from '/js/engine/input.js';
import { Player } from '/js/game/player.js';
import { World } from '/js/game/world.js';
import { MissionManager } from '/js/game/missions.js';
import { UIManager } from '/js/ui/manager.js';
import { loadGameState, saveGameState } from '/js/utils/saveLoad.js';
import { AchievementSystem } from '/js/game/achievements.js';

let player;
let world;
let missionManager;
let uiManager;
let achievementSystem;

// Make core components accessible globally for save/load and debugging
window.currentGame = {
    player: null,
    missionManager: null,
    uiManager: null,
    world: null,
    achievementSystem: null
};

// Añadir mensajes de depuración para seguir la inicialización
console.log("Script main.js cargado correctamente");

async function initGame() {
    console.log("Inicializando juego...");
    
    try {
        console.log("Inicializando renderer...");
        initRenderer();
        console.log("Renderer inicializado correctamente");
        
        console.log("Inicializando sistema de entrada...");
        initInput();
        console.log("Sistema de entrada inicializado");

        console.log("Creando gestor de misiones...");
        missionManager = new MissionManager();
        await missionManager.loadMissions();
        window.currentGame.missionManager = missionManager;
        console.log("Misiones cargadas:", missionManager.getAvailableMissions().length);

        console.log("Generando mundo...");
        world = new World(scene);
        window.currentGame.world = world;
        console.log("Mundo generado con", Object.keys(world.zones).length, "zonas");

        console.log("Creando jugador (modelo de coche)...");
        player = new Player(scene, camera, world);
        window.currentGame.player = player;
        console.log("Jugador creado en posición:", player.position.x, player.position.y, player.position.z);

        console.log("Inicializando interfaz de usuario...");
        uiManager = new UIManager(player, missionManager);
        window.currentGame.uiManager = uiManager;
        console.log("UI inicializada");

        console.log("Inicializando sistema de logros...");
        achievementSystem = new AchievementSystem(player, uiManager, missionManager);
        window.currentGame.achievementSystem = achievementSystem;
        console.log("Sistema de logros inicializado con", achievementSystem.getAllAchievements().length, "logros disponibles");

        player.setUIManager(uiManager);
        player.setMissionManager(missionManager);
        player.achievementSystem = achievementSystem; // Referencia al sistema de logros
        console.log("Referencias cruzadas establecidas");

        console.log("Intentando cargar partida guardada...");
        const loaded = loadGameState(player, missionManager, achievementSystem);
        if (loaded) {
            console.log("Partida cargada exitosamente");
            uiManager.showNotification("Partida cargada.", 5000);
        } else {
            console.log("No se encontró partida guardada. Iniciando nueva partida");
            uiManager.showWelcomeMessage();
            if (missionManager && !missionManager.getActiveMission() && missionManager.getAvailableMissions().length > 0) {
                 missionManager.startMission(missionManager.getAvailableMissions()[0].id);
                 console.log("Primera misión iniciada:", missionManager.getActiveMission().title);
            }
        }

        uiManager.updateUI();
        console.log("UI actualizada con datos iniciales");

        console.log("Juego inicializado correctamente. Iniciando bucle de animación");
        animate();
    } catch (error) {
        console.error("Error durante la inicialización del juego:", error);
        document.body.innerHTML += `<div style="position:fixed; top:10px; left:10px; background:red; color:white; padding:10px; z-index:1000">
            Error de inicialización: ${error.message}<br>
            Stack: ${error.stack}
        </div>`;
    }
}

const clock = new THREE.Clock();
let lastAchievementCheck = 0;

function animate() {
    try {
        requestAnimationFrame(animate);
        const deltaTime = clock.getDelta();
        const elapsedTime = clock.getElapsedTime(); // Get total elapsed time for animations

        // Update Player
        if (player) {
            player.update(deltaTime);
            
            // Actualizar estadísticas para logros
            if (player.velocity) {
                const speed = player.velocity.length();
                if (speed > 0.5) { // Solo registrar cuando realmente se está moviendo
                    achievementSystem.updateStats('speed', speed);
                }
            }
        }

        // Update NPCs
        if (world && world.npcs) {
            for (const npcId in world.npcs) {
                world.npcs[npcId].update(elapsedTime); // Pass elapsed time to NPC update
            }
        }

        // Check for inventory toggle
        if (wasInventoryKeyPressed() && uiManager) {
            uiManager.toggleInventory();
        }

        // Check for help panel toggle
        if (wasHelpKeyPressed() && uiManager) {
            uiManager.toggleHelp();
        }
        
        // Verificar logros periódicamente (cada 2 segundos)
        if (achievementSystem && elapsedTime - lastAchievementCheck > 2) {
            achievementSystem.checkAchievements();
            lastAchievementCheck = elapsedTime;
        }

        // Render the scene
        render();

        // Reset single-press key flags at the end of the frame
        resetKeys();
    } catch (error) {
        console.error("Error en bucle de animación:", error);
        document.body.innerHTML += `<div style="position:fixed; top:50px; left:10px; background:orange; color:white; padding:10px; z-index:1000">
            Error en animación: ${error.message}
        </div>`;
    }
}

// Añadir un evento para mostrar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM completamente cargado y parseado");
    
    // Añadir un mensaje visible en la página para depuración
    document.body.innerHTML += `<div id="debug-info" style="position:fixed; top:5px; left:5px; background:rgba(0,0,0,0.7); color:white; padding:5px; z-index:1000; font-size:12px;">
        Inicializando juego...
    </div>`;
    
    setTimeout(() => {
        document.getElementById('debug-info').innerHTML += "<br>Iniciando carga del juego...";
        
        initGame().catch(error => {
            console.error("Error durante la inicialización del juego:", error);
            document.getElementById('debug-info').innerHTML += `<br>ERROR: ${error.message}`;
            
            if (window.currentGame.uiManager) {
                window.currentGame.uiManager.showNotification("Error al iniciar el juego. Revisa la consola.", 10000);
            } else {
                alert("Error grave al iniciar el juego. Revisa la consola.");
            }
        });
    }, 1000);
});

document.addEventListener('keydown', (event) => {
    // Save game state with F5
    if (event.key === 'F5') {
        event.preventDefault(); // Prevent browser refresh
        if (player && missionManager && achievementSystem) {
            const saved = saveGameState(player, missionManager, achievementSystem);
            if (saved && uiManager) {
                uiManager.showNotification("Partida guardada.", 3000);
            }
        }
    }
    // Load game state with F9
    else if (event.key === 'F9') {
        event.preventDefault();
        if (player && missionManager && achievementSystem) {
            const loaded = loadGameState(player, missionManager, achievementSystem);
            if (loaded && uiManager) {
                uiManager.showNotification("Partida cargada.", 3000);
                uiManager.updateUI();
            }
        }
    }
});

// Añadir manejador de errores global
window.addEventListener('error', function(event) {
    document.body.innerHTML += `<div style="position:fixed; bottom:10px; left:10px; background:darkred; color:white; padding:10px; z-index:1000">
        Error global: ${event.message}<br>
        En: ${event.filename}:${event.lineno}
    </div>`;
});

console.log("Script main.js completamente procesado");
