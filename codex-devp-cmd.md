# Project Aorta：大動脈計畫室 Codex 空機重建與維護指令

| 項目 | 內容 |
| --- | --- |
| 文件版本 | 3.5 |
| 對應總案版本 | 3.5 |
| 技術決策附錄版本 | 1.6 |
| 正式名稱 | Project Aorta：大動脈計畫室 |
| 副標 | RBC RACER |
| 專案狀態 | STABLE |
| 產品版本 | 1.1（20260715） |
| GitHub | `https://github.com/kisaraki/Classroom-rbc-racer-tzk` |
| 前一功能基線 | `e22cd963ed5bd12cca877200dd2f2238cff169fc` |
| STABLE 1.1 實作基線 | `363f4c9124448a013d4d7c12e3f3bf2eddc7444e` |

本文件是交給其他版本 AI、Codex 或開發者的執行手冊，不重複定義全部玩法數值。所有相對路徑都以 `rbc-racer/` Git 倉庫根目錄為準。

---

# 一、先判斷工作模式

任何代理在修改檔案前，必須先選擇且回報一種模式：

| 模式 | 判定條件 | 行為 |
| --- | --- | --- |
| `RESTORE` | GitHub 可取得，目標是空機還原完成版 | Clone、驗證、啟動，不重寫程式 |
| `MAINTAIN` | 完整工作樹已存在，使用者要求修正或擴充 | 保護既有變更，先測試，再做最小修改 |
| `REBUILD` | 原始碼遺失／損壞，或使用者明確要求從零重建 | 在新的空目錄依現行總案與 STABLE gate 建置 |

預設模式是 `RESTORE`。歷史 Phase 00–10 只供理解演進；只有明確符合 `REBUILD` 才可在新目錄依架構依賴重建。

禁止事項：

- 不得在已完成的 `main` 工作樹重新產生整個專案。
- 不得因規格片段與現況不同，就覆寫已通過測試的完整實作。
- 不得刪除、重設或還原使用者未授權的變更。
- 不得在測試失敗時建立 PASS 報告。
- STABLE 後不得新增編號階段；後續工作採 SemVer 版本與變更報告。

---

# 二、可直接交給 AI／Codex 的總指令

```text
你正在接手《Project Aorta：大動脈計畫室》（副標：RBC RACER）。請先完整讀取並遵守：

1. classroom-rbc-racer-tzk.md
2. CIRCULATION_TERMINOLOGY.md
3. TECHNICAL_DECISIONS.md
4. codex-devp-cmd.md
5. README.md
6. RELEASE_REPORT_TEMPLATE.md
7. reports/README.md、歷史開發報告與正式版本報告
8. package.json、tests/stable-audit.mjs、js/config.js、js/data/levels.js

第一步不得寫程式。先檢查目前目錄、Git root、remote、branch、HEAD、git status、
必要檔案與可用工具，然後在 RESTORE、MAINTAIN、REBUILD 中選擇一種模式並說明證據。

模式規則：

- GitHub 可用且沒有原始碼時，選 RESTORE，優先 clone 完成版。
- 完整專案已存在時，選 MAINTAIN；先跑 npm run test:stable，不得重做歷史開發流程。
- 只有原始碼不可取得／無法修復，或使用者明確要求從零實作時，才選 REBUILD。
- REBUILD 必須在新的空目錄依架構依賴分批完成，測試、修正、重測並寫報告；
  前一批未 PASS 不得繼續，且不得另造編號階段。

不可變技術要求：

1. HTML5、CSS3、Vanilla JavaScript ES Modules。
2. Three.js r184，runtime 僅載入本地 vendor/three.module.js 與 three.core.js。
3. 不使用 React、Vue、Angular、Svelte、Phaser、Unity、後端或資料庫。
4. 不使用 runtime 外部圖片、模型、影片、字型、CDN 或遠端 API。
5. 模型、標示、小地圖、紋理與動畫全部程序化產生。
6. 所有玩法、時間、距離、機率、尺寸、顏色與效能上限集中在 js/config.js。
7. 四關由 js/data/levels.js 組裝並共用核心 Manager／System。
8. 不執行 npm install；專案沒有 package dependency。
9. 不使用 file://；本機必須透過靜態 HTTP server。
10. PPTX、PNG、錄影、driver、profile 與臨時 worktree 放在 ../deliverables 或系統暫存，
    不得放入 rbc-racer 部署根目錄。
11. 循環系統繁體中文術語遵守 CIRCULATION_TERMINOLOGY.md；玩家可見文字使用
    充氧血、減氧血與微血管，且不得把四個關卡誤稱為四種循環。

每次工作完成前必須執行適用的完整測試、git diff --check、檢查 git status，
並回報實際輸出、未執行項目與殘餘風險。不要只提出計畫；可執行時必須完成實作與驗證。
```

