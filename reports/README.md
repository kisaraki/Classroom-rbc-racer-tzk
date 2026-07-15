# Project Aorta：大動脈計畫室 歷程與版本報告

本目錄只存放已實際執行之歷史開發與正式版本結果報告。Phase 00–10 是封存開發史；STABLE 後採 SemVer 與版本／變更報告，不新增編號階段。

循環系統繁體中文術語以倉庫根目錄的 `CIRCULATION_TERMINOLOGY.md` 為準。2026-07-15 的術語校準只修正名稱，不改寫各階段的數值、測試結果或歷史行為。

命名方式：

```text
phase-00-report.md
phase-01-report.md
...
stable-1.1-release-report.md
```

STABLE 後的維護或校準使用版本，或日期加主題命名，例如：

```text
2026-07-15-circulation-terminology-report.md
```

每份新報告必須依根目錄的 `RELEASE_REPORT_TEMPLATE.md` 撰寫，並包含：

- 本次版本或變更的授權與排除範圍。
- 實際修改內容與檔案。
- 自動測試及實際瀏覽器驗收結果。
- 發現的錯誤、重現步驟與原因。
- 修正方式及修正後重測。
- 效能證據與殘餘風險。
- PASS 或 BLOCKED 結論。

不得預先建立空白 PASS 報告，也不得在測試失敗或錯誤未修正時將版本標示為 PASS。
