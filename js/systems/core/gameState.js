// 📄 檔案位置：gameState.js

// 遊戲狀態管理系統
// 玩家的血量、碎片數量、鑰匙狀態、解謎狀態、遊戲結束狀態等核心遊戲數據

// 遊戲狀態物件
export const gameState = {
    
    leverState: 'locked',

    // 計時器
    elapsedTime: 0,
    startTime: 0,
    timerRunning: true,

    // 玩家狀態
    isInvisible: false,
    hp: 10, 
    maxHp: 10, 
    keyFragments: 0,       
    hasFullKey: false,  
    puzzleActive: false, 
    gameOver: false, 
    jumpCount: 0,        //（0=在地面，1=第一次跳躍，2=二段跳）
    checkpointX: 100,    // 目前的檢查點 X 座標
    inventory: [null, null, null],
    selectedSlot: 0, 
    equipped: null,

    // 紀錄這三個場景的完成狀態
    completedPuzzles: {
        BookcasePuzzleScene: false,
        MirrorRoomScene: false,
        PhotoPuzzleScene: false
    },

    // Boss 狀態
    bossDefeated: false, 
    bossActive: false, 
    bossHp: 5,
    keyFusionPlaying: false,

    // 地牢操作桿狀態
    leverState: 'locked' 
};

// 重置遊戲狀態函數
export function resetGameState() {
    gameState.elapsedTime = 0;
    gameState.startTime = 0;
    gameState.timerRunning = true;
    gameState.isInvisible = false;
    gameState.hp = 10;
    gameState.maxHp = 10;
    gameState.keyFragments = 0;
    gameState.hasFullKey = false;
    gameState.puzzleActive = false;
    gameState.gameOver = false;
    gameState.jumpCount = 0;
    gameState.checkpointX = 100;
    gameState.inventory = [null, null, null];
    gameState.selectedSlot = 0; 
    gameState.equipped = null; 

    // 在重置遊戲狀態時，也要把解謎紀錄清空
    gameState.completedPuzzles = {
        BookcasePuzzleScene: false,
        MirrorRoomScene: false,
        PhotoPuzzleScene: false
    };
    
    // Boss 狀態重置
    gameState.bossDefeated = false;
    gameState.bossActive = false;
    gameState.bossHp = 5;
    gameState.keyFusionPlaying = false;

    // 地牢狀態重置
    gameState.leverState = 'locked';
}