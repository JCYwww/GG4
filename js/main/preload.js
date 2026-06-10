
// 預載資源
// 圖片、角色動作序列圖、動畫、音效

export function preloadAssets() {

// 音樂
    this.load.audio('bgm_music', 'assets/audio/BG.mp3');
    this.load.audio('click_sound', 'assets/audio/select_sound.mp3');

// UI 
    //左側 UI (血量、任務欄、裝備欄)
    this.load.image('hp_bar_bg', 'assets/ui/愛心加長 深色.png');
    this.load.image('mission_bg', 'assets/ui/mission_bg.png');
    this.load.image('slot_bg', 'assets/ui/未使用.png');
    this.load.image('yellow_frame', 'assets/ui/使用.png');

    //右側 UI (計時器、鑰匙碎片欄、問題、設定按鈕)
    this.load.image('clock', 'assets/ui/clock.png');
    this.load.image('fragment_bar', 'assets/ui/fragment_bar1.png');
    this.load.image('full_key', 'assets/items/full_key1.png');
    this.load.image('help_panel', 'assets/ui/help_panel.png');
    this.load.image('setting_panel', 'assets/ui/setting_panel.png');
    this.load.image('help_btn', 'assets/ui/helpBtn.png');
    this.load.image('setting_btn', 'assets/ui/settingBtn.png');

    //設定介面 (音量調節)
    this.load.image('slider_track', 'assets/ui/slider_track.png');
    this.load.image('slider_knob', 'assets/ui/slider_knob.png');

    //說明介面 (按鍵、道具)
    this.load.image('help_panel', 'assets/ui/help_panel.png');          
    this.load.image('btn_key_bg', 'assets/ui/btn_key_bg.png');        
    this.load.image('btn_item_bg', 'assets/ui/btn_item_bg.png');      
    this.load.image('arrow_left', 'assets/ui/arrow_left.png');         
    this.load.image('arrow_right', 'assets/ui/arrow_right.png');      
    this.load.image('key_guide_page1', 'assets/ui/key_page1.png');
    this.load.image('key_guide_page2', 'assets/ui/key_page2.png');
    this.load.image('item_guide_page1', 'assets/ui/item_page1.png');
    this.load.image('item_guide_page2', 'assets/ui/item_page2.png');

    //失敗介面
    this.load.image('game_over_panel', 'assets/ui/Game Over.png');
    this.load.image('restart_button', 'assets/ui/Restart.png');
    this.load.image('quit_button', 'assets/ui/Quit.png');
    
    //對話框、提示按鍵
    this.load.image('dialog_box', 'assets/ui/dialog_box.png');
    this.load.image('key_E', 'assets/ui/key_E.png');
    this.load.image('key_Q', 'assets/ui/key_Q.png');
    this.load.image('key_left_mouse', 'assets/ui/key_left_mouse.png');
    this.load.image('key_right_mouse', 'assets/ui/key_right_mouse.png');

//場景物品
    this.load.image('background', 'assets/Scene/Scene.png');
    this.load.image('platform', 'assets/Scene/Floor.PNG');
    this.load.image('Door', 'assets/Scene/door.PNG');
    this.load.image('wall', 'assets/Scene/Wall.PNG');
    this.load.image('cookieHome', 'assets/Scene/CookieHome.PNG');
    this.load.image('bossWall', 'assets/Scene/魔王雕像.PNG');
    this.load.image('tableDesk', 'assets/Scene/tableDesk.PNG');
    this.load.image('desk', 'assets/Scene/desk.PNG');
    this.load.image('bookcase11', 'assets/Scene/bookcase.png');
    this.load.image('vase', 'assets/Scene/vase.png');
    this.load.image('board', 'assets/Scene/board.PNG');
    this.load.image('table', 'assets/Scene/table1.png');
    this.load.image('clock11', 'assets/Scene/clock.PNG');
    this.load.image('bossPortrait', 'assets/Scene/bossPortrait.PNG');
    this.load.image('plate', 'assets/Scene/盤子.png');

// 動作序列圖
    this.load.spritesheet(
        'player',
        'assets/player2.png',
        {
            frameWidth: 98,
            frameHeight: 154
        }
    );

    this.load.spritesheet('boss_walk', 'assets/enemies/魔王動作新1.png', {
        frameWidth: 1494,
        frameHeight: 1272
    });

// 道具
    this.load.image('bubbleGun', 'assets/泡泡糖防護罩.png');
    this.load.image('jelly', 'assets/items/果凍.png');
    this.load.image('popcorn', 'assets/items/popcorn.png');
    this.load.image('marshmallow', 'assets/雲朵棉花糖.png');
    this.load.image('candy', 'assets/items/彩虹糖.png');

// 幽靈軍隊、魔王
    this.load.image('boss', 'assets/enemies/boss.png');
    this.load.image('ghost_melee', 'assets/enemies/ghost_melee.png');
    this.load.image('ghost_range', 'assets/enemies/ghost_range.png');
    this.load.image('candy_arrow', 'assets/candy_arrow.png');
    this.load.image('shockwave', 'assets/spark.png');
    this.load.image('shockwave_left', 'assets/魔王攻擊左.png');
    this.load.image('shockwave_center', 'assets/魔王攻擊中.png');
    this.load.image('shockwave_right', 'assets/魔王攻擊右.png');

// 鏡子解謎
    const path = 'assets/PUZZLE_Mirror/';
    // 基礎裝飾
    this.load.image('bg', path + '背景.PNG');
    this.load.image('pillars', path + '柱子（裝飾.png');
    this.load.image('stool', path + '凳子（裝飾.png');
    this.load.image('mirror_back', path + '鏡子背板.png');
    this.load.image('mirror_frame', path + '鏡框.png');
    // 倒影與文字
    this.load.image('reflection_real', path + '村民眼中魔王樣子.png');
    this.load.image('text_real', path + '村民眼中魔王幻想文字.png');
    this.load.image('reflection_fantasy', path + '好看魔王幻想.png');
    this.load.image('text_fantasy', path + '好看魔王幻想文字.png');
    this.load.image('reflection_center', path + '中間魔王.png');
    // 各邊鏡面與碎裂狀態
    this.load.image('intact_left', path + '完整鏡面左邊.png');
    this.load.image('crack_left', path + '左邊碎裂痕跡.png');
    this.load.image('broken_left', path + '碎裂後鏡面左邊.png');
    this.load.image('intact_center', path + '完整鏡面中間.png');
    this.load.image('crack_center', path + '中間碎裂痕跡.png');
    this.load.image('broken_center', path + '碎裂後鏡面中間.png');
    this.load.image('intact_right', path + '完整鏡面右邊.png');
    this.load.image('crack_right', path + '右邊碎裂痕跡.png');
    this.load.image('broken_right', path + '碎裂後鏡面右邊.png');

// 照片解謎
    this.load.image('CompleteP', 'assets/PUZZLE_Photo/完整照片新.png');
    this.load.image('P1', 'assets/PUZZLE_Photo/1.png');
    this.load.image('P2', 'assets/PUZZLE_Photo/2.png');
    this.load.image('P3', 'assets/PUZZLE_Photo/3.png');
    this.load.image('P4', 'assets/PUZZLE_Photo/4.png');
    this.load.image('P5', 'assets/PUZZLE_Photo/5.png');
    this.load.image('P6', 'assets/PUZZLE_Photo/6.png');
    this.load.image('P7', 'assets/PUZZLE_Photo/7.png');
    this.load.image('P8', 'assets/PUZZLE_Photo/8.png');
    this.load.image('P9', 'assets/PUZZLE_Photo/9.png');

// 書櫃解謎
    this.load.image('bookcaseBG', 'assets/圖書館/書櫃BG.png');
    this.load.image('bookcaseP', 'assets/圖書館/書櫃Platform.png');
    this.load.image('shadow1', 'assets/圖書館/殘影1.png');
    this.load.image('shadow2', 'assets/圖書館/殘影2.png');
    this.load.image('shadow3', 'assets/圖書館/殘影3.png');

// 地牢
    //底
    this.load.image('dungeon_bg', 'assets/地牢/地牢背景.PNG');
    this.load.image('dungeon_front', 'assets/地牢/地牢前景.png');
    this.load.image('dungeon_floor', 'assets/地牢/地牢地板.PNG');
    //牢籠
    this.load.image('cages_full', 'assets/地牢/關著的餅乾新.png');
    this.load.image('cages_empty', 'assets/地牢/空牢籠.png');
    //操作桿
    this.load.image('lever_locked', 'assets/地牢/操作桿_上鎖.png');
    this.load.image('lever_unlocked', 'assets/地牢/操作桿.png');
    this.load.image('lever_pulled', 'assets/地牢/拉下的操作桿.png');

// 結束動畫
    this.load.video('ending_video', 'assets/video/ENDing1.mp4');
}   