# RBC Racer 階段結果報告

**階段：** Phase 10 - 最終測試、最佳化與部署  
**報告日期：** 2026-07-15  
**總案版本：** 2.3  
**執行者：** Codex  
**結果：** PASS

---

# 一、本階段範圍

## 已授權實作

- 完成所有自動測試與既有功能回歸。
- 實測 Chrome、Edge、Firefox，以及 1280 x 720、1920 x 1080 兩種桌面解析度。
- 驗證 Pointer Lock 中斷、PAUSED 到期、分頁切換及不補算 `deltaTime`。
- 驗證 Geometry、Material、Texture 釋放、物件池、InstancedMesh 與活躍實體上限。
- 建立集中式 FPS、draw calls、triangles、長時間樣本與 heap 成長驗收上限。
- 稽核外部素材、CDN、框架、後端、資料庫、魔術數字、共用核心與 GitHub Pages 相對路徑。
- 完成 README、Three.js r184 來源、MIT 授權及 SHA-256 紀錄。
- 實際部署到 GitHub Pages 專案子路徑，並對部署版執行三瀏覽器驗收。
- 依本次需求將氣體交換限制於組織與肺，設定組織 10 次、肺 20 次、任一次成功即完成。
- 氣體交換成功時切換 RBC 原紅色與紅紫色，並保存跨關與 checkpoint 狀態。

## 明確排除

- React、Vue、Angular、Phaser、Unity、後端、資料庫或任何外部 runtime 媒體。
- 手機與平板遊玩；產品會在 Three.js 啟動前顯示拒絕畫面。
- Safari、Windows 11 與 macOS 的次要環境矩陣。
- 為原始 RBC Racer 程式碼新增授權條款；README 明確記錄目前未選定專案授權，Three.js 仍保留 MIT 授權。

本階段是第零至第十階段的最終階段，沒有提前實作後續階段。

---

# 二、完成內容

| 項目 | 結果 | 相關檔案 |
| --- | --- | --- |
| 組織 10 次、肺 20 次交換機會 | 完成 | `js/config.js`、`js/data/levels.js` |
| 僅體微血管／肺泡微血管觸發且無終點保底 | 完成 | `js/data/schemas.js`、`js/systems/QTESystem.js` |
| 任一次成功、全部失敗仍可通過 | 完成 | `js/systems/QTESystem.js`、`js/core/Game.js` |
| RBC 紅／紅紫切換及環境反光 | 完成 | `js/player/PlayerRBC.js`、`js/config.js` |
| 跨關及 checkpoint 顏色保存 | 完成 | `js/core/RunProgression.js`、`js/data/schemas.js` |
| HUD 動態機會數與結果文案 | 完成 | `js/ui/HUDManager.js`、`js/core/Game.js` |
| 資源生命週期與效能上限測試 | 完成 | `tests/unit/resourceLifecycle.test.js`、`js/config.js` |
| 最終架構與部署稽核 | 完成 | `tests/phase-10-audit.mjs`、`package.json` |
| Phase 10 CI 與 Pages gate | 完成 | `.github/workflows/deploy-pages.yml` |
| 最終使用與技術文件 | 完成 | `README.md`、`TECHNICAL_DECISIONS.md`、總案 |
| 可重現手動矩陣 | 完成 | `tests/phase-10-manual-test-checklist.md` |

---

# 三、實際測試環境

| 項目 | 內容 |
| --- | --- |
| 作業系統 | Microsoft Windows 10 教育版 10.0.19045 |
| Chrome | 150.0.7871.115，ChromeDriver 同版 |
| Edge | 150.0.4078.65，Microsoft Edge WebDriver 同版 |
| Firefox | 152.0.4，geckodriver 0.36.0 |
| 畫面解析度 | 1280 x 720、1920 x 1080 |
| Three.js | r184，本機 vendor |
| Node.js | v24.15.0 |
| Python | 3.14.4 |
| 本機啟動方式 | `python -m http.server 4173 --bind 127.0.0.1` |
| 本機網址 | `http://127.0.0.1:4173/`、`/tests/unit-test.html` |
| 正式網址 | `https://kisaraki.github.io/Classroom-rbc-racer-tzk/` |
| 正式測試頁 | `https://kisaraki.github.io/Classroom-rbc-racer-tzk/tests/unit-test.html` |

