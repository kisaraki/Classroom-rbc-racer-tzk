# RBC Racer 技術決策附錄

**附錄版本：** 1.1  
**對應總案版本：** 2.3  
**決策日期：** 2026-07-14  
**適用文件：** `classroom-rbc-racer-tzk.md`

---

# 一、文件定位

本附錄將總案中的玩法需求轉換為可直接實作與測試的技術契約。

若本附錄與舊版總案衝突，以 2.3 版總案及本附錄為準。醫學資料只用於校準循環方向、相對路徑與教育表述；遊戲時間、世界單位、BP、傷害和生成機率仍是遊戲化數值，不代表真實生理量測。

---

# 二、決策摘要

| 編號 | 決策 |
| --- | --- |
| TD-001 | 所有前進位置統一使用世界單位 `distanceAlongTrack` |
| TD-002 | 所有碰撞半徑統一使用 `collisionRadius`，縱向採掃掠判定 |
| TD-003 | 第一版使用多段 `TrackSection` 與固定半徑 `TubeGeometry` 組成變徑血管 |
| TD-004 | 世界模擬可停止，但所有狀態倒數、冷卻與 QTE 截止時間持續運行 |
| TD-005 | 第四關酒精總權重倍率為 `2.5 × 2 = 5`；安全 BP Wound 沿用指數公式 |
| TD-006 | 組織設 10 個、肺設 20 個氣體交換機會；任一次成功即完成，全部失敗仍可過關 |
| TD-007 | 補齊 `TRANSFER_CUTSCENE → LEVEL_COMPLETE → 下一關／VICTORY` |
| TD-008 | 新增 `GameClock`、`LevelManager` 與可重現亂數工具 |
| TD-009 | 四關基準駕駛時間為 5、1.5、3、1.5 分鐘 |
| TD-010 | 先完成第一關端到端垂直切片，再資料化擴展其餘三關 |
| TD-011 | Three.js 固定使用官方 r184，正式版保留 MIT 授權與來源雜湊 |
| TD-012 | `js/config.js` 是所有可調整遊戲數值的唯一來源 |
| TD-013 | 每一階段必須完成測試、修正、重測與 PASS 報告後才能進入下一階段 |
| TD-014 | 氣體交換只在組織或肺區段觸發，不在心臟、一般動脈或靜脈建立保底事件 |
| TD-015 | 成功交換切換 RBC 紅／紅紫狀態，並由跨關資料與 checkpoint 保存 |

## 2.1 Three.js 版本鎖定

- 使用官方 `r184`，對應開發套件版本 `0.184.0`。
- CDN 僅供開發，網址必須明確指定版本，不得使用 `latest`。
- 正式版以 `vendor/three.module.js` 為入口，並同步保存該檔在 r184 相對匯入的 `vendor/three.core.js`。
- 同步保存 `vendor/THREE-LICENSE.txt`，README 記錄官方 tag、下載來源與三個檔案的 SHA-256。
- 未完成相容性回歸測試前不得升版。

