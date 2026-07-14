# RBC Racer 階段結果報告

**階段：** Phase 04 - 物件與碰撞  
**報告日期：** 2026-07-14  
**總案版本：** 2.3  
**執行者：** Codex  
**結果：** PASS

---

# 一、本階段範圍

## 已授權實作

- 完成 `ProceduralAssetFactory`，程序化產生 C、B12、Fe²⁺、CO、瘧原蟲、C₂H₅OH 及 Wound。
- 使用 CanvasTexture、Sprite 與 InstancedMesh 產生精確標示及批次模型。
- 建立資料驅動的 `EntityManager`、關卡 seed 排程、公平性規則、產生／回收與物件池。
- 建立掃掠縱向碰撞、橫截面圓形碰撞及同幀固定優先序。
- 建立 Score／HP 結算、酒精計數、Wound 直接致命契約與瘧原蟲基礎頭罩觸發。
- 整合第一關 runtime、HUD 訊息、特殊狀態倒數及 `data-*` 診斷。

## 明確排除

- Phase 05 的 Wound 機率公式與自動產生；本階段只完成模型、容量、閃避計數及致命碰撞契約。
- Phase 06 的 Gas QTE、失敗通過與關卡完成。
- Phase 07 的酒精操控減益與瘧原蟲連續頭罩擺動；本階段只套用一般 Score／HP 減益及靜態 5 秒頭罩。
- 第二至第四關、過場、低血壓停滯、Game Over、重試、結局與勝利流程。

未將後續階段功能提前併入。

---

# 二、完成內容

| 項目 | 結果 | 相關檔案 |
| --- | --- | --- |
| 七類實體語意與數值 | 完成 | `js/data/entityTypes.js`、`js/config.js` |
| 程序化模型與精確標示 | 完成 | `js/world/ProceduralAssetFactory.js` |
| 固定 seed 排程與公平性 | 完成 | `js/systems/EntityManager.js` |
| InstancedMesh 批次與物件池 | 完成 | `js/systems/EntityManager.js`、`js/world/ProceduralAssetFactory.js` |
| 掃掠碰撞與穩定優先序 | 完成 | `js/systems/CollisionSystem.js` |
| Score／HP 結算與邊界 | 完成 | `js/systems/ScoreSystem.js` |
| 瘧原蟲 5 秒絕對期限頭罩 | 完成 | `js/player/HoodController.js` |
| 第一關 runtime／HUD／診斷整合 | 完成 | `js/core/Game.js`、`js/ui/HUDManager.js`、`index.html` |
| Phase 04 共用測試 | 完成 | `tests/unit/*entity*`、`tests/unit/collision.test.js`、`tests/unit/proceduralAssets.test.js` |

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
| Phase 03 基準 `npm test` | 78／78 | 78 passed、0 failed | PASS |
| Phase 04 `npm test` | 全部通過 | 101 passed、0 failed | PASS |
| 本機共用瀏覽器測試頁 | 與 Node 同套件 | 101 passed、0 failed | PASS |
| 57 個 JS／MJS `node --check` | 無語法錯誤 | 全部通過 | PASS |
| `git diff --check` | 無空白錯誤 | 通過 | PASS |
| GitHub Actions run 29343722936 | Linux 測試與 Pages 部署成功 | build／deploy success | PASS |
| GitHub Pages 線上測試頁 | 101／101 | 101 passed、0 failed | PASS |

重要覆蓋：

- 七類模型、Unicode 標示、InstancedMesh 批次與瘧原蟲無標籤外觀。
- 相同 seed 排程、8～16 間距、保留區、均勻面積偏移、連續減益上限。
- 24 個一般實體與 2 個 Wound 容量、物件池身分重用、Wound 閃避計數。
- 高速掃掠防穿透、橫向未命中、Wound／減益／HP／增益優先序與穩定 ID 次序。
- HP 上下界、酒精計數、Wound 不先扣 HP、瘧原蟲重複命中刷新 5 秒期限。

---

