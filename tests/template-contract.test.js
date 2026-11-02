const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Calendar = require('../assets/js/calendar.js');

const app = fs.readFileSync(path.join(__dirname,'../assets/js/app.js'),'utf8');
const template = fs.readFileSync(path.join(__dirname,'../app/workbench-template.php'),'utf8');
const php = fs.readFileSync(path.join(__dirname,'../index.php'),'utf8');
const ids = new Set([...template.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const required = [...new Set([...app.matchAll(/\$\("([A-Za-z][A-Za-z0-9_-]*)"\)/g)].map(m => m[1]))];
const missing = required.filter(id => !ids.has(id));
assert.deepEqual(missing, [], 'Missing DOM IDs used by app.js: '+missing.join(', '));
assert.match(template, /<!-- SERVER_TOOLS -->/);
assert.match(template, /<script src="assets\/js\/app.js"><\/script>/);
assert.match(php, /app\/workbench-template\.php/);
assert.doesNotMatch(php, /file_get_contents\(__DIR__\.'\/index\.html'\)/);
assert.doesNotMatch(template, /id="weekTitle">第 40 周/);
assert.deepEqual(
  {year:Calendar.weekYear(Calendar.parseDate('2026-11-02')),week:Calendar.weekNumber(Calendar.parseDate('2026-11-02'))},
  {year:2026,week:45}
);
console.log('Template contract tests passed: required DOM IDs, PHP template anchors, and week 45 on 2026-11-02.');
