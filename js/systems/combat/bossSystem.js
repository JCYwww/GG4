// Boss 戰管理系統
// Boss 行為、攻擊模式、與玩家的互動

import { gameState } from '../core/gameState.js';
import { triggerGameOver } from '../core/gameOverSystem.js';
import { hitObstacle } from '../world/interactionSystem.js';
import { handleEnemyAttack } from './combatSystem.js';

export function spawnBoss(x, y) {
    // 如果沒傳座標，給予地牢區的預設合理誕生點（放在玩家右側）
    const spawnX = x !== undefined ? x : 10600;
    const spawnY = y !== undefined ? y : 770;

    // 如果魔王已經存在，就不要重複生成
    if (this.boss && this.boss.active) {
        console.log("👿 魔王已經在場上，不重複生成。");
        return;
    }

    console.log(`🎬 spawnBoss 被呼叫！準備在座標 (X: ${spawnX}, Y: ${spawnY}) 生成魔王...`);

    // 使用物理系統建立魔王
    this.boss = this.physics.add.sprite(spawnX, spawnY, 'boss_walk', 4);
    this.boss.setScale(0.2); // 依遊戲實際大小調整
    this.boss.play('boss_idle_front'); 

    // 設定 Origin 在腳底
    this.boss.setOrigin(0.5, 1);

    // 調整魔王的基本屬性
    this.boss.setCollideWorldBounds(true); 
    this.boss.setDepth(99);                

    // 啟動魔王戰鬥狀態
    // 讓 update 能夠順利抓到牠
    gameState.bossActive = true;
    gameState.bossDefeated = false;

    // 設定魔王與地牢地板的碰撞
    if (this.platforms) {
        this.physics.add.collider(this.boss, this.platforms);
    }

    this.physics.add.overlap(
        this.player,
        this.boss,
        (player, bossSprite) => {
            if (!gameState.bossActive || this.isInvincible) return;

            const fakeAttack = { texture: { key: 'ghost_melee' } };
            handleEnemyAttack(this, player, fakeAttack);
        },
        (player, bossSprite) => {
            return !this.isInvincible;
        },
        this
    );
}

export function hitBoss(amount) {
    if (!gameState.bossActive || !this.boss || !this.boss.active) return;

    // 同步扣除全域與個體血量
    gameState.bossHp = Math.max(0, gameState.bossHp - amount);
    this.boss.hp = gameState.bossHp;

    this.boss.setTint(0xff8888);
    if (this.bossHpText) {
        this.bossHpText.setText(`Boss HP: ${gameState.bossHp}`);
    }

    this.time.delayedCall(150, () => {
        if (this.boss && this.boss.active) {
            this.boss.clearTint();
        }
    });

    if (gameState.bossHp <= 0) {
        defeatBoss.call(this);
    }
}

export function defeatBoss() {
    gameState.bossActive = false;
    gameState.bossDefeated = true;

    if (this.boss && this.boss.active) {
        this.boss.destroy(); // 讓魔王死掉消失
    }

    if (this.bossHpText) this.bossHpText.setVisible(false);
    
    // if (this.missionText) {
    //     this.missionText.setText('任務: 魔王已被擊敗！繼續往右前進，尋找被關押的居民！');
    // }
    
    console.log("⚔️ 魔王倒下了！玩家現在可以繼續往右走前往牢籠區。");
}

