# Project Aorta：大動脈計畫室

# RBC RACER 血液循環第一人稱賽車遊戲

## 完整開發規格書與實作流程

| 項目 | 內容 |
| --- | --- |
| 文件版本 | 3.5 |
| 專案名稱 | Project Aorta：大動脈計畫室 |
| 專案副標 | RBC RACER |
| 產品狀態 | STABLE |
| 產品版本 | 1.1（20260715） |
| 文件狀態 | 正式發布、重建與維護基準 |
| 執行環境 | 桌面版現代瀏覽器 |
| 部署環境 | GitHub Pages 或其他靜態網頁空間 |
| 主要技術 | HTML5、CSS3、Vanilla JavaScript ES Modules、Three.js |
| 專案類型 | 純前端、無後端、無資料庫 |
| GitHub | `https://github.com/kisaraki/Classroom-rbc-racer-tzk` |
| 前一功能基線 | `e22cd963ed5bd12cca877200dd2f2238cff169fc` |
| STABLE 1.1 實作基線 | `363f4c9124448a013d4d7c12e3f3bf2eddc7444e` |
| 技術決策附錄 | `TECHNICAL_DECISIONS.md` |
| 循環術語基準 | `CIRCULATION_TERMINOLOGY.md` |
| 重建操作手冊 | `codex-devp-cmd.md` |
| 版本報告範本 | `RELEASE_REPORT_TEMPLATE.md` |

3.5 版總案、循環術語基準、技術決策附錄、重建操作手冊、可執行測試與版本報告共同構成實作依據。本文件所有相對路徑均以 `rbc-racer/` Git 倉庫根目錄為準，不以文件所在目錄為準。Git 倉庫內同名文件是可交付正本；工作區上一層的同名文件是同步鏡像。

---

# 第零章　重建契約與唯一真相來源

## 0.1 本文件的用途

本案已完成 Phase 00–10 的歷史開發流程，並收斂為 STABLE 1.1，不再是尚待一次性產生的需求草稿。未來 AI、Codex 或開發者在空白電腦接手時，必須先判斷工作模式：

| 模式 | 使用時機 | 必須採取的動作 |
| --- | --- | --- |
| `RESTORE` | GitHub 可存取，目標是還原成品 | Clone、驗證、啟動；不得重寫既有系統 |
| `REBUILD` | 原始碼確實遺失、損壞，或使用者明確要求乾淨重建 | 在新的空目錄依現行總案與測試契約重建 |
| `MAINTAIN` | 完整專案已存在，目標是修正或擴充 | 先跑基線測試，再做最小變更與回歸 |

除非使用者明確要求 `REBUILD`，一律優先使用 `RESTORE`。不得因為看到第三十二章的歷史流程，就在完成版 `main` 分支重新建立早期開發階段或覆寫現有檔案。

## 0.2 唯一真相來源與衝突順序

正常還原或維護時，衝突依下列順序處理：

1. `CIRCULATION_TERMINOLOGY.md` 與其指定教材，只負責循環系統繁體中文術語。
2. `js/config.js`、`js/data/levels.js` 與目前可執行程式碼。
3. `tests/`、`npm run test:stable` 與瀏覽器實際行為。
4. `TECHNICAL_DECISIONS.md` 的已決策契約。
5. 本總案的玩法、醫學、架構與驗收規格。
6. `reports/` 的歷史證據與修正紀錄。
7. `codex-devp-cmd.md` 的操作流程。

術語基準優先權不授權改變玩法數值或內部英文 ID。程式碼與測試是已完成版本的可執行事實；本文件不得被用來合理化破壞已通過測試的改寫。若進行真正的 `REBUILD`，則以本總案、循環術語基準、技術決策附錄及 STABLE 測試門檻共同作為建置契約。

## 0.3 Phase 10 可重現基線

| 項目 | 基準 |
| --- | --- |
| 分支 | `main` |
| 基準提交 | `0cdaa69b27c58816144ef58face1d72e99f9a2fd` |
| 單元／整合測試 | 190 passed、0 failed |
| 靜態稽核 | 8 passed、0 failed |
| 支援瀏覽器 | Chrome、Edge、Firefox 桌面版 |
| 正式解析度 | 1280 × 720、1920 × 1080 |
| Draw calls | 22 |
| Triangles | 16,302 |
| 60 秒 heap 成長 | 0.325 MB |
| GitHub Pages | `https://kisaraki.github.io/Classroom-rbc-racer-tzk/` |

歷史數字是驗收證據，不是對不同硬體保證完全相同的即時量測值。功能、上限與測試結果必須維持；效能應在目標設備重新量測。

## 0.4 STABLE 1.1 正式發布基線

| 項目 | 基準 |
| --- | --- |
| 正式名稱 | Project Aorta：大動脈計畫室 |
| 副標 | RBC RACER |
| 狀態／版本 | STABLE／1.1（20260715） |
| 分支 | `main` |
| 前一功能基線 | `e22cd963ed5bd12cca877200dd2f2238cff169fc` |
| STABLE 1.1 實作基線 | `363f4c9124448a013d4d7c12e3f3bf2eddc7444e` |
| 單元／整合測試 | 204 passed、0 failed |
| 靜態稽核 | 9 passed、0 failed |
| 完整 gate | `npm run test:stable` |
| 發布管線 | `main` → GitHub Actions → GitHub Pages |

STABLE 1.1 包含組織／肺氣體交換期間的小地圖鎖點、一般減益加倍、血球破裂、CO 中毒、Time Out 肝臟工廠結局、程序化水蒸氣模糊、啟動可靠性、可見碰撞輪廓與正式產品識別。Phase 10 仍是最近一次完整三瀏覽器與效能歷史證據，不得把 STABLE 1.1 的自動測試冒充為未執行的人工或效能驗收。STABLE 後採版本維護，不再新增編號階段。

## 0.5 不可漂移的重建原則

- 不執行 `npm install`；本案沒有 runtime 或 test package dependency。
- 不加入 bundler、framework、TypeScript 編譯、後端、資料庫或 CDN。
- 不以 `file://` 開啟；ES Modules 必須由靜態 HTTP server 提供。
- 不把簡報、開發截圖、錄影或其他非 runtime 交付物放入 `rbc-racer/`。這些檔案應置於相鄰的 `../deliverables/`。
- 不以截圖或報告取代測試；每次重建或維護都必須實際執行 `npm run test:stable`。
- 不在測試失敗時標示 PASS，不提交空白報告，不偽造瀏覽器或部署證據。

---

# 第一章　專案目標

《Project Aorta：大動脈計畫室》（副標：RBC RACER）是一款以人體血液循環為主題的第一人稱網頁賽車遊戲。

玩家駕駛一臺紅血球造型載具，沿著人體的體循環與肺循環血管前進。遊戲中必須控制血壓、調整速度、閃避有害物質、收集營養物質，並在微血管區段完成氧氣與二氧化碳交換。

遊戲共有四個關卡：

1. 體循環（腹部及下肢）

2. 肺循環

3. 體循環（頭部、胸部及上肢）

4. 肺循環（高危險關卡）

完成第四關後，播放紅血球載具揮舞 O₂ 旗幟的勝利動畫。

---

# 第二章　教育與醫學內容聲明

遊戲開始畫面必須顯示以下說明：

> 本遊戲採用簡化、擬人化及遊戲化的血液循環模型。遊戲中的血壓、速度、營養素、毒物、紅血球傷害與氣體交換機制，不代表完整的真實生理過程，也不得作為醫療診斷依據。

遊戲中的 BP 定義為：

> 遊戲化血壓指數，單位顯示為 mmHg，不代表完整的臨床血壓讀數。

## 2.1 循環系統術語

本案繁體中文專有名詞以 `CIRCULATION_TERMINOLOGY.md` 及其指定的台灣《選修生物(Ⅲ)備課用書》第 2 章為準。核心規則如下：

- 血液狀態使用「充氧血」與「減氧血」。
- 交換血管使用「微血管」，不使用「毛細血管」。
- 第一、三關均屬體循環；第二、四關均屬肺循環。
- 第四關的「高危險關卡」只是玩法限定詞，不是新的循環類型。
- 英文內部 ID 可保持相容，但所有玩家可見中文必須映射到教材詞彙。

---

# 第三章　技術需求

## 3.1 必須使用

- HTML5

- CSS3

- Vanilla JavaScript

- JavaScript ES Modules

- Three.js

- SVG

- Canvas API

- Pointer Lock API

- requestAnimationFrame

## 3.2 禁止使用

- React

- Vue

- Angular

- Svelte

- Phaser

- Unity WebGL

- Unreal Engine

- 後端伺服器

- 資料庫

- Cannon.js

- Ammo.js

- 外部圖片素材

- 外部 3D 模型

- 外部影片素材

- 外部字型檔

Three.js 是本專案唯一允許的主要 3D 渲染函式庫。

---

## 3.3 Three.js 載入方式

開發版與正式版執行時均不得使用 CDN。Three.js 版本固定為官方 `r184`（套件版本 `0.184.0`），不得使用 `latest` 或未鎖版網址。

只有在真正的空目錄 `REBUILD` 且 vendor 檔案不存在時，才可於建置階段從 Three.js 官方 r184 來源下載一次；下載後必須核對 README 所列 SHA-256，執行時仍只能載入本地 vendor 檔案。

正式發布版本必須將 Three.js 放入專案內：

```text
vendor/three.module.js
vendor/three.core.js
```

正式版不得依賴遠端 CDN。

官方 r184 的 `three.module.js` 會相對匯入同目錄的 `three.core.js`；前者仍是正式公開入口，兩個檔案均不得缺少。

`vendor/` 必須同時保留 Three.js MIT 授權文字，並在 README 記錄來源 tag 與各檔案 SHA-256。

---

## 3.4 外部素材限制

不得載入：

- PNG

- JPG

- WebP

- GIF

- 外部 SVG 圖檔

- GLTF

- GLB

- OBJ

- FBX

- 外部字型

- 外部影片

所有內容必須使用以下方式程序化建立：

- Three.js Geometry

- Three.js Material

- CanvasTexture

- SVG DOM

- CSS 動畫

- HTML 元素

- Web Audio API

---

## 3.5 實作與交付約束

以下為不可省略的約束：

1. 使用 HTML5、CSS3、Vanilla JavaScript ES Modules。

2. 使用 Three.js 建立 3D 場景。

3. 不使用 React、Vue、Angular、Phaser、Unity、後端或資料庫。

4. 不使用外部圖片、模型、影片或字型。

5. 所有模型、標示、小地圖與動畫必須程序化產生。

6. 正式版 Three.js 必須以 `vendor/three.module.js` 為入口，並保留 r184 所需的同目錄 `vendor/three.core.js`。

7. 專案必須可直接部署至 GitHub Pages，不得依賴伺服器端功能。

