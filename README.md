# Project Aorta：大動脈計畫室

**副標：RBC RACER**

《Project Aorta：大動脈計畫室》是一款支援桌面與手機橫式瀏覽器的第一人稱血液循環賽車遊戲。玩家駕駛程序化紅血球，依序完成四段體循環與肺循環，在血管截面中閃避危害、取得增益，並在體微血管或肺泡微血管完成氣體交換。

- 正式遊戲：<https://kisaraki.github.io/Classroom-rbc-racer-tzk/>
- 瀏覽器測試：<https://kisaraki.github.io/Classroom-rbc-racer-tzk/tests/unit-test.html>
- GitHub：<https://github.com/kisaraki/Classroom-rbc-racer-tzk>

## 正式版本

| 項目 | 基線 |
| --- | --- |
| 正式名稱 | Project Aorta：大動脈計畫室 |
| 副標 | RBC RACER |
| 發布狀態 | STABLE |
| Version | 1.1（20260715） |
| 總案版本 | 3.6 |
| 技術決策附錄 | 1.7 |
| 最近驗證日期 | 2026-07-19 |
| 自動測試 | 210 passed、0 failed |
| 靜態稽核 | 9 passed、0 failed |
| 前一功能基線 | `e22cd963ed5bd12cca877200dd2f2238cff169fc` |
| STABLE 1.1 實作基線 | `363f4c9124448a013d4d7c12e3f3bf2eddc7444e` |
| STABLE 1.1 文件基線 | `74e0a439658f385239c87fae24dc6e1cacd95c32` |
| 行動橫式維護基線 | `ae383f8be4f45a9cac389837c4fae4795a3718fc` |
| 目前 main 基線 | `8afc81a5440b11df875343c6a7744b8d74a370b7` |
| 正式分支 | `main` |
| 部署方式 | GitHub Actions → GitHub Pages |
| 最近 Pages 部署 | Actions run `29672011743`，success |
| Three.js | 官方 r184，置於 `vendor/` |
| 執行架構 | HTML5、CSS3、Vanilla JavaScript ES Modules |

本 README、總案、技術決策、重建手冊、測試與版本報告共同構成不可退縮基線。後續異動必須保留上表實作提交與目前 main 基線，作為可回溯、可比對與可重建的固定參考點。

## 不可退縮契約

- 不使用 React、Vue、Angular、Phaser、Unity、後端、資料庫、bundler 或 runtime 套件。
- 不使用外部圖片、模型、影片或字型；模型、標示、紋理、小地圖與動畫均於執行時程序化產生。
- 正式 Three.js 固定為 r184，入口為 `vendor/three.module.js`，並保留 `three.core.js` 與 MIT 授權。
- 所有玩法、時間、機率、尺寸、碰撞與效能數值集中在 `js/config.js`。
- 四關由同一組 `LevelManager`、`VesselTrack`、`EntityManager`、`CollisionSystem` 與 `QTESystem` 資料驅動，不建立關卡專用核心分支。
- 世界模擬可因暫停、桌面 Pointer Lock 解除、手機轉為直式、QTE 或低血壓停滯而停止，但任務期限、QTE、狀態、冷卻與過場絕對時間繼續運行。
- 手機與平板必須使用橫式畫面；直式方向閘門不得讓遊戲開始或繼續駕駛。
- 手機採固定視角與 Pointer Events 觸控操作，不要求 Pointer Lock，也不得以觸控改變視角。
- 每次維護或空機還原都必須通過 `npm run test:stable`；不得以歷史報告代替實際測試。

## 四關路線

| 關卡 | 路線 | BP 100 基準時間 | 氣體交換 |
| --- | --- | ---: | --- |
| 1 | 體循環：腹部及下肢 | 5 分鐘 | 體微血管 10 次機會 |
| 2 | 肺循環 | 1.5 分鐘 | 肺泡微血管 20 次機會 |
| 3 | 體循環：頭部、胸部及上肢 | 3 分鐘 | 體微血管 10 次機會 |
| 4 | 肺循環：高危險關卡 | 1.5 分鐘 | 肺泡微血管 20 次機會 |

