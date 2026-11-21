# Amaterasu Learning Runner

## Play

`index.html` をブラウザで開くと、そのままプレイできます。キャラクターは `asset/charactor/amaterasu/` の3段階のスプライトを使用し、背景と障害物は Canvas で描画したダミーです。ビルドは不要です。

画面UIは、太いピクセル枠・段差影・濃紺／朱色／金色を基調としたレトロゲーム風デザインです。

英語を初期表示とし、英語・日本語・スペイン語・中国語・韓国語を言語パネルから切り替えられます。選択言語はゲーム画面、HUD、判定メッセージ、ステージ名、結果画面まで引き継がれ、端末へ保存されます。タイトルの `AMATERASU LEARNING RUNNER` と学習対象のかな・日本語音声は全言語共通です。

タイトル画面にはStage 1の神社背景を使用し、Normalアマテラスが歩行アニメーションで横切ります。ゲーム終了画面には、終了時点で到達していたステージの背景を引き継ぎます。

音声にはブラウザ標準の日本語読み上げ機能を使用しています。端末に日本語音声がない場合でもゲーム進行は可能です。

正解時は通常の取得チャイムを鳴らし、3・10・20・30・40・50コンボで `asset/correct/levelUpLv1.mp3` から `levelUpLv6.mp3` を順に再生します。60コンボ以降は10コンボごとに `levelUpLv7` 系のバリエーションを再生します。

キャラクタースプライトは14コマ構成です。1コマ目は立ち、2〜5は歩行、6はジャンプ、7は着地、8は障害物命中、9は穴への落下、10〜11はパワーアップ、12〜13は浮遊系の将来用、14はやられ状態として扱います。進化時は旧形態の10コマ目から新形態の11コマ目へ切り替えます。

Japanese-learning endless runner game built with Phaser.

プレイヤーは自動で走り続けるキャラクターを見ながら、再生された日本語音声と画面に表示されたかな文字が一致しているかを判断します。

操作は基本的に **JUMPする / 何もしない** の2択だけです。

ゲームシステムそのものはできるだけ単純に保ち、

* COMBO
* キャラクター進化
* DISTANCEによる景色の変化
* BGM / SEの高揚
* 学習成果の可視化

によって、

> 気付いたら日本語を何十問も練習していた

という状態を目指します。

---

# Game Concept

最重要方針：

> システムを複雑化するのではなく、単純な学習行動に対するフィードバックを豪華にする。

基本となる学習行動は、

```text
音を聞く
↓
かなを見る
↓
一致しているか判断する
↓
JUMP / NO JUMP
↓
結果を見る
```

だけです。

この単純なループに対して、ゲーム側が視覚・音・進行による報酬を与えます。

---

# Core Progression

ゲームでは4種類の進捗を扱います。

## COMBO

短期的な達成感。

```text
「今、自分はうまくできている」
```

正解すると増加し、ミスすると0になります。

---

## POWER UP

連続正解によるキャラクターの進化。

```text
「キャラクターが強くなった」
```

COMBOに応じてキャラクター・エフェクト・BGMなどが変化します。

---

## DISTANCE / STAGE

長期的な旅の進行。

```text
「こんな遠くまで来た」
```

走行距離によって背景・障害物・雰囲気などが変化します。

COMBOとは独立したシステムです。

---

## LEARNING

ゲーム終了後に表示される学習成果。

```text
「ちゃんと日本語を勉強した」
```

回答数、正答率、練習した文字などを可視化します。

---

# Basic Game Loop

```text
1. キャラクターが自動で走る
2. 前方を霧で隠す
3. かな音声を再生
4. かな1文字を表示
5. カウントダウン開始
6. JUMPするか判断
7. カウント0で入力確定
8. 霧が晴れる
9. 障害物が公開される
10. JUMP / 通常走行
11. 正誤判定
12. 正解ならCOMBO・SCORE・DISTANCE進行
13. ミスならHEART減少・COMBOリセット・ルクス化
14. 次の問題へ
```

正誤判定は時間だけでは確定せず、公開された障害物がキャラクターの当たり判定位置へ到達した瞬間に行います。回避に失敗した場合は、その接触フレームでHEART減少・画面揺れ・命中モーションを発生させます。

HEARTが0になるまでエンドレスで続きます。

明確なゴールはありません。

---

# Learning System

基本形式：

```text
音声 + かな文字
```

音声と表示文字が一致しているかを判断します。

### Match

```text
Audio: か

Screen: か

→ JUMP
```

### Mismatch

```text
Audio: か

Screen: き

→ NO JUMP
```

