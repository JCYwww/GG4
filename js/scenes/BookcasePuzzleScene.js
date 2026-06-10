import { gameState } from '../systems/core/gameState.js';
import { createPlayerAnimation } from '../object/player/player.js';
import { setupInventoryUI, updateInventoryUI } from '../systems/progression/inventorySystem.js';

export default class BookcasePuzzleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BookcasePuzzleScene' });
        this.inventoryKeys = []; // 陣列管理鍵盤事件
    }

    init(data) {
        this.returnScene = data.returnScene || 'GameScene';
        this.returnX = data.returnX || 1050;
        this.returnY = data.returnY || 700;
    }

    create() {
        // 綁定數字鍵 1, 2, 3
        this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

        // 🎯 [修正] 更改為正確的 UI 更新函式：updateInventoryUI(this)
        this.key1.on('down', () => { gameState.selectedSlot = 0; updateInventoryUI(this); });
        this.key2.on('down', () => { gameState.selectedSlot = 1; updateInventoryUI(this); });
        this.key3.on('down', () => { gameState.selectedSlot = 2; updateInventoryUI(this); });

        // 🎯 [修正] 將建立的按鍵加入清理陣列，避免退出場景後殘留
        this.inventoryKeys.push(this.key1, this.key2, this.key3);

        const { width: screenWidth, height: screenHeight } = this.scale;

        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.shadowsFound = 0;
        this.jumpCount = 0;

        if (!this.anims.exists('left')) {
            createPlayerAnimation(this);
        }

        const alreadyCleared = gameState.completedPuzzles.BookcasePuzzleScene;

        // 全螢幕半透明黑色遮罩
        this.overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.6)
            .setOrigin(0, 0)
            .setScrollFactor(0);

        // 書櫃大小固定，計算縮放後的實際寬高
        const baseScale = 0.5; 
        const bgWidth = this.textures.get('bookcaseBG').getSourceImage().width * baseScale;
        const bgHeight = this.textures.get('bookcaseBG').getSourceImage().height * baseScale;

        this.bg = this.add.image(0, 0, 'bookcaseBG').setOrigin(0, 0).setScale(baseScale);
        this.physics.world.setBounds(0, 0, bgWidth, bgHeight);

        // 建立獨立的「解謎小相機」，強迫貼緊主畫面底部
        const camViewX = (screenWidth - bgWidth) / 2;
        const camViewY = screenHeight - bgHeight;
        const camHeight = Math.min(bgHeight, screenHeight);
        this.puzzleCam = this.cameras.add(camViewX, Math.max(0, camViewY), bgWidth, camHeight);
        
        this.puzzleCam.setBounds(0, 0, bgWidth, bgHeight);
        this.puzzleCam.setScroll(0, bgHeight - camHeight); 

        this.cameras.main.ignore([this.bg]);

        // 建立平台
        this.platforms = this.physics.add.staticGroup();
        const bottomFloorHeight = 45; 
        const bottomFloor = this.platforms.create(bgWidth / 2, bgHeight - (bottomFloorHeight / 2), 'bookcaseP');
        bottomFloor.setDisplaySize(bgWidth, bottomFloorHeight).refreshBody();

        this.platforms.create(bgWidth * 0.19, bgHeight - 220, 'bookcaseP').setDisplaySize(bgWidth * 0.38, 25).refreshBody();
        this.platforms.create(bgWidth * 0.82, bgHeight - 250, 'bookcaseP').setDisplaySize(bgWidth * 0.34, 28).refreshBody();
        this.platforms.create(bgWidth * 0.20, bgHeight - 440, 'bookcaseP').setDisplaySize(bgWidth * 0.42, 35).refreshBody();
        this.platforms.create(bgWidth * 0.90, bgHeight - 470, 'bookcaseP').setDisplaySize(bgWidth * 0.30, 22).refreshBody();
        this.platforms.create(bgWidth * 0.15, bgHeight - 660, 'bookcaseP').setDisplaySize(bgWidth * 0.28, 25).refreshBody();
        this.platforms.create(bgWidth * 0.80, bgHeight - 680, 'bookcaseP').setDisplaySize(bgWidth * 0.45, 38).refreshBody();
        this.platforms.create(bgWidth * 0.20, bgHeight - 880, 'bookcaseP').setDisplaySize(bgWidth * 0.40, 30).refreshBody();
        this.platforms.create(bgWidth * 0.82, bgHeight - 900, 'bookcaseP').setDisplaySize(bgWidth * 0.35, 25).refreshBody();

        this.cameras.main.ignore(this.platforms);

        // 玩家與相機跟隨設定
        this.player = this.physics.add.sprite(120, bgHeight - bottomFloorHeight - 40, 'player');
        this.player.setCollideWorldBounds(true);

        this.puzzleCam.startFollow(this.player, true, 0, 0.08); 
        this.puzzleCam.setFollowOffset(0, camHeight / 2 - 120);

        this.cameras.main.ignore(this.player);
        this.physics.add.collider(this.player, this.platforms);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // 殘影設定
        this.shadows = this.physics.add.staticGroup();

        if (!alreadyCleared) {
            const platformArray = this.platforms.getChildren();
            const highPlatforms = platformArray.slice(1); 

            Phaser.Utils.Array.Shuffle(highPlatforms);
            const shadowKeys = ['shadow1', 'shadow2', 'shadow3'];
            
            for (let i = 0; i < 3; i++) {
                if (!highPlatforms[i]) break; 
                const targetPlatform = highPlatforms[i];
                const shadowX = targetPlatform.x;
                const shadowY = targetPlatform.y - (targetPlatform.displayHeight / 2) - 40;
                this.createShadow(shadowX, shadowY, shadowKeys[i]);
            }

            this.physics.add.overlap(this.player, this.shadows, (player, shadow) => {
                this.collectShadow(shadow);
            });
        }

        this.cameras.main.ignore(this.shadows);

        // UI 渲染
        this.progressText = this.add.text(30, 30, '被困居民：0 / 3', {
            fontSize: '24px', fill: '#ffffff', backgroundColor: '#363738',
            fontFamily: 'Arial, Microsoft JhengHei', padding: { top: 8, bottom: 8 }
        }).setScrollFactor(0);

        this.exitText = this.add.text(bgWidth / 2 , camHeight - 50 , '有些居民自我意識過強，被魔王關進書櫃裡，救出 3 個被困居民', {
            fontSize: '16px', fill: '#ffffff', backgroundColor: '#363738',
            fontFamily: 'Arial, Microsoft JhengHei', padding: { top: 4, bottom: 4 }
        }).setOrigin(0.5).setScrollFactor(0);

        if (alreadyCleared) {
            this.progressText.setVisible(false);
            this.exitText.setText('鑰匙碎片已獲得，按下空白鍵離開');
            this.successText = this.add.text(bgWidth / 2, screenHeight / 2 - 300, "成功救出3個居民，已獲得碎片", {
                fontSize: '28px', fill: '#abe3ff', backgroundColor: '#363738',
                fontStyle: 'bold', padding: 5, fontFamily: 'Arial, Microsoft JhengHei'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(2000);
        }

        this.cameras.main.ignore([this.progressText, this.exitText]);
        if (this.successText) {
            this.cameras.main.ignore(this.successText);
        }

        // 呼叫裝備欄UI
        setupInventoryUI(this);

        if (this.inventorySlots) this.puzzleCam.ignore(this.inventorySlots);
        if (this.inventoryIcons) this.puzzleCam.ignore(this.inventoryIcons);
        if (this.selectFrame) this.puzzleCam.ignore(this.selectFrame);

        // 停用預設右鍵選單
        this.input.mouse.disableContextMenu();

        // 監聽滑鼠右鍵點擊
        this.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown) {
                console.log("🖱️ 右鍵點擊！觸發解謎場景道具效果");
                // 🎯 [修正] 呼叫正確的道具判定函式名稱
                this.executePuzzleItemEffect(); 
            }
        });
    }

    executePuzzleItemEffect() {
        const currentSlot = gameState.selectedSlot;
        const itemKey = gameState.inventory[currentSlot];

        if (!itemKey) return; 

        console.log(`在解謎場景使用了: ${itemKey}`);
        let itemUsed = false;

        // 效果 1：搭建臨時跳台
        if (itemKey === 'marshmallow' || itemKey === 'popcorn') {
            const pX = this.player.x;
            const pY = this.player.y;

            const tempPlatform = this.platforms.create(pX, pY + 45, 'bookcaseP');
            tempPlatform.setDisplaySize(120, 20).refreshBody();
            
            this.cameras.main.ignore(tempPlatform); // 歸小相機管
            this.showFloatingHint(`使用了 ${itemKey}！搭建了臨時跳台`);
            itemUsed = true;
        } 
        // 效果 2：果凍強力跳躍
        else if (itemKey === 'jelly') {
            this.player.setVelocityY(-720); 
            this.showFloatingHint("使用了果凍！獲得強力彈跳！");
            itemUsed = true;
        }
        // 效果 3：補血
        else if (itemKey === 'candy') {
            if (gameState.hp < gameState.maxHp) {
                gameState.hp = Math.min(gameState.maxHp, gameState.hp + 1);
                this.showFloatingHint("吃下了彩虹糖，回復了 1 點生命！");
                itemUsed = true;
            } else {
                this.showFloatingHint("生命值已滿！");
            }
        }

        if (itemUsed) {
            gameState.inventory[currentSlot] = null;
            updateInventoryUI(this); // 重新整理背包 UI
        }
    }

    showFloatingHint(message) {
        const hint = this.add.text(this.scale.width / 2, 200, message, {
            fontSize: '20px', fill: '#ffeb3b', backgroundColor: '#363738', padding: 8,
            fontFamily: 'Arial, Microsoft JhengHei'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(3000);
        
        this.puzzleCam.ignore(hint); // 只在主相機顯示

        this.tweens.add({
            targets: hint,
            alpha: 0,
            y: 160,
            duration: 2000,
            onComplete: () => { hint.destroy(); }
        });
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.exitPuzzle();
            return;
        }

        const leftDown = this.cursors.left.isDown || this.wasd.left.isDown;
        const rightDown = this.cursors.right.isDown || this.wasd.right.isDown;

        if (leftDown) {
            this.player.setVelocityX(-220);
            this.player.anims.play('left', true);
        } else if (rightDown) {
            this.player.setVelocityX(220);
            this.player.anims.play('right', true);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        const jumpDown = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.up);
        const isGrounded = this.player.body.touching.down || this.player.body.blocked.down;

        if (isGrounded) {
            this.jumpCount = 0;
        }

        if (jumpDown) {
            if (isGrounded) {
                this.player.setVelocityY(-520);
                this.jumpCount = 1;
            } else if (this.jumpCount < 2) {
                this.player.setVelocityY(-450);
                this.jumpCount = 2;
            }
        }
    }

    exitPuzzle() {
        // 清理殘留的鍵盤監聽事件
        this.inventoryKeys.forEach(keyObj => keyObj.destroy());
        this.inventoryKeys = [];

        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            if (gameScene.physics && gameScene.physics.resume) {
                gameScene.physics.resume();
            }
            gameState.puzzleActive = false;
            if (gameScene.itemHintText) {
                gameScene.itemHintText.setVisible(false);
            }
        }
        this.scene.stop();
        this.scene.resume('GameScene');
    }

    createShadow(x, y, key) {
        const shadow = this.shadows.create(x, y, key);
        shadow.setScale(0.08).refreshBody();
        return shadow;
    }

    collectShadow(shadow) {
        if (!shadow.active) return;

        shadow.disableBody(true, true);
        this.shadowsFound += 1;
        this.progressText.setText(`被困居民：${this.shadowsFound} / 3`);

        if (this.shadowsFound >= 3) {
            this.completePuzzles();
        }
    }

    completePuzzles() {
        gameState.keyFragments += 1;
        gameState.completedPuzzles.BookcasePuzzleScene = true;

        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.registry.events.emit('UPDATE_FRAGMENTS');
        }

        this.puzzleCam.fadeOut(800, 0, 0, 0);
        this.puzzleCam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.exitPuzzle();
        });
    }
}