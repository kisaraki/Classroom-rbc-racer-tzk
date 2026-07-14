# RBC Racer 階段結果報告

**階段：** Phase 07 - 酒精中毒、瘧原蟲遮蔽與狀態重疊  
**報告日期：** 2026-07-15  
**總案版本：** 2.3  
**執行者：** Codex  
**結果：** PASS

---

# 一、本階段範圍

## 已授權實作

- 實作第五次酒精碰撞觸發的 15 秒中毒效果，保留每次碰撞原有的 Score -1／HP -1。
- 實作 S 型偏移、每 400ms 在 BP 80～130 間亂跳、250～700ms 輸入延遲及 35％輸入失效。
- 以絕對 `executeAt` 佇列處理方向鍵、Z、X，不為每次操作建立 `setTimeout`。
- 實作酒精畫面扭曲／重影、HUD 絕對倒數、期限結束清理及 BP 回復 100。
- 將既有瘧原蟲基本遮蔽擴充為五秒連續不規則翻動與 0.4 秒復位動畫。
- 實作 QTE 隱藏頭罩、低血壓／暫停持續動畫、重複碰撞刷新期限及 HP 歸零清理。
- 實作酒精與瘧原蟲獨立計時及重疊，重疊時將遮蔽上限限制為畫面高度 55％。
- 確保酒精與瘧原蟲期限跨 QTE、LOW_BP_STASIS、PAUSED 及 TRANSFER_CUTSCENE 繼續。
- 擴充右側狀態 HUD，使多個狀態與既有 KOSMOS TOOLKIT 操作說明可同時顯示。

## 明確排除

- Phase 08 的第二至第四關資料與實際載入流程。
- 第四關一般減益、酒精、增益及 Wound 倍率的可玩整合。
- 完整跨關過場、第四關勝利與結局動畫。
- Phase 09、Phase 10 的全案整合、多瀏覽器長時間效能及記憶體矩陣。

目前仍只註冊並開放第一關；本階段沒有提前建立第二至第四關。

---

# 二、完成內容

| 項目 | 結果 | 相關檔案 |
| --- | --- | --- |
| 酒精觸發、期限、BP、S 型偏移 | 完成 | `js/systems/StatusEffectManager.js`、`js/config.js` |
| 絕對時間輸入佇列與失敗判定 | 完成 | `js/systems/StatusEffectManager.js`、`js/input/InputController.js` |
| 玩家 BP 直接同步與速度更新 | 完成 | `js/player/PlayerRBC.js` |
| 瘧原蟲翻動、QTE 隱藏與復位 | 完成 | `js/player/HoodController.js` |
| 主狀態重疊、期限與清理 | 完成 | `js/core/Game.js` |
| 畫面扭曲、重影及狀態 HUD | 完成 | `css/main.css`、`css/hud.css`、`js/ui/HUDManager.js` |
| Phase 07 共用 Node／瀏覽器測試 | 完成 | `tests/unit/statusEffects.test.js` 及既有回歸套件 |
| GitHub Pages Phase 07 工作流程 | 完成 | `.github/workflows/deploy-pages.yml` |

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
| Phase 06 基準 `npm test` | 145／145 | 145 passed、0 failed | PASS |
| Phase 07 `npm test` | 全部通過 | 158 passed、0 failed | PASS |
| 本機 Chromium 共用測試頁 | 與 Node 同套件 | 158 passed、0 failed | PASS |
| 64 個 JS／MJS `node --check` | 無語法錯誤 | 全部通過 | PASS |
| `git diff --check` | 無空白錯誤 | 通過 | PASS |
| `js/` 計時 API 掃描 | 無逐輸入 timer | 無 `setTimeout`／`setInterval` | PASS |
| GitHub Actions run 29375191696 | Phase 07 測試與 Pages 部署成功 | build／deploy success | PASS |
| GitHub Pages 線上測試頁 | 158／158 | 158 passed、0 failed | PASS |

重要覆蓋：

- 第五次酒精碰撞才開始中毒；中毒中再次碰撞不延長原 15 秒期限。
- 延遲輸入帶有絕對 `executeAt`，失敗率、延遲上下界及狀態不接受時的丟棄行為均有邊界案例。
- BP 每次更新落在 80～130，400ms 更新不補跑暫停期間遺漏的亂數序列。
- O／C 使用獨立 QTE 佇列，不受酒精延遲與失敗判定影響。
- 酒精在 QTE 中自然到期時會清空待執行輸入、解除 S 型偏移並回復 BP 100。
- 瘧原蟲動畫由原始 Transform 加上時間函式偏移；同一時間重複更新不累積旋轉誤差。
- 瘧原蟲在五秒後進入 0.4 秒復位；重複碰撞只刷新同一頭罩期限。
- 酒精與瘧原蟲可跨 QTE、LOW_BP_STASIS、PAUSED、TRANSFER_CUTSCENE 分別到期。
- 重試、Level Complete、Game Over 均清除酒精、瘧原蟲、輸入、BP 與視覺殘留。

