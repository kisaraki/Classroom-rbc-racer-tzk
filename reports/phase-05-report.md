# RBC Racer 階段結果報告

**階段：** Phase 05 - 血壓機制與血管環境反光
**報告日期：** 2026-07-14
**總案版本：** 2.3
**執行者：** Codex
**結果：** PASS

---

# 一、本階段範圍

## 已授權實作

- 以真實時鐘每秒一次檢查高血壓 Wound 與低血壓停滯，不以 render frame 當機率單位。
- 實作第一至第三關高血壓公式、第四關安全 BP 公式與高 BP x3 倍率／45% 上限。
- 實作 Wound 前方安全產生、兩個上限、45 單位間距及 Gas／終點／一般實體保留區。
- 實作 BP 低於 80 的機率、五秒 `LOW_BP_STASIS`、十秒冷卻及暫停期間絕對期限。
- 停滯期間凍結世界模擬，保留 renderer、HUD、真實時鐘及 Z 升壓；X 完全無效。
- 依玩家所在血管的程序化漸層色，平滑調整 RBC 車身與 cockpit 的微弱色彩／emissive 反光。
- 整合 HUD 警告、狀態倒數、`data-*` 診斷及共用 Node／瀏覽器測試。

## 明確排除

- Phase 06 的 Gas QTE、失敗通過、關卡完成與垂直切片。
- Phase 07 的完整酒精操控減益與瘧原蟲連續頭罩擺動。
- 可遊玩的第二至第四關、過場、Game Over、重試、結局與勝利流程。
- Phase 10 的長時間效能／記憶體壓測及多瀏覽器完整矩陣。

第四關只完成資料驅動的 BP 公式契約與測試，未提前註冊為可玩關卡。

---

# 二、完成內容

| 項目 | 結果 | 相關檔案 |
| --- | --- | --- |
| 每秒 BP 危害排程器 | 完成 | `js/systems/BloodPressureSystem.js` |
| 高 BP Wound 公式／第四關倍率 | 完成 | `js/systems/BloodPressureSystem.js`、`js/config.js` |
| 低 BP 停滯／冷卻期限 | 完成 | `js/systems/BloodPressureSystem.js`、`js/core/GameStateMachine.js` |
| Z-only 停滯升壓 | 完成 | `js/input/InputController.js`、`js/core/Game.js` |
| Wound 安全前置產生 | 完成 | `js/systems/EntityManager.js` |
| 血管局部色彩取樣 | 完成 | `js/world/TrackSection.js`、`js/world/VesselTrack.js` |
| RBC 平滑環境反光 | 完成 | `js/player/PlayerRBC.js`、`js/config.js` |
| runtime／HUD／診斷整合 | 完成 | `js/core/Game.js`、`js/ui/HUDManager.js`、`css/hud.css` |
| Phase 05 共用測試 | 完成 | `tests/unit/bloodPressureHazards.test.js` 及既有回歸套件 |

---

# 三、實際測試環境

| 項目 | 內容 |
| --- | --- |
| 作業系統 | Microsoft Windows 10 教育版 10.0.19045 |
| 瀏覽器 | Codex In-app Browser（Chromium runtime） |
| 畫面解析度 | 1280 x 720、1920 x 1080、390 x 844 |
| Three.js 版本 | r184 |
| Node.js | v24.15.0 |
| 本機啟動方式 | `python -m http.server 4173 --bind 127.0.0.1` |
| 本機網址 | `http://127.0.0.1:4173/`、`/tests/unit-test.html` |
| 正式網址 | `https://kisaraki.github.io/Classroom-rbc-racer-tzk/` |

---

# 四、自動測試

| 測試命令或頁面 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- |
| Phase 04 修正後基準 `npm test` | 109／109 | 109 passed、0 failed | PASS |
| Phase 05 `npm test` | 全部通過 | 125 passed、0 failed | PASS |
| 本機共用瀏覽器測試頁 | 與 Node 同套件 | 125 passed、0 failed | PASS |
| 62 個 JS／MJS `node --check` | 無語法錯誤 | 全部通過 | PASS |
| `git diff --check` | 無空白錯誤 | 通過 | PASS |
| GitHub Actions run 29349318087 | Linux 測試與 Pages 部署成功 | build／deploy success | PASS |
| GitHub Pages 線上測試頁 | 125／125 | 125 passed、0 failed | PASS |

重要覆蓋：