# 五、手動驗收

| 驗收項目 | 操作步驟 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- | --- |
| P04 入口 | 以 HTTP 載入遊戲 | P04 與物件說明 | `P04`、`04`、`血流物件上線` | PASS |
| WebGL 實體建置 | 讀取 root diagnostics | r184、7 批次、固定 seed 排程 | r184、7 batches、249 slots、3 active | PASS |
| 程序化資產 | 在瀏覽器共用測試實際建構模型 | 全部 InstancedMesh／CanvasTexture | 7 類全部通過 | PASS |
| 碰撞及效果 | 在瀏覽器共用測試執行掃掠與同幀案例 | 命中、未命中、優先序與數值正確 | 全部通過 | PASS |
| Wound 契約 | 同幀放置 Wound、瘧原蟲與增益 | Wound 先結算、Score -200、HP 不變 | 實際值 -200／0，其餘未消耗 | PASS |
| 瘧原蟲頭罩 | 觸發、刷新、以絕對時間更新 | 5 秒後還原，重複命中延後 | 6000 ms 到期，刷新為 8000 ms | PASS |
| 暫停時絕對計時 | 觸發 Pointer Lock 拒絕後等待 | 世界不動、時鐘繼續 | 距離維持 0.0，16.3 增至 17.5 秒 | PASS |
| 1280 x 720 | 量測 viewport／scroll | 無溢位 | 1280 x 720，scroll 相同 | PASS |
| 1920 x 1080 | 量測七個 HUD／overlay 區塊 | 無溢位，全數在 viewport 內 | outside `[]`，scroll 1920 x 1080 | PASS |
| 390 x 844 | 量測行動版 overlay 與水平 scroll | 無水平溢位 | scroll 390 x 844，overlay inside | PASS |
| Console | 讀取本機與正式遊戲／測試頁 | warning／error 為 0 | 全部為 0 | PASS |
| GitHub Pages | 載入正式遊戲與測試頁 | P04、r184、101／101 | 符合 | PASS |

In-app Browser 拒絕 Pointer Lock，應用正確進入 PAUSED，並保持絕對計時繼續。碰撞、物件池與頭罩效果以相同 ES Modules 在真實瀏覽器共用測試頁執行。

---

# 六、發現的錯誤

| ID | 嚴重度 | 現象 | 重現步驟 | 原因 |
| --- | --- | --- | --- | --- |
| BALANCE-04-001 | P1 | 第四關酒精權重會少套用獨立 x2 | 建立第四關權重表 | 酒精語意少了 `weightMultiplierKey` |
| PERF-04-002 | P2 | 無碰撞時每幀仍同步兩次實體批次 | 審查 Game update 與 `recycleConsumed` | 回收數為 0 仍無條件同步 |
| CONTRACT-04-003 | P2 | `minimumGap` 已設定但未阻擋錯誤產生區間 | 注入小於 minimum gap 的設定 | 建構子缺少設定關係驗證 |
| CACHE-04-004 | P2 | 初次本機入口仍顯示 P03 文案 | 在 Phase 03 快取後載入新版 | HTML／ES Module query token 尚未更新 |

---

# 七、修正內容

| Bug ID | 修正方式 | 修改檔案 | 回歸風險 |
| --- | --- | --- | --- |
| BALANCE-04-001 | 新增 `weightMultiplierKey: "alcohol"`，驗證第四關權重為 80 | `js/data/entityTypes.js`、`tests/unit/entityManager.test.js` | 後續關卡權重會正確套用兩個乘數 |
| PERF-04-002 | 只在實際回收數大於 0 時進行第二次批次同步 | `js/systems/EntityManager.js` | 碰撞幀仍會即時移除模型 |
| CONTRACT-04-003 | 建構時拒絕 `spawnIntervalMin < minimumGap` 並新增測試 | `js/systems/EntityManager.js`、`tests/unit/entityManager.test.js` | 無效自訂設定會提早失敗 |
| CACHE-04-004 | 入口、runtime、HUD 及測試頁統一 Phase 04 query token 與 P04 文案 | `index.html`、`js/main.js`、`js/core/Game.js`、tests | 只改變快取識別 |

