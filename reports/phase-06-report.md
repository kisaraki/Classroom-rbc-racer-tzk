# RBC Racer 階段結果報告

**階段：** Phase 06 - 氣體交換 QTE 與第一關垂直切片
**報告日期：** 2026-07-15
**總案版本：** 2.3
**執行者：** Codex
**結果：** PASS

---

# 一、本階段範圍

## 已授權實作

- 建立完全程序化的 Gas Token，並在第一關腹部及下肢的微血管網配置主要、重試及終點前保底觸發區。
- 實作不可側向略過的縱向 QTE 觸發、1.5 秒絕對期限、O／C 各三次門檻及按鍵自動重複排除。
- 實作 QTE 成功、第一次失敗後重試、第二次失敗後允許過關，以及 Score +10／-3。
- QTE 期間凍結世界、玩家、實體與碰撞，但 renderer、HUD、真實時鐘及所有絕對期限繼續更新。
- 成功時開啟交換後血管漸層及 RBC 環境反光；失敗時維持交換前顏色。
- 實作 `TRANSFER_CUTSCENE`、`LEVEL_COMPLETE`、Wound／HP 0 Game Over 與同 seed 本關重試。
- 形成第一關由標題畫面一路到過關或 Game Over 的端到端垂直切片。
- 在右側狀態區加入永久顯示的「KOSMOS TOOLKIT」、「探真拓知酷」及鍵盤／滑鼠操作說明。

## 明確排除

- Phase 07 的完整酒精 S 型操控減益、BP 亂跳及瘧原蟲連續頭罩擺動。
- 可遊玩的第二至第四關、跨關卡實際載入、第四關勝利及完整結局動畫。
- Phase 08 至 Phase 10 的其餘關卡資料化、整體整合及長時間效能／記憶體矩陣。

目前仍只註冊第一關；本階段的完成畫面不會提前建立第二關。

---

# 二、完成內容

| 項目 | 結果 | 相關檔案 |
| --- | --- | --- |
| Gas Token 程序化模型／標示 | 完成 | `js/world/ProceduralAssetFactory.js`、`js/config.js` |
| QTE 觸發／期限／計數／重試 | 完成 | `js/systems/QTESystem.js` |
| O、C 輸入佇列與 repeat 排除 | 完成 | `js/input/InputController.js` |
| QTE／過場／完成／Game Over 狀態 | 完成 | `js/core/GameStateMachine.js`、`js/core/GameSession.js` |
| 第一關 runtime 垂直切片 | 完成 | `js/core/Game.js` |
| 成功／失敗血管變色與 RBC 反光 | 完成 | `js/world/TrackSection.js`、`js/world/VesselTrack.js`、`js/player/PlayerRBC.js` |
| QTE／過場／完成／重試 HUD | 完成 | `js/ui/HUDManager.js`、`css/hud.css`、`css/menu.css` |
| 右側品牌與操作指引 | 完成 | `index.html`、`css/hud.css` |
| Phase 06 共用 Node／瀏覽器測試 | 完成 | `tests/unit/qte.test.js` 及既有回歸套件 |

---

# 三、實際測試環境

| 項目 | 內容 |
| --- | --- |
| 作業系統 | Microsoft Windows 10 教育版 10.0.19045 |
| 瀏覽器 | Codex In-app Browser／Chrome（Chromium runtime） |
| 畫面解析度 | 1280 x 720、1920 x 1080、390 x 844 |
| Three.js 版本 | r184 |
| Node.js | v24.15.0 |
| Python | 3.14.4 |
| 本機啟動方式 | `python -m http.server 4173 --bind 127.0.0.1` |
| 本機網址 | `http://127.0.0.1:4173/`、`/tests/unit-test.html` |
| 正式網址 | `https://kisaraki.github.io/Classroom-rbc-racer-tzk/` |

---

# 四、自動測試

| 測試命令或頁面 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- |
| Phase 05 基準 `npm test` | 125／125 | 125 passed、0 failed | PASS |
| Phase 06 `npm test` | 全部通過 | 145 passed、0 failed | PASS |
| 本機 Chromium 共用測試頁 | 與 Node 同套件 | 145 passed、0 failed | PASS |
| 63 個 JS／MJS `node --check` | 無語法錯誤 | 全部通過 | PASS |
| `git diff --check` | 無空白錯誤 | 通過 | PASS |
| GitHub Actions run 29354558593 | Phase 06 測試與 Pages 部署成功 | build／deploy success | PASS |
| GitHub Pages 線上測試頁 | 145／145 | 145 passed、0 failed | PASS |

重要覆蓋：

- 主要、重試及保底 Gas Trigger 均使用縱向穿越判定，與玩家橫向位置無關。
- O／C 可任意順序輸入，各三次即成功；未知按鍵及 `event.repeat` 不計入。
- 第一次逾時維持 `PENDING` 並提供一次重試；第二次逾時設為 `FAILED` 但允許到達終點。
- QTE 與結果顯示均使用絕對期限；PAUSED 或晚幀不延長期限。
- 成功開啟交換後漸層，失敗保留交換前顏色；重試會還原流動與氣體交換狀態。
- `TRANSFER_CUTSCENE` 在絕對三秒期限後進入 `LEVEL_COMPLETE`，即使期間暫停亦不延長。
- 同 seed 重試會還原位置、BP、輸入、實體、視角、色彩及最低 50 HP 契約。
- Wound 與 HP 0 終止世界模擬，且既有 Phase 00 至 Phase 05 回歸全部通過。