氣體交換只在體微血管與肺泡微血管發生。任一次成功即完成該關交換；全部機會失敗仍允許抵達終點，但保留失敗扣分。成功交換會在紅色與紅紫色 RBC 狀態間切換，並跨關與 checkpoint 保存。

## STABLE 行為

- 氣體交換期間，小地圖玩家標記固定在「組織」或「肺」節點，離開交換區後恢復沿 SVG 路線連續移動。
- 一般 `DEBUFF` 的 Score 與 HP 負值乘 2；致命 Wound 不套一般減益倍率。
- 同關每 5 隻瘧原蟲觸發 15 秒「血球破裂」，頭罩時間變為 3 倍，BP 上限降為 60，並以程序化水蒸氣模糊全畫面直到復原完成。
- 同關第 10 次 CO 碰撞觸發持續至該關結束的「CO 中毒」，氣體交換改為 O 與 C 各 9 次。
- 任務期限到達且尚未抵達時，播放乾扁紅血球送往肝臟工廠的 Time Out 結局；正好在期限抵達仍算成功。
- RBC 截面碰撞採十字線至機體下緣的垂直膠囊；增益／減益的完整程序化本體與標示牌均可成立碰撞。
- 開始按鈕立即顯示 Pointer Lock 等待狀態；拒絕、未支援或靜默逾時會顯示可重試錯誤。
- 手機啟動時略過 Pointer Lock，嘗試全螢幕與橫向方向鎖定；API 不可用時仍由橫式方向閘門確保操作。
- 直接以 `file://` 開啟時顯示靜態伺服器指引，不保留看似可用但無效的開始按鈕。
- 玩家畫面不顯示編號階段、build、FPS、內部 state、checkpoint seed 或其他開發診斷文字。
- 正式產品識別固定為「Project Aorta：大動脈計畫室／RBC RACER／STABLE／Version：1.1（20260715）」。

## 操作方式

### 桌面版

| 輸入 | 功能 |
| --- | --- |
| `↑ ↓ ← →` | 在目前血管截面移動 RBC |
| `Z` | 提高 BP 與速度；低血壓停滯時仍可使用 |
| `X` | 降低 BP 與速度；低血壓停滯時停用 |
| `O` | 氣體交換的氧氣輸入 |
| `C` | 氣體交換的二氧化碳輸入 |
| 滑鼠移動 | 改變視覺方向，不改變 RBC 機身位置 |
| `Esc` | 解除 Pointer Lock 並暫停世界模擬 |

WASD、滑鼠按鍵、滾輪與觸控板手勢不控制 RBC。

### 手機版

| 輸入 | 功能 |
| --- | --- |
| 畫面左下觸控十字 | 在目前血管截面上下左右移動 RBC，可多點形成斜向 |
| 硬體音量提高／降低鍵 | 嘗試提高／降低 BP 與速度 |
| 畫面 `BP ＋／−` | 音量鍵未由瀏覽器提供時的必要備援 |
| 畫面 `O／C` | 氣體交換快速連打 |
| 畫面 `PAUSE` | 暫停世界模擬 |

手機版固定前方視角，不提供滑動環視。由於 iOS Safari 與多數 Android 瀏覽器會將實體音量鍵保留給作業系統，網頁不一定能收到 `AudioVolumeUp`／`AudioVolumeDown`；遊戲仍會攔接瀏覽器有提供的事件，並永久保留畫面 BP 備援鍵，避免無法控制速度。

## 執行需求