export function updateBoss() {
    // 安全檢查：如果魔王沒啟動、或是已經死了，就直接結束
    if (!gameState.bossActive || !this.boss || !this.boss.active) {
        return;
    }

    // 初始化魔王的攻擊計時器與基本狀態
    if (!this.boss.nextAttackTime) {
        this.boss.nextAttackTime = this.time.now + 2000; 
        this.boss.aiState = 'chase'; 
        this.boss.lastDirection = 1; // 記錄最後移動方向 (1: 右, -1: 左)
    }

    // ─── 魔王活著時的 AI 戰鬥邏輯 ───
    
    // 狀態一：移動邏輯 (追逐 或 盲目巡邏)
    if (this.boss.aiState === 'chase' || this.boss.aiState === 'patrol') {
        
        if (gameState.isInvisible) {
            // 玩家隱身，魔王切換為「盲目巡邏」模式，不再追著玩家跑
            this.boss.aiState = 'patrol';

            // 讓魔王依據他「最後面向的方向」繼續走，撞到世界邊界就回頭
            if (this.boss.body.blocked.left || this.boss.x <= 100) { // 依實際場景調整左邊界
                this.boss.lastDirection = 1;
            } else if (this.boss.body.blocked.right) {
                this.boss.lastDirection = -1;
            }

            // 賦予盲目巡邏的速度
            const patrolSpeed = 80; // 沒看到人，走得比平常慢一點
            this.boss.setVelocityX(this.boss.lastDirection * patrolSpeed);
            
            // 播放對應方向的走路動畫
            if (this.boss.lastDirection === -1) {
                this.boss.anims.play('boss_walk_left', true);
            } else {
                this.boss.anims.play('boss_walk_right', true);
            }

        } else {
            // 玩家沒隱身：正常追逐玩家
            this.boss.aiState = 'chase';

            if (this.player.x < this.boss.x) {
                this.boss.setVelocityX(-120);
                this.boss.lastDirection = -1; // 記錄方向
                this.boss.anims.play('boss_walk_left', true);
            } else {
                this.boss.setVelocityX(120);
                this.boss.lastDirection = 1;  // 記錄方向
                this.boss.anims.play('boss_walk_right', true);
            }
        }
    }

    // 時間到了，盲猜選一招發動！（不管隱不隱身都會放招，增加壓迫感）
    if (this.time.now >= this.boss.nextAttackTime) {
        this.boss.setVelocityX(0); // 施法時先停下腳步
        
        const randomSkill = Phaser.Math.Between(0, 2);
    
        if (randomSkill === 0) {
            // 招式 A：地底震波 (朝前中後三個方向擴散，隱身也躲不過)
            const prevState = this.boss.aiState;
            this.boss.aiState = 'casting';
            bossCastShockwave.call(this);
            this.boss.aiState = prevState; // 回歸原本的狀態 (chase 或 patrol)
            this.boss.nextAttackTime = this.time.now + 2000; 
        } 
        else if (randomSkill === 1) {
            // 招式 B：狂暴衝刺 (隱身時，魔王會朝著目前的最後方向盲目衝鋒！)
            this.boss.aiState = 'dash';
            this.boss.setTint(0xffaa00);
            
            // 如果玩家隱身，就往魔王當前方向衝；沒隱身就朝著玩家方向衝
            const dashDir = gameState.isInvisible ? this.boss.lastDirection : ((this.player.x < this.boss.x) ? -1 : 1);
            this.boss.setVelocityX(dashDir * 400);
    
            this.time.delayedCall(800, () => {
                if (this.boss && this.boss.active) {
                    this.boss.clearTint();
                    this.boss.setVelocityX(0);
                    // 恢復原本狀態
                    this.boss.aiState = gameState.isInvisible ? 'patrol' : 'chase';
                    this.boss.nextAttackTime = this.time.now + 2000; 
                }
            });
        }
        else {
            // 招式 C：召喚幽靈軍隊！ (召喚出來的小鬼因為在 bossSummonGhosts 裡會抓 player 座標，會直接朝著隱身前的最後位置飛過去)
            const prevState = this.boss.aiState;
            this.boss.aiState = 'summoning';
            bossSummonGhosts.call(this);
            // 備註：bossSummonGhosts 內部 2 秒後會自己把 aiState 改回 'chase'
            // 為了防止隱身時被強行改成 chase，我們讓它延遲檢查
            this.time.delayedCall(2005, () => {
                if (this.boss && this.boss.active && gameState.isInvisible) {
                    this.boss.aiState = 'patrol';
                }
            });
        }
    }
}

