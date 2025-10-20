// Sistema de logros para Wisrovi Legacy RPG
// Implementa un sistema de logros y recompensas para enriquecer la experiencia de juego

class AchievementSystem {
    constructor(player, uiManager, missionManager) {
        this.player = player;
        this.uiManager = uiManager;
        this.missionManager = missionManager; // Store a reference to the mission manager
        
        // Lista de logros disponibles
        this.achievements = [
            {
                id: 'first_mission',
                title: 'Primer Paso',
                description: 'Completa tu primera misión',
                icon: '🏆',
                completed: false,
                rewardCoins: 50,
                rewardXP: 25,
                condition: (player) => player.missionsCompleted >= 1
            },
            {
                id: 'explorer',
                title: 'Explorador',
                description: 'Visita todas las zonas del campus',
                icon: '🧭',
                completed: false,
                rewardCoins: 100,
                rewardXP: 50,
                condition: (player) => player.zonesVisited && player.zonesVisited.size >= 8
            },
            {
                id: 'collector',
                title: 'Coleccionista',
                description: 'Obtén al menos una gema de cada color',
                icon: '💎',
                completed: false,
                rewardCoins: 150,
                rewardXP: 75,
                condition: (player) => {
                    return player.gems.azul > 0 && 
                           player.gems.verde > 0 && 
                           player.gems.roja > 0 && 
                           player.gems.violeta > 0;
                }
            },
            {
                id: 'jumper',
                title: 'Saltador Experto',
                description: 'Realiza un salto épico desde gran altura',
                icon: '🚀',
                completed: false,
                rewardCoins: 75,
                rewardXP: 40,
                condition: (player) => player.highestJump && player.highestJump > 6.0
            },
            {
                id: 'speed_demon',
                title: 'Demonio de la Velocidad',
                description: 'Alcanza la velocidad máxima con el coche',
                icon: '🏎️',
                completed: false,
                rewardCoins: 80,
                rewardXP: 35,
                condition: (player) => player.topSpeed && player.topSpeed > 15.0
            },
            {
                id: 'tech_master',
                title: 'Maestro Tecnológico',
                description: 'Completa todas las misiones relacionadas con un proyecto',
                icon: '🧠',
                completed: false,
                rewardCoins: 200,
                rewardXP: 100,
                condition: () => {
                    try {
                        // Verificar si todas las misiones de un mismo proyecto están completadas
                        const projectMissions = this.missionManager.getMissionsByReference('https://github.com/wisrovi/wkafka');
                        return projectMissions.length > 0 && projectMissions.every(mission => mission.status === 'completada');
                    } catch (error) {
                        console.error(`Error al verificar el logro 'tech_master':`, error);
                        return false;
                    }
                }
            },
            {
                id: 'half_way',
                title: 'A Mitad de Camino',
                description: 'Completa 4 misiones',
                icon: '🔄',
                completed: false,
                rewardCoins: 120,
                rewardXP: 60,
                condition: (player) => player.missionsCompleted >= 4
            },
            {
                id: 'rich',
                title: 'Adinerado',
                description: 'Acumula 500 monedas',
                icon: '💰',
                completed: false,
                rewardCoins: 100,
                rewardXP: 50,
                condition: (player) => player.coins >= 500
            },
            {
                id: 'fully_upgraded',
                title: 'Totalmente Mejorado',
                description: 'Adquiere todas las mejoras disponibles',
                icon: '⚡',
                completed: false,
                rewardCoins: 150,
                rewardXP: 80,
                condition: (player) => {
                    return player.upgrades.speed_boost && 
                           player.upgrades.gem_detector && 
                           player.upgrades.visual_custom && 
                           player.upgrades.analysis_boost;
                }
            },
            {
                id: 'master_engineer',
                title: 'Ingeniero Maestro',
                description: 'Completa todas las misiones del juego',
                icon: '🎓',
                completed: false,
                rewardCoins: 300,
                rewardXP: 150,
                condition: (player) => player.missionsCompleted >= 8
            }
        ];
        
        // Logros desbloqueados (para guardar en el estado del juego)
        this.unlockedAchievements = new Set();
        
        // Estadísticas adicionales para logros
        if (!this.player.zonesVisited) {
            this.player.zonesVisited = new Set();
        }
        if (!this.player.missionsCompleted) {
            this.player.missionsCompleted = 0;
        }
        if (!this.player.highestJump) {
            this.player.highestJump = 0;
        }
        if (!this.player.topSpeed) {
            this.player.topSpeed = 0;
        }
    }
    
