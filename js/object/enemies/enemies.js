import { gameState } from '../../systems/core/gameState.js';
import { damagePlayer } from '../../systems/core/gameOverSystem.js';

// 幽靈初始化
// 初始化幽靈群組、設定初始位置與屬性、註冊全域碰撞監聽器
export function setupGhosts() {
    this.ghosts = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();

    const ghostPositions = [
        { x: 800, y: 300, type: 'ghost_melee' },  
        { x: 1600, y: 350, type: 'ghost_range' },  
        { x: 2800, y: 400, type: 'ghost_melee' }
    ];

    ghostPositions.forEach(pos => {
        const ghost = this.ghosts.create(pos.x, pos.y, pos.type).setScale(0.3);
        ghost.body.setAllowGravity(false); 

        ghost.setData('startX', pos.x);
        ghost.setData('baseY', pos.y);
        ghost.setData('type', pos.type);
        ghost.setData('lastAttackTime', 0); 

        ghost.setVelocityX(60);
    });

    // 只註冊一次群組碰撞，避免每發射一次子彈就新增一個監聽器
    this.physics.add.overlap(this.player, this.enemyProjectiles, (playerObj, projectileObj) => {
        if (projectileObj && projectileObj.active) {
            console.log("🏹 玩家被糖霜箭射中！");
            projectileObj.body.enable = false; 
            projectileObj.destroy();
            damagePlayer(this, 2); // 扣 2 點血
        }
    });
}

// 幽靈更新
// 遊戲狀態檢查、玩家偵測、近/遠戰幽靈行為、巡邏與漂浮特效
export function updateGhosts() {
    if (!this.ghosts || this.ghosts.getLength() === 0) return;
    
    if (gameState.gameOver || gameState.puzzleActive) {
        this.ghosts.getChildren().forEach(ghost => ghost.setVelocity(0, 0));
        return;
    }

    const player = this.player;

    this.ghosts.getChildren().forEach(ghost => {
        if (!ghost.body) return;

        const startX = ghost.getData('startX');
        const baseY = ghost.getData('baseY');
        const ghostType = ghost.getData('type');
        
        const distanceToPlayer = gameState.isInvisible 
            ? 9999 
            : Phaser.Math.Distance.Between(ghost.x, ghost.y, player.x, player.y);

        // 偵測半徑 300
        if (distanceToPlayer < 300) {
            
            if (ghostType === 'ghost_melee') {
                const angle = Phaser.Math.Angle.Between(ghost.x, ghost.y, player.x, player.y);
                this.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), 130, ghost.body.velocity);
            } 
            else if (ghostType === 'ghost_range') {
                ghost.setVelocityX(player.x < ghost.x ? -40 : 40);
                ghost.y = baseY + Math.sin(this.time.now / 200) * 10;
                ghost.setVelocityY(0); 

                const currentTime = this.time.now;
                const lastAttack = ghost.getData('lastAttackTime');
                if (currentTime - lastAttack > 2000) {
                    ghostShootProjectile.call(this, ghost, player);
                    ghost.setData('lastAttackTime', currentTime);
                }
            }

            ghost.setFlipX(player.x < ghost.x);

        } else {
            // 巡邏
            if (ghost.x > startX + 150) {
                ghost.setVelocityX(-60);
                ghost.setFlipX(true);
            } else if (ghost.x < startX - 150) {
                ghost.setVelocityX(60);
                ghost.setFlipX(false);
            } else if (ghost.body.velocity.x === 0) {
                ghost.setVelocityX(-60);
                ghost.setFlipX(true);
            }

            // 視覺特效：上下漂浮
            ghost.y = baseY + Math.sin(this.time.now / 200) * 10;
            ghost.setVelocityY(0);
        }
    });
}

// 遠程幽靈
function ghostShootProjectile(ghost, player) {
    const scene = this; 

    if (!scene.enemyProjectiles) {
        scene.enemyProjectiles = scene.physics.add.group();
    }

    const projectile = scene.enemyProjectiles.create(ghost.x, ghost.y, 'candy_arrow').setScale(0.5);
    projectile.body.setAllowGravity(false);

    const angle = Phaser.Math.Angle.Between(ghost.x, ghost.y, player.x, player.y);
    scene.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), 200, projectile.body.velocity);
    projectile.setRotation(angle);
    scene.time.delayedCall(4000, () => {
        if (projectile && projectile.active) projectile.destroy();
    });
}