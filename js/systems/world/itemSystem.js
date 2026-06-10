
//itemSystem.js

//撿起、丟棄道具、檢查背包有沒有空格

import { gameState } from '../core/gameState.js';

export function collectItem(scene, item) {

    if (!item || !item.active) return;
    const emptyIndex = gameState.inventory.findIndex(
        slot => slot === null
    );
    if (emptyIndex === -1) {

        scene.itemHintText
            .setText('背包已滿')
            .setVisible(true);

        return;
    }
    gameState.inventory[emptyIndex] = item.itemType;
    item.destroy();
    scene.nearbyItem = null;
    scene.events.emit('inventoryChanged');
}

// 統一所有 掉落物 和 撿起物品 的規則
export function spawnItem(scene, x, y, type) {
    const item = scene.items.create(x, y, type);

    item.itemType = type;
    // item.setScale(ITEM_SCALE[type] || 0.05);
    item.setScale(0.05);
    item.refreshBody?.();

    return item;
}