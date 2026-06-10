
// worldBuilder.js

// 建立物件、場景
import { gameState } from '../core/gameState.js';
import { MAP_WIDTH, MAP_HEIGHT } from '../../main/config.js';
import { tryOpenDoor } from '../world/doorSystem.js';

export function collectTablet(player, tablet) {
    tablet.disableBody(true, true);
    gameState.tablets += 1;
}

export function setupWorld() {
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    this.bg = this.add.image(0, 0, 'background')
        .setOrigin(0, 0)
        .setDepth(-1);

    this.bg.displayWidth = MAP_WIDTH;
    this.bg.displayHeight = MAP_HEIGHT;

    // 平台
    this.platforms = this.physics.add.staticGroup();

    this.platforms.create(MAP_WIDTH / 2, MAP_HEIGHT +10, 'platform')
        .setScale(3, 0.5)
        .setDepth(-2)
        .refreshBody();

    this.platforms.create(MAP_WIDTH / 2, MAP_HEIGHT / 2 - 20, 'platform')
        .setScale(3, 0.3)
        .setDepth(-2)
        .refreshBody();

    // 門
    const doorData = [
        { id: 'down1', x: 354, y: 730, targetX: 354, targetY: 295 },
        { id: 'up1', x: 354, y: 295, targetX: 354, targetY: 730 },
        { id: 'down2', x: 1400, y: 730, targetX: 1400, targetY: 295 },
        { id: 'up2', x: 1400, y: 295, targetX: 1400, targetY: 730 },
        { id: 'down3', x: 2450, y: 730, targetX: 2450, targetY: 295 },
        { id: 'up3', x: 2450, y: 295, targetX: 2450, targetY: 730 },
        { id: 'down4', x: 3210, y: 730, targetX: 3210, targetY: 295 },
        { id: 'up4', x: 3210, y: 295, targetX: 3210, targetY: 730 }
    ];

    this.doors = this.physics.add.staticGroup();
    doorData.forEach(data => {
        const door = this.doors.create(data.x, data.y, 'Door');
        door.setScale(0.25).refreshBody();
        door.doorID = data.id;
        door.targetX = data.targetX;
        door.targetY = data.targetY;
    });

    // 薑餅屋
    this.cookieHomes = this.physics.add.staticGroup();
    this.cookieHomes.create(2850, 770, 'cookieHome').setScale(0.32).refreshBody().setDepth(1);
    // this.cookieHomes.create(3480, 280, 'cookieHome').setScale(0.25).refreshBody().setDepth(1);

    // 書桌
    this.desks = this.physics.add.staticGroup();
    this.desks.create(1050, 700, 'desk').setScale(0.26).refreshBody();
    this.desks.create(2880, 270, 'desk').setScale(0.26).refreshBody();
    this.desks.create(2950, 700, 'desk').setScale(0.26).refreshBody();

    // 時鐘
    this.clock11s = this.physics.add.staticGroup();
    this.clock11s.create(2100, 700, 'clock11').setScale(0.26).refreshBody();
    this.clock11s.create(2800, 270, 'clock11').setScale(0.26).refreshBody();

    // 書櫃
    this.bookcases = this.physics.add.staticGroup();
    this.bookcases.create(1000, 270, 'bookcase11').setScale(0.26).refreshBody();
    this.bookcases.create(2850, 700, 'bookcase11').setScale(0.26).refreshBody();

    // 桌子
    this.tables = this.physics.add.staticGroup();
    this.tables.create(712, 333, 'table').setScale(0.26).refreshBody();
    this.tables.create(1870, 770, 'table').setScale(0.26).refreshBody();
    this.tables.create(3530, 333, 'table').setScale(0.26).refreshBody();

    // 抽屜桌
    this.tableDesks = this.physics.add.staticGroup();
    this.tableDesks.create(900, 780, 'tableDesk').setScale(0.25).refreshBody();

    // 書架
    this.board = this.physics.add.staticImage(682, 577, 'board').setScale(0.26).refreshBody();

    // 盤子
    this.plate = this.physics.add.staticImage(690, 560, 'plate').setScale(0.26).setDepth(20).refreshBody();

    // 魔王雕像 (💡 因為 setupWorld.call(this) 的關係，這會直接綁定在 GameScene 的 this.bossWall 上)
    this.bossWall = this.physics.add.staticImage(1935, 250, 'bossWall')
        .setScale(0.25)
        .refreshBody();

    // 魔王畫像
    this.bossPortrait = this.physics.add.staticImage(3530, 650, 'bossPortrait')
        .setScale(0.25)
        .refreshBody();


    // 柱子
    this.walls = this.physics.add.staticGroup();
    [
        { x: 50, y: 290 }
        // { x: 3730, y: 290 } // 🎯 這是我們要用來轉場的最右邊柱子
    ]
    .forEach(pos => {
        const wall = this.walls.create(pos.x, pos.y, 'wall')
            .setScale(0.25, 0.52)
            .refreshBody();
        
        // 🎯 【新增】如果發現目前蓋的柱子是 X: 3730 這根，就把它特別記錄在 this.teleportWall 上
        if (pos.x === 3730) {
            this.teleportWall = wall;
        }
    });

    // 🎯 【地牢設定】把地牢藏在極遠的 X = 10000 座標點
    const dungeonStartX = 10000; 
    const { height } = this.cameras.main;

    const bgImg = this.textures.get('dungeon_bg').getSourceImage();
    const dungeonWidth = bgImg ? bgImg.width : 2400; // 橫向長圖

    // 【圖層 1】地牢背景
    this.add.image(dungeonStartX, 0, 'dungeon_bg').setOrigin(0, 0).setDisplaySize(dungeonWidth, height);

    // 【圖層 2】被關住的居民牢籠（放在地牢的中後半段，一進去左邊打魔王時看不到）
    this.dungeonCages = this.add.image(dungeonStartX + 6000, height / 2, 'cages_full');
    
    // 操作桿
    // this.dungeonLever = this.physics.add.staticImage(dungeonStartX + 1000, height, 'lever_locked')
    // .setDepth(1000)
    // .refreshBody();
    this.dungeonLever = this.physics.add.staticImage(
        dungeonStartX + 4520,
        height - 160,
        'lever_locked'
    ) .setDepth(1000) .refreshBody();
    
    // 【圖層 5】地牢前景柵欄
    this.add.image(dungeonStartX, 0, 'dungeon_front') .setOrigin(0, 0) .setScale(3, 3.7); 

    this.add.image(dungeonStartX +4500, 0, 'dungeon_front') .setOrigin(0, 0) .setScale(3, 3.7); 
                         
    // this.add.image(dungeonStartX, 0, 'dungeon_front').setOrigin(0, 0).setDisplaySize(dungeonWidth, height);
    

    // 紀錄地牢邊界
    this.dungeonBounds = { x: dungeonStartX, y: 0, width: dungeonWidth, height: height };

}