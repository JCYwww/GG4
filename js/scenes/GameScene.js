
// 遊戲主場景
// 核心邏輯、流程控制

// main
import { preloadAssets } from '../main/preload.js';
import { MAP_WIDTH, MAP_HEIGHT } from '../main/config.js';

// Puzzle
import { puzzleManager } from '../puzzles/puzzleManager.js';

// Systems - combat
import { handleEnemyAttack, playerAttack } from '../systems/combat/combatSystem.js';

// Systems - core
import { gameState, resetGameState } from '../systems/core/gameState.js';
import { createGameOverUI } from '../systems/core/gameOverSystem.js';

// Systems - world
import { tryOpenDoor, teleport } from '../systems/world/doorSystem.js';
import { setupWorld } from '../systems/world/worldBuilder.js';
import { collectItem } from '../systems/world/itemSystem.js';

// Systems - progression
import { setupInventoryUI, updateInventoryUI, pickupItem, dropSelectedItem } from '../systems/progression/inventorySystem.js';
import { equipItem } from '../systems/progression/equipmentSystem.js';
import { updateKeyUI } from '../systems/progression/keySystem.js';

// Systems - combat
import { updateBoss, spawnBoss } from '../systems/combat/bossSystem.js';

// Objects - player
import { setupEntities } from '../object/player/player.js';
import { setupControls } from '../object/player/playerControl.js';
import { handlePlayerMovement } from '../object/player/playerMovement.js';
import { setupPlayerCollisions } from '../object/player/playerCollision.js';
import { createPlayerAnimation } from '../object/player/player.js';

// Objects - enemies
import { setupGhosts, updateGhosts } from '../object/enemies/enemies.js';

// UI
import { setupUI } from '../ui/uiSystem.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        preloadAssets.call(this);

// 載入畫面
        const { width, height } = this.cameras.main;
        this.loadingText = this.add.text(width / 2, height / 2, 'Loading: 0%', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: '微軟正黑體'
        }).setOrigin(0.5);
    
        this.load.on('progress', (value) => {
            this.loadingText.setText('Loading: ' + Math.round(value * 100) + '%');
        });
    
        this.load.on('complete', () => {
            this.loadingText.destroy();
        });
    }
            
    create() {

        resetGameState();
        createGameOverUI(this);

// 計時器初始化
        gameState.startTime = this.time.now;
        gameState.elapsedTime = 0;
        gameState.timerRunning = true;

// 取得鏡頭寬高
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

// 讀取場景傳入資料
        const data = this.scene.settings.data || {};

//裝備欄 UI 初始化
        setupInventoryUI(this);

//播放背景音樂
        if (this.bgm) {
            this.bgm.stop();
            this.bgm.destroy();
        }

        this.bgm = this.sound.add('bgm_music', { loop: true, volume: 0.5 });
        this.bgm.play();
        this.sound.volume = 0.5;
        
// 遊戲狀態和座標設定
        this.doorOpening = false;
        this.hintLocked = false;
        this.isInvincible = false;
        this.isTeleportingToDungeon = false;

        this.isReturningToMain = false;
        this.mainReturnX = 3600;
        this.mainReturnY = 670;

        this.isInDungeon = false;
        this.dungeonSpawnX = 10350;
        this.dungeonSpawnY = 670;
        this.canReturnToMain = false;
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        createPlayerAnimation(this);
        this.puzzleManager = new puzzleManager(this);
        this.enemyProjectiles = this.physics.add.group();

// 初始化世界物件
        setupEntities.call(this);
        setupWorld.call(this);
        setupControls.call(this); 
        setupGhosts.call(this); 
        setupPlayerCollisions.call(this);

       this.anims.create({
            key: 'boss_walk_left',
            frames: this.anims.generateFrameNumbers('boss_walk', {
                frames: [3, 2, 1, 0]
            }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'boss_idle_front',
            frames: [
                { key: 'boss_walk', frame: 4 }
            ],
            frameRate: 1,
            repeat: 0
        });

        this.anims.create({
            key: 'boss_walk_right',
            frames: this.anims.generateFrameNumbers('boss_walk', {
                frames: [5, 6, 7, 8]
            }),
            frameRate: 6,
            repeat: -1
        });

        if (data.spawnX !== undefined && data.spawnY !== undefined && this.player) {
            this.player.setPosition(data.spawnX, data.spawnY);
        }      
   
// 呼叫 UI 
        setupUI.call(this);
        updateInventoryUI(this);

        this.registry.events.off('UPDATE_FRAGMENTS'); 
        this.registry.events.on('UPDATE_FRAGMENTS', () => {
            updateKeyUI(this);
        });

        updateKeyUI(this);

// 建立按鍵 UI
        this.dialogBox = this.add.image(0, 0, 'dialog_box')
            .setOrigin(0.5)
            .setDepth(3000)
            .setScrollFactor(1)
            .setVisible(false);

        this.dialogText = this.add.text(0, 0, '', {
            fontSize: '32px',
            color: '#111111',
            fontFamily: 'serif'
        })
            .setOrigin(0.5)
            .setDepth(3001)
            .setScrollFactor(1)
            .setVisible(false);

        this.interactKeyIcon = this.add.image(0, 0, 'key_E')
            .setOrigin(0.5)
            .setDepth(3000)
            .setScale(0.5)
            .setScrollFactor(1)
            .setVisible(false);

// 綁定按鍵監聽
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.dropKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.attackKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.key1        = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2        = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.key3        = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

// K 鍵作弊碼
        this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
        this.keyK.on('down', () => {
            if (!this.isTeleportingToDungeon) {
                console.log("🤫 觸發作弊碼：直接把玩家往前推觸發地牢轉場！");
                this.player.setX(3750); 
            }
        });

// 停用瀏覽器右鍵選單
        this.input.mouse.disableContextMenu();
        this.rightClickLocked = false;

// 鏡頭追隨玩家
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    }


    update() {
    
// 遊戲結束
        if (gameState.gameOver) {
            if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                    this.scene.restart();
                });
            }
            return;
        }

