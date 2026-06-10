// 檔案位置：js/systems/progression/keySystem.js
import { gameState } from '../core/gameState.js';

let flashTween = null; 

export function updateKeyUI(scene) {
    if (!scene || !scene.fragmentText || !scene.fragmentIcon || !scene.hintText) return;

    // 1. 如果已經成功合成了，顯示 x1 鑰匙
    if (gameState.hasFullKey) {
        if (flashTween) { flashTween.stop(); flashTween = null; }
        scene.fragmentIcon.off('pointerdown').disableInteractive();

        scene.fragmentIcon
            .setAlpha(1)
            .setTint(0xffffff)
            .setTexture('full_key')
            .setScale(0.25,0.33)
            .setPosition(scene.cameras.main.width - 270, 60);

        scene.fragmentText
            .setText("x1")
            .setColor('#00FF00')
            .setPosition(scene.cameras.main.width - 285, 46);

        scene.hintText
            .setText("已獲得完整鑰匙！")
            .setColor('#00FF00');

        return;
    }

    // 2. 更新當前的碎片數量（這時候應該是 x3）
    scene.fragmentText.setText(`x${gameState.keyFragments}`).setColor('#9be3ff');

    // 3. 判斷碎片數量的狀態
    if (gameState.keyFragments < 3) {
        // 狀態 A：碎片不足
        scene.hintText.setText(`缺乏 ${3 - gameState.keyFragments} 個鑰匙碎片`).setColor('#ffffff');
        scene.fragmentIcon.disableInteractive();
    } 
    else if (gameState.keyFragments >= 3) {
        // 狀態 B：集滿 3 個！這時數據依然是 3，畫面顯示 x3
        scene.hintText.setText("點擊碎片條合成地牢鑰匙！").setColor('#ffff00');
        
        // 啟用互動手勢
        scene.fragmentIcon.setInteractive({ useHandCursor: true });
        scene.fragmentIcon.off('pointerdown');
        scene.fragmentIcon.on('pointerdown', () => {
            console.log("玩家點擊了閃爍的碎片條，開始觸發手動合成！");
            triggerKeyFusion(scene); // 點擊時才真正進去改數據
        });

        // 啟動閃爍動畫
        if (!flashTween) {
            scene.fragmentIcon.setTint(0xffea00); 
            flashTween = scene.tweens.add({
                targets: scene.fragmentIcon,
                alpha: 0.3,
                duration: 400,
                yoyo: true,
                repeat: -1
            });
            console.log("鑰匙集滿 3 個！碎片條開始發光閃爍，等待點擊...");
        }
    }
}

export function triggerKeyFusion(scene) {
    if (gameState.keyFusionPlaying || gameState.hasFullKey) return;
    gameState.keyFusionPlaying = true;
    
    if (typeof scene.playClickSound === 'function') {
        scene.playClickSound();
    }

    // 只有點擊後，數據才真正轉變
    gameState.keyFragments = 0;
    gameState.hasFullKey = true;

    // 拔除點擊，停止閃爍
    if (flashTween) { flashTween.stop(); flashTween = null; }
    scene.fragmentIcon.setAlpha(1).setTint(0xffffff);
    scene.fragmentIcon.off('pointerdown');

    // 特效聚攏動畫...
    let pieces = [];
    const startX = scene.fragmentIcon.x;
    const startY = scene.fragmentIcon.y;
    for (let i = 0; i < 3; i++) {
        let p = scene.add.circle(startX + (i - 1) * 30, startY + 40, 8, 0xffd700).setScrollFactor(0).setDepth(2600);
        pieces.push(p);
    }

    scene.tweens.add({
        targets: pieces,
        x: startX,
        y: startY,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
            pieces.forEach(p => p.destroy());

            // 特效結束，此時 gameState.hasFullKey 為 true，更新 UI 就會完美切換成 full_key 與 x1！
            updateKeyUI(scene);

            scene.tweens.add({
                targets: scene.fragmentIcon,
                scale: 0.75, 
                yoyo: true,
                duration: 300,
                onComplete: () => {
                    scene.fragmentIcon.setScale(0.25,0.33);
                    gameState.keyFusionPlaying = false;
                    if (typeof scene.showHintText === 'function') {
                        scene.showHintText("成功合成完整鑰匙！", 1500);
                    }
                }
            });
        }
    });
}