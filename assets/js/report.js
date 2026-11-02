(function (root) {
  "use strict";
  const Calendar = root.WorklogCalendar || (typeof require !== "undefined" ? require("./calendar.js") : null);
  const e = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
  function linkUrl(value) {
    try {
      const u = new URL(String(value));
      return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
    } catch { return null; }
  }
  const isoDate = d => Calendar.dateKey(d);
  function recordDate(r) {
    if (r.date) return Calendar.parseDate(r.date);
    if (!r.createdAt) throw new RangeError("Record has no usable date");
    const d = new Date(r.createdAt);
    if (!Number.isFinite(d.getTime())) throw new RangeError("Invalid createdAt");
    return d;
  }
  const sortedRecords = records => records.slice().sort((a,b) =>
    isoDate(recordDate(a)).localeCompare(isoDate(recordDate(b))) ||
    String(a.title || "").localeCompare(String(b.title || ""), "zh-CN")
  );
  function rangeLabel(year, week) {
    const ds = Calendar.datesInWeek(year,week);
    const fmt = d => `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
    return fmt(ds[0]) + " — " + fmt(ds[6]);
  }
  function recordsForPeriod(records, year, week) {
    if(!Number.isInteger(year) || year<1 || year>9998) throw new RangeError("Invalid year");
    if(week != null && (!Number.isInteger(week) || week<1 || week>Calendar.weeksInYear(year))) throw new RangeError("Invalid week");
    return sortedRecords(records.filter(r => {
      try {
        const w=Calendar.getWeek(recordDate(r));
        return w.year===year && (week==null || w.week===week);
      } catch { return false; }
    }));
  }
  function buildHtml({ records, categories, year, week=null, generatedAt=new Date() }) {
    const chosen=recordsForPeriod(records,year,week);
    const categoryMap=new Map(categories.map(c=>[c.id,c]));
    const groups=new Map();
    for(const r of chosen) {
      const w=Calendar.getWeek(recordDate(r)).week;
      if(!groups.has(w)) groups.set(w,[]);
      groups.get(w).push(r);
    }
    const weeks=[...groups.keys()].sort((a,b)=>a-b);
    const linksCount=chosen.reduce((n,r)=>n+(Array.isArray(r.links)?r.links.filter(l=>linkUrl(l.url)).length:0),0);
    const distinct=new Set(chosen.map(r=>r.categoryId));
    const reportTitle=week == null ? `${year} 年度工作记录` : `${year} 年第 ${week} 周工作报告`;
    const nav=week == null && weeks.length
      ? `<nav class="week-nav" aria-label="周次导航"><strong>周次导航</strong><div class="week-nav-items">${weeks.map(w=>`<a href="#week-${w}">W${String(w).padStart(2,"0")}</a>`).join("")}</div></nav>`
      : "";
    const formatLinks=r=>(Array.isArray(r.links)?r.links:[]).map(l=>{
      const url=linkUrl(l.url); if(!url)return "";
      return `<a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(l.name||"查看资料")}</a>`;
    }).filter(Boolean).join("<span class=\"link-sep\"> · </span>") || '<span class="muted">—</span>';
    const row=(r,i)=>{
      const cat=categoryMap.get(r.categoryId);
      const date=isoDate(recordDate(r));
      return `<tr><td class="index-cell">${i+1}</td><td class="work-cell"><strong>${e(r.title)}</strong>${r.notes?`<div class="note">${e(r.notes)}</div>`:""}</td><td class="category-cell"><span class="tag">${e(cat?.name||"未分类")}</span></td><td class="date-cell">${e(date)}</td><td class="links-cell">${formatLinks(r)}</td></tr>`;
    };
    const sections=weeks.map(w=>`<section class="week-section" id="week-${w}">
      <div class="week-heading"><div><h2>第 ${w} 周</h2><p>${e(rangeLabel(year,w))}</p></div><span>${groups.get(w).length} 条记录</span></div>
      <table><thead><tr><th class="col-num">序号</th><th>工作事项与备注</th><th class="col-cat">分类</th><th class="col-date">完成日期</th><th class="col-links">相关资料</th></tr></thead><tbody>${groups.get(w).map(row).join("")}</tbody></table>
    </section>`).join("\n");
    const now=generatedAt instanceof Date?generatedAt:new Date(generatedAt);
    if(!Number.isFinite(now.getTime())) throw new RangeError("Invalid generation timestamp");
    const created=now.toISOString().slice(0,10);
    const css=`
:root{color-scheme:light}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f3f6fa;color:#253247;font:14px/1.75 "Microsoft YaHei UI","Microsoft YaHei","PingFang SC","Hiragino Sans GB","Noto Sans SC",sans-serif}
.container{max-width:1120px;margin:30px auto;padding:0 22px}.paper{background:#fff;border:1px solid #e5ebf2;border-radius:14px;padding:44px 46px;box-shadow:0 12px 34px rgba(27,47,78,.06)}
.eyebrow{font-size:12px;letter-spacing:1.5px;color:#5377ae;font-weight:700}.cover{border-bottom:2px solid #e7edf6;padding-bottom:24px;margin-bottom:25px}.cover h1{font-size:30px;line-height:1.4;margin:9px 0 7px}.subtitle{color:#708095;margin:0}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:22px 0 28px}.stat{background:#f5f8fc;border-radius:10px;padding:15px 18px}.stat strong{display:block;font-size:25px;line-height:1.35;color:#2c518b}.stat span{color:#748196;font-size:12px}
.week-nav{padding:17px 20px;background:#f8faff;border:1px solid #e9eef5;border-radius:10px;margin:22px 0 28px}.week-nav>strong{display:block;margin-bottom:12px}.week-nav-items{display:flex;flex-wrap:wrap;gap:8px}.week-nav-items a{color:#325ca0;background:#fff;border:1px solid #dbe5f4;border-radius:6px;text-decoration:none;padding:5px 10px;font-size:12px}.week-nav-items a:hover{background:#e8f0ff}.week-section{margin:30px 0 35px;scroll-margin-top:18px}.week-heading{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:13px}.week-heading h2{font-size:20px;margin:0}.week-heading p{color:#7d8b9d;margin:3px 0 0;font-size:12px}.week-heading>span{font-size:12px;color:#7e8998;background:#f1f4f8;border-radius:20px;padding:3px 10px}
table{border-collapse:collapse;width:100%;table-layout:fixed}thead{display:table-header-group}th{text-align:left;font-size:12px;background:#f4f7fb;color:#526580;padding:12px 10px;border:1px solid #e6ecf4}td{vertical-align:top;padding:13px 10px;border:1px solid #e6ecf4;font-size:13px;overflow-wrap:anywhere}tbody tr:nth-child(even){background:#fbfcfe}
.col-num{width:55px}.col-cat{width:104px}.col-date{width:112px}.col-links{width:160px}.index-cell{color:#8793a5}.work-cell strong{font-size:14px}.note{font-size:13px;white-space:pre-wrap;line-height:1.75;color:#667589;margin-top:5px}.tag{display:inline-block;background:#eef3fb;color:#4f688d;padding:3px 7px;border-radius:5px;font-size:12px}.links-cell a{color:#2d65ba;text-decoration:none}.links-cell a:hover{text-decoration:underline}.link-sep{color:#afbad0}.muted{color:#9aa5b4}.empty{padding:35px;background:#f8fafd;text-align:center;border-radius:10px;color:#748398}.foot{border-top:1px solid #e7edf3;margin-top:36px;padding-top:16px;font-size:12px;color:#8692a3;display:flex;justify-content:space-between}
@media(max-width:760px){.container{margin:0;padding:0}.paper{padding:25px 14px;border:0;border-radius:0}.cover h1{font-size:24px}.stats{gap:7px}.stat{padding:10px}.stat strong{font-size:20px}.week-section{overflow-x:auto}table{min-width:680px}}
@page{size:A4 portrait;margin:15mm 12mm}
@media print{body{background:#fff;font-size:12px}.container{max-width:none;margin:0;padding:0}.paper{padding:0;border:0;border-radius:0;box-shadow:none}.week-nav{display:none}.stats{gap:8px}.stat{background:#f5f8fc;-webkit-print-color-adjust:exact;print-color-adjust:exact}.week-section{overflow:visible;margin:20px 0 24px}.week-heading{break-after:avoid;page-break-after:avoid}table{min-width:0;font-size:11px}thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}th,td{padding:7px 6px;font-size:10px}.work-cell strong,.note,.links-cell{font-size:11px}.col-num{width:35px}.col-cat{width:70px}.col-date{width:83px}.col-links{width:110px}.foot{margin-top:18px}a{color:inherit;text-decoration:underline}}
`;
    return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(reportTitle)} - Weekly Worklog</title><style>${css}</style></head>
<body><div class="container"><main class="paper">
<header class="cover"><div class="eyebrow">WEEKLY WORKLOG · ${week==null?"ANNUAL REPORT":"WEEKLY REPORT"}</div><h1>${e(reportTitle)}</h1><p class="subtitle">${week==null?"按周整理工作成果与相关文档资料":e(rangeLabel(year,week))} · 生成日期：${e(created)}</p></header>
<section class="stats" aria-label="统计信息"><div class="stat"><strong>${chosen.length}</strong><span>工作记录</span></div><div class="stat"><strong>${weeks.length}</strong><span>已记录周次</span></div><div class="stat"><strong>${linksCount}</strong><span>有效资料链接</span></div></section>
${nav}${sections||'<div class="empty">所选时间范围内暂无工作记录。</div>'}
<footer class="foot"><span>Weekly Worklog · 工作记录报告</span><span>导出日期 ${e(created)} · 涉及分类 ${distinct.size} 个</span></footer>
</main></div></body></html>`;
  }
  const api={buildHtml,recordsForPeriod,rangeLabel,linkUrl};
  root.WorklogReport=api;
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