---

# 五、瀏覽器與手動驗收

| 驗收項目 | 操作步驟 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- | --- |
| P07 入口 | 以 HTTP 載入遊戲 | 顯示 Phase 07 與狀態說明 | 標題、版本及第一關場景正常 | PASS |
| WebGL 場景 | 讀取 root diagnostics | r184 與程序場景正常建立 | r184、22 draw calls、16,302 triangles | PASS |
| 酒精狀態契約 | 執行共用 ES Module 案例 | 觸發、15 秒、S 型、BP、延遲、失效均符合 | 專用案例全部通過 | PASS |
| 瘧原蟲狀態契約 | 執行頭罩動畫案例 | 五秒翻動、0.4 秒復位、QTE 隱藏 | 專用案例全部通過 | PASS |
| 狀態重疊 | 依序模擬 QTE、低血壓、暫停及過場 | 兩個期限獨立且不停止 | 重疊案例全部通過 | PASS |
| 真實計時 | Pointer Lock 被拒後等待 | 世界暫停、Real Clock 繼續 | PAUSED、距離 0；1.1 增至 2.8 秒 | PASS |
| 1280 x 720 | 量測 status／toolkit／scroll | 右側內容不溢位 | status bottom 670.22、toolkit bottom 657.55 | PASS |
| 1920 x 1080 | 量測文件與狀態欄 | 無水平或垂直頁面溢位 | scroll 與 viewport 相同 | PASS |
| 390 x 844 | 使用桌面 UA 量測窄畫面 | 無水平溢位 | scroll 390 x 844 | PASS |
| 行動裝置拒絕 | 執行手機／平板 UA 共用案例 | 啟動前拒絕且不顯示控制項 | Client Hint、iPhone、Android、iPad 案例通過 | PASS |
| Console | 讀取本機及正式遊戲／測試頁 | 無應用 warning／error | 記錄均為空 | PASS |
| GitHub Pages | 載入正式遊戲與測試頁 | P07、r184、158／158 | 全部符合 | PASS |

Codex 的自動化 Chromium 工作階段會拒絕 Pointer Lock；應用正確進入 PAUSED，玩家距離保持 0，而真實時鐘及所有絕對期限繼續。酒精與瘧原蟲的完整行為以正式 runtime 相同的 ES Modules 在 Node 與真實 Chromium 共用測試頁執行。

---

# 六、發現的錯誤

| ID | 嚴重度 | 現象 | 原因 |
| --- | --- | --- | --- |
| TIMER-07-001 | P1 | 15 秒期限剛過時可能多套用一個世界模擬幀 | 狀態期限原先在玩家世界更新後才同步 |
| ORDER-07-002 | P1 | QTE／過場的晚幀狀態轉換可能讓應丟棄的延遲操作看到恢復後狀態 | 狀態效果更新順序晚於主狀態期限處理 |
| CACHE-07-003 | P2 | 增加最終重疊案例後，長駐 Chromium 一度保留舊的 157 項模組圖 | Phase 07 開發期間沿用相同 query token |
| VISUAL-07-004 | P2 | 只有酒精中毒、沒有瘧原蟲時，正常收合的前蓋也被套用 55％重疊縮放 | 遮蔽縮放只檢查酒精旗標，未檢查瘧原蟲動畫是否可見 |
| INPUT-07-005 | P2 | 進入低血壓停滯前已生效的延遲方向可能在停滯結束後殘留 | 狀態切換未立即釋放中毒控制器的 active codes |

---

# 七、修正與重測

| Bug ID | 修正方式 | 重測結果 | 是否關閉 |
| --- | --- | --- | --- |
| TIMER-07-001 | 每次世界模擬前先以絕對時間更新狀態效果 | 到期幀不再套用移動、BP 或 S 型效果 | 是 |
| ORDER-07-002 | QTE／過場狀態轉換前先處理到期輸入與效果 | 到期操作依原主狀態丟棄，不於 PLAYING 補執行 | 是 |
| CACHE-07-003 | 將 runtime 與測試入口統一為 `phase07-status-r2` | 全新與長駐 Chromium 均顯示 158／158 | 是 |
| VISUAL-07-004 | 只在酒精與有效瘧原蟲遮蔽／復位同時存在時縮放頭罩 | 單獨酒精維持原前蓋大小，重疊仍限制 55％ | 是 |
| INPUT-07-005 | 進入 LOW_BP_STASIS 時釋放已生效延遲控制 | 停滯後不再恢復幽靈方向輸入，Z 仍可重新輸入 | 是 |

