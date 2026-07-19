# Project Aorta：大動脈計畫室 手機橫式支援維護報告

**版本／變更：** Version 1.1 - STABLE 手機橫式支援
**報告日期：** 2026-07-19
**產品狀態：** STABLE 維護候選
**總案版本：** 3.6
**執行者：** Codex
**結果：** PASS

---

# 一、本次範圍

## 已授權實作

- 移除手機與平板拒絕啟動流程。
- 手機只允許橫式操作，直式顯示全畫面方向閘門。
- Android 與 iOS 共用 Pointer Events 觸控路徑。
- 手機固定前方視角，不啟用 CameraController 或 Pointer Lock。
- 以觸控四向鍵操作 RBC 機身，以觸控 O／C 完成 QTE。
- 支援觸控 PAUSE 與畫面 BP ＋／−。
- 瀏覽器有提供 `AudioVolumeUp`／`AudioVolumeDown` 時，映射為 BP／速度控制。
- 對 Fullscreen、Screen Orientation lock、safe area 與動態 viewport 提供能力偵測及降級。

## 明確排除

- 本次未推送 GitHub，未部署 GitHub Pages。
- 本地沒有 Android 或 iOS 實機，因此未宣稱硬體音量鍵、瀏海、瀏覽器工具列或手機 GPU 已實機通過。
- 不新增後端、資料庫、框架或外部資產。

---

# 二、完成內容

| 項目 | 結果 | 相關檔案 |
| --- | --- | --- |
| 裝置偵測改為桌面與手機皆支援 | 完成 | `js/core/DeviceSupport.js`、`js/main.js` |
| 手機橫式方向閘門與方向鎖定降級 | 完成 | `js/input/MobileControls.js`、`index.html`、`css/mobile.css` |
| 四向、多點、O／C、PAUSE 與 BP 觸控 | 完成 | `js/input/MobileControls.js`、`js/input/InputController.js` |
| 音量鍵 BP 映射與畫面備援 | 完成 | `js/config.js`、`js/input/InputController.js`、`index.html` |
| 手機固定視角與桌面 Pointer Lock 分流 | 完成 | `js/core/Game.js`、`js/ui/HUDManager.js` |
| 手機渲染解析度與高 DPI 降載 | 完成 | `js/config.js`、`js/core/Game.js` |
| Android／iOS 相容性契約與實機清單 | 完成 | `README.md`、`TECHNICAL_DECISIONS.md`、`classroom-rbc-racer-tzk.md`、`codex-devp-cmd.md`、`tests/stable-mobile-manual-test-checklist.md` |

---

# 三、實際測試環境

| 項目 | 內容 |
| --- | --- |
| 作業系統 | Windows 本地工作區 |
| 瀏覽器與版本 | Codex in-app Browser，Chromium 引擎，版本未由測試介面揭露 |
| 畫面解析度 | 390 × 844 直式、844 × 390 橫式、1280 × 720 桌面 |
| Three.js 版本 | r184 |
| 測試網址／啟動方式 | `python -m http.server 8000`，`http://127.0.0.1:8000/?input=mobile` 與 `/tests/unit-test.html` |

---

# 四、自動測試

| 測試命令或頁面 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- |
| `npm run test:stable` | 單元測試與 STABLE audit 全通過 | 210 passed、0 failed；9 audits passed、0 failed | PASS |
| `/tests/unit-test.html` | 瀏覽器測試全通過 | 210 passed、0 failed | PASS |
| `node --check` | 全部 JS／MJS 無語法錯誤 | 76 files syntax OK | PASS |
| `git diff --check` | 無空白或 patch 格式錯誤 | exit code 0 | PASS |
| Browser console | 無專案 warning／error | 0 warning、0 error | PASS |

手機新增測試涵蓋裝置描述、iOS／Android 判定、本機手機預覽限制、橫式判定、直式釋放控制、多點方向、快速 QTE、PAUSE、方向鎖定降級、共用輸入佇列與音量鍵映射。

---

# 五、手動驗收

| 驗收項目 | 操作步驟 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- | --- |
| 直式方向閘門 | 390 × 844 開啟手機預覽 | 顯示轉為橫式，遊戲不開始 | 遮罩可見、控制不可操作、計時未開始 | PASS |
| 橫式啟動 | 切換 844 × 390 並點擊開始 | 顯示完整開始按鈕並進入 PLAYING | 啟動畫面完整，成功進入 PLAYING | PASS |
| 固定視角 | 手機模式啟動後讀取診斷 | yaw／pitch 保持 0，視角圓形隱藏 | heading 0、pitch 0、VIEW reticle hidden | PASS |
| 觸控暫停 | 點擊 PAUSE | 進入 PAUSED 並顯示恢復畫面 | state PAUSED、overlay mode PAUSED | PASS |
| 暫停仍計時 | PAUSED 狀態等待 | 任務秒數仍繼續 | 212.4 秒下降至 206.1 秒 | PASS |
| 遊戲中轉直式 | 恢復後切換 390 × 844 | 自動暫停並顯示方向閘門 | PAUSED、PORTRAIT、guard visible | PASS |
| 桌面回歸 | 移除預覽參數並切換 1280 × 720 | 恢復桌面操作與滑鼠啟動文字 | DESKTOP_POINTER、手機控制 hidden | PASS |