---

# 四、自動測試

| 測試命令或頁面 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- |
| Phase 09 基準 `npm test` | 181／181 | 181 passed、0 failed | PASS |
| 最終 `npm test` | 全部通過 | 190 passed、0 failed | PASS |
| `npm run test:audit` | 8／8 | 8 passed、0 failed | PASS |
| `npm run test:phase10` | 回歸加稽核全部通過 | 190 tests 加 8 audits 全通過 | PASS |
| 線上 Chrome 共用測試頁 | 190／190 | 190 passed、0 failed | PASS |
| 線上 Edge 共用測試頁 | 190／190 | 190 passed、0 failed | PASS |
| 線上 Firefox 共用測試頁 | 190／190 | 190 passed、0 failed | PASS |
| 71 個 JS／MJS `node --check` | 無語法錯誤 | 71 passed、0 failed | PASS |
| `git diff --check` | 無空白錯誤 | 通過，僅 Git 行尾轉換提示 | PASS |
| GitHub Actions run `29383460559` | test、audit、artifact、deploy 成功 | build 及 deploy success | PASS |
| Pages HTTP 與 release token | 入口及測試頁 200 | 兩頁均 200，Phase 10 token 正確 | PASS |

重要覆蓋：

- 四條路線仍以共用 `LevelManager`、`EntityManager`、`QTESystem`、`CollisionSystem` 與渲染核心運行。
- 每個交換座標必須嚴格遞增，且只能落在唯一的 `TISSUE` 或 `LUNG` section 內。
- 任一次 QTE 成功後 `nextTriggerDistance` 為空；組織 10 次或肺 20 次全部失敗後仍可進入 transfer。
- 成功交換切換 RBC 顏色，下一關與 checkpoint retry 保留該狀態；血管環境光仍疊加在基礎色上。
- 四關 BP 100 的固定步進模擬分別為 300、90、180、90 秒，符合 5、1.5、3、1.5 分鐘。
- 固定 seed、Entity schedule、Wound 機率、碰撞、狀態效果、過場、結局、重試與手機拒絕測試全部保留。
- runtime 無 `setTimeout`／`setInterval`，所有 QTE、狀態、訊息及過場使用絕對 deadline。

---

# 五、手動驗收

| 驗收項目 | 操作步驟 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- | --- |
| Phase 10 正式入口 | 載入本機與 Pages 根網址 | 顯示 P10、READY、第一關 | phase 10、TISSUE／10、RBC RED | PASS |
| Pointer Lock 拒絕 | 自動化瀏覽器點擊開始 | 安全進入 PAUSED | 顯示「無法鎖定滑鼠」，可重試 | PASS |
| PAUSED 實時計時 | 讀取 3 秒前後 diagnostics | clock 前進、simulation 不動 | elapsed +3.1 秒、updates +0 | PASS |
| 分頁切換 | 開啟另一分頁約 3 秒再讀原頁 | clock 前進、不補算世界 | elapsed +4.0 秒、updates +0 | PASS |
| 1280 Chrome | 載入 Pages 並校準 inner viewport | 無溢位、無 console error | 60 FPS、22 calls、16,302 triangles | PASS |
| 1920 Chrome | 調整為 1920 x 1080 | 無溢位、無 console error | 51 FPS、22 calls、16,302 triangles | PASS |
| 1280 Edge | 載入 Pages 後校準 viewport | 無溢位、無專案 error | 60 FPS、22 calls、16,302 triangles | PASS |
| 1920 Edge | 調整為 1920 x 1080 | 無溢位、無專案 error | 60 FPS、22 calls、16,302 triangles | PASS |
| 1280 Firefox | 載入 Pages 後校準 viewport | 正常初始化且無溢位 | READY、22 calls、16,302 triangles | PASS |
| 1920 Firefox | 調整為 1920 x 1080 | 正常初始化且無溢位 | READY、22 calls、16,302 triangles | PASS |
| Firefox favicon | 重載新版 inline SVG favicon | 無 MIME／FaviconLoader 錯誤 | 專案相關 console error 0 | PASS |
| 手機拒絕 | 執行 Client Hint、iPhone、Android、iPad fixture | 啟動前拒絕且不顯示控制 | 五項裝置測試全部通過 | PASS |