---

# 三、空機 RESTORE 操作

## 3.1 前置工具

必要：

- Git
- 可執行 ES Modules 的 Node.js 與 npm
- Python 3 或其他純靜態 HTTP server
- 桌面版 Chrome、Edge、Firefox
- 鍵盤、滑鼠與 WebGL

STABLE 1.1 必須以目前環境實際執行 `npm run test:stable`；不得為 Node.js 版本差異加入相依套件或編譯步驟。Phase 10 的 Node.js `v24.15.0` 紀錄僅是歷史環境證據。

Windows PowerShell 檢查：

```powershell
git --version
node --version
npm --version
python --version
```

## 3.2 Clone 與基線驗證

Windows PowerShell：

```powershell
git clone https://github.com/kisaraki/Classroom-rbc-racer-tzk.git rbc-racer
Set-Location .\rbc-racer
git switch main
git remote -v
git rev-parse HEAD
git status --short
npm run test:stable
```

macOS／Linux：

```bash
git clone https://github.com/kisaraki/Classroom-rbc-racer-tzk.git rbc-racer
cd rbc-racer
git switch main
git remote -v
git rev-parse HEAD
git status --short
npm run test:stable
```

基準提交 `0cdaa69b...` 可以是目前 HEAD，也可以是目前 HEAD 的祖先；不得為了強制回到舊提交而覆寫較新的合法修正。驗證祖先關係：

```powershell
git merge-base --is-ancestor 0cdaa69b27c58816144ef58face1d72e99f9a2fd HEAD
```

預期：

- `git status --short` 在乾淨 Clone 無輸出。
- `npm test`：204 passed、0 failed。
- `npm run test:audit`：9 passed、0 failed。
- 不出現 `node_modules/` 或 `package-lock.json`。

## 3.3 本機啟動

Windows：

```text
start-local.cmd
```

或手動執行：

```powershell
python -m http.server 8000
```

macOS／Linux：

```bash
python3 -m http.server 8000
```

驗證網址：

```text
http://127.0.0.1:8000/
http://127.0.0.1:8000/tests/unit-test.html
http://127.0.0.1:8000/tests/phase-09-cutscene-preview.html
```

不得雙擊 `index.html` 或使用 `file://`。

---

# 四、MAINTAIN 模式

完整工作樹存在時，依序執行：

1. `git status --short`，辨識使用者既有變更。
2. 閱讀與需求直接相關的程式、測試、總案及技術決策。
3. 執行 `npm run test:stable` 建立變更前基線。
4. 若基線失敗，先判斷是否由既有未提交變更或非 runtime 產物造成，不得直接弱化測試。
5. 只修改必要檔案，補上能重現問題的測試。
6. 執行目標測試，再執行完整 STABLE gate。
7. 以實際瀏覽器驗證受影響流程與兩種解析度。
8. 執行 `git diff --check` 與 `git status --short`。
9. 回報變更、理由、測試輸出、未測項目與殘餘風險。

不得把一般維護工作偽裝成新的編號階段，也不得改寫歷史 PASS 報告。新的修正應建立獨立版本報告或提交說明。

---

# 五、REBUILD 共通閘門

真正從零重建時，依架構依賴分成小批次，但不建立新的編號階段。每批使用下列指令模板：

