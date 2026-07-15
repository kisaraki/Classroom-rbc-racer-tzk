# RBC Racer 階段結果報告

**階段：** Phase 08 - 其餘關卡資料化擴展與飛行儀表修正  
**報告日期：** 2026-07-15  
**總案版本：** 2.3  
**執行者：** Codex  
**結果：** PASS

---

# 一、本階段範圍

## 已授權實作

- 完成第二關 900 單位肺循環資料、Location、半徑、顏色、氣體交換區及小地圖路徑。
- 完成第三關 1800 單位體循環（頭部、胸部及上肢）資料、Location、半徑、顏色、氣體交換區及小地圖路徑。
- 完成第四關 900 單位肺循環（高危險關卡）資料及獨立小地圖路徑 ID。
- 實作第四關增益 0.7 倍、一般減益 2.5 倍、酒精額外 2 倍及高 BP Wound 3 倍契約。
- 將四關控制點、距離、半徑、色彩鍵、seed、時間與倍率集中於 `js/config.js`。
- 由單一 `levels.js` 組裝四關，不複製或分叉 Manager、System 或玩家類別。
- 將正面光標拆為鍵盤機身姿態十字與滑鼠視覺方向圓形。
- 新增 ATTITUDE、動態 ALT 及 VIEW 儀表，ALT 上下限依當前血管直徑更新。
- 新增四關目標駕駛時間、路線、曲線、小地圖、倍率及儀表自動測試。

## 明確排除

- Phase 09 的跨關自動切換與心房至心室輸送帶過場。
- 回收、墜落、中風及勝利結局擴充。
- 全流程重新挑戰與完整跨關保存。
- Phase 10 的多瀏覽器長時間效能與記憶體矩陣。

應用仍從第一關開始；第二至第四關已註冊且可由共用 `LevelManager` 載入，實際跨關流程保留至 Phase 09。

---

# 二、完成內容

| 項目 | 結果 | 相關檔案 |
| --- | --- | --- |
| 四關數值與程序曲線 | 完成 | `js/config.js` |
| 四關語意與資料組裝 | 完成 | `js/data/levels.js`、`js/data/schemas.js` |
| 四條小地圖路徑 | 完成 | `js/config.js`、`js/ui/MiniMapRenderer.js` |
| 第四關風險倍率 | 完成 | `js/config.js`、既有 Entity／BP 系統 |
| 十字與圓形獨立光標 | 完成 | `index.html`、`css/hud.css`、`js/ui/HUDManager.js` |
| ATTITUDE、ALT、VIEW | 完成 | `js/ui/FlightInstrumentModel.js`、`js/ui/HUDManager.js`、`js/core/Game.js` |
| Phase 08 共用測試 | 完成 | `tests/unit/flightInstruments.test.js` 及既有回歸套件 |
| GitHub Pages Phase 08 工作流程 | 完成 | `.github/workflows/deploy-pages.yml` |

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
| 本機網址 | `http://127.0.0.1:4173/`、`/tests/unit-test.html` |
| 正式網址 | `https://kisaraki.github.io/Classroom-rbc-racer-tzk/` |

---

# 四、自動測試

| 測試命令或頁面 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- |
| Phase 07 基準 `npm test` | 158／158 | 158 passed、0 failed | PASS |
| Phase 08 `npm test` | 全部通過 | 169 passed、0 failed | PASS |
| 本機 Chromium 共用測試頁 | 與 Node 同套件 | 169 passed、0 failed | PASS |
| 64 個 JS／MJS `node --check` | 無語法錯誤 | 全部通過 | PASS |
| `git diff --check` | 無空白錯誤 | 通過 | PASS |
| `js/` 計時 API 掃描 | 無逐輸入 timer | 無 `setTimeout`／`setInterval` | PASS |
| 每關基準駕駛時間 | 300／90／180／90 秒 | 四個獨立案例全部通過 | PASS |
| GitHub Actions run 29379516466 | 測試、artifact、Pages deploy 成功 | build／deploy success | PASS |
| GitHub Pages 線上測試頁 | 169／169 | 169 passed、0 failed | PASS |

重要覆蓋：

- 四個 Level 都通過 schema、起訖點、Location 順序、距離連續、色彩連續及小地圖連續檢查。
- 第二與第四關 Gas trigger 均落在 270～585 的肺泡微血管；第三關 trigger 均落在 900～1260 的頭部、胸部及上肢微血管網。
- 四條小地圖路徑都可組成單一連續 SVG path，並使用既有七個節點與八條血管。
- 四條 Catmull-Rom 曲線都由同一 `VesselTrack` 建立，沒有關卡專屬類別。
- 第四關權重驗證為 C 12.6、B12 9.8、Fe 9.8、CO 50、Malaria 25、Alcohol 80、Empty 8。
- 安全 BP Wound 與高 BP 三倍公式沿用既有測試且全部通過。
- 儀表模型驗證中立、最大偏移、血管直徑切換、yaw／pitch 映射及無效尺寸。

