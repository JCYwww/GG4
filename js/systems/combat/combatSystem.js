
// 戰鬥管理系統
// 玩家受傷、Boss 行為

import { gameState } from '../core/gameState.js';
import { hitBoss } from '../../systems/combat/bossSystem.js';
import { triggerGameOver } from '../core/gameOverSystem.js';
import { showHintTemporarily } from '../../ui/uiSystem.js';
import { damagePlayer } from '../core/gameOverSystem.js';
import { calculateIncomingDamage } from '../progression/equipmentSystem.js';

// 輔助函數：受傷擊退效果
function applyKnockback(player, enemy) {
    const dir = player.x < enemy.x ? -200 : 200;
    player.setVelocityX(dir);
    player.setVelocityY(-100);
}

// 輔助函數：短暫無敵閃爍
function triggerInvulnerability(scene) {
    scene.isInvincible = true;
    scene.tweens.add({
        targets: scene.player,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: 4,
        onComplete: () => { scene.isInvincible = false; scene.player.setAlpha(1); }
    });
}

// 產生裝備發動時的漂浮文字特效
function triggerEquipmentEffect(scene, player, text) {
    const effectText = scene.add.text(player.x, player.y - 50, text, {
        fontSize: '20px',
        fill: '#ffbb00',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    scene.tweens.add({
        targets: effectText,
        y: effectText.y - 40,
        alpha: 0,
        duration: 800,
        onComplete: () => effectText.destroy()
    });
}

/**
 * 處理敵人攻擊玩家的核心邏輯（裝備反制判定）
 * @param {Phaser.Scene} scene - GameScene 實例
 * @param {Phaser.Physics.Arcade.Sprite} player - 玩家物件
 * @param {Phaser.Physics.Arcade.Sprite} enemy - 敵人物件
 */
/**
 * 處理敵人攻擊玩家的核心邏輯（完全對齊 2026 最新甜點道具美術與 Key）
 * @param {Phaser.Scene} scene - GameScene 實例
 * @param {Phaser.Physics.Arcade.Sprite} player - 玩家物件
 * @param {Phaser.Physics.Arcade.Sprite} enemyAttack - 敵人物件或攻擊特效物件
 */
export function handleEnemyAttack(scene, player, enemyAttack) {
    // 安全鎖：如果玩家目前處於無敵狀態，直接免疫所有攻擊
    if (scene.isInvincible) return;

    // 取得敵人攻擊的類型（例如：'ghost_melee', 'ghost_range', 'shockwave_center' 等）
    const attackType = enemyAttack.texture.key; 
    
    // 取得玩家目前選中並拿在手上的道具 Key（對齊 setupItems：'bubbleGun', 'jelly', 'popcorn', 'marshmallow', 'candy'）
    const currentEquipment = gameState.inventory[gameState.selectedSlot];

    console.log(`⚔️ 戰鬥判定：玩家遭到 [${attackType}] 攻擊！當前手持道具：[${currentEquipment || '空手'}]`);

    // 道具防禦判定 

    // 1. 隱身果凍（jelly）安全防線
    // 如果玩家已經使用了隱身果凍（gameState.isInvisible 為 true），原則上敵人會失去仇恨。
    // 這裡做防呆：隱身狀態下若意外擦撞到任何常規碰撞，直接免疫傷害。
    if (gameState.isInvisible) {
        console.log("玩家處於隱身狀態，擦撞免疫！");
        return;
    }

    // 2. 泡泡糖防護罩（bubbleGun）反制判定
    // 對抗常規近戰幽靈、魔王直接碰撞、以及魔王的「狂暴衝刺」
    if (attackType === 'ghost_melee' || attackType ==='ghost_range' || attackType ==='candy_arrow' || attackType ==='shockwave_left'
        || attackType ==='shockwave_center' || attackType ==='shockwave_right'
    ) {
        if (currentEquipment === 'bubbleGun') {
            triggerEquipmentEffect(scene, player, '防護罩減傷');
            // 鎖定無敵狀態
            scene.isInvincible = true; 
            
            // 輕微扣血（原本裸裝扣 3 點，現在有防護罩只扣 1 點）
            damagePlayer(scene, 1); 
            
            // 觸發受傷擊退與閃爍效果
            if (enemyAttack && enemyAttack.body) {
                applyKnockback(player, enemyAttack);
            }
            triggerInvulnerability(scene);
            return; 
        }
    }

    // 3. 魔王地底震波（shockwave）特殊判定
    // 企劃設計：震波屬於地形殺，無法被泡泡糖防護罩格擋！
    if (attackType === 'shockwave_left' || attackType === 'shockwave_center' || attackType === 'shockwave_right') {
        console.log("🌋 遭到魔王地底震波擊中！此招式無法被防護罩格擋！");
        // 不進入防禦 if，直接流向下方承受 3 點重傷。玩家必須利用 'marshmallow'（棉花糖）跳躍閃躲。
    }


    // ─── 懲罰機制：若沒有對應防禦道具（或遭到無法格擋的招式擊中） ───
    console.log("玩家未持有剋制防具，受到重創！");

    // 毫秒不差地立刻鎖死無敵狀態，避免同畫格重複觸發
    scene.isInvincible = true; 
    
    // 扣除基礎重傷：3 點生命值
    damagePlayer(scene, 3); 
    
    // 執行受傷擊退
    if (enemyAttack && enemyAttack.body) {
        applyKnockback(player, enemyAttack);
    }
    
    // 執行無敵閃爍
    triggerInvulnerability(scene);

    // 玩家受傷受擊變紅視覺特效
    if (player && player.active) {
        player.setTint(0xff0000);
        scene.time.delayedCall(200, () => {
            if (player && player.active) player.clearTint();
        });
    }
}

export function playerAttack(scene) {
    // 取得當前手上拿著的裝備
    const currentWeapon = gameState.inventory[gameState.selectedSlot];

    // 播放揮動或射擊動畫
    scene.player.anims.play('player_attack', true);

    console.log(`玩家使用了 [${currentWeapon || '徒手'}] 進行攻擊！`);

    // 建立一個短暫的攻擊判定區（Hitbox）
    const attackHitbox = scene.add.rectangle(
        scene.player.flipX ? scene.player.x - 40 : scene.player.x + 40,
        scene.player.y,
        40, 40
    );
    scene.physics.add.existing(attackHitbox);
    attackHitbox.body.setAllowGravity(false);

    // 偵測是否打中幽靈
    scene.physics.add.overlap(attackHitbox, scene.ghosts, (box, enemy) => {
        // 表格核心邏輯：如果拿著對應的剋制裝備，造成雙倍傷害或特定特殊效果
        if (currentWeapon === 'mint_belt' && enemy.texture.key === 'ghost_melee') {
            console.log("薄荷腰帶精準打擊近戰幽靈！");
            enemy.takeDamage(2); 
        } else {
            enemy.takeDamage(1); // 普通傷害
        }
    });

    // 0.1 秒後自動銷毀攻擊判定區
    scene.time.delayedCall(100, () => attackHitbox.destroy());
}