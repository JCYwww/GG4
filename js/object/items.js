//items.js

// 建立道具 

import { gameState } from '../systems/core/gameState.js';

//裝備
export function setupItems() {
    this.items = this.physics.add.staticGroup();
    this.bubbleGunItem = createItem(this, 1050, 750, 'bubbleGun', 'bubbleGun', 0.03).setDepth(20);
    this.jellyItem = createItem(this, 690, 542, 'jelly', 'jelly', 0.03).setDepth(21);
    this.popcornItem = createItem(this, 2877, 657, 'popcorn', 'popcorn', 0.02).setDepth(20);
    this.popcornItem = createItem(this, 1027, 227, 'popcorn', 'popcorn', 0.02).setDepth(20);
    this.marshmallowItem = createItem(this, 1000, 340, 'marshmallow', 'marshmallow', 0.05).setDepth(20);
    this.candyItem = createItem(this, 3505, 300, 'candy', 'candy', 0.03).setDepth(20);
}

function createItem(scene, x, y, key, type, scale) {
    const item = scene.items.create(x, y, key)
        .setScale(scale)
        .refreshBody();

    item.itemType = type;
    return item;
}