Firefox WebDriver 使用 headless 軟體 WebGL 且會對背景 `requestAnimationFrame` 節流，因此量到 4 至 6 FPS；此數值不視為硬體前景效能。Firefox 的 ES Modules、Three.js 初始化、兩種版面、190 項測試與專案 console 均通過。

---

# 六、發現的錯誤

| ID | 嚴重度 | 現象 | 重現步驟 | 原因 |
| --- | --- | --- | --- | --- |
| TEST-10-001 | P2 | QTE schema 改版後首次回歸有一項 fixture 失敗 | 執行首次 Phase 10 `npm test` | 舊 assembler fixture 沒有指定唯一交換區 |
| TEST-10-002 | P2 | 首次資源釋放測試錯誤判定共享 Sprite geometry | 執行新增 resource lifecycle suite | 測試把 Three.js 共享快取資源誤認為 factory 自有資源 |
| FIREFOX-10-003 | P3 | Firefox 首輪顯示 favicon MIME 錯誤 | 以 geckodriver 載入空 data favicon | 空 data URI 不是可解析的圖示內容 |
| DATA-10-004 | P2 | 初版 schema 只檢查 trigger 數量與有限值 | 將交換點改到 section 邊界或交換順序 | 缺少 section 邊界及嚴格遞增驗證 |

Edge 首輪日誌中的 `assets.msn.com` 404 與 Chrome 的 `DEPRECATED_ENDPOINT` 來自瀏覽器內建服務，不是本專案來源；重新隔離 profile、清空初始日誌並只比對專案 URL 後，專案持續性錯誤為 0。

---

# 七、修正內容

| Bug ID | 修正方式 | 修改檔案 | 回歸風險 |
| --- | --- | --- | --- |
| TEST-10-001 | fixture 加入 `TISSUE` 語意並與正式 schema 共用 10 次設定 | `tests/unit/schemas.test.js` | 低，僅同步測試資料契約 |
| TEST-10-002 | 資源測試只追蹤 batch 明確擁有的 geometry、material、texture | `tests/unit/resourceLifecycle.test.js` | 低，不修改 runtime 所有權 |
| FIREFOX-10-003 | 改用可解析的最小 inline SVG favicon | `index.html`、`tests/unit-test.html` | 低，不增加外部資源 |
| DATA-10-004 | schema 與 QTE constructor 同時驗證 section、邊界及排序 | `js/data/schemas.js`、`js/systems/QTESystem.js` | 低，只拒絕無效關卡資料 |

---

# 八、修正後重測

| Bug ID | 原測試結果 | 重測結果 | 是否關閉 |
| --- | --- | --- | --- |
| TEST-10-001 | 184 passed、1 failed | 185 passed、0 failed，最終 190／190 | 是 |
| TEST-10-002 | 188 passed、1 failed | 189 passed、0 failed，最終 190／190 | 是 |
| FIREFOX-10-003 | Firefox FaviconLoader MIME error | Firefox 專案 console error 0 | 是 |
| DATA-10-004 | 無 section 邊界防禦 | 新增拒絕邊界與逆序資料測試，190／190 | 是 |

---

