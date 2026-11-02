(function (root) {
  "use strict";
  const STORAGE_KEY = "weekly-worklog-v1";
  function read(storage) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return { records: [], categories: null, exists: false };
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.records)) throw new Error("Invalid stored data");
      return { records: data.records, categories: Array.isArray(data.categories) ? data.categories : null, exists: true };
    } catch (error) { return { records: [], categories: null, error }; }
  }
  function save(storage, records, categories) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify({ records, categories }));
      return { ok: true };
    } catch (error) {
      // Browsers may deny storage entirely (e.g. restricted file:// origins),
      // or reject large writes with QuotaExceededError.
      return { ok: false, error };
    }
  }
  function parseImport(text) {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.records)) throw new Error("JSON must contain a records array");
    return { records: data.records, categories: Array.isArray(data.categories) ? data.categories : null };
  }
  function exportJSON(records, categories, exportedAt) {
    return JSON.stringify({ version: "2.0.0", exportedAt: exportedAt || new Date().toISOString(), records, categories }, null, 2);
  }
  const api = { STORAGE_KEY, read, save, parseImport, exportJSON };
  root.WorklogStorage = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
