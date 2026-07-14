# RBC Racer 階段結果報告

**階段：** Phase 00 - 技術契約與測試骨架  
**報告日期：** 2026-07-14  
**總案版本：** 2.3  
**執行者：** Codex  
**結果：** PASS

---

# 一、本階段範圍

## 已授權實作

- 建立 `rbc-racer/` 專案目錄與依職責拆分的空白模組骨架。
- 建立完整 `js/config.js`，集中目前已知遊戲數值並在執行期凍結。
- 建立不含可玩關卡的 `levels.js`／`entityTypes.js` 語意組裝骨架。
- 定義玩家、實體、關卡及 checkpoint schema 與最小 factory／validator。
- 建立可測試的 `GameClock`、`EventBus`、`SeededRandom`、距離換算及 Wound 公式。
- 保存官方 Three.js r184、MIT 授權、來源及 SHA-256。
- 建立 Node 與瀏覽器共用的無框架 ES Module 測試。
- 建立本機啟動、GitHub Pages 相對路徑及階段測試文件。

## 明確排除

- Three.js Scene、Renderer、Camera、燈光、血管及任何 3D 場景。
- 玩家駕駛、輸入、Pointer Lock、HUD、小地圖與正式選單。
- 可玩關卡、一般實體、生成、碰撞、QTE 與狀態效果。
- 過場、Game Over、勝利、重試流程與效能最佳化。
- 實際 GitHub Pages 發布；本階段只模擬專案子路徑。

未提前實作後續階段功能；狀態頁實測 canvas 數量為 0，`LEVELS.length` 為 0。

---

# 二、完成內容

| 項目 | 結果 | 相關檔案 |
| --- | --- | --- |
| 專案與空模組骨架 | 完成 | `index.html`、`css/`、`js/` |
| 集中設定 | 完成 | `js/config.js` |
| 關卡／實體資料骨架 | 完成 | `js/data/levels.js`、`js/data/entityTypes.js` |
| 四類 schema | 完成 | `js/data/schemas.js` |
| 絕對截止時間 | 完成 | `js/core/GameClock.js` |
| 事件與可重現亂數 | 完成 | `js/core/EventBus.js`、`js/utils/SeededRandom.js` |
| 距離與 Wound 純函式 | 完成 | `js/world/TrackMath.js`、`js/systems/BloodPressureSystem.js` |
| Three.js r184 本機 vendor | 完成 | `vendor/three.module.js`、`vendor/three.core.js`、`vendor/THREE-LICENSE.txt` |
| 共用測試工具與 24 項案例 | 完成 | `tests/unit/`、`tests/run-tests.mjs`、`tests/unit-test.html` |
| 本機與部署說明 | 完成 | `README.md` |

---

# 三、實際測試環境

| 項目 | 內容 |
| --- | --- |
| 作業系統 | Microsoft Windows 10 教育版 10.0.19045 build 19045 |
| PowerShell | 7.6.3 |
| Node.js／npm | Node v24.15.0／npm 11.5.2 |
| Python 靜態伺服器 | Python 3.14.4 `http.server` |
| 瀏覽器 | Codex In-app Browser；後端未公開引擎版本 |
| 實測 viewport | 預設 1280 × 720；窄版 390 × 844 |
| Three.js 版本 | r184／0.184.0 |
| 根目錄測試網址 | `http://127.0.0.1:41730/` |
| 子路徑測試網址 | `http://127.0.0.1:41731/rbc-racer/` |
| 測試後清理 | 41730、41731 兩個 Python server 均已停止 |

---

# 四、自動測試

| 測試命令或頁面 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- |
| 首輪 `npm test` | 全部通過 | 22 passed、2 failed、24 total | FAIL |
| 修正後 `npm test` | 全部通過 | 24 passed、0 failed、24 total | PASS |
| `node --check` | 自有 JS／MJS 無語法錯誤 | 全數無語法錯誤 | PASS |
| 結構與 import 稽核 | 必要檔案存在、import 可解析 | 16 個必要檔案、42 個模組均通過 | PASS |
| 執行期外部資源掃描 | 無 CDN／遠端資源 | 0 筆外部執行期參照 | PASS |
| Vendor 完整性 | 三檔符合 README 雜湊 | 三個 SHA-256 全數相符 | PASS |
| Markdown／文件一致性 | fence 平衡、附錄副本一致 | 全數相符 | PASS |
| 瀏覽器測試頁 | 與 Node 執行相同測試 | 24 passed、0 failed、24 total | PASS |