- 低 BP 邊界表：80、79、75、70、66，以及 35% 上限。
- 第一至第三關安全 BP 抑制、第四關 BP 130 的 0.5%、高 BP x3 及 45% 上限。
- 每秒一次、非逐幀、暫停不補抽的排程語意。
- 五秒停滯、十秒後續冷卻、暫停中到期與恢復目標。
- Z-only 輸入，包括同時按住 Z/X 時 X 不得抵銷 Z。
- Wound 35～70 單位反應距離、上限、間距、保留區、橫截面範圍與固定 seed。
- 動脈／靜脈血管色取樣、RBC body/cockpit 色差、emissive 差異及平滑響應。
- 全部 Phase 00～04 回歸，包括行動裝置拒絕、程序化模型、碰撞與 HUD。

---

# 五、手動驗收

| 驗收項目 | 操作步驟 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- | --- |
| P05 入口 | 以 HTTP 載入遊戲 | P05 與血壓／反光說明 | `P05`、`05`、`血壓風險上線` | PASS |
| WebGL 場景 | 讀取 root diagnostics | r184、場景正常建置 | r184、8 sections、16 draw calls | PASS |
| BP 排程初始狀態 | READY 等待數秒 | 未 PLAYING 不抽危害 | check count 0、兩種 chance 0 | PASS |
| 高／低 BP 契約 | 在真實瀏覽器共用測試建構系統 | 邊界、倍率、期限皆正確 | 專用案例全部通過 | PASS |
| Wound 安全產生 | 在真實瀏覽器以固定 seed 產生 | 前方且避開保留區 | 距離、間距、半徑全部通過 | PASS |
| 停滯狀態機 | 進入、暫停、到期、恢復 | 世界凍結且恢復 PLAYING | 專用狀態案例全部通過 | PASS |
| Z/X 邊界 | 同時設為 pressed | Z 生效、X 不抵銷 | raise-only axis 1 | PASS |
| 血管環境反光 | 取樣動脈與靜脈並更新材質 | 色彩不同且平滑 | body／emissive 均產生可測差異 | PASS |
| 正式站反光診斷 | 讀取第一關起點 diagnostics | enabled 且為細微混色 | `#ff3347` → body `#d4222f`、cockpit `#d62230` | PASS |
| 暫停時真實計時 | Pointer Lock 被拒後等待 | 世界不動、時鐘繼續 | 距離 0.0，0.8 增至 2.1 秒 | PASS |
| 1280 x 720 | 量測 viewport／scroll | 無溢位 | scroll 1280 x 720 | PASS |
| 1920 x 1080 | 量測文件尺寸 | 無溢位 | scroll 1920 x 1080 | PASS |
| 390 x 844 | 量測窄桌面 HUD 與水平 scroll | 無水平溢位 | scroll 390 x 844，主要區塊保留 | PASS |
| Console | 讀取本機與正式遊戲／測試頁 | warning／error 為 0 | 全部為 0 | PASS |
| GitHub Pages | 載入正式遊戲與測試頁 | P05、r184、125／125 | 符合 | PASS |

In-app Browser 拒絕 Pointer Lock，應用正確進入 PAUSED，並保持真實時鐘繼續。高／低 BP、Wound 產生及反光轉換以與正式 runtime 相同的 ES Modules 在真實 Chromium 共用測試頁執行。

---

# 六、發現的錯誤

| ID | 嚴重度 | 現象 | 重現步驟 | 原因 |
| --- | --- | --- | --- | --- |
| MODULE-05-001 | P2 | 首次合併套件為 123 passed／1 failed | 執行初版 Phase 05 `npm test` | P03 與 P05 query token 混用，使同名 ES Module 成為不同實例 |
| INPUT-05-002 | P2 | 停滯時同按 Z/X 不會升壓 | 將 Z、X 同時設為 pressed | runtime 使用一般 `Z - X` 合併軸，X 仍能抵銷 Z |
| CACHE-05-003 | P2 | 修正後 Node 為 125，但既有 Chromium 顯示 124 | 不清快取重開測試頁 | 修改後的輸入模組／測試仍沿用舊 URL，被 ES Module cache 重用 |

---

# 七、修正內容

