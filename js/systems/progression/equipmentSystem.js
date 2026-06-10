// js/systems/equipmentSystem.js
// 道具效果

import { gameState } from '../core/gameState.js';
import { updateInventoryUI } from '../progression/inventorySystem.js'; // 🎯 確保有正確匯入

/**
 * 試圖裝備目前背包選中的道具
 */
export function equipItem(scene) {
    const currentItem = gameState.inventory[gameState.selectedSlot];

    if (!currentItem) {
        return;
    }

    // 檢查這個道具是不是「可裝備的物件」
    if (currentItem === 'bubbleGun') {
        gameState.equipped = currentItem;
        console.log(`⚔️ 成功裝備：${currentItem}！`);

        if (scene.player) {
            scene.player.setTint(0xff99ff); // 裝備拐杖糖變粉色調
        }

        // 🎯 修正：直接呼叫外部分層的更新函式
        updateInventoryUI(scene);
    } else {
        console.log("這個道具不能裝備（可能是消耗品或解謎道具）");
    }
}

/**
 * 檢查玩家背包裡有沒有某個道具
 */
function hasItemInInventory(itemName) {
    return gameState.inventory.includes(itemName);
}

/**
 * 效果 A：計算減傷
 */
export function calculateIncomingDamage(baseDamage) {
    if (hasItemInInventory('bubbleGun')) {
        return Math.max(0.5, baseDamage - 0.5); 
    }
    return baseDamage;
}

/**
 * 效果 B：主動使用選中的道具（滑鼠右鍵或鍵盤觸發）
 */
export function useCurrentItem(scene) {
    const currentSlot = gameState.selectedSlot; // 💡 統一變數名稱為 currentSlot
    const currentItem = gameState.inventory[currentSlot];

    if (!currentItem) return;

    // ─── 糖果補血邏輯 ───
    if (currentItem === 'candy') {
        if (gameState.hp >= gameState.maxHp) {
            console.log("血量已經是滿的，不需要喝藥水！");
            return;
        }
        gameState.hp = Math.min(gameState.maxHp, gameState.hp + 3);
        
        // 扣除道具並「立刻」刷新 UI
        gameState.inventory[currentSlot] = null; 
        updateInventoryUI(scene);
        
        if (scene.hpText) {
            scene.hpText.setText(`${gameState.hp}/${gameState.maxHp}`);
        }
        
        if (scene.player) {
            scene.player.setTint(0x00ff00);
            scene.time.delayedCall(300, () => scene.player.clearTint());
        }
    } 
    
    // ─── 果凍隱身邏輯 ───
    else if (currentItem === 'jelly') {
        if (gameState.isInvisible) {
            console.log("🕵️ 玩家已經在隱身狀態中了！");
            return;
        }

        console.log("🍇 吃了果凍！進入隱身狀態 5 秒...");

        // 1. 在全域狀態紀錄隱身
        gameState.isInvisible = true;

        // 2. 消耗背包道具，並【立刻】呼叫正確的 UI 刷新函式
        gameState.inventory[currentSlot] = null;
        updateInventoryUI(scene);

        // 3. 視覺特效：讓玩家變透明
        if (scene.player) {
            scene.player.setAlpha(0.3);
            scene.player.setTint(0x00ff00); // 吃掉當下閃綠光特效
            scene.time.delayedCall(300, () => scene.player.clearTint());
        }

        // 4. 設定計時器：5 秒後解除隱身
        scene.time.delayedCall(5000, () => {
            gameState.isInvisible = false;
            
            if (scene.player) {
                scene.player.setAlpha(1.0); // 恢復完全可見
                scene.player.setTint(0xffff00); // 閃爍一下黃光提示結束
                scene.time.delayedCall(200, () => scene.player.clearTint());
            }
            console.log("隱身時間結束，現形！");
        });
    }
}