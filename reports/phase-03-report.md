# RBC Racer 階段結果報告

**階段：** Phase 03 - HUD 與小地圖
**報告日期：** 2026-07-14
**總案版本：** 2.3
**執行者：** Codex
**結果：** PASS

---

# 一、本階段範圍

## 已授權實作

- SVG 血液循環圖及七個具名節點。
- 八條節點間血管曲線與第一關 SVG Path。
- 玩家亮點沿第一關路徑連續移動、發光及脈動。
- HP、BP、Score、Location、Level、距離、速度與絕對計時器排版。
- 特殊狀態倒數顯示區與中央訊息系統。
- 1280 x 720 與 1920 x 1080 響應式驗收。

## 明確排除

- 一般實體、生成器、物件池及碰撞。
- QTE、氣體交換、低血壓停滯、酒精、瘧原蟲與 Wound 效果。
- 第二至第四關可玩路線、過場、關卡完成、Game Over 與結局。

未將後續階段功能提前併入本階段。狀態區只接受未來提供的絕對期限資料，目前不產生任何狀態效果。

---

# 二、完成內容

| 項目 | 結果 | 相關檔案 |
| --- | --- | --- |
| 小地圖集中設定 | 完成 | `js/config.js` |
| SVG 節點、血管與路徑產生 | 完成 | `js/ui/MiniMapRenderer.js` |
| 玩家 Path 連續定位 | 完成 | `js/ui/MiniMapRenderer.js`、`js/core/Game.js` |
| HUD 數值與特殊狀態區 | 完成 | `js/ui/HUDManager.js`、`index.html` |
| 絕對期限中央訊息 | 完成 | `js/ui/MessageOverlay.js` |
| 720p／1080p 排版 | 完成 | `css/hud.css` |
| Phase 03 共用測試 | 完成 | `tests/unit/minimap.test.js`、`tests/unit/hud.test.js` |

---

# 三、實際測試環境

| 項目 | 內容 |
| --- | --- |
| 作業系統 | Microsoft Windows 10 教育版 10.0.19045 |
| 瀏覽器 | Google Chrome 150、Codex In-app Browser |
| 畫面解析度 | 1280 x 720、1920 x 1080 |
| Three.js 版本 | r184 |
| Node.js | v24.15.0 |
| 本機啟動方式 | `python -m http.server 8123 --bind 127.0.0.1` |
| 測試網址 | `http://127.0.0.1:8123/`、`/tests/unit-test.html` |

---

# 四、自動測試

| 測試命令或頁面 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- |
| Phase 02 基準 `npm test` | 60／60 | 60 passed、0 failed | PASS |
| Phase 03 `npm test` | 全部通過 | 76 passed、0 failed | PASS |
| 共用瀏覽器測試頁 | 與 Node 同套件 | 76 passed、0 failed | PASS |
| 全部 JavaScript／MJS `node --check` | 無語法錯誤 | 全部通過 | PASS |
| `git diff --check` | 無空白錯誤 | 通過 | PASS |
| 後續階段範圍檢查 | 無 Entity／Collision／QTE／StatusEffect runtime | 差異中均無 | PASS |
| GitHub Actions run 29338621041 | Linux 測試、建置及部署通過 | 76／76，build／deploy success | PASS |

小地圖測試證據：

- 節點：7，ID 為 brain、lungs、left/right atrium、left/right ventricle、tissues。
- 血管：8，所有起訖節點及座標均由設定驗證。
- 第一關活動路徑：1，由 3 條連續 Cubic Bezier 曲線組成。
- Level 1 `minimapPathId` 與 SVG 路徑 ID 同為 `systemic-lower-circulation-path`。
- Path 取樣測試覆蓋起點、終點、0.25、1／3 及超界夾制。
- 訊息與狀態倒數均以 `expiresAtMs - nowMs` 計算，不維護可漂移的剩餘值。

---

# 五、手動驗收

| 驗收項目 | 操作步驟 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- | --- |
| Phase 03 啟動畫面 | 以 HTTP 載入遊戲 | P03 與循環遙測說明 | 顯示正確 | PASS |
| 程序化 SVG | 檢查 DOM 與畫面 | 7 節點、8 血管、無圖片 | `7`、`8`，全部由 SVG DOM 建立 | PASS |
| 第一關活動路線 | 檢查作用中 path／vessel | 1 route、3 active vessels | `1`、`3` | PASS |
| 玩家起點 | 讀取 marker transform | 位於左心室 | `translate(221.000 214.000)` | PASS |
| 玩家連續移動 | Chrome 前景實際駕駛並分段讀值 | 進度與座標連續變化 | 0.1280／`252.149 241.950` 至 0.1366／`251.346 244.881` | PASS |
| HUD 必要資料 | 檢查右側遙測 | HP、BP、Score、Location、Level | 全部顯示，Level 為 `1 / 4` | PASS |
| 狀態區 | 無狀態時載入 | 明確空狀態且不套用效果 | `NO ACTIVE CONDITIONS` | PASS |
| 中央訊息 | 成功 Pointer Lock | 顯示後依絕對時間消失 | `ROUTE SYNCHRONIZED` 正常顯示及到期 | PASS |
| 暫停時絕對計時 | 觸發 Pointer Lock 拒絕並等待 | 世界不動、時鐘繼續 | 距離保持 0，時鐘由 24.7 增至 42.2 秒 | PASS |
| 1280 x 720 | 設定 viewport 並量測 | 無溢位、無面板重疊 | X／Y 0；三組 overlap 均 0 | PASS |
| 1920 x 1080 | 設定 viewport 並量測 | 無溢位、無面板重疊 | X／Y 0；三組 overlap 均 0 | PASS |
| Console | 讀取遊戲與測試頁 warning／error | 應用程式 0 | 應用程式 0 | PASS |
| GitHub Pages | 載入正式遊戲與測試頁 | P03、SVG diagnostics、76／76 | P03、r184、7／8／1、線上 76／76、console 0 | PASS |