| Bug ID | 修正方式 | 修改檔案 | 回歸風險 |
| --- | --- | --- | --- |
| MODULE-05-001 | runtime 與共用測試依賴統一使用 Phase 05 query token | `index.html`、`js/**/*.js`、`tests/**/*` | 避免不同版本 config／class 並存 |
| INPUT-05-002 | 新增獨立 `getBloodPressureRaiseAxis()`；停滯只讀 KeyZ | `js/input/InputController.js`、`js/core/Game.js` | 一般 PLAYING 的 Z/X 合併軸維持不變 |
| CACHE-05-003 | 提升受影響入口鏈為 `phase05-bp-reflection-r2` | `index.html`、`js/main.js`、`tests/unit-test.html` 等 | 只建立新版模組 URL，不改變行為 |

---

# 八、修正後重測

| Bug ID | 原測試結果 | 重測結果 | 是否關閉 |
| --- | --- | --- | --- |
| MODULE-05-001 | 123／124 | 修正當時 124／124；最終 125／125 | 是 |
| INPUT-05-002 | Z/X 同按為 0 | raise-only axis 為 1；Node 125／125 | 是 |
| CACHE-05-003 | 瀏覽器 124／124（舊套件） | 瀏覽器載入新案例且 125／125 | 是 |

---

# 九、數值與效能證據

| 指標 | 目標／契約 | 實測 | 結果 |
| --- | --- | --- | --- |
| BP 危害頻率 | PLAYING 每秒一次 | 0、999、1000、1001 ms 僅 1000 ms 檢查 | PASS |
| 低 BP 機率 | 79=2.5%、75=12.5%、70=25%、<=66=35% | 全部精確符合 | PASS |
| 低 BP 期限 | 停滯 5 秒 + 後續冷卻 10 秒 | 1000 ms 觸發；6000／16000 ms 到期 | PASS |
| Wound 位置 | 前方 35～70、最大 2、間距 45 | 固定 seed 產生及拒絕案例皆通過 | PASS |
| RBC body 色彩混合 | local vessel color 的 10% | 測得比例 0.1 | PASS |
| Cockpit 色彩混合 | local vessel color 的 13% | 動脈／靜脈差異通過 | PASS |
| 反光響應 | 每秒 3.6 指數平滑 | delta 0 不跳色、正 delta 漸變 | PASS |
| 1280 x 720 FPS | 最低 30、目標接近 60 | 本機／正式站 60 | PASS |
| 起始場景 | 不增加額外模型批次 | 16 draw calls、14,462 triangles | PASS |
| GPU 資源診斷 | 維持程序化資源 | 33 geometries、4 textures | PASS |

---

# 十、變更清單

- 新增：`tests/unit/bloodPressureHazards.test.js`、`tests/phase-05-manual-test-checklist.md`、本報告。
- 完成：`BloodPressureHazardSystem`、`LOW_BP_STASIS`、Wound 安全產生與停滯期限整合。
- 修改：PlayerRBC／TrackSection／VesselTrack 反光取樣、HUD／CSS／診斷、輸入、入口與共用測試。
- 所有 Phase 05 新數值集中於 `js/config.js`，四關公式仍由 level id／config 資料驅動。
- 本階段實作提交：`2835cafc37028f97cb51c69df762da389f29dd58`。
- Pages 工作流程：`29349318087`，build 與 deploy 均 success。

---

# 十一、殘餘風險

- In-app Browser 無法取得 Pointer Lock；拒絕路徑、PAUSED 與真實計時已實測，完整前景駕駛沿用 Phase 03 的成功證據。
- 目前只有第一關可玩；第四關公式已測試，但第四關 runtime 整合需等該關正式建置。
- Wound 致命碰撞契約已存在，但完整 Game Over／重試／結局顯示屬後續階段。
- 反光是程序化材質色與 emissive 模擬，不是物理環境貼圖；此設計符合無外部資產與「微微反射」需求。
- Chrome、Edge、Firefox 長時間記憶體與多瀏覽器壓測屬 Phase 10。

---

# 十二、階段結論

- [x] 本階段授權功能已實作。
- [x] Node 與真實瀏覽器自動測試全部通過。
- [x] 720p、1080p 與 390 x 844 窄桌面驗收已通過。
- [x] 本階段發現的錯誤已修正並完成回歸。
- [x] 未提前實作後續階段功能。
- [x] GitHub Actions、GitHub Pages 與線上 125 項測試已通過。
- [x] 本報告內容與實際結果一致。

本階段授權內容、環境反光、自動測試、瀏覽器驗收、效能診斷、Pages 部署及線上回歸均已完成。

**最終結果：** PASS
**是否允許進入下一階段：** 是
