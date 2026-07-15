# Project Aorta：大動脈計畫室 STABLE Version 1.1 發布報告

## 結果

- 狀態：PASS（本機、GitHub Actions 與 GitHub Pages）
- 正式名稱：Project Aorta：大動脈計畫室
- 副標：RBC RACER
- 狀態／版本：STABLE／Version 1.1（20260715）
- 分支：`main`
- 發布：已推送 GitHub，並由 GitHub Actions 部署 GitHub Pages
- 前一功能基線：`e22cd963ed5bd12cca877200dd2f2238cff169fc`
- STABLE 1.1 實作基線：`363f4c9124448a013d4d7c12e3f3bf2eddc7444e`

## 完成範圍

1. 氣體交換區的小地圖標記改為鎖定教學圖的「組織」或「肺」節點，離開交換區後恢復連續路徑。
2. 一般 `DEBUFF` 的 Score 與 HP 負值套用 2 倍倍率；氣體交換失敗分數由 `-3` 調整為 `-6`。致命 `Wound` 不套倍率。
3. 每關瘧原蟲碰撞計數達 5 的倍數時觸發 15 秒「血球破裂」，BP 上限降為 60；效果結束只恢復上限，不補回血壓。
4. 每關 CO 碰撞累積 10 次後進入持續至該關結束的「CO 中毒」，氣體交換改為 O 與 C 各 9 次。
5. 瘧原蟲引擎蓋放大，並在頭罩啟用與復原期間以程序化水蒸氣模糊全畫面。
6. 任務期限到達而尚未抵達終點時，播放乾扁紅血球送往肝臟工廠的專屬結局；跨越 deadline 的最後一幀只計算截止前的移動時間，正好抵達仍有效。
7. 移除畫面中的 Phase 標章、內部狀態碼、FPS、Pointer Lock、checkpoint seed、動畫 phase ID 與 build 字樣；保留必要操作與生理儀表。
8. 專案狀態、測試入口、快取版本與稽核門檻更新為 STABLE。
9. 修正開始按鈕回饋：Pointer Lock 等待狀態立即可見，靜默失敗會逾時並顯示重試；`file://` 開啟時改顯示靜態伺服器指引，並新增 `start-local.cmd`。
10. RBC 截面碰撞改為十字線至機體下緣的垂直膠囊；六類增益／減益本體半徑涵蓋最大脈動模型，五種有標示牌的物件將牌面一併列入碰撞。
11. 正式名稱更新為「Project Aorta：大動脈計畫室」，副標為「RBC RACER」，介面顯示 STABLE 與 `Version：1.1（20260715）`。
12. 現行 npm gate、測試函式、快取鍵、稽核、驗收清單、報告與 CI 全部改用 stable 命名；Phase 00–10 僅保留為歷史開發證據。

## 集中設定

新增或調整值均位於 `js/config.js`：

- `penalties.debuffMultiplier = 2`
- `bloodRupture.malariaCollisionInterval = 5`
- `bloodRupture.hoodDurationMultiplier = 3`
- `bloodRupture.bloodPressureMaximum = 60`
- `carbonMonoxidePoisoning.collisionTriggerCount = 10`
- `qte.carbonMonoxidePoisoningThreshold = 9`
- `qte.failureScore = -6`
- `pointerLock.requestTimeoutMs = 1500`
- `collision.playerProfile = { topOffsetY: 0, bottomOffsetY: -1.91 }`
- `collision.entityLabelCategories = ["BUFF", "DEBUFF"]`
- 增益／減益 `collisionRadius = 0.77、0.81、0.80、0.75、1.19、1.08`
- `malaria.steamBlurPixels = 8`
- `malaria.steamOpacity = 0.72`
- `malaria.steamDriftSeconds = 6`
- `app.name = "Project Aorta：大動脈計畫室"`
- `app.subtitle = "RBC RACER"`
- `app.status = "STABLE"`
- `app.version = "1.1"`
- `app.releaseDate = "20260715"`

## 自動驗證

執行：

```powershell
npm run test:stable
```

結果：

```text
Project Aorta：大動脈計畫室 STABLE unit tests
Summary: 204 passed, 0 failed, 204 total.
STABLE audit: 9 passed, 0 failed.
```

新增測試涵蓋小地圖交換節點、2 倍減益、碰撞計數、血球破裂、BP 動態上限、CO 中毒 9/9 QTE、逾時狀態、截止幀切割、肝臟回收過場、RBC 垂直膠囊與標示牌碰撞。

## 本機瀏覽器驗證

- Codex In-app Chromium 的 `tests/unit-test.html`：`204 passed, 0 failed`，修正版 Console 警告與錯誤皆為 0。
- 主畫面於 1280 x 720 與 1920 x 1080 均無水平或垂直溢位，正式品牌區塊與開始按鈕位於可視範圍。
- 主畫面載入 1 個 Three.js Canvas；`READY / initialized=true`，並顯示正式名稱、RBC RACER、STABLE 與完整版本字串。
- 畫面中未出現廢止的編號發布階段、FPS、Pointer Lock、build 或 checkpoint seed 開發文字。
- 全新 HTTP 分頁實際點擊開始按鈕後，介面立即離開 `READY`；自動化瀏覽器拒絕 Pointer Lock 時會顯示可重試錯誤，任務倒數開始運行，Console 警告與錯誤皆為 0。
- 啟動後自動化環境拒絕 Pointer Lock，遊戲正確保持暫停；任務倒數仍由 `280.7 s` 降至 `279.3 s`。
- `TIMEOUT` 預覽在 `LIVER_CONVEYOR` 階段顯示乾扁紅血球、輸送帶與「肝臟工廠」，1920 x 1080 無溢位，Console 警告與錯誤皆為 0。
- `file://` 防護與 `start-local.cmd` 由 STABLE audit 驗證；自動化瀏覽器因安全政策禁止導覽至本機檔案，直接雙擊入口仍列為真人驗收項目。

## 本次錯誤與修正

- 初次 1280 x 720 啟動時只剩 `STABLE` 文字。原因是品牌綁定以 `[data-release-status]` 選中 `#game-root`，設定 `textContent` 時刪除了整棵遊戲 DOM。
- 顯示欄位改用 `[data-product-status]`，根節點只保留 `data-release-status` 診斷值；audit 新增選擇器隔離契約。
- 快取鍵由初版提升為 `stable-v1.1-20260715-r2`，重新載入兩種解析度及測試頁後皆通過，修正版 Console 為 0。

## 待真人完整駕駛驗證

- 自然駕駛觸發瘧原蟲水蒸氣、CO 中毒，以及組織／肺小地圖鎖點。
- Chrome、Edge、Firefox 的前景 Pointer Lock 與四關完整流程。
- 自然駕駛擦碰 RBC 機體下緣、增益／減益模型外緣及標示牌的手感。

## 殘餘風險

- GitHub Actions 必須先通過 `npm run test:stable` 才可部署；正式 Pages 仍需逐次發布後實際驗證，不得只依賴歷史結果。
- 水蒸氣使用瀏覽器 `backdrop-filter`；正式支援矩陣需以 Chrome、Edge、Firefox 桌面版實測視覺一致性。
- 9 次 O 加 9 次 C 必須在既有 1.5 秒內完成，難度顯著提高，符合本次明示規則但仍需玩家體感驗收。
