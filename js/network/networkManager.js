// ============================================================================
// Wisrovi Legacy 2.0 - Peer-to-Peer Multiplayer & Interaction Engine
// Author: William Steve Rodriguez Villamizar (wisrovi)
// ============================================================================

export class NetworkManager {
    constructor(player, onPeerUpdate, onPeerEvent) {
        this.player = player;
        this.onPeerUpdate = onPeerUpdate;
        this.onPeerEvent = onPeerEvent;
        this.peers = new Map(); // peerId -> { id, name, position, rotation, level, carColor, lastSeen }
        this.peerMeshes = new Map(); // peerId -> Three.js Mesh
        this.channel = null;
        this.peerId = 'player_' + Math.random().toString(36).substring(2, 9);
        this.broadcastInterval = null;
    }

    init() {
        try {
            this.channel = new BroadcastChannel('wisrovi_legacy_multiverse');
            this.channel.onmessage = (event) => this.handleMessage(event.data);
            console.log(`[Multiplayer] Connected with PeerID: ${this.peerId}`);

            // Start broadcasting presence every 60ms (approx 16-20 updates/sec)
            this.broadcastInterval = setInterval(() => {
                this.broadcastPosition();
            }, 60);

            // Announce join
            this.send({
                type: 'JOIN',
                peerId: this.peerId,
                name: this.player.name,
                level: this.player.level,
                carColor: this.player.carColor || 0x38bdf8
            });

            // Cleanup stale peers every 2 seconds
            setInterval(() => {
                const now = Date.now();
                for (const [id, p] of this.peers.entries()) {
                    if (now - p.lastSeen > 3500) {
                        this.removePeer(id);
                    }
                }
            }, 2000);

            // Handle window unload
            window.addEventListener('beforeunload', () => {
                this.send({ type: 'LEAVE', peerId: this.peerId });
            });

        } catch (e) {
            console.warn("[Multiplayer] BroadcastChannel not supported in this environment:", e);
        }
    }

    send(data) {
        if (this.channel) {
            this.channel.postMessage(data);
        }
    }

    broadcastPosition() {
        if (!this.player) return;
        this.send({
            type: 'UPDATE',
            peerId: this.peerId,
            name: this.player.name,
            level: this.player.level,
            x: Math.round(this.player.x),
            y: Math.round(this.player.y),
            isMoving: Boolean(this.player.isMoving)
        });
    }

    handleMessage(data) {
        if (!data || data.peerId === this.peerId) return;

        switch (data.type) {
            case 'JOIN':
                this.peers.set(data.peerId, {
                    id: data.peerId,
                    name: data.name || 'Explorador',
                    level: data.level || 1,
                    x: 1180,
                    y: 1350,
                    lastSeen: Date.now()
                });
                if (this.onPeerEvent) {
                    this.onPeerEvent('peer_join', { name: data.name, peerId: data.peerId });
                }
                this.broadcastPosition();
                break;

            case 'UPDATE':
                const peer = this.peers.get(data.peerId) || { id: data.peerId };
                peer.name = data.name || peer.name || 'Explorador';
                peer.level = data.level || peer.level || 1;
                peer.x = data.x ?? peer.x ?? 1180;
                peer.y = data.y ?? peer.y ?? 1350;
                peer.isMoving = data.isMoving;
                peer.lastSeen = Date.now();
                this.peers.set(data.peerId, peer);

                if (this.onPeerUpdate) {
                    this.onPeerUpdate(data.peerId, peer);
                }
                break;

            case 'COIN_TRANSFER':
                if (data.targetPeerId === this.peerId) {
                    if (this.onPeerEvent) {
                        this.onPeerEvent('coin_received', {
                            senderName: data.senderName,
                            amount: data.amount
                        });
                    }
                }
                break;

            case 'LEAVE':
                this.removePeer(data.peerId);
                break;
        }
    }

    sendCoins(targetPeerId, amount) {
        if (this.player.coins < amount) return false;
        this.send({
            type: 'COIN_TRANSFER',
            senderPeerId: this.peerId,
            senderName: this.player.name,
            targetPeerId: targetPeerId,
            amount: amount
        });
        return true;
    }

    removePeer(peerId) {
        if (this.peers.has(peerId)) {
            const p = this.peers.get(peerId);
            this.peers.delete(peerId);
            if (this.onPeerEvent) {
                this.onPeerEvent('peer_leave', { name: p.name, peerId: peerId });
            }
        }
    }

    getConnectedPeers() {
        return Array.from(this.peers.values());
    }
}
