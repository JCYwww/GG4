
// 封面場景
// 標題、按鈕 (開始、設定、離開)

export default class CoverScene extends Phaser.Scene {

    constructor() {
        super({ key: 'CoverScene' });
    }

    preload() {
        this.load.image('cover', 'assets/cover2.png');
        this.load.image('title', 'assets/標題.png');
    }

    create() {

        // 1. 取得目前遊戲視窗（Canvas）的實際寬高
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        // 2. 放入封面圖片並居中（先不要設定大小）
        let cover = this.add.image(gameWidth / 2, gameHeight / 2, 'cover')
            .setOrigin(0.5);

        // 3. 計算縮放比例（Phaser 版的 object-fit: cover 數學邏輯）
        // 計算「如果要把寬度補滿」與「如果要把高度補滿」各自需要的縮放倍數
        const scaleX = gameWidth / cover.width;
        const scaleY = gameHeight / cover.height;
        
        // 取較大的那個縮放比（Math.max），就能確保圖片完全填滿畫面，且等比例縮放不變形
        const maxScale = Math.max(scaleX, scaleY); 
        cover.setScale(maxScale);

        let title = this.add.image(gameWidth / 2, gameHeight - 490, 'title')
            .setOrigin(0.5).setScale(0.5);

        // 4. 「Click to run」閃爍提示文字
        let clickText = this.add.text(
            gameWidth / 2,
            gameHeight - 100,
            'Click to run',
            {
                fontSize: '40px',
                fill: '#ffffff'
                // backgroundColor: '#000000'
            }
        ).setOrigin(0.5);

        this.tweens.add({
            targets: clickText,
            alpha: { from: 1, to: 0.3 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // 5. 點擊淡出並進入遊戲
        this.input.once('pointerdown', () => {
            this.tweens.add({
                targets: [cover, clickText, Text],
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    this.scene.start('TutorialScene');
                }
            });
        });
    }
}