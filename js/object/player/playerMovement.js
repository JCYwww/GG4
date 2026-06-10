
import { gameState } from '../../systems/core/gameState.js'; // 記得確保有 import 狀態

// 玩家移動
export function handlePlayerMovement() {

    const isGrounded = 
    this.player.body.touching.down || this.player.body.blocked.down;

    const isJumpJustDown = 
    Phaser.Input.Keyboard.JustDown(this.cursors.up) 
    || Phaser.Input.Keyboard.JustDown(this.wasd.up);

    // 基本跑速、跳躍力
    let moveSpeed = 200;          
    let firstJumpVelocity = -500;  
    let secondJumpVelocity = -450; 

    const currentEquipped = gameState.inventory[gameState.selectedSlot];

    // 爆米花
    if (currentEquipped === 'popcorn') {
        moveSpeed = 280; 
    }
    
    // 棉花糖
    if (currentEquipped === 'marshmallow') {
        firstJumpVelocity = -650;  
        secondJumpVelocity = -580; 
    }

    // 跳躍
    if (isGrounded) {
        this.jumpCount = 0; 
    }

    if (isJumpJustDown) {
        if (isGrounded) {
            // 第一跳：使用受裝備加成後的數值
            this.player.setVelocityY(firstJumpVelocity);
            this.jumpCount = 1;
        } else if (this.jumpCount < 2) {
            // 第二跳 (空中跳躍)
            this.player.setVelocityY(secondJumpVelocity); 
            this.jumpCount = 2;
        }
    }

    //移動
    const leftDown = this.cursors.left.isDown || this.wasd.left.isDown;
    const rightDown = this.cursors.right.isDown || this.wasd.right.isDown;

    if (leftDown) {
        this.player.setVelocityX(-moveSpeed); // 套用計算後的 moveSpeed
        this.player.anims.play('left', true);
    } else if (rightDown) {
        this.player.setVelocityX(moveSpeed);  // 套用計算後的 moveSpeed
        this.player.anims.play('right', true);
    } else {
        this.player.setVelocityX(0);
        this.player.anims.play('turn');
    }
}