```text
請在全新空目錄重建《Project Aorta：大動脈計畫室》，副標 RBC RACER。

開始前：
1. 完整讀取總案、技術決策、術語、README 與 STABLE 測試契約。
2. 列出本批授權範圍、明確排除項目與預計修改檔案。
3. 確認前一批結果為 PASS；檢查工作樹，不覆寫既有合法變更。

執行時：
4. 只實作本批範圍；所有數值讀取 js/config.js。
5. 為新增契約補上單元或整合測試。
6. 執行目前全部自動測試及適用的瀏覽器驗收。
7. 記錄錯誤、重現步驟與根因，在本批修正並完整重測。

完成時：
8. 依 RELEASE_REPORT_TEMPLATE.md 建立版本或變更報告。
9. 報告包含範圍、檔案、環境、原始輸出、錯誤、修正、重測與殘餘風險。
10. 只有所有門檻通過才標示 PASS；否則標示 BLOCKED 並停止。
11. 未經使用者要求不得 push；不得降低 STABLE gate 或另造編號階段。
```

歷史里程碑的最低測試數是回歸參考，不是為了湊數。最終必須達到現行 204 tests 與 9 audits，並符合正式產品識別。

---

# 六、歷史 Phase 00–10 與 STABLE 重建矩陣

| 里程碑 | 授權範圍 | 必要結果 | 歷史測試底線 |
| --- | --- | --- | ---: |
| 00 | 技術契約、config、Clock、EventBus、Random、schema、vendor、測試骨架 | 無完整 3D 遊戲 | 24 |
| 01 | Scene、Renderer、Camera、RBC 駕駛、輸入、Pointer Lock、基本 HUD | 可操作桌面原型 | 51 |
| 02 | LevelManager、第一關、TubeGeometry、局部框架與距離進度 | 第一關無障礙可駕駛 | 60 |
| 03 | 完整 HUD、循環小地圖、四個心臟腔室靠近與心臟輪廓 | 兩解析度可讀 | 78 |
| 04 | 七類實體、InstancedMesh、生成、掃掠碰撞、縮小 RBC、手機拒絕 | 第一關物件閉環 | 109 |
| 05 | 高／低 BP、Wound、停滯、危害時鐘、血管環境反光 | BP 機制可驗證 | 125 |
| 06 | Gas Token、O／C QTE、失敗可通過、工具列、第一關垂直切片 | 標題到第一關完成 | 145 |
| 07 | 酒精、瘧原蟲、輸入佇列、遮蔽與跨暫停絕對期限 | 狀態可重疊且可清除 | 158 |
| 08 | 四關資料、5／1.5／3／1.5 分鐘、ATTITUDE／ALT／VIEW | 四關共用核心 | 169 |
| 09 | 轉場、回收、墜落、中風、勝利、重試／重開／主選單 | 完整流程與結局 | 181 |
| 10 | 最終氣體交換規則、色彩切換、回歸、效能、Pages | 190 tests + 8 audits | 190 + 8 |
| STABLE 1.1 | 小地圖交換鎖點、2 倍減益、血球破裂、CO 中毒、Time Out、蒸氣、啟動、可見碰撞輪廓與正式產品識別 | 204 tests + 9 audits；`main` 發布前必須完整通過 | 204 + 9 |

## 6.1 Phase 00

- 建立規格目錄與具責任邊界的模組，不建立空白 PASS placeholder。
- 建立完整 `js/config.js`；`levels.js` 只組裝語意與設定。
- 建立 `GameClock`、`EventBus`、`SeededRandom` 與資料 schema。
- 放置 Three.js r184 的 module、core、MIT license 並核對 SHA-256。
- 建立 Node 與瀏覽器共用測試骨架。
- 排除：正式場景、HUD、實體、碰撞、QTE、狀態與關卡流程。

## 6.2 Phase 01

- 建立 Three.js 場景、相機、渲染與 resize。
- 建立第一人稱 RBC、方向鍵局部截面移動、Z／X BP、滑鼠視角。
- 十字代表鍵盤機身姿態；滑鼠不得改變位置、速度或 BP。
- Pointer Lock 釋放時停止世界模擬，Real Clock 與絕對期限繼續。
- 排除：正式關卡、一般實體、碰撞、QTE 與結局。

## 6.3 Phase 02

- 以 CatmullRomCurve3、分段 TubeGeometry、平行傳輸框架建立第一關。
- 玩家與實體位置只使用 `distanceAlongTrack`、`lateralX`、`lateralY`。
- 第一關長度 3000，BP 100 純駕駛目標 300 秒。
- `levels.js` 不得複製 `config.js` 數值。

## 6.4 Phase 03