メインゲームでは原則としてローマ字を表示しません。

目的は、

```text
音 → ローマ字 → かな
```

ではなく、

```text
音 ↔ かな
```

を直接結びつけることです。

---

# Controls

基本操作はJUMPのみ。

カウント中にJUMPボタンを押すと、

```text
JUMP READY
```

になります。

もう一度押すとキャンセル。

```text
JUMP READY
↓
CANCEL
```

カウントが0になった時点の状態を回答として確定します。

これにより誤タップしても回答確定前なら修正できます。

---

# Fog System

進行方向を霧で隠し、障害物を見てから回答できないようにします。

霧は基本的に画像素材を使用せず、

* CSS gradient
* blur
* opacity
* transform
* animation

などで表現します。

カウント0で霧を晴らします。

将来的には、

```text
3
2
1
0
↓
霧が前方へ吹き飛ぶ
```

という演出を追加可能です。

---

# Obstacles

ゲーム内部では障害物を基本的に2種類だけに分類します。

## JUMP_REQUIRED

ジャンプすれば成功。

例：

* 穴
* 岩
* 倒木
* 地面系障害物

---

## NO_JUMP

ジャンプしなければ成功。

例：

* 上空ブロック
* 頭上障害物

---

ステージごとに見た目を変更しても、内部ルールは増やしません。

```text
Visual Design
≠
Game Rule
```

新しい背景や障害物を追加しても、

```text
JUMP_REQUIRED
NO_JUMP
```

のどちらかに分類します。

---

# Hearts

開始時：

```text
❤️❤️❤️
```

ミス：

```text
❤️ -1
```

回復：

```text
なし
```

HEARTが0になるとGAME OVERです。

---

# Combo

正解：

```text
COMBO +1
```

ミス：

```text
COMBO = 0
```

主要マイルストーン：

```text
3
10
20
30
40
50
```

各マイルストーンで、

* SE
* BGM
* エフェクト
* キャラクター変化

などを発生させます。

---

# Character Evolution

現在の進化案：

## 0–2 COMBO

```text
Lux
```

初期形態。

---

## 3 COMBO

```text
Amaterasu
```

最初の進化。

初心者でも早い段階で成功体験を得られるよう、3連続正解で進化します。

---

## 10 COMBO

キャラクターの大きな進化はありません。

主に、

* COMBO SE
* BGM
* エフェクト

によって次の領域へ入ったことを伝えます。

---

## 20 COMBO

```text
Super Amaterasu
```

明確な強化形態。

大きな進化演出を使用します。

---

## 30 COMBO

高COMBO演出。

キャラクター進化は必須ではありません。

---

## 40 COMBO

50 COMBO直前の激アツ領域。

最終進化が近いことを強調します。

---

## 50 COMBO

```text
Radiant Amaterasu
```

最終形態。

最大級の、

* SE
* 発光
* BGM
* 画面演出

を使用します。

50 COMBO以降もゲームは継続します。

---

# Power Down

ミスすると現在の強化段階に関係なく、

```text
HEART -1
COMBO = 0
Character = Lux
Speed = Base Speed
BGM Layers = Base
Effects = Reset
```

とします。

段階的なパワーダウンは行いません。

一度のミスですべて初期状態へ戻します。

---

# Combo Milestones

現在の設定：

| COMBO | Role            |
| ----: | --------------- |
|     3 | First Evolution |
|    10 | Strong Combo    |
|    20 | Super Evolution |
|    30 | High Combo      |
|    40 | Pre-Climax      |
|    50 | Final Awakening |

後半ほどSE・画面演出・歓声を強くします。

歓声はBGMへ直接焼き込まず、基本的に独立SEとして扱います。

---

# Audio

ゲーム内で最も重要な音は、

```text
かなの発音音声
```

です。

BGMやSEによって発音が聞こえなくなることは避けます。

---

## BGM Layers

可能であればBGMは同期したレイヤー構造にします。

```text
BASE
+
RHYTHM
+
POWER
+
CLIMAX
```

COMBOが増えるほどレイヤーを追加します。

方向性：

```text
Modern Game BGM
×
Japanese Instruments
```

伝統音楽そのものではなく、現代的なゲーム音楽を中心とします。

---

## Audio Ducking

問題音声を再生するときはBGMを下げます。

```text
Normal BGM
100%

↓

Kana Voice

BGM
30–50%

↓

Voice End

↓

100–200ms

↓

BGM
100%
```

発音中は大きなSEを原則重ねません。

---

# Score / Items

正解ルートには日本的なアイテムを配置できます。

候補：

* 風鈴
* 巻物

取得時にスコアを加算します。

