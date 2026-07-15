# Project Aorta：大動脈計畫室 技術決策附錄

**附錄版本：** 1.6

**對應總案版本：** 3.5

**前一功能基線：** `e22cd963ed5bd12cca877200dd2f2238cff169fc`

**STABLE 1.1 實作基線：** `363f4c9124448a013d4d7c12e3f3bf2eddc7444e`

**產品狀態：** STABLE／Version 1.1（20260715）

**決策日期：** 2026-07-15

**適用文件：** `classroom-rbc-racer-tzk.md`

**術語基準：** `CIRCULATION_TERMINOLOGY.md`

---

# 一、文件定位

本附錄將總案中的玩法需求轉換為可直接實作與測試的技術契約。

若本附錄與舊版總案衝突，以 3.5 版總案及本附錄為準。循環系統繁體中文術語以 `CIRCULATION_TERMINOLOGY.md` 指定的台灣教材為準。醫學資料只用於校準循環方向、相對路徑與教育表述；遊戲時間、世界單位、BP、傷害和生成機率仍是遊戲化數值，不代表真實生理量測。

---

# 二、決策摘要

| 編號 | 決策 |
| --- | --- |
| TD-001 | 所有前進位置統一使用世界單位 `distanceAlongTrack` |
| TD-002 | 實體本體半徑統一使用 `collisionRadius`；玩家截面與標示牌依可見輪廓，縱向採掃掠判定 |
| TD-003 | 第一版使用多段 `TrackSection` 與固定半徑 `TubeGeometry` 組成變徑血管 |
| TD-004 | 世界模擬可停止，但所有狀態倒數、冷卻與 QTE 截止時間持續運行 |
| TD-005 | 第四關酒精總權重倍率為 `2.5 × 2 = 5`；安全 BP Wound 沿用指數公式 |
| TD-006 | 體微血管設 10 個、肺泡微血管設 20 個氣體交換機會；任一次成功即完成，全部失敗仍可過關 |
| TD-007 | 補齊 `TRANSFER_CUTSCENE → LEVEL_COMPLETE → 下一關／VICTORY` |
| TD-008 | 新增 `GameClock`、`LevelManager` 與可重現亂數工具 |
| TD-009 | 四關基準駕駛時間為 5、1.5、3、1.5 分鐘 |
| TD-010 | 先完成第一關端到端垂直切片，再資料化擴展其餘三關 |
| TD-011 | Three.js 固定使用官方 r184，正式版保留 MIT 授權與來源雜湊 |
| TD-012 | `js/config.js` 是所有可調整遊戲數值的唯一來源 |
| TD-013 | 每批變更必須完成測試、修正、重測與 PASS 報告；STABLE 後採 SemVer，不新增編號階段 |
| TD-014 | 氣體交換只在體微血管或肺泡微血管觸發，不在心臟、一般動脈或靜脈建立保底事件 |
| TD-015 | 成功交換切換 RBC 紅／紅紫狀態，並由跨關資料與 checkpoint 保存 |
| TD-016 | 玩家可見循環術語採教材的「充氧血／減氧血／微血管」；路線限定詞不得被描述為新的循環類型 |
| TD-017 | 氣體交換區的小地圖標記鎖定組織／肺節點，區外才使用連續 SVG 路徑百分比 |
| TD-018 | 一般 DEBUFF 的 Score 與 HP 負值乘 2，FATAL Wound 不套倍率 |
| TD-019 | 每關每 5 隻瘧原蟲觸發 15 秒血球破裂與 BP 上限 60；每 10 次 CO 碰撞觸發持續性 CO 中毒與 O/C 各 9 次 |
| TD-020 | 任務逾時只在尚未抵達終點時成立，跨 deadline 的 simulation delta 必須切在截止時間 |
| TD-021 | 瘧原蟲頭罩期間以程序化蒸氣模糊全畫面，直到絕對期限與復原動畫完成 |
| TD-022 | 玩家畫面移除編號階段、build 與系統診斷文字，內部 data attributes 仍可供自動驗證 |
| TD-023 | 開始按鈕立即顯示 Pointer Lock 等待狀態；靜默失敗依集中期限轉為可重試錯誤，`file://` 則提供靜態伺服器指引 |
| TD-024 | RBC 截面採十字線至機體下緣的垂直膠囊；增益／減益以完整本體與標示牌聯集判定碰撞 |
| TD-025 | 正式名稱、副標、STABLE、Version 1.1 與發布日期集中於 `GAME_CONFIG.app`，現行 gate 統一命名為 `test:stable` |

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

