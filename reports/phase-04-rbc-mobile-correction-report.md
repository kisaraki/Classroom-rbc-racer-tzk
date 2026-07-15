# Phase 04 RBC 尺寸與手機啟動攔截修正報告

- 日期：2026-07-14
- 範圍：Phase 04 驗收後操作性與裝置支援修正
- 程式提交：`c390df8`
- 結果：PASS

## 1. 修正需求

1. RBC 相對血管過大，縮小車身與實際碰撞範圍，增加迴避空間。
2. 車身上的 RBC 字樣過大且超出顯示範圍，縮小並完整顯示。
3. 遊戲不支援手機；啟動時辨識手機或平板，顯示拒絕畫面且不執行遊戲。

## 2. RBC 與碰撞體

| 項目 | 修正前 | 修正後 | 說明 |
| --- | ---: | ---: | --- |
| RBC 視覺外半徑 | 1.20 | 1.02 | 縮小 15% |
| 玩家碰撞半徑 | 0.65 | 0.55 | 與視覺模型同比例縮小約 15% |
| 微血管可用中心偏移 | 2.20 | 2.30 | 半徑 3.20、牆面留白 0.35 |
| 大血管可用中心偏移 | 4.50 | 4.60 | 半徑 5.50、牆面留白 0.35 |
| 駕駛艙鼻部 X 比例 | 2.25 | 1.92 | 與車身同步收窄 |
| 瘧疾遮罩 X 比例 | 1.28 | 1.08 | 保持與新駕駛艙相符 |

- 車身厚度、輪緣、駕駛艙鼻部、飾環及瘧疾遮罩均依相同比例調整。
- 所有尺寸仍集中在 `js/config.js`，未改變血管、關卡、實體或血壓速度資料。
- 碰撞測試確認微血管中的最大側向中心位置由 2.20 增加至 2.30。

## 3. RBC 程序化標示

- 程序化貼圖的邏輯尺寸為 25 x 13，長寬比約 1.923。
- 修正前顯示面為 1.08 x 0.36，長寬比 3.000，會把字樣橫向拉寬。
- 修正後顯示面為 0.62 x 0.32，長寬比 1.938，與貼圖誤差低於 0.02。
- 駕駛艙標示位置由 `[0, -0.96, -1.66]` 調整為
  `[0, -0.82, -1.80]`，縮小、上移並稍微後退。
- 透視投影測試逐一驗證標示四個角點，全部位於第一人稱攝影機可視範圍內。
- 車身標示與駕駛艙標示共用同一個程序化 DataTexture，未加入外部圖片或字型。

## 4. 手機啟動攔截

啟動順序已改為先執行 `DeviceSupport`，再決定是否動態載入 `Game`：

1. 優先讀取 `navigator.userAgentData.mobile`。
2. 後備比對 iPhone、iPad、iPod、Android、Windows Phone、Opera Mini
   及一般 `Mobi` user agent。
3. 以 `MacIntel` 與多點觸控組合辨識使用桌面 user agent 的 iPadOS。
4. Android 平板也予以攔截，因遊戲需要鍵盤、滑鼠與 Pointer Lock。

辨識為手機或平板時：

- `Game` 模組不會被動態匯入，Three.js 場景不會建立。
- 遊戲狀態設為 `UNSUPPORTED`，`data-game-initialized` 維持 `false`。
- Canvas、HUD、操作說明及開始按鈕隱藏。
- 顯示「不支援手機」拒絕畫面，說明應改用桌上型或筆記型電腦。
- 未建立 `GameClock`，因此不會啟動遊戲計時器。
- 視窗寬度不作為手機判斷依據；窄視窗桌機仍可正常啟動。

## 5. 自動測試

執行：

```text
npm test
```

結果：

```text
109 passed, 0 failed, 109 total
```

本次新增 8 項回歸測試：

- RBC 微血管迴避空間、視覺半徑與碰撞半徑。
- RBC 標示貼圖比例及四角攝影機投影範圍。
- 桌機 user agent 保持支援。
- Mobile Client Hint 在 user agent 後備判斷前攔截。
- iPhone 與 Android 手機 user agent 攔截。
- Android 平板與桌面 user agent iPadOS 攔截。
- 拒絕畫面隱藏遊戲控制並保持未初始化。
- 拒絕畫面缺少必要 DOM 時明確報錯。

所有 JavaScript 與 MJS 檔案亦通過 `node --check`。

## 6. 瀏覽器驗證

| 驗證環境 | 驗證內容 | 結果 |
| --- | --- | --- |
| 本機共享瀏覽器測試 | 與 Node 共用的 109 項測試 | PASS |
| 本機 1280 x 720 桌機 | READY、尺寸診斷、無水平溢位、啟動畫板完整 | PASS |
| 本機 390 x 844 桌機 UA | 不以視窗寬度誤判手機、正常初始化、無水平溢位 | PASS |
| Chrome 自動化點擊 | Pointer Lock 被測試介面拒絕時安全進入 PAUSED | PASS |
| GitHub Pages 1280 x 720 | READY、RBC 1.02 / 0.55、標示 0.62 x 0.32 | PASS |
| GitHub Pages 共享測試 | 109 passed、0 failed | PASS |

手機 Client Hint、手機 user agent、Android 平板及 iPadOS 的攔截由同一份
Node／瀏覽器共享測試覆蓋；未把窄桌機視窗誤判為手機。

## 7. 部署證據

- GitHub Actions：`Deploy GitHub Pages` 執行編號 `29346230041`，結果
  `success`。
- 正式遊戲：<https://kisaraki.github.io/Classroom-rbc-racer-tzk/>
- 線上測試：<https://kisaraki.github.io/Classroom-rbc-racer-tzk/tests/unit-test.html>
- 正式站診斷確認 `data-game-initialized="true"`、
  `data-device-support="SUPPORTED"`、視覺半徑 `1.02`、碰撞半徑
  `0.55`、標示 `0.62 x 0.32`。

## 8. 變更檔案

- `js/config.js`
- `js/core/DeviceSupport.js`
- `js/main.js`
- `js/core/Game.js`
- `js/player/PlayerRBC.js`
- `js/player/HoodController.js`
- `js/data/schemas.js`
- `css/menu.css`
- `index.html`
- `tests/unit/deviceSupport.test.js`
- `tests/unit/playerRbc.test.js`
- 共享測試入口與靜態資源版本碼引用檔案

## 9. 結論

RBC 車身、碰撞體與第一人稱駕駛艙已適度縮小，程序化 RBC 字樣保持完整
比例並落在可視範圍內。手機與平板會在 Three.js 與遊戲計時器建立前被攔截；
桌機窄視窗仍可執行。既有 Phase 04 實體、碰撞、HUD、血壓控制及 Real Clock
功能均維持相容。
