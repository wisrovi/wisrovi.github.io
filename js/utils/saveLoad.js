// --- Save/Load Functions ---

const SAVE_KEY = "wisroviLegacySave";

function saveGameState(player, missionManager, achievementSystem = null) {
    if (!player || !missionManager) {
        console.error("Player or MissionManager not available for saving.");
        return false;
    }
    try {
        const saveData = {
            player: player.getSaveData(),
            missions: missionManager.getSaveData(),
            timestamp: new Date().toISOString()
            // Add other system data as needed
        };
        
        // Guardar datos de logros si está disponible
        if (achievementSystem) {
            saveData.achievements = achievementSystem.getState();
        }
        
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        console.log("Game state saved.");
        return true;
    } catch (error) {
        console.error("Error saving game state:", error);
        // Optionally notify the user
        return false;
    }
}

function loadGameState(player, missionManager, achievementSystem = null) {
    if (!player || !missionManager) {
        console.error("Player or MissionManager not available for loading.");
        return false;
    }
    const savedString = localStorage.getItem(SAVE_KEY);
    if (savedString) {
        try {
            const saveData = JSON.parse(savedString);
            console.log("Loading save data from:", saveData.timestamp || "Unknown time");
            
            // Load data into systems
            if (saveData.player) player.loadSaveData(saveData.player);
            if (saveData.missions) missionManager.loadSaveData(saveData.missions);
            
            // Cargar datos de logros si está disponible
            if (achievementSystem && saveData.achievements) {
                achievementSystem.loadState(saveData.achievements);
            }
            
            console.log("Game state loaded from localStorage.");
            return true;
        } catch (error) {
            console.error("Error parsing or loading game state:", error);
            localStorage.removeItem(SAVE_KEY); // Clear corrupted save
            return false;
        }
    } else {
        console.log("No save game found in localStorage.");
        return false;
    }
}

export { saveGameState, loadGameState };