Gas Token 只位於體微血管或肺泡微血管交換區，且是不可略過的縱向觸發區；畫面中的 Token 模型只是視覺提示，不使用 lateral 碰撞決定是否觸發。體微血管區由 config 產生 10 個等距機會，肺泡微血管區產生 20 個等距機會。

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
3. 體微血管 10 次或肺泡微血管 20 次機會全部失敗後設為 `FAILED`，維持交換前血管與機身顏色並允許通關。
4. 任一機會成功即設為 `SUCCESS`，移除所有尚未觸發的機會並套用交換後血管顏色。
5. 成功時 RBC 在代表充氧血的原紅色與代表減氧血的紅紫色間切換；該狀態跨關並保存於 checkpoint。
6. 終點只接受 `SUCCESS` 或 `FAILED`；不得在體微血管或肺泡微血管交換區外建立保底 QTE。
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
| 1 | 體循環（腹部及下肢） | 5 分鐘 | 3000 |
| 2 | 肺循環 | 1.5 分鐘 | 900 |
| 3 | 體循環（頭部、胸部及上肢） | 3 分鐘 | 1800 |
| 4 | 肺循環（高危險關卡） | 1.5 分鐘 | 900 |

第二與第四關各為 1.5 分鐘。玩家改變 BP 後，實際駕駛時間會依速度公式縮短或延長。

## 9.2 區段比例

### Level 1

| 區段 | 比例 | 距離範圍 |
| --- | ---: | ---: |
| 左心室 | 3％ | 0～90 |
| 主動脈 | 12％ | 90～450 |
| 主動脈分支（腹部及下肢） | 25％ | 450～1200 |
| 腹部及下肢的小動脈 | 15％ | 1200～1650 |
| 腹部及下肢的微血管網 | 15％ | 1650～2100 |
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
| 頭部、胸部及上肢的小動脈 | 15％ | 630～900 |
| 頭部、胸部及上肢的微血管網 | 20％ | 900～1260 |
| 小靜脈 | 10％ | 1260～1440 |
| 上大靜脈 | 15％ | 1440～1710 |
| 右心房／右心室 | 5％ | 1710～1800 |

這些比例保留「體循環較長、肺循環較短、第三關腦部血管具有高教育權重」的遊戲辨識度，不宣稱是真實血液通過時間。

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
| Player RBC 膠囊寬度半徑 | 0.55 |
| Vitamin C | 0.77 |
| Vitamin B12 | 0.81 |
| Iron | 0.80 |
| CO | 0.75 |
| Malaria | 1.19 |
| Alcohol | 1.08 |
| Wound | 1.15 |

```javascript
WALL_MARGIN = 0.35;
COLLISION_WINDOW = 0.75;
MAX_ACTIVE_WOUNDS = 2;
MIN_WOUND_GAP = 45;
```

縱向碰撞必須檢查玩家前一影格與目前影格之間的掃掠範圍，避免高速度或 0.1 秒 delta 上限造成穿透。

