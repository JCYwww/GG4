
// 檔案位置：js/scenes/TutorialScene.js

export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TutorialScene' });
    }

    create() {
        // 1. 取得畫面寬高
        const { width, height } = this.cameras.main;

        // 2. 設置背景顏色
        this.add.rectangle(0, 0, width, height, 0x1a1a1a).setOrigin(0, 0);

        // 3. 標題文字（置中）
        this.add.text(width / 2, 200, '遊戲說明', { 
            fontSize: '40px', 
            fill: '#ffa600', 
            fontFamily: '微軟正黑體',
            fontWeight: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        // 4. 內容
        const tutorialContent = 
            "1. 躲避幽靈軍隊和魔王的攻擊\n\n" +
            "2. 尋找解謎任務獲得鑰匙碎片\n\n" +
            "3. 合成鑰匙來開鎖解救居民";

        this.add.text(width / 2, height / 2 - 30, tutorialContent, { 
            fontSize: '24px', 
            fill: '#ffffff', 
            fontFamily: '微軟正黑體',
            lineSpacing: 12,      
            align: 'left'        
        }).setOrigin(0.5);

        // ========================================================
        // 5. 建立「進入遊戲」按鈕
        const btnBg = this.add.rectangle(width / 2, height -210, 260, 60, 0xaa2222)
            .setInteractive({ useHandCursor: true });
        
        const btnText = this.add.text(width / 2, height -210, 'Start', { 
            fontSize: '26px', 
            fill: '#ffffff', 
            fontFamily: '微軟正黑體',
            fontWeight: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        // 按鈕滑鼠懸停效果
        btnBg.on('pointerover', () => btnBg.setFillStyle(0xcc3333));
        btnBg.on('pointerout', () => btnBg.setFillStyle(0xaa2222));

        // 6. 點擊按鈕，正式切換到主遊戲畫面 (GameScene)
        btnBg.on('pointerdown', () => {
            this.cameras.main.fadeOut(100, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('GameScene'); 
            });
        });
    }
}