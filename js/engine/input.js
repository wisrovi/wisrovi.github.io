const keys = {};
let interactionKeyPressed = false; // Flag for single press detection
let inventoryKeyPressed = false; // Flag for inventory toggle
let helpKeyPressed = false; // Flag for help panel toggle

function init() {
    window.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        keys[key] = true;
        console.log("Key down:", key);

        // Check for interaction key press (E or Space)
        if ((key === 'e' || key === ' ') && !interactionKeyPressed) {
            interactionKeyPressed = true; // Set flag on first press
            console.log("Interaction key pressed");
        }

        // Check for inventory key press (I)
        if (key === 'i' && !inventoryKeyPressed) {
            inventoryKeyPressed = true; // Set flag on first press
        }

        // Check for help key press (H)
        if (key === 'h' && !helpKeyPressed) {
            helpKeyPressed = true; // Set flag on first press
        }

        // Prevent default space bar scroll
        if (key === ' ') {
            event.preventDefault();
        }
    });

    window.addEventListener("keyup", (event) => {
        const key = event.key.toLowerCase();
        keys[key] = false;
        console.log("Key up:", key);

        // Reset interaction key flag on release
        if (key === 'e' || key === ' ') {
            interactionKeyPressed = false;
            console.log("Interaction key released");
        }
        // Reset inventory key flag on release
        if (key === 'i') {
            inventoryKeyPressed = false;
        }
        // Reset help key flag on release
        if (key === 'h') {
            helpKeyPressed = false;
        }
    });
    console.log("Input initialized.");
}

function isKeyDown(key) {
    return keys[key.toLowerCase()] || false;
}

// Function to check if interaction key was just pressed (single trigger)
function wasInteractionKeyPressed() {
    if (interactionKeyPressed) {
        // No longer consumes the event here
        return true; 
    }
    return false;
}

// Function to check if inventory key was just pressed (single trigger)
function wasInventoryKeyPressed() {
    if (inventoryKeyPressed) {
        // No longer consumes the event here
        return true; 
    }
    return false;
}

// Function to check if help key was just pressed (single trigger)
function wasHelpKeyPressed() {
    if (helpKeyPressed) {
        // No longer consumes the event here
        return true; 
    }
    return false;
}

// New function to reset single-press flags at the end of a frame
function resetKeys() {
    interactionKeyPressed = false;
    inventoryKeyPressed = false;
    helpKeyPressed = false;
}

export { init, isKeyDown, wasInteractionKeyPressed, wasInventoryKeyPressed, wasHelpKeyPressed, resetKeys };
