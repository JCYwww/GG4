import { preloadAssets } from '../main/preload.js';
import { gameState } from '../systems/core/gameState.js';

export default class MirrorRoomScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MirrorRoomScene' });
    }

    create() {

        this.totalFakeMirrors = 0;
        this.brokenFakeMirrors = 0;
        this.isLevelCleared = false; 

        // 背景、物件
        this.backgroundImages = []; 
        this.objectImages = [];   

        // 全螢幕黑色半透明蒙版
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.maskOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setDepth(0);

        this.scale.on('resize', this.handleResize, this);
        
        // 建立物件
        this.bg = this.add.image(0, 0, 'bg');
        this.backgroundImages.push(this.bg);

        // [物件] 
        this.pillars = this.add.image(0, 0, 'pillars');
        this.stool = this.add.image(0, 0, 'stool');
        this.mirror_back = this.add.image(0, 0, 'mirror_back');
        this.reflection_real = this.add.image(0, 0, 'reflection_real');
        this.reflection_fantasy = this.add.image(0, 0, 'reflection_fantasy');
        this.reflection_center = this.add.image(0, 0, 'reflection_center');
        this.glassLeft = this.add.image(0, 0, 'intact_left').setAlpha(0.5);
        this.glassCenter = this.add.image(0, 0, 'intact_center').setAlpha(0.5);
        this.glassRight = this.add.image(0, 0, 'intact_right').setAlpha(0.5);
        this.mirror_frame = this.add.image(0, 0, 'mirror_frame');
        this.text_real = this.add.image(0, 0, 'text_real');
        this.text_fantasy = this.add.image(0, 0, 'text_fantasy');

        this.objectImages.push(
            this.pillars, this.stool, this.mirror_back,
            this.reflection_real, this.reflection_fantasy, this.reflection_center,
            this.glassLeft, this.glassCenter, this.glassRight,
            this.mirror_frame, this.text_real, this.text_fantasy
        );

        // 建立三面鏡子的互動
        this.setupMirrorInteraction(this.glassLeft, 'left', false);
        this.setupMirrorInteraction(this.glassCenter, 'center', true);
        this.setupMirrorInteraction(this.glassRight, 'right', false);

        // 介面文字提示
        this.titleText = this.add.text(width / 2, 200, '打破虛假魔王', { fontSize: '32px', fill: '#ffffff',padding: 5 }).setOrigin(0.5);
        this.hintText = this.add.text(width / 2, height - 200, '找出並敲碎所有虛假的鏡面 | 按下空白鍵離開', { fontSize: '20px', fill: '#bbbbbb', padding: 5 }).setOrigin(0.5);

        const alreadyCleared = gameState.completedPuzzles.MirrorRoomScene;
        this.isLevelCleared = alreadyCleared;


        // 解謎成功後再次進入
        if (alreadyCleared) {
            
            if (this.titleText) {
                this.titleText.setVisible(false);
            }
       
            this.glassLeft.setVisible(false).disableInteractive();
            this.glassRight.setVisible(false).disableInteractive();
            this.glassCenter.disableInteractive();

            this.clearedBrokenLeft = this.add.image(0, 0, 'broken_left').setDepth(10);
            this.clearedBrokenRight = this.add.image(0, 0, 'broken_right').setDepth(10);

            this.objectImages.push(this.clearedBrokenLeft, this.clearedBrokenRight);

            this.hintText.setText('鑰匙碎片已獲得，按下空白鍵離開');

            this.successText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 330, "成功打破魔王虛假模樣，已獲得碎片", {
                fontSize: '28px', fill: '#abe3ff', fontStyle: 'bold', padding:5
            }).setOrigin(0.5).setDepth(100);
        }

        // 監聽空白鍵，隨時退出解謎回到主遊戲
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceKey.on('down', () => {
            this.input.setDefaultCursor('default'); // 確保滑鼠游標恢復
            this.scene.stop('MirrorRoomScene');
            this.scene.resume('GameScene');
        });

        // 立即驅動一次佈局重算
        this.handleResize({ width: width, height: height });
    }

    handleResize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;
        const cx = width / 2;
        const cy = height / 2;

        if (this.maskOverlay) {
            this.maskOverlay.setSize(width, height);
        }

        if (this.bg && this.bg.width > 0) {
            const maxPopupWidth = width * 0.8; 
            const maxPopupHeight = height * 0.8;
            this.bgScale = Math.min(maxPopupWidth / this.bg.width, maxPopupHeight / this.bg.height);
        } else {
            this.bgScale = Math.min(width / 1280, height / 720) * 1.5;
        }

        this.backgroundImages.forEach(img => {
            if (img && img.active) {
                img.setPosition(cx, cy);
                img.setScale(this.bgScale);
            }
        });

        this.objScale = this.bgScale * 5.2; 
        
        this.objectImages.forEach(img => {
            if (img && img.active) {
                img.setPosition(cx, cy);
                img.setScale(this.objScale);
            }
        });

        if (this.reflection_center) {
            this.reflection_center.setScale(this.objScale * 0.17);
        }

        // 縮放時同步置中文字
        if (this.titleText) this.titleText.setPosition(cx, 90);
        if (this.hintText) this.hintText.setPosition(cx, height -80);
    }

    // 封裝互動邏輯的函數
    setupMirrorInteraction(glassImage, position, isTrueAppearance) {
        let crackMark = this.add.image(0, 0, `crack_${position}`).setVisible(false);
        let brokenGlass = this.add.image(0, 0, `broken_${position}`).setVisible(false);

        crackMark.setDepth(10);
        brokenGlass.setDepth(10);

        this.objectImages.push(crackMark, brokenGlass);

        // 統計這關「總共需要打破幾面假鏡子」
        if (!isTrueAppearance) {
            this.totalFakeMirrors++; 
        }

        glassImage.setInteractive({ pixelPerfect: true });

        glassImage.on('pointerover', () => {
            if (this.isLevelCleared) return;
            crackMark.setVisible(true);
            this.input.setDefaultCursor('pointer');
        });

        glassImage.on('pointerout', () => {
            crackMark.setVisible(false);
            this.input.setDefaultCursor('default');
        });

        glassImage.on('pointerdown', () => {
            if (this.isLevelCleared) return;

            glassImage.disableInteractive();
            this.input.setDefaultCursor('default');

            glassImage.setVisible(false);
            crackMark.setVisible(false);
            brokenGlass.setVisible(true);

            if (!isTrueAppearance) {
                // 點到假鏡子：累計打破數量
                this.brokenFakeMirrors++;
                console.log(`🔨 成功敲碎一面假鏡子 (${position})！進度: ${this.brokenFakeMirrors}/${this.totalFakeMirrors}`);
                
                // 檢查是否全部假鏡子都打破了
                if (this.brokenFakeMirrors >= this.totalFakeMirrors) {
                    this.onSuccessBreak();
                }
            } else {
                // 點到真鏡子：扣血或懲罰
                this.onFailBreak();
            }
        });
    }

    onSuccessBreak() {
        if (this.isLevelCleared) return;
        this.isLevelCleared = true; // 鎖定，防止重複發送

        if (this.titleText) {
            this.titleText.setVisible(false);
        }

        console.log("🎉 完美！所有虛假的鏡子都被打破了，成功看透真實！");
        
        // 1. 後台資料只增加碎片數量
        gameState.keyFragments += 1;
        gameState.completedPuzzles.MirrorRoomScene = true;
    
        // 2. 對全域發射電波，通知主畫面 UI 刷新
        this.registry.events.emit('UPDATE_FRAGMENTS');
    
        // 建立勝利漂浮文字提示玩家
        let successText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 330, "成功打破魔王虛假模樣，已獲得碎片", {
            fontSize: '28px', fill: '#abe3ff', fontStyle: 'bold', padding:5
        }).setOrigin(0.5).setDepth(100);

        // 💡 2 秒後自動切回主場景
        this.time.delayedCall(2000, () => {
            this.scene.stop('MirrorRoomScene');
            this.scene.resume('GameScene');
        });
    }

    onFailBreak() {
        this.cameras.main.shake(300, 0.02);
        
        let failText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 220, "那是魔王真實的樣子，不該逃避...", {
            fontSize: '42px', fill: '#ff0000', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(100);

        // 1.5 秒後自動讓錯誤字體消失，允許玩家繼續嘗試其他鏡子
        this.time.delayedCall(1500, () => {
            failText.destroy();
        });
    }
}