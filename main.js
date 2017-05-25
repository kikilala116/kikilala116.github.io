// enchant 初期化(global 領域に enchant を追加)
enchant();

// リミット
var LIMIT_TIME = 30;

/**
 * ロード
 */
window.onload = function()
{
    // ゲームクラスを生成
    var game = new Game(320, 320);
    game.score = 0;

    game.onload = function(){
        // タイム
        var time_label = new Label();
        time_label.x = time_label.y = 2;
        time_label._element.style.zIndex = 128;
        time_label.addEventListener(enchant.Event.ENTER_FRAME, function(){
            var progress = parseInt(game.frame/game.fps);
            time = LIMIT_TIME - parseInt(game.frame/game.fps)+"";
            this.text = "リミット : " + time;
            // タイムが0以下になったらゲームオーバーシーンに移行する
            if (time <= 0) { changeToGameOverScene(); }
        });
        game.rootScene.addChild(time_label);

        // スコア
        var score = new Label();
        score.x = 2; score.y = 16;
        score.text = "スコア : " + 100;
        score._element.style.zIndex = 128;
        score.addEventListener(enchant.Event.ENTER_FRAME, function(){
            this.text = "スコア : " + game.score;
        });
        game.rootScene.addChild(score);

        // エネミーを生成
        for (var i=0; i<8; ++i) {
            var enemy = new EnemySprite();
            enemy.x = Math.random()*320;
            enemy.y = Math.random()*320;
            game.rootScene.addChild(enemy);
        }
    }

    // 背景表示
    game.rootScene.backgroundColor = 'rgb(240, 255, 255)';
    game.start();
}

/**
 * ゲームオーバーシーンに遷移する
 */
var changeToGameOverScene = function()
{
    var game = Game.instance;

    // シーン入れ替え
    var scene = new Scene();
    scene.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    game.replaceScene(scene);

    // ゲームオーバーラベル
    var gameover_label = new CenterLabel("white");
    gameover_label.y = 150;
    gameover_label.text = "Game Over!!";
    scene.addChild(gameover_label);
}

/**
 * @scope   CenterLabel.prototype
 */
var CenterLabel = Class.create(Label, {
    /**
     * 中央表示ラベル
     */
    initialize : function(color){
        // 親のコンストラクタを呼ぶ
        Label.call(this);

        // 中央表示にする
        this.width = 320;
        this._element.style.textAlign = "center";
        // 色を設定
        color = color || "white";
        this.color = color;
    }
});


/**
 * @scope   ArcSprite.prototype
 */
var ArcSprite = Class.create(Sprite, {
    /**
     * 円弧スプライトクラス
     * @memo    enchant の Sprite クラスを継承
     */
    initialize : function(radius){
        // 親のコンストラクタを呼び出す
        Sprite.call(this, radius*2, radius*2);

        // サーフィスを生成
        var surface = new Surface(radius*2, radius*2);
        var c = surface.context
        // サーフィスに円を描画
        c.fillStyle = "rgb(255, 0, 0)";
        c.beginPath();
        c.arc(radius, radius, radius, 0, Math.PI*2, true);
        c.fill();

        // スプライトにサーフィスをイメージとして登録
        this.image = surface;
    }
});

/**
 * @scope   EnemySprite.prototype
 */
var EnemySprite = Class.create(ArcSprite, {
    /**
     * エネミースプライトクラス
     */
    initialize : function(){
        // 親のコンストラクタを呼び出す
        ArcSprite.call(this, EnemySprite.RADIUS);
        // タッチイベントを登録
        this.addEventListener(Event.TOUCH_START, this.onTouch);
        // フレームイベントを登録
        this.addEventListener(Event.ENTER_FRAME, this.onEnterFrame);

        // 移動する向きを設定(360度ランダムな方向に ENEMY_SPEED ずつ進む)
        var rad = Math.random()*360 * Math.PI/180;
        this.vx = Math.cos(rad) * EnemySprite.SPEED;
        this.vy =-Math.sin(rad) * EnemySprite.SPEED;

        // エフェクトと重複した際にタッチがきかなくなるので手前に表示するよう修正
        this._element.style.zIndex = 4;
    },
    onTouch : function(e){
        // ゲームインスタンスを取得
        var game = Game.instance;
        var scene = game.rootScene;
        // スコア
        game.score += 100;

        // クラッシュ生成
        var crush = new CrushParticle();
        crush.moveTo(
            this.x + this.width /2 - 4,
            this.y + this.height/2 - 4
            );
        scene.addChild(crush);

        // 自身を削除
        scene.removeChild(this);
        // 新たな敵を生成
        var enemy = new EnemySprite();
        enemy.x = Math.random()*320;
        enemy.y = Math.random()*320;
        scene.addChild(enemy);
    },

    onEnterFrame : function(){
        var scene = this.parentNode;
        // 移動
        this.moveBy(this.vx, this.vy);
        // スプライトの上下左右位置
        var left    = this.x;
        var right   = this.x + this.width;
        var top     = this.y;
        var bottom  = this.y + this.height;
        // はみ出た際の処理
        if (left   < 0) { this.x = 0; this.vx*=-1; }
        if (top    < 0) { this.y = 0; this.vy*=-1; }
        if (right  > scene.width) { this.x = scene.width -this.width;  this.vx*=-1; }
        if (bottom > scene.height){ this.y = scene.height-this.height; this.vy*=-1; }
    }
});
// static
EnemySprite.RADIUS = 16;
EnemySprite.SPEED = 2;

/**
 * @scope   CrushParticle.prototype
 */
var CrushParticle = Class.create(Group, {
    /**
     *
     */
    initialize : function(){
        // 親のコンストラクタを呼び出す
        Group.call(this);

        // フレームイベントを登録
        this.addEventListener(enchant.Event.ENTER_FRAME, this.onEnterFrame);

        // パーティクルを生成
        for (var i=0; i<8; ++i) {
            var particle = new ArcSprite(8);
            particle.x = particle.y = 0;
            // 移動する向きを設定
            var rad = 2*Math.PI / 8*i;
            particle.vx = Math.cos(rad);
            particle.vy =-Math.sin(rad);
            // 消える時間を設定
            particle.life = 30;

            // 更新関数を登録
            particle.update = function()
            {
                // 移動
                this.x += this.vx; this.y += this.vy;
                // ライフに応じて透過度を変更
                this.opacity = this.life/30;
                // ライフを減らす
                this.life -= 1;
                // true : ライフが0より大きい, false : ライフが0以下
                return this.life > 0;
            }
            // クラッシュノードに自身を追加
            this.addChild(particle);
        }
    },

    onEnterFrame: function(){
        // 登録されているパーティクルを更新
        for(var i=0; i<this.childNodes.length; ++i) {
            var particle = this.childNodes[i];
            if (particle.update() == false) {
                this.removeChild( particle );
            }
        }
        // 全てのノードがなくなったら自分自身を消す
        if (this.childNodes.length <= 0) {
            var p = this.parentNode;
            p.removeChild(this);
        }
    }
});
 