---

# 五、手動驗收

| 驗收項目 | 操作步驟 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- | --- |
| P06 入口 | 以 HTTP 載入遊戲 | 顯示 Phase 06 與 QTE 說明 | 標題、版本與第一關場景正常 | PASS |
| WebGL 場景 | 讀取 root diagnostics | r184、Gas Token 及場景正常建立 | r184、Gas Token visible、6 parts | PASS |
| 右側狀態區 | 以 1280 x 720 檢查狀態欄空白區 | 品牌與操作方式明顯且完整 | 兩個品牌、方向鍵、Z/X、O/C、滑鼠、Esc 全部可見 | PASS |
| QTE 面板 | 進入共用 runtime 垂直流程 | 顯示 O／C 計數、期限、結果與嘗試次數 | 全流程狀態及 DOM 診斷符合 | PASS |
| 兩次失敗通過 | 主要與重試 QTE 均逾時後前進 | `FAILED` 仍可進入過場與完成 | `READY -> PLAYING -> QTE x2 -> TRANSFER -> LEVEL_COMPLETE` | PASS |
| 血管變色 | 比較成功、失敗與重試路徑 | 成功變色；失敗不變；重試重設 | 三條路徑專用案例全部通過 | PASS |
| 真實計時 | Pointer Lock 被拒後等待 | 世界暫停、Real Clock 繼續 | 狀態燈持續，0.5 增至 11.8 秒 | PASS |
| 1280 x 720 | 量測 status／toolkit／scroll | 右側內容不溢位 | status bottom 670.22、toolkit bottom 657.55、字體 11.2px | PASS |
| 1920 x 1080 | 量測文件與場景 | 無溢位且 Gas Token 可見 | scroll 與 viewport 相同；Token visible | PASS |
| 390 x 844 | 使用桌面 UA 量測窄畫面 | 無水平溢位 | scroll 390 x 844 | PASS |
| 行動裝置拒絕 | 執行手機／平板 UA 共用案例 | 啟動前拒絕且不顯示控制項 | iPhone、Android、iPad 類型全部通過 | PASS |
| Console | 讀取本機與正式遊戲／測試頁 | 無應用 warning／error | 應用 warning／error 為 0 | PASS |
| GitHub Pages | 載入正式遊戲與測試頁 | Phase 06、r184、145／145 | 全部符合 | PASS |

Codex 的自動化 Chromium 工作階段會拒絕 Pointer Lock；應用正確進入 PAUSED，且真實時鐘與期限繼續。第一關完整狀態鏈以正式 runtime 相同的 ES Modules 在真實 Chromium 共用測試頁執行，前景滑鼠鎖定駕駛則沿用 Phase 03 已通過的實機證據。

---

# 六、發現的錯誤

| ID | 嚴重度 | 現象 | 重現步驟 | 原因 |
| --- | --- | --- | --- | --- |
| LAYOUT-06-001 | P2 | 低高度畫面中 Pointer Lock 錯誤標題會被裁切 | 在矮 viewport 觸發鎖定失敗 | 覆蓋選單高度未限制在可視區 |
| CACHE-06-002 | P2 | 新 QTE 測試加入後，長駐瀏覽器仍顯示舊的 144 項 | 不清除 Chromium 模組快取重新開測試頁 | Phase 05／06 query token 混用，後續新增案例仍沿用相同模組 URL |
| TIMER-06-003 | P2 | 超過 QTE 期限才執行的晚幀會延後結果消失 | 直接以晚於期限的時間更新 QTE | 結果期限誤以晚幀當下建立，而非原 QTE 截止時間 |
| TRIGGER-06-004 | P2 | 玩家剛好位於 Token 座標再向前時可能不觸發 | previous distance 等於 trigger distance | 穿越判定未包含起點相等且正向移動的邊界 |
| WORKFLOW-06-005 | P3 | Phase 06 部署頁仍標示 `Run Phase 05 tests` | 查看第一次 Phase 06 Actions build | 工作流程步驟名稱未隨階段更新 |

---

# 七、修正內容

| Bug ID | 修正方式 | 修改檔案 | 回歸風險 |
| --- | --- | --- | --- |
| LAYOUT-06-001 | 對覆蓋選單加入 viewport 最大高度、捲動及矮畫面配置 | `css/menu.css` | 一般 720p／1080p 配置不變 |
| CACHE-06-002 | 統一 Phase 06 模組版本，新增測試後提升入口鏈為 `phase06-qte-r2` | `index.html`、`js/**/*.js`、`tests/unit-test.html`、`tests/browser-runner.js`、`tests/unit/suites.js` | 僅建立新版模組 URL，不改變玩法 |
| TIMER-06-003 | 逾時結果期限固定錨定原 QTE deadline 加 0.8 秒 | `js/systems/QTESystem.js` | 正常幀與成功結果顯示時間維持一致 |
| TRIGGER-06-004 | 採 `previous <= trigger`、`current >= trigger` 且必須正向移動 | `js/systems/QTESystem.js` | 反向移動不會誤觸發 |
| WORKFLOW-06-005 | 工作流程步驟名稱改為 `Run Phase 06 tests` | `.github/workflows/deploy-pages.yml` | 不影響命令與部署內容 |

