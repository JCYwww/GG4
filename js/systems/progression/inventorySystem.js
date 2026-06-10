// 檔案位置：js/systems/progression/inventorySystem.js

// 裝備欄資料、UI
import { gameState } from '../core/gameState.js';
import { spawnItem } from '../world/itemSystem.js';

// 初始化建立裝備欄 UI
export function setupInventoryUI(scene) {
    // 💡 完美同步 uiSystem 規劃的精美 UI 座標位置 (Y: 140)
    const slotY = 140; 
    scene.slotPositions = [
        { x: 80, y: slotY },  // 第一格
        { x: 180, y: slotY }, // 第二格
        { x: 280, y: slotY }  // 第三格
    ];
    
    scene.inventorySlots = []; 
    scene.inventoryIcons = []; // 初始化空陣列，裝未來的道具圖示

    // 動態產生三個裝備格子與對應的空圖示
    scene.slotPositions.forEach((pos, index) => {
        // 1. 產生底格 (使用精美圖片 slot_bg)
        const slot = scene.add.image(pos.x, pos.y, 'slot_bg')
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0) 
            .setDepth(1800)
            .setScale(0.17);

        // 💡 紀錄最後點擊時間，用來偵測雙擊
        let lastClickTime = 0;

        slot.on('pointerdown', () => {
            const currentTime = scene.time.now;
            const clickDelay = currentTime - lastClickTime;
            lastClickTime = currentTime;

            // ─── 【雙擊邏輯】：打開說明面板 ───
            if (clickDelay < 300 && gameState.inventory[index]) {
                const itemDescriptions = scene.itemDescriptions || {
                    'bubbleGun': { name: '泡泡糖防護罩', effect: '按下 滑鼠右鍵 使用後，受到傷害減半' },
                    'jelly': { name: '隱身果凍', effect: '按下 滑鼠右鍵 使用後，隱身 5 秒' },
                    'popcorn': { name: '爆米花花', effect: '跑速提升' },
                    'marshmallow': { name: '雲朵棉花糖', effect: '跳躍力提升' },
                    'candy': { name: '彩虹生命糖', effect: '按下 滑鼠右鍵 使用後，恢復 3 點 HP' }
                };

                const itemInfo = itemDescriptions[gameState.inventory[index]] || {
                    name: gameState.inventory[index],
                    effect: '未知道具'
                };

                if (scene.descTitle && scene.descPanel) {
                    scene.descTitle.setText(itemInfo.name);
                    scene.descContent.setText(itemInfo.effect);
                    scene.descPanel.setVisible(true);

                    scene.physics.pause();
                    gameState.puzzleActive = true;
                }
                return; // 雙擊時直接彈出說明，不重複觸發單擊的刷新
            }

            // ─── 【單擊邏輯】：選取道具格子 ───
            gameState.selectedSlot = index;
            // 點擊時同步黃框位置
            if (scene.selectFrame) {
                scene.selectFrame.setPosition(pos.x, pos.y);
            }
            updateInventoryUI(scene);
        });
        scene.inventorySlots.push(slot);

        // 2. 在正中央產生「道具圖示物件」，預設隱藏
        const icon = scene.add.image(pos.x, pos.y, '') 
            .setScrollFactor(0)
            .setDepth(1850) // 層級比底格高
            .setVisible(false);
        scene.inventoryIcons.push(icon);
    });

    // 3. 建立黃色選取框 (不要用 if 判斷，直接每次都新建)
    const currentInitPos = scene.slotPositions[gameState.selectedSlot];
    
    // 如果舊的還在，先徹底銷毀（保險起見）
    if (scene.selectFrame) {
        scene.selectFrame.destroy();
    }

    // 直接建立新的黃框，並重新賦予圖層深度
    scene.selectFrame = scene.add.image(
        currentInitPos.x, 
        currentInitPos.y, 
        'yellow_frame'
    ).setScrollFactor(0).setDepth(1801).setScale(0.17);

    // 💡 剛開局時，先主動刷一次背包畫面，確保道具紋理有正確載入
    updateInventoryUI(scene);
}

// 更新裝備欄 UI 
export function updateInventoryUI(scene) {
    const slotY = 140;
    const slotXCoordinates = [80, 180, 280];

    // 移動黃色選取框到當前格子中央
    if (scene.selectFrame && gameState.selectedSlot !== undefined) {
        scene.selectFrame.setPosition(slotXCoordinates[gameState.selectedSlot], slotY);
    }

    // 更新道具圖示紋理與顯示狀態
    for (let i = 0; i < 3; i++) {
        const item = gameState.inventory[i];
        const icon = scene.inventoryIcons ? scene.inventoryIcons[i] : null;

        if (icon) {
            if (item) {
                // 修正：確保圖片載入安全，避免丟失 texture 導致消失
                icon.setTexture(item);
                icon.setVisible(true);
                icon.setDisplaySize(40, 40);
            } else {
                icon.setVisible(false);
            }
        }
    }
}

// 撿起道具
export function pickupItem(scene, item) {
    if (!item) return;
    const emptySlot = gameState.inventory.findIndex(slot => slot === null);
    if (emptySlot !== -1) {
        gameState.inventory[emptySlot] = item.itemType; 
        item.destroy();
        scene.nearbyItem = null;
        updateInventoryUI(scene);
    }
}

// 丟棄道具
export function dropSelectedItem(scene) {
    const currentSlot = gameState.selectedSlot;
    const itemToDrop = gameState.inventory[currentSlot];
    if (itemToDrop) {
        spawnItem(scene, scene.player.x + 40, scene.player.y, itemToDrop);
        gameState.inventory[currentSlot] = null;
        updateInventoryUI(scene);
    }
}

// 使用彩虹恢復糖
export function usecandy(scene) {
    if (!scene) return;
    const currentSlot = gameState.selectedSlot;
    const item = gameState.inventory[currentSlot];
    if (item !== 'candy') return;
    if (gameState.hp >= gameState.maxHp) return;

    gameState.hp = Math.min(gameState.maxHp, gameState.hp + 1);
    
    // 💡 同步更新精美血條上的文字
    if (scene.hpText) {
        scene.hpText.setText(`HP: ${gameState.hp}/${gameState.maxHp}`);
    }
    
    gameState.inventory[currentSlot] = null;
    updateInventoryUI(scene);
}