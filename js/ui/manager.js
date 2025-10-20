class UIManager {
    constructor(player, missionManager) {
        this.player = player; // Reference to the player object
        this.missionManager = missionManager; // Reference to the mission manager

        // Get references to UI elements from the DOM
        this.missionTrackerElement = document.getElementById("mission-tracker");
        this.resourceDisplayElement = document.getElementById("resource-display");
        this.interactionPromptElement = document.getElementById("interaction-prompt");
        this.dialogueBoxElement = document.getElementById("dialogue-box");
        this.inventoryPanelElement = document.getElementById("inventory-panel");
        this.marketPanelElement = document.getElementById("market-panel");
        this.notificationElement = document.getElementById("game-notification"); // Get notification element
        this.playerNameElement = document.getElementById("player-name-display"); // Element to show player name
        this.helpPanelElement = document.getElementById("help-panel"); // Get help panel element

        // Check if all elements were found
        if (!this.missionTrackerElement || !this.resourceDisplayElement || !this.interactionPromptElement || 
            !this.dialogueBoxElement || !this.inventoryPanelElement || !this.marketPanelElement || 
            !this.notificationElement || !this.playerNameElement || !this.helpPanelElement) {
            console.error("Error: Uno o más elementos de la UI no se encontraron en el DOM. Verifica los IDs en index.html.");
        }

        this.isInventoryVisible = false; // Track inventory visibility
        this.isDialogueVisible = false; // Track dialogue visibility
        this.isMarketVisible = false; // Track market visibility
        this.isHelpVisible = false; // Track help panel visibility
        this.notificationTimeout = null; // Store timeout ID for notifications
        this.selectedItemIndex = null; // Track selected inventory item index

        console.log("UI Manager initialized.");
        this.updateUI(); // Initial UI update
        if (this.marketPanelElement) { 
             this.hideAllPanels(); 
        } else {
             console.warn("Skipping initial hideAllPanels due to missing UI elements.");
        }
        this.updatePlayerNameDisplay(); // Initial name update
    }

    // --- Player Name Display ---
    updatePlayerNameDisplay() {
        if (this.playerNameElement && this.player) {
            this.playerNameElement.textContent = this.player.name || "Jugador";
        }
    }

    // --- Welcome Message ---
    showWelcomeMessage() {
        const messages = [
            { text: `¡Bienvenido, ${this.player.name}!`, duration: 4000 },
            { text: "Usa WASD o las Flechas para moverte.", duration: 4000 },
            { text: "Usa la Barra Espaciadora para saltar.", duration: 4000 },
            { text: "Presiona [E] para interactuar con objetos y personajes.", duration: 5000 },
            { text: "Presiona [I] para abrir tu inventario.", duration: 5000 },
            { text: "Presiona [H] para ver el panel de ayuda.", duration: 5000 },
            { text: "¡Explora el mundo y completa las misiones!", duration: 6000 }
        ];

        let delay = 1000;
        messages.forEach(msg => {
            setTimeout(() => this.showNotification(msg.text, msg.duration), delay);
            delay += msg.duration + 500; // Add a small gap between messages
        });
    }

    // --- Update Core UI Displays ---
    updateMissionTracker() {
        if (!this.missionTrackerElement || !this.missionManager) return;
        const activeMission = this.missionManager.getActiveMission();
        if (activeMission) {
            // Display current step if available
            const currentStepIndex = activeMission.paso_actual || 0;
            const currentStep = activeMission.pasos ? activeMission.pasos[currentStepIndex] : null;
            const stepDescription = currentStep ? currentStep.descripcion : (activeMission.descripcion_corta || activeMission.descripcion);
            
            this.missionTrackerElement.innerHTML = `
                <strong>Misión Activa:</strong> ${activeMission.titulo}<br>
                <em>${stepDescription}</em>
            `;
            this.missionTrackerElement.classList.remove("hidden");
        } else {
            const availableMissions = this.missionManager.getAvailableMissions();
            if (availableMissions.length > 0) {
                 this.missionTrackerElement.innerHTML = `
                    <strong>Próxima Misión:</strong> ${availableMissions[0].titulo}<br>
                    <em>(Busca cómo iniciarla)</em>
                 `;
                 this.missionTrackerElement.classList.remove("hidden");
            } else {
                 this.missionTrackerElement.innerHTML = "¡Todas las misiones completadas!";
            }
        }
    }

    updateResourceDisplay() {
        if (!this.resourceDisplayElement || !this.player) return;
        const coins = this.player.coins || 0;
        const gems = {
            azul: this.player.gems?.azul || 0,
            verde: this.player.gems?.verde || 0,
            roja: this.player.gems?.roja || 0,
            violeta: this.player.gems?.violeta || 0,
        };
        const xp = this.player.xp || 0;
        this.resourceDisplayElement.innerHTML = `
            <strong>Monedas:</strong> ${coins}<br>
            <strong>Gemas:</strong> 
            <span style="color: #6495ED;">A:${gems.azul}</span> 
            <span style="color: #90EE90;">V:${gems.verde}</span> 
            <span style="color: #F08080;">R:${gems.roja}</span> 
            <span style="color: #EE82EE;">P:${gems.violeta}</span><br>
            <strong>XP:</strong> ${xp}
        `;
    }

    // --- Interaction Prompt ---
    showInteractionPrompt(text = "Presiona [E] para interactuar") {
        if (!this.interactionPromptElement) return;
        this.interactionPromptElement.textContent = text;
        this.interactionPromptElement.style.display = "block";
    }

    hideInteractionPrompt() {
        if (!this.interactionPromptElement) return;
        this.interactionPromptElement.style.display = "none";
    }

    // --- Panel Management ---
    hideAllPanels() {
        this.hideDialogue();
        this.hideInventory();
        this.hideMarket();
        this.hideHelp();
    }

    showPanel(panelElement) {
        if (!panelElement) return;
        this.hideAllPanels();
        panelElement.classList.remove("hidden");
    }

    hidePanel(panelElement) {
        if (!panelElement) return;
        panelElement.classList.add("hidden");
    }

    // --- Help Panel ---
    toggleHelp() {
        if (this.isHelpVisible) {
            this.hideHelp();
        } else {
            if (!this.isDialogueVisible && !this.isInventoryVisible && !this.isMarketVisible) {
                this.showHelp();
            }
        }
    }

    showHelp() {
        if (!this.helpPanelElement) return;
        
        // Get mission information for help content
        let missionHelpHTML = "";
        const activeMission = this.missionManager?.getActiveMission();
        const availableMissions = this.missionManager?.getAvailableMissions() || [];
        const completedMissions = Array.from(this.missionManager?.completedMissions || []);
        
        if (activeMission) {
            missionHelpHTML = `
                <h4>Misión Actual: ${activeMission.titulo}</h4>
                <p>${activeMission.descripcion}</p>
                <p><strong>Objetivo:</strong> ${this.getMissionObjectiveText(activeMission)}</p>
            `;
        } else if (availableMissions.length > 0) {
            missionHelpHTML = `
                <h4>Próxima Misión: ${availableMissions[0].titulo}</h4>
                <p>Busca a los NPCs para iniciar esta misión.</p>
            `;
        } else {
            missionHelpHTML = "<p>¡Has completado todas las misiones!</p>";
        }

        // Build the help panel content
        this.helpPanelElement.innerHTML = `
            <div class="help-content">
                <h3>Ayuda - Bitácora de un Ingeniero: El Legado de Wisrovi</h3>
                
                <div class="help-section">
                    <h4>Controles</h4>
                    <ul>
                        <li><strong>Movimiento:</strong> WASD o Flechas</li>
                        <li><strong>Saltar:</strong> Barra Espaciadora</li>
                        <li><strong>Interactuar:</strong> E (cerca de NPCs u objetos)</li>
                        <li><strong>Inventario:</strong> I (Abrir/Cerrar)</li>
                        <li><strong>Ayuda:</strong> H (Abrir/Cerrar)</li>
                        <li><strong>Guardar:</strong> F5</li>
                        <li><strong>Cargar:</strong> F9</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h4>Progreso de Misiones</h4>
                    <p>Misiones completadas: ${completedMissions.length}</p>
                    <p>Misiones disponibles: ${availableMissions.length}</p>
                    ${missionHelpHTML}
                </div>
                
                <div class="help-section">
                    <h4>Consejos</h4>
                    <ul>
                        <li>Habla con los NPCs para obtener información y misiones.</li>
                        <li>Recoge objetos interactuando con ellos (tecla E).</li>
                        <li>Usa el mercado para comprar mejoras con las monedas que consigas.</li>
                        <li>Explora el mundo para descubrir todos los edificios y zonas.</li>
                        <li>Las señales te ayudarán a orientarte en la ciudad.</li>
                        <li>Usa las rampas para saltar y acceder a lugares elevados.</li>
                    </ul>
                </div>
            </div>
            <button onclick="window.currentGame.uiManager.hideHelp()">Cerrar [H]</button>
        `;
        
        this.showPanel(this.helpPanelElement);
        this.isHelpVisible = true;
    }

    hideHelp() {
        this.hidePanel(this.helpPanelElement);
        this.isHelpVisible = false;
    }

    getMissionObjectiveText(mission) {
        if (!mission) return "No hay misión activa";
        
        const currentStepIndex = mission.paso_actual || 0;
        const currentStep = mission.pasos ? mission.pasos[currentStepIndex] : null;
        
        if (!currentStep) return mission.descripcion_corta || "Completa la misión";
        
        switch(currentStep.tipo) {
            case 'recoger':
                return `Recoge el objeto "${currentStep.itemId}"`;
            case 'entregar':
                return `Entrega el objeto "${currentStep.requiredItem}"`;
            case 'interactuar':
                return `Interactúa con "${currentStep.objetoId}"`;
            case 'leer':
                return `Lee la información en "${currentStep.objetoId}"`;
            case 'reparar':
                return `Repara el módulo "${currentStep.objetoId}"`;
            case 'activar':
                return `Activa el dispositivo "${currentStep.objetoId}"`;
            case 'visualizar':
                return `Visualiza los datos en "${currentStep.objetoId}"`;
            default:
                return currentStep.descripcion || "Avanza en la misión";
        }
    }

    // --- Specific Panel Controls ---
    showDialogue(npcName, text, playerName, options = []) { // Added playerName
        if (!this.dialogueBoxElement) return;
        let optionsHTML = options.map((opt, index) => 
            `<button data-option="${index}">${opt.text}</button>`
        ).join("");
        optionsHTML += `<button onclick="window.currentGame.uiManager.hideDialogue()">Cerrar</button>`;
        this.dialogueBoxElement.innerHTML = `
            <h4>${npcName} (Hablando con ${playerName})</h4>
            <p>${text}</p>
            <div class="dialogue-options">${optionsHTML}</div>
        `;
        this.showPanel(this.dialogueBoxElement);
        this.isDialogueVisible = true;
    }

    hideDialogue() {
        this.hidePanel(this.dialogueBoxElement);
        this.isDialogueVisible = false;
    }

    toggleInventory() {
        if (this.isInventoryVisible) {
            this.hideInventory();
        } else {
            if (!this.isDialogueVisible && !this.isMarketVisible && !this.isHelpVisible) { // Also check help
                 this.showInventory();
            }
        }
    }

    showInventory() {
        if (!this.inventoryPanelElement || !this.player || !this.player.inventory) return;
        
        let slotsHTML = "";
        const items = this.player.inventory.items;
        const maxSlots = this.player.inventory.maxSlots;

        for (let i = 0; i < maxSlots; i++) {
            const item = items[i]; // Get item at this slot index
            const isSelected = this.selectedItemIndex === i;
            if (item) {
                slotsHTML += `<div class="inventory-slot ${isSelected ? 'selected' : ''}" data-index="${i}" onclick="window.currentGame.uiManager.selectInventoryItem(${i})">${item.name || 'Objeto'}</div>`;
            } else {
                slotsHTML += `<div class="inventory-slot empty ${isSelected ? 'selected' : ''}" data-index="${i}" onclick="window.currentGame.uiManager.selectInventoryItem(${i})"></div>`;
            }
        }

        // Add action buttons if an item is selected
        let actionsHTML = "";
        if (this.selectedItemIndex !== null && items[this.selectedItemIndex]) {
            actionsHTML = `
                <div id="inventory-actions">
                    <p>Seleccionado: ${items[this.selectedItemIndex].name}</p>
                    <button onclick="window.currentGame.uiManager.dropSelectedItem()">Soltar</button>
                    <!-- Add other actions like 'Usar' here if needed -->
                </div>
            `;
        }

        this.inventoryPanelElement.innerHTML = `
            <h4>Inventario de ${this.player.name} (${items.length}/${maxSlots})</h4>
            <div class="inventory-grid">${slotsHTML}</div>
            ${actionsHTML}
            <button onclick="window.currentGame.uiManager.hideInventory()">Cerrar [I]</button>
        `;
        this.showPanel(this.inventoryPanelElement);
        this.isInventoryVisible = true;
    }

    hideInventory() {
        this.hidePanel(this.inventoryPanelElement);
        this.isInventoryVisible = false;
        this.selectedItemIndex = null; // Deselect item when closing
    }

    selectInventoryItem(index) {
        if (!this.player || !this.player.inventory) return;
        const items = this.player.inventory.items;
        
        // If clicking the same slot and it has an item, keep it selected
        // If clicking an empty slot, deselect
        if (index === this.selectedItemIndex || !items[index]) {
             this.selectedItemIndex = items[index] ? index : null;
        } else {
            this.selectedItemIndex = index;
        }
        
        // Re-render inventory to show selection and actions
        this.showInventory(); 
    }

    dropSelectedItem() {
        if (this.selectedItemIndex === null || !this.player || !this.player.inventory) return;
        
        const itemToDrop = this.player.inventory.items[this.selectedItemIndex];
        if (itemToDrop) {
            // Call player's method to remove the item by its ID
            if (this.player.removeItem(itemToDrop.id)) {
                this.showNotification(`Objeto soltado: ${itemToDrop.name}`);
                this.selectedItemIndex = null; // Deselect after dropping
                this.showInventory(); // Refresh inventory display
            } else {
                this.showNotification("Error al soltar el objeto.");
            }
        } else {
             this.selectedItemIndex = null; // Slot was empty, deselect
             this.showInventory(); // Refresh
        }
    }

    // --- Market Panel ---
    toggleMarket() {
        if (this.isMarketVisible) {
            this.hideMarket();
        } else {
            if (!this.isDialogueVisible && !this.isInventoryVisible && !this.isHelpVisible) {
                 this.showMarket();
            }
        }
    }

    showMarket() {
        if (!this.marketPanelElement || !this.player) return;
        
        const marketItems = [
            { id: 'speed_boost', name: '+Velocidad', cost: 200 },
            { id: 'gem_detector', name: 'Detector Gemas', cost: 350 },
            { id: 'visual_custom', name: 'Visual', cost: 500 },
            { id: 'analysis_boost', name: 'Boost Análisis', cost: 300 }
        ];

        let itemsHTML = marketItems.map(item => {
            const isPurchased = this.player.upgrades[item.id];
            const buttonHTML = isPurchased 
                ? `<span>(Comprado)</span>` 
                : `<button onclick="window.currentGame.uiManager.purchaseItem('${item.id}', ${item.cost})" ${this.player.coins < item.cost ? 'disabled' : ''}>Comprar (${item.cost} monedas)</button>`;
            
            return `
                <div class="market-item ${isPurchased ? 'purchased' : ''}">
                    <h4>${item.name}</h4>
                    <p>${this.getUpgradeDescription(item.id)}</p>
                    ${buttonHTML}
                </div>
            `;
        }).join("");

        this.marketPanelElement.innerHTML = `
            <h4>Mercado - Mejoras</h4>
            <p>Monedas disponibles: ${this.player.coins}</p>
            <div class="market-items">${itemsHTML}</div>
            <button onclick="window.currentGame.uiManager.hideMarket()">Cerrar</button>
        `;
        this.showPanel(this.marketPanelElement);
        this.isMarketVisible = true;
    }

    hideMarket() {
        this.hidePanel(this.marketPanelElement);
        this.isMarketVisible = false;
    }

    purchaseItem(id, cost) {
        if (!this.player) return;
        if (this.player.purchaseUpgrade(id, cost)) {
            this.showMarket(); // Refresh market display after purchase
            this.updateUI(); // Update resource display
        }
    }

    getUpgradeDescription(id) {
        switch (id) {
            case 'speed_boost':
                return "Aumenta tu velocidad de movimiento en un 50%.";
            case 'gem_detector':
                return "Detecta gemas cercanas para las misiones activas.";
            case 'visual_custom':
                return "Personaliza la apariencia de tu personaje.";
            case 'analysis_boost':
                return "Reduce el tiempo de análisis de datos en un 25%.";
            default:
                return "Mejora tu equipamiento.";
        }
    }

    // --- Notification System ---
    showNotification(text, duration = 5000) {
        if (!this.notificationElement) return;
        
        // Clear any existing timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = null;
        }
        
        // Set notification text and show it
        this.notificationElement.textContent = text;
        this.notificationElement.classList.remove("hidden");
        
        // Auto-hide after duration
        this.notificationTimeout = setTimeout(() => {
            this.hideNotification();
        }, duration);
    }
    
    hideNotification() {
        if (!this.notificationElement) return;
        this.notificationElement.classList.add("hidden");
    }

    // --- Gem Detector UI ---
    updateGemDetectorUI(active, proximityFactor = 0, gemColor = null) {
        // Implementation depends on UI design
        // For now, just show a notification if active
        if (active && gemColor) {
            const intensity = Math.round(proximityFactor * 100);
            this.showNotification(`Detector de gemas: ${gemColor.toUpperCase()} (${intensity}% señal)`, 2000);
        }
    }

    // --- Active Upgrades UI ---
    updateActiveUpgrades(upgrades) {
        // Could be implemented with icons or indicators showing active upgrades
        // For now, just update the resource display
        this.updateResourceDisplay();
    }

    // --- Main UI Update ---
    updateUI() {
        this.updateMissionTracker();
        this.updateResourceDisplay();
    }
}

export { UIManager };