---

# 八、修正後重測

| Bug ID | 原測試結果 | 重測結果 | 是否關閉 |
| --- | --- | --- | --- |
| LAYOUT-06-001 | 矮畫面標題被裁切 | 390 x 844 無溢位，內容可捲動 | 是 |
| CACHE-06-002 | 正式頁 144／144 | 本機及正式頁均 145／145 | 是 |
| TIMER-06-003 | 晚幀延長結果期限 | deadline 錨定案例通過 | 是 |
| TRIGGER-06-004 | exact-coordinate 未觸發 | 正向相等邊界案例通過 | 是 |
| WORKFLOW-06-005 | Actions 顯示 Phase 05 | run 29354558593 顯示 Phase 06 | 是 |

---

# 九、數值與效能證據

| 指標 | 目標／契約 | 實測 | 結果 |
| --- | --- | --- | --- |
| QTE 時限 | 1500 ms 絕對期限 | 邊界與晚幀案例精確通過 | PASS |
| QTE 門檻 | O=3、C=3，不要求交替 | `OOOCCC` 等非交替順序通過 | PASS |
| 結果顯示 | 800 ms，暫停不延長 | 原 deadline + 800 ms | PASS |
| 嘗試與分數 | 最多 2 次；成功 +10、失敗 -3 | 成功／兩次失敗案例符合 | PASS |
| 第一關 Gas 距離 | primary 0.62、retry 0.66、fallback 0.695 | 均在腹部及下肢的微血管網且不可側向略過 | PASS |
| 過場期限 | 至少 3 秒 | 3 秒絕對期限後完成 | PASS |
| 重試 HP | checkpoint HP 與 50 取較高值 | 專用 reset 案例通過 | PASS |
| 1280 x 720 FPS | 最低 30、目標接近 60 | 60 | PASS |
| 場景繪製 | 維持批次化程序模型 | 22 draw calls、16,302 triangles | PASS |
| GPU 資源 | 無外部資產 | 39 geometries、4 textures | PASS |
| 實體批次 | 程序化 InstancedMesh | 7 batches；Gas Token 6 parts | PASS |

---

# 十、變更清單

- 新增：`js/systems/QTESystem.js` 的完整行為、`tests/unit/qte.test.js`、Gas Token 程序化模型及本階段報告／清單。
- 修改：遊戲主流程、狀態機、輸入、HUD、血管色彩、RBC 反光、重試 reset、README 與 Pages 工作流程。
- 刪除：無。
- 所有 QTE、Gas、過場與重試數值集中於 `js/config.js`；關卡位置由資料驅動設定提供。
- 主要實作提交：`119c637f8c1ca1e41f90cfd6250d0143a52095c9`。
- 垂直切片測試提交：`7a2141a13d0c77d01693cfe3d14a1561528ffd38`。
- 瀏覽器快取修正提交：`c70a13a1bdc0f8753ebe6a3742ba8852a0c34720`。
- Pages 工作流程：`29354558593`，Phase 06 test、build 與 deploy 均 success。

---

# 十一、殘餘風險

- 自動化 Chromium 無法取得 Pointer Lock；拒絕路徑、PAUSED、真實時鐘及完整狀態鏈均已驗證，仍建議在一般桌面瀏覽器以前景操作再做一次人工駕駛確認。
- 目前只完成第一關垂直切片；第二至第四關的 Gas 位置已有資料契約，但不得視為已可玩。
- Phase 07 的完整酒精與瘧原蟲動畫尚未實作；本階段只維持既有倒數／QTE 相容契約。
- GitHub Actions 對部分 Pages 官方 action 顯示 Node.js 20 棄用註記，但目前由 runner 強制使用 Node.js 24，測試與部署均成功；後續應在官方 action 發布相容版本時升級。
- 多瀏覽器長時間記憶體與 FPS 壓測仍屬 Phase 10。

---

# 十二、階段結論

- [x] 本階段授權功能已實作。
- [x] 第一關已形成可到過關或 Game Over 的垂直切片。
- [x] Node、Chromium 與 GitHub Pages 145 項測試全部通過。
- [x] 720p、1080p 與 390 x 844 桌面窄畫面驗收已通過。
- [x] 右側品牌與鍵盤／滑鼠操作指引清楚且無溢位。
- [x] 本階段發現的錯誤已修正並完成回歸。
- [x] 未提前實作後續關卡及 Phase 07 功能。
- [x] 本報告內容與實際結果一致。

Phase 06 的 Gas QTE、重試、血管變色、失敗通過、過場、關卡完成、Game Over、本關重試、右側操作指引、自動測試與 Pages 部署均已完成。

**最終結果：** PASS
**是否允許進入下一階段：** 是