8. JavaScript 必須依職責拆分檔案，不得將遊戲集中在單一大型檔案。

9. 所有可調整的遊戲邏輯、平衡、時間、距離、機率、尺寸、顏色及效能上限數值集中於 `js/config.js`。

10. 四個關卡必須由 `levels.js` 以資料驅動方式組裝，不得為各關複製核心系統。

11. 不得一次完成所有功能，必須依第三十二章分階段建置。

12. 每一階段完成後，必須實際測試、修正錯誤、重新測試並提交階段結果報告；未取得 PASS 不得進入下一階段。

第 9 點所稱數值不包含 JavaScript 語法必要的 `0`、`1`、陣列索引、`Math.PI` 等結構性常數，也不包含純 CSS 排版值。CSS 視覺參數應集中為 `:root` 自訂屬性；所有會影響遊戲規則或驗收結果的值仍必須位於 `js/config.js`。

---

## 3.6 GitHub Pages 相容性

- `index.html` 必須位於部署根目錄。

- 所有模組、CSS 與 vendor 路徑使用 `./` 或相對路徑，不得假設網站部署於網域根目錄。

- 檔名大小寫必須與 import 完全一致。

- 正式版不得呼叫後端 API、資料庫、遠端 CDN 或外部素材網址。

- README 必須提供本機靜態伺服器啟動方式；不得要求使用者以 `file://` 直接開啟 ES Modules。

- 最終階段必須實際部署到 GitHub Pages 專案子路徑並完成 Chrome、Edge、Firefox 驗收。

---

# 第四章　專案目錄結構

```text
rbc-racer/
├─ .github/
│  └─ workflows/
│     └─ deploy-pages.yml
├─ index.html
├─ package.json
├─ README.md
├─ LICENSE
├─ classroom-rbc-racer-tzk.md
├─ codex-devp-cmd.md
├─ TECHNICAL_DECISIONS.md
├─ RELEASE_REPORT_TEMPLATE.md
├─ reports/
│  ├─ README.md
│  ├─ phase-00-report.md … phase-10-report.md
│  ├─ stable-1.1-release-report.md
│  ├─ phase-03-heart-correction-report.md
│  └─ phase-04-rbc-mobile-correction-report.md
├─ css/
│  ├─ main.css
│  ├─ hud.css
│  ├─ menu.css
│  └─ cutscene.css
├─ js/
│  ├─ main.js
│  ├─ config.js
│  ├─ data/
│  │  ├─ levels.js
│  │  └─ entityTypes.js
│  ├─ core/
│  │  ├─ DeviceSupport.js
│  │  ├─ Game.js
│  │  ├─ GameLoop.js
│  │  ├─ GameClock.js
│  │  ├─ GameSession.js
│  │  ├─ GameStateMachine.js
│  │  ├─ LevelManager.js
│  │  ├─ RunProgression.js
│  │  └─ EventBus.js
│  ├─ input/
│  │  ├─ InputController.js
│  │  ├─ CameraController.js
│  │  └─ PointerLockController.js
│  ├─ world/
│  │  ├─ VesselTrack.js
│  │  ├─ TrackSection.js
│  │  ├─ TrackMath.js
│  │  └─ ProceduralAssetFactory.js
│  ├─ player/
│  │  ├─ PlayerRBC.js
│  │  └─ HoodController.js
│  ├─ systems/
│  │  ├─ BloodPressureSystem.js
│  │  ├─ EntityManager.js
│  │  ├─ CollisionSystem.js
│  │  ├─ QTESystem.js
│  │  ├─ StatusEffectManager.js
│  │  └─ ScoreSystem.js
│  ├─ ui/
│  │  ├─ FlightInstrumentModel.js
│  │  ├─ HUDManager.js
│  │  ├─ MiniMapRenderer.js
│  │  └─ MessageOverlay.js
│  ├─ utils/
│  │  └─ SeededRandom.js
│  └─ cutscenes/
│     ├─ CutsceneManager.js
│     └─ CutsceneRenderer.js
├─ vendor/
│  ├─ three.module.js
│  ├─ three.core.js
│  └─ THREE-LICENSE.txt
└─ tests/
   ├─ run-tests.mjs
   ├─ stable-audit.mjs
   ├─ unit-test.html
   ├─ unit/*.test.js
   ├─ stable-manual-test-checklist.md
   ├─ phase-09-cutscene-preview.html
   └─ balance-test-notes.md
```

此樹狀圖是責任與必要檔案清單，不表示可以建立空白 placeholder。Clone 還原時以 Git tree 為準；乾淨重建時，每個檔案必須具有可執行內容及對應測試。

---

# 第五章　支援環境

## 5.1 主要支援平台

- Windows 10

- Windows 11

- macOS

## 5.2 主要支援瀏覽器

- Google Chrome

- Microsoft Edge

- Mozilla Firefox

Safari 為次要支援環境，未列入 Phase 10 正式驗收矩陣。

手機與平板不是「未最佳化」而是明確不支援。啟動時必須在載入 Three.js 前以 Client Hint 與 User-Agent fallback 偵測並顯示拒絕畫面，不得暴露遊戲控制。

---

## 5.3 畫面解析度

基準解析度：

```text
1920 × 1080
```

最低支援解析度：

```text
1280 × 720
```

Renderer 必須設定：

```javascript
renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    GAME_CONFIG.renderer.maximumPixelRatio
  )
);
```

---

# 第六章　啟動流程

遊戲載入後依序顯示：

1. 正式產品名稱與 RBC RACER 副標

2. 教育與醫學內容聲明

3. 操作說明

4. 開始遊戲按鈕

5. Pointer Lock 請求

6. 第一關介紹

7. 正式進入遊戲

開始按鈕文字：

```text
開始遊戲並鎖定滑鼠視角
```

Pointer Lock 必須由使用者點擊啟動。

不得在頁面載入時自動鎖定滑鼠。

點擊後必須立即顯示等待回饋；若瀏覽器未送出成功或失敗事件，應依
`GAME_CONFIG.pointerLock.requestTimeoutMs` 的絕對期限顯示可重試錯誤，不得讓按鈕看似無反應。

專案不得以 `file://` 直接執行。入口需在 ES Modules 無法載入前顯示本機伺服器提示，Windows 可使用 `start-local.cmd` 一鍵啟動。

---

# 第七章　玩家紅血球載具

## 7.1 外觀

玩家載具必須具備：

- 紅色車身

- 雙凹圓盤或橢圓盤外形

- 紅血球視覺特徵

- 明確的 RBC 字樣

- 可辨識的前方車頭或引擎蓋

模型必須程序化建立。

---

## 7.2 第一人稱畫面

第一人稱畫面下方必須看見：

- 紅血球車頭

- 或紅血球造型儀表板

- RBC 字樣

- 可翻動的引擎蓋或前蓋模型

引擎蓋模型必須獨立於主要車體，以便瘧原蟲效果控制。

---

## 7.3 玩家初始資料

```javascript
{
  hp: GAME_CONFIG.hp.initial,
  maxHp: GAME_CONFIG.hp.max,
  bp: GAME_CONFIG.bp.initial,
  score: 0,
  alcoholCount: 0,
  currentLevel: 1,
  distanceAlongTrack: 0,
  previousDistanceAlongTrack: 0,
  lateralX: 0,
  lateralY: 0,
  collisionRadius:
    GAME_CONFIG.track.playerCollisionRadius,
  gasExchangeStatus: "PENDING",
  gasExchangeAttempts: 0,
  woundDodgedCount: 0,
  qteSuccessCount: 0
}
```

HP：

| 項目  | 數值  |
| --- | --- |
| 初始值 | 100 |
| 最大值 | 200 |
| 最低值 | 0   |

Score：

- 初始值為 0

- 允許負數

- 不設定最低值

---

# 第八章　血管賽道系統

## 8.1 建構方式

每條血管使用：

```javascript
THREE.CatmullRomCurve3
```

建立中心曲線。

血管依 `TrackSection` 切為多段，每一段使用：

```javascript
THREE.TubeGeometry
```

建立血管管壁。

標準 `TubeGeometry` 每個幾何只使用一個固定半徑，因此第一版使用多個不同半徑的 `TrackSection` 組成整條變徑血管。相鄰區段重疊 0.5～1.0 世界單位，並加入短過渡段降低接縫可見度。

玩家、攝影機、實體與血管網格必須共用同一份預先計算的中心點、切線與平行傳輸框架資料。

血管需具備：

- 彎曲

- 起伏

- 管徑變化

- 不同區段色彩

- 光澤與程序化紋理

- 血流方向感

---

## 8.2 玩家賽道座標

玩家不在完整 3D 世界自由移動。

玩家位置由下列資料決定：

```javascript
{
  distanceAlongTrack,
  lateralX,
  lateralY
}
```

定義：

| 欄位                  | 功能                         |
| ------------------- | -------------------------- |
| distanceAlongTrack  | 沿中心線累積的世界單位距離，唯一真實前進位置 |
| lateralX            | 血管截面左右偏移                   |
| lateralY            | 血管截面上下偏移                   |

`progress` 與 `trackProgress` 不得作為可變狀態。曲線取樣時才計算：

```javascript
normalizedProgress = clamp(
  distanceAlongTrack / trackLength,
  0,
  1
);
```

實際世界座標由血管中心線與快取的局部框架計算。

---

## 8.3 邊界限制

玩家不得穿過血管壁。

```javascript
maxOffset =
  trackRadius -
  player.collisionRadius -
  wallMargin;
```

超出範圍時，限制在血管內側。

第一版撞擊一般血管壁不扣 HP。

可套用：

- 輕微鏡頭震動

- 短暫速度衰減

- 車身晃動

---

# 第九章　操作系統

## 9.1 按鍵配置

| 按鍵  | 功能                 |
| --- | ------------------ |
| ↑   | 向血管截面上方移動          |
| ↓   | 向血管截面下方移動          |
| ←   | 向血管截面左方移動          |
| →   | 向血管截面右方移動          |
| Z   | 提高 BP、加速           |
| X   | 降低 BP、減速           |
| O   | QTE：氧氣處理           |
| C   | QTE：二氧化碳處理         |
| Esc | 暫停或解除 Pointer Lock |

不得使用：

- WASD

- 滑鼠按鍵

- 滑鼠位置

- 滑鼠滾輪

- 觸控板手勢

控制車輛。

---

## 9.2 鍵盤事件

使用：

```javascript
event.code
```

例如：

```javascript
event.code === "KeyZ"
```

方向鍵、Z、X、O、C 必須呼叫：

```javascript
event.preventDefault();
```

QTE 必須排除自動重複：

```javascript
if (event.repeat) return;
```

---

## 9.3 方向鍵座標

方向鍵永遠依照血管截面的局部上下左右移動。

攝影機旋轉不得改變：

- progress

- lateralX

- lateralY

- 車輛前進方向

- BP

- 速度

- QTE 判定

---

