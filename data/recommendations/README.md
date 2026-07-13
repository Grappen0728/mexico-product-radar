# 每日推荐数据

每天保存一个 UTF-8 JSON 文件，文件名使用 `YYYY-MM-DD-product-slug.json`。

写入后运行：

```text
pnpm report:sync
pnpm test
pnpm send:feishu -- data/recommendations/YYYY-MM-DD-product-slug.json
```

JSON 字段必须符合 `app/lib/recommendations/types.ts` 中的 `RecommendationReport`，同步脚本会在发布前执行完整校验。