アイテム取得SEを正解フィードバックとして使用し、

```text
Correct!
```

のような追加SEを毎回答で大量に鳴らすことは避けます。

---

# Distance

COMBOとは独立した値として走行距離を管理します。

概念：

```js
distance += currentSpeed * deltaTime;
```

距離によって、

* STAGE
* 背景
* 障害物
* BGM
* 雰囲気

などを変更します。

表示する場合：

```text
DISTANCE 2840
```

単位は付けません。

---

# Stage System

STAGE構成は現在まだ確定していません。

そのため、

```text
Stage 3 = Sea
```

のような実装をゲームロジックに直接書きません。

STAGEは設定データとして管理します。

---

## StageConfig

概念：

```js
const STAGE_CONFIG = [
  {
    id: "shrine",
    name: "Shrine",
    startDistance: 0,

    background: "shrine",

    obstacles: [
      "stoneLantern",
      "rock"
    ],

    bgm: "shrine",

    effects: [],

    atmosphere: "normal"
  }
];
```

ゲーム本体は、

```js
const stage = getStageByDistance(distance);
```

によって現在のSTAGEを取得するだけにします。

これにより、

* STAGE順変更
* STAGE追加
* STAGE削除
* 背景差し替え
* 必要距離変更
* 障害物変更
* BGM変更

をゲームロジックの大幅な変更なしで行えるようにします。

---

# Final Stage Configuration

最終的なステージ構成：

| Stage | Name | Start Distance | Background | Obstacles / Direction |
| ---: | --- | ---: | --- | --- |
| 1 | 神社 | 0 | `1.png` | 石灯籠・石・注連縄 |
| 2 | 桜並木 | 700 | `2.png` | 落ちた枝・庭石・垂れ下がる桜の枝 |
| 3 | 葛飾北斎の波 | 1600 | `3.png` | 抜けた橋板・桶・吊り提灯。巨大な波は背景演出 |
| 4 | 富士山 | 2800 | `4-01.png`〜`4-02.png` | 岩・倒木・低い枝 |
| 5 | 田舎のホラー | 4300 | `5-00.png`〜`5-14.png` | 地蔵・倒れた自転車・農具・垂れた竹 |
| 6 | 京都 | 6200 | `6.png` | 荷車・木箱・桶・暖簾 |
| 7 | 黄泉の国 | 8500 | `7.png` | 骸骨・黒い岩・地面から伸びる手・鬼火 |
| 8 | たぬきと狐の仙人の里 | 11300 | `8.png` | 雲の塊・ひょうたん・仙桃の籠・浮遊物 |

Stage 5では、走行距離に応じて背景を `5-00` から `5-14` まで順番に切り替え、日本人形が徐々に近づく恐怖演出を行います。日本人形自体は障害物として判定しません。

Stage 7突入直後の最初のかな音声をToyo本人の声にする演出は、音声素材追加後に実装可能な演出候補として残します。

Stage 8到達後は、仙人の里でエンドレス走行します。

---

# Stage Length

後半ほどSTAGEを長くする方向です。

COMBOによって走行速度が上がるため、

```text
Speed Up
+
Stage Length Up
```

とすることで、後半でも景色が短時間で切り替わりすぎないようにします。

現在の開始距離は上記の `Start Distance` を使用し、プレイテストに応じて設定データだけを調整します。

---

# Stage Obstacles

各ステージの障害物候補は `Final Stage Configuration` の表に従います。

内部判定は常に、

```text
JUMP_REQUIRED
or
NO_JUMP
```

です。

---

# Yomi

黄泉を採用する場合、通常STAGEとは異なる特殊演出を入れます。

候補：

* 色調変化
* BGM停止
* Yomi専用BGM
* 特殊な霧
* 鬼火
* 骸骨
* 環境音
* 境界となる鳥居

黄泉を最終STAGEにする場合は、その後も黄泉内部でエンドレス走行可能にします。

黄泉自体も現在は仮案です。

---

# Special Voice

黄泉を採用した場合の演出候補。

通常：

```text
Standard Kana Voice
```

黄泉突入後の最初の1問：

```text
Toyo Voice
```

目的は難易度上昇ではなく、

```text
「何かがおかしい」
```

という違和感の演出です。

その後は通常音声へ戻します。

---

# Game Speed

COMBOが高くなるほどゲームテンポを上げます。

対象：

* Character Speed
* Question Tempo
* Countdown Time

ただし高速化しすぎて、

```text
Japanese Recognition Game
↓
Reflex Game
```

にならないよう最低判断時間を設定します。

具体値はプレイテストで決定します。

