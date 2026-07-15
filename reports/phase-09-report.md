# RBC Racer 階段結果報告

**階段：** Phase 09 - 過場、結局與完整重試  
**報告日期：** 2026-07-15  
**總案版本：** 2.3  
**執行者：** Codex  
**結果：** PASS

---

# 一、本階段範圍

## 已授權實作

- 第一至第四關心房至心室輸送帶，長度介於總案規定的 3 至 5 秒。
- 第一至第三關完成輸送帶後自動載入下一關；第四關完成輸送帶後進入勝利流程。
- HP 歸零的 Spleen／Liver 回收動畫。
- 第一、二、四關 Wound 的翻車墜落及 Vessel Rupture 結局。
- 第三關 Wound 的中風／Stroke 專屬結局。
- 第四關完成後的鮮紅血管、車身增亮、O2 旗幟、RBC 遊街及彩帶動畫。
- 重新挑戰本關、從第一關重新開始及回到主選單。
- checkpoint、固定 seed、HP、Score 保存，以及所有暫態、物件與 pending 狀態清除。
- 所有過場使用絕對時間，不停止主迴圈、REAL CLOCK 與既有狀態期限。

## 明確排除

- Phase 10 的 Chrome／Firefox／Edge 完整矩陣。
- Phase 10 的長時間記憶體趨勢、完整效能最佳化與最終全流程人工駕駛驗收。
- 任何 React、Vue、Angular、Phaser、Unity、後端、資料庫或外部媒體。

本階段沒有新增關卡專屬 Manager、System 或玩家類別。

---

# 二、完成內容

| 項目 | 結果 | 相關檔案 |
| --- | --- | --- |
| 絕對時間過場狀態模型 | 完成 | `js/cutscenes/CutsceneManager.js`、`js/config.js` |
| 程序化過場畫面 | 完成 | `js/cutscenes/CutsceneRenderer.js`、`css/cutscene.css` |
| 四關心房至心室語意 | 完成 | `js/data/levels.js`、`js/data/schemas.js` |
| 自動跨關與第四關勝利 | 完成 | `js/core/Game.js`、`js/core/LevelManager.js` |
| Stroke 與 Victory 狀態 | 完成 | `js/core/GameStateMachine.js`、`js/core/GameSession.js` |
| 本關重試與整輪重開 | 完成 | `js/core/RunProgression.js`、`js/core/Game.js` |
| 三選項失敗選單 | 完成 | `index.html`、`js/ui/HUDManager.js`、`css/menu.css` |
| 五種畫面預覽工具 | 完成 | `tests/phase-09-cutscene-preview.html`、`tests/cutscene-preview.js` |
| Phase 09 共用測試 | 完成 | `tests/unit/cutscene.test.js`、`tests/unit/runProgression.test.js` 及回歸套件 |
| GitHub Pages Phase 09 工作流程 | 完成 | `.github/workflows/deploy-pages.yml` |

---

# 三、實際測試環境

| 項目 | 內容 |
| --- | --- |
| 作業系統 | Microsoft Windows 10 教育版 10.0.19045 |
| 瀏覽器與版本 | Codex In-app Browser／Chromium runtime |
| 畫面解析度 | 1280 x 720 |
| Three.js 版本 | r184 |
| Node.js | v24.15.0 |
| Python | 3.14.4 |
| 本機啟動方式 | `python -m http.server 4173 --bind 127.0.0.1` |
| 本機網址 | `http://127.0.0.1:4173/`、`/tests/unit-test.html`、`/tests/phase-09-cutscene-preview.html` |
| 正式網址 | `https://kisaraki.github.io/Classroom-rbc-racer-tzk/` |

---

# 四、自動測試