修正後重新執行 Node 158 項、Chromium 158 項、64 檔語法檢查、三種 viewport、Pointer Lock 拒絕路徑及正式 Pages 驗證，全部通過。

---

# 八、數值與效能證據

| 指標 | 目標／契約 | 實測 | 結果 |
| --- | --- | --- | --- |
| 酒精觸發 | 第 5 次碰撞 | 第 4 次無效，第 5 次開始 | PASS |
| 酒精期限 | 15 秒絕對期限 | 1000ms 開始、16000ms 結束 | PASS |
| 操作延遲 | 250～700ms | 最小、最大與到期邊界通過 | PASS |
| 操作失效 | 35％ | 0.35 邊界與診斷計數通過 | PASS |
| BP 亂跳 | 每 400ms、80～130 | 400ms 邊界與 late-frame 無補跑通過 | PASS |
| S 型偏移 | config 頻率 3.2、振幅 0.75 | 絕對時間公式精確通過 | PASS |
| 瘧原蟲遮蔽 | 5 秒 | 1000ms 開始、6000ms 進入復位 | PASS |
| 復位動畫 | 0.4 秒 | 6000～6400ms 完成 | PASS |
| 重疊遮蔽 | 最大 55％ | 程序模型縮放與診斷限制通過 | PASS |
| 1280 x 720 FPS | 最低 30、目標接近 60 | 60 | PASS |
| 場景繪製 | 維持批次化程序模型 | 22 draw calls、16,302 triangles | PASS |
| GPU 資源 | 無外部資產 | 39 geometries、4 textures | PASS |

---

# 九、變更清單

- 新增完整 `StatusEffectManager` 酒精系統及 `tests/unit/statusEffects.test.js`。
- 擴充 InputController、Game、PlayerRBC 與 HoodController 的狀態協作及清理。
- 新增酒精畫面效果、狀態 HUD 壓縮配置、Phase 07 文案及診斷欄位。
- 全部酒精與瘧原蟲數值集中於 `js/config.js`。
- 未新增外部圖片、模型、影片、字型、框架、後端或資料庫。
- 唯一 `http://` 字串為建立 SVG 所需的 W3C namespace，不是外部資產請求。
- 主要實作提交：`0ecdd847ae8430139b1669b9590f70717e78984b`。
- Pages 工作流程：`29375191696`，Phase 07 test、build 與 deploy 均 success。

---

# 十、殘餘風險

- 自動化 Chromium 無法取得前景 Pointer Lock；拒絕路徑、PAUSED、真實時鐘、狀態期限及共用 runtime 模組均已驗證，仍建議在一般桌面瀏覽器做一次前景駕駛觀感確認。
- 40％～65％及重疊 55％遮蔽由既有程序頭罩比例、config 與幾何縮放測試保證；不同瀏覽器縮放比例的逐像素視覺矩陣保留至整體驗收。
- 目前只完成第一關；第二至第四關仍屬 Phase 08，不得視為已可玩。
- 多瀏覽器長時間記憶體與 FPS 壓測仍屬 Phase 10。

---

# 十一、階段結論

- [x] 酒精中毒、S 型偏移、BP 亂跳、輸入延遲及失效已完成。
- [x] 瘧原蟲連續翻動、重複刷新、QTE 隱藏及復位已完成。
- [x] 酒精與瘧原蟲可重疊並分別使用絕對期限。
- [x] 所有狀態期限跨 QTE、LOW_BP_STASIS、PAUSED 及過場繼續。
- [x] 結束、重試、過關及 Game Over 均清除殘留狀態。
- [x] Node、Chromium 與 GitHub Pages 158 項測試全部通過。
- [x] 720p、1080p 與 390 x 844 窄桌面版面均無頁面溢位。
- [x] 本階段發現的錯誤已修正並完成回歸。
- [x] 未提前實作 Phase 08 的第二至第四關。

Phase 07 的酒精中毒、瘧原蟲遮蔽、狀態重疊、跨狀態期限、清理、回歸測試及 GitHub Pages 部署均已完成。

**最終結果：** PASS  
**是否允許進入下一階段：** 是
