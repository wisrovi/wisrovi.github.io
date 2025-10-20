// Represents a single mission
// We can work directly with the JSON objects for now, or create a class later if needed.
// class Mission {
//     constructor(data) {
//         this.id = data.id;
//         this.titulo = data.titulo;
//         this.descripcion = data.descripcion;
//         this.recompensa_gemas = data.recompensa_gemas;
//         this.color_gema = data.color_gema;
//         this.referencia = data.referencia;
//         this.status = data.status || "bloqueada"; // disponible, activa, completada, bloqueada
//         // Add prerequisites later if needed, e.g., requires_mission_id: null
//     }
// }

class MissionManager {
    constructor() {
        this.missions = {}; // Store missions by ID
        this.activeMission = null;
        this.completedMissions = new Set();
        this.missionsLoaded = false;
    }

    async loadMissions(filePath = "assets/data/missions.json") {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const missionsData = await response.json();
            
            this.missions = {}; // Reset before loading
            missionsData.forEach(data => {
                // Basic validation
                if (data.id !== undefined) {
                    this.missions[data.id] = { ...data }; // Store plain object copy
                    // Initialize status if missing (although JSON has it)
                    if (!this.missions[data.id].status) {
                        this.missions[data.id].status = (data.id === 1) ? "disponible" : "bloqueada";
                    }
                } else {
                    console.warn("Mission data missing ID:", data);
                }
            });
            this.missionsLoaded = true;
            console.log(`Cargadas ${Object.keys(this.missions).length} misiones desde ${filePath}`);
            this.updateAvailableMissions(); // Initial check after loading

        } catch (error) {
            console.error("Error al cargar las misiones:", error);
            this.missionsLoaded = false;
        }
    }

    getMissionById(id) {
        return this.missions[id] || null;
    }

    getAvailableMissions() {
        return Object.values(this.missions).filter(m => m.status === "disponible");
    }

    getActiveMission() {
        return this.activeMission;
    }

    startMission(id) {
        const mission = this.getMissionById(id);
        if (mission && mission.status === "disponible") {
            if (this.activeMission) {
                console.warn(`Ya hay una misión activa: ${this.activeMission.titulo}. No se puede iniciar ${mission.titulo}.`);
                return false; // Allow only one active mission for simplicity
            }
            mission.status = "activa";
            this.activeMission = mission;
            console.log(`Misión iniciada: ${mission.titulo}`);
            // Potentially update UI here or emit an event
            return true;
        } else if (!mission) {
            console.error(`Misión con ID ${id} no encontrada.`);
        } else {
            console.warn(`Misión ${mission.titulo} no está disponible (estado: ${mission.status}).`);
        }
        return false;
    }

    completeMission(id) {
        const mission = this.getMissionById(id);
        if (mission && this.activeMission && this.activeMission.id === id) {
            mission.status = "completada";
            this.completedMissions.add(id);
            const completedMission = this.activeMission;
            this.activeMission = null;
            console.log(`Misión completada: ${completedMission.titulo}`);
            
            // Unlock next mission(s) - Simple linear unlock for now
            this.updateAvailableMissions();

            // Return completed mission data for reward handling elsewhere
            return completedMission; 
        } else if (!mission) {
            console.error(`Misión con ID ${id} no encontrada.`);
        } else if (!this.activeMission || this.activeMission.id !== id) {
            console.warn(`Misión ${mission.titulo} no es la misión activa.`);
        } else {
             console.warn(`Misión ${mission.titulo} ya está completada o en estado inválido.`);
        }
        return null;
    }

    // Simple linear unlock: makes the next mission available if the current one is completed
    updateAvailableMissions() {
        const nextMissionId = this.completedMissions.size + 1;
        const nextMission = this.getMissionById(nextMissionId);
        if (nextMission && nextMission.status === "bloqueada") {
            // Check if all previous missions are complete (simple check for linear progression)
            let allPreviousComplete = true;
            for (let i = 1; i < nextMissionId; i++) {
                if (!this.completedMissions.has(i)) {
                    allPreviousComplete = false;
                    break;
                }
            }
            if (allPreviousComplete) {
                 nextMission.status = "disponible";
                 console.log(`Misión desbloqueada: ${nextMission.titulo}`);
            }
        }
    }

    isCompleted(id) {
        return this.completedMissions.has(id);
    }

    // Obtener misiones por una referencia específica (ej. URL de proyecto)
    getMissionsByReference(reference) {
        return Object.values(this.missions).filter(m => m.referencia === reference);
    }

    // --- Save/Load --- (Implement using localStorage later)
    getSaveData() {
        return {
            activeMissionId: this.activeMission ? this.activeMission.id : null,
            completedMissions: Array.from(this.completedMissions),
            // We might need to save the status of all missions if progression isn't strictly linear
            allMissionStatuses: Object.values(this.missions).map(m => ({ id: m.id, status: m.status }))
        };
    }

    loadSaveData(data) {
        if (!this.missionsLoaded) {
            console.error("Intentando cargar estado de misiones antes de que se carguen las misiones.");
            return;
        }
        this.completedMissions = new Set(data.completedMissions || []);
        const activeId = data.activeMissionId;
        this.activeMission = activeId ? this.getMissionById(activeId) : null;

        // Restore all statuses (important if loading mid-game)
        if (data.allMissionStatuses) {
            data.allMissionStatuses.forEach(savedStatus => {
                if (this.missions[savedStatus.id]) {
                    this.missions[savedStatus.id].status = savedStatus.status;
                }
            });
        } else {
            // Fallback if old save format: recalculate statuses based on completed/active
            Object.values(this.missions).forEach(m => {
                if (this.completedMissions.has(m.id)) {
                    m.status = "completada";
                } else if (this.activeMission && this.activeMission.id === m.id) {
                    m.status = "activa";
                } else {
                    // Recalculate available/blocked based on completed (simple linear)
                    let isBlocked = true;
                    if (m.id === 1 && !this.completedMissions.has(1) && (!this.activeMission || this.activeMission.id !== 1)) {
                        isBlocked = false; // First mission is available if not done/active
                    } else if (m.id > 1 && this.completedMissions.has(m.id - 1) && !this.completedMissions.has(m.id) && (!this.activeMission || this.activeMission.id !== m.id)) {
                         isBlocked = false; // Available if previous is done and this isn't done/active
                    }
                    m.status = isBlocked ? "bloqueada" : "disponible";
                }
            });
        }
        
        // Ensure activeMission status is consistent
        if (this.activeMission && this.activeMission.status !== 'activa') {
             console.warn(`Misión activa ${this.activeMission.id} tenía estado inconsistente ${this.activeMission.status}, corrigiendo a 'activa'.`);
             this.activeMission.status = 'activa';
        }

        console.log("Estado de misiones cargado.");
    }
}

export { MissionManager };
