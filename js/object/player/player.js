
// 玩家
// 創建、移動、動畫、碰撞重疊

import { gameState } from '../../systems/core/gameState.js';
import { hitBoss } from '../../systems/combat/bossSystem.js';
import { hitObstacle } from '../../systems/world/interactionSystem.js';
import { collectItem } from '../../systems/world/itemSystem.js';
import { collectTablet } from '../../systems/world/worldBuilder.js';
import { setupGhosts } from '../enemies/enemies.js';
import { setupItems } from '../items.js';


// 建立 (總入口)
export function setupEntities() {
    setupPlayer.call(this);
    setupGhosts.call(this);
    setupItems.call(this);
}

// 玩家設定
export function setupPlayer() {
    this.player = this.physics.add.sprite(150, 450, 'player')
        .setScale(0.8)
        .setDepth(3000);
    this.player.clearTint();
    this.player.setTint(0xffffff);
    this.player.setCollideWorldBounds(true);
}

// 玩家動作動畫
export function createPlayerAnimation(scene) {
    if (!scene.anims.exists('left')) {

        scene.anims.create({
            key: 'left',
            frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1
        });

        scene.anims.create({
            key: 'turn',
            frames: [{ key: 'player', frame: 3 }],
            frameRate: 20
        });

        scene.anims.create({
            key: 'right',
            frames: scene.anims.generateFrameNumbers('player', { start: 4, end: 6 }),
            frameRate: 10,
            repeat: -1
        });
    }
}