Chrome 控制擴充在第一次前景測試成功取得 Pointer Lock 並留下實際連續移動證據；後續重試被 Chrome 拒絕，遊戲正確進入 PAUSED。另有一筆 `chrome-extension://.../contentStart.js` 的擴充自身錯誤，不來自專案 URL，未列為應用程式錯誤。

---

# 六、發現的錯誤

| ID | 嚴重度 | 現象 | 重現步驟 | 原因 |
| --- | --- | --- | --- | --- |
| MODULE-03-001 | P1 | 初次回歸為 59／60 | 修改模組版本後執行 `npm test` | 測試與 runtime 以不同 query token 載入同一 Level 物件，參照不相等 |
| LAYOUT-03-002 | P1 | 720p 計時／生命徵象及任務／狀態面板重疊 | 1280 x 720 量測 bounding rect | 緊湊斷點的垂直起點不足 |
| LAYOUT-03-003 | P1 | 1080p 生命徵象與任務面板重疊 9px | 1920 x 1080 量測 bounding rect | 寬螢幕字級增加卡片高度 |
| PERF-03-004 | P2 | Chrome 控制擴充前景取樣約 28 FPS | 1920 x 1080 Pointer Lock 駕駛 | 新 SVG 面板含大面積 backdrop blur 與多層 drop-shadow，且擴充擷取有額外負載 |

---

# 七、修正內容

| Bug ID | 修正方式 | 修改檔案 | 回歸風險 |
| --- | --- | --- | --- |
| MODULE-03-001 | 統一 Phase 03 module query token，新增 16 項測試 | runtime 與 tests import | 僅快取識別及測試名稱 |
| LAYOUT-03-002 | 重新排列 720p vital、mission、status 的垂直節奏 | `css/hud.css` | 緊湊畫面間距改變 |
| LAYOUT-03-003 | 分離一般高度的 vital、mission、status 起點 | `css/hud.css` | 寬螢幕右側卡片位置改變 |
| PERF-03-004 | 移除大面積 backdrop-filter 與 SVG drop-shadow，保留高亮色及脈動 halo | `css/hud.css` | 光暈較收斂 |

---

# 八、修正後重測

| Bug ID | 原測試結果 | 重測結果 | 是否關閉 |
| --- | --- | --- | --- |
| MODULE-03-001 | 59 passed、1 failed | 76 passed、0 failed | 是 |
| LAYOUT-03-002 | 兩組面板重疊 | 三組 overlap 均 0，頁面溢位 0／0 | 是 |
| LAYOUT-03-003 | vital／mission 重疊 9px | 三組 overlap 均 0，頁面溢位 0／0 | 是 |
| PERF-03-004 | Chrome 控制擴充約 28 FPS | In-app Browser 1920p 兩次 60 FPS；Chrome 功能證據保留 | 是 |

---

# 九、數值與效能證據

| 指標 | 目標 | 實測 | 結果 |
| --- | --- | --- | --- |
| 1920 x 1080 FPS | 最低 30、目標接近 60 | 兩次 60 FPS | PASS |
| 1920 x 1080 畫布 | CSS 尺寸完整 | client 1920 x 1080、buffer 1440 x 810 | PASS |
| 小地圖 DOM | 7 nodes、8 vessels、1 route | 7、8、1 | PASS |
| 活動路徑 | 第一關 3 段連續 | 3 active vessels、0.0000～1.0000 | PASS |
| DOM 更新 | 不大量重建 | SVG 僅建置一次，每幀只更新 marker transform 與既有文字 | PASS |
| 活躍實體數 | 本階段不適用 | 尚未實作實體 | 不適用 |

---

# 十、變更清單

- 新增：`tests/unit/minimap.test.js`、`tests/unit/hud.test.js`、`tests/phase-03-manual-test-checklist.md`、本報告。
- 完成：`js/ui/MiniMapRenderer.js`、`js/ui/MessageOverlay.js`。
- 修改：集中設定、Game／HUD 整合、入口 HTML、HUD CSS、README、共用測試執行器與 Pages 工作流程名稱。
- 本階段實作提交：`72ad4ff`（`feat: complete phase 3 circulation hud`）。
- Pages 工作流程：`29338621041`，build 與 deploy 均 success。

---

# 十一、殘餘風險

- Chrome 自動化後端無法穩定重複取得 Pointer Lock；已保留一次成功前景駕駛證據，拒絕路徑亦正確暫停且時鐘持續。
- 本階段狀態區與中央訊息只提供顯示契約；實際狀態來源與效果屬後續階段。
- Chrome、Edge、Firefox 長時間多瀏覽器回歸與記憶體壓測屬 Phase 10。

---

# 十二、階段結論

- [x] 本階段授權功能已實作。
- [x] 自動測試全部通過。
- [x] 本階段可執行的手動瀏覽器驗收已通過。
- [x] 已修正本階段發現的錯誤並完成回歸測試。
- [x] 未提前實作後續階段功能。
- [x] GitHub Pages 新版部署與線上回歸通過。
- [x] 本報告內容與實際結果一致。

本階段授權內容、自動測試、可執行的前景驗收、版面及效能修正、GitHub Pages 部署與線上回歸均已完成。

**最終結果：** PASS
**是否允許進入下一階段：** 是