版本依據：[Three.js 官方 GitHub Releases](https://github.com/mrdoob/three.js/releases)

---

# 三、賽道座標契約

## 3.1 唯一真實位置

玩家與所有賽道實體均使用：

```javascript
{
  distanceAlongTrack,
  previousDistanceAlongTrack,
  lateralX,
  lateralY,
  collisionRadius
}
```

定義：

- `distanceAlongTrack`：沿曲線累積的世界單位距離，範圍為 `0～trackLength`。
- `previousDistanceAlongTrack`：前一影格的累積距離，只供掃掠碰撞使用。
- `lateralX`、`lateralY`：目前 `TrackSection` 截面的局部偏移。
- `collisionRadius`：截面碰撞半徑。

`progress`、`trackProgress` 不得作為可變遊戲狀態。曲線取樣時才計算：

```javascript
const normalizedProgress = clamp(
  distanceAlongTrack / trackLength,
  0,
  1
);
```

## 3.2 曲線框架

每條賽道建立後預先快取中心點、切線及平行傳輸框架。玩家模型、攝影機、實體及血管網格必須使用同一組框架，避免各自計算造成扭轉或截面方向不一致。

---

# 四、血管幾何決策

Three.js 標準 `TubeGeometry` 的建構參數只有一個固定 `radius`。第一版不得為整條變徑血管只建立一個 `TubeGeometry`。

實作方式：

1. `LevelManager` 將路線拆為多個 `TrackSection`。
2. 每個 `TrackSection` 使用固定半徑的 `TubeGeometry`。
3. 相鄰區段重疊 0.5～1.0 世界單位，並使用短過渡段降低接縫可見度。
4. 顏色、Location、生成規則及小地圖進度均由同一份區段資料驅動。
5. 若後續驗收要求連續平滑變徑，再以自訂 `BufferGeometry` 取代，不列入第一版必要範圍。

建議遊戲半徑：

| 區段 | 半徑 |
| --- | ---: |
| 心房／心室 | 6.5 |
| 主動脈／大靜脈 | 5.5 |
| 主要動脈／肺動脈／肺靜脈 | 5.0 |
| 小動脈 | 4.0 |
| 微血管 | 3.2～3.4 |
| 小靜脈 | 3.8 |

這些是遊戲空間比例，不是血管實際直徑。

---

# 五、時間與狀態契約

## 5.1 兩種時間

```javascript
simulationDeltaSeconds = Math.min(rawDeltaSeconds, 0.1);
nowMs = performance.now();
```

- `simulationDeltaSeconds`：只用於玩家前進、截面移動、世界生成、碰撞與世界動畫。
- `nowMs`：用於 QTE、低血壓停滯、冷卻、酒精、瘧原蟲、輸入延遲與提示期限。

所有倒數均儲存絕對截止時間：

```javascript
remainingSeconds = Math.max(
  0,
  (expiresAtMs - nowMs) / 1000
);
```

不得使用已限制為 0.1 秒的模擬 delta 倒扣狀態時間。

## 5.2 狀態矩陣

| 主狀態 | 世界移動／生成／碰撞 | 可接受遊戲輸入 | 所有倒數與冷卻 | Renderer／HUD |
| --- | --- | --- | --- | --- |
| PLAYING | 執行 | 方向鍵、Z、X | 繼續 | 繼續 |
| QTE | 停止 | O、C | 繼續 | 繼續 |
| LOW_BP_STASIS | 停止 | Z | 繼續 | 繼續 |
| PAUSED | 停止 | 僅恢復操作 | 繼續 | 繼續 |
| TRANSFER_CUTSCENE | 僅過場更新 | 禁用 | 繼續 | 繼續 |
| GAME_OVER／VICTORY | 停止 | 選單操作 | 繼續至清除 | 繼續 |

高低血壓的每秒生成判定屬於世界模擬，只在 `PLAYING` 執行；它不是狀態倒數。

## 5.3 暫停與分頁切換

- `PAUSED` 保存 `pausedFromState`。
- QTE 或狀態效果可在暫停期間到期。
- 到期結果先記為 pending，恢復遊戲時由狀態機安全套用。
- 分頁隱藏期間 `requestAnimationFrame` 可能暫停；回到頁面後必須用絕對截止時間同步，不得補跑世界模擬。
- 在非 `PLAYING` 狀態到期的酒精延遲操作直接丟棄，不得於恢復後集中執行。

---

# 六、第四關機率與倍率

## 6.1 Wound

```javascript
function getWoundChance(bp, level) {
  const baseChance =
    0.005 * Math.exp((bp - 130) / 15);

  if (level === 4 && bp >= 80) {
    const levelMultiplier = bp > 130 ? 3 : 1;
    return Math.min(
      0.45,
      baseChance * levelMultiplier
    );
  }

  if (bp <= 130) return 0;

  return Math.min(0.45, baseChance);
}
```

第四關安全 BP 80～130 沿用同一指數公式，不套三倍倍率；BP 130 時為每秒 0.5％。BP 大於 130 時才在公式結果套用三倍倍率，不再額外加上 0.5％。

| BP | 第四關每秒 Wound 機率 |
| ---: | ---: |
| 80 | 約 0.018％ |
| 100 | 約 0.068％ |
| 130 | 0.5％ |
| 131 | 約 1.60％ |
| 150 | 約 5.69％ |

## 6.2 第四關生成權重

酒精屬於一般減益，先乘一般減益倍率，再乘酒精額外倍率：

```javascript
level4AlcoholWeight =
  baseAlcoholWeight * 2.5 * 2;
```

第四關實際選擇權重：

| 物件 | 計算 | 權重 |
| --- | --- | ---: |
| Vitamin C | `18 × 0.7` | 12.6 |
| Vitamin B12 | `14 × 0.7` | 9.8 |
| Iron | `14 × 0.7` | 9.8 |
| Carbon Monoxide | `20 × 2.5` | 50 |
| Malaria | `10 × 2.5` | 25 |
| Alcohol | `16 × 2.5 × 2` | 80 |
| Empty | `8` | 8 |

抽取前以權重總和正規化。為避免不可玩情況，最多連續產生兩個同類減益物件，且同一截面必須保留至少一條可通行路徑。

---

# 七、QTE 與過關契約

Gas Token 只位於組織或肺交換區，且是不可略過的縱向觸發區；畫面中的 Token 模型只是視覺提示，不使用 lateral 碰撞決定是否觸發。組織區由 config 產生 10 個等距機會，肺區產生 20 個等距機會。

```javascript
const GasExchangeStatus = Object.freeze({
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED"
});
```

規則：

1. 關卡開始時狀態為 `PENDING`，嘗試次數為 0。
2. 任一機會失敗後，若交換區仍有下一個機會，狀態維持 `PENDING`。
3. 組織 10 次或肺 20 次機會全部失敗後設為 `FAILED`，維持交換前血管與機身顏色並允許通關。
4. 任一機會成功即設為 `SUCCESS`，移除所有尚未觸發的機會並套用交換後血管顏色。
5. 成功時 RBC 原紅色切為紅紫色，紅紫色切回原紅色；該狀態跨關並保存於 checkpoint。
6. 終點只接受 `SUCCESS` 或 `FAILED`；不得在組織或肺交換區外建立保底 QTE。
7. 成功或失敗結果顯示 0.8 秒；該期限在 PAUSED 中仍繼續。

---

# 八、完整狀態流程

```text
BOOT
→ TITLE
→ INSTRUCTIONS
→ LEVEL_INTRO
→ PLAYING

PLAYING
├─ Gas Trigger → QTE → PLAYING
├─ 低血壓 → LOW_BP_STASIS → PLAYING
├─ 暫停 → PAUSED → pausedFromState
├─ HP <= 0 → GAME_OVER_RECYCLE
├─ Wound → GAME_OVER_FALL／GAME_OVER_STROKE
└─ 抵達終點
   → TRANSFER_CUTSCENE
   → LEVEL_COMPLETE
   ├─ Level 1～3 → 下一關 LEVEL_INTRO
   └─ Level 4 → VICTORY
```

`LEVEL_COMPLETE` 負責結算、保存下一關 checkpoint、清除本關物件與狀態，並決定下一個狀態。

---

# 九、關卡節奏與比例

## 9.1 基準條件

基準速度為 BP 100 時的每秒 10 世界單位。下列時間是純駕駛時間，不含標題、關卡介紹、QTE、停滯、暫停、過場及結算。

| Level | 路線 | 基準時間 | `trackLength` |
| --- | --- | ---: | ---: |
| 1 | 下半身體循環 | 5 分鐘 | 3000 |
| 2 | 肺循環 | 1.5 分鐘 | 900 |
| 3 | 腦／上半身體循環 | 3 分鐘 | 1800 |
| 4 | 高危險肺循環 | 1.5 分鐘 | 900 |

第二與第四關各為 1.5 分鐘。玩家改變 BP 後，實際駕駛時間會依速度公式縮短或延長。

## 9.2 區段比例

### Level 1

| 區段 | 比例 | 距離範圍 |
| --- | ---: | ---: |
| 左心室 | 3％ | 0～90 |
| 主動脈 | 12％ | 90～450 |
| 降主動脈 | 25％ | 450～1200 |
| 下半身小動脈 | 15％ | 1200～1650 |
| 組織微血管 | 15％ | 1650～2100 |
| 小靜脈 | 10％ | 2100～2400 |
| 下大靜脈 | 15％ | 2400～2850 |
| 右心房／右心室 | 5％ | 2850～3000 |

### Level 2 與 Level 4

| 區段 | 比例 | 距離範圍 |
| --- | ---: | ---: |
| 右心室 | 5％ | 0～45 |
| 肺動脈 | 25％ | 45～270 |
| 肺泡微血管 | 35％ | 270～585 |
| 肺靜脈 | 25％ | 585～810 |
| 左心房／左心室 | 10％ | 810～900 |

### Level 3

| 區段 | 比例 | 距離範圍 |
| --- | ---: | ---: |
| 左心室 | 3％ | 0～54 |
| 主動脈 | 12％ | 54～270 |
| 頸動脈／鎖骨下動脈 | 20％ | 270～630 |
| 上半身小動脈 | 15％ | 630～900 |
| 腦／上半身微血管 | 20％ | 900～1260 |
| 小靜脈 | 10％ | 1260～1440 |
| 上大靜脈 | 15％ | 1440～1710 |
| 右心房／右心室 | 5％ | 1710～1800 |

這些比例保留「體循環較長、肺循環較短、腦循環具有高教育權重」的遊戲辨識度，不宣稱是真實血液通過時間。

---

# 十、生成、碰撞與平衡參數

## 10.1 一般生成

```javascript
ENTITY_SPAWN_INTERVAL_MIN = 8;
ENTITY_SPAWN_INTERVAL_MAX = 16;
ENTITY_SPAWN_AHEAD_MIN = 35;
ENTITY_SPAWN_AHEAD_MAX = 70;
ENTITY_DESPAWN_BEHIND = 20;
MAX_ACTIVE_ENTITIES = 24;
MIN_ENTITY_GAP = 2.5;
```

- `8～16` 是相鄰生成槽的縱向間距。
- `35～70` 是玩家前方可建立實體的視距範圍。
- 實體落後玩家 20 單位後回收到物件池。
- 每關使用 Mulberry32 與固定 32-bit seed；重新挑戰本關沿用 checkpoint seed。

| Level | Seed |
| --- | --- |
| 1 | `0x52424301` |
| 2 | `0x52424302` |
| 3 | `0x52424303` |
| 4 | `0x52424304` |

截面位置以 `sqrt(random())` 取樣半徑，再隨機取角度，使物件在可用圓面積內均勻分布，而不是集中在中心。

基準生成槽約為 Level 1：250、Level 2：75、Level 3：150、Level 4：75，實際物件數仍受 `empty` 權重及區段限制影響。

## 10.2 碰撞參數

| 對象 | `collisionRadius` |
| --- | ---: |
| Player RBC | 0.65 |
| Vitamin C／B12／Iron | 0.50 |
| CO | 0.55 |
| Malaria | 0.70 |
| Alcohol | 0.55 |
| Wound | 1.15 |

```javascript
WALL_MARGIN = 0.35;
COLLISION_WINDOW = 0.75;
MAX_ACTIVE_WOUNDS = 2;
MIN_WOUND_GAP = 45;
```

縱向碰撞必須檢查玩家前一影格與目前影格之間的掃掠範圍，避免高速度或 0.1 秒 delta 上限造成穿透。

Wound 落後玩家 10 單位且未碰撞時，計為一次成功閃避並回收到物件池。

---

# 十一、關卡資料最小結構

下列物件由 `levels.js` 組裝，但其中所有數值必須來自 `GAME_CONFIG.levels`，不得在 `levels.js` 直接宣告。

```javascript
{
  id,
  name,
  targetDriveSeconds,
  trackLength,
  seed,
  minimapPathId,
  sections: [
    {
      id,
      startDistance,
      endDistance,
      radius,
      colorStart,
      colorEnd,
      locationLabel,
      controlPoints,
      gasExchangeZone
    }
  ],
  multipliers: {
    buff,
    debuff,
    alcohol,
    wound
  }
}
```

關卡路徑、Location、血管顏色、半徑、QTE 區段與小地圖映射不得分散硬編碼於不同類別。

---

# 十二、重試與可重現性

進入關卡時保存：

```javascript
levelCheckpoint = {
  levelId,
  hp,
  score,
  seed
};
```

重新挑戰本關：

```javascript
hp = Math.max(
  levelCheckpoint.hp,
  GAME_CONFIG.checkpoint.retryMinimumHp
);
score = levelCheckpoint.score;
bp = 100;
distanceAlongTrack = 0;
previousDistanceAlongTrack = 0;
gasExchangeStatus = "PENDING";
gasExchangeAttempts = 0;
```

同時清除所有實體、碰撞佇列、延遲輸入、酒精、瘧原蟲、低血壓冷卻及 pending 狀態轉換。沿用相同 seed，使錯誤可重現並讓重試公平一致。

---

# 十三、測試基準

最低自動測試範圍：

1. 距離與 normalized progress 換算。
2. 掃掠縱向碰撞與截面碰撞。
3. BP 速度公式與高低血壓邊界。
4. 第四關 Wound 分段公式。
5. 第四關酒精總倍率為 5。
6. QTE 任一次成功、組織 10 次全失敗、肺 20 次全失敗仍可過關。
7. 所有倒數在 QTE、LOW_BP_STASIS、PAUSED 中繼續。
8. `TRANSFER_CUTSCENE` 後正確進入下一關或 VICTORY。
9. BP 100 時四關模擬駕駛時間誤差不超過 1％。
10. 相同 seed 產生相同的一般實體序列。

---

# 十四、數值集中與資料驅動

## 14.1 config.js 單一來源

以下可調整值只能在 `js/config.js` 宣告：

- HP、BP、速度、輸入與 QTE 數值。
- 時間、期限、冷卻、機率、倍率與權重。
- 賽道長度、區段比例、半徑、距離與 seed。
- 實體 Score、HP、碰撞半徑與生成限制。
- Three.js 顏色、畫面尺寸、DPR 與效能上限。
- 過場及動畫參數。

其他 JavaScript 模組必須匯入命名設定。不得在系統類別、`levels.js` 或 `entityTypes.js` 重複宣告相同數值。

允許存在的非設定數字只有語法與演算法必要值，例如 `0`、`1`、陣列索引、平方指數與 `Math.PI`。若改動該數字會影響玩法、平衡或驗收結果，它就不是結構常數，必須移至 `config.js`。

純 CSS 排版值集中於 `:root` CSS 自訂屬性；任何由 JavaScript 判定或會影響遊戲驗收的視覺數值仍放在 `config.js`。

## 14.2 levels.js 責任

`levels.js` 只負責：

- 關卡 ID、名稱及路線語意。
- 區段順序與 Location 顯示文字。
- 體循環或肺循環的氣體交換語意。
- 將 `GAME_CONFIG.levels` 與區段語意組裝成資料物件。

四關必須使用同一個 `LevelManager`、`VesselTrack`、`EntityManager`、`CollisionSystem` 與 `QTESystem`。禁止建立 `Level1Manager`、`Level2Manager` 等分叉類別。

---

# 十五、階段測試與結果報告

每一階段均執行以下流程：

1. 只實作該階段授權範圍。
2. 執行該階段可用的自動測試。
3. 在實際瀏覽器執行手動驗收。
4. 記錄發現的錯誤與重現方式。
5. 修正本階段錯誤。
6. 重新執行自動測試與手動驗收。
7. 依 `PHASE_REPORT_TEMPLATE.md` 提交 `reports/phase-XX-report.md`。
8. 報告結果為 PASS 後才可進入下一階段。

若存在未修正錯誤、未執行測試、測試結果不明或提前實作後續功能，報告必須標示 BLOCKED，不得開始下一階段。

---

# 十六、醫學校準依據

- 人體循環分為體循環與肺循環，兩者經四個心腔串接；本案關卡方向依此安排：[NCBI Bookshelf：How does the blood circulatory system work?](https://www.ncbi.nlm.nih.gov/books/NBK279250/)
- 肺循環接收右心輸出的全部血流，屬低壓、低阻力系統，主肺動脈路徑也相對短；因此肺循環關卡設定得比體循環短：[NCBI Bookshelf：Physiology, Pulmonary Circulatory System](https://www.ncbi.nlm.nih.gov/books/NBK525948/)
- 肺循環阻力約為體循環的十分之一；本案只用此概念表達相對路徑與視覺，不把遊戲 BP 當作臨床值：[NCBI Bookshelf：Physiology, Pulmonary Vascular Resistance](https://www.ncbi.nlm.nih.gov/books/NBK554380/)
- 腦部約接收 15～20％心輸出量，且具有高度代謝需求；第三關因此保留較長的教育與操作時間：[NCBI Bookshelf：The Cerebral Circulation](https://www.ncbi.nlm.nih.gov/books/NBK53083/)
- 紅血球可通過極小血管；本案微血管半徑仍刻意放大，以維持第一人稱閃避玩法：[NCBI Bookshelf：Blood Groups and Red Cell Antigens](https://www.ncbi.nlm.nih.gov/books/NBK2263/)

上述資料不支持把 5、1.5、3、1.5 分鐘解讀成真實循環時間；它們是依關卡長短、教育權重與遊戲節奏制定的基準。
