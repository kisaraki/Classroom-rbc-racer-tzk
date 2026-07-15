# RBC Racer 階段結果報告

**階段：** Phase 02 - 關卡與血管
**報告日期：** 2026-07-14
**總案版本：** 2.3
**執行者：** Codex
**結果：** PASS

---

# 一、本階段範圍

## 已授權實作

- `levels.js` 第一關資料組裝器與通用 `LevelManager`。
- 第一關 3000 單位體循環（腹部及下肢）路線與 19 個控制點。
- 八個 Location、精確起訖距離、半徑及顏色漸變區段。
- 第一關起點、終點與無障礙完整駕駛契約。
- 共用局部框架及 `distanceAlongTrack` 世界座標換算。
- 第一關 Gas Trigger 預留位置及 SVG Path 連續進度映射資料。

## 明確排除

- 第二、第三、第四關的控制點、路線與可玩資料。
- 實體生成、物件池、碰撞、QTE 及狀態效果。
- SVG 小地圖實際繪製、關卡完成、過場、Game Over 與結局。

未將後續階段功能提前併入本階段。

---

# 二、完成內容

| 項目 | 結果 | 相關檔案 |
| --- | --- | --- |
| 第一關集中設定 | 完成 | `js/config.js` |
| 第一關語意組裝 | 完成 | `js/data/levels.js` |
| Level 與 TrackSection schema | 完成 | `js/data/schemas.js` |
| 通用 LevelManager | 完成 | `js/core/LevelManager.js` |
| 正式 VesselTrack | 完成 | `js/world/VesselTrack.js` |
| 變徑與頂點色漸變 | 完成 | `js/world/TrackSection.js` |
| 遊戲入口與動態 Location | 完成 | `js/core/Game.js`、`index.html` |
| Phase 02 共用測試 | 完成 | `tests/unit/levelManager.test.js` 等 |

---

# 三、實際測試環境

| 項目 | 內容 |
| --- | --- |
| 作業系統 | Microsoft Windows 10 教育版 10.0.19045 |
| 瀏覽器與版本 | Google Chrome 150.0.7871.115、Codex In-app Browser |
| 畫面解析度 | 1280 x 720、1920 x 1080 |
| Three.js 版本 | r184 |
| Node.js | v24.15.0 |
| 本機啟動方式 | `python -m http.server 8123 --bind 127.0.0.1` |
| 測試網址 | `http://127.0.0.1:8123/`、`/tests/unit-test.html` |

---

# 四、自動測試

| 測試命令或頁面 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- |
| Phase 01 基準 `npm test` | 51／51 | 51 passed、0 failed | PASS |
| Phase 02 `npm test` | 全部通過 | 60 passed、0 failed | PASS |
| 共用瀏覽器測試頁 | 與 Node 同套件 | 60 passed、0 failed | PASS |
| 全部 JavaScript `node --check` | 無語法錯誤 | 全部通過 | PASS |
| BP 100 完整路線模擬 | 300 秒抵達 3000 | 抵達 3000、`atEnd=true` | PASS |
| 後續關卡範圍檢查 | 只建立 Level 1 | `LEVELS.length === 1`，2～4 控制點空白 | PASS |
| GitHub Actions run 29335666205 | Linux 測試、建置及部署通過 | 60／60，build／deploy success | PASS |

重要數值證據：

- Canonical track length：3000。
- Catmull-Rom 實際取樣長度：2938.23，差異約 2.1％。
- 控制點：19；平行傳輸快取：4097。
- 區段：8，完整覆蓋 0～3000 且無缺口。
- Gas Trigger 距離：1770、1980、2085，均位於 1650～2100 的腹部及下肢微血管網。
- SVG 映射：同一路徑 ID 下由 0 連續映射至 1。

---

# 五、手動驗收

| 驗收項目 | 操作步驟 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- | --- |
| Phase 02 啟動畫面 | 以 HTTP 載入遊戲 | P02、第一關文字、左心室起點 | 顯示正確 | PASS |
| 正式第一關場景 | 檢查 root diagnostics 與畫面 | Level 1、8 sections、3000 長度 | `currentLevel=1`、`trackSections=8`、`trackEnd=3000` | PASS |
| 前景實際駕駛 | Chrome 成功 Pointer Lock 後持續前進 | 距離與 Location 連續更新 | 實際到達 964.3，依序顯示左心室、主動脈、主動脈分支（腹部及下肢） | PASS |
| 小地圖預留進度 | 駕駛時讀取 diagnostics | 與距離同步連續增加 | 由 0 持續增加，最終診斷精度四位 | PASS |
| 1280 x 720 | 設定 viewport 並載入 | 無遊戲頁溢位 | X／Y 均 0 | PASS |
| 1920 x 1080 | 設定 viewport 並進入 PLAYING | 無溢位且至少 30 FPS | X／Y 均 0，59～60 FPS | PASS |
| 程序化畫面 | 目視檢查血管、流向與 cockpit | 無外部資產且清楚可辨 | 管壁、流向紋理及 RBC cockpit 正常 | PASS |
| Console | 讀取遊戲與測試頁 warning／error | 0 | 0 | PASS |
| GitHub Pages | 載入正式網址與測試頁 | P02 資產、第一關及測試可用 | HTTP 200、正式 diagnostics 正確、線上 60／60 | PASS |

