const assert=require("node:assert/strict");
const Calendar=require("../assets/js/calendar.js");
const Report=require("../assets/js/report.js");
const records=[
  {id:"a", title:"开发 <script>alert(1)</script>",date:"2025-12-31",categoryId:"dev",notes:"内容 & 建议",links:[{name:"文档",url:"https://example.com/d"}]},
  {id:"b", title:"一月计划",date:"2026-01-02",categoryId:"dev",notes:"下一周",links:[{name:"恶意地址",url:"javascript:alert(1)"}]},
  {id:"c", title:"别的周",date:"2026-02-02",categoryId:"seo",links:[]}
];
const categories=[{id:"dev",name:"开发"},{id:"seo",name:"SEO"}];
const grouped=Report.recordsForPeriod(records,2026);
assert.equal(grouped.length,3,"Cross-year week must be assigned to 2026");
const firstWeek=Calendar.weekNumber(Calendar.parseDate("2026-01-01"));
assert.equal(Report.recordsForPeriod(records,2026,firstWeek).length,2);
const html=Report.buildHtml({records,categories,year:2026,generatedAt:new Date("2026-11-02T00:00:00Z")});
assert.match(html,/年度工作记录/);
assert.match(html,/<table>/);
assert.match(html,/href="#week-/);
assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.doesNotMatch(html,/<script>alert\(1\)<\/script>/);
assert.doesNotMatch(html,/href="javascript:/);
assert.match(html,/href="https:\/\/example.com\/d"/);
assert.match(html,/<style>/);
assert.doesNotMatch(html,/<script\b/);
const weekHtml=Report.buildHtml({records,categories,year:2026,week:firstWeek});
assert.match(weekHtml,/第 1 周工作报告/);
assert.doesNotMatch(weekHtml,/href="#week-/);
const noData=Report.buildHtml({records:[],categories:[],year:2026});
assert.match(noData,/暂无工作记录/);
console.log("Report tests passed: annual/week export, cross-year rules, standalone HTML, escaping and link safety.");