- 建立 HP、BP、Score、Location、Level、距離與狀態 HUD。
- 建立程序化 SVG 循環小地圖與玩家連續亮點。
- 右／左心房、右／左心室相對位置正確且彼此靠近，以外輪廓包含四腔。
- 驗證 1280 × 720 與 1920 × 1080。

## 6.5 Phase 04

- 建立 C、B12、Fe²⁺、CO、瘧原蟲、C₂H₅OH、Wound 程序化模型。
- 使用固定 seed、距離式生成、物件池、InstancedMesh 與明確資源釋放。
- 使用掃掠縱向碰撞與截面 `collisionRadius`，依優先序只結算一次。
- 縮小 RBC 與 RBC 字樣，維持完整可讀且可迴避。
- 啟動時在 Three.js 前拒絕手機與平板。

## 6.6 Phase 05

- 高 BP Wound 與低 BP stasis 必須與 FPS 無關並使用每秒抽樣。
- 安全 BP 的 Wound 沿用指數公式；高危險關卡只在高 BP 套倍率。
- 暫停與 QTE 不補跑世界生成或碰撞，但所有期限繼續。
- RBC 材質以所在血管顏色產生微弱環境反射，不覆蓋充氧血／減氧血狀態主色。

## 6.7 Phase 06

- 建立 Gas Token、O／C QTE、倒數、成功／失敗與 pending 結果。
- 完成一次交換可成功；失敗不阻塞路線通過。
- 建立 KOSMOS TOOLKIT、探真拓知酷與鍵鼠操作說明。
- 第一關形成從標題到過關或 Game Over 的端到端垂直切片。
- Phase 10 的 10／20 次機會與顏色切換規則是最終契約，優先於早期報告。

## 6.8 Phase 07

- 酒精：15 秒、S 型偏移、BP 亂跳、輸入延遲與失效；O／C 不受影響。
- 瘧原蟲：引擎蓋遮蔽與翻動，不遮 HUD／小地圖／QTE。
- QTE、LOW_BP_STASIS、PAUSED 中狀態期限均繼續。
- 重複觸發只重設期限，不累積第二套 transform 或 hood。

## 6.9 Phase 08

- 四關 BP 100 目標時間依序 300、90、180、90 秒。
- Level 1／3 為體微血管交換區；Level 2／4 為肺泡微血管交換區。
- 十字只表示鍵盤姿態，圓形只表示滑鼠視線。
- 建立 ATTITUDE、動態血管半徑 ALT 與 VIEW 儀表。
- 所有關卡共用 Manager／System，不建立 level-specific fork。

## 6.10 Phase 09

- 建立心房至心室轉移、Spleen／Liver 回收、墜落、Stroke 與 O₂ 勝利遊街。
- 建立重試本關、從第一關重開、返回主選單。
- checkpoint 保存 HP、Score、seed 與充氧血／減氧血顏色狀態；重試清除暫態效果。
- 過場使用絕對時間，Pointer Lock 釋放不造成卡死。

## 6.11 Phase 10

- 氣體交換只在體微血管與肺泡微血管區發生；其他區段不得觸發。
- 體微血管產生 10 次機會，肺泡微血管產生 20 次機會，均勻分布於交換區。
- 任一次成功即完成交換並移除剩餘機會；全部失敗仍可通關。
- 成功後 RBC 在紅色與紅紫色間切換，狀態跨關與 checkpoint 保存。
- 完成 190 tests、8 audits、三瀏覽器、兩解析度、資源與效能驗收。
- `.github/workflows/deploy-pages.yml` 必須在測試通過後才部署。

## 6.12 STABLE 1.1 正式收斂

