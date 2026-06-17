
//interactionSystem.js

// 互動系統
// 建立地圖、物件、背景、建立 staticGroup

import { gameState } from '../core/gameState.js';
import { MAP_WIDTH, MAP_HEIGHT } from '../../main/config.js';
import { damagePlayer } from '../core/gameOverSystem.js';

export function enterDoor(player, door) {
    this.currentDoor = door;
    if (this.isTeleporting) return;
    this.isTeleporting = true;

    player.setPosition(
        door.targetX,
        door.targetY
    );

    this.time.delayedCall(500, () => {
        this.isTeleporting = false;
    });
}