# 第十章　攝影機系統

## 10.1 滑鼠視角

滑鼠只控制：

- yaw

- pitch

使用 Pointer Lock API。

---

## 10.2 垂直角度限制

```javascript
pitch = clamp(
  pitch,
  -GAME_CONFIG.camera.pitchLimitRadians,
  GAME_CONFIG.camera.pitchLimitRadians
);
```

不得讓攝影機上下翻轉。

---

## 10.3 暫停

使用者按下 Esc 或 Pointer Lock 中斷時：

1. 遊戲進入 PAUSED

2. 世界模擬停止

3. 玩家、生成與碰撞停止

4. 所有狀態倒數、冷卻與 QTE 截止時間繼續

5. Renderer 與 HUD 繼續更新

6. 顯示「點擊恢復遊戲」

7. 點擊後重新鎖定滑鼠

進入 PAUSED 時必須保存：

```javascript
pausedFromState = stateMachine.current;
```

恢復時回到 `pausedFromState`。若 QTE 或狀態效果在暫停期間到期，先保存 pending 結果，恢復時再安全套用，不得補跑暫停期間的世界模擬。

---

# 第十一章　血壓與速度

## 11.1 基本設定

所有 BP 數值使用 `GAME_CONFIG.bp`，不得在 `BloodPressureSystem` 重複宣告。

---

## 11.2 操作

按住 Z：

```javascript
bp +=
  GAME_CONFIG.bp.changeRate *
  simulationDeltaTime;
```

按住 X：

```javascript
bp -=
  GAME_CONFIG.bp.changeRate *
  simulationDeltaTime;
```

最後限制：

```javascript
bp = clamp(
  bp,
  GAME_CONFIG.bp.min,
  GAME_CONFIG.bp.max
);
```

Z 與 X 同時按下時，BP 不變。

每關開始時 BP 重設為 100。

---

## 11.3 速度公式

```javascript
speed = clamp(
  GAME_CONFIG.movement.minSpeed +
    (bp - GAME_CONFIG.movement.bpOffset) *
    GAME_CONFIG.movement.speedPerBp,
  GAME_CONFIG.movement.minSpeed,
  GAME_CONFIG.movement.maxSpeed
);
```

| BP  | 速度  |
| --- | --- |
| 50  | 5   |
| 80  | 8   |
| 100 | 10  |
| 130 | 13  |
| 150 | 15  |
| 180 | 18  |

---

## 11.4 截面移動速度

截面移動速度使用 `GAME_CONFIG.movement.strafeSpeed`。

所有世界移動必須乘上 `simulationDeltaTime`。

---

# 第十二章　高血壓機制

## 12.1 觸發條件

第一至第三關：

```text
BP > 130
```

第四關：

- BP 80～130 仍使用同一條指數公式，BP 130 時為每秒 0.5％。

- BP 大於 130 使用同一條公式並套用三倍倍率。

- BP 小於 80 不生成 Wound，改由低血壓機制處理。

每秒進行一次 Wound 生成判定。

不得每影格判定。

---

## 12.2 生成公式

```javascript
function getWoundChance(
  bp,
  level
) {
  const woundConfig = GAME_CONFIG.wound;
  const levelConfig = GAME_CONFIG.levels[level];

  const baseChance =
    woundConfig.baseChanceCoefficient *
    Math.exp(
      (bp - GAME_CONFIG.bp.safeMax) /
      woundConfig.exponentialBpScale
    );

  if (
    levelConfig.highRisk &&
    bp >= woundConfig.highRiskFormulaMinBp
  ) {
    const levelMultiplier =
      bp > GAME_CONFIG.bp.safeMax
        ? levelConfig.multipliers.wound
        : woundConfig.safeRangeMultiplier;

    return Math.min(
      woundConfig.maximumChancePerSecond,
      baseChance * levelMultiplier
    );
  }

  if (bp <= GAME_CONFIG.bp.safeMax) return 0;

  return Math.min(
    woundConfig.maximumChancePerSecond,
    baseChance
  );
}
```

第四關 BP 大於 130 時倍率：

倍率使用目前 `levelConfig.multipliers.wound`，由第四關設定為高危險值。

公式基礎係數：

基礎係數使用 `GAME_CONFIG.wound.baseChanceCoefficient`。

第四關安全 BP 也使用指數公式；BP 130 時為每秒 0.5％，較低 BP 依公式遞減。

第四關 BP 大於 130 時在同一公式結果套用三倍倍率，不再額外加上 0.5％。

---

## 12.3 Wound 生成限制

Wound 不得：

- 直接生成在玩家位置

- 生成在玩家無法反應的距離

- 與 Gas Token 重疊

- 與關卡終點重疊

- 完全封死血管截面

最低生成距離：

最低生成距離、同時活躍上限與最小間距分別使用 `GAME_CONFIG.entities.spawnAheadMin`、`GAME_CONFIG.wound.maximumActive` 與 `GAME_CONFIG.wound.minimumGap`。

同時最多存在兩個 Wound，兩個 Wound 的縱向距離不得小於 45 世界單位。

Wound 落後玩家 10 世界單位且未碰撞時，視為成功閃避：

```javascript
player.woundDodgedCount += 1;
```

之後立即回收到物件池。

---

# 第十三章　低血壓機制

## 13.1 觸發條件

```text
BP < 80
```

每秒判定一次。

---

## 13.2 觸發機率

```javascript
chance = Math.min(
  GAME_CONFIG.lowBloodPressure
    .maximumChancePerSecond,
  (GAME_CONFIG.bp.safeMin - bp) *
    GAME_CONFIG.lowBloodPressure
      .chancePerBpPoint
);
```

| BP    | 每秒機率  |
| ----- | ----- |
| 79    | 2.5％  |
| 75    | 12.5％ |
| 70    | 25％   |
| 66 以下 | 35％   |

---

## 13.3 LOW_BP_STASIS

觸發後持續 5 秒。

```javascript
lowBpStasisExpiresAtMs =
  gameClock.deadlineAfterSeconds(
    GAME_CONFIG.lowBloodPressure
      .durationSeconds
  );
```

期間：

- 賽道停止

- 玩家停止

- 方向鍵失效

- 不生成新物件

- 不執行一般碰撞

- Renderer 持續運作

- HUD 持續更新

- Z 仍可提高 BP

- X 暫時失效

警語：

```text
低血壓警告
血流速度過慢，請按 Z 提高血壓
```

結束後進入 10 秒冷卻。

```javascript
lowBloodPressureCooldownExpiresAtMs =
  gameClock.deadlineAfterSeconds(
    GAME_CONFIG.lowBloodPressure
      .cooldownSeconds
  );
```

LOW_BP_STASIS 的五秒期限與十秒冷卻均使用絕對截止時間，在 QTE、PAUSED 與其他主狀態中繼續倒數。高低血壓的每秒觸發判定仍只在 PLAYING 執行。

---

# 第十四章　HUD

## 14.1 左上角小地圖

使用 SVG 動態繪製。

不得使用圖片。

必須顯示：

- 左心室

- 左心房

- 右心室

- 右心房

- 肺

- 腦

- 組織

並繪製對應血管連線。

---

## 14.2 玩家標記

玩家亮點必須：

- 發光

- 閃爍或脈動

- 沿 SVG Path 連續移動

- 交換區外不得只在節點間跳躍

- 氣體交換區內必須鎖定到「組織」或「肺」節點，避免事件與教學圖位置錯位

---

## 14.3 右上角資料

```text
HP：100 / 200
BP：100 mmHg
Score：0
Location：主動脈
Level：1 / 4
```

特殊狀態增加：

```text
酒精中毒：14.2 秒
瘧原蟲頭罩：4.8 秒
血球破裂：14.8 秒
CO 中毒：持續中
低血壓停滯：4.6 秒
```

---

# 第十五章　關卡

## 15.1 第一關：體循環（腹部及下肢）

基準純駕駛時間：5 分鐘。
賽道長度：3000 世界單位。

```text
左心室
→ 主動脈
→ 主動脈分支（腹部及下肢）
→ 腹部及下肢的小動脈
→ 腹部及下肢的微血管網
→ 小靜脈
→ 下大靜脈
→ 右心房
→ 右心室
```

氣體交換：

```text
釋出 O₂
接收 CO₂
```

Wound 結局：

```text
翻車墜落
```

---

## 15.2 第二關：肺循環

基準純駕駛時間：1.5 分鐘。
賽道長度：900 世界單位。

```text
右心室
→ 肺動脈
→ 肺泡微血管
→ 肺靜脈
→ 左心房
→ 左心室
```

氣體交換：

```text
排出 CO₂
獲得 O₂
```

Wound 結局：

```text
翻車墜落
```

---

## 15.3 第三關：體循環（頭部、胸部及上肢）

基準純駕駛時間：3 分鐘。
賽道長度：1800 世界單位。

```text
左心室
→ 主動脈
→ 頸動脈／鎖骨下動脈
→ 頭部、胸部及上肢的小動脈
→ 頭部、胸部及上肢的微血管網
→ 小靜脈
→ 上大靜脈
→ 右心房
→ 右心室
```

氣體交換：

```text
釋出 O₂
接收 CO₂
```

Wound 結局：

```text
中風
Stroke
```

---

## 15.4 第四關：肺循環（高危險關卡）

路徑同第二關。

基準純駕駛時間：1.5 分鐘。
賽道長度：900 世界單位。

差異：

| 項目               | 倍率      |
| ---------------- | ------- |
| 一般減益物件           | 2.5 倍   |
| 酒精額外倍率            | 2 倍；與一般減益複合後總倍率 5 倍 |
| Wound 高血壓倍率      | 3 倍     |
| 增益物件             | 0.7 倍   |
| 安全 BP Wound 機率 | 同高 BP 指數公式；BP 130 時每秒 0.5％ |

酒精仍屬一般減益物件，其第四關權重計算為：

```javascript
alcoholWeight =
  baseAlcoholWeight * 2.5 * 2;
```

安全 BP 使用同一條指數公式，BP 130 時為每秒 0.5％；BP 大於 130 時再套用三倍倍率，不額外相加。

---

## 15.5 關卡長度與區段比例

基準時間以 BP 100、速度每秒 10 世界單位計算，只包含世界正常前進時間，不包含關卡介紹、QTE、低血壓停滯、暫停、過場及結算。

| 關卡 | 基準時間 | trackLength | 主要區段比例 |
| --- | --- | ---: | --- |
| 1 | 5 分鐘 | 3000 | 心室 3％、動脈 52％、腹部及下肢的微血管網 15％、靜脈 25％、右心 5％ |
| 2 | 1.5 分鐘 | 900 | 右心室 5％、肺動脈 25％、肺泡微血管 35％、肺靜脈 25％、左心 10％ |
| 3 | 3 分鐘 | 1800 | 心室 3％、動脈 47％、頭部、胸部及上肢的微血管網 20％、靜脈 25％、右心 5％ |
| 4 | 1.5 分鐘 | 900 | 與第二關相同 |

