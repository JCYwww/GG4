
// 程式進入點
// 組合遊戲的 設定 和 場景，並啟動遊戲

import { config } from './config.js'; 
import CoverScene from '../scenes/CoverScene.js';
import TutorialScene from '../scenes/TutorialScene.js';
import GameScene from '../scenes/GameScene.js';
import EndingCutsceneScene from '../scenes/EndingCutsceneScene.js';
// import WinScene from '../scenes/WinScene.js';

import MirrorRoomScene from '../scenes/MirrorRoomScene.js';
import PhotoPuzzleScene from '../scenes/PhotoPuzzleScene.js';
import BookcasePuzzleScene from '../scenes/BookcasePuzzleScene.js';

// 組合設定和場景
const finalConfig = {
    ...config, 
    // 複製 config 設定
    scene: [CoverScene, TutorialScene, GameScene, EndingCutsceneScene, MirrorRoomScene, PhotoPuzzleScene, BookcasePuzzleScene]
};

// 啟動遊戲
const game = new Phaser.Game(finalConfig);