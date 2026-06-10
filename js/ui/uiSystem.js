// 檔案位置：js/ui/uiSystem.js

// 建立 UI
// 提示文字、設定視窗、說明視窗、計時器、血量文字、音量滑桿

import { gameState } from '../systems/core/gameState.js';
import { setupInventoryUI, updateInventoryUI } from '../systems/progression/inventorySystem.js';
import { updateKeyUI, triggerKeyFusion } from '../systems/progression/keySystem.js'; 

export function setupUI() {
    const scene = this; 
    const camWidth = this.cameras.main.width;
    const camHeight = this.cameras.main.height;

    // 1. 定義一個給 UI 專用的播音效 function
    function playClickSound() {
        const currentSfxVolume = gameState.sfxVolume !== undefined ? gameState.sfxVolume : 0.8;
        scene.sound.play('click_sound', { volume: currentSfxVolume });
    }
    scene.playClickSound = playClickSound;

    // 建立圖片按鈕函式（與 EndingCutsceneScene 一致）
    function createImageButton(x, y, texture, onClick) {
        const button = scene.add.image(x, y, texture)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setScale(0.4)
            .setInteractive({ useHandCursor: true })
            .setDepth(2300);

        button.on('pointerover', () => {
            button.setScale(0.44);
            button.setTint(0xffffff);
        });

        button.on('pointerout', () => {
            button.setScale(0.4);
            button.clearTint();
            button.setAlpha(1);
        });

        button.on('pointerdown', () => {
            button.setScale(0.36);
            button.setAlpha(0.85);
            playClickSound();
            onClick();
        });

        return button;
    }

    // 將提示視窗 function 綁給場景
    // 讓外部（如 keySystem）可以直接調用，不需互相 import
    scene.showHintText = function(text, duration = 800) {
        showHintTemporarily(scene, text, duration);
    };

    // ==========================================
    // 1. ⚙️ 右上角功能按鈕
    // ==========================================
    this.helpBtn = this.add.image(camWidth - 130, 58, 'help_btn').setScale(0.08).setScrollFactor(0).setDepth(2000).setInteractive({ useHandCursor: true });
    this.settingBtn = this.add.image(camWidth - 50, 58, 'setting_btn').setScale(0.07).setScrollFactor(0).setDepth(2000).setInteractive({ useHandCursor: true });

    // ==========================================
    // 7. ⚙️ 建立 Setting 設定視窗 (Container)
    // ==========================================
    scene.settingWindow = this.add.container(0, 0).setDepth(2200).setScrollFactor(0).setVisible(false);

    const settingMask = this.add.rectangle(0, 0, camWidth, camHeight, 0x000000, 0.7).setOrigin(0, 0).setInteractive();
    const settingPanelImg = this.add.image(camWidth / 2, camHeight / 2, 'setting_panel');
    
    // 1. 先定義拉桿的「中心點」位置
    const sliderCenterX = camWidth / 2 + 38; 

    // 2. 獲取軌道圖片的原廠原始寬度
    const trackTexture = this.textures.get('slider_track').getSourceImage();
    const trackWidth = trackTexture.width; 

    // 3. 精準計算出視覺上的最左端與最右端
    const sliderLeftX = sliderCenterX - (trackWidth / 2); 
    const sliderRightX = sliderCenterX + (trackWidth / 2); 
    const sliderFullWidth = trackWidth; 

    const textStyle = { fontSize: '22px', fill: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial' };

    // 調整音量控制 Y 軸往上提，保留下方空間擺放按鈕
    const bgmY = camHeight / 2 - 65; // 原本是 -35
    const sfxY = camHeight / 2 + 7; // 原本是 +37

    // A. 背景音樂 (BGM)
    const bgmLabel = this.add.text(sliderLeftX - 110, bgmY - 12, '背景音樂', textStyle);
    const bgmTrack = this.add.image(sliderCenterX, bgmY, 'slider_track').setScale(1.0); 
    
    const bgmBarGraphics = this.add.image(sliderLeftX, bgmY, 'slider_track')
        .setOrigin(0, 0.5) 
        .setTint(0xCBE395)
        .setDepth(2300)
        .setScrollFactor(0);

    const initialBgmVolume = this.sound.volume; 
    const initialBgmX = sliderLeftX + (sliderFullWidth * initialBgmVolume);
    const bgmKnob = this.add.image(initialBgmX, bgmY, 'slider_knob').setInteractive({ useHandCursor: true, draggable: true }).setDepth(2300).setScrollFactor(0);
    
    // 初始化位置
    updateProgressBar(bgmBarGraphics, sliderLeftX, initialBgmX, sliderFullWidth);

    // B. 遊戲音效 (SFX)
    const sfxLabel = this.add.text(sliderLeftX - 110, sfxY - 12, '遊戲音效', textStyle);
    const sfxTrack = this.add.image(sliderCenterX, sfxY, 'slider_track').setScale(1.0);
    
    const sfxBarGraphics = this.add.image(sliderLeftX, sfxY, 'slider_track')
        .setOrigin(0, 0.5)
        .setTint(0xCBE395)
        .setDepth(2300)
        .setScrollFactor(0);

    const initialSfxVolume = gameState.sfxVolume !== undefined ? gameState.sfxVolume : 0.8; 
    const initialSfxX = sliderLeftX + (sliderFullWidth * initialSfxVolume);
    const sfxKnob = this.add.image(initialSfxX, sfxY, 'slider_knob').setInteractive({ useHandCursor: true, draggable: true }).setDepth(2300).setScrollFactor(0);
    
    // 初始化位置
    updateProgressBar(sfxBarGraphics, sliderLeftX, initialSfxX, sliderFullWidth);

    // 建立水平排列的圖片按鈕（位置移到 Y: camHeight / 2 + 75 附近）
    const btnY = camHeight / 2 + 75;

    // 重新開始按鈕
    const restartBtn = createImageButton(camWidth / 2 - 130, btnY, 'restart_button', () => {
        if (scene.bgm) {
            scene.bgm.stop();
            scene.bgm.destroy();
            scene.bgm = null;
        }
        scene.physics.resume();
        gameState.puzzleActive = false;
        gameState.gameOver = false;
        scene.scene.restart();
    });

    // 離開遊戲（回主畫面）按鈕
    const quitBtn = createImageButton(camWidth / 2 + 130, btnY, 'quit_button', () => {
        if (scene.bgm) {
            scene.bgm.stop();
            scene.bgm.destroy();
            scene.bgm = null;
        }
        scene.physics.resume();
        gameState.puzzleActive = false;
        gameState.gameOver = false;
        scene.scene.start('CoverScene');
    });

    // 預設先隱藏拉桿與新按鈕物件
    bgmBarGraphics.setVisible(false);
    sfxBarGraphics.setVisible(false);
    bgmKnob.setVisible(false);
    sfxKnob.setVisible(false);
    restartBtn.setVisible(false);
    quitBtn.setVisible(false);

    // 將所有靜態/背景元件放入設定視窗 Container
    scene.settingWindow.add([settingMask, settingPanelImg, bgmLabel, sfxLabel, bgmTrack, sfxTrack]);
    
    this.settingBtn.on('pointerdown', () => {
        scene.settingWindow.setVisible(true);
        // 同步顯示拉桿、旋鈕與圖片按鈕
        bgmBarGraphics.setVisible(true);
        sfxBarGraphics.setVisible(true);
        bgmKnob.setVisible(true);
        sfxKnob.setVisible(true);
        restartBtn.setVisible(true);
        quitBtn.setVisible(true);

        playClickSound();
        scene.physics.pause(); 
        gameState.puzzleActive = true; 
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        if (gameObject === bgmKnob || gameObject === sfxKnob) {
            const clampedX = Phaser.Math.Clamp(pointer.x, sliderLeftX, sliderRightX);
            gameObject.x = clampedX;
            const volumePercent = (clampedX - sliderLeftX) / sliderFullWidth;
    
            if (gameObject === bgmKnob) {
                updateProgressBar(bgmBarGraphics, sliderLeftX, clampedX, sliderFullWidth);
                this.sound.volume = volumePercent;
                console.log(`BGM 音量：${Math.round(volumePercent * 100)}%`);
            } else if (gameObject === sfxKnob) {
                updateProgressBar(sfxBarGraphics, sliderLeftX, clampedX, sliderFullWidth);
                gameState.sfxVolume = volumePercent;
                console.log(`SFX 音量：${Math.round(volumePercent * 100)}%`);
            }
        }
    });

    function updateProgressBar(barImage, startX, currentKnobX, totalWidth) {
        let percent = (currentKnobX - startX) / totalWidth;
        if (percent < 0) percent = 0;
        if (percent > 1) percent = 1;
        
        const targetWidth = totalWidth * percent;
        barImage.scaleX = targetWidth / barImage.width;
        barImage.setVisible(true);
    }

    // ==========================================
    // 8. ❓ 建立 Help 說明視窗 (雙主選單 + 雙分頁版)
    // ==========================================
    scene.helpWindow = this.add.container(0, 0).setDepth(2200).setScrollFactor(0).setVisible(false);
    
    // 背景遮罩
    const helpMask = this.add.rectangle(0, 0, camWidth, camHeight, 0x000000, 0.7).setOrigin(0, 0).setInteractive();
    // 視窗背景 (所有畫面通用的毛茸茸外框 BG)
    const helpPanelImg = this.add.image(camWidth / 2, camHeight / 2, 'help_panel');
    
    scene.helpWindow.add([helpMask, helpPanelImg]);

    // ------------------------------------------
    // A. 建立各個畫面與分頁的 Container
    // ------------------------------------------
    const menuPage = this.add.container(0, 0);       // 畫面 0：主選單頁面 (圖一)
    
    // 按鍵類的兩頁
    const keyPage1 = this.add.container(0, 0);       // 按鍵 - 第 1 頁 (原本的圖二：WASD移動)
    const keyPage2 = this.add.container(0, 0);       // 按鍵 - 第 2 頁 (自訂：例如其他按鍵說明)
    
    // 道具類的兩頁
    const itemPage1 = this.add.container(0, 0);      // 道具 - 第 1 頁 (原本的圖三：滑鼠與123)
    const itemPage2 = this.add.container(0, 0);      // 道具 - 第 2 頁 (自訂：例如進階道具組合說明)
    
    scene.helpWindow.add([menuPage, keyPage1, keyPage2, itemPage1, itemPage2]);

    // ------------------------------------------
    // B. 佈局：畫面 0 - 主選單 (圖一內容)
    // ------------------------------------------

    // 「按鍵」主按鈕
    const btnKey = this.add.image(camWidth / 2 - 120, camHeight / 2, 'btn_key_bg').setInteractive({ useHandCursor: true });

    // 「道具」主按鈕
    const btnItem = this.add.image(camWidth / 2 + 120, camHeight / 2, 'btn_item_bg').setInteractive({ useHandCursor: true });

    menuPage.add([ btnKey, btnItem]);

    // ------------------------------------------
    // C. 佈局：按鍵說明的兩頁 (圖二類別)
    // ------------------------------------------
    // 按鍵第 1 頁
    const keyContent1 = this.add.image(camWidth / 2, camHeight / 2, 'key_guide_page1'); 
    keyPage1.add([keyContent1]);

    // 按鍵第 2 頁
    const keyContent2 = this.add.image(camWidth / 2, camHeight / 2, 'key_guide_page2'); // 請確保載入此資源
    keyPage2.add([keyContent2]);

    // ------------------------------------------
    // D. 佈局：道具說明的兩頁 (圖三類別)
    // ------------------------------------------
    // 道具第 1 頁
    const itemContent1 = this.add.image(camWidth / 2, camHeight / 2, 'item_guide_page1'); 
    itemPage1.add([itemContent1]);

    // 道具第 2 頁
    const itemContent2 = this.add.image(camWidth / 2, camHeight / 2, 'item_guide_page2'); // 請確保載入此資源
    itemPage2.add([itemContent2]);

    // ------------------------------------------
    // E. 建立切換用的「左右小三角形箭頭」
    // ------------------------------------------
    const arrowLeft = this.add.image(camWidth / 2 - 365, camHeight / 2, 'arrow_left').setInteractive({ useHandCursor: true }).setVisible(false);
    const arrowRight = this.add.image(camWidth / 2 + 340, camHeight / 2, 'arrow_right').setInteractive({ useHandCursor: true }).setVisible(false);
    scene.helpWindow.add([arrowLeft, arrowRight]);

    // ------------------------------------------
    // F. 核心分頁控制邏輯 (修正版：第 1 頁左鍵可回主選單)
    // ------------------------------------------
    let currentMode = 'menu'; // 'menu', 'key', 'item'
    let currentPage = 1;      // 1 或 2

    function updateHelpWindowView() {
        // 先將所有分頁隱藏
        menuPage.setVisible(false);
        keyPage1.setVisible(false);
        keyPage2.setVisible(false);
        itemPage1.setVisible(false);
        itemPage2.setVisible(false);

        // 根據目前的模式與頁數，顯示對應的 Container
        if (currentMode === 'menu') {
            menuPage.setVisible(true);
            arrowLeft.setVisible(false);  // 主選單不顯示左箭頭
            arrowRight.setVisible(false); // 主選單不顯示右箭頭
        } 
        else if (currentMode === 'key') {
            if (currentPage === 1) {
                keyPage1.setVisible(true);
                arrowLeft.setVisible(true);   // 顯示左箭頭 (點擊回主選單)
                arrowRight.setVisible(true);  // 顯示右箭頭 (點擊去第 2 頁)
            } else {
                keyPage2.setVisible(true);
                arrowLeft.setVisible(true);   // 顯示左箭頭 (點擊回第 1 頁)
                arrowRight.setVisible(false); // 第 2 頁不能再往右
            }
        } 
        else if (currentMode === 'item') {
            if (currentPage === 1) {
                itemPage1.setVisible(true);
                arrowLeft.setVisible(true);   // 顯示左箭頭 (點擊回主選單)
                arrowRight.setVisible(true);  // 顯示右箭頭 (點擊去第 2 頁)
            } else {
                itemPage2.setVisible(true);
                arrowLeft.setVisible(true);   // 顯示左箭頭 (點擊回第 1 頁)
                arrowRight.setVisible(false); // 第 2 頁不能再往右
            }
        }
    }

    // ------------------------------------------
    // G. 事件綁定 (修正版：處理返回 menu 的邏輯)
    // ------------------------------------------
    // 主選單點擊「按鍵」
    btnKey.on('pointerdown', () => {
        playClickSound();
        currentMode = 'key';
        currentPage = 1;
        updateHelpWindowView();
    });

    // 主選單點擊「道具」
    btnItem.on('pointerdown', () => {
        playClickSound();
        currentMode = 'item';
        currentPage = 1;
        updateHelpWindowView();
    });

    // 點擊右箭頭 -> 切換到第 2 頁
    arrowRight.on('pointerdown', () => {
        playClickSound();
        if (currentPage === 1) {
            currentPage = 2;
            updateHelpWindowView();
        }
    });

    // 點擊左箭頭 -> 判斷是要回第 1 頁還是回主選單
    arrowLeft.on('pointerdown', () => {
        playClickSound();
        if (currentPage === 2) {
            // 如果在第 2 頁，點左箭頭回到第 1 頁
            currentPage = 1;
        } else if (currentPage === 1) {
            // 如果已經在第 1 頁，點左箭頭回到主選單
            currentMode = 'menu';
        }
        updateHelpWindowView();
    });

    // 點擊右上角總 ❓ 按鈕打開說明視窗
    this.helpBtn.on('pointerdown', () => {
        scene.helpWindow.setVisible(true);
        currentMode = 'menu'; // 每次打開都回到圖一主選單
        updateHelpWindowView();
        playClickSound();
        scene.physics.pause();
        gameState.puzzleActive = true;
    });

    // 空白鍵關閉邏輯處理
    this.input.keyboard.on('keydown-SPACE', () => {
        if (
            scene.helpWindow.visible ||
            scene.settingWindow.visible ||
            (scene.descPanel && scene.descPanel.visible)
        ) {
            scene.helpWindow.setVisible(false);
            scene.settingWindow.setVisible(false);

            if (scene.descPanel) {
                scene.descPanel.setVisible(false);
            }

            bgmBarGraphics.setVisible(false);
            sfxBarGraphics.setVisible(false);
            bgmKnob.setVisible(false);
            sfxKnob.setVisible(false);
            restartBtn.setVisible(false);
            quitBtn.setVisible(false);
            scene.physics.resume();
            gameState.puzzleActive = false;
        }
    });

    // ==========================================
    // 常規 UI 與 道具背包區
    // ==========================================
    const hpBg = this.add.image(40, 20, 'hp_bar_bg').setOrigin(0,0).setScale(0.25).setScrollFactor(0).setDepth(1800);
    this.hpText = this.add.text(135, 45, `HP: ${gameState.hp}/${gameState.maxHp}`, { fontSize: '24px', fill: '#ffffff', fontStyle: 'bold' }).setScrollFactor(0).setDepth(1850);

    // 🎯 【優化修正】：同步安全呼叫標準背包初始化，確保主與解謎世界完全統一！
    setupInventoryUI(scene);
    
    // 💡 擴充注入：原 uiSystem 的「雙擊格子看詳細說明」邏輯
    scene.inventorySlots.forEach((slot, i) => {
        let lastClickTime = 0;
        
        slot.on('pointerdown', () => {
            const currentTime = scene.time.now;
            const clickDelay = currentTime - lastClickTime;
            lastClickTime = currentTime;

            // 雙擊 (300毫秒內) 且格子內確實有東西時，觸發說明彈窗
            if (clickDelay < 300 && gameState.inventory[i]) {
                const itemInfo = scene.itemDescriptions[gameState.inventory[i]] || {
                    name: gameState.inventory[i],
                    effect: '未知道具'
                };

                scene.descTitle.setText(itemInfo.name);
                scene.descContent.setText(itemInfo.effect);
                scene.descPanel.setVisible(true);

                scene.physics.pause();
                gameState.puzzleActive = true;
            }
        });
    });

    // 任務欄底圖與文字
    const missionBg = this.add.image(40, 183, 'mission_bg').setOrigin(0,0).setScale(0.6, 0.25).setScrollFactor(0).setDepth(1800);
    this.missionText = this.add.text(90, 203, '躲避幽靈攻擊，收集鑰匙碎片', {
        fontSize: '24px',
        fill: '#ffffff',
        padding: { top: 8, bottom: 8 }
    })
        .setScale(0.9)
        .setScrollFactor(0)
        .setDepth(1850);
    
    // 計時器
    scene.clockIcon = this.add.image(camWidth - 510, 60, 'clock')
        .setScale(0.15)
        .setScrollFactor(0)
        .setDepth(1800);

    scene.timerText = this.add.text(camWidth - 465, 46, '00:00', {
        fontSize: '24px',
        fill: '#ffffff',
        fontStyle: 'bold'
    })
        .setScrollFactor(0)
        .setDepth(1850);

    // ==========================================
    // 🎯 鑰匙碎片條初始化
    // ==========================================
    scene.fragmentIcon = this.add.image(camWidth - 270, 60, 'fragment_bar').setScale(0.17,0.2).setScrollFactor(0).setDepth(1800);
    scene.fragmentText = this.add.text(camWidth - 275, 50, `x${gameState.keyFragments}`, { fontSize: '24px', fill: '#ffffff', fontStyle: 'bold' }).setScrollFactor(0).setDepth(1850);
    scene.hintText = this.add.text(camWidth - 260, 100, '', { fontSize: '14px', fill: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(1850);

    scene.registry.events.off('UPDATE_FRAGMENTS'); 
    scene.registry.events.on('UPDATE_FRAGMENTS', () => { 
        updateKeyUI(scene); 
    });

    updateKeyUI(scene);

    this.doorHintText = this.add.text(0, 0, '', { fontSize: '18px', color: '#ffffff', backgroundColor: '#000000' }).setDepth(100).setVisible(false);
    this.interactHintText = this.add.text(this.scale.width / 2, this.scale.height - 80, '按 E 互動', { fontSize: '28px', fill: '#ffffff', backgroundColor: '#000000', padding: { x: 12, y: 8 } }).setOrigin(0.5).setScrollFactor(0).setVisible(false);
    this.itemHintText = this.add.text(0, 0, '', { fontSize: '16px', fill: '#ffff00', backgroundColor: '#000000' }).setDepth(999).setVisible(false);
    
    // 說明面板 (調整 Depth 至 2600，高於一般 UI 面板，防止被遮擋)
    scene.descPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(2600).setVisible(false);
    const descBg = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7).setOrigin(0, 0).setInteractive(); 
    const descBox = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 400, 250, 0x332222).setStrokeStyle(3, 0xffffff);
    scene.descTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 80, '', {
        fontSize: '28px',
        fill: '#ffff00',
        fontStyle: 'bold',
        fontFamily: 'Arial, Microsoft JhengHei',
        padding: { top: 10, bottom: 10 }
    }).setOrigin(0.5);
    scene.descContent = this.add.text(this.scale.width / 2, this.scale.height / 2 - 5, '', {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Arial, Microsoft JhengHei',
        wordWrap: { width: 340 },
        align: 'center',
        lineSpacing: 8,
        padding: { top: 8, bottom: 8 }
    }).setOrigin(0.5);
    const closeText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 80, '按下空白鍵離開', { fontSize: '14px', fill: '#aaaaaa' }).setOrigin(0.5);
    scene.descPanel.add([descBg, descBox, scene.descTitle, scene.descContent, closeText]);
    descBg.on('pointerdown', () => {
        scene.descPanel.setVisible(false);
        scene.physics.resume();
        gameState.puzzleActive = false;
    });
    
    scene.itemDescriptions = { 
        'bubbleGun': { name: '泡泡糖防護罩', effect: '每次受到傷害減半' },
        'jelly': { name: '隱身果凍', effect: '按下 滑鼠右鍵 使用後，隱身 5 秒' },
        'popcorn': { name: '爆米花花', effect: '跑速提升' },
        'marshmallow': { name: '雲朵棉花糖', effect: '跳躍力提升' },
        'candy': { name: '彩虹生命糖', effect: '按下 滑鼠右鍵 使用後，恢復 3 點 HP' }};

    this.bossHpText = this.add.text(this.scale.width / 2 - 60, 20, '', { fontSize: '28px', fill: '#ff4444' }).setScrollFactor(0).setVisible(false);
    this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 60, 'GAME OVER', { fontSize: '64px', fill: '#ff0000' }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
    this.restartText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 40, '按下空白鍵重啟', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
}

export function showHintTemporarily(scene, text, duration = 800) { 
    scene.hintLocked = true; 
    scene.interactHintText.setText(text).setVisible(true); 
    scene.time.delayedCall(duration, () => { 
        scene.hintLocked = false; 
        scene.interactHintText.setVisible(false); 
    }); 
}