各 Location 的精確起訖距離、半徑、顏色、seed 與倍率數值定義於 `GAME_CONFIG.levels`。`levels.js` 只能匯入設定、加入區段 ID 與路線語意並組裝資料，不得再宣告數字常數。

以上為遊戲節奏，不是真實血液通過時間。體循環較長、肺循環較短；第三關因腦部高灌流與教育重點保留三分鐘操作時間。

---

# 第十六章　血管顏色

## 16.1 體循環

氣體交換前為充氧血，完成體微血管交換後為減氧血。下列顏色是遊戲化視覺編碼，不代表血液的實際顏色。

| 區段      | 顏色     |
| ------- | ------ |
| 左心室     | 鮮紅     |
| 主動脈     | 鮮紅     |
| 動脈至小動脈  | 鮮紅漸變洋紅 |
| 微血管交換前  | 洋紅     |
| 微血管交換後  | 藍紫     |
| 小靜脈     | 藍色     |
| 大靜脈     | 藍紫至紫色  |
| 右心房／右心室 | 紫色     |

---

## 16.2 肺循環

肺動脈與肺泡微血管交換前為減氧血，完成交換後經肺靜脈回到左心時為充氧血。

| 區段       | 顏色  |
| -------- | --- |
| 右心室      | 藍紫  |
| 肺動脈      | 藍紫  |
| 肺泡微血管交換前 | 藍紫  |
| 肺泡微血管交換後 | 鮮紅  |
| 肺靜脈      | 鮮紅  |
| 左心房／左心室  | 鮮紅  |

QTE 失敗時維持交換前顏色。

實作色碼必須取自 `GAME_CONFIG.palette`；`levels.js` 只指定語意色彩鍵，不得直接寫入十六進位色碼。

---

# 第十七章　實體物件

## 17.1 共通資料

```javascript
{
  id,
  type,
  category,
  distanceAlongTrack,
  lateralX,
  lateralY,
  collisionRadius,
  consumed,
  mesh
}
```

碰撞後立即：

```javascript
entity.consumed = true;
```

---

## 17.2 增益物件

| 物件      | 標示   | Score | HP  |
| ------- | ---- | ----- | --- |
| 維生素 C   | C    | +1    | +1  |
| 維生素 B12 | B12  | +1    | +1  |
| 鐵       | Fe²⁺ | +1    | +1  |

---

## 17.3 減益物件

| 物件   | 標示     | config 基礎 Score／HP | 實際 Score／HP |
| ---- | ------ | ----- | --- |
| 一氧化碳 | CO     | -2／-2 | -4／-4 |
| 瘧原蟲  | 生物造型   | -3／-3 | -6／-6 |
| 酒精   | C₂H₅OH | -1／-1 | -2／-2 |

實際負值由 `GAME_CONFIG.penalties.debuffMultiplier = 2` 套用。Wound 屬 `FATAL`，不使用此倍率。

---

## 17.4 致命障礙

| 物件   | 標示    | 效果                      |
| ---- | ----- | ----------------------- |
| 血管破口 | Wound | Score -200，立即 Game Over |

Wound 不得先將 HP 扣至 0。

必須直接觸發專屬結局。

本章所有 Score、HP、權重與碰撞半徑數值必須取自 `GAME_CONFIG.entityTypes`。`entityTypes.js` 只保存標示、分類與程序化模型種類。

---

# 第十八章　物件文字

使用：

- CanvasTexture

- Sprite

- PlaneGeometry

標示必須清晰顯示：

```text
C
B12
Fe²⁺
CO
C₂H₅OH
Wound
RBC
```

不得顯示原始 LaTeX 語法。

---

# 第十九章　物件生成

## 19.1 一般生成距離

間距使用 `GAME_CONFIG.entities.spawnIntervalMin` 與 `GAME_CONFIG.entities.spawnIntervalMax`。

`8～16` 表示相鄰生成槽之間的縱向間距，不是相對玩家的前方距離。

生成位置位於玩家前方：

前方生成範圍、回收距離、活躍上限與最小間距全部使用 `GAME_CONFIG.entities`。

實體落後玩家 20 世界單位後必須回收到物件池。

---

## 19.2 一般權重

```javascript
{
  vitaminC: 18,
  vitaminB12: 14,
  iron: 14,
  carbonMonoxide: 20,
  malaria: 10,
  alcohol: 16,
  empty: 8
}
```

Wound 使用獨立生成系統。

一般權重必須讀取 `GAME_CONFIG.entityTypes.*.baseWeight`，不得在 `EntityManager` 複製本表數值。

第四關權重依下列順序套用：

1. 增益物件乘以 0.7。

2. 所有一般減益物件乘以 2.5。

3. 酒精再額外乘以 2，因此酒精總倍率為 5。

4. `empty` 維持原權重。

最後以調整後權重總和正規化。

---

## 19.3 生成公平性與可重現性

- 每關使用 `GAME_CONFIG.levels` 內的固定 32-bit seed 與 Mulberry32 `SeededRandom`。

- 重新挑戰本關沿用 checkpoint seed，產生相同的一般物件序列。

- 最多連續產生兩個同類減益物件。

- 同一截面不得生成互相重疊的實體。

- 任一生成組合必須保留至少一條可通行路徑。

- Gas Token、Wound、關卡終點與一般實體不得互相重疊。

- 物件放置半徑必須符合：

```javascript
spawnOffsetRadius <=
  trackRadius -
  entity.collisionRadius -
  wallMargin;
```

截面位置使用均勻面積取樣，避免物件集中於中心：

```javascript
const radius =
  Math.sqrt(random()) * maxSpawnOffset;
const angle = random() * Math.PI * 2;

lateralX = Math.cos(angle) * radius;
lateralY = Math.sin(angle) * radius;
```

---

# 第二十章　碰撞系統

## 20.1 縱向判定

```javascript
const minDistance =
  Math.min(
    player.previousDistanceAlongTrack,
    player.distanceAlongTrack
  ) - collisionWindow;

const maxDistance =
  Math.max(
    player.previousDistanceAlongTrack,
    player.distanceAlongTrack
  ) + collisionWindow;

const longitudinalHit =
  entity.distanceAlongTrack >= minDistance &&
  entity.distanceAlongTrack <= maxDistance;
```

縱向容許範圍使用 `GAME_CONFIG.collision.window`。

必須使用前一影格到目前影格的掃掠範圍，避免高速或較大 `deltaTime` 時穿過物件。

---

## 20.2 截面判定

玩家截面碰撞不得再視為以十字線為圓心的單一圓。玩家輪廓使用垂直膠囊，外框上緣為十字線 `topOffsetY = 0`，下緣為第一人稱 RBC 機體下緣 `bottomOffsetY = -1.91`，寬度仍由 `player.collisionRadius = 0.55` 決定。

增益物與減益物使用兩部分聯集：

1. 本體以 `entity.collisionRadius` 對玩家膠囊計算點到線段距離。
2. 有標示牌者再以 `spriteWidth × spriteHeight = 2.7 × 1.18`、垂直位移 `offsetY = 1.35` 的矩形對玩家膠囊計算距離。

任一本體或標示牌成立即算碰撞。瘧原蟲沒有標示牌；Wound 的文字牌不列入本次增益／減益標示牌契約。縱向仍須先通過掃掠判定。

碰撞半徑：

| 對象 | collisionRadius |
| --- | ---: |
| Player RBC 膠囊寬度半徑 | 0.55 |
| 維生素 C | 0.77 |
| 維生素 B12 | 0.81 |
| 鐵離子 | 0.80 |
| CO | 0.75 |
| 瘧原蟲 | 1.19 |
| 酒精 | 1.08 |
| Wound | 1.15 |

---

## 20.3 碰撞優先順序

1. Wound

2. 一般減益物件

3. HP 歸零判定

4. Gas Trigger

5. 增益物件

若觸發 Wound，立即停止處理同影格其他碰撞。

同一優先級內依 `distanceAlongTrack`、再依 `id` 穩定排序。Score 與 HP 變化是實體效果的一部分，不另設「一般加分」碰撞類別。

---

# 第二十一章　氣體交換 QTE

## 21.1 觸發位置

Gas Token 只出現在：

- 腹部及下肢的微血管網

- 頭部、胸部及上肢的微血管網

- 肺泡微血管

心臟、主動脈、小動脈、肺動脈、靜脈及其他非體微血管、非肺泡微血管區段不得觸發氣體交換事件。

體微血管交換區設定 10 個等距機會點；肺泡微血管交換區設定 20 個等距機會點。數量集中於 `GAME_CONFIG.qte.opportunityCountByRegion`，各點必須嚴格位於對應交換區段的起點與終點之間。

每個 Token 均為不可略過的縱向觸發區。Token 模型只提供視覺提示，玩家跨越該機會點時不論 `lateralX`、`lateralY` 均進入 QTE。

任一機會完成一次 QTE 即視為本關氣體交換成功，並取消尚未觸發的所有機會點。

若某次失敗且交換區內仍有機會點，於下一機會點再次觸發。不得在交換區外或關卡終點額外建立保底 QTE。

---

## 21.2 QTE 狀態

跨越 Gas Token 觸發區後：

- 進入 QTE

- 世界模擬停止

- 玩家停止

- 障礙物停止

- 一般碰撞停止

- Renderer 持續

- HUD 持續

- 倒數持續

- 接受 O、C

- 禁用方向鍵、Z、X

不得停止 requestAnimationFrame。

QTE 倒數使用絕對截止時間，在 Pointer Lock 中斷或進入 PAUSED 時仍繼續。酒精、瘧原蟲、低血壓冷卻及其他倒數也全部繼續。

氣體交換狀態：

```javascript
const GasExchangeStatus = Object.freeze({
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED"
});
```

每關開始時：

```javascript
gasExchangeStatus =
  GasExchangeStatus.PENDING;
gasExchangeAttempts = 0;
```

---

## 21.3 QTE 數值

QTE 時限、結果顯示時間及 O、C 門檻全部使用 `GAME_CONFIG.qte`。

QTE 開始時建立：

```javascript
qteExpiresAtMs =
  gameClock.deadlineAfterMs(
    GAME_CONFIG.qte.durationMs
  );
```

不要求交替輸入。

以下均可成功：

```text
O O O C C C
```

```text
O C O C O C
```

---

## 21.4 成功

```text
Score +10
```

並：

- 顯示交換成功

- 套用交換後顏色

- 機身若為原本紅色則切換為紅紫色；若為紅紫色則切換回原本紅色

- 設定 `gasExchangeStatus = "SUCCESS"`

- 增加 `gasExchangeAttempts`

- 移除所有尚未觸發的 Gas Token

- 將機身紅／紅紫狀態保存至下一關與新 checkpoint