修正後 Node 重要輸出：

```text
RBC Racer Phase 00 unit tests
Summary: 24 passed, 0 failed, 24 total.
```

測試涵蓋：

- `distanceAlongTrack` 與 normalized progress 雙向換算及邊界。
- `GameClock` 絕對 deadline、暫停期間到期及非法 duration。
- 一般關卡與第四關安全／高 BP Wound 指數公式及上限。
- 相同 seed、restore seed、亂數範圍與輸入驗證。
- EventBus 訂閱、退訂與 once。
- 玩家、實體、關卡、checkpoint schema。
- 四關 section ratio、BP 100 基準速度與 300／90／180／90 秒。
- Three.js 匯出 `REVISION === "184"`。

Vendor 最終 SHA-256：

| 檔案 | SHA-256 |
| --- | --- |
| `vendor/three.module.js` | `61134198639a10885daf893fb29669ca26386e2a4cde76e8399f51e329f741f2` |
| `vendor/three.core.js` | `368dc78835287709a48939e8eb9a7a61d0732098bdf916e56840d458aae9ccf3` |
| `vendor/THREE-LICENSE.txt` | `8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc` |

---

# 五、手動驗收

| 驗收項目 | 操作步驟 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- | --- |
| 根目錄狀態頁 | 開啟 41730 根網址 | 模組正常載入 | `READY`、`r184`、4 configured、0 playable | PASS |
| 後續功能排除 | 檢查 DOM 與畫面 | 無 3D 或可玩內容 | canvas 0，只有 Phase 00 狀態 | PASS |
| 瀏覽器測試 | 點擊「開啟 Phase 00 測試」 | 相對導覽並全數通過 | 到達測試頁，24 PASS／0 FAIL | PASS |
| 返回導覽 | 點擊 `Back to phase status` | `../index.html` 正確解析 | 返回 41730 `index.html` | PASS |
| 瀏覽器 console | 讀取 warning／error | 無持續性訊息 | 0 warning、0 error | PASS |
| 1280 × 720 | 設定 viewport 並量測 | 無水平溢位 | client 1265、scroll 1265 | PASS |
| 390 × 844 | 設定窄版 viewport 並量測 | 內容維持可讀、無水平溢位 | client 375、scroll 375；單欄 breakpoint 生效 | PASS |
| 窄版測試頁 | 窄版開啟測試頁 | 無溢位且測試不變 | 24 PASS／0 FAIL；client 375、scroll 375 | PASS |
| GitHub Pages 子路徑模擬 | 由 workspace root 服務 `/rbc-racer/` | 相對資源與連結正常 | 狀態頁 READY；測試頁 24 PASS／0 FAIL | PASS |
| 外部素材 | 檢查 runtime HTML／CSS／JS | 無外部圖像、模型、影片、字型、CDN | 0 筆外部執行期參照 | PASS |

完整勾選紀錄位於 `tests/manual-test-checklist.md`。

---

# 六、發現的錯誤

| ID | 嚴重度 | 現象 | 重現步驟 | 原因 |
| --- | --- | --- | --- | --- |
| BUG-00-001 | P1 | 僅保存 r184 `three.module.js` 時無法載入 | 檢查官方檔首行或嘗試 import | r184 入口會相對匯入同目錄 `three.core.js`，原始目錄契約漏列相依檔 |
| BUG-00-002 | P2 | 首輪 Wound cap 案例失敗 | 執行首輪 `npm test` | 測試錯誤假設 BP 180 必定觸及 0.45，實際公式為 0.4204743734 |
| BUG-00-003 | P2 | 首輪關卡基準時間算成 600／180／360／180 秒 | 執行首輪 `npm test` | 測試轉錄速度公式時漏加 `movement.minSpeed` |

## 測試基礎設施事件

| ID | 現象 | 處理 | 專案影響 |
| --- | --- | --- | --- |
| INFRA-00-001 | 本機 8000 port 已由無關網站占用 | 改用 41730 與 41731 | 無 |
| INFRA-00-002 | Browser Plugin 與 Node REPL 的受保護 `process` 發生 bootstrap 相容問題 | 備份後暫時改為模組內 shim，初始化後依原 SHA-256 完整還原 | 無；外掛最終 SHA-256 與備份相同 |
| INFRA-00-003 | Browser backend 不支援 `networkidle` load state | 改用受支援的 `load`，再以 DOM 狀態與 console 驗證 | 無 |
| INFRA-00-004 | Browser read-only evaluate 隔離頁面自訂 global | 改讀 DOM 的 `data-test-status` 與 24 個結果列 | 無 |