- 在交換區內以 `gasExchangeZone` 對應 `minimap.exchangeAnchorNodeByRegion`，組織事件鎖定 `tissues`，肺部事件鎖定 `lungs`；不得以猜測 SVG 百分比取代節點契約。
- 一般 `DEBUFF` 的 Score 與 HP 負值乘以 2；Wound 的致命類別不乘倍數；QTE 失敗分數固定為 -6。
- 每關分別維護 `malariaCount` 與 `carbonMonoxideCount`，過關、重試、重開時歸零。
- 瘧原蟲每累積 5 隻觸發 15 秒血球破裂，BP 上限 60；引擎蓋與程序化蒸氣使用絕對期限，在 QTE、暫停與停滯期間繼續。
- CO 累積 10 次後維持中毒至本關結束，O 與 C 各需 9 次；不得只增加總按鍵數而偏廢任一氣體。
- deadline 到達且尚未抵達終點時進入 `GAME_OVER_TIMEOUT`；跨越期限的幀只保留 deadline 前的 simulation delta，正好抵達有效。
- Time Out 過場必須程序化顯示乾扁紅血球、輸送帶與肝臟工廠，不載入外部圖像。
- 玩家畫面不得顯示編號階段、build、FPS、Pointer Lock、內部 state、checkpoint seed 或過場內部識別；KOSMOS TOOLKIT 與必要操作儀表保留。
- 正式名稱固定為「Project Aorta：大動脈計畫室」，副標為「RBC RACER」，發布狀態為 `STABLE`，版本顯示為 `Version：1.1（20260715）`。
- 完成 `npm run test:stable`、`git diff --check`、語法檢查與適用的桌面瀏覽器驗收。
- 未經使用者另行授權不得 push 或部署 GitHub Pages。

---

# 七、最終規格與測試常數

```text
REPOSITORY=https://github.com/kisaraki/Classroom-rbc-racer-tzk
PREVIOUS_FUNCTION_BASELINE=e22cd963ed5bd12cca877200dd2f2238cff169fc
STABLE_IMPLEMENTATION_BASELINE=363f4c9124448a013d4d7c12e3f3bf2eddc7444e
RELEASE_STATUS=STABLE
RELEASE_VERSION=1.1
RELEASE_DATE=20260715
THREE_RELEASE=r184
THREE_PACKAGE_VERSION=0.184.0
EXPECTED_TESTS=204
EXPECTED_AUDITS=9
LEVEL_TARGET_SECONDS=300,90,180,90
TISSUE_GAS_OPPORTUNITIES=10
LUNG_GAS_OPPORTUNITIES=20
MINIMUM_VIEWPORT=1280x720
REFERENCE_VIEWPORT=1920x1080
MAX_DRAW_CALLS=30
MAX_TRIANGLES=20000
MINIMUM_FPS=30
MAX_60S_HEAP_GROWTH_MB=16
```

Three.js vendor SHA-256：

```text
vendor/three.module.js     61134198639a10885daf893fb29669ca26386e2a4cde76e8399f51e329f741f2
vendor/three.core.js       368dc78835287709a48939e8eb9a7a61d0732098bdf916e56840d458aae9ccf3
vendor/THREE-LICENSE.txt   8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc
```

若值與程式不同，先判斷是否為已通過測試的新版本；不得只為符合文字而倒退合法變更。任何規格更新都必須同步修改總案、設定、測試及報告。

---

# 八、完整驗證命令

## 8.1 自動測試

```powershell
npm test
npm run test:audit
npm run test:stable
```

## 8.2 JavaScript 語法

Windows PowerShell：

```powershell
Get-ChildItem .\js, .\tests -Recurse -File -Include *.js,*.mjs |
  ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { throw "Syntax check failed: $($_.FullName)" }
  }
```

## 8.3 Git 與格式

```powershell
git diff --check
git status --short
git diff --stat
```

不得以 `git reset --hard`、`git checkout --` 或未經確認的 `git restore` 清除失敗證據或使用者修改。

## 8.4 瀏覽器手動矩陣

| 瀏覽器 | 1280 × 720 | 1920 × 1080 | Pointer Lock | Console |
| --- | --- | --- | --- | --- |
| Chrome | 必測 | 必測 | 必測 | 專案持續性錯誤 0 |
| Edge | 必測 | 必測 | 必測 | 專案持續性錯誤 0 |
| Firefox | 必測 | 必測 | 必測 | 專案持續性錯誤 0 |

另測：手機拒絕、Esc 暫停、分頁切換、QTE 到期、酒精／瘧原蟲重疊、四關轉換、所有結局、重試及重新開始。

---

# 九、GitHub Pages 重建

正式 workflow：`.github/workflows/deploy-pages.yml`。

必要契約：

1. Push 到 `main` 或手動 dispatch 才啟動。
2. Build job 先執行 `npm run test:stable`。
3. 只有 gate 通過才 configure、upload artifact 及 deploy。
4. 所有 import、CSS、vendor 路徑必須為 repository-relative。
5. 不把 token、帳密、瀏覽器 profile 或 private key 寫入倉庫。
6. 新倉庫須由擁有者啟用 GitHub Pages 的 GitHub Actions source。