玩家截面是外框從 `topOffsetY = 0` 到 `bottomOffsetY = -1.91` 的垂直膠囊，不得退回以十字線為圓心的單一圓。增益／減益本體先以各自半徑與膠囊判定；有標示牌者再以 `2.7 × 1.18`、向上位移 `1.35` 的矩形判定。兩者任一成立即消耗物件並套用效果。

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
6. QTE 任一次成功、體微血管 10 次全失敗、肺泡微血管 20 次全失敗仍可過關。
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
- 體微血管或肺泡微血管的氣體交換語意。
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
7. 依 `RELEASE_REPORT_TEMPLATE.md` 提交版本或變更報告。
8. 報告結果為 PASS 後才可進入下一階段。

若存在未修正錯誤、未執行測試、測試結果不明或提前實作後續功能，報告必須標示 BLOCKED，不得開始下一階段。

---

# 十六、醫學校準依據

繁體中文專有名詞的第一依據是 `CIRCULATION_TERMINOLOGY.md` 所記錄的《選修生物(Ⅲ)備課用書》第 2 章。教材 PDF 第 15、18 頁（課本第 36、37 頁）確認人體血液循環的兩個主要部分為體循環與肺循環，血液狀態稱為充氧血與減氧血，交換血管稱為體微血管或肺泡微血管。

下列資料只補充路徑比例與生理背景，不取代台灣教材的中文術語：

