# RBC Racer 階段結果報告

**階段：** Phase 01 - 3D 駕駛原型  
**報告日期：** 2026-07-14  
**總案版本：** 2.3  
**執行者：** Codex  
**結果：** BLOCKED

---

# 一、本階段範圍

## 已授權實作

- Three.js Scene、WebGLRenderer、PerspectiveCamera、燈光、fog 與 resize。
- 一條 `CatmullRomCurve3` 測試血管，由多段 `TubeGeometry` 組成。
- 全管共用的中心點、切線與平行傳輸框架快取。
- `PlayerRBC`、雙凹紅血球車體、第一人稱車頭、RBC 字樣與獨立引擎蓋。
- 方向鍵局部截面移動、圓形邊界、Z／X 血壓與速度公式。
- Pointer Lock 請求、滑鼠 yaw／pitch 及 pitch clamp。
- HP、BP、Score、Location 基本 HUD 及距離／速度／絕對計時診斷。
- PLAYING／PAUSED 原型狀態與「世界停止、Renderer／HUD／GameClock 繼續」契約。

## 明確排除

- 正式關卡、`LevelManager`、關卡完成與小地圖資料。
- 一般實體、生成、物件池、碰撞與傷害結算。
- QTE、低血壓停滯、酒精、瘧原蟲與 Wound 玩法。
- 過場、Game Over、重試、結局與勝利流程。

後續階段模組維持空白預留，未提前實作。

---

# 二、完成內容

| 項目 | 結果 | 相關檔案 |
| --- | --- | --- |
| 場景、Renderer、Camera、resize 與燈光 | 完成 | `js/core/Game.js` |
| RAF、絕對期限與暫停模擬 delta | 完成 | `js/core/GameLoop.js`、`js/core/GameSession.js`、`js/core/GameStateMachine.js` |
| 六段測試血管 | 完成 | `js/world/VesselTrack.js`、`js/world/TrackSection.js` |
| 平行傳輸框架共用 | 完成 | `js/world/VesselTrack.js`、`js/world/TrackSection.js` |
| 程序化血流紋理 | 完成 | `js/world/VesselTrack.js` |
| RBC 玩家與第一人稱車頭 | 完成 | `js/player/PlayerRBC.js` |
| 程序化 RBC 點陣字樣與獨立引擎蓋 | 完成 | `js/player/HoodController.js` |
| 鍵盤與滑鼠視角隔離 | 完成 | `js/input/InputController.js`、`js/input/CameraController.js` |
| Pointer Lock 原生 API、錯誤診斷與事件去重 | 完成 | `js/input/PointerLockController.js`、`js/core/Game.js` |
| BP、速度與截面邊界 | 完成 | `js/systems/BloodPressureSystem.js`、`js/world/TrackMath.js` |
| 基本 HUD 與啟動／暫停介面 | 完成 | `js/ui/HUDManager.js`、`index.html`、`css/` |
| Phase 01 共用測試 | 完成 | `tests/unit/`、`tests/unit-test.html` |
| Pointer Lock 成功路徑實際驗收 | 未完成 | 自動化瀏覽器拒絕滑鼠捕捉 |

---

# 三、實際測試環境

| 項目 | 內容 |
| --- | --- |
| 作業系統 | Microsoft Windows 10 教育版 10.0.19045 build 19045 |
| Node.js／npm | Node v24.15.0／npm 11.5.2 |
| Python 靜態伺服器 | Python 3.14.4 `http.server` |
| 瀏覽器 | Google Chrome 150.0.7871.115；Codex In-app Browser（後端版本未公開） |
| 畫面解析度 | 1280 x 720、1920 x 1080、390 x 844 |
| Three.js 版本 | r184／0.184.0 |
| 根目錄網址 | `http://127.0.0.1:41732/` |
| GitHub Pages 子路徑模擬 | `http://127.0.0.1:41733/rbc-racer/` |

---

# 四、自動測試

| 測試命令或頁面 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- |
| 實作前 `npm test` 回歸 | Phase 00 全過 | 24 passed、0 failed | PASS |
| 完整 `npm test` | Phase 00＋01 全過 | 50 passed、0 failed | PASS |
| Pointer Lock 流程修正後 `npm test` | 全過 | 50 passed、0 failed | PASS |
| `node --check` | 自有 JS／MJS 無語法錯誤 | 52 個 script 通過 | PASS |
| import resolution 稽核 | 所有相對 import 存在 | 52 個 script、99 筆相對 import 通過 | PASS |
| runtime 外部資源掃描 | 0 筆 | 0 筆 | PASS |
| 瀏覽器共用測試頁 | 全過 | 50 passed、0 failed | PASS |
| 子路徑測試頁 | 全過 | 50 passed、0 failed | PASS |