// 解謎狀態
        if (gameState.puzzleActive) return;

        if (gameState.timerRunning && !gameState.gameOver) {
            gameState.elapsedTime = this.time.now - gameState.startTime;

            const totalSeconds = Math.floor(gameState.elapsedTime / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

// 計時器更新
            if (this.timerText) {
                this.timerText.setText(
                    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                );
            }
        }

// 呼叫玩家和敵人更新
        handlePlayerMovement.call(this);
        updateBoss.call(this);
        updateGhosts.call(this);

// 從主場景進地牢
        if (this.player && this.isInDungeon && this.canReturnToMain && !this.isReturningToMain) {
            if (this.player.x <= this.dungeonBounds.x + 180) {
                this.returnToMainWorld();
                return;
            }
        }
    
        if (this.player && !this.isInDungeon && !this.isTeleportingToDungeon) {
            if (this.player.x >= 3700) {
                this.isTeleportingToDungeon = true; 
        
                console.log(`🔥 【邊界觸發】轉場啟動！`);
        
                const dungeonFloorY = 770; 
        
                if (this.dungeonBounds && this.platforms) {
                    console.log("🧱 正在為地牢區域動態鋪設地板...");
                    for (let x = this.dungeonBounds.x; x < this.dungeonBounds.x + this.dungeonBounds.width; x += 64) {
                        const ground = this.platforms.create(x, dungeonFloorY, 'dungeon_floor').setOrigin(0, 0);
                        if (ground.body) ground.refreshBody();
                        ground.setDepth(10).setScale(0.5); 
                    }
                }
        
                if (this.dungeonCages) {
                    this.dungeonCages.setScale(0.35); 
                    this.dungeonCages.setY(dungeonFloorY-600); 
                    this.dungeonCages.setDepth(15); 
                }
                
                if (this.dungeonLever) {
                    this.dungeonLever.setScale(2.5); 
                    this.dungeonLever.setY(dungeonFloorY - 200);  
                    this.dungeonLever.setDepth(16);
                    this.dungeonLever.refreshBody();
                }
        
                this.cameras.main.fadeOut(1000, 0, 0, 0);
                
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                    this.time.delayedCall(1000, () => {
                        
                        if (this.dungeonBounds) {
                            this.cameras.main.setBounds(this.dungeonBounds.x, this.dungeonBounds.y, this.dungeonBounds.width, this.dungeonBounds.height);
                            this.physics.world.setBounds(this.dungeonBounds.x, this.dungeonBounds.y, this.dungeonBounds.width, this.dungeonBounds.height);
                        }
        
                        const playerSpawnY = dungeonFloorY - 80;

                        this.isInDungeon = true;
                        this.dungeonSpawnX = this.dungeonBounds.x + 350;
                        this.dungeonSpawnY = playerSpawnY;

                        this.player.setPosition(this.dungeonSpawnX, this.dungeonSpawnY);
                        this.player.setDepth(100);

                        this.canReturnToMain = false;
                        this.time.delayedCall(1000, () => {
                            this.canReturnToMain = true;
                        });
                        
                        if (this.player.anims) {
                            this.player.anims.stop();
                            this.player.setFrame(4);
                        }
        
                        console.log("👿 正在召喚地牢魔王...");
                        spawnBoss.call(this, 14600, dungeonFloorY); 
                        
                        if (this.boss) {
                            this.boss.setDepth(99); 
                            gameState.bossActive = true; 
                        }
        
                        this.cameras.main.fadeIn(1000, 0, 0, 0);
                        if (this.missionText) {
                            this.missionText.setText('躲避魔王攻擊，前往打開牢籠');
                        }
                    });
                });
            }
        }