- 以 `gameClock.deadlineAfterMs(GAME_CONFIG.qte.resultDisplayMs)` 建立結果期限，期限到達後恢復遊戲

---

## 21.5 失敗

```text
Score -3
```

並：

- 顯示交換失敗

- 維持原色

- 若交換區內仍有機會點，提供下一次機會

- 增加 `gasExchangeAttempts`

- 組織 10 次或肺 20 次機會全部失敗後，設定 `gasExchangeStatus = "FAILED"`

- 全部機會失敗後繼續關卡並允許通關

- 不直接 Game Over

尚有機會時狀態維持 `PENDING`。關卡終點只要求狀態不是 `PENDING`，不要求 QTE 成功；`FAILED` 必須維持交換前血管顏色與機身色彩，並在結算顯示未完成氣體交換。

失敗結果同樣顯示 0.8 秒後恢復世界。結果顯示期限在 PAUSED 中也繼續。

---

# 第二十二章　瘧原蟲視線遮蔽

## 22.1 碰撞效果

撞擊瘧原蟲時：

```text
Score -3
HP -3
```

同時觸發：

```text
5 秒引擎蓋翻動遮蔽效果
```

```javascript
malariaObstructionExpiresAtMs =
  gameClock.deadlineAfterSeconds(
    GAME_CONFIG.malaria
      .obstructionDurationSeconds
  );
```

---

## 22.2 外觀

瘧原蟲必須具有：

- 暗紅色、紫色或暗褐色

- 不規則球體

- 觸手

- 刺突

- 脈動

- 生物感

不需要文字標示。

---

## 22.3 引擎蓋動畫

撞擊後：

1. 引擎蓋快速向上彈起

2. 遮蔽畫面中央約 40％～65％

3. 五秒內左右、前後不規則翻動

4. 玩家可從畫面邊緣看見賽道

5. 不得遮住 HUD

6. 五秒後以 0.4 秒動畫恢復原位

不得將畫面完全塗黑。

---

## 22.4 動畫參數

所有瘧原蟲動畫參數使用 `GAME_CONFIG.malaria`。

---

## 22.5 建議動畫公式

```javascript
const malariaConfig = GAME_CONFIG.malaria;

const flapRotationX =
  malariaConfig.hoodOpenAngle +
  Math.sin(
    elapsed *
    malariaConfig.hoodPrimaryFrequency
  ) * malariaConfig.hoodPrimaryAmplitude +
  Math.sin(
    elapsed *
    malariaConfig.hoodSecondaryFrequency
  ) * malariaConfig.hoodSecondaryAmplitude;

const flapRotationZ =
  Math.sin(
    elapsed * malariaConfig.hoodRollFrequency
  ) * malariaConfig.hoodRollAmplitude;

const flapOffsetY =
  Math.sin(
    elapsed * malariaConfig.hoodOffsetFrequency
  ) * malariaConfig.hoodOffsetAmplitude;
```

必須使用原始 Transform 加上暫時偏移。

不得每影格累積旋轉角度。

---

## 22.6 操作規則

遮蔽期間：

- 方向鍵正常

- Z、X 正常；血球破裂期間 BP 上限為 60

- 滑鼠視角正常

- 玩家速度正常

- 碰撞繼續

- 物件生成繼續

- HUD 更新繼續

- 小地圖更新繼續

一般瘧原蟲碰撞造成扣分、HP 與視線干擾；同關每累積 5 隻另觸發血球破裂，暫時將 BP 上限降為 60。

不造成：

- 操作延遲

- 方向失控

- BP 亂跳

---

## 22.7 與 QTE 的關係

進入 QTE 時：

- 引擎蓋移至不直接覆蓋 QTE 的位置，但程序化蒸氣仍依需求模糊全畫面

- 瘧原蟲倒數繼續

- QTE 結束後若效果仍存在，恢復翻動

- 若效果在 QTE 中到期，清除遮蔽並在離開 QTE 時將引擎蓋恢復原位

- O、C 判定不受影響

---

## 22.8 與低血壓的關係

LOW_BP_STASIS 期間：

- 引擎蓋維持翻起

- 動畫繼續

- 剩餘時間繼續倒數

- 水蒸氣仍覆蓋全畫面，直到頭罩復原完成

PAUSED 期間引擎蓋動畫與剩餘時間也繼續；世界賽道與玩家仍保持停止。

---

## 22.9 與酒精中毒的關係

兩個效果可同時存在。

同時存在時：

- 酒精中毒控制 S 型偏移與操作異常

- 瘧原蟲控制引擎蓋遮蔽

- 兩者分別計時

- 同時效果的頭罩遮蔽上限由 `combinedMaximumCoverage` 控制，目前為 72％

- 程序化蒸氣以模糊取代純色封閉，不載入外部圖片

---

## 22.10 重複碰撞

效果期間再次撞擊另一隻瘧原蟲：

- 再扣 Score 6

- 再扣 HP 6

- 遮蔽時間重設為 5 秒

- 不生成第二個引擎蓋

- 計數達 5 的倍數時改用 15 秒血球破裂期限並啟用 BP 上限 60

- 不增加翻動幅度

```javascript
malariaObstructionExpiresAtMs =
  gameClock.deadlineAfterSeconds(
    GAME_CONFIG.malaria
      .obstructionDurationSeconds
  );
```

---

## 22.11 HP 歸零

若瘧原蟲傷害使 HP 歸零：

1. 清除遮蔽狀態

2. 引擎蓋恢復原位

3. 進入 GAME_OVER_RECYCLE

4. 播放脾臟／肝臟回收動畫

---

# 第二十三章　酒精中毒

## 23.1 觸發

每次碰撞酒精：

```javascript
alcoholCount += 1;
```

達到 `GAME_CONFIG.intoxication.triggerCount` 立即觸發。

中毒期間再次碰撞酒精仍套用一般酒精的 Score 與 HP 減益，但不延長十五秒中毒期限。中毒結束時統一將 `alcoholCount` 歸零。

---

## 23.2 時間

中毒時間使用 `GAME_CONFIG.intoxication.durationSeconds`。

觸發時建立：

```javascript
intoxicationExpiresAtMs =
  gameClock.deadlineAfterSeconds(
    GAME_CONFIG.intoxication
      .durationSeconds
  );
```

---

## 23.3 效果

- S 型偏移

- BP 每 400ms 在 80～130 隨機變化

- 操作延遲 250～700ms

- 35％操作失效

- 畫面重影或扭曲

- HUD 顯示剩餘秒數

---

## 23.4 S 型偏移

```javascript
sway =
  Math.sin(
    intoxicationElapsed *
    swayFrequency
  ) * swayAmplitude;
```

建議：

`swayFrequency` 與 `swayAmplitude` 必須取自 `GAME_CONFIG.intoxication`。

---

## 23.5 輸入佇列

不得為每次操作大量建立 setTimeout。

使用：

```javascript
{
  action,
  executeAt
}
```

中毒結束後清空佇列。

佇列使用絕對 `executeAt`。若操作到期時主狀態不接受方向鍵、Z 或 X，該操作直接丟棄，不得在恢復 PLAYING 後集中執行。

---

## 23.6 與 QTE

- O、C 不受中毒影響

- QTE 期間中毒倒數繼續

- S 型偏移暫停顯示

- QTE 結束後恢復剩餘效果

中毒倒數在 LOW_BP_STASIS、PAUSED、過場及其他主狀態中同樣繼續。

---

## 23.7 結束

十五秒後：

```javascript
intoxicated = false;
alcoholCount = 0;
inputQueue.length = 0;
bp = 100;
```

HP 與 Score 不恢復。

---

# 第二十四章　狀態機

## 24.1 主狀態

```javascript
const GameState = Object.freeze({
  BOOT: "BOOT",
  TITLE: "TITLE",
  INSTRUCTIONS: "INSTRUCTIONS",
  LEVEL_INTRO: "LEVEL_INTRO",
  PLAYING: "PLAYING",
  QTE: "QTE",
  LOW_BP_STASIS: "LOW_BP_STASIS",
  PAUSED: "PAUSED",
  TRANSFER_CUTSCENE: "TRANSFER_CUTSCENE",
  LEVEL_COMPLETE: "LEVEL_COMPLETE",
  GAME_OVER_RECYCLE: "GAME_OVER_RECYCLE",
  GAME_OVER_FALL: "GAME_OVER_FALL",
  GAME_OVER_STROKE: "GAME_OVER_STROKE",
  VICTORY: "VICTORY"
});
```

---

## 24.2 疊加狀態

以下狀態由 StatusEffectManager 管理：

```javascript
{
  intoxicated: false,
  intoxicationExpiresAtMs: 0,

  malariaVisionObstruction: false,
  malariaObstructionExpiresAtMs: 0,

  lowBloodPressureCooldownExpiresAtMs: 0
}
```

HUD 顯示的 remaining 秒數一律由 `expiresAtMs - gameClock.nowMs` 即時計算，不得另外維護可漂移的倒數狀態。

酒精中毒與瘧原蟲遮蔽不是主狀態。

---

## 24.3 轉換流程

```text
BOOT
→ TITLE
→ INSTRUCTIONS
→ LEVEL_INTRO
→ PLAYING
```

PLAYING：

```text
PLAYING
├─ Gas Trigger → QTE → PLAYING
├─ 低血壓 → LOW_BP_STASIS → PLAYING
├─ Esc／Pointer Lock 中斷 → PAUSED → pausedFromState
├─ HP <= 0 → GAME_OVER_RECYCLE
├─ Wound
│  ├─ 第三關 → GAME_OVER_STROKE
│  └─ 第一、二、四關 → GAME_OVER_FALL
└─ 抵達終點
   → TRANSFER_CUTSCENE
   → LEVEL_COMPLETE
   ├─ 第一至第三關 → 下一關 LEVEL_INTRO
   └─ 第四關 → VICTORY
```

`LEVEL_COMPLETE` 必須：

1. 結算本關 Score、QTE 結果與統計。

2. 清除本關實體、碰撞結果與 pending 輸入。

3. 保存下一關 checkpoint。

4. 第一至第三關增加 `currentLevel` 並進入下一關介紹。

5. 第四關進入 VICTORY，不再建立下一關。

`PAUSED` 可由 PLAYING、QTE、LOW_BP_STASIS 或 TRANSFER_CUTSCENE 進入，並以 `pausedFromState` 返回；實際返回前必須先處理暫停期間產生的 pending 到期結果。

---

## 24.4 狀態與計時矩陣

| 主狀態 | 世界移動／生成／碰撞 | 可接受遊戲輸入 | 狀態倒數、冷卻、QTE | Renderer／HUD |
| --- | --- | --- | --- | --- |
| PLAYING | 執行 | 方向鍵、Z、X | 繼續 | 繼續 |
| QTE | 停止 | O、C | 繼續 | 繼續 |
| LOW_BP_STASIS | 停止 | Z | 繼續 | 繼續 |
| PAUSED | 停止 | 僅恢復操作 | 繼續 | 繼續 |
| TRANSFER_CUTSCENE | 僅過場更新 | 禁用 | 繼續 | 繼續 |
| GAME_OVER／VICTORY | 停止 | 選單操作 | 繼續至狀態清除 | 繼續 |

