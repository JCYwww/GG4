
//碰撞重疊
import { collectItem } from '../../systems/world/itemSystem.js';
import { collectTablet } from '../../systems/world/worldBuilder.js';
import { handleEnemyAttack } from '../../systems/combat/combatSystem.js';
import { spawnBoss } from '../../systems/combat/bossSystem.js';
import { gameState } from '../../systems/core/gameState.js';


export function setupPlayerCollisions() {
    
    //scene 代表 GameScene
    const scene = this; 

    // 碰撞 
    scene.physics.add.collider(scene.player, scene.platforms);

    // 門觸發
    if (scene.doors) {
        scene.physics.add.overlap(
            scene.player,
            scene.doors,
            (player, door) => {
                const dist = Phaser.Math.Distance.Between(player.x, player.y, door.x, door.y);

                if (dist < 80) {
                    scene.currentDoor = door;
                }
            },
            null,
            scene
        );
    }

    // 裝備觸發
    if (scene.items) {
        scene.physics.add.overlap(
            scene.player,
            scene.items,
            (player, item) => {
                scene.nearbyItem = item; // 標記附近有道具，供 GameScene 的 update 監聽按 E 撿起
            },
            null,
            scene
        );
    }
        
    // 幽靈撞擊
    if (scene.ghosts) {
        scene.physics.add.overlap(
            scene.player, 
            scene.ghosts, 
            (player, enemy) => {
                // 3. 通過過濾後，才真正執行受傷判斷
                handleEnemyAttack(scene, player, enemy);
            }, 
            // 🎯 1. 關鍵核心：加入第四個參數 processCallback
            (player, enemy) => {
                // 2. 這是 Phaser 物理層的最高警報！如果玩家正處於無敵狀態，
                // 直接在物理底層「回傳 false」，強行中斷這次重疊事件，一丁點扣血程式都不會被觸發！
                if (scene.isInvincible) return false;
                return true;
            }, 
            scene
        );
    }

    // 記憶碎片觸發
    if (scene.tablets) {
        scene.physics.add.overlap(
            scene.player, 
            scene.tablets, 
            (player, tablet) => {
                scene.nearbyTablet = tablet; // 標記目前靠近的記憶碎片
            }, 
            null, 
            scene
        );
    }

}