| 測試命令或頁面 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- |
| Phase 08 基準 `npm test` | 169／169 | 169 passed、0 failed | PASS |
| 首次 Phase 09 回歸 | 找出舊測試契約 | 168 passed、1 failed | FAIL，已修正 |
| 最終 `npm test` | 全部通過 | 181 passed、0 failed | PASS |
| 本機 Chromium 共用測試頁 | 與 Node 同套件 | 181 passed、0 failed | PASS |
| 線上 GitHub Pages 共用測試頁 | 181／181 | 181 passed、0 failed | PASS |
| 71 個 JS／MJS `node --check` | 無語法錯誤 | 全部通過 | PASS |
| `git diff --check` | 無空白錯誤 | 通過，僅 Git 行尾提示 | PASS |
| `js/` timer 掃描 | 無 `setTimeout`／`setInterval` | 無命中 | PASS |
| 外部 runtime 資源掃描 | 只允許 SVG namespace | 僅 W3C SVG namespace | PASS |
| GitHub Actions run 29381070025 | test、artifact、Pages deploy 成功 | build／deploy success | PASS |

重要覆蓋：

- `TRANSFER`、`RECYCLE`、`FALL`、`STROKE`、`VICTORY` 均由集中設定建立絕對 deadline。
- Transfer 在時間跳躍後仍會完成，證明暫停或背景時間不會延長過場。
- LevelManager 依 1、2、3、4 順序推進且不循環回第一關。
- 四關輸送語意為右心房至右心室、左心房至左心室、右心房至右心室、左心房至左心室。
- 下一關保留 HP 與 Score，同時清除 BP、距離、橫向位置、酒精、Gas 狀態及嘗試次數。
- 本關重試沿用 checkpoint level／seed／score，HP 套用 `retryMinimumHp` 並清除 Wound 與 QTE 累計暫態。
- 第三關可進入 `GAME_OVER_STROKE`；Victory 只能由 `LEVEL_COMPLETE` 進入。
- Phase 00 至 08 的駕駛、QTE、BP、碰撞、狀態效果、四條血管、儀表及裝置拒絕測試全部保留。

---

# 五、手動驗收

| 驗收項目 | 操作步驟 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- | --- |
| P09 正式入口 | 載入本機與 Pages 根網址 | `P09`、READY、Level 1 checkpoint | phase 09、HP 100、Score 0、seed 1380074241 | PASS |
| Three.js 場景 | 讀取正式入口 diagnostics | 場景初始化且無 console error | 22 draw calls、16,302 triangles | PASS |
| 心房至心室輸送帶 | 預覽 TRANSFER 0.58 | 顯示心房、輸送帶、RBC、心室 | `CONVEYOR`，右心房至右心室構圖正常 | PASS |
| 回收動畫 | 預覽 RECYCLE 0.72 | Spleen／Liver 工廠與分解碎片 | `DISASSEMBLY`，12 個程序化碎片 | PASS |
| 墜落動畫 | 預覽 FALL 0.58 | 衝出血管、黑色翻滾剪影及深淵 | `TUMBLE` 構圖正常 | PASS |
| 中風動畫 | 預覽 STROKE 0.75 | 黑場後顯示中風／STROKE | `DIAGNOSIS` 紅字正常 | PASS |
| 勝利遊街 | 預覽 VICTORY 0.58 | 鮮紅血管、O2 旗、RBC 車隊和彩帶 | 6 台 RBC、2 列、36 條彩帶、12 欄 | PASS |
| 初始選單 | 檢查三個 action button | 只有開始按鈕可見 | primary 可見，其餘 hidden | PASS |
| Pointer Lock 拒絕 | 自動化瀏覽器點擊開始 | 安全暫停且計時持續 | `WrongDocumentError`、PAUSED、T+0.8 至 T+1.9 秒 | PASS |
| 版面範圍 | 讀取 viewport 與 scroll size | 1280 x 720 無溢位 | viewport 與 scroll 均為 1280 x 720 | PASS |
| 線上預覽 | 載入 Pages Victory preview | 與本機程序化資產一致 | 6 台 RBC、36 條彩帶，無 console error | PASS |

---

# 六、發現的錯誤

