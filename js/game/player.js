import * as THREE from 'three';
import { isKeyDown, wasInteractionKeyPressed } from '/js/engine/input.js'; // Import interaction check

class Player {
    constructor(scene, camera, world) { // Add world reference
        this.scene = scene;
        this.camera = camera;
        this.world = world; // Store world reference to access NPCs and interactables
        this.name = "Wisrovi Rodriguez"; // Player Name
        this.baseSpeed = 8; // Increased base speed for car
        this.speed = this.baseSpeed; // Current speed, can be modified by upgrades
        this.rotationSpeed = 2.8; // Radians per second, adjusted for car
        this.jumpVelocity = 0; // Initial vertical velocity
        this.gravity = -15; // Gravity effect
        this.isGrounded = true;
        this.groundCheckDistance = 0.2; // How far below the player's base to check for ground
        this.interactionDistance = 3.0; // Increased for car model
        this.nearbyInteractable = null; // Store the closest interactable object/NPC
        
        // Improved physics parameters
        this.driftFactor = 0.92; // Car drift factor (1.0 = no drift, lower = more drift)
        this.accelerationFactor = 0.15; // How quickly the car accelerates (higher = faster)
        this.brakingFactor = 0.3; // How quickly the car brakes (higher = faster)
        this.turnInertiaFactor = 0.8; // How much turning affects momentum (lower = more inertia)
        this.suspensionHeight = 0.2; // How much the car tilts when turning
        this.rampBoostFactor = 0.25; // How much boost to apply when hitting ramps
        this.airControlFactor = 0.3; // How much control in the air (0 = none, 1 = full)
        this.engineSound = null; // Will hold engine sound (added later)
        this.lastGroundY = 0; // Track last ground position for suspension
        
        // --- Player Model (Car) ---
        this.defaultBodyColor = 0x3366cc; // Blue car
        this.customBodyColor = 0xff6600; // Orange for visual custom
        
        // Create car model
        this.mesh = new THREE.Group(); // Use a Group to hold all parts
        this.mesh.name = "PlayerCarGroup"; // Name for debugging
        
        // Car body (main chassis)
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: this.defaultBodyColor, 
            metalness: 0.7, 
            roughness: 0.3 
        });
        const bodyGeometry = new THREE.BoxGeometry(1.2, 0.5, 2.0); // Wider, longer, lower
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.position.y = 0.4; // Lower to ground
        this.mesh.add(this.bodyMesh);
        
        // Car roof/cabin
        const roofMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222, 
            metalness: 0.5, 
            roughness: 0.5 
        });
        const roofGeometry = new THREE.BoxGeometry(1.0, 0.4, 1.0);
        this.roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
        this.roofMesh.position.y = 0.85; // Position above body
        this.roofMesh.position.z = -0.2; // Slightly forward from center
        this.mesh.add(this.roofMesh);
        
        // Wheels (4)
        const wheelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            metalness: 0.5, 
            roughness: 0.8 
        });
        const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.2, 16);
        wheelGeometry.rotateZ(Math.PI/2); // Rotate to align with car
        
        // Front left wheel
        this.wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.wheelFL.position.set(-0.7, 0.25, -0.7);
        this.mesh.add(this.wheelFL);
        
        // Front right wheel
        this.wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.wheelFR.position.set(0.7, 0.25, -0.7);
        this.mesh.add(this.wheelFR);
        
        // Rear left wheel
        this.wheelRL = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.wheelRL.position.set(-0.7, 0.25, 0.7);
        this.mesh.add(this.wheelRL);
        
        // Rear right wheel
        this.wheelRR = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.wheelRR.position.set(0.7, 0.25, 0.7);
        this.mesh.add(this.wheelRR);
        
        // Headlights (2)
        const headlightMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffcc, 
            emissive: 0xffffaa,
            emissiveIntensity: 0.5
        });
        const headlightGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.05);
        
        // Left headlight
        this.headlightL = new THREE.Mesh(headlightGeometry, headlightMaterial);
        this.headlightL.position.set(-0.4, 0.4, -1.0);
        this.mesh.add(this.headlightL);
        
        // Right headlight
        this.headlightR = new THREE.Mesh(headlightGeometry, headlightMaterial);
        this.headlightR.position.set(0.4, 0.4, -1.0);
        this.mesh.add(this.headlightR);
        
        // Add spoiler
        const spoilerMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.6,
            roughness: 0.4
        });
        const spoilerGeometry = new THREE.BoxGeometry(1.0, 0.1, 0.3);
        this.spoiler = new THREE.Mesh(spoilerGeometry, spoilerMaterial);
        this.spoiler.position.set(0, 0.7, 0.9);
        this.mesh.add(this.spoiler);
        
        // Add exhaust pipes
        const exhaustMaterial = new THREE.MeshStandardMaterial({
            color: 0x777777,
            metalness: 0.8,
            roughness: 0.2
        });
        const exhaustGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
        exhaustGeometry.rotateX(Math.PI/2);
        
        // Left exhaust
        this.exhaustL = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        this.exhaustL.position.set(-0.3, 0.3, 1.0);
        this.mesh.add(this.exhaustL);
        
        // Right exhaust
        this.exhaustR = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        this.exhaustR.position.set(0.3, 0.3, 1.0);
        this.mesh.add(this.exhaustR);

        // Player Bounding Box (aligned with the body mesh for horizontal collision)
        this.playerBox = new THREE.Box3();
        this.updateBoundingBox(); // Initialize bounding box

        // Position the whole group
        this.mesh.position.set(0, 0, 0); // Base of the car at y=0
        this.mesh.rotation.y = Math.PI; // Car facing forward initially
        this.scene.add(this.mesh);

        // --- Raycaster for Ground Check ---
        this.raycaster = new THREE.Raycaster();
        this.rayOriginOffset = new THREE.Vector3(0, 0.1, 0); // Start ray slightly above player base
        this.rayDirection = new THREE.Vector3(0, -1, 0); // Ray points down

        // --- Camera Offset (adjusted for car) ---
        this.cameraOffset = new THREE.Vector3(0, 3.5, 6); // Slightly higher, further back
        this.cameraLookAtOffset = new THREE.Vector3(0, 0.5, 0); // Look at car body
        this.cameraDynamicOffset = new THREE.Vector3(0, 0, 0); // For dynamic camera movement

        // --- Player State ---
        this.position = this.mesh.position;
        this.rotation = this.mesh.rotation;
        this.velocity = new THREE.Vector3(0, 0, 0); // Track velocity for momentum
        this.coins = 100; // Starting coins
        this.gems = { azul: 0, verde: 0, roja: 0, violeta: 0 }; // Starting gems
        this.xp = 0; // Starting experience
        this.inventory = { // Inventory object
            items: [],
            maxSlots: 12,
        };
        this.upgrades = { // Track purchased upgrades
            speed_boost: false,
            gem_detector: false,
            visual_custom: false,
            analysis_boost: false
        };
        this.analysisTimeMultiplier = 1.0; // For analysis_boost effect
        
        // Track state for effects
        this.isAccelerating = false;
        this.isBraking = false;
        this.isTurning = false;
        this.turnDirection = 0;
        this.airTime = 0;
        this.lastJumpHeight = 0;
        this.suspensionFactor = 0;

        // Reference to Mission Manager (set externally)
        this.missionManager = null;
        // Reference to UI Manager (set externally)
        this.uiManager = null;
    }

    setMissionManager(manager) {
        this.missionManager = manager;
    }

    setUIManager(manager) {
        this.uiManager = manager;
    }

    updateBoundingBox() {
        // Update bounding box based on the body mesh's world position
        if (this.bodyMesh) {
            this.bodyMesh.updateWorldMatrix(true, false);
            this.playerBox.setFromObject(this.bodyMesh);
            // Elevate the box slightly to avoid constant collision with the ground/ramps
            this.playerBox.min.y += 0.1; 
        }
    }

    update(deltaTime) {
        // Reset state tracking
        this.isAccelerating = false;
        this.isBraking = false;
        this.isTurning = false;
        this.turnDirection = 0;
        
        // Apply velocity with drift factor (momentum)
        this.velocity.multiplyScalar(this.driftFactor);
        
        const moveDirection = new THREE.Vector3(0, 0, 0);
        let rotateDirection = 0;

        // --- Movement Input ---
        if (isKeyDown('w') || isKeyDown('arrowup')) {
            moveDirection.z -= 1;
            this.isAccelerating = true;
        }
        if (isKeyDown('s') || isKeyDown('arrowdown')) {
            moveDirection.z += 1;
            this.isBraking = true;
        }
        if (isKeyDown('a') || isKeyDown('arrowleft')) {
            rotateDirection += 1;
            this.isTurning = true;
            this.turnDirection = 1;
        }
        if (isKeyDown('d') || isKeyDown('arrowright')) {
            rotateDirection -= 1;
            this.isTurning = true;
            this.turnDirection = -1;
        }

        // --- Rotation with inertia (only when moving or with momentum) ---
        if (rotateDirection !== 0 && (moveDirection.lengthSq() > 0 || this.velocity.lengthSq() > 0.1)) {
            // Calculate turn speed based on velocity - faster turns at lower speeds
            const velocityMag = this.velocity.length();
            const turnSpeedFactor = Math.max(0.5, Math.min(1.0, 1.0 - (velocityMag * 0.05)));
            
            // Apply rotation with inertia
            this.mesh.rotation.y += rotateDirection * this.rotationSpeed * turnSpeedFactor * deltaTime;
            
            // Apply car tilt based on turn direction (suspension effect)
            const targetTilt = -rotateDirection * this.suspensionHeight * velocityMag * 0.1;
            this.bodyMesh.rotation.z = THREE.MathUtils.lerp(this.bodyMesh.rotation.z, targetTilt, 0.1);
            this.roofMesh.rotation.z = this.bodyMesh.rotation.z;
            
            // Animate wheel rotation when turning
            const wheelTurnAngle = rotateDirection * 0.3; // More pronounced visual turn
            this.wheelFL.rotation.y = wheelTurnAngle;
            this.wheelFR.rotation.y = wheelTurnAngle;
        } else {
            // Reset wheel rotation and car tilt when not turning
            this.wheelFL.rotation.y = THREE.MathUtils.lerp(this.wheelFL.rotation.y, 0, 0.1);
            this.wheelFR.rotation.y = THREE.MathUtils.lerp(this.wheelFR.rotation.y, 0, 0.1);
            this.bodyMesh.rotation.z = THREE.MathUtils.lerp(this.bodyMesh.rotation.z, 0, 0.1);
            this.roofMesh.rotation.z = this.bodyMesh.rotation.z;
        }

        // --- Horizontal Translation Calculation ---
        const horizontalTranslation = new THREE.Vector3();
        
        // Apply acceleration or braking
        if (moveDirection.lengthSq() > 0) {
            moveDirection.normalize();
            moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
            
            if (this.isAccelerating) {
                // Accelerate forward with increasing force
                const accelForce = this.speed * this.accelerationFactor * deltaTime;
                horizontalTranslation.copy(moveDirection).multiplyScalar(accelForce);
                this.velocity.add(horizontalTranslation);
            } else if (this.isBraking) {
                // Apply brakes - stronger effect than just drift
                this.velocity.multiplyScalar(1 - this.brakingFactor * deltaTime * 10);
                
                // Allow slight reverse movement when fully stopped
                if (this.velocity.lengthSq() < 0.1) {
                    const reverseForce = this.speed * 0.3 * deltaTime;
                    horizontalTranslation.copy(moveDirection).multiplyScalar(reverseForce);
                    this.velocity.add(horizontalTranslation);
                }
            }
            
            // Animate wheels rolling based on actual velocity
            const forwardVelocity = this.velocity.dot(new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y));
            const wheelRollSpeed = 5 * Math.abs(forwardVelocity) * deltaTime;
            const wheelDirection = forwardVelocity > 0 ? 1 : -1;
            
            this.wheelFL.rotation.x += wheelRollSpeed * wheelDirection;
            this.wheelFR.rotation.x += wheelRollSpeed * wheelDirection;
            this.wheelRL.rotation.x += wheelRollSpeed * wheelDirection;
            this.wheelRR.rotation.x += wheelRollSpeed * wheelDirection;
        }
        
        // Apply velocity to movement
        horizontalTranslation.copy(this.velocity);
        
        // Reduced air control
        if (!this.isGrounded) {
            // Count air time for tricks
            this.airTime += deltaTime;
            
            // Allow limited steering in air
            if (this.isTurning && this.airTime < 1.5) {
                const airTurnFactor = this.airControlFactor * (1 - Math.min(1, this.airTime / 1.5));
                this.mesh.rotation.y += this.turnDirection * this.rotationSpeed * airTurnFactor * deltaTime;
            }
        } else {
            this.airTime = 0;
        }

        // --- Horizontal Collision Detection & Resolution ---
        this.updateBoundingBox(); // Update box before collision checks
        const currentBox = this.playerBox.clone();

        // --- Refactored and Strengthened Boundary and Collision Checks ---
        
        // 1. World Boundary Check (as per your recommendation)
        const worldBoundary = 98; // Map limits from -98 to 98
        let potentialPosition = this.mesh.position.clone().add(horizontalTranslation);
        let boundaryCollision = false;

        if (potentialPosition.x < -worldBoundary) {
            potentialPosition.x = -worldBoundary;
            this.velocity.x *= -0.5; // Bounce effect
            boundaryCollision = true;
        } else if (potentialPosition.x > worldBoundary) {
            potentialPosition.x = worldBoundary;
            this.velocity.x *= -0.5; // Bounce effect
            boundaryCollision = true;
        }

        if (potentialPosition.z < -worldBoundary) {
            potentialPosition.z = -worldBoundary;
            this.velocity.z *= -0.5; // Bounce effect
            boundaryCollision = true;
        } else if (potentialPosition.z > worldBoundary) {
            potentialPosition.z = worldBoundary;
            this.velocity.z *= -0.5; // Bounce effect
            boundaryCollision = true;
        }

        if (boundaryCollision && this.isGrounded && this.uiManager) {
            this.uiManager.showNotification("¡Límite del mapa alcanzado!", 1500);
        }
        
        // 2. Object Collision Check (after boundary check)
        // We create a target box based on the *corrected* potential position
        const finalTranslation = potentialPosition.clone().sub(this.mesh.position);
        const targetBox = this.playerBox.clone().translate(finalTranslation);

        if (this.checkObjectCollision(targetBox)) {
            // Improved collision: try to slide along the wall
            const tempTranslationX = new THREE.Vector3(finalTranslation.x, 0, 0);
            const targetBoxX = this.playerBox.clone().translate(tempTranslationX);
            if (!this.checkObjectCollision(targetBoxX)) {
                this.mesh.position.x += finalTranslation.x;
                this.velocity.z *= -0.1; // Dampen other axis
            } else {
                this.velocity.x *= -0.3; // Bounce
            }

            const tempTranslationZ = new THREE.Vector3(0, 0, finalTranslation.z);
            const targetBoxZ = this.playerBox.clone().translate(tempTranslationZ);
            if (!this.checkObjectCollision(targetBoxZ)) {
                this.mesh.position.z += finalTranslation.z;
                this.velocity.x *= -0.1; // Dampen other axis
            } else {
                this.velocity.z *= -0.3; // Bounce
            }
        } else {
            // No collision, so we can safely move to the corrected position.
            this.mesh.position.copy(potentialPosition);
        }

        // --- Vertical Movement (Gravity & Jump) & Ground Check using Raycasting ---
        const objectsToCheck = this.world ? this.world.getCollisionObjects() : [];
        const rayOrigin = this.mesh.position.clone().add(this.rayOriginOffset);
        this.raycaster.set(rayOrigin, this.rayDirection);

        const intersects = this.raycaster.intersectObjects(objectsToCheck, true); // Check recursively

        let groundFound = false;
        let groundY = 0;
        const maxGroundDistance = 1.0; // Maximum distance to consider as ground
        let isRamp = false;

        // Find the closest ground below player
        for (const intersect of intersects) {
            if (intersect.distance < maxGroundDistance) {
                groundFound = true;
                groundY = intersect.point.y;
                
                // Check if this is a ramp by examining face normal
                if (intersect.face && intersect.face.normal) {
                    const normal = intersect.face.normal.clone();
                    // Transform the normal to world space
                    normal.transformDirection(intersect.object.matrixWorld);
                    
                    // If normal is not pointing straight up, it's a ramp
                    const upDot = normal.dot(new THREE.Vector3(0, 1, 0));
                    isRamp = upDot < 0.9 && upDot > 0.1;
                }
                break;
            }
        }

        // Apply gravity or place on ground
        if (groundFound) {
            if (!this.isGrounded) {
                // Just landed
                const fallHeight = this.lastJumpHeight - groundY;
                this.jumpVelocity = 0;
                this.isGrounded = true;
                
                // Landing boost for ramps and jumps
                if (fallHeight > 1.0) {
                    // Add forward boost when landing from height
                    const landingDirection = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
                    const boostStrength = Math.min(10, fallHeight * this.rampBoostFactor);
                    this.velocity.add(landingDirection.multiplyScalar(boostStrength));
                    
                    // Show landing effect based on height
                    if (this.uiManager && fallHeight > 3.0) {
                        const trickName = fallHeight > 6.0 ? "¡SALTO ÉPICO!" : "¡Buen Salto!";
                        const xpGain = Math.floor(fallHeight * 2);
                        this.uiManager.showNotification(`${trickName} +${xpGain}XP`, 2000);
                        this.addXP(xpGain);
                    }
                    
                    // Landing suspension effect
                    this.suspensionFactor = Math.min(1.0, fallHeight * 0.1);
                }
            }
            
            // Apply suspension effect
            if (this.suspensionFactor > 0) {
                this.suspensionFactor *= 0.9; // Decay suspension effect
                this.bodyMesh.position.y = 0.4 - this.suspensionFactor * 0.2;
            } else {
                this.bodyMesh.position.y = THREE.MathUtils.lerp(this.bodyMesh.position.y, 0.4, 0.1);
            }
            
            // Place player on ground with slight offset
            this.mesh.position.y = groundY + 0.1; // Small offset to avoid z-fighting
            this.lastGroundY = groundY;
            
            // Jump if space is pressed and on ground
            if (isKeyDown(' ') && this.isGrounded) {
                console.log("Jumping!");
                // Higher jump if on a ramp
                const jumpPower = isRamp ? 10 : 8;
                this.jumpVelocity = jumpPower;
                this.isGrounded = false;
                this.lastJumpHeight = this.mesh.position.y;
                
                // Add a slight forward boost when jumping
                if (this.velocity.lengthSq() > 0.5) {
                    const jumpDirection = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
                    this.velocity.add(jumpDirection.multiplyScalar(0.5));
                }
            }
            
            // Apply ramp effect - boost when going up ramps
            if (isRamp && this.isAccelerating) {
                // Apply a forward and upward boost when accelerating on a ramp
                const rampBoost = new THREE.Vector3(0, 0.8, -1.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
                this.velocity.add(rampBoost.multiplyScalar(deltaTime * 5));
            }
        } else {
            // In air, apply gravity
            this.isGrounded = false;
            this.jumpVelocity += this.gravity * deltaTime;
            this.mesh.position.y += this.jumpVelocity * deltaTime;
            
            // Store vertical velocity for landing effects
            this.velocity.y = this.jumpVelocity;
            
            // Apply car tilt in air based on velocity
            if (this.airTime > 0.2) {
                // Forward/backward tilt based on vertical velocity
                const tiltAmount = Math.max(-0.3, Math.min(0.3, -this.jumpVelocity * 0.02));
                this.bodyMesh.rotation.x = THREE.MathUtils.lerp(this.bodyMesh.rotation.x, tiltAmount, 0.1);
                this.roofMesh.rotation.x = this.bodyMesh.rotation.x;
            }
            
            // Prevent falling below a minimum height
            if (this.mesh.position.y < -10) {
                // Respawn at a safe central location as per your recommendation
                this.mesh.position.set(0, 5, 0); 
                this.jumpVelocity = 0;
                this.velocity.set(0, 0, 0);
                
                // Notify the player
                if (this.uiManager) {
                    this.uiManager.showNotification("¡Te has salido del mapa!", 2000);
                }
            }
        }

        // --- Update Camera Position ---
        this.updateCamera(deltaTime);

        // --- Check for Interaction ---
        this.checkInteractables();
        if (wasInteractionKeyPressed()) {
            console.log("Interaction key detected, interacting...");
            this.interact();
        }
        
        // --- Apply Upgrade Effects ---
        this.applyUpgradeEffects();
    }

    updateCamera(deltaTime) {
        if (!this.camera) return;
        
        // Calculate dynamic camera offset based on speed and air time
        const speedFactor = Math.min(1, this.velocity.length() / 15);
        const heightFactor = !this.isGrounded ? Math.min(1, this.airTime * 0.5) : 0;
        
        // Move camera back and up when going fast or in air
        this.cameraDynamicOffset.z = THREE.MathUtils.lerp(
            this.cameraDynamicOffset.z, 
            speedFactor * 2 + heightFactor * 2, 
            deltaTime * 2
        );
        this.cameraDynamicOffset.y = THREE.MathUtils.lerp(
            this.cameraDynamicOffset.y, 
            heightFactor * 2, 
            deltaTime * 2
        );
        
        // Add slight camera tilt when turning
        const tiltFactor = this.isTurning ? this.turnDirection * 0.05 * speedFactor : 0;
        
        // Calculate target camera position based on player position, rotation and dynamic offset
        const totalOffset = this.cameraOffset.clone().add(this.cameraDynamicOffset);
        const cameraTargetPosition = new THREE.Vector3();
        cameraTargetPosition.copy(totalOffset);
        cameraTargetPosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
        cameraTargetPosition.add(this.mesh.position);

        // Set camera position with smooth lerp
        this.camera.position.lerp(cameraTargetPosition, deltaTime * 5);
        
        // Add camera tilt
        this.camera.rotation.z = THREE.MathUtils.lerp(this.camera.rotation.z, tiltFactor, deltaTime * 3);

        // Calculate target look-at position
        const lookAtPosition = new THREE.Vector3();
        lookAtPosition.copy(this.cameraLookAtOffset);
        lookAtPosition.add(this.mesh.position);

        // Make camera look at player
        this.camera.lookAt(lookAtPosition);
    }

    checkInteractables() {
        if (!this.world) return;
        
        // Get all interactable objects from the world
        const interactables = this.world.getInteractableObjects();
        if (!interactables || interactables.length === 0) return;
        
        // Find the closest interactable within range
        let closestDistance = this.interactionDistance;
        let closestInteractable = null;
        
        for (const obj of interactables) {
            if (!obj) continue;
            
            const distance = this.mesh.position.distanceTo(obj.position);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestInteractable = obj;
            }
        }
        
        // Update UI based on closest interactable
        if (closestInteractable !== this.nearbyInteractable) {
            this.nearbyInteractable = closestInteractable;
            
            if (this.nearbyInteractable && this.uiManager) {
                const text = this.nearbyInteractable.userData.interactionText || "Presiona [E] para interactuar";
                this.uiManager.showInteractionPrompt(text);
            } else if (this.uiManager) {
                this.uiManager.hideInteractionPrompt();
            }
        }
    }

    interact() {
        if (!this.nearbyInteractable || !this.missionManager) return;
        
        const interactable = this.nearbyInteractable;
        const userData = interactable.userData;
        
        // Check if this is an NPC
        if (userData.isNPC) {
            console.log(`Interacting with NPC: ${userData.name || 'Unknown NPC'}`);
            
            // Get NPC object from world using ID
            const npc = this.world.npcs[userData.id];
            if (npc && this.uiManager) {
                npc.interact(this, this.uiManager);
            }
            return;
        }
        
        // Handle interaction based on type
        switch(userData.interactionType) {
            case 'collectible_item':
                this.collectItem(interactable);
                break;
            case 'mission_panel':
                this.readPanel(interactable);
                break;
            case 'mission_object':
                this.interactWithMissionObject(interactable);
                break;
            case 'market':
                this.openMarket(interactable);
                break;
            default:
                console.log(`Unknown interaction type: ${userData.interactionType}`);
        }
    }

    collectItem(interactable) {
        const userData = interactable.userData;
        if (!userData || !userData.itemId) return;
        
        console.log(`Collecting item: ${userData.itemId}`);
        
        // Check if we have space in inventory
        if (this.inventory.items.length >= this.inventory.maxSlots) {
            if (this.uiManager) {
                this.uiManager.showNotification("¡Inventario lleno!", 3000);
            }
            return;
        }
        
        // Add item to inventory
        this.inventory.items.push({
            id: userData.itemId,
            name: userData.itemName || userData.itemId,
            description: userData.itemDescription || "Un objeto interesante",
            icon: userData.itemIcon || "default_item"
        });
        
        // Update mission if this is a mission item
        if (this.missionManager) {
            this.missionManager.updateMissionProgress('recoger', userData.itemId);
        }
        
        // Show notification
        if (this.uiManager) {
            this.uiManager.showNotification(`Recogido: ${userData.itemName || userData.itemId}`, 3000);
            this.uiManager.updateUI();
        }
        
        // Remove item from world
        this.scene.remove(interactable);
        this.world.removeInteractable(interactable);
        this.nearbyInteractable = null;
    }

    readPanel(interactable) {
        const userData = interactable.userData;
        if (!userData) return;
        
        console.log(`Reading panel: ${userData.id}`);
        
        // Update mission progress if this is a mission panel
        if (this.missionManager) {
            this.missionManager.updateMissionProgress('interactuar', userData.id);
        }
        
        // Show panel content
        if (this.uiManager && userData.content) {
            this.uiManager.showDialogue(userData.title || "Panel Informativo", userData.content);
        }
    }

    interactWithMissionObject(interactable) {
        const userData = interactable.userData;
        if (!userData || !userData.id) return;
        
        console.log(`Interacting with mission object: ${userData.id}`);
        
        // Check if we need to deliver an item
        if (userData.requiresItem) {
            // Find item in inventory
            const itemIndex = this.inventory.items.findIndex(item => item.id === userData.requiresItem);
            if (itemIndex === -1) {
                if (this.uiManager) {
                    this.uiManager.showNotification(`Necesitas ${userData.requiresItemName || userData.requiresItem}`, 3000);
                }
                return;
            }
            
            // Remove item from inventory
            this.inventory.items.splice(itemIndex, 1);
            
            // Update UI
            if (this.uiManager) {
                this.uiManager.updateUI();
                this.uiManager.showNotification(`Entregado: ${userData.requiresItemName || userData.requiresItem}`, 3000);
            }
        }
        
        // Update mission progress
        if (this.missionManager) {
            const actionType = userData.requiresItem ? 'entregar' : 'interactuar';
            this.missionManager.updateMissionProgress(actionType, userData.id);
        }
        
        // Show interaction content if available
        if (this.uiManager && userData.content) {
            this.uiManager.showDialogue(userData.title || "Interacción", userData.content);
        }
    }

    openMarket(interactable) {
        if (!this.uiManager) return;
        
        console.log("Opening market");
        this.uiManager.showMarket(this);
    }

    applyUpgradeEffects() {
        // Reset to base values first
        this.speed = this.baseSpeed;
        this.bodyMesh.material.color.setHex(this.defaultBodyColor);
        
        // Apply each upgrade effect
        if (this.upgrades.speed_boost) {
            this.speed *= 1.5; // 50% speed boost
        }
        
        if (this.upgrades.visual_custom) {
            this.bodyMesh.material.color.setHex(this.customBodyColor);
        }
        
        if (this.upgrades.analysis_boost) {
            this.analysisTimeMultiplier = 0.5; // 50% faster analysis
        }
        
        // Gem detector effect is handled in UI
    }

    purchaseUpgrade(upgradeId) {
        const upgradeCosts = {
            speed_boost: 50,
            gem_detector: 75,
            visual_custom: 30,
            analysis_boost: 100
        };
        
        if (!upgradeCosts[upgradeId]) {
            console.log(`Unknown upgrade: ${upgradeId}`);
            return false;
        }
        
        const cost = upgradeCosts[upgradeId];
        
        // Check if already purchased
        if (this.upgrades[upgradeId]) {
            console.log(`Upgrade already purchased: ${upgradeId}`);
            return false;
        }
        
        // Check if enough coins
        if (this.coins < cost) {
            console.log(`Not enough coins for upgrade: ${upgradeId}`);
            return false;
        }
        
        // Purchase upgrade
        this.coins -= cost;
        this.upgrades[upgradeId] = true;
        
        // Apply effect immediately
        this.applyUpgradeEffects();
        
        console.log(`Purchased upgrade: ${upgradeId}`);
        return true;
    }

    addCoins(amount) {
        this.coins += amount;
        if (this.uiManager) {
            this.uiManager.updateUI();
        }
    }

    addGem(type, amount = 1) {
        if (this.gems[type] !== undefined) {
            this.gems[type] += amount;
            if (this.uiManager) {
                this.uiManager.updateUI();
            }
        }
    }

    addXP(amount) {
        this.xp += amount;
        if (this.uiManager) {
            this.uiManager.updateUI();
        }
    }

    dropItem(index) {
        if (index < 0 || index >= this.inventory.items.length) return false;
        
        const item = this.inventory.items[index];
        console.log(`Dropping item: ${item.name}`);
        
        // Remove from inventory
        this.inventory.items.splice(index, 1);
        
        // Update UI
        if (this.uiManager) {
            this.uiManager.updateUI();
        }
        
        return true;
    }

    checkObjectCollision(targetBox) {
        if (!this.world) return false;
        const structures = this.world.getCollisionObjects(true);

        for (const struct of structures) {
            if (!struct.geometry) continue;

            const structBox = new THREE.Box3().setFromObject(struct);

            if (targetBox.intersectsBox(structBox)) {
                return true; // Collision detected
            }
        }

        return false; // No collision
    }
}

export { Player };