Chrome 自動化後端無法穩定維持五分鐘 Pointer Lock；兩次全程前景嘗試在請求時被拒絕並正確停於 PAUSED。完整終點改由同一共用瀏覽器套件執行實際 `PlayerRBC`、`VesselTrack` 與 `LevelManager` 300 秒模擬，並保留前景實際駕駛至前三個區段的視覺證據。

---

# 六、發現的錯誤

| ID | 嚴重度 | 現象 | 重現步驟 | 原因 |
| --- | --- | --- | --- | --- |
| PERF-02-001 | P1 | 1920 x 1080 PLAYING 僅約 26 FPS | 原始 Phase 02 網格進入主動脈並讀取 FPS | 3000 單位網格密度及原生像素填充成本過高 |
| DIAG-02-002 | P2 | SVG 進度診斷只顯示一位小數 | 駕駛並讀取 `data-minimap-progress` | 誤用距離顯示精度 |

---

# 七、修正內容

| Bug ID | 修正方式 | 修改檔案 | 回歸風險 |
| --- | --- | --- | --- |
| PERF-02-001 | 縱向網格密度由 0.42 降為 0.24；加入 0.75 內部渲染比例 | `js/config.js`、`js/core/Game.js` | 管壁曲線可能產生稜角或畫面變軟 |
| DIAG-02-002 | 新增獨立四位小地圖進度精度 | `js/config.js`、`js/core/Game.js` | 僅 diagnostics 字串格式 |

---

# 八、修正後重測

| Bug ID | 原測試結果 | 重測結果 | 是否關閉 |
| --- | --- | --- | --- |
| PERF-02-001 | 1920 x 1080 約 26 FPS | 1920 x 1080 PLAYING 59～60 FPS；畫面目視正常 | 是 |
| DIAG-02-002 | `0.0`、`0.1` 粗粒度 | 四位連續進度；60／60 回歸 PASS | 是 |

---

# 九、數值與效能證據

| 指標 | 目標 | 實測 | 結果 |
| --- | --- | --- | --- |
| 1920 x 1080 FPS | 最低 30、目標接近 60 | 59～60 PLAYING | PASS |
| 1920 x 1080 畫布 | CSS 尺寸完整 | client 1920 x 1080、buffer 1440 x 810 | PASS |
| 第一關基準時間 | BP 100 為 300 秒，誤差 <= 1％ | 300 秒抵達 3000 | PASS |
| 路線資料 | 8 段連續覆蓋 3000 | 8 段、0 缺口 | PASS |
| 活躍實體數 | 本階段不適用 | 尚未實作實體 | 不適用 |
| 長時間記憶體趨勢 | Phase 10 | 本階段未執行長壓 | 不適用 |

---

# 十、變更清單

- 新增：`tests/unit/levelManager.test.js`、`tests/phase-02-manual-test-checklist.md`、本報告。
- 修改：第一關設定、Level 組裝、schema、LevelManager、VesselTrack、TrackSection、Game、入口頁與共用測試執行器。
- 刪除：Phase 01 原型專用路線設定；未刪除歷史報告。
- 本階段實作提交：`bbfb7ba`（`feat: complete phase 2 level one vessel`）。
- Pages 工作流程：`29335666205`，build 與 deploy 均 success。

---

# 十一、殘餘風險

- 自動化 Chrome 無法穩定維持五分鐘 Pointer Lock；完整終點由共用瀏覽器模擬覆蓋，前景已實際覆蓋前三個區段。一般桌面 Pointer Lock 契約已於 Phase 01 由使用者驗收。
- 實際 SVG 循環圖與玩家亮點屬 Phase 03，本階段只提供路徑 ID 與連續映射資料。
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

本階段授權內容、自動測試、可執行的前景驗收、效能修正、GitHub Pages 部署與線上回歸均已完成。

**最終結果：** PASS
**是否允許進入下一階段：** 是