| ID | 嚴重度 | 現象 | 重現步驟 | 原因 |
| --- | --- | --- | --- | --- |
| TEST-09-001 | P2 | 首次回歸為 168／169 | 加入 `level.transfer` schema 後執行舊測試 | 舊 assembler 測試 fixture 未提供心房至心室語意 |
| UI-09-002 | P2 | Victory RBC 與彩帶集中成單列 | 以 Chromium 預覽 Victory 0.58 | CSS `calc()` 使用不支援的 `%` 餘數運算式 |

---

# 七、修正內容

| Bug ID | 修正方式 | 修改檔案 | 回歸風險 |
| --- | --- | --- | --- |
| TEST-09-001 | fixture 加入 `fromChamber`／`toChamber` 並新增四關映射測試 | `tests/unit/schemas.test.js`、`tests/unit/levelManager.test.js` | 低，測試資料與正式 schema 同步 |
| UI-09-002 | 由 renderer 依集中設定產生 row／column CSS 變數 | `js/config.js`、`js/cutscenes/CutsceneRenderer.js`、`css/cutscene.css` | 低，只影響程序化物件排列 |

---

# 八、修正後重測

| Bug ID | 原測試結果 | 重測結果 | 是否關閉 |
| --- | --- | --- | --- |
| TEST-09-001 | 168 passed、1 failed | 181 passed、0 failed | 是 |
| UI-09-002 | RBC／彩帶未分列 | 2 個 RBC row、12 個彩帶 column | 是 |

---

# 九、數值與效能證據

| 指標 | 目標 | 實測 | 結果 |
| --- | --- | --- | --- |
| 正式入口 draw calls | 不高於既有 Phase 08 基準 | 22 | PASS |
| 正式入口 triangles | 不高於既有 Phase 08 基準 | 16,302 | PASS |
| 五種過場時長 | Transfer 3 至 5 秒，其餘集中設定 | 4／5.2／4.8／3.8／7.5 秒 | PASS |
| 主迴圈 timer | 不建立逐事件 timer | 0 個 `setTimeout`／`setInterval` | PASS |
| 記憶體趨勢 | Phase 10 長時間矩陣 | 本階段不適用 | 不適用 |

---

# 十、變更清單

- 新增：`RunProgression`、`CutsceneRenderer`、Phase 09 cutscene／run progression 測試與預覽頁。
- 修改：Game runtime 重建、自動跨關、狀態機、HUD 選單、四關心房至心室語意、集中過場設定、README 與 Pages workflow。
- 刪除：Phase 08 的第一關終止式占位結算流程。
- 實作提交：`9092c552819c9329b7d5de9773820e1bf1b0b844`。
- GitHub Actions：`29381070025`，build 與 deploy 均成功。

---

# 十一、殘餘風險

- 自動化 Chromium 無法取得 foreground Pointer Lock，因此自然操作的四關連續 11 分鐘完整駕駛仍列入 Phase 10 人工矩陣；本階段已驗證拒絕路徑、絕對計時、四關資料、狀態轉換及五種視覺端點。
- 本階段只實測 1280 x 720；其他桌面解析度及 Firefox／Edge／Chrome 完整組合屬 Phase 10。
- GitHub 官方 Pages actions 仍標示 Node.js 20 deprecated，但 runner 已強制使用 Node.js 24 且本次 build／deploy 成功；Phase 10 應追蹤上游 action 更新。
- Cutscene preview 是驗收工具，不會由正式遊戲入口自動開啟，也不修改遊戲資料。

---

# 十二、階段結論

- [x] 本階段需求全部完成。
- [x] 自動測試全部通過。
- [x] 本階段可執行的手動驗收全部通過。
- [x] 本階段發現的錯誤均已修正並重測。
- [x] 未提前執行 Phase 10 長時間與跨瀏覽器矩陣。
- [x] 報告內容與本機、GitHub Actions 及 Pages 實際結果一致。

**最終結果：** PASS  
**是否允許進入下一階段：** 是