// 解謎場景和拉桿 距離偵測
        this.nearBossWall = false;
        if (this.player && this.bossWall) {
            const distToBoss = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.bossWall.x, this.bossWall.y);
            if (distToBoss < 130) {
                this.nearBossWall = true;
            }
        }

        this.nearCookieHome = false;
        this.closestCookieHome = null;
        if (this.player && this.cookieHomes) {
            this.cookieHomes.getChildren().forEach(home => {
                const distToHome = Phaser.Math.Distance.Between(this.player.x, this.player.y, home.x, home.y);
                if (distToHome < 80) {
                    this.nearCookieHome = true;
                    this.closestCookieHome = home; 
                }
            });
        }

        this.nearbossPortrait = false;
        if (this.player && this.bossPortrait) {
            const distToBoss = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.bossPortrait.x, this.bossPortrait.y);
            if (distToBoss < 130) {
                this.nearbossPortrait = true;
            }
        }

        this.nearDungeonLever = false;
        if (this.player && this.dungeonLever) {
            const distToLever = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.dungeonLever.x, this.dungeonLever.y);
            if (distToLever < 120) {
                this.nearDungeonLever = true;
            }
        }

// 滑鼠右鍵 使用裝備
        const pointer = this.input.activePointer;
        if (pointer.rightButtonDown() && !this.rightClickLocked) {
            this.rightClickLocked = true; // 🔒 鎖定，防止按住右鍵時重複連續扣除

            const currentItem = gameState.inventory[gameState.selectedSlot];
            console.log(`[滑鼠右鍵輸入] 目前手持選中 slot 道具為: ${currentItem}`);

            if (currentItem === 'candy' || currentItem === 'jelly') {
                import('../systems/progression/equipmentSystem.js').then(module => {
                    module.useCurrentItem(this);
                });
            } else if (currentItem) {
                console.log("執行裝備指令！");
                equipItem(this);
            } else {
                console.log("🎒 背包格子是空的，沒東西可以使用！");
            }
        }

        if (!pointer.rightButtonDown()) {
            this.rightClickLocked = false;
        }

// E 鍵 場景互動
        if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            
            if (this.nearBossWall) {
                this.hideInteractionHint();
                this.scene.pause('GameScene');
                this.scene.launch('MirrorRoomScene');
                return; 
            }

            if (this.nearCookieHome) {
                this.hideInteractionHint();
                this.scene.pause('GameScene');
                this.scene.launch('PhotoPuzzleScene');
                return; 
            }

            if (this.nearbossPortrait) {
                this.hideInteractionHint();
                this.scene.pause('GameScene');
                this.scene.launch('BookcasePuzzleScene');
                return; 
            }

            if (this.nearDungeonLever) {
                tryOpenDoor.call(this);
                return;
            }

            if (this.currentDoor) {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.currentDoor.x, this.currentDoor.y);
                if (dist < 80) {
                    teleport.call(this, this.player, this.currentDoor);
                    return; // 傳送後直接結束這次互動判斷
                }
            }

            // 這裡不需要包在任何按鍵判斷裡，讓它每格畫面都偵測
            if (this.currentDoor) {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.currentDoor.x, this.currentDoor.y);
                
                // 只要玩家走遠了（大於 80 像素），就拔掉當前的門，並把提示字藏起來
                if (dist > 80) {
                    this.currentDoor = null; 
                    if (this.doorHintText) {
                        this.doorHintText.setVisible(false); // 記得要把 playerCollision 秀出的提示字藏掉
                    }
                }
            }
            
            if (this.nearbyItem) {
                pickupItem(this, this.nearbyItem); 
                if (this.itemHintText) this.hideInteractionHint();
                return;
            }
        
            if (this.nearbyTablet) {
                const stageKey = `STAGE_${this.nearbyTablet.puzzleID + 1}`; 
                this.puzzleManager.openPuzzleWindow(stageKey);
                return;
            }
        }
    
// 數字鍵 123
        if (this.key1 && Phaser.Input.Keyboard.JustDown(this.key1)) { 
            gameState.selectedSlot = 0; 
            updateInventoryUI(this); 
        }
        if (this.key2 && Phaser.Input.Keyboard.JustDown(this.key2)) { 
            gameState.selectedSlot = 1; 
            updateInventoryUI(this); 
        }
        if (this.key3 && Phaser.Input.Keyboard.JustDown(this.key3)) { 
            gameState.selectedSlot = 2; 
            updateInventoryUI(this); 
        }
        