- 人體循環分為體循環與肺循環，兩者經四個心臟腔室串接；本案關卡方向依此安排：[NCBI Bookshelf：How does the blood circulatory system work?](https://www.ncbi.nlm.nih.gov/books/NBK279250/)
- 肺循環接收右心輸出的全部血流，屬低壓、低阻力系統，主肺動脈路徑也相對短；因此肺循環關卡設定得比體循環短：[NCBI Bookshelf：Physiology, Pulmonary Circulatory System](https://www.ncbi.nlm.nih.gov/books/NBK525948/)
- 肺循環阻力約為體循環的十分之一；本案只用此概念表達相對路徑與視覺，不把遊戲 BP 當作臨床值：[NCBI Bookshelf：Physiology, Pulmonary Vascular Resistance](https://www.ncbi.nlm.nih.gov/books/NBK554380/)
- 腦部約接收 15～20％心輸出量，且具有高度代謝需求；第三關因此保留較長的教育與操作時間：[NCBI Bookshelf：The Cerebral Circulation](https://www.ncbi.nlm.nih.gov/books/NBK53083/)
- 紅血球可通過極小血管；本案微血管半徑仍刻意放大，以維持第一人稱閃避玩法：[NCBI Bookshelf：Blood Groups and Red Cell Antigens](https://www.ncbi.nlm.nih.gov/books/NBK2263/)

上述資料不支持把 5、1.5、3、1.5 分鐘解讀成真實循環時間；它們是依關卡長短、教育權重與遊戲節奏制定的基準。

---

# 十七、STABLE 1.1 累積狀態與逾時契約

## 17.1 小地圖交換節點

交換區段由 `gasExchangeZone` 決定錨點，`TISSUE` 對應 `tissues`，`LUNG` 對應 `lungs`。進入交換區後，玩家標記必須固定在教學節點；離開區段才依 `minimapProgress` 沿 SVG 路線連續移動。進度值仍保留供診斷，不得以錯誤的全路徑百分比代表交換器官。

## 17.2 減益與每關計數

- `ENTITY_CATEGORIES.DEBUFF` 的負 Score 與負 HP 乘 `penalties.debuffMultiplier = 2`。
- `FATAL` 類別的 Wound 不套一般減益倍率。
- QTE 失敗分數直接集中為 `qte.failureScore = -6`。
- `malariaCount`、`carbonMonoxideCount` 與 `alcoholCount` 都是每關狀態；跨關、重試與重新開始必須歸零。

## 17.3 血球破裂

瘧原蟲計數每達 5 的倍數就建立新的 15 秒絕對期限。頭罩時間為一般 5 秒的 3 倍，BP 動態上限為 60。期限在 PLAYING、QTE、LOW_BP_STASIS 與 PAUSED 中均持續；結束時恢復 BP 上限 180，但不補回目前 BP。

## 17.4 CO 中毒

同關 CO 計數達 10 後，狀態維持到本關結束。`QTESystem` 的氧氣與二氧化碳門檻都從 3 提升為 9；兩者必須分別達標，不得改成任意 18 次總按鍵。

## 17.5 Time Out

任務 deadline 到達時，只有 `distanceAlongTrack < trackLength` 才進入 `GAME_OVER_TIMEOUT`。若一幀跨越 deadline，simulation delta 必須扣除截止後時間，再更新最後位置；正好抵達終點視為成功。逾時可從 PLAYING、QTE、LOW_BP_STASIS 或其 PAUSED 包裝狀態進入，並播放程序化乾扁紅血球送往肝臟工廠過場。

## 17.6 視覺與介面

任何瘧原蟲頭罩效果與復原動畫期間，程序化 CSS 水蒸氣以 `backdrop-filter` 模糊全畫面；模糊、透明度與漂移時間由 `js/config.js` 注入 CSS variables。玩家畫面不顯示編號階段、build、FPS、Pointer Lock、內部 state、checkpoint seed 或過場內部識別；必要資料可保留在不可見的 `data-*` 診斷屬性。

## 17.7 啟動與 Pointer Lock 可靠性

- 正式遊戲邏輯維持 JavaScript ES Modules；`js/entryGuard.js` 是唯一傳統 script，只在 `file://` 下提供傳輸層診斷，不得包含遊戲狀態、玩法或平衡數值。
- 專案不得直接以 `file://` 執行。入口需在 module 載入前顯示明確錯誤，並引導使用 `start-local.cmd` 或本機靜態伺服器。
- 點擊開始按鈕後必須先同步切換為等待畫面，再要求 Pointer Lock，避免瀏覽器延遲回應時看似無效。
- Pointer Lock 的靜默失敗使用 `GAME_CONFIG.pointerLock.requestTimeoutMs` 建立絕對期限；期限到達後顯示可重試錯誤。
- `pointerlockchange`、`pointerlockerror`、靜默逾時及未支援 API 都必須收斂至同一控制器；渲染迴圈只呼叫控制器的期限更新，不自行硬編碼逾時值。

## 17.8 可見碰撞輪廓

- RBC 玩家碰撞膠囊的外框上緣固定在十字線，下緣固定在第一人稱鼻罩的可見下緣；半徑仍保留較小值，避免回復成過大的車體。
- 增益／減益本體半徑必須覆蓋程序化模型在最大 pulse 時的截面，不得只使用核心幾何半徑。
- `BUFF`、`DEBUFF` 且具有非空白 `label` 的物件，其程序化標示牌是獨立碰撞面；瘧原蟲無牌面，Wound 不套用此分類規則。
- 本體圓與標示牌矩形都和玩家膠囊進行截面距離測試，任一成立後仍沿用既有優先序、單次消耗與掃掠縱向判定。

## 17.9 正式產品識別與版本

- `GAME_CONFIG.app` 是正式名稱、副標、狀態、版本、發布日期與顯示字串的唯一執行時來源。
- 正式名稱為「Project Aorta：大動脈計畫室」，副標為「RBC RACER」，狀態為 `STABLE`。
- 玩家顯示版本固定為 `Version：1.1（20260715）`；`package.json` 使用相容 SemVer 的 `1.1.0`。
- `index.html` 保留同值的無模組 fallback，ES Module 啟動後必須由 `GAME_CONFIG.app` 重設品牌節點與 `data-release-*` 診斷屬性。
- 快取識別統一為 `stable-v1.1-20260715-r2`；npm、測試、CI 與文件的正式 gate 統一為 `npm run test:stable`。
- Phase 00–10 僅為歷史報告；STABLE 後續變更採 SemVer 與版本報告，不建立新的編號階段。