高低血壓每秒觸發判定與 Wound 生成屬於世界模擬，只在 PLAYING 執行。

---

# 第二十五章　遊戲主迴圈

使用：

```javascript
requestAnimationFrame
```

不得使用 setInterval 作為主迴圈。

---

## 25.1 deltaTime

```javascript
simulationDeltaTime = Math.min(
  (timestamp - lastTimestamp) / 1000,
  GAME_CONFIG.timing
    .maximumSimulationDeltaSeconds
);
```

`simulationDeltaTime` 只供世界移動與動畫使用。所有期限由 `GameClock` 使用 `performance.now()` 的絕對時間管理：

```javascript
remainingSeconds = Math.max(
  0,
  (expiresAtMs - timestamp) / 1000
);
```

分頁隱藏或 Pointer Lock 中斷後，不得使用模擬 delta 補跑世界；恢復時只同步已到期的狀態與 pending 結果。

---

## 25.2 更新順序

```javascript
gameLoop(timestamp) {
  requestAnimationFrame(this.gameLoop);

  const simulationDeltaTime =
    this.calculateDeltaTime(timestamp);

  this.gameClock.update(timestamp);
  this.input.update(
    timestamp,
    simulationDeltaTime
  );
  this.statusEffects.updateRealTime(timestamp);
  this.qteSystem.updateRealTime(timestamp);
  this.stateMachine.update(
    timestamp,
    simulationDeltaTime
  );
  this.cutsceneManager.update(
    timestamp,
    simulationDeltaTime
  );

  if (
    this.stateMachine.current ===
    GameState.PLAYING
  ) {
    this.bloodPressureSystem
      .update(simulationDeltaTime);
    this.player.update(simulationDeltaTime);
    this.levelManager
      .update(simulationDeltaTime);
    this.entityManager
      .update(simulationDeltaTime);

    const collisions =
      this.collisionSystem.detect();

    this.collisionSystem.resolve(collisions);
  }

  if (
    this.stateMachine.current ===
    GameState.LOW_BP_STASIS
  ) {
    this.bloodPressureSystem
      .updateRecoveryInput(
        simulationDeltaTime
      );
  }

  this.cameraController.update(
    simulationDeltaTime
  );
  this.hoodController.update(timestamp);
  this.hudManager.update();
  this.miniMapRenderer.update();

  this.renderer.render(
    this.scene,
    this.camera
  );
}
```

QTE、低血壓、暫停與動畫不得真正停止主迴圈。

---

# 第二十六章　過場與結局

## 26.1 心房至心室輸送帶

| 關卡  | 動畫        |
| --- | --------- |
| 第一關 | 右心房 → 右心室 |
| 第二關 | 左心房 → 左心室 |
| 第三關 | 右心房 → 右心室 |
| 第四關 | 左心房 → 左心室 |

動畫長度約 3～5 秒。

---

## 26.2 HP 歸零

播放：

```text
Spleen
Liver
脾臟／肝臟回收廠
```

紅血球經輸送帶進入回收廠分解。

---

## 26.3 第一、二、四關撞 Wound

播放：

- 車輛衝出血管

- 黑色剪影翻滾

- 墜落深淵

- 畫面淡出

顯示：

```text
Game Over
Vessel Rupture
```

---

## 26.4 第三關撞 Wound

播放：

1. 畫面震動

2. 瞬間全黑

3. 顯示紅字：

```text
中風
Stroke
```

---

## 26.5 勝利動畫

第四關完成後：

- 紅血球載具進入鮮紅血管

- 車身明亮

- 揮舞 O₂ 旗幟

- 其他紅血球加入遊街

- 程序化彩帶與粒子

- 顯示最終統計

---

# 第二十七章　重新挑戰

Game Over 畫面：

```text
重新挑戰本關
從第一關重新開始
回到主選單
```

重新挑戰本關：

- BP 重設為 100

- 清除酒精中毒

- 清除瘧原蟲遮蔽

- 清除所有物件

- HP 恢復為 `Math.max(levelCheckpoint.hp, GAME_CONFIG.checkpoint.retryMinimumHp)`

- Score 恢復為 `levelCheckpoint.score`

- `distanceAlongTrack`、`previousDistanceAlongTrack`、`lateralX`、`lateralY` 歸零

- `gasExchangeStatus` 重設為 `PENDING`

- `gasExchangeAttempts` 重設為 0

- 清除碰撞佇列、延遲輸入與 pending 狀態轉換

- 沿用 `levelCheckpoint.seed`

進入每關時必須保存：

```javascript
levelCheckpoint = {
  levelId: currentLevel,
  hp,
  score,
  seed
};
```

從第一關重新開始：

```javascript
hp = 100;
bp = 100;
score = 0;
alcoholCount = 0;
currentLevel = 1;
```

---

# 第二十八章　核心類別

| 類別                     | 職責                          |
| ---------------------- | --------------------------- |
| Game                   | 初始化與整合所有系統                  |
| GameLoop               | requestAnimationFrame 與更新順序 |
| GameClock              | 絕對截止時間、剩餘時間與分頁恢復同步          |
| GameSession            | HP、BP、Score、交換狀態與 checkpoint 工作階段資料 |
| GameStateMachine       | 主狀態切換                       |
| LevelManager           | 關卡、區段與過關                    |
| RunProgression         | 四關進度、重試、重新開始與結局路由             |
| DeviceSupport          | 桌面支援判定與手機／平板拒絕                 |
| VesselTrack            | 曲線、血管與局部座標                  |
| TrackSection           | 血管區段資料                      |
| PlayerRBC              | 玩家位置、模型與 HP                 |
| HoodController         | 引擎蓋與瘧原蟲遮蔽動畫                 |
| InputController        | 鍵盤、QTE 與輸入佇列                |
| CameraController       | Pointer Lock 與視角            |
| PointerLockController  | Pointer Lock 要求、釋放、拒絕與暫停整合       |
| BloodPressureSystem    | BP、速度與高低血壓                  |
| EntityManager          | 物件生成、更新與移除                  |
| CollisionSystem        | 碰撞偵測與排序                     |
| QTESystem              | 氣體交換                        |
| StatusEffectManager    | 酒精與瘧原蟲狀態                    |
| ScoreSystem            | 分數變動與統計                     |
| HUDManager             | HUD                         |
| FlightInstrumentModel  | ATTITUDE、ALT 與 VIEW 儀表模型       |
| MiniMapRenderer        | SVG 小地圖                     |
| MessageOverlay         | 中央警語                        |
| CutsceneManager        | 過場與結局                       |
| CutsceneRenderer       | 程序化過場 3D／Canvas 顯示             |
| ProceduralAssetFactory | 所有程序化模型                     |
| SeededRandom           | 關卡可重現亂數與重試一致性                 |

---

# 第二十九章　config.js

本章程式區塊是設計契約摘要，不是 STABLE 1.1 完整檔案。`RESTORE` 或 `MAINTAIN` 模式不得用本章片段覆蓋現有 `js/config.js`；完整數值以該檔及 `tests/stable-audit.mjs` 為準。`REBUILD` 模式必須先建立完整設定，再由 STABLE 測試約束其演進。