// Q 鍵 丟棄裝備
        if (this.dropKey && Phaser.Input.Keyboard.JustDown(this.dropKey)) {
            dropSelectedItem(this);
        }

// 提示字  
        let hintShown = false;

        if (this.nearBossWall) {
            const text = gameState.completedPuzzles.MirrorRoomScene ? "原來魔王一直都有容貌焦慮" : "後面好像有東西";
            this.showInteractionHint(text, this.bossWall, 'key_E');
            hintShown = true;
        }
        else if (this.nearCookieHome && this.closestCookieHome) {
            const text = gameState.completedPuzzles.PhotoPuzzleScene ? "魔王以前好像被排擠了" : "裡面好像有東西";
            this.showInteractionHint(text, this.closestCookieHome, 'key_E');
            hintShown = true;
        }
        else if (this.nearbossPortrait && this.bossPortrait) {
            const text = gameState.completedPuzzles.BookcasePuzzleScene ? "他們就快要消失了，好險有救出!" : "裡面好像有秘密通道";
            this.showInteractionHint(text, this.bossPortrait, 'key_E');
            hintShown = true;
        }
        else if (this.nearDungeonLever && this.dungeonLever) {
            if (!this.doorOpening) {
                const text = gameState.hasFullKey ? "有一把鑰匙，打開看看" : "需要完整鑰匙才能打開";
                this.showInteractionHint(text, this.dungeonLever, 'key_E');
                hintShown = true;
            }
        }
        else if (this.nearbyItem) {
            const distToItem = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                this.nearbyItem.x,
                this.nearbyItem.y
            );

            if (distToItem < 80) {
                this.showInteractionHint(`${this.nearbyItem.itemType} !`, this.nearbyItem, 'key_E');
                hintShown = true;
            } else {
                this.nearbyItem = null;
            }
        }
        else if (this.currentDoor) {
            const distToDoor = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                this.currentDoor.x,
                this.currentDoor.y
            );

            if (distToDoor < 80) {
                this.showInteractionHint('進門看看', this.currentDoor, 'key_E');
                hintShown = true;
            } else {
                this.currentDoor = null;
            }
        }

        if (!hintShown) {
            this.hideInteractionHint();
        }
    }

// 顯示提示字
    showInteractionHint(text, target, keyTexture = 'key_E') {
        if (!this.player || !target) return;

        const boxX = this.player.x - 140;
        const boxY = this.player.y - 85;

        const maxTextWidth = 460;

        this.dialogText
            .setText(text)
            .setScale(0.55)
            .setWordWrapWidth(maxTextWidth)
            .setPosition(boxX, boxY)
            .setVisible(true);

        const paddingX = 50;
        const paddingY = 20;
        const minBoxWidth = 220;
        const maxBoxWidth = 540;

        const textWidth = this.dialogText.width * this.dialogText.scaleX;
        const textHeight = this.dialogText.height * this.dialogText.scaleY;

        const boxWidth = Phaser.Math.Clamp(
            textWidth + paddingX,
            minBoxWidth,
            maxBoxWidth
        );

        const boxHeight = Math.max(60, textHeight + paddingY);

        this.dialogBox
            .setPosition(boxX, boxY)
            .setDisplaySize(boxWidth-10, boxHeight)
            .setVisible(true);

        this.interactKeyIcon
            .setTexture(keyTexture)
            .setPosition(target.x, target.y - 90)
            .setVisible(true)
            .setScale(1);
    }

    hideInteractionHint() {
        if (this.dialogBox) this.dialogBox.setVisible(false);
        if (this.dialogText) this.dialogText.setVisible(false);
        if (this.interactKeyIcon) this.interactKeyIcon.setVisible(false);
    }

// 回到主場景
    returnToMainWorld() {
        this.isReturningToMain = true;
        this.cameras.main.fadeOut(500, 0, 0, 0);

        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.isInDungeon = false;
            this.isTeleportingToDungeon = false;
            this.canReturnToMain = false;

            this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
            this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

            if (this.player) {
                this.player.setPosition(this.mainReturnX, this.mainReturnY);
                this.player.setVelocity(0, 0);
                this.player.setDepth(100);
            }

            if (this.enemyProjectiles) {
                this.enemyProjectiles.clear(true, true);
            }

            if (this.boss) {
                this.boss.setActive(false);
                this.boss.setVisible(false);
            }

            gameState.bossActive = false;
            if (this.itemHintText) this.hideInteractionHint();
            if (this.missionText) this.missionText.setText('躲避幽靈攻擊，收集鑰匙碎片');

            this.cameras.main.fadeIn(500, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.isReturningToMain = false;
            });
        });
    }
}