Node 最終輸出：

```text
RBC Racer Phase 01 unit tests
Summary: 50 passed, 0 failed, 50 total.
```

Phase 01 新增測試覆蓋：

- BP 50／80／100／130／150／180 對應 5／8／10／13／15／18 速度。
- Z／X 速率、同時按壓抵銷、BP clamp 及 WASD 排除。
- 方向鍵局部軸、斜向 normalize 與圓形邊界。
- PAUSED 模擬 delta 為 0，Renderer callback 繼續。
- `GameClock` 在模擬暫停期間依絕對時間到期。
- 六段實體 `TubeGeometry`、1,025 個正交平行傳輸框架與局部偏移。
- 程序化紋理、雙凹 RBC、RBC 字樣、獨立引擎蓋與 dispose。
- 滑鼠只變更 yaw／pitch，pitch clamp，玩家位置／速度／BP 不變。
- 首次 Pointer Lock 請求會建立絕對期限並在取得鎖定前保持 PAUSED。
- Pointer Lock 成功、釋放、Promise 拒絕、錯誤去重與不支援 API。

---

# 五、手動驗收

| 驗收項目 | 操作步驟 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- | --- |
| 啟動頁 | 以 HTTP 開啟根網址 | READY、不自動鎖定 | READY、pointer false、world update 0 | PASS |
| WebGL 場景 | 1280 x 720 等待 1.2 秒 | 血管、HUD、車頭可見 | 6 段、13,860 triangles、約 60 FPS | PASS |
| 玩家外觀 | 檢視畫面與 scene | RBC 車頭／字樣／引擎蓋 | 三者可見，hood 獨立旗標 true | PASS |
| READY 輸入隔離 | 按 ArrowRight、Z | 不移動、不變 BP | distance 0.0、BP 100、update 0 | PASS |
| Pointer Lock 請求時點 | 載入後與點擊後比較 | 僅點擊後請求 | 載入後 false；點擊才請求 | PASS |
| Pointer Lock 拒絕 | 自動化瀏覽器點擊 | PAUSED、世界停止、絕對計時與 Renderer 繼續並可重試 | `WrongDocumentError`；distance 0、simulation 0、timer 29.2→20.1、Renderer +543 幀 | PASS |
| Pointer Lock 成功 | 前景桌面瀏覽器點擊 | pointer true，進入 PLAYING | 兩個自動化 backend 均拒絕捕捉 | BLOCKED |
| Esc 暫停端對端 | 鎖定後按 Esc | 位移停止，timer／Renderer 繼續 | 無法先成功鎖定 | BLOCKED |
| 暫停契約替代證據 | 瀏覽器執行共用測試 | world update 0、render／deadline 繼續 | 50／50 通過 | PASS |
| 1280 x 720 | 設定 viewport | 無溢位 | X／Y 溢位均 0 | PASS |
| 1920 x 1080 | 設定 viewport | 無溢位 | X／Y 溢位均 0 | PASS |
| 390 x 844 | 設定窄版 | 啟動流程可讀 | 按鈕可見、X 溢位 0 | PASS |
| GitHub Pages 子路徑 | 開啟 `/rbc-racer/` | 相對資源正常 | r184、6 段、canvas 1、console 0 | PASS |

---

# 六、發現的錯誤

自動測試沒有出現 application FAIL，瀏覽器 console 也沒有 warning 或 error。

## 測試基礎設施阻斷

| ID | 嚴重度 | 現象 | 重現步驟 | 原因 |
| --- | --- | --- | --- | --- |
| INFRA-01-001 | P1 | 開始按鈕後 Pointer Lock Promise 被拒絕 | IAB 實際點擊與桌面自動化嘗試 | IAB 回傳 `WrongDocumentError`，桌面控制因無法可靠判定目前網址而依安全政策停止；兩者皆不能提供實體滑鼠捕捉證據 |

IAB 的測試文件會裁切 `document.hasFocus` 與 Pointer Lock 能力；實際
Promise 明確回傳 root document 不適用於 Pointer Lock。這是測試文件
層限制，不代表一般桌面瀏覽器會拒絕網站。

---