function bossSummonGhosts() {
    console.log("魔王正在召喚幽靈軍隊");
    
    this.boss.setTint(0xcc00ff);
    this.boss.setVelocityX(0); 

    const ghostCount = 3;

    for (let i = 0; i < ghostCount; i++) {
        this.time.delayedCall(i * 400, () => {
            if (!gameState.bossActive || !this.boss || !this.boss.active) return;

            const spawnX = this.boss.x + Phaser.Math.Between(-100, 100);
            const spawnY = this.boss.y - 250;

            const ghost = this.physics.add.sprite(spawnX, spawnY, 'ghost_melee');
            
            ghost.setScale(0.5);
            ghost.setDepth(98); 
            if (ghost.body) {
                ghost.body.setAllowGravity(false); 
            }

            const angle = Phaser.Math.Angle.Between(ghost.x, ghost.y, this.player.x, this.player.y);
            const speed = Phaser.Math.Between(150, 250); 

            ghost.setVelocityX(Math.cos(angle) * speed);
            ghost.setVelocityY(Math.sin(angle) * speed);

            if (ghost.body.velocity.x > 0) {
                ghost.setFlipX(true);
            } else {
                ghost.setFlipX(false);
            }

            this.physics.add.overlap(this.player, ghost, (player, ghostSprite) => {
                if (!this.isInvincible) {
                    import('../../systems/combat/combatSystem.js').then(module => {
                        const fakeAttack = { texture: { key: 'ghost_melee' } };
                        module.handleEnemyAttack(this, player, fakeAttack);
                    });
                    ghostSprite.destroy(); 
                }
            }, null, this);

            this.time.delayedCall(4000, () => {
                if (ghost && ghost.active) {
                    this.tweens.add({
                        targets: ghost,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => { ghost.destroy(); }
                    });
                }
            });
        });
    }

    this.time.delayedCall(2000, () => {
        if (this.boss && this.boss.active) {
            this.boss.clearTint();
            this.boss.aiState = 'chase';
            this.boss.nextAttackTime = this.time.now + 3000;
        }
    });
}

function bossCastShockwave() {
    console.log("魔王發動三向地底震波！");
    
    // 1. Boss 施法前兆特效
    this.boss.setTint(0xff0000); // 變紅提示
    this.time.delayedCall(300, () => {
        if (this.boss && this.boss.active) this.boss.clearTint();
    });

    // 2. 定義三路震波的配置
    const waveConfigs = [
        { key: 'shockwave_left', velocityX: -250, offset: { x: -80, y: -10 }, scale: 0.1 },
        { key: 'shockwave_center', velocityX: 0,   offset: { x: 0,   y: -10 }, scale: 0.15 }, // 中間稍微大一點
        { key: 'shockwave_right', velocityX: 250, offset: { x: 80,  y: -10 }, scale: 0.1 }
    ];
    
    // 3. 遍歷配置建立震波
    waveConfigs.forEach(config => {
        const spawnX = this.boss.x + config.offset.x;
        const spawnY = this.boss.y + config.offset.y;

        // 使用物理系統建立 sprite
        const wave = this.physics.add.sprite(spawnX, spawnY, config.key).setScale(config.scale);

        // 設定 Origin 在腳底，讓特效貼在地面
        wave.setOrigin(0.5, 1);
        wave.setDepth(5); // 讓特效在 Boss 後面

        if (wave.body) {
            // 🎯 新增安全鎖：手動調整碰撞區 (Hitbox) 大小
            wave.body.setSize(100, 100); // 根據實際需求調整
            wave.body.setAllowGravity(false); // 不受重力影響
        } 
            
        // 設定速度
        wave.setVelocityX(config.velocityX); 

        // 4. 設定與玩家的碰撞
        this.physics.add.overlap(this.player, wave, (player, waveSprite) => {
            if (!this.isInvincible) {
                import('../../systems/combat/combatSystem.js').then(module => {
                    // 傳遞正確的特效 key 用於判定攻擊來源
                    module.handleEnemyAttack(this, player, { texture: { key: config.key } });
                });
            }
        }, null, this);

        // 5. 2秒後自動銷毀特效，防止記憶體洩漏
        this.time.delayedCall(2000, () => {
            if (wave && wave.active) wave.destroy();
        });
    });
}