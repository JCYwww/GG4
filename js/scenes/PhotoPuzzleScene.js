import { preloadAssets } from '../main/preload.js';
import { gameState } from '../systems/core/gameState.js';

export default class PhotoPuzzleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PhotoPuzzleScene' });
    }

    create() {
        // 1. 取得畫面寬高
        const { width, height } = this.cameras.main;

        // 2. 加上半透明黑底
        this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0, 0);

        // 3. 設置拼圖的「正確目標位置」
        const targetX = width / 2;
        const targetY = height / 2;
        const puzzleScale = 0.25; 

        // 檢查是否已經通關
        const alreadyCleared = gameState.completedPuzzles.PhotoPuzzleScene;

        // 4. 放置底圖
        this.add.image(targetX, targetY, 'CompleteP')
            .setAlpha(alreadyCleared ? 0.9 : 0.2) // 如果通關了，讓完整底圖更清晰或保留碎片
            .setScale(puzzleScale);

        // 5. 建立拼圖碎片物件
        this.pieces = [];
        
        const puzzleConfig = [
            { key: 'P1', targetX: targetX, targetY: targetY },
            { key: 'P2', targetX: targetX, targetY: targetY },
            { key: 'P3', targetX: targetX, targetY: targetY },
            { key: 'P4', targetX: targetX, targetY: targetY },
            { key: 'P5', targetX: targetX, targetY: targetY },
            { key: 'P6', targetX: targetX, targetY: targetY },
            { key: 'P7', targetX: targetX, targetY: targetY },
            { key: 'P8', targetX: targetX, targetY: targetY },
            { key: 'P9', targetX: targetX, targetY: targetY }
        ];

        puzzleConfig.forEach((config, index) => {
            let finalX, finalY;

            if (alreadyCleared) {
                // 如果已經通關，直接把碎片吸附到正確目標位置
                finalX = config.targetX;
                finalY = config.targetY;
            } else {
                // 未通關，使用隨機位置
                const leftSide = index < 5;
                const tempImage = this.textures.get(config.key).frames['__BASE'];
                const pWidth = (tempImage ? tempImage.width : 200) * puzzleScale;
                const pHeight = (tempImage ? tempImage.height : 200) * puzzleScale;

                const halfW = pWidth / 2;
                const halfH = pHeight / 2;

                finalX = leftSide
                    ? Phaser.Math.Between(halfW + 20, width * 0.25)
                    : Phaser.Math.Between(width * 0.75, width - halfW - 20);

                finalY = Phaser.Math.Between(halfH + 20, height - halfH - 20);
            }

            // 正式生成圖片
            const piece = this.add.image(finalX, finalY, config.key)
                .setScale(puzzleScale)
                .setData('targetX', config.targetX)
                .setData('targetY', config.targetY)
                .setData('isLocked', alreadyCleared); // 如果已通關就直接 Locked

            // 未通關才開啟互動與拖曳功能
            if (!alreadyCleared) {
                piece.setInteractive({ pixelPerfect: true });
                this.input.setDraggable(piece);
            }

            this.pieces.push(piece);
        });

        // 7. 設置滑鼠拖曳事件監聽 (未通關才會觸發)
        this.input.on('dragstart', (pointer, gameObject) => {
            if (gameObject.getData('isLocked')) return;
            this.children.bringToTop(gameObject);
            gameObject.setTint(0xdddddd);
        });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject.getData('isLocked')) return;
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('dragend', (pointer, gameObject) => {
            if (gameObject.getData('isLocked')) return;
            gameObject.clearTint();

            const tX = gameObject.getData('targetX');
            const tY = gameObject.getData('targetY');
            const distance = Phaser.Math.Distance.Between(gameObject.x, gameObject.y, tX, tY);

            if (distance < 30) {
                gameObject.x = tX;
                gameObject.y = tY;
                gameObject.setData('isLocked', true);
                gameObject.disableInteractive();
                gameObject.setTint(0xffffff);
                
                this.checkVictory();
            }
        });

        // 8. 介面文字與狀態設定
        this.titleText = this.add.text(targetX, 100, '找回被魔王撕碎的照片', { fontSize: '32px', fill: '#ffffff', fontFamily: 'Arial' }).setOrigin(0.5);
        this.hintText = this.add.text(targetX, height - 100, '將碎片拖曳到正確的位置 | 按 空白鍵 暫離解謎', { fontSize: '20px', fill: '#bbbbbb', fontFamily: 'Arial' }).setOrigin(0.5);

        // 如果已經過關，直接改文字和顯示獲勝訊息
        if (alreadyCleared) {
            this.titleText.setVisible(false);
            this.hintText.setText('鑰匙碎片已獲得，按下空白鍵離開');

            this.successText = this.add.text(
                width / 2, 
                height / 2 - 180, 
                "拚湊成功，原來魔王有著不好的過去..", 
                {
                    fontSize: '36px',
                    fill: '#95e6ff',
                    fontStyle: 'bold',
                    backgroundColor: '#000000',
                    padding: { x: 16, y: 10 }
                }
            ).setOrigin(0.5).setDepth(2000);
        }

        // 9. 監聽空白鍵，隨時退出解謎回到主遊戲
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceKey.on('down', () => {
            this.scene.stop('PhotoPuzzleScene');
            this.scene.resume('GameScene');
        });
    }

    checkVictory() {
        const allCompleted = this.pieces.every(piece => piece.getData('isLocked') === true);
        
        if (allCompleted) {
            
            gameState.keyFragments += 1;
            gameState.completedPuzzles.PhotoPuzzleScene = true;
            
            this.registry.events.emit('UPDATE_FRAGMENTS');
    
            const { width, height } = this.cameras.main;
            const successText = this.add.text(
                width / 2, 
                height / 2 - 180, 
                "拚湊成功，原來魔王有著不好的過去..", 
                {
                    fontSize: '36px',
                    fill: '#95e6ff',
                    fontStyle: 'bold',
                    backgroundColor: '#000000',
                    padding: { x: 16, y: 10 }
                }
            ).setOrigin(0.5).setDepth(2000);
    
            this.time.delayedCall(2000, () => {
                this.scene.stop('PhotoPuzzleScene');
                this.scene.resume('GameScene');
            });
        }
    }
}