上述為桌面瀏覽器 viewport 模擬與實際 DOM／互動檢查，不等同 Android 或 iOS 實機驗收。

---

# 六、發現的錯誤

| ID | 嚴重度 | 現象 | 重現步驟 | 原因 |
| --- | --- | --- | --- | --- |
| MOB-001 | P1 | 844 × 390 橫式啟動畫面的開始按鈕被裁切，無法從可視區啟動 | 本機以 `?input=mobile` 開啟後切為 844 × 390 | 共用窄螢幕規則將標題放大至 7rem，overlay 又禁止捲動 |

除 MOB-001 外，本次可執行範圍未發現其他錯誤。

---

# 七、修正內容

| Bug ID | 修正方式 | 修改檔案 | 回歸風險 |
| --- | --- | --- | --- |
| MOB-001 | 在手機橫式低高度斷點隱藏裝飾 O₂、縮小標題與間距，保留完整產品資訊、操作提示及開始按鈕 | `css/mobile.css` | 僅限 mobile landscape low-height；桌面規則不受影響 |

另加入 `100vw`／`100vh` 舊版 fallback，再由 `100dvw`／`100dvh` 覆寫，並固定行動版文字縮放比例，以降低舊版 iOS Safari viewport 與橫式字級放大的相容性風險。

---

# 八、修正後重測

| Bug ID | 原測試結果 | 重測結果 | 是否關閉 |
| --- | --- | --- | --- |
| MOB-001 | FAIL | 844 × 390 顯示完整開始按鈕，點擊後進入 PLAYING | 是 |

修正後再次執行完整 `npm run test:stable`、76 檔語法檢查與 `git diff --check`，全部通過。

---

# 九、數值與效能證據

| 指標 | 目標 | 實測 | 結果 |
| --- | --- | --- | --- |
| 自動測試 | 210／210 | 210／210 | PASS |
| 靜態稽核 | 9／9 | 9／9 | PASS |
| Browser console | 0 專案持續性錯誤 | 0 warning／error | PASS |
| 手機 FPS | 實機連續 60 秒不持續低於專案門檻 | 無實機資料 | 不適用 |
| 手機記憶體趨勢 | 無持續成長 | 無實機資料 | 不適用 |

手機 renderer 已套用 `mobileMaximumPixelRatio = 1.5` 與 `mobileRenderResolutionScale = 0.72`，但這是設定證據，不代替實機效能量測。

---

# 十、變更清單

- 新增：`css/mobile.css`
- 新增：`js/input/MobileControls.js`
- 新增：`tests/unit/mobileControls.test.js`
- 新增：`tests/stable-mobile-manual-test-checklist.md`
- 新增：`reports/2026-07-19-mobile-landscape-support-report.md`
- 修改：裝置偵測、遊戲輸入分流、HUD、集中設定、啟動畫面與自動測試。
- 修改：README、總案、技術決策、空機重建指令與報告模板。
- 刪除：無。
- 若已使用 Git，提交雜湊：尚未提交。

---

# 十一、殘餘風險

- Android Chrome 與 iOS／iPadOS Safari 尚未依實機清單驗收。
- 手機作業系統可能完全不向網頁提供硬體音量鍵事件；此時必須使用畫面 BP ＋／−。
- Fullscreen 與 Screen Orientation lock 的可用性及授權條件依平台而異；拒絕時只由方向閘門強制橫式。
- safe area、瀏覽器工具列展開收合、GPU 效能與長時間觸控仍需實機確認。
- 本次未推送或發布，遠端 GitHub 與 GitHub Pages 仍維持上一版。

---

# 十二、版本結論

本次授權的程式、文件、自動測試與本地瀏覽器互動驗證均已完成。結果 PASS 僅代表本地可執行範圍；發布前仍必須依 `tests/stable-mobile-manual-test-checklist.md` 分別完成 Android Chrome 與 iOS／iPadOS Safari 實機驗收。

**最終結果：** PASS
**是否允許發布或合併：** 否，本次未授權推送，且手機實機驗收尚未完成
