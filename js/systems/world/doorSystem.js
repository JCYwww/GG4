
//doorSystem.js

import { gameState } from '../core/gameState.js';
import { MAP_WIDTH, MAP_HEIGHT } from '../../main/config.js';
import { spawnBoss } from '../../systems/combat/bossSystem.js';
import { setupWorld } from '../world/worldBuilder.js';

export function tryOpenDoor() {
    if (!this.dungeonLever) return;

    const distToLever = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.dungeonLever.x,
        this.dungeonLever.y
    );

    if (distToLever > 120) return;

    // 第一階段：鎖住 -> 解鎖
    if (gameState.leverState === 'locked') {
        if (!gameState.hasFullKey) return;

        if (typeof this.playClickSound === 'function') {
            this.playClickSound();
        }

        gameState.leverState = 'unlocked';
        this.dungeonLever.setTexture('lever_unlocked');

        if (this.itemHintText) {
            this.itemHintText
                .setText('操作桿已解鎖')
                .setVisible(true);
        }

        return;
    }

    // 第二階段：解鎖 -> 拉下
    if (gameState.leverState === 'unlocked') {
        pullDungeonLever.call(this);
        return;
    }
}

export function pullDungeonLever() {
    if (!this.dungeonLever) return;
    if (gameState.leverState !== 'unlocked') return;

    if (typeof this.playClickSound === 'function') {
        this.playClickSound();
    }

    gameState.leverState = 'pulled';
    this.dungeonLever.setTexture('lever_pulled');

    if (this.itemHintText) {
        this.itemHintText.setVisible(false);
    }

    // 遊戲畫面黑幕淡出
    this.cameras.main.fadeOut(1000, 0, 0, 0);

    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        gameState.timerRunning = false;
        this.physics.pause();
        if (this.bgm) this.bgm.stop(); // 關閉關卡 BGM，準備播過場音效

        // 轉場至專門播放「全螢幕過場動畫」的場景
        this.scene.start('EndingCutsceneScene');
    });
}

function formatClearTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 傳送門
export function teleport(player, door) {
    if (this.isTeleporting) return;

    this.isTeleporting = true;

    player.setPosition(door.targetX, door.targetY);

    this.time.delayedCall(300, () => {
        this.isTeleporting = false;
    });
}