# 七、修正內容

| Bug ID | 修正方式 | 修改檔案 | 回歸風險 |
| --- | --- | --- | --- |
| APP-01-001 | 首次請求先建立絕對期限並停在 PAUSED；鎖定成功才恢復模擬，拒絕或釋放時保持 PAUSED | `js/core/Game.js`、`js/core/GameSession.js` | 低 |
| APP-01-002 | 封裝原生 Pointer Lock 事件、保留錯誤名稱／訊息並避免同次拒絕重複上報 | `js/input/PointerLockController.js`、`js/core/Game.js` | 低 |

另將框架參考軸 threshold、紋理中心與毫秒換算改為
`GAME_CONFIG` 命名設定，完成可調整數值集中稽核。

---

# 八、修正後重測

| 項目 | 原測試結果 | 重測結果 | 是否關閉 |
| --- | --- | --- | --- |
| 拒絕時錯留 READY、期限未建立 | READY、timer 空白 | PAUSED、timer 持續下降、simulation 0、Renderer 繼續 | 是 |
| Pointer Lock 成功／釋放事件契約 | 無獨立控制器測試 | 成功與釋放事件測試 PASS | 代碼關閉；實體捕捉仍 BLOCKED |
| 完整 Node 回歸 | 45／45 PASS | 50／50 PASS | 是 |
| 瀏覽器共用回歸 | 45／45 PASS | 50／50 PASS | 是 |
| 根路徑／子路徑回歸 | console 0 | console 0 | 是 |

---

# 九、數值與效能證據

| 指標 | 目標 | 實測 | 結果 |
| --- | --- | --- | --- |
| READY FPS | Renderer 持續運作 | 約 60 FPS（IAB 1280 x 720） | PASS |
| Renderer geometry | 單一原型血管 | 6 段／13,860 triangles | PASS |
| 框架快取 | 玩家與管壁共用 | 1,025 組，5 個位置正交誤差 <= 0.000001 | PASS |
| READY 世界更新 | 應為 0 | Renderer 827 幀時 world update 0 | PASS |
| Pointer Lock 拒絕後世界更新 | 應為 0 | Renderer 增加 543 幀、world update 增加 0 | PASS |
| Pointer Lock 拒絕後絕對計時 | 應持續 | 29.2 秒降至 20.1 秒 | PASS |
| Canvas pixel ratio | `min(devicePixelRatio, 2)` | 1280 x 720 viewport 產生 1920 x 1080 buffer | PASS |
| BP 速度 | 5／8／10／13／15／18 | 六點全數相等 | PASS |
| 正式活躍實體 | Phase 01 應為 0 | `EntityManager` 仍為空白預留 | PASS |
| 長時間記憶體趨勢 | 本階段非正式壓測 | 未執行 | 不適用 |

---

# 十、變更清單

- 新增：3D 場景、原型血管、平行傳輸框架、駕駛玩家、輸入、鏡頭、HUD、啟動／暫停介面、Pointer Lock 會話控制與 26 項 Phase 01 測試。
- 修改：`js/config.js`、BP／TrackMath、測試 runner、README、手動測試與 balance notes。
- 刪除：Phase 00 靜態狀態頁內容（以 Phase 01 駕駛原型取代）。
- Git：已加入 GitHub Pages workflow；遠端倉庫與部署證據於本報告後續重測補記。

---

# 十一、殘餘風險

- Pointer Lock 成功、鎖定後滑鼠 yaw／pitch 及 Esc 解鎖的桌面前景端對端驗收尚未取得。
- 單元／瀏覽器共用測試已驗證對應純邏輯，但不能取代上述人工滑鼠捕捉步驟。
- Chrome、Edge、Firefox 全流程多瀏覽器回歸與長時間記憶體壓測屬 Phase 10。
- 正式第一關的變徑過渡、路線語意與起訖點屬 Phase 02，本原型不代表正式關卡平衡。

---

# 十二、階段結論

- [x] 本階段授權功能已實作。
- [x] 自動測試全部通過。
- [ ] Pointer Lock 成功與 Esc 暫停的桌面前景手動驗收全部通過。
- [x] 目前可執行的瀏覽器、解析度、子路徑與 console 驗收已通過。
- [x] 未提前實作後續階段功能。
- [x] 本報告內容與實際結果一致。

依階段報告範本，手動驗收未全部完成時不得填寫 PASS。

**最終結果：** BLOCKED  
**是否允許進入下一階段：** 否