---

# 五、手動驗收

| 驗收項目 | 操作步驟 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- | --- |
| P08 入口 | 以 HTTP 載入遊戲 | 顯示 P08 與新儀表說明 | 標題、badge、overlay 均為 Phase 08 | PASS |
| 機身光標 | 讀取十字 computed style | 無圓框，只有水平／垂直線 | border none；48 x 1 與 1 x 48 px | PASS |
| 視覺光標 | 讀取圓形 computed style | 獨立青色圓框 | solid border、50％ radius | PASS |
| ATTITUDE | 讀取中立資料與畫面 | X／Y 均為 0 且標示 KEY／BODY | `X +0.00`、`Y +0.00` | PASS |
| ALT | 讀取左心室區段 | 上下限為 0～當前直徑 13 | 0.0、13.0、ALT 6.5、DIA 13.0 | PASS |
| VIEW | 讀取中立鏡頭 | heading／pitch 為 0 | HDG 000°、PITCH +0° | PASS |
| 1280 x 720 版面 | 量測 document 與儀表 | 無頁面或儀表溢位 | scroll 1280 x 720；儀表 bottom 694.4 | PASS |
| 儀表與小地圖間距 | 量測兩 panel | 不互相重疊 | 小地圖 bottom 379.2；儀表 top 549.7 | PASS |
| WebGL 場景 | 讀取正式 root diagnostics | READY 且程序場景建立 | 22 draw calls、16,302 triangles | PASS |
| 真實計時 | Pointer Lock 被拒後等待 1.3 秒 | PAUSED、距離不動、時鐘繼續 | 距離 0；0.3 增至 1.7 秒 | PASS |
| 行動裝置拒絕 | 執行共用裝置案例 | 手機／平板啟動前拒絕 | Client Hint、iPhone、Android、iPad 案例通過 | PASS |
| Console | 讀取本機及正式遊戲／測試頁 | 無應用 warning／error | 記錄均為空 | PASS |
| 正式 Pages | 載入遊戲與測試頁 | P08、READY、169／169 | 全部符合 | PASS |

自動化 Chromium 無法取得 Pointer Lock；應用正確進入 PAUSED 並繼續絕對時間。鍵盤機身與滑鼠視角的動態映射由正式 runtime 相同的純模型與 CameraController 共用測試覆蓋。

---

# 六、發現的錯誤

| ID | 嚴重度 | 現象 | 重現步驟 | 原因 |
| --- | --- | --- | --- | --- |
| HUD-08-001 | P2 | 原正面光標同時具有圓形與十字，無法辨識鍵盤與滑鼠控制 | 載入 Phase 07 畫面觀察中央光標 | 單一 DOM 元素同時承擔兩種控制語意 |
| TEST-08-002 | P2 | 首次加入四關後有兩項測試失敗 | 執行 `npm test` | 舊測試仍要求只能註冊第一關 |
| TEST-08-003 | P3 | VIEW pitch 30 度案例因極小浮點差失敗 | 執行第二輪 `npm test` | 測試容許值小於 JavaScript 浮點運算誤差 |
| CONFIG-08-004 | P3 | ATTITUDE marker 行程一度在 HUD 直接寫入 40 | 提交前檢查新增程式 | 顯示數值未完全回到 `config.js` |

---

# 七、修正內容

| Bug ID | 修正方式 | 修改檔案 | 回歸風險 |
| --- | --- | --- | --- |
| HUD-08-001 | 拆為暖色十字 body reticle 與青色圓形 view reticle，分別接到玩家 offset 與 Camera yaw／pitch | `index.html`、`css/hud.css`、`HUDManager.js` | 中；新增 HUD 元素與每幀位置更新 |
| TEST-08-002 | 將 schema 與 LevelManager 測試提升為四關註冊、載入、路線及時間契約 | `schemas.test.js`、`levelManager.test.js` | 低；只調整測試授權範圍 |
| TEST-08-003 | 將角度案例容許值調整為 1e-12，不改產品公式 | `flightInstruments.test.js` | 低；仍遠小於畫面顯示精度 |
| CONFIG-08-004 | 新增 `attitudePanelTravelPercent` 並由 HUD 匯入 | `config.js`、`HUDManager.js` | 低；輸出位置不變 |

---

