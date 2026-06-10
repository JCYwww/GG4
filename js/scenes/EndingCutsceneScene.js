// js/scenes/EndingCutsceneScene.js
import { gameState } from '../systems/core/gameState.js';

export default class EndingCutsceneScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndingCutsceneScene' });
    }

    create() {
        const camWidth = this.scale.width;
        const camHeight = this.scale.height;

        this.cameras.main.setBounds(0, 0, camWidth, camHeight);
        this.cameras.main.scrollX = 0;
        this.cameras.main.scrollY = 0;
        this.cameras.main.setZoom(1);

        // 1. 建立影片物件
        const video = this.add.video(camWidth / 2, camHeight / 2, 'ending_video');
        video.setOrigin(0.5);
        video.setScrollFactor(0);

        const fitVideoToScreen = () => {
            const sourceWidth = video.video.videoWidth;
            const sourceHeight = video.video.videoHeight;

            if (!sourceWidth || !sourceHeight) return;

            const scale = Math.min(
                camWidth / sourceWidth,
                camHeight / sourceHeight
            );

            video.setDisplaySize(sourceWidth * scale, sourceHeight * scale);
            video.setPosition(camWidth / 2, camHeight / 2);
        };

        video.video.addEventListener('loadedmetadata', fitVideoToScreen);
        video.video.addEventListener('loadeddata', fitVideoToScreen);

        video.play();

        // 保險：有些瀏覽器影片資料會晚一點才準備好
        this.time.delayedCall(100, fitVideoToScreen);
        this.time.delayedCall(500, fitVideoToScreen);

        // 2. 當影片播放完畢時的處理
        video.on('complete', () => {
            
            this.add.rectangle(camWidth / 2, camHeight / 2, camWidth, camHeight, 0x000000, 0.4)
                .setDepth(100);

            // 顯示「通關時間」
            this.add.text(
                camWidth / 2,
                camHeight / 2 - 40,
                `通關時間：${this.formatClearTime(gameState.elapsedTime)}`,
                {
                    fontSize: '32px',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4,
                    padding: 5
                }
            ).setOrigin(0.5).setDepth(200);

            // 放置「重新遊戲」按鈕
            this.createImageButton(
                this,
                camWidth / 2 -200,
                camHeight / 2 + 65,
                'restart_button',
                () => {
                    gameState.gameOver = false;
                    this.scene.start('GameScene'); 
                }
            ).setDepth(300);

            // 放置「離開遊戲（回主畫面）」按鈕
            this.createImageButton(
                this,
                camWidth / 2 +200,
                camHeight / 2 + 65,
                'quit_button',
                () => {
                    gameState.gameOver = false;
                    this.scene.start('CoverScene');
                }
            ).setDepth(300);
        });
    }

    // 圖片按鈕函式 (已整合)
    createImageButton(scene, x, y, texture, onClick) {
        const button = scene.add.image(x, y, texture)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setScale(0.7)
            .setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            button.setScale(0.74);
            button.setTint(0xffffff);
        });

        button.on('pointerout', () => {
            button.setScale(0.7);
            button.clearTint();
            button.setAlpha(1);
        });

        button.on('pointerdown', () => {
            button.setScale(0.66);
            button.setAlpha(0.85);

            if (scene.playClickSound) {
                scene.playClickSound();
            }

            onClick();
        });

        return button;
    }

    // 時間格式化工具
    formatClearTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}