# 九、數值與效能證據

| 指標 | 目標 | 實測 | 結果 |
| --- | --- | --- | --- |
| 前景 in-app FPS | 至少 30 | 42 至 54 | PASS |
| Pages Chrome FPS | 至少 30 | 1280：60；1920：51 | PASS |
| Pages Edge FPS | 至少 30 | 1280：60；1920：60 | PASS |
| draw calls | 不高於 30 | 22 | PASS |
| triangles | 不高於 20,000 | 16,302 | PASS |
| renderer geometries | 60 秒不增加 | 39 到 39 | PASS |
| renderer textures | 60 秒不增加 | 4 到 4 | PASS |
| JS heap 成長 | 60 秒不高於 16 MB | 340,656 bytes，0.325 MB | PASS |
| 長時間 FPS | 樣本期間不低於 30 | 54 到 55 | PASS |
| 一般活躍實體 | 不高於 24 | 測試在上限停止啟用 | PASS |
| 活躍 Wound | 不高於 2 | 測試在上限停止生成 | PASS |
| InstancedMesh batch | 7 類且拒絕超容量 | 7 類全部通過 | PASS |
| runtime interval timer | 0 | 0 | PASS |

60 秒樣本由 Edge 150.0.4078.65 在 PAUSED render loop 中量測；REAL CLOCK 從 5.1 秒前進到 65.2 秒，simulation updates 維持 0，證明長時間 render、計時與資源觀察同時有效。

---

# 十、變更清單

- 新增：Phase 10 compliance audit、resource lifecycle 測試、最終手動清單與本報告。
- 修改：氣體交換資料、QTE 狀態、RBC 色彩、checkpoint、跨關流程、HUD、診斷、README、技術決策與 Pages workflow。
- 刪除：兩次 QTE 上限、主要／重試／終點 fallback trigger 與各關 `gasTriggerRatios`。
- 實作提交：`71b43b22ae5d2828c58fe1c34e0df79dba2331d1`。
- GitHub Actions：`29383460559`，build 與 deploy 均成功。

---

# 十一、殘餘風險

- 瀏覽器自動化無法可靠保留 foreground Pointer Lock；本階段已實測拒絕、暫停、實時計時與分頁切換，成功鎖定及恢復由共用狀態測試覆蓋。實際教室設備仍應保留一次自然點擊鎖定的快速檢查。
- Firefox headless 使用軟體 WebGL，其 FPS 不代表實機前景硬體。Firefox 功能與相容性已通過，若教室以 Firefox 為主要瀏覽器，仍應在目標 GPU 上確認前景 FPS。
- 四關自然駕駛合計約 11 分鐘；本階段以固定 time step 完整模擬四關時間與終點狀態，沒有以自動化滑鼠完成一段不間斷的自然 Pointer Lock 駕駛。
- GitHub Pages 官方 actions 仍提出 Node.js 20 deprecated 警告，但 runner 強制使用 Node.js 24，run `29383460559` 的 test、artifact 與 deploy 均成功。
- Safari、Windows 11 與 macOS 為未測次要環境；手機與平板則依產品需求主動拒絕。

以上均為測試環境或次要平台限制，目前沒有已知 P0、P1 或阻擋正式部署的程式錯誤。

---

# 十二、階段結論

- [x] 本階段需求全部完成。
- [x] 190 項自動測試與 8 項稽核全部通過。
- [x] Chrome、Edge、Firefox 部署版及兩種正式解析度均完成驗收。
- [x] 本階段發現的錯誤均已修正並重測。
- [x] Geometry、Material、Texture、heap、FPS 與活躍上限均有實測證據。
- [x] README、授權紀錄、SHA-256、技術決策及 GitHub Pages 完整。
- [x] 報告內容與本機、GitHub Actions 及部署版實際結果一致。

**最終結果：** PASS  
**是否允許進入下一階段：** 不適用，第十階段為本案最終階段，專案完成