```javascript
export const GAME_CONFIG = {
  game: {
    initialLevelId: 1
  },

  renderer: {
    referenceWidth: 1920,
    referenceHeight: 1080,
    minimumWidth: 1280,
    minimumHeight: 720,
    maximumPixelRatio: 2
  },

  camera: {
    pitchLimitRadians: Math.PI / 3
  },

  palette: {
    oxygenatedRed: "#ff3347",
    rbcBody: "#cf1f2c",
    transitionMagenta: "#d72678",
    deoxygenatedBlue: "#3157c8",
    venousPurple: "#6d348f",
    malariaDark: "#4a173f",
    woundDark: "#3a1118",
    hudGlow: "#f5fbff"
  },

  hp: {
    initial: 100,
    max: 200,
    min: 0
  },

  score: {
    initial: 0
  },

  penalties: {
    debuffMultiplier: 2
  },

  bp: {
    initial: 100,
    min: 50,
    max: 180,
    safeMin: 80,
    safeMax: 130,
    changeRate: 18
  },

  movement: {
    bpOffset: 50,
    speedPerBp: 0.1,
    minSpeed: 5,
    maxSpeed: 18,
    strafeSpeed: 4.5
  },

  timing: {
    maximumSimulationDeltaSeconds: 0.1,
    realTimeTimersContinueWhilePaused: true
  },

  track: {
    playerCollisionRadius: 0.55,
    wallMargin: 0.35,
    sectionOverlapMin: 0.5,
    sectionOverlapMax: 1.0,
    radii: {
      chamber: 6.5,
      greatVessel: 5.5,
      majorVessel: 5.0,
      arteriole: 4.0,
      systemicCapillary: 3.2,
      pulmonaryCapillary: 3.4,
      venule: 3.8
    }
  },

  collision: {
    window: 0.75,
    playerProfile: {
      topOffsetY: 0,
      bottomOffsetY: -1.91
    },
    entityLabelCategories: ["BUFF", "DEBUFF"]
  },

  entities: {
    spawnIntervalMin: 8,
    spawnIntervalMax: 16,
    spawnAheadMin: 35,
    spawnAheadMax: 70,
    despawnBehind: 20,
    maximumActive: 24,
    minimumGap: 2.5,
    maximumConsecutiveSameDebuff: 2
  },

  entityTypes: {
    vitaminC: {
      baseWeight: 18,
      scoreDelta: 1,
      hpDelta: 1,
      collisionRadius: 0.77
    },
    vitaminB12: {
      baseWeight: 14,
      scoreDelta: 1,
      hpDelta: 1,
      collisionRadius: 0.81
    },
    iron: {
      baseWeight: 14,
      scoreDelta: 1,
      hpDelta: 1,
      collisionRadius: 0.8
    },
    carbonMonoxide: {
      baseWeight: 20,
      scoreDelta: -2,
      hpDelta: -2,
      collisionRadius: 0.75
    },
    malaria: {
      baseWeight: 10,
      scoreDelta: -3,
      hpDelta: -3,
      collisionRadius: 1.19
    },
    alcohol: {
      baseWeight: 16,
      scoreDelta: -1,
      hpDelta: -1,
      collisionRadius: 1.08
    },
    wound: {
      scoreDelta: -200,
      collisionRadius: 1.15
    },
    empty: {
      baseWeight: 8
    }
  },

  levels: {
    1: {
      highRisk: false,
      targetDriveSeconds: 300,
      trackLength: 3000,
      seed: 0x52424301,
      controlPoints: [],
      gasTriggerRatios: {
        primary: 0.59,
        retry: 0.66,
        fallback: 0.695
      },
      sectionRatios: [
        0.03,
        0.12,
        0.25,
        0.15,
        0.15,
        0.10,
        0.15,
        0.05
      ],
      multipliers: {
        buff: 1,
        debuff: 1,
        alcohol: 1,
        wound: 1
      }
    },
    2: {
      highRisk: false,
      targetDriveSeconds: 90,
      trackLength: 900,
      seed: 0x52424302,
      controlPoints: [],
      gasTriggerRatios: {
        primary: 0.40,
        retry: 0.55,
        fallback: 0.64
      },
      sectionRatios: [
        0.05,
        0.25,
        0.35,
        0.25,
        0.10
      ],
      multipliers: {
        buff: 1,
        debuff: 1,
        alcohol: 1,
        wound: 1
      }
    },
    3: {
      highRisk: false,
      targetDriveSeconds: 180,
      trackLength: 1800,
      seed: 0x52424303,
      controlPoints: [],
      gasTriggerRatios: {
        primary: 0.56,
        retry: 0.65,
        fallback: 0.695
      },
      sectionRatios: [
        0.03,
        0.12,
        0.20,
        0.15,
        0.20,
        0.10,
        0.15,
        0.05
      ],
      multipliers: {
        buff: 1,
        debuff: 1,
        alcohol: 1,
        wound: 1
      }
    },
    4: {
      highRisk: true,
      targetDriveSeconds: 90,
      trackLength: 900,
      seed: 0x52424304,
      controlPoints: [],
      gasTriggerRatios: {
        primary: 0.40,
        retry: 0.55,
        fallback: 0.64
      },
      sectionRatios: [
        0.05,
        0.25,
        0.35,
        0.25,
        0.10
      ],
      multipliers: {
        buff: 0.7,
        debuff: 2.5,
        alcohol: 2,
        wound: 3
      }
    }
  },

  qte: {
    durationMs: 1500,
    resultDisplayMs: 800,
    oxygenThreshold: 3,
    carbonDioxideThreshold: 3,
    carbonMonoxidePoisoningThreshold: 9,
    successScore: 10,
    failureScore: -6,
    opportunityCountByRegion: {
      TISSUE: 10,
      LUNG: 20
    }
  },

  lowBloodPressure: {
    durationSeconds: 5,
    cooldownSeconds: 10,
    maximumChancePerSecond: 0.35,
    chancePerBpPoint: 0.025
  },

  intoxication: {
    triggerCount: 5,
    durationSeconds: 15,
    inputDelayMinMs: 250,
    inputDelayMaxMs: 700,
    inputFailureChance: 0.35,
    bpRandomIntervalMs: 400,
    swayFrequency: 3.2,
    swayAmplitude: 0.75
  },

  malaria: {
    obstructionDurationSeconds: 5,
    hoodOpenAngle: 1.15,
    hoodPrimaryFrequency: 9.5,
    hoodPrimaryAmplitude: 0.22,
    hoodSecondaryFrequency: 17,
    hoodSecondaryAmplitude: 0.08,
    hoodRollFrequency: 6.5,
    hoodRollAmplitude: 0.12,
    hoodOffsetFrequency: 11,
    hoodOffsetAmplitude: 0.025,
    maximumScreenCoverage: 0.82,
    combinedMaximumCoverage: 0.72,
    restoreDurationSeconds: 0.4,
    steamBlurPixels: 8,
    steamOpacity: 0.72,
    steamDriftSeconds: 6
  },

  bloodRupture: {
    malariaCollisionInterval: 5,
    hoodDurationMultiplier: 3,
    bloodPressureMaximum: 60
  },

  carbonMonoxidePoisoning: {
    collisionTriggerCount: 10
  },

  wound: {
    baseChanceCoefficient: 0.005,
    exponentialBpScale: 15,
    maximumChancePerSecond: 0.45,
    highRiskFormulaMinBp: 80,
    safeRangeMultiplier: 1,
    maximumActive: 2,
    minimumGap: 45,
    dodgedBehindDistance: 10
  },

  checkpoint: {
    retryMinimumHp: 50
  },

  cutscenes: {
    transferDurationMinSeconds: 3,
    transferDurationMaxSeconds: 5
  }
};
```

`config.js` 是所有遊戲數值的唯一來源。`levels.js`、`entityTypes.js` 與各系統類別必須匯入命名設定，不得重複宣告時間、距離、機率、尺寸、顏色、權重、分數、HP 或效能上限。

`levels.js` 保留資料驅動責任，但只負責以下非數值結構：

- 關卡 ID 與名稱。

- 路線與區段順序。

- Location 顯示文字。

- 氣體交換的語意類型。

- 將 `GAME_CONFIG.levels` 的數值設定組裝為 Level 資料物件。

`controlPoints` 在第二階段填入第一關，在第八階段填入其餘三關；控制點座標也屬遊戲數值，只能存於 `config.js`。

---

# 第三十章　效能要求

目標：

```text
1920 × 1080 接近 60 FPS
```

最低要求：

```text
一般桌上型電腦維持 30 FPS 以上
```

必須：

- 限制 devicePixelRatio

- 使用物件池

- 一般實體同時活躍上限為 24

- Wound 同時活躍上限為 2

- 重複模型使用 InstancedMesh

- 釋放 Geometry

- 釋放 Material

- 釋放 Texture

- 不在每影格建立大量 Vector3

- 不在主迴圈建立 Geometry

- 不大量操作 DOM

- 不建立無限制 setTimeout

- 所有狀態期限使用 `GameClock` 絕對時間，不為每個期限建立 setTimeout

- 相同關卡 seed 必須產生相同的一般實體序列

Phase 10 實測基線：

| 指標 | 驗收上限／下限 | Phase 10 實測 |
| --- | ---: | ---: |
| 前景 FPS | 至少 30 | 42～60，依瀏覽器與解析度 |
| Draw calls | 不高於 30 | 22 |
| Triangles | 不高於 20,000 | 16,302 |
| Renderer geometries | 60 秒不增加 | 39 → 39 |
| Renderer textures | 60 秒不增加 | 4 → 4 |
| JS heap 成長 | 60 秒不高於 16 MB | 0.325 MB |

---

# 第三十一章　驗收條件

## 31.1 操作

- 滑鼠只能控制視角

- 方向鍵控制車輛

- WASD 無效

- Z、X 控制 BP

- O、C 只在 QTE 生效

- event.repeat 不計入 QTE

- 攝影機方向不影響玩家移動

## 31.2 HUD

- HP、BP、Score、Location、Level 正確

- 小地圖顯示七個節點

- 玩家亮點連續移動

- 特殊效果顯示倒數

## 31.3 瘧原蟲

- 撞擊扣 HP 3

- 撞擊扣 Score 3

- 引擎蓋遮蔽 5 秒

- 遮蔽 40％～65％

- 引擎蓋持續翻動

- HUD 不被遮住

- 重複碰撞只重設時間

- 不建立多個引擎蓋

- QTE 期間移開引擎蓋但遮蔽倒數繼續

- HP 歸零時清除效果

## 31.4 酒精

- 第五次碰撞中毒

- 中毒 15 秒

- BP 亂跳

- S 型偏移

- 輸入延遲

- 35％失效

- 中毒結束清除佇列

## 31.5 結局

- HP 歸零播放回收結局

- 第一、二、四關 Wound 播放墜落

- 第三關 Wound 播放中風

- 四關完成播放勝利動畫

## 31.6 時間與狀態

- QTE、LOW_BP_STASIS、PAUSED 中所有狀態倒數與冷卻繼續

- PAUSED 不移動玩家、不生成實體、不執行碰撞

- 分頁恢復後只同步截止時間，不補跑世界模擬

- QTE 在暫停期間到期時，恢復後正確套用 pending 結果

## 31.7 關卡與資料契約

- 玩家與實體只使用 `distanceAlongTrack`

- 實體本體使用 `collisionRadius`；玩家使用十字線至機體下緣的膠囊，增益／減益標示牌使用集中設定的矩形

- BP 100 時，四關純模擬駕駛時間依序為 300、90、180、90 秒，誤差不超過 1％

- 體微血管交換區產生 10 個、肺泡微血管交換區產生 20 個 Gas Token 機會，且交換區外不觸發

- 任一次 QTE 成功即完成交換；全部機會失敗後仍可抵達終點並過關

- 第四關酒精權重總倍率為 5

- 第四關安全 BP Wound 使用同一指數公式，BP 130 時為每秒 0.5％，高 BP 時只套三倍倍率

- `TRANSFER_CUTSCENE` 後正確進入 LEVEL_COMPLETE

- 第一至第三關完成後進入下一關，第四關完成後進入 VICTORY

- 相同 seed 產生相同的一般實體序列

## 31.8 自動測試

不依賴外部測試框架。Node 入口為 `tests/run-tests.mjs`，瀏覽器入口為 `tests/unit-test.html`；STABLE 1.1 基線必須維持 204 項測試及 9 項靜態稽核全部通過。至少涵蓋：

- 距離換算

- 掃掠碰撞

- BP 與 Wound 公式

- 狀態計時

- QTE 任一次成功、組織 10 次全失敗及肺 20 次全失敗

- 關卡轉換

- 固定 seed 生成結果

## 31.9 架構與階段交付

- 除 `config.js` 外，不得存在會影響玩法、平衡或驗收結果的魔術數字

- `levels.js` 不直接宣告遊戲數值，只以 `GAME_CONFIG.levels` 組裝四關資料

- 四關共用同一套核心系統，不存在按關卡複製的 Manager 或 System

- 所有正式版資源均為本地程序化內容

- GitHub Pages 專案子路徑可正常啟動 ES Modules 與 `vendor/three.module.js`

- 每一階段均存在對應的 `reports/phase-XX-report.md`

- 每份階段報告包含實際測試、錯誤修正與重測證據

- 前一階段未 PASS 時，不得出現下一階段功能或報告

---

# 第三十二章　開發流程

本章保留 Phase 00–10 的原始開發歷程，並提供真正 `REBUILD` 時的依賴順序。對已 Clone 的完成版，歷史報告均已 PASS；不得重新逐階段覆寫。維護工作應先執行完整 STABLE gate，再以最小變更、回歸測試及新的版本報告處理。

## 共通階段閘門

每個階段必須依序完成：

1. 只實作本階段列出的範圍，不提前製作後續功能。

2. 執行目前可用的自動測試。

3. 使用實際支援瀏覽器進行手動驗收。

4. 記錄錯誤、重現步驟與原因。

5. 修正本階段發現的錯誤。

6. 完整重新執行自動測試與手動驗收。

7. 依 `RELEASE_REPORT_TEMPLATE.md` 建立版本或變更報告。

