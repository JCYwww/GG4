
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

// 玩家撞到陷阱
export function hitObstacle(player, obstacle) {
    if (gameState.gameOver) return;
    
    // 如果已經在無敵中，直接攔截，防止重疊碰撞瘋狂跳出擊退反應
    if (this.isInvincible) return;

    // 1. 計算擊退方向與力道
    const knockbackX = player.x < obstacle.x ? -250 : 250;
    player.setVelocity(knockbackX, -200); 
    player.setTint(0xff9999); // 讓玩家閃紅光

    // 🎯 核心修正 2：先執行扣血與更新 UI（這樣才不會被 damagePlayer 內部的無敵檢查給攔截）
    console.log("[陷阱觸發] 呼叫 damagePlayer 扣血");
    damagePlayer(this, 1);

    // 🎯 核心修正 3：扣完血後，才「正式啟動無敵狀態」與閃爍動畫
    this.isInvincible = true;

    // 3. 執行無敵閃爍
    this.tweens.add({
        targets: player,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: 4, // 閃爍 4 次，大約半秒
        onComplete: () => {
            player.alpha = 1;
            player.clearTint(); // 恢復原來顏色
            this.isInvincible = false; // ⏳ 閃爍結束，解除無敵，可以再次受傷
            console.log("[陷阱狀態] 解除無敵");
        }
    });
}
