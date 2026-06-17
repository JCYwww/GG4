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

    // 統一遊戲中文字字體樣式風格
    const globalTextStyle = {
        fontFamily: 'Arial, Microsoft JhengHei, sans-serif',
        fontStyle: 'bold'
    };

    // 1. 定義一個給 UI 專用的播音效 function
    function playClickSound() {
        const currentSfxVolume = gameState.sfxVolume !== undefined ? gameState.sfxVolume : 0.8;
        scene.sound.play('click_sound', { volume: currentSfxVolume });
    }
    scene.playClickSound = playClickSound;

    // 建立圖片按鈕函式（已修正：位置相對於所在的 Container 中心）
    function createImageButton(x, y, texture, onClick) {
        const button = scene.add.image(x, y, texture)
            .setOrigin(0.5)
            .setScale(0.4)
            .setInteractive({ useHandCursor: true });

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

    // 建立「純底圖 + 程式碼文字」的藍色圓形複合式按鈕（已修正：位置相對於 Container 中心）
    function createCustomButton(x, y, bgTexture, labelText, labelSize, onClick) {
        const container = scene.add.container(x, y);

        const bg = scene.add.image(0, 0, bgTexture)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        const text = scene.add.text(0, 0, labelText, {
            fontSize: labelSize,
            fill: '#ffffff',
            ...globalTextStyle
        }).setOrigin(0.5);

        container.add([bg, text]);

        bg.on('pointerover', () => { container.setScale(1.1); });
        bg.on('pointerout', () => { container.setScale(1.0); container.setAlpha(1); });
        bg.on('pointerdown', () => {
            container.setScale(0.9);
            container.setAlpha(0.85);
            playClickSound();
            onClick();
        });

        return container;
    }

    // 將提示視窗 function 綁給場景
    scene.showHintText = function(text, duration = 800) {
        showHintTemporarily(scene, text, duration);
    };

    // ==========================================
    // 1. ⚙️ 右上角功能按鈕
    // ==========================================
    this.helpBtn = this.add.image(camWidth - 130, 58, 'help_btn').setScale(0.08).setScrollFactor(0).setDepth(2000).setInteractive({ useHandCursor: true });
    this.settingBtn = this.add.image(camWidth - 50, 58, 'setting_btn').setScale(0.07).setScrollFactor(0).setDepth(2000).setInteractive({ useHandCursor: true });


    // ==========================================
    // 7. ⚙️ 建立 Setting 設定視窗 (🎯 修正為中心對齊)
    // ==========================================
    // 將 Container 座標定在畫面中心 (camWidth / 2, camHeight / 2)
    scene.settingWindow = this.add.container(camWidth / 2, camHeight / 2).setDepth(2200).setScrollFactor(0).setVisible(false);

    // 遮罩需要鋪滿畫面，因為 Container 移到了中心，所以遮罩座標要反向扣回
    const settingMask = this.add.rectangle(-camWidth / 2, -camHeight / 2, camWidth, camHeight, 0x000000, 0.7).setOrigin(0, 0).setInteractive();
    
    // 底圖直接置中 (0, 0)
    const settingPanelImg = this.add.image(0, 0, 'UI_BG');
    
    // 標題與提示字改為相對座標
    const settingTitleText = this.add.text(0, -140, '設 定', { fontSize: '36px', fill: '#ffffff', ...globalTextStyle }).setOrigin(0.5);
    const settingQuitHintText = this.add.text(0, 140, '按下空白鍵離開', { fontSize: '22px', fill: '#ffffff', ...globalTextStyle }).setOrigin(0.5);

    // 計算滑桿在 Container 內部的相對位置
    const sliderCenterX = 38; 
    const trackTexture = this.textures.get('slider_track').getSourceImage();
    const trackWidth = trackTexture.width; 

    const sliderLeftX = sliderCenterX - (trackWidth / 2); 
    const sliderRightX = sliderCenterX + (trackWidth / 2); 
    const sliderFullWidth = trackWidth; 

    const textStyle = { fontSize: '24px', fill: '#ffffff', ...globalTextStyle };

    const bgmY = -50; 
    const sfxY = 20; 

    // A. 背景音樂 (BGM)
    const bgmLabel = this.add.text(sliderLeftX - 120, bgmY - 14, '背景音樂', textStyle);
    const bgmTrack = this.add.image(sliderCenterX, bgmY, 'slider_track').setScale(1.0); 
    
    const bgmBarGraphics = this.add.image(sliderLeftX, bgmY, 'slider_track')
        .setOrigin(0, 0.5) 
        .setTint(0xCBE395);

    const initialBgmVolume = this.sound.volume; 
    const initialBgmX = sliderLeftX + (sliderFullWidth * initialBgmVolume);
    const bgmKnob = this.add.image(initialBgmX, bgmY, 'slider_knob').setInteractive({ useHandCursor: true, draggable: true });
    
    updateProgressBar(bgmBarGraphics, sliderLeftX, initialBgmX, sliderFullWidth);

    // B. 遊戲音效 (SFX)
    const sfxLabel = this.add.text(sliderLeftX - 120, sfxY - 14, '遊戲音效', textStyle);
    const sfxTrack = this.add.image(sliderCenterX, sfxY, 'slider_track').setScale(1.0);
    
    const sfxBarGraphics = this.add.image(sliderLeftX, sfxY, 'slider_track')
        .setOrigin(0, 0.5)
        .setTint(0xCBE395);

    const initialSfxVolume = gameState.sfxVolume !== undefined ? gameState.sfxVolume : 0.8; 
    const initialSfxX = sliderLeftX + (sliderFullWidth * initialSfxVolume);
    const sfxKnob = this.add.image(initialSfxX, sfxY, 'slider_knob').setInteractive({ useHandCursor: true, draggable: true });
    
    updateProgressBar(sfxBarGraphics, sliderLeftX, initialSfxX, sliderFullWidth);

    const btnY = 95;
    const restartBtn = createImageButton(-130, btnY, 'restart_button', () => {
        if (scene.bgm) { scene.bgm.stop(); scene.bgm.destroy(); scene.bgm = null; }
        scene.physics.resume();
        gameState.puzzleActive = false;
        gameState.gameOver = false;
        scene.scene.restart();
    });

    const quitBtn = createImageButton(130, btnY, 'quit_button', () => {
        if (scene.bgm) { scene.bgm.stop(); scene.bgm.destroy(); scene.bgm = null; }
        scene.physics.resume();
        gameState.puzzleActive = false;
        gameState.gameOver = false;
        scene.scene.start('CoverScene');
    });

    // 🎯 修正：將滑桿和按鈕全部打包進 Container，使其同步顯示/隱藏與對齊
    scene.settingWindow.add([
        settingMask, 
        settingPanelImg, 
        settingTitleText, 
        settingQuitHintText, 
        bgmLabel, 
        sfxLabel, 
        bgmTrack, 
        sfxTrack,
        bgmBarGraphics,
        sfxBarGraphics,
        bgmKnob,
        sfxKnob,
        restartBtn,
        quitBtn
    ]);
    
    this.settingBtn.on('pointerdown', () => {
        scene.settingWindow.setVisible(true);
        playClickSound();
        scene.physics.pause(); 
        gameState.puzzleActive = true; 
    });

    // 修正拖曳偵測：因為物件在 Container 內，pointer.x 需要扣除 Container 的世界座標偏移
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        if (gameObject === bgmKnob || gameObject === sfxKnob) {
            const relativeX = pointer.x - (camWidth / 2);
            const clampedX = Phaser.Math.Clamp(relativeX, sliderLeftX, sliderRightX);
            gameObject.x = clampedX;
            const volumePercent = (clampedX - sliderLeftX) / sliderFullWidth;
    
            if (gameObject === bgmKnob) {
                updateProgressBar(bgmBarGraphics, sliderLeftX, clampedX, sliderFullWidth);
                this.sound.volume = volumePercent;
            } else if (gameObject === sfxKnob) {
                updateProgressBar(sfxBarGraphics, sliderLeftX, clampedX, sliderFullWidth);
                gameState.sfxVolume = volumePercent;
            }
        }
    });

    function updateProgressBar(barImage, startX, currentKnobX, totalWidth) {
        let percent = (currentKnobX - startX) / totalWidth;
        if (percent < 0) percent = 0;
        if (percent > 1) percent = 1;
        
        const targetWidth = totalWidth * percent;
        barImage.scaleX = targetWidth / barImage.width;
    }


    // ==========================================
    // 8. ❓ 建立 Help 說明視窗 (🎯 修正為中心對齊)
    // ==========================================
    scene.helpWindow = this.add.container(camWidth / 2, camHeight / 2).setDepth(2200).setScrollFactor(0).setVisible(false);
    
    const helpMask = this.add.rectangle(-camWidth / 2, -camHeight / 2, camWidth, camHeight, 0x000000, 0.7).setOrigin(0, 0).setInteractive();
    const helpPanelImg = this.add.image(0, 0, 'UI_BG');
    
    const helpTitleQuestionText = this.add.text(0, -140, '說 明', { fontSize: '36px', fill: '#ffffff', ...globalTextStyle }).setOrigin(0.5);
    const helpQuitHintText = this.add.text(0, 140, '按下空白鍵離開', { fontSize: '22px', fill: '#ffffff', ...globalTextStyle }).setOrigin(0.5);
    
    scene.helpWindow.add([helpMask, helpPanelImg, helpTitleQuestionText, helpQuitHintText]);

    // 子分頁 Container 不需要再給位移，因為父層已經在中心了
    const menuPage = this.add.container(0, 0);      
    const keyPage1 = this.add.container(0, 0);      
    const keyPage2 = this.add.container(0, 0);      
    const itemPage1 = this.add.container(0, 0);     
    const itemPage2 = this.add.container(0, 0);     
    
    scene.helpWindow.add([menuPage, keyPage1, keyPage2, itemPage1, itemPage2]);

    let currentMode = 'menu'; 
    let currentPage = 1;      

    // 建立選單按鈕（相對座標）
    const btnKey = createCustomButton(-140, 10, 'btn_key_bg', '按鍵', '28px', () => {
        currentMode = 'key';
        currentPage = 1;
        updateHelpWindowView();
    });

    const btnItem = createCustomButton(140, 10, 'btn_item_bg', '道具', '28px', () => {
        currentMode = 'item';
        currentPage = 1;
        updateHelpWindowView();
    });

    menuPage.add([btnKey, btnItem]);

    // ==========================================
    // 🎨 說明視窗內頁 - 圖片基礎上使用程式碼補回文字與圖形
    // ==========================================

    // 共同文字樣式定義
    const styleTitle = { fontSize: '28px', fill: '#ffffff', ...globalTextStyle };
    const styleDesc = { fontSize: '20px', fill: '#ffffff', ...globalTextStyle };
    const styleKeyLabel = { fontSize: '22px', fill: '#ffffff', ...globalTextStyle };

    // ------------------------------------------
    // 🔑 按鍵說明頁面 1 (移動與跳躍)
    // ------------------------------------------
    const keyContent1 = this.add.image(0, 0, 'key_guide_page1'); 
    
    // 補回文字標題
    const keyTitle1 = this.add.text(0, -115, '跳 躍', styleTitle).setOrigin(0.5);
    const keyTitle2 = this.add.text(0, 115, '左 右 移 動', styleTitle).setOrigin(0.5);

    keyPage1.add([
        keyContent1, keyTitle1, keyTitle2
    ]);


    // ------------------------------------------
    // 🖱️ 按鍵說明頁面 2 (滑鼠與功能按鍵)
    // ------------------------------------------
    const keyContent2 = this.add.image(0, 0, 'key_guide_page2'); 

    // 滑鼠說明文字與箭頭
    const mouseText1 = this.add.text(-185, -90, '點擊鏡子、拖移照片、合成鑰匙', { ...styleDesc, fontSize: '18px' }).setOrigin(0.5);
    const mouseText2 = this.add.text(-50, 80, '使用道具', styleDesc).setOrigin(0.5);

    // 功能按鍵與標題文字 (對齊右側空白方格)
    const txtE_Title = this.add.text(65, -90, '物品互動', styleDesc).setOrigin(0.5);

    const txtQ_Title = this.add.text(195, -90, '丟棄道具', styleDesc).setOrigin(0.5);

    const txtNum_Title = this.add.text(130, 30, '選擇道具', styleDesc).setOrigin(0.5);

    keyPage2.add([
        keyContent2, mouseText1, mouseText2,
        txtE_Title, txtQ_Title,
        txtNum_Title
    ]);


    // ------------------------------------------
    // 🍿 道具說明頁面 1 (被動型)
    // ------------------------------------------
    const itemContent1 = this.add.image(0, 0, 'UI_BG'); 
    
    const itemTitle1 = this.add.text(0, -130, '道具_被動型 (選擇該道具即生效)', styleTitle).setOrigin(0.5);
    
    // 左側：爆米花花
    const txtPopName   = this.add.text(-130, -70, '爆米花花', styleDesc).setOrigin(0.5);
    const iconPopcorn  = this.add.image(-130, 10, 'popcorn').setScale(0.1); 
    const txtPopEffect = this.add.text(-130, 90, '跑速提升', styleDesc).setOrigin(0.5);

    // 右側：雲朵棉花糖
    const txtMarshName   = this.add.text(130, -70, '雲朵棉花糖', styleDesc).setOrigin(0.5);
    const iconMarsh      = this.add.image(130, 10, 'marshmallow').setScale(0.08);
    const txtMarshEffect = this.add.text(130, 90, '跳躍力提升', styleDesc).setOrigin(0.5);

    itemPage1.add([itemTitle1, itemContent1, txtPopName, iconPopcorn, txtPopEffect, txtMarshName, iconMarsh, txtMarshEffect]);


    // ------------------------------------------
    // 🍮 道具說明頁面 2 (使用型)
    // ------------------------------------------
    const itemContent2 = this.add.image(0, 0, 'UI_BG'); 

    const itemTitle2 = this.add.text(0, -130, '道具_使用型 (選擇該道具並按滑鼠左鍵使用)', styleTitle).setOrigin(0.5);

    // 左：隱身果凍
    const txtJellyName   = this.add.text(-180, -70, '隱身果凍', styleDesc).setOrigin(0.5);
    const iconJelly      = this.add.image(-180, 10, 'jelly').setScale(0.1);
    const txtJellyEffect = this.add.text(-180, 90, '隱身 5 秒', styleDesc).setOrigin(0.5);

    // 中：彩虹生命糖
    const txtCandyName   = this.add.text(0, -70, '彩虹生命糖', styleDesc).setOrigin(0.5);
    const iconCandy      = this.add.image(0, 10, 'candy').setScale(0.1);
    const txtCandyEffect = this.add.text(0, 90, '恢復 3 點 HP', styleDesc).setOrigin(0.5);

    // 右：泡泡糖防護罩
    const txtBubbleName   = this.add.text(180, -70, '泡泡糖防護罩', styleDesc).setOrigin(0.5);
    const iconBubble      = this.add.image(180, 10, 'bubbleGun').setScale(0.08); 
    const txtBubbleEffect = this.add.text(180, 90, '每次受到傷害減半', styleDesc).setOrigin(0.5);

    itemPage2.add([itemTitle2, itemContent2, txtJellyName, iconJelly, txtJellyEffect, txtCandyName, iconCandy, txtCandyEffect, txtBubbleName, iconBubble, txtBubbleEffect]);

    // 左右切換箭頭（相對座標）
    const arrowLeft = this.add.image(-365, 0, 'arrow_left').setInteractive({ useHandCursor: true }).setVisible(false);
    const arrowRight = this.add.image(340, 0, 'arrow_right').setInteractive({ useHandCursor: true }).setVisible(false);
    scene.helpWindow.add([arrowLeft, arrowRight]);

    function updateHelpWindowView() {
        menuPage.setVisible(false);
        keyPage1.setVisible(false);
        keyPage2.setVisible(false);
        itemPage1.setVisible(false);
        itemPage2.setVisible(false);
        
        arrowLeft.setVisible(false);
        arrowRight.setVisible(false);

        if (!scene.helpWindow.visible) return;

        if (currentMode === 'menu') {
            menuPage.setVisible(true);
            helpTitleQuestionText.setVisible(true);
        } 
        else if (currentMode === 'key') {
            helpTitleQuestionText.setVisible(false); 
            if (currentPage === 1) {
                keyPage1.setVisible(true);
                arrowLeft.setVisible(true);   
                arrowRight.setVisible(true);  
            } else {
                keyPage2.setVisible(true);
                arrowLeft.setVisible(true);   
            }
        } 
        else if (currentMode === 'item') {
            helpTitleQuestionText.setVisible(false); 
            if (currentPage === 1) {
                itemPage1.setVisible(true);
                arrowLeft.setVisible(true);   
                arrowRight.setVisible(true);  
            } else {
                itemPage2.setVisible(true);
                arrowLeft.setVisible(true);   
            }
        }
    }

    // ------------------------------------------
    // G. 事件綁定
    // ------------------------------------------
    arrowRight.on('pointerdown', () => {
        playClickSound();
        if (currentPage === 1) {
            currentPage = 2;
            updateHelpWindowView();
        }
    });

    arrowLeft.on('pointerdown', () => {
        playClickSound();
        if (currentPage === 2) {
            currentPage = 1;
        } else if (currentPage === 1) {
            currentMode = 'menu';
        }
        updateHelpWindowView();
    });

    this.helpBtn.on('pointerdown', () => {
        scene.helpWindow.setVisible(true);
        currentMode = 'menu'; 
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

            updateHelpWindowView();
            scene.physics.resume();
            gameState.puzzleActive = false;
        }
    });

    // ==========================================
    // 常規 UI 與 道具背包區 (保持原樣不變)
    // ==========================================
    const hpBg = this.add.image(40, 20, 'hp_bar_bg').setOrigin(0,0).setScale(0.25).setScrollFactor(0).setDepth(1800);
    this.hpText = this.add.text(135, 45, `HP: ${gameState.hp}/${gameState.maxHp}`, { fontSize: '24px', fill: '#ffffff', ...globalTextStyle }).setScrollFactor(0).setDepth(1850);

    setupInventoryUI(scene);
    
    scene.inventorySlots.forEach((slot, i) => {
        let lastClickTime = 0;
        slot.on('pointerdown', () => {
            const currentTime = scene.time.now;
            const clickDelay = currentTime - lastClickTime;
            lastClickTime = currentTime;

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

    const missionBg = this.add.image(40, 183, 'mission_bg').setOrigin(0,0).setScale(0.6, 0.25).setScrollFactor(0).setDepth(1800);
    this.missionText = this.add.text(90, 203, '躲避幽靈攻擊，收集鑰匙碎片', {
        fontSize: '24px',
        fill: '#ffffff',
        fontFamily: globalTextStyle.fontFamily,
        fontStyle: globalTextStyle.fontStyle,
        padding: { top: 8, bottom: 8 }
    }).setScale(0.9).setScrollFactor(0).setDepth(1850);
    
    scene.clockIcon = this.add.image(camWidth - 510, 60, 'clock').setScale(0.15).setScrollFactor(0).setDepth(1800);
    scene.timerText = this.add.text(camWidth - 465, 46, '00:00', { fontSize: '24px', fill: '#ffffff', ...globalTextStyle }).setScrollFactor(0).setDepth(1850);

    scene.fragmentIcon = this.add.image(camWidth - 270, 60, 'fragment_bar').setScale(0.17,0.2).setScrollFactor(0).setDepth(1800);
    scene.fragmentText = this.add.text(camWidth - 275, 50, `x${gameState.keyFragments}`, { fontSize: '24px', fill: '#ffffff', ...globalTextStyle }).setScrollFactor(0).setDepth(1850);
    scene.hintText = this.add.text(camWidth - 260, 100, '', { fontSize: '14px', fill: '#ffffff', ...globalTextStyle }).setOrigin(0.5).setScrollFactor(0).setDepth(1850);

    scene.registry.events.off('UPDATE_FRAGMENTS'); 
    scene.registry.events.on('UPDATE_FRAGMENTS', () => { updateKeyUI(scene); });
    updateKeyUI(scene);

    this.doorHintText = this.add.text(0, 0, '', { fontSize: '18px', color: '#ffffff', backgroundColor: '#000000', ...globalTextStyle }).setDepth(100).setVisible(false);
    this.interactHintText = this.add.text(this.scale.width / 2, this.scale.height - 80, '按 E 互動', { fontSize: '28px', fill: '#ffffff', backgroundColor: '#000000', padding: { x: 12, y: 8 }, ...globalTextStyle }).setOrigin(0.5).setScrollFactor(0).setVisible(false);
    this.itemHintText = this.add.text(0, 0, '', { fontSize: '16px', fill: '#ffff00', backgroundColor: '#000000', ...globalTextStyle }).setDepth(999).setVisible(false);
    
    scene.descPanel = this.add.container(0, 0).setScrollFactor(0).setDepth(2600).setVisible(false);
    const descBg = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7).setOrigin(0, 0).setInteractive(); 
    const descBox = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 400, 250, 0x332222).setStrokeStyle(3, 0xffffff);
    scene.descTitle = this.add.text(this.scale.width / 2, this.scale.height / 2 - 80, '', { fontSize: '28px', fill: '#ffff00', padding: { top: 10, bottom: 10 }, ...globalTextStyle }).setOrigin(0.5);
    scene.descContent = this.add.text(this.scale.width / 2, this.scale.height / 2 - 5, '', { fontSize: '18px', fill: '#ffffff', wordWrap: { width: 340 }, align: 'center', lineSpacing: 8, padding: { top: 8, bottom: 8 }, ...globalTextStyle }).setOrigin(0.5);
    const closeText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 80, '按下空白鍵離開', { fontSize: '14px', fill: '#aaaaaa', ...globalTextStyle }).setOrigin(0.5);
    scene.descPanel.add([descBg, descBox, scene.descTitle, scene.descContent, closeText]);
    descBg.on('pointerdown', () => { scene.descPanel.setVisible(false); scene.physics.resume(); gameState.puzzleActive = false; });
    
    scene.itemDescriptions = { 
        'bubbleGun': { name: '泡泡糖防護罩', effect: '每次受到傷害減半' },
        'jelly': { name: '隱身果凍', effect: '按下 滑鼠右鍵 使用後，隱身 5 秒' },
        'popcorn': { name: '爆米花花', effect: '跑速提升' },
        'marshmallow': { name: '雲朵棉花糖', effect: '跳躍力提升' },
        'candy': { name: '彩虹生命糖', effect: '按下 滑鼠右鍵 使用後，恢復 3 點 HP' }};

    this.bossHpText = this.add.text(this.scale.width / 2 - 60, 20, '', { fontSize: '28px', fill: '#ff4444', ...globalTextStyle }).setScrollFactor(0).setVisible(false);
    this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 60, 'GAME OVER', { fontSize: '64px', fill: '#ff0000', ...globalTextStyle }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
    this.restartText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 40, '按下空白鍵重啟', { fontSize: '32px', fill: '#fff', ...globalTextStyle }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
}

export function showHintTemporarily(scene, text, duration = 800) { 
    scene.hintLocked = true; 
    scene.interactHintText.setText(text).setVisible(true); 
    scene.time.delayedCall(duration, () => { 
        scene.hintLocked = false; 
        scene.interactHintText.setVisible(false); 
    }); 
}