8. 報告必須列出實作範圍、修改檔案、測試環境、測試結果、錯誤、修正、重測結果與殘餘風險。

9. 階段結果為 PASS 後才可開始下一階段。

任何測試失敗、錯誤未修正、報告缺漏或提前實作後續功能，都必須將該階段標示為 BLOCKED。不得以「後續階段再處理」作為跳過目前錯誤的理由。

---

## 第零階段：技術契約與測試骨架

完成：

- 確認本總案、`TECHNICAL_DECISIONS.md`、`codex-devp-cmd.md` 與 `RELEASE_REPORT_TEMPLATE.md`

- 建立專案目錄

- 鎖定 Three.js r184 並保存 MIT 授權與 SHA-256

- 建立 `GameClock`

- 建立 `SeededRandom`

- 定義玩家、實體與關卡資料 schema

- 建立完整 `GAME_CONFIG`，集中所有已知遊戲數值

- 建立 `levels.js` 資料組裝骨架且不含遊戲數字常數

- 建立 `tests/unit-test.html`

- 先完成距離、BP、Wound 與亂數單元測試

- 提交 `reports/phase-00-report.md`

此階段通過後才可進入遊戲原型。

---

## 第一階段：專案骨架與駕駛原型

完成：

- Three.js 場景

- Renderer

- Camera

- 測試血管

- PlayerRBC

- 方向鍵移動

- Z、X 血壓

- Pointer Lock

- 第一人稱 RBC 車頭

- 基本 HUD

不得實作：

- 物件

- 碰撞

- QTE

- 四關

- 中毒

- 結局

---

## 第二階段：關卡與血管

完成：

- levels.js

- LevelManager

- VesselTrack

- TrackSection

- 第一關完整路徑

- 第一關 Location

- 第一關血管顏色與變徑區段

- 關卡起點與終點

- `distanceAlongTrack` 與局部框架

- SVG 小地圖路徑映射資料

此階段不得先製作第二至第四關，以免核心玩法尚未驗證便擴大返工範圍。

---

## 第三階段：HUD 與小地圖

完成：

- SVG 循環圖

- 七個節點

- 血管連線

- 玩家亮點

- 中央訊息

- 狀態倒數區域

---

## 第四階段：物件與碰撞

完成：

- ProceduralAssetFactory

- C

- B12

- Fe²⁺

- CO

- 瘧原蟲

- 酒精

- Wound

- EntityManager

- CollisionSystem

- 文字貼圖

- 分數與 HP

此階段建立引擎蓋模型與基本瘧原蟲觸發。

本階段所有物件與碰撞只需在第一關完成。

---

## 第五階段：血壓特殊機制

完成：

- 高血壓 Wound 公式

- 低血壓停滯

- 每秒判定

- 冷卻

- 第四關倍率

---

## 第六階段：QTE

完成：

- Gas Token

- QTE 狀態

- O、C 計數

- QTE 成功與失敗

- 重試

- 血管變色

- 全部交換機會失敗後允許過關

- TRANSFER_CUTSCENE 與 LEVEL_COMPLETE 基本流程

- 重新挑戰本關

完成本階段時，第一關必須形成可從標題一路玩到過關或 Game Over 的端到端垂直切片。未通過第一關驗收前，不得擴展其他關卡。

---

## 第七階段：狀態效果

完成：

- 酒精中毒

- S 型偏移

- 輸入佇列

- BP 亂跳

- 瘧原蟲引擎蓋翻動

- 狀態重疊

- 所有倒數跨 QTE、LOW_BP_STASIS 與 PAUSED 繼續

- QTE 中移開引擎蓋但不暫停瘧原蟲倒數

- 清除殘留狀態

---

## 第八階段：其餘關卡資料化擴展

完成：

- 第二關 900 單位肺循環

- 第三關 1800 單位體循環（頭部、胸部及上肢）

- 第四關 900 單位肺循環（高危險關卡）

- 四關 Location、顏色、半徑與小地圖映射

- 第四關一般減益、酒精、增益與 Wound 倍率

- 四關目標駕駛時間自動測試

各關只能透過 `levels.js` 資料新增，不得複製並分叉核心系統類別。

---

## 第九階段：過場與結局

完成：

- 心房至心室輸送帶

- 回收結局

- 墜落結局

- 中風結局

- 勝利動畫

- 重新挑戰

- 重新開始

---

## 第十階段：測試與部署

完成：

- Chrome 測試

- Edge 測試

- Firefox 測試

- 不同解析度

- Pointer Lock 中斷

- 分頁切換

- PAUSED 與 QTE 到期 pending 結果

- 固定 seed 重現

- 四關基準時間

- 自動單元測試全數通過

- 記憶體檢查

- FPS 檢查

- README

- GitHub Pages 部署

---

## STABLE 功能收斂：循環同步、累積危害與逾時結局

完成：

- 氣體交換區段的小地圖標記鎖定「組織」或「肺」節點，離開區段後恢復連續路徑。
- 一般 `DEBUFF` 的 Score 與 HP 扣分乘 2；氣體交換失敗分數為 -6；致命血管破口不套倍率。
- 每關瘧原蟲碰撞達 5 的倍數時觸發 15 秒「血球破裂」，引擎蓋時間為一般效果 3 倍，BP 上限暫降為 60。
- 每關 CO 碰撞累積 10 次後維持「CO 中毒」至本關結束，O 與 C 各需輸入 9 次。
- 引擎蓋加大；任何瘧原蟲頭罩效果與復原期間均以程序化水蒸氣模糊全畫面。
- 截止前未抵達時進入 Time Out，乾扁紅血球送往肝臟工廠；正好在 deadline 抵達不得誤判。
- 移除玩家畫面上的編號階段標章、內部 state、FPS、Pointer Lock、checkpoint seed 與動畫內部識別。
- `npm run test:stable` 必須通過 204 tests 與 9 audits。
- 發布必須由使用者明示授權；推送 `main` 前需重跑完整 gate，並追蹤 GitHub Pages workflow 至成功。

---

# 附錄 A　空機還原與乾淨重建

## A.1 首選：從 GitHub 還原完成版

在空白電腦上，優先執行：

```powershell
git clone https://github.com/kisaraki/Classroom-rbc-racer-tzk.git rbc-racer
Set-Location .\rbc-racer
git switch main
git status --short
npm run test:stable
python -m http.server 8000
```

macOS／Linux 對應命令：

```bash
git clone https://github.com/kisaraki/Classroom-rbc-racer-tzk.git rbc-racer
cd rbc-racer
git switch main
git status --short
npm run test:stable
python3 -m http.server 8000
```

預期結果：

- `git status --short` 無輸出。
- `npm test` 為 204 passed、0 failed。
- `npm run test:audit` 為 9 passed、0 failed。
- `http://127.0.0.1:8000/` 顯示遊戲。
- `http://127.0.0.1:8000/tests/unit-test.html` 顯示 204 項通過。

本案沒有 npm dependencies，不應先執行 `npm install`，也不應產生 `node_modules/` 或 `package-lock.json`。

## A.2 Three.js vendor 完整性

STABLE 1.1 基準檔案：

| 檔案 | SHA-256 |
| --- | --- |
| `vendor/three.module.js` | `61134198639a10885daf893fb29669ca26386e2a4cde76e8399f51e329f741f2` |
| `vendor/three.core.js` | `368dc78835287709a48939e8eb9a7a61d0732098bdf916e56840d458aae9ccf3` |
| `vendor/THREE-LICENSE.txt` | `8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc` |

Windows PowerShell：

```powershell
Get-FileHash .\vendor\three.module.js -Algorithm SHA256
Get-FileHash .\vendor\three.core.js -Algorithm SHA256
Get-FileHash .\vendor\THREE-LICENSE.txt -Algorithm SHA256
```

若 Clone 後雜湊不同，先以 Git 還原受損檔案。只有原始碼完全不可取得時，才依 README 的官方 r184 URL 重新下載；不得從第三方鏡像或 CDN 執行。

## A.3 真正乾淨重建

只有 Git 原始碼不可取得、損壞無法修復，或使用者明確要求重新實作時，才使用此模式：

1. 建立全新的空目錄，不在完成版工作樹直接重建。
2. 將本總案、`TECHNICAL_DECISIONS.md`、`codex-devp-cmd.md` 與版本報告範本放入新目錄。
3. 依架構依賴分批建置，但不得另造新的編號階段或降低 STABLE 契約。
4. 每批先列授權範圍與排除項，再實作、測試、修正、重測及寫報告。
5. 前一批不是 PASS 時，不得進入下一批。
6. 不以歷史截圖或報告冒充執行證據；所有測試必須在新環境重跑。
7. 完成後比較正式名稱、版本、功能、測試數、vendor 雜湊、效能上限與 Pages 相對路徑。

詳細可直接交給 AI／Codex 的指令與重建矩陣位於 `codex-devp-cmd.md`。

## A.4 部署重建

`.github/workflows/deploy-pages.yml` 是正式部署入口，流程必須先執行 `npm run test:stable`，通過後才上傳整個靜態站台並部署。新倉庫必須由擁有者啟用 GitHub Pages 的 GitHub Actions 來源；不得把私人 token、帳密或產生的部署憑證寫入專案。

部署後驗證：

```text
https://<owner>.github.io/<repository>/
https://<owner>.github.io/<repository>/tests/unit-test.html
```

兩個 URL 都必須使用專案子路徑正常載入；不得只測網域根路徑。

## A.5 交付物邊界

`rbc-racer/` 是可直接部署的應用程式根目錄。PPTX、PNG 開發截圖、錄影、瀏覽器 profile、driver、測試輸出及臨時 worktree 必須留在倉庫外，例如：

```text
classroom-rbc-racer-tzk/
├─ rbc-racer/       # GitHub Pages 部署根目錄
└─ deliverables/    # 簡報與開發證據，不部署、不納入 runtime audit
```

此邊界可防止非 runtime 圖片誤觸「不得使用外部媒體」稽核，也避免 GitHub Pages artifact 無限制膨脹。

## A.6 空機完成定義

只有同時符合下列條件，才算成功還原或重建：

1. 可從乾淨工作樹啟動，無需安裝專案套件。
2. 204 項測試與 9 項稽核全部通過。
3. Chrome、Edge、Firefox 桌面版可進入遊戲。
4. 1280 × 720 與 1920 × 1080 無 HUD 溢位。
5. 手機與平板在 Three.js 載入前被拒絕。
6. 四關、氣體交換、狀態效果、過場、重試與結局均符合本總案。
7. Three.js r184 三個 vendor 檔案雜湊一致。
8. GitHub Pages 專案子路徑與線上測試頁均正常。
9. `git status --short` 只包含明確授權的變更。
10. 簡報與開發截圖不在部署根目錄內。
11. 正式名稱、副標、STABLE 狀態與 Version 1.1（20260715）在設定、介面與文件中一致。

---