    // Verificar logros cuando ocurren eventos relevantes
    checkAchievements() {
        let newAchievements = false;
        
        this.achievements.forEach(achievement => {
            // Si ya está completado, no verificar de nuevo
            if (achievement.completed || this.unlockedAchievements.has(achievement.id)) {
                return;
            }
            
            // Verificar condición del logro
            let achieved = false;
            achieved = achievement.condition(this.player);
            
            if (achieved) {
                this.unlockAchievement(achievement);
                newAchievements = true;
            }
        });
        
        // Si se desbloquearon nuevos logros, actualizar UI
        if (newAchievements && this.uiManager) {
            this.uiManager.updateUI();
        }
        
        return newAchievements;
    }
    
    // Desbloquear un logro y otorgar recompensas
    unlockAchievement(achievement) {
        if (this.unlockedAchievements.has(achievement.id)) {
            return false; // Ya desbloqueado
        }
        
        console.log(`Logro desbloqueado: ${achievement.title}`);
        
        // Marcar como completado
        achievement.completed = true;
        this.unlockedAchievements.add(achievement.id);
        
        // Otorgar recompensas
        if (this.player) {
            if (achievement.rewardCoins) {
                this.player.addCoins(achievement.rewardCoins);
            }
            
            if (achievement.rewardXP) {
                this.player.addXP(achievement.rewardXP);
            }
        }
        
        // Mostrar notificación
        if (this.uiManager) {
            const message = `¡Logro desbloqueado! ${achievement.title} - ${achievement.icon}\n+${achievement.rewardCoins} monedas, +${achievement.rewardXP} XP`;
            this.uiManager.showNotification(message, 5000);
        }
        
        return true;
    }
    
    // Actualizar estadísticas relevantes para logros
    updateStats(statType, value) {
        switch(statType) {
            case 'visitZone':
                if (!this.player.zonesVisited) {
                    this.player.zonesVisited = new Set();
                }
                this.player.zonesVisited.add(value);
                break;
                
            case 'completeMission':
                this.player.missionsCompleted = (this.player.missionsCompleted || 0) + 1;
                break;
                
            case 'jump':
                if (value > (this.player.highestJump || 0)) {
                    this.player.highestJump = value;
                }
                break;
                
            case 'speed':
                if (value > (this.player.topSpeed || 0)) {
                    this.player.topSpeed = value;
                }
                break;
        }
        
        // Verificar logros después de actualizar estadísticas
        this.checkAchievements();
    }
    
    // Obtener todos los logros para mostrar en UI
    getAllAchievements() {
        return this.achievements;
    }
    
    // Obtener logros desbloqueados
    getUnlockedAchievements() {
        return this.achievements.filter(achievement => 
            achievement.completed || this.unlockedAchievements.has(achievement.id)
        );
    }
    
    // Obtener logros pendientes
    getPendingAchievements() {
        return this.achievements.filter(achievement => 
            !achievement.completed && !this.unlockedAchievements.has(achievement.id)
        );
    }
    
    // Guardar estado de logros
    getState() {
        return {
            unlockedAchievements: Array.from(this.unlockedAchievements)
        };
    }
    
    // Cargar estado de logros
    loadState(state) {
        if (state && state.unlockedAchievements) {
            this.unlockedAchievements = new Set(state.unlockedAchievements);
            
            // Actualizar estado de completado
            this.achievements.forEach(achievement => {
                achievement.completed = this.unlockedAchievements.has(achievement.id);
            });
            
            return true;
        }
        return false;
    }
}

export { AchievementSystem };