瀏覽器頁面本身未產生 warning 或 error。

---

# 七、修正內容

| Bug ID | 修正方式 | 修改檔案 | 回歸風險 |
| --- | --- | --- | --- |
| BUG-00-001 | 加入官方同 tag `three.core.js`；README 記錄來源／雜湊；同步總案與 Phase 指令 | `vendor/three.core.js`、`README.md`、上層規格文件 | Three.js 升版時仍須重新驗證分層檔案 |
| BUG-00-002 | 由設定推導第一個超過 cap 的 BP，再驗證 clamp 為 0.45 | `tests/unit/woundChance.test.js` | 低 |
| BUG-00-003 | 測試改用總案完整速度式並套 min／max clamp | `tests/unit/schemas.test.js` | 低 |

另將 checkpoint 重試最低 HP 50 補入 `GAME_CONFIG.checkpoint.retryMinimumHp`，並同步總案與技術決策，避免後續魔術數字。

---

# 八、修正後重測

| Bug ID | 原測試結果 | 重測結果 | 是否關閉 |
| --- | --- | --- | --- |
| BUG-00-001 | 尚未執行即發現 import 缺件 | Node revision test、根網址、子路徑瀏覽器均 PASS | 是 |
| BUG-00-002 | FAIL | PASS | 是 |
| BUG-00-003 | FAIL | PASS | 是 |
| 完整回歸 | 22／24 | 24／24，另加語法、結構、integrity 與瀏覽器驗收 PASS | 是 |

所有首輪 FAIL 已於 Phase 00 內修正，沒有延後至下一階段。

---

# 九、數值與效能證據

| 指標 | 目標 | 實測 | 結果 |
| --- | --- | --- | --- |
| FPS | Phase 00 無 Renderer，不適用 | 未建立 3D 場景 | 不適用 |
| 活躍實體數 | Phase 00 必須為 0 | `LEVELS.length = 0`，canvas 0，無 EntityManager 實作 | PASS |
| 記憶體趨勢 | Phase 00 無遊戲迴圈，不適用 | 未執行長時間 3D 模擬 | 不適用 |
| 四關 BP 100 基準時間 | 300／90／180／90 秒 | 300／90／180／90 秒 | PASS |
| section ratio | 每關合計 1 | 四關均為 1 | PASS |
| L4 Wound，BP 100 | 約 0.0006766764／秒 | 0.0006766764161830634／秒 | PASS |
| L4 Wound，BP 130 | 0.005／秒 | 0.005／秒 | PASS |
| Three.js revision | r184 | r184 | PASS |

---

# 十、變更清單

- 新增：完整 `rbc-racer/` 專案骨架、集中設定、schema、核心工具、純邏輯函式、測試、vendor、README、License 與本報告。
- 修改：上層 `classroom-rbc-racer-tzk.md`、`TECHNICAL_DECISIONS.md`、`codex-devp-cmd.md`，補充 r184 `three.core.js` 相依及 checkpoint 集中設定。
- 刪除：無。
- Git：目前 workspace 不是 Git repository，因此沒有提交雜湊。

---

# 十一、殘餘風險

- 尚未實際發布 GitHub Pages；本階段只以 `/rbc-racer/` 子路徑完成等價靜態伺服器驗收。
- 尚未建立 WebGL Renderer，因此 GPU、FPS、Geometry／Material／Texture 釋放須在後續授權階段驗證。
- Chrome、Edge、Firefox 的正式多瀏覽器回歸屬 Phase 10；本階段只使用 Codex In-app Browser。
- Browser backend 未公開精確引擎版本，報告只能記錄 backend 名稱。
- 原創專案尚未選定授權；Three.js MIT 授權已獨立完整保存。

---

# 十二、階段結論

- [x] 本階段需求全部完成。
- [x] 自動測試全部通過。
- [x] 本階段手動驗收全部通過。
- [x] 已修正本階段發現的錯誤並完成完整回歸測試。
- [x] 未提前實作後續階段功能。
- [x] 本報告內容與實際結果一致。

**最終結果：** PASS  
**是否允許進入下一階段：** 是
