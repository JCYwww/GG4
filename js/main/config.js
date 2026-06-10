
// 全局設定檔
// 視窗大小、物理引擎設定

export const MAP_WIDTH = 3786.5;
export const MAP_HEIGHT = 845;

export const config = {
    type: Phaser.AUTO,

    // 遊戲畫面 = 視窗大小
    width: window.innerWidth,
    height: window.innerHeight,

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false
        }
    },

    scale: {
        // 跟隨視窗同步縮放
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
};