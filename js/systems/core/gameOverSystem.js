
// gameOver

import { gameState, resetGameState } from './gameState.js';

export function createGameOverUI(scene) {
    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;

    scene.gameOverOverlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.55)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(9000)
        .setVisible(false);

    scene.gameOverPanel = scene.add.image(width / 2, height / 2, 'game_over_panel')
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(9001)
        .setScale(0.7)
        .setVisible(false);

    scene.restartGameOverButton = createImageButton(
        scene,
        width / 2,
        height / 2 + 55,
        'restart_button',
        () => {
            gameState.gameOver = false;
            scene.physics.resume();
            scene.scene.restart();
        }
    ).setVisible(false);

    scene.quitGameOverButton = createImageButton(
        scene,
        width / 2,
        height / 2 + 145,
        'quit_button',
        () => {
            gameState.gameOver = false;
            scene.physics.resume();
            scene.scene.start('CoverScene');
        }
    ).setVisible(false);
}

function createImageButton(scene, x, y, texture, onClick) {
    const button = scene.add.image(x, y, texture)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(10000)
        .setScale(0.7)
        .setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
        button.setScale(0.74);
        button.setTint(0xffffff);
    });

    button.on('pointerout', () => {
        button.setScale(0.7);
        button.clearTint();
        button.setAlpha(1);
    });

    button.on('pointerdown', () => {
        button.setScale(0.66);
        button.setAlpha(0.85);

        if (scene.playClickSound) {
            scene.playClickSound();
        }

        onClick();
    });

    return button;
}

export function triggerGameOver(scene) {
    gameState.gameOver = true;
    scene.physics.pause();

    if (!scene.gameOverOverlay || !scene.gameOverPanel) {
        createGameOverUI(scene);
    }

    scene.gameOverOverlay.setVisible(true);
    scene.gameOverPanel.setVisible(true);
    scene.restartGameOverButton.setVisible(true);
    scene.quitGameOverButton.setVisible(true);

    console.log("遊戲結束！玩家已陣亡。");
}

export function damagePlayer(scene, amount) {
    if (gameState.gameOver) return;

    gameState.hp = Math.max(0, gameState.hp - amount);

    if (scene.hpText) {
        scene.hpText.setText(`HP: ${gameState.hp}/${gameState.maxHp}`);
    }

    if (gameState.hp <= 0) {
        triggerGameOver(scene);
        return;
    }

    if (scene.player) {
        scene.tweens.add({
            targets: scene.player,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 4,
            onComplete: () => {
                if (scene.player) scene.player.setAlpha(1);
            }
        });
    }

    scene.time.delayedCall(1000, () => {
        scene.isInvincible = false;
    });
}