---

# UI

最低限表示：

```text
❤️❤️❤️

COMBO 17

SCORE 1250
```

問題：

```text
か
```

カウント：

```text
3
2
1
0
```

操作：

```text
JUMP
```

予約中：

```text
JUMP READY
```

---

# Game Over

HEARTが0になるとゲーム終了。

最低限表示する結果：

```text
SCORE
MAX COMBO
ACCURACY
ANSWERED
```

将来的には、

```text
PERSONAL BEST
TODAY'S PRACTICE
TOTAL PRACTICE
WEAK KANA
CONFUSING KANA
```

なども追加します。

---

# Learning Result

例：

```text
RUN OVER

SCORE        18,420
MAX COMBO        37

HIRAGANA TRAINING

82 answered
76 correct
Accuracy 92.7%

TODAY
184 kana practiced
```

ゲーム中はゲームとして楽しませ、

終了時に学習量を可視化します。

---

# MVP Learning Set

最初から全かなを実装する必要はありません。

初期テスト：

```text
あ
い
う
え
お

か
き
く
け
こ
```

10文字程度から開始します。

ゲームループが面白いことを確認してから拡張します。

---

# MVP Priorities

実装優先順位：

1. Existing runner code reuse
2. Endless run
3. Audio + kana question
4. Jump reservation / cancel
5. Countdown
6. Fog
7. Obstacle reveal
8. Answer judgment
9. Three hearts
10. Combo
11. Combo milestones
12. Character evolution
13. Full power-down on mistake
14. Speed progression
15. BGM / SE
16. Distance
17. StageConfig
18. Game Over
19. Learning result

---

# Not MVP

ゲームの核が面白いと確認できるまで後回し：

* Ranking
* Login
* Gacha
* Shop
* Character leveling
* Complex stage gimmicks
* Additional controls
* Heart recovery
* Story mode
* Large evolution movies
* Huge obstacle variety
* Full kana asset production

---

# Architecture Principles

## Data-driven Config

可変要素は可能な限り設定データへ移動します。

特に、

```text
COMBO
EVOLUTION
STAGE
SPEED
AUDIO
OBSTACLE
```

をゲーム本体へ直接ハードコードしすぎないようにします。

---

## ComboConfig

概念：

```js
const COMBO_CONFIG = [
  {
    combo: 3,
    evolution: "amaterasu",
    se: "combo3",
    bgmLayer: "rhythm"
  },

  {
    combo: 10,
    evolution: null,
    se: "combo10",
    bgmLayer: "power1"
  },

  {
    combo: 20,
    evolution: "superAmaterasu",
    se: "combo20",
    bgmLayer: "power2"
  },

  {
    combo: 30,
    evolution: null,
    se: "combo30",
    bgmLayer: "high"
  },

  {
    combo: 40,
    evolution: null,
    se: "combo40",
    bgmLayer: "preClimax"
  },

  {
    combo: 50,
    evolution: "radiantAmaterasu",
    se: "combo50",
    bgmLayer: "climax"
  }
];
```

ゲーム本体側は、

```js
const comboState = getComboState(combo);
```

によって状態を取得します。

---

# Core Design Philosophy

このゲームで最も重要なのはシステム数ではありません。

目指す体験：

```text
聞こえた！
↓
分かった！
↓
正解した！
↓
COMBOが増えた！
↓
進化した！
↓
景色まで変わった！
↓
もっと先へ行きたい！
↓
気付いたら日本語を何十問も練習していた！
```

ゲームシステムは可能な限り単純に維持します。

```text
Listen
↓
Recognize
↓
Decide
↓
Success
↓
Reward
```

という小さな学習行動に対する報酬を最大化します。

---

# Current Specification Status

## Mostly Confirmed

* Endless runner
* Audio / kana matching
* JUMP / NO JUMP
* Three hearts
* No heart recovery
* Mistake resets COMBO
* Mistake resets character to Lux
* Combo-based excitement
* Distance-based journey progression
* Learning result screen

---

## Current Combo Milestones

```text
3
10
20
30
40
50
```

---

## Current Character Evolution

```text
0   → Lux
3   → Amaterasu
20  → Super Amaterasu
50  → Radiant Amaterasu
```

10 / 30 / 40 COMBO primarily strengthen:

* SE
* BGM
* Screen effects

---

## Not Final

* Number of stages
* Stage order
* Stage themes
* Stage distances
* Stage obstacle graphics
* Final BGM structure
* Exact game speed
* Score multipliers
* Whether Yomi is the final stage
* Whether the special Yomi voice is used

これらは後から変更できる構造で実装します。
