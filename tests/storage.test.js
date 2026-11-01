const assert = require("node:assert/strict");
const Storage = require("../assets/js/storage.js");

const legacy = Storage.parseImport(JSON.stringify({
  records: [{ id: "old-1", title: "旧版记录", category: "SEO", date: "2026-01-01", links: [] }]
}));
assert.equal(legacy.records.length, 1);
assert.equal(legacy.categories, null);

const categories = [{ id: "cat_seo", name: "SEO", color: "green", sort: 1 }];
const exported = Storage.exportJSON(
  [{ id: "new-1", title: "新版记录", categoryId: "cat_seo", links: [] }],
  categories,
  "2026-11-01T00:00:00.000Z"
);
const imported = Storage.parseImport(exported);
assert.equal(imported.records[0].categoryId, "cat_seo");
assert.equal(imported.categories[0].name, "SEO");

const memory = {
  value: null,
  getItem() { return this.value; },
  setItem(key, value) { this.value = value; }
};
Storage.save(memory, [{ id: "r1" }], categories);
const restored = Storage.read(memory);
assert.equal(restored.records.length, 1);
assert.equal(restored.categories[0].id, "cat_seo");

console.log("Storage tests passed: legacy import, category-aware export/import, local persistence.");
