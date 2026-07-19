# Project Aorta：大動脈計畫室 STABLE Version 1.1 驗收清單

## 自動門檻

- [x] `npm run test:stable`：210 passed、0 failed。
- [x] STABLE audit：9 passed、0 failed。
- [x] `git diff --check` 無錯誤。
- [x] 所有 JavaScript／MJS 通過 `node --check`。

## 啟動流程

- [x] HTTP 頁面實際點擊開始按鈕後立即離開 `READY`，不會停留在無回饋畫面。
- [x] 自動化瀏覽器拒絕 Pointer Lock 時顯示「無法鎖定滑鼠」與重試按鈕，任務倒數仍運行。
- [x] 單元測試涵蓋未支援 API、瀏覽器錯誤與靜默逾時。
- [x] Audit 驗證 `file://` 入口保護、`start-local.cmd` 指引及集中逾時設定。
- [ ] 前景 Chrome／Edge 實際允許 Pointer Lock 並進入第一關駕駛。
- [ ] 直接雙擊 `index.html` 時顯示靜態伺服器指引，不會保留看似可用的開始按鈕。

## 小地圖與氣體交換

- [ ] 第一／三關交換事件發生時，玩家標記位於「組織」。
- [ ] 第二／四關交換事件發生時，玩家標記位於「肺」。
- [ ] 離開交換區後，玩家標記恢復沿路線連續移動。
- [ ] 未中 CO 毒時 O、C 各 3 次；中毒後各 9 次。

## 碰撞與狀態

- [x] 單元測試確認 RBC 膠囊上緣為十字線、下緣為機體下緣，範圍外不誤判。
- [x] 單元測試確認增益／減益本體最大脈動半徑及五種標示牌均可成立碰撞。
- [ ] 實際駕駛擦碰 RBC 機體下緣時，增益／減益可觸發且沒有明顯空隙。
- [ ] 實際駕駛只擦碰 C、B12、Fe²⁺、CO、C₂H₅OH 標示牌時，對應效果成立。
- [ ] CO、瘧原蟲與酒精的 Score／HP 扣分均為原設定 2 倍。
- [ ] Wound 維持致命規則，不套用一般減益倍率。
- [ ] 同關第 5 隻瘧原蟲觸發「血球破裂」15 秒與 BP 上限 60。
- [ ] 同關第 10 隻瘧原蟲可再次觸發 15 秒效果。
- [ ] 水蒸氣與模糊涵蓋全畫面，直到頭罩復原完成。
- [ ] 同關第 10 次 CO 碰撞觸發持續性的「CO 中毒」。
- [ ] 過關、重試或重新開始會重設瘧原蟲與 CO 計數。

## 逾時結局

- [ ] 尚未抵達時 Time Out 會立即停止駕駛或 QTE。
- [x] `TIMEOUT` 瀏覽器預覽顯示乾扁紅血球沿輸送帶進入「肝臟工廠」。
- [ ] 結局完成後可重試本關、從第一關開始或回主選單。
- [ ] 正好在 deadline 抵達終點不會誤判 Time Out。

## 畫面清理

- [x] 主畫面無編號階段標章、內部 state、FPS 或 Pointer Lock 診斷卡。
- [x] 結局畫面不顯示 checkpoint seed 或動畫內部識別。
- [x] KOSMOS TOOLKIT、探真拓知酷、鍵鼠操作、ATTITUDE、ALT、VIEW 與循環圖仍可讀。

## 產品識別

- [x] 啟動畫面與 HUD 顯示「Project Aorta：大動脈計畫室」。
- [x] 副標完整顯示為「RBC RACER」。
- [x] 狀態與版本完整顯示為 `STABLE`、`Version：1.1（20260715）`。
- [x] npm、測試、CI、快取鍵與現行文件不再使用廢止的編號發布階段。

## 桌面瀏覽器

- [x] Codex In-app Chromium 1280 x 720，Console 警告與錯誤 0。
- [x] Codex In-app Chromium 1920 x 1080，Console 警告與錯誤 0。
- [ ] 前景 Chrome 1280 x 720 與 1920 x 1080。
- [ ] Edge 1280 x 720 與 1920 x 1080。
- [ ] Firefox 1280 x 720 與 1920 x 1080。

## 手機橫式

- [x] 單元測試確認 iPhone、iPadOS 桌面 UA、Android 手機／平板都選擇 `MOBILE_TOUCH`，不再拒絕初始化。
- [x] 單元測試確認直式方向閘門、轉橫式、控制釋放、四向多點、O／C、PAUSE、音量鍵映射與方向鎖定降級。
- [ ] 模擬手機直式顯示「請將手機轉為橫式」，Three.js 可初始化但開始控制不可操作。
- [ ] 模擬手機橫式顯示觸控 UI，沒有滑鼠 VIEW 儀表或圓形視角光標。
- [ ] Android Chrome 實機完成 `tests/stable-mobile-manual-test-checklist.md`。
- [ ] iOS／iPadOS Safari 實機完成 `tests/stable-mobile-manual-test-checklist.md`。
- [ ] 實機音量鍵送達與否已分平台記錄；無論結果，畫面 BP ＋／−可完整替代。

## 發布邊界

- [x] STABLE 1.1 實作與發布紀錄已推送 GitHub。
- [x] `main` 的 GitHub Pages workflow 通過並完成部署。
- [ ] 本次手機維護變更尚未獲使用者指示 push 或重新部署。