---

# 八、修正後重測

| Bug ID | 原測試結果 | 重測結果 | 是否關閉 |
| --- | --- | --- | --- |
| BALANCE-04-001 | 權重契約不完整 | alcohol weight 80，101／101 | 是 |
| PERF-04-002 | 無碰撞仍額外同步 | 720p 正式站 60 FPS，draw calls 16 | 是 |
| CONTRACT-04-003 | 無效區間可進入 runtime | 專用測試拋出 RangeError | 是 |
| CACHE-04-004 | P03 | 本機與正式站均為 P04 | 是 |

---

# 九、數值與效能證據

| 指標 | 目標 | 實測 | 結果 |
| --- | --- | --- | --- |
| 1280 x 720 FPS | 最低 30、目標接近 60 | 本機 61、正式站 60 | PASS |
| 實體批次 | 7 類 | 7 | PASS |
| Level 1 固定 seed 排程 | 可重現 | 249 slots，兩個 manager 完全相同 | PASS |
| 一般活躍實體 | 不超過 24 | 容量測試 24，超過者拒絕 | PASS |
| Wound 活躍實體 | 不超過 2 | 容量測試 2，超過者拒絕 | PASS |
| 起始場景 | 正常建置 | 3 active、16 draw calls、14462 triangles | PASS |
| GPU 資源診斷 | 固定批次資源 | 33 geometries、4 textures | PASS |
| 物件池 | 回收後重用 | 同一 object identity 被重用 | PASS |
| 長時間記憶體趨勢 | Phase 10 壓測 | 本階段未執行長時間 profile | 不適用 |

---

# 十、變更清單

- 新增：`tests/unit/entityTypes.test.js`、`tests/unit/proceduralAssets.test.js`、`tests/unit/entityManager.test.js`、`tests/unit/collision.test.js`、Phase 04 手動清單與本報告。
- 完成：`js/data/entityTypes.js`、`js/world/ProceduralAssetFactory.js`、`js/systems/EntityManager.js`、`js/systems/CollisionSystem.js`、`js/systems/ScoreSystem.js`。
- 修改：集中設定、Game／Player／Hood／HUD 整合、入口、共用測試執行器、README 與 Pages 工作流程名稱。
- 本階段實作提交：`06758bac759447aed836243e72e2804c50d3ce75`。
- Pages 工作流程：`29343722936`，build 與 deploy 均 success。

---

# 十一、殘餘風險

- In-app Browser 無法取得 Pointer Lock；拒絕路徑已實測正確暫停且計時繼續，完整前景駕駛回歸保留在 Phase 03 成功證據。
- Wound 尚不會自動產生，這是 Phase 04 的刻意邊界；Phase 05 才會依 BP 公式產生。
- 瘧原蟲目前為靜態掀蓋並以絕對期限還原；連續擺動及酒精操控減益屬 Phase 07。
- GitHub Pages 官方 actions 回報 Node.js 20 淘汰預告，但 GitHub runner 已以 Node.js 24 執行且 build／deploy 成功；後續依官方 action 新版更新。
- Chrome、Edge、Firefox 長時間記憶體與多瀏覽器壓測屬 Phase 10。

---

# 十二、階段結論

- [x] 本階段授權功能已實作。
- [x] Node 與真實瀏覽器自動測試全部通過。
- [x] 720p、1080p 與行動版手動驗收已通過。
- [x] 本階段發現的錯誤已修正並完成回歸。
- [x] 未提前實作後續階段功能。
- [x] GitHub Actions、GitHub Pages 與線上 101 項測試已通過。
- [x] 本報告內容與實際結果一致。

本階段授權內容、自動測試、瀏覽器驗收、效能診斷、Pages 部署及線上回歸均已完成。

**最終結果：** PASS  
**是否允許進入下一階段：** 是
