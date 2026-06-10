// 解謎管理系統
// 流程 (判斷是否開始、完成)

import { gameState } from '../systems/core/gameState.js';

// 最後好像沒用到
// 解謎資料庫：定義各關卡的型態（DRAG / BREAK）
// 所需素材名稱、通關目標，以及通關後解鎖的魔王記憶敘事
export const puzzleStages = {
    STAGE_1: { type: 'DRAG', item: 'photo_fragment', target: 'photo_base', memory: '魔王被丟棄的過去' },
    STAGE_2: { type: 'BREAK', item: 'mirrors', correctIndex: 1, memory: '魔王對容貌的自卑' },
    STAGE_3: { type: 'DRAG', item: 'ghost_shadow', target: 'boss_silhouette', memory: '魔王吃掉居民的原因' }
};

// 接收關卡 Key、分流初始化對應的玩法
// 處理 Phaser 的輸入事件（拖曳、點擊）
// 在通關時觸發獎勵機制
export class puzzleManager {
    constructor(scene) {
        this.scene = scene;
    }

    // 啟動對應階段的解謎視窗
    openPuzzleWindow(stageKey) {
        const stage = puzzleStages[stageKey];
        
        if (stage.type === 'DRAG') {
            this.initDragPuzzle(stage);
        } else if (stage.type === 'BREAK') {
            this.initMirrorPuzzle(stage);
        }
    }

    // 照片拖移
    initDragPuzzle(stage) {

        this.scene.input.setInteractive(puzzleObject, { draggable: true });
        
        this.scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.scene.input.on('dragend', (pointer, gameObject) => {
            if (Phaser.Math.Distance.Between(gameObject.x, gameObject.y, target.x, target.y) < 50) {
                this.puzzleSuccess(stage);
            }
        });
    }

    // 打破鏡子
    initMirrorPuzzle(stage) {
        // 生成三個鏡子物件，並綁定點擊事件
        mirrors.forEach((mirror, index) => {
            mirror.setInteractive().on('pointerdown', () => {
                if (index === stage.correctIndex) {
                    mirror.destroy(); // 打破真實樣貌的鏡子
                    this.puzzleSuccess(stage);
                } else {
                    // 處罰玩家
                    // 還沒想好要做甚麼
                }
            });
        });
    }

    puzzleSuccess(stage) {
        // 增加碎片、播放對話、觸發鑰匙融化邏輯
    }
}