# 八、修正後重測

| Bug ID | 原測試結果 | 重測結果 | 是否關閉 |
| --- | --- | --- | --- |
| HUD-08-001 | 控制語意混合 | computed style 與五個儀表案例通過 | 是 |
| TEST-08-002 | 156 passed、2 failed | 169 passed、0 failed | 是 |
| TEST-08-003 | 168 passed、1 failed | 169 passed、0 failed | 是 |
| CONFIG-08-004 | 提交前檢查失敗 | config 掃描與完整測試通過 | 是 |

修正後重新執行 Node 169 項、Chromium 169 項、64 檔語法檢查、720p 版面、Pointer Lock 拒絕路徑、GitHub Actions 與正式 Pages 驗證，全部通過。

---

# 九、數值與效能證據

| 指標 | 目標 | 實測 | 結果 |
| --- | --- | --- | --- |
| Level 1 | 3000 單位／300 秒 | 曲線 2938.231；300 秒案例通過 | PASS |
| Level 2 | 900 單位／90 秒 | 曲線 900.071；90 秒案例通過 | PASS |
| Level 3 | 1800 單位／180 秒 | 曲線 1799.993；180 秒案例通過 | PASS |
| Level 4 | 900 單位／90 秒 | 曲線 900.071；90 秒案例通過 | PASS |
| ALT 動態上限 | 血管直徑的 2 倍半徑 | 心室 13.0、微血管 6.4 | PASS |
| 小地圖 | 四條連續 route | 4 route、7 nodes、8 vessels | PASS |
| 第四關 Alcohol | 16 x 2.5 x 2 | 權重 80 | PASS |
| 1280 x 720 FPS | 最低 30 | READY 畫面約 50～54 | PASS |
| 場景繪製 | 維持程序化批次 | 22 draw calls、16,302 triangles | PASS |
| 長時間記憶體趨勢 | Phase 10 | 本階段不適用 | 不適用 |

曲線幾何長度用於畫面形狀，canonical `trackLength` 用於駕駛距離與時間；既有第一關維持 10％視覺長度容許範圍，新增三關已校準至接近 canonical 長度。

---

# 十、變更清單

- 新增 `js/ui/FlightInstrumentModel.js` 與 `tests/unit/flightInstruments.test.js`。
- 新增第二至第四關控制點、區段、色彩、半徑、路徑及 multiplier 資料。
- 擴充 `levels.js`、level schema、小地圖 route、HUD、Game diagnostics 與 Phase 08 測試。
- 更新入口、README、測試頁、工作流程標籤及 `phase08-routes-r1` cache token。
- 未新增外部圖片、模型、影片、字型、框架、後端或資料庫。
- 唯一 `http://` 字串為 SVG W3C namespace，不是外部資產請求。
- 主要實作提交：`c26fdaeb9f2b4efe453aed83a2021562d32bd16a`。
- Pages 工作流程：`29379516466`，Phase 08 test、build 與 deploy 均 success。

---

# 十一、殘餘風險

- 自動化 Chromium 無法取得前景 Pointer Lock；控制映射與 Camera 狀態有自動測試，仍建議在一般桌面瀏覽器做一次主觀駕駛與光標移動觀感確認。
- 應用目前仍從第一關開始；四關資料可載入，但實際跨關切換、過場與結局屬 Phase 09。
- 本階段以規格最低桌面解析度 1280 x 720 驗收；多解析度、多瀏覽器及長時間記憶體矩陣屬 Phase 10。
- GitHub 官方 Pages actions 顯示 Node 20 相依淘汰提示，但 runner 已強制使用 Node 24，測試與部署均成功；後續可隨官方 action 新版更新。

---

# 十二、階段結論

- [x] 第二關 900 單位肺循環已完成。
- [x] 第三關 1800 單位體循環（頭部、胸部及上肢）已完成。
- [x] 第四關 900 單位肺循環（高危險關卡）及倍率已完成。
- [x] 四關 Location、色彩、半徑、Gas 區段與小地圖映射已完成。
- [x] 四關均由單一 `levels.js` 資料路徑組裝，未分叉核心系統。
- [x] 十字鍵盤光標、圓形滑鼠光標與三個飛行儀表已完成。
- [x] Node、本機 Chromium、GitHub Actions 與正式 Pages 169 項測試全部通過。
- [x] 本階段發現的錯誤已修正並完成回歸。
- [x] 未提前實作 Phase 09 過場與結局。

Phase 08 的其餘關卡資料化擴展、飛行儀表修正、自動測試與 GitHub Pages 部署均已完成。

**最終結果：** PASS  
**是否允許進入下一階段：** 是