部署後驗證：

```text
https://<owner>.github.io/<repository>/
https://<owner>.github.io/<repository>/tests/unit-test.html
```

目前正式站：

```text
https://kisaraki.github.io/Classroom-rbc-racer-tzk/
https://kisaraki.github.io/Classroom-rbc-racer-tzk/tests/unit-test.html
```

---

# 十、常見故障與正確處理

| 症狀 | 常見原因 | 正確處理 |
| --- | --- | --- |
| `file://` 白畫面、按鈕無反應或 CORS | 直接開啟 HTML，ES Modules 未載入 | 雙擊 `start-local.cmd`，或啟動靜態 HTTP server；入口必須顯示明確阻擋訊息 |
| 開始按鈕停在原畫面 | 瀏覽器靜默忽略 Pointer Lock | 立即顯示等待狀態，超過 `GAME_CONFIG.pointerLock.requestTimeoutMs` 後顯示可重試錯誤 |
| Audit 指出 PNG／媒體 | 簡報或截圖放入部署根目錄 | 移至相鄰 `../deliverables/`，不要弱化 audit |
| Three.js import 失敗 | module／core 缺一、路徑或大小寫錯誤 | 核對三個 vendor 檔與 SHA-256 |
| GitHub Pages 本機正常、線上失敗 | 使用網域根絕對路徑 | 改成相對路徑並跑 audit |
| Real Clock 燈動、秒數不動 | 顯示更新未讀取 GameClock elapsed | 用單元測試與實際秒數驗證，不只看狀態燈 |
| QTE 或狀態在暫停後卡住 | 使用 simulation delta 或 interval | 改用 GameClock 絕對 deadline 與 pending 結果 |
| 高速穿透碰撞 | 只判斷本幀端點 | 使用 previous/current distance 掃掠判定 |
| 手機仍載入 3D | 裝置檢查太晚 | 在動態匯入 Three.js 前拒絕 |
| 既有 clone 測試失敗 | 未提交檔案、產物污染或版本漂移 | 先查 `git status` 與 diff；不得直接重建或重設 |

---

# 十一、報告與交接格式

每次交接至少回報：

```text
Mode: RESTORE | MAINTAIN | REBUILD
Repository / branch / HEAD:
Baseline status before work:
Files changed:
Why each file changed:
Automated tests and exact result:
Browser/manual checks and environment:
Errors found, fixes, and retest result:
Not tested:
Residual risks:
Git status:
Commit / push / deployment status:
```

新報告必須使用 `RELEASE_REPORT_TEMPLATE.md`。歷史 Phase 00–10 報告是證據，不可覆寫；維護工作另建具版本、日期或主題名稱的報告。

---

# 十二、完成定義

空機還原、乾淨重建或維護只有同時符合下列條件才算完成：

1. 工作模式與來源證據已明確回報。
2. 專案可由純靜態 server 啟動，不需 package install 或 build。
3. 204 項測試與 9 項稽核全數通過。
4. Three.js r184 vendor 與 MIT license 雜湊一致。
5. 四關共用資料驅動核心，所有遊戲數值集中在 `js/config.js`。
6. 三瀏覽器、兩解析度與 Pointer Lock／暫停流程通過。
7. 手機與平板在載入 3D 前拒絕。
8. 氣體交換只在體微血管／肺泡微血管發生，10／20 次機會、一次成功、全失敗可通過。
9. RBC 紅／紅紫切換及 checkpoint 保存正確。
10. Geometry、Material、Texture、物件池與效能上限通過。
11. GitHub Pages 專案子路徑與線上測試頁正常。
12. 非 runtime 交付物不在 `rbc-racer/`。
13. 未授權的使用者變更未被刪除或重設。
14. 所有未完成、未測與殘餘風險已誠實列出。
15. 玩家可見循環術語與 Location 已通過 `CIRCULATION_TERMINOLOGY.md` 對照。
16. 正式名稱、副標、STABLE 狀態與 Version 1.1（20260715）在設定、介面、測試與文件中一致。
16. RBC 十字線至機體下緣，以及增益／減益本體與標示牌，均依總案碰撞輪廓成立。

---