- 桌面版 Chrome、Edge 或 Firefox：需要鍵盤、滑鼠、WebGL、ES Modules 與 Pointer Lock。
- Android：以 Chrome 橫式為主要目標；需要 Pointer Events、WebGL 與 ES Modules。
- iOS／iPadOS：以 Safari 橫式為主要目標；方向鎖定或一般元素全螢幕不可用時會自動降級為橫式方向閘門。
- 桌面最低驗收解析度 1280 × 720，參考解析度 1920 × 1080；手機只支援橫式可視區域。
- 遊玩不需 Node.js、npm install、build 或後端服務。
- 執行命令列測試時需要 Node.js。
- 本機啟動需要 Python 3 或其他靜態檔案伺服器。

## 本機啟動

Windows 可直接執行：

```text
start-local.cmd
```

或在倉庫根目錄執行：

```powershell
python -m http.server 8000
```

開啟：

- 遊戲：<http://127.0.0.1:8000/>
- 本機手機模式預覽：<http://127.0.0.1:8000/?input=mobile>
- 瀏覽器測試：<http://127.0.0.1:8000/tests/unit-test.html>
- 過場預覽：<http://127.0.0.1:8000/tests/phase-09-cutscene-preview.html>

不得直接雙擊 `index.html`。瀏覽器會阻擋由 `file://` 載入的 ES Modules；`js/entryGuard.js` 只負責顯示此傳輸層錯誤，不包含遊戲邏輯。

`?input=mobile` 只在 `localhost` 與 `127.0.0.1` 生效，供桌面瀏覽器切換視窗尺寸檢查手機 UI；GitHub Pages 與其他主機會忽略此覆寫，不能取代 Android／iOS 實機驗收。

## 自動驗證

完整 STABLE gate：

```powershell
npm run test:stable
```

個別入口：

```powershell
npm test
npm run test:audit
```

預期結果：

```text
Summary: 210 passed, 0 failed, 210 total.
STABLE audit: 9 passed, 0 failed.
```

測試涵蓋四關路線、駕駛時間、10／20 次交換機會、一次成功、全部失敗可通過、紅／紅紫狀態、checkpoint、絕對期限、暫停、BP、碰撞、標示牌、累積危害、Time Out、過場、資源釋放、物件池、固定 seed、手機裝置描述、橫式閘門、多點觸控、O／C、音量鍵映射與桌面啟動錯誤處理。

稽核會阻擋外部 runtime 媒體、CDN、framework、後端、資料庫、套件依賴、非相對模組路徑、關卡核心分叉、未集中數值、Three.js 雜湊漂移及 Pages 子路徑錯誤。

## 程式架構

| 路徑 | 責任 |
| --- | --- |
| `js/config.js` | 唯一可調整數值來源 |
| `js/data/levels.js` | 四關路線語意與設定組裝 |
| `js/core/` | Game、Clock、Loop、Session、狀態機與關卡流程 |
| `js/world/` | 程序化血管、局部框架、模型與批次資產 |
| `js/player/` | RBC 本體、駕駛、反光、標示與頭罩 |
| `js/systems/` | BP、生成、碰撞、QTE、Score 與狀態效果 |
| `js/input/` | 鍵盤、手機觸控、音量鍵映射、滑鼠視角與 Pointer Lock |
| `js/ui/` | HUD、循環圖、儀表與訊息 |
| `js/cutscenes/` | 轉場與各類結局 |
| `tests/` | Node／瀏覽器共用測試與靜態稽核 |
| `reports/` | 歷史開發與正式版本的結果證據 |
| `vendor/` | 固定版本 Three.js 與授權 |

## 文件與空機重建

| 文件 | 作用 |
| --- | --- |
| `classroom-rbc-racer-tzk.md` | 3.6 版完整總案、玩法、架構、驗收與重建契約 |
| `TECHNICAL_DECISIONS.md` | 1.7 版已決策的時間、路線、碰撞、QTE、BP、手機輸入與資料所有權 |
| `codex-devp-cmd.md` | RESTORE／MAINTAIN／REBUILD 空機操作手冊 |
| `CIRCULATION_TERMINOLOGY.md` | 台灣教材術語與內部 ID 對照 |
| `reports/stable-1.1-release-report.md` | Version 1.1 實作、驗證與發布結果 |
| `reports/2026-07-19-mobile-landscape-support-report.md` | 手機橫式支援、觸控、音量鍵備援與 PR #2 維護報告 |
| `tests/stable-manual-test-checklist.md` | 自動與真人驗收矩陣 |

已存在完整倉庫時，預設使用 `RESTORE` 或 `MAINTAIN`。只有原始碼確實遺失、損壞無法修復，或使用者明確要求從零重建時，才在新的空目錄依現行總案與測試契約執行 `REBUILD`。Phase 00–10 報告只保存開發史；STABLE 後採版本維護，不再新增編號階段。

簡報、截圖、錄影、瀏覽器 profile 與其他非 runtime 證據必須放在相鄰的 `../deliverables/`，不得進入 GitHub Pages 部署根目錄。

## 生物學術語

繁體中文循環術語以《選修生物(Ⅲ)備課用書》第 2 章為準。教材檔案 SHA-256：

```text
0CE4CBA49040595EAD5E8202AFB87236148469822C1B25A7DB4B277777E51D14
```

玩家可見名稱使用「體循環、肺循環、充氧血、減氧血、微血管、肺泡微血管」。穩定內部 ID 如 `SYSTEMIC`、`PULMONARY`、`TISSUE`、`LUNG` 不得任意改名，並須依 `CIRCULATION_TERMINOLOGY.md` 映射。

## GitHub Pages

`.github/workflows/deploy-pages.yml` 只在推送 `main` 或手動 dispatch 時執行。Build job 必須先通過 `npm run test:stable`，才可設定 Pages、上傳整個靜態站台並部署。

最近一次 main 部署由 PR #2 合併提交 `8afc81a5440b11df875343c6a7744b8d74a370b7` 觸發，GitHub Actions run `29672011743` 結果為 success。

正式驗證 URL：

```text
https://kisaraki.github.io/Classroom-rbc-racer-tzk/
https://kisaraki.github.io/Classroom-rbc-racer-tzk/tests/unit-test.html
```

兩個入口都必須在 repository 子路徑運作，不能只驗證網域根路徑。

## 效能與人工驗收

| 指標 | 上限／下限 |
| --- | ---: |
| 持續 FPS | 至少 30 |
| Draw calls | 最多 30 |
| Triangles | 最多 20,000 |
| 長時間樣本 | 60 秒 |
| 可量測的 JS heap 成長 | 最多 16 MB |

Phase 10 是最近一次 Chrome、Edge、Firefox、兩種桌面解析度與完整效能量測歷史基線。STABLE 1.1 手機維護版已通過 Node、靜態稽核與模擬視窗煙霧測試；三種桌面瀏覽器完整駕駛、Pointer Lock、Android Chrome、iOS Safari、硬體音量鍵可見性、碰撞手感與 60 秒效能仍應在目標實機依手動清單複驗，不得由設定值推論為已執行。

## Three.js Vendor

固定版本：r184／套件版本 0.184.0。

| 檔案 | SHA-256 |
| --- | --- |
| `vendor/three.module.js` | `61134198639a10885daf893fb29669ca26386e2a4cde76e8399f51e329f741f2` |
| `vendor/three.core.js` | `368dc78835287709a48939e8eb9a7a61d0732098bdf916e56840d458aae9ccf3` |
| `vendor/THREE-LICENSE.txt` | `8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc` |

官方來源：<https://github.com/mrdoob/three.js/tree/r184>

## 授權

《Project Aorta：大動脈計畫室》原始專案檔案採用 MIT License，授權文字保存在 `LICENSE`。

Three.js 依其上游 MIT License 使用，授權文字保存在 `vendor/THREE-LICENSE.txt`。
