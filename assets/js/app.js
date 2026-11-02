(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const today = new Date();
  const Calendar = window.WorklogCalendar;
  const Storage = window.WorklogStorage;
  const dateISO = d => Calendar.dateKey(d);
  const weekStart = (year, week) => Calendar.getWeekStart(year, week);
  const weekDates = (year, week) => Calendar.datesInWeek(year, week);
  const sundayWeekYear = date => Calendar.weekYear(date);
  const getSundayWeek = date => Calendar.weekNumber(date);
  const weeksInYear = year => Calendar.weeksInYear(year);
  const weekKey = (y,w) => `${y}-W${String(w).padStart(2,"0")}`;
  const DEFAULT_CATEGORIES = [
    {id:"cat_dev",name:"开发",color:"blue",sort:1},
    {id:"cat_seo",name:"SEO",color:"green",sort:2},
    {id:"cat_maintain",name:"网站维护",color:"orange",sort:3},
    {id:"cat_project",name:"项目管理",color:"purple",sort:4},
    {id:"cat_learning",name:"研究学习",color:"gray",sort:5},
    {id:"cat_other",name:"其他",color:"gray",sort:6}
  ];
  const state = { year: sundayWeekYear(today), week: getSundayWeek(today), records: [], categories: [], view: "weekly", deletingCategoryId: null };
  function recordWeek(r) {
    const date = r.date ? Calendar.parseDate(r.date) : new Date(r.createdAt);
    return Calendar.getWeek(date);
  }
  function escapeHTML(s="") { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function load() {
    const saved = Storage.read(localStorage);
    state.records = saved.records;
    state.categories = saved.categories && saved.categories.length ? saved.categories : DEFAULT_CATEGORIES.map(c=>({...c}));
    migrateLegacyCategories();
    if (saved.error) console.warn("读取本地数据失败", saved.error);
    if (!saved.exists && !saved.error) seedDemo();
  }
  function seedDemo() {
    const demoWeek = {year:state.year,week:state.week};
    const dates = weekDates(demoWeek.year,demoWeek.week).map(dateISO);
    const samples = [
      {title:"响应式卡片轮播组件优化",categoryId:"cat_dev",notes:"调整桌面端与移动端卡片间距，统一标题和描述行数。",date:dates[0],links:[{name:"项目仓库（示例）",url:"https://github.com/"}]},
      {title:"SEO 内容工作台结构整理",categoryId:"cat_seo",notes:"梳理内容维护流程，明确文章更新优先级与资料关联方式。",date:dates[1],links:[]},
      {title:"WordPress 插件问题修复",categoryId:"cat_dev",notes:"处理前端交互问题，并整理版本发布说明。",date:dates[2],links:[{name:"GitHub",url:"https://github.com/"}]},
      {title:"Gutenberg 布局规范研究",categoryId:"cat_learning",notes:"整理可复用区块、同步模式和 CSS 组织原则。",date:dates[4],links:[]}
    ];
    state.records = samples.map((r,i)=>({...r,id:`demo-${i+1}`,createdAt:new Date(`${r.date}T12:00:00`).toISOString()}));
    save();
  }
  function save() { const result=Storage.save(localStorage,state.records,state.categories); if(!result.ok){ console.warn("Weekly Worklog 本地存储写入失败",result.error);$("storageWarning").hidden=false;$("storageStatusText").textContent="保存失败，请导出备份"; return false;} $("storageWarning").hidden=true;$("storageStatusText").textContent="数据保存在当前浏览器";return true; }
  function migrateLegacyCategories() {
    state.categories = state.categories.map((c,i)=>({...c,id:c.id||`cat_${i+1}`,sort:Number(c.sort)||i+1,color:c.color||"gray"}));
    state.records = state.records.map(r=>{
      if (r.categoryId) return r;
      const name = r.category || "其他";
      let category = state.categories.find(c=>c.name===name);
      if (!category) {
        category = {id:`cat_legacy_${Date.now()}_${state.categories.length}`,name,color:"gray",sort:state.categories.length+1};
        state.categories.push(category);
      }
      const next = {...r,categoryId:category.id};
      delete next.category;
      return next;
    });
  }
  function categoryById(id) { return state.categories.find(c=>c.id===id) || state.categories.find(c=>c.name==="其他") || state.categories[0]; }
  function categoryName(record) { return categoryById(record.categoryId)?.name || "未分类"; }
  function categoryClass(record) { return categoryById(record.categoryId)?.color || "gray"; }
  function renderCategoryOptions() {
    const current=$("categoryFilter").value;
    const options=[...state.categories].sort((a,b)=>a.sort-b.sort).map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join("");
    $("categoryFilter").innerHTML='<option value="">全部分类</option>'+options;
    $("recordCategory").innerHTML=options;
    if (current && state.categories.some(c=>c.id===current)) $("categoryFilter").value=current;
  }
  function showToast(msg) { const t=$("toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>t.classList.remove("show"),2200); }
  function formatRange(y,w) {
    const ds=weekDates(y,w), a=ds[0], b=ds[6];
    const fmt=d=>`${d.getFullYear()} 年 ${d.getMonth()+1} 月 ${d.getDate()} 日`;
    if(a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth()) return `${a.getFullYear()} 年 ${a.getMonth()+1} 月 ${a.getDate()} 日 — ${b.getDate()} 日`;
    return `${fmt(a)} — ${b.getFullYear()} 年 ${b.getMonth()+1} 月 ${b.getDate()} 日`;
  }
  function currentRecords() { return state.records.filter(r=>{const x=recordWeek(r);return x.year===state.year&&x.week===state.week;}).sort((a,b)=>(a.date||"").localeCompare(b.date||"")||a.createdAt.localeCompare(b.createdAt)); }
  function renderYearSelects() {
    const years=new Set([state.year,today.getFullYear(),...state.records.map(r=>recordWeek(r).year)]);
    const opts=[...years].sort((a,b)=>b-a).map(y=>`<option value="${y}">${y} 年</option>`).join("");
    ["yearSelect","yearSelect2"].forEach(id=>$(id).innerHTML=opts);
    $("yearSelect").value=String(state.year); $("yearSelect2").value=String(state.year);
  }
  function renderWeek() {
    $("weekTitle").textContent=`第 ${state.week} 周`;
    $("weekRange").textContent=formatRange(state.year,state.week);
    const ds=weekDates(state.year,state.week), names=["周日","周一","周二","周三","周四","周五","周六"];
    $("weekStrip").innerHTML=ds.map((d,i)=>`<div class="day-cell ${dateISO(d)===dateISO(today)?"today":""}"><div class="day-name">${names[i]}</div><div class="day-number">${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}</div></div>`).join("");
    const records=currentRecords(), links=records.reduce((n,r)=>n+(r.links||[]).length,0);
    const categories=new Set(records.map(r=>r.categoryId).filter(Boolean));
    $("statRecords").textContent=records.length; $("statCategories").textContent=categories.size; $("statLinks").textContent=links;
    $("recordCount").textContent=`${records.length} 条`;
    renderRecords();
  }
  function renderRecords() {
    const q=$("searchInput").value.trim().toLowerCase(), cat=$("categoryFilter").value;
    const records=currentRecords().filter(r=>(!cat||r.categoryId===cat)&&(!q||[r.title,r.notes,...(r.links||[]).flatMap(l=>[l.name,l.url])].join(" ").toLowerCase().includes(q)));
    const linksHTML = r => r.links&&r.links.length
      ? `<div class="link-list">${r.links.map(l=>`<a class="record-link" href="${escapeHTML(safeURL(l.url))}" target="_blank" rel="noopener noreferrer" title="${escapeHTML(l.url)}">↗ ${escapeHTML(l.name||"打开链接")}</a>`).join("")}</div>`
      : '<span class="no-link">暂无链接</span>';
    $("recordsBody").innerHTML=records.map((r,i)=>`<tr>
      <td class="row-index">${String(i+1).padStart(2,"0")}</td>
      <td><div class="record-title">${escapeHTML(r.title)}</div>${r.date?`<div class="record-date">${escapeHTML(r.date)}</div>`:""}</td>
      <td><span class="category-tag ${categoryClass(r)}">${escapeHTML(categoryName(r))}</span></td>
      <td class="notes-cell">${escapeHTML(r.notes||"—")}</td>
      <td>${linksHTML(r)}</td>
      <td><div class="row-actions"><button class="text-action" data-edit="${escapeHTML(r.id)}">编辑</button><button class="text-action" data-delete="${escapeHTML(r.id)}">删除</button></div></td>
    </tr>`).join("");
    $("recordCards").innerHTML=records.map((r,i)=>`<article class="record-card">
      <div class="record-card-top"><span class="record-card-index">${String(i+1).padStart(2,"0")}</span><span class="category-tag ${categoryClass(r)}">${escapeHTML(categoryName(r))}</span></div>
      <h4>${escapeHTML(r.title)}</h4>
      ${r.date?`<div class="record-card-date">${escapeHTML(r.date)}</div>`:""}
      <p class="record-card-notes">${escapeHTML(r.notes||"暂无备注")}</p>
      <div class="record-card-links">${linksHTML(r)}</div>
      <div class="record-card-actions"><button class="text-action" data-edit="${escapeHTML(r.id)}">编辑</button><button class="text-action" data-delete="${escapeHTML(r.id)}">删除</button></div>
    </article>`).join("");
    $("emptyState").hidden=records.length!==0;
    $("recordsBody").closest("table").style.display=records.length?"table":"none";
  }
  function safeURL(url) { try { const u=new URL(url); return ["http:","https:"].includes(u.protocol)?u.href:"#"; } catch { return "#"; } }
  function renderYear() {
    const recs=state.records.filter(r=>recordWeek(r).year===state.year), weeks=new Map();
    recs.forEach(r=>{const x=recordWeek(r);weeks.set(x.week,(weeks.get(x.week)||0)+1);});
    $("yearRecords").textContent=recs.length;
    $("yearWeeks").textContent=[...weeks.values()].filter(n=>n>0).length;
    $("yearLinks").textContent=recs.reduce((n,r)=>n+(r.links||[]).length,0);
    $("yearGridTitle").textContent=`${state.year} 年周次分布`;
    $("yearWeekGrid").innerHTML=Array.from({length:weeksInYear(state.year)},(_,i)=>i+1).map(w=>{
      const count=weeks.get(w)||0, dates=weekDates(state.year,w), label=`${String(dates[0].getMonth()+1).padStart(2,"0")}.${String(dates[0].getDate()).padStart(2,"0")} – ${String(dates[6].getMonth()+1).padStart(2,"0")}.${String(dates[6].getDate()).padStart(2,"0")}`;
      return `<button class="week-tile ${count?"has-records":""} ${w===state.week?"selected":""}" data-week="${w}"><strong>第 ${w} 周</strong><small>${label}</small><small class="tile-count">${count?`${count} 条记录`:"暂无记录"}</small></button>`;
    }).join("");
  }
  function setView(view) {
    state.view=view; $("weeklyPage").hidden=view!=="weekly"; $("yearPage").hidden=view!=="year";
    $("navWeekly").classList.toggle("active",view==="weekly"); $("navYear").classList.toggle("active",view==="year");
    $("breadcrumbCurrent").textContent=view==="weekly"?"周度工作台":"年度周次索引";
    if(view==="year") renderYear();
  }
  function refresh() { renderYearSelects(); renderCategoryOptions(); renderWeek(); if(state.view==="year")renderYear(); }
  function changeWeek(delta) {
    let d=weekStart(state.year,state.week); d.setDate(d.getDate()+delta*7);
    state.year=sundayWeekYear(d); state.week=getSundayWeek(d); refresh();
  }
  function openCategoryModal() {
    $("categoryDeletePanel").hidden=true;
    resetCategoryForm();
    renderCategoryManager();
    $("categoryModal").hidden=false;
  }
  function closeCategoryModal() { $("categoryModal").hidden=true; }
  function resetCategoryForm() {
    $("categoryForm").reset(); $("categoryId").value="";
    $("categoryColor").value="blue"; $("saveCategoryBtn").textContent="添加分类";
  }
  function renderCategoryManager() {
    const sorted=[...state.categories].sort((a,b)=>a.sort-b.sort);
    $("categoryManagerList").innerHTML=sorted.map((c,i)=>{
      const count=state.records.filter(r=>r.categoryId===c.id).length;
      return `<div class="category-manager-row">
        <div class="category-manager-main"><span class="category-tag ${escapeHTML(c.color||"gray")}">${escapeHTML(c.name)}</span><span class="category-manager-meta">${count} 条记录</span></div>
        <div class="category-manager-actions">
          <button class="text-action" data-cat-up="${escapeHTML(c.id)}" ${i===0?"disabled":""} title="上移">↑</button>
          <button class="text-action" data-cat-down="${escapeHTML(c.id)}" ${i===sorted.length-1?"disabled":""} title="下移">↓</button>
          <button class="text-action" data-cat-edit="${escapeHTML(c.id)}">编辑</button>
          <button class="text-action" data-cat-delete="${escapeHTML(c.id)}">删除</button>
        </div>
      </div>`;
    }).join("");
  }
  function saveCategory(e) {
    e.preventDefault();
    const name=$("categoryName").value.trim(), color=$("categoryColor").value, id=$("categoryId").value;
    if(!name){$("categoryName").focus();return;}
    if(state.categories.some(c=>c.name.toLowerCase()===name.toLowerCase()&&c.id!==id)){showToast("分类名称已存在");return;}
    if(id) {
      state.categories=state.categories.map(c=>c.id===id?{...c,name,color}:c);
      showToast("分类已更新");
    } else {
      state.categories.push({id:`cat_${Date.now()}_${Math.random().toString(16).slice(2,6)}`,name,color,sort:Math.max(0,...state.categories.map(c=>c.sort||0))+1});
      showToast("分类已添加");
    }
    save(); resetCategoryForm(); renderCategoryManager(); refresh();
  }
  function requestDeleteCategory(id) {
    const category=state.categories.find(c=>c.id===id); if(!category)return;
    if(state.categories.length<=1){showToast("至少需要保留一个工作分类");return;}
    const count=state.records.filter(r=>r.categoryId===id).length;
    if(!count) {
      if(confirm(`确定删除分类「${category.name}」吗？`)) {
        state.categories=state.categories.filter(c=>c.id!==id); save();renderCategoryManager();refresh();showToast("分类已删除");
      }
      return;
    }
    state.deletingCategoryId=id;
    $("categoryDeleteMessage").textContent=`「${category.name}」目前被 ${count} 条工作记录使用。请选择目标分类，系统会先转移这些记录，再删除原分类。`;
    $("replacementCategory").innerHTML=state.categories.filter(c=>c.id!==id).map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join("");
    $("categoryDeletePanel").hidden=false;
  }
  function confirmDeleteCategory() {
    const id=state.deletingCategoryId, target=$("replacementCategory").value;
    if(!id||!target)return;
    state.records=state.records.map(r=>r.categoryId===id?{...r,categoryId:target}:r);
    state.categories=state.categories.filter(c=>c.id!==id);
    state.deletingCategoryId=null;save();$("categoryDeletePanel").hidden=true;
    renderCategoryManager();refresh();showToast("记录已转移，分类已删除");
  }
  function moveCategory(id, direction) {
    const sorted=[...state.categories].sort((a,b)=>a.sort-b.sort), index=sorted.findIndex(c=>c.id===id), next=index+direction;
    if(index<0||next<0||next>=sorted.length)return;
    [sorted[index].sort,sorted[next].sort]=[sorted[next].sort,sorted[index].sort];
    state.categories=sorted;save();renderCategoryManager();refresh();
  }
  function openCategoryModal() {
    $("categoryDeletePanel").hidden=true;
    resetCategoryForm();
    renderCategoryManager();
    $("categoryModal").hidden=false;
  }
  function closeCategoryModal() { $("categoryModal").hidden=true; }
  function resetCategoryForm() {
    $("categoryForm").reset(); $("categoryId").value="";
    $("categoryColor").value="blue"; $("saveCategoryBtn").textContent="添加分类";
  }
  function renderCategoryManager() {
    const sorted=[...state.categories].sort((a,b)=>a.sort-b.sort);
    $("categoryManagerList").innerHTML=sorted.map((c,i)=>{
      const count=state.records.filter(r=>r.categoryId===c.id).length;
      return `<div class="category-manager-row">
        <div class="category-manager-main"><span class="category-tag ${escapeHTML(c.color||"gray")}">${escapeHTML(c.name)}</span><span class="category-manager-meta">${count} 条记录</span></div>
        <div class="category-manager-actions">
          <button class="text-action" data-cat-up="${escapeHTML(c.id)}" ${i===0?"disabled":""} title="上移">↑</button>
          <button class="text-action" data-cat-down="${escapeHTML(c.id)}" ${i===sorted.length-1?"disabled":""} title="下移">↓</button>
          <button class="text-action" data-cat-edit="${escapeHTML(c.id)}">编辑</button>
          <button class="text-action" data-cat-delete="${escapeHTML(c.id)}">删除</button>
        </div>
      </div>`;
    }).join("");
  }
  function saveCategory(e) {
    e.preventDefault();
    const name=$("categoryName").value.trim(), color=$("categoryColor").value, id=$("categoryId").value;
    if(!name){$("categoryName").focus();return;}
    if(state.categories.some(c=>c.name.toLowerCase()===name.toLowerCase()&&c.id!==id)){showToast("分类名称已存在");return;}
    if(id) {
      state.categories=state.categories.map(c=>c.id===id?{...c,name,color}:c);
      showToast("分类已更新");
    } else {
      state.categories.push({id:`cat_${Date.now()}_${Math.random().toString(16).slice(2,6)}`,name,color,sort:Math.max(0,...state.categories.map(c=>c.sort||0))+1});
      showToast("分类已添加");
    }
    save(); resetCategoryForm(); renderCategoryManager(); refresh();
  }
  function requestDeleteCategory(id) {
    const category=state.categories.find(c=>c.id===id); if(!category)return;
    if(state.categories.length<=1){showToast("至少需要保留一个工作分类");return;}
    const count=state.records.filter(r=>r.categoryId===id).length;
    if(!count) {
      if(confirm(`确定删除分类「${category.name}」吗？`)) {
        state.categories=state.categories.filter(c=>c.id!==id); save();renderCategoryManager();refresh();showToast("分类已删除");
      }
      return;
    }
    state.deletingCategoryId=id;
    $("categoryDeleteMessage").textContent=`「${category.name}」目前被 ${count} 条工作记录使用。请选择目标分类，系统会先转移这些记录，再删除原分类。`;
    $("replacementCategory").innerHTML=state.categories.filter(c=>c.id!==id).map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join("");
    $("categoryDeletePanel").hidden=false;
  }
  function confirmDeleteCategory() {
    const id=state.deletingCategoryId, target=$("replacementCategory").value;
    if(!id||!target)return;
    state.records=state.records.map(r=>r.categoryId===id?{...r,categoryId:target}:r);
    state.categories=state.categories.filter(c=>c.id!==id);
    state.deletingCategoryId=null;save();$("categoryDeletePanel").hidden=true;
    renderCategoryManager();refresh();showToast("记录已转移，分类已删除");
  }
  function moveCategory(id, direction) {
    const sorted=[...state.categories].sort((a,b)=>a.sort-b.sort), index=sorted.findIndex(c=>c.id===id), next=index+direction;
    if(index<0||next<0||next>=sorted.length)return;
    [sorted[index].sort,sorted[next].sort]=[sorted[next].sort,sorted[index].sort];
    state.categories=sorted;save();renderCategoryManager();refresh();
  }
  function openModal(record=null) {
    $("recordForm").reset(); $("recordId").value=record?.id||"";
    $("modalTitle").textContent=record?"编辑工作记录":"新增工作记录";
    renderCategoryOptions();
    $("recordTitle").value=record?.title||""; $("recordCategory").value=record?.categoryId||state.categories[0]?.id||"";
    $("recordDate").value=record?.date||dateISO(weekDates(state.year,state.week)[0]);
    $("recordNotes").value=record?.notes||"";
    $("linkRows").innerHTML="";
    (record?.links?.length?record.links:[{name:"",url:""}]).forEach(addLinkRow);
    $("recordModal").hidden=false; $("recordTitle").focus();
  }
  function addLinkRow(link={name:"",url:""}) {
    const row=document.createElement("div"); row.className="link-row";
    row.innerHTML=`<input class="link-name" placeholder="链接名称，例如：需求文档" maxlength="80" value="${escapeHTML(link.name||"")}"><input class="link-url" type="url" placeholder="https://…" value="${escapeHTML(link.url||"")}"><button type="button" class="remove-link" aria-label="删除链接">×</button>`;
    row.querySelector(".remove-link").addEventListener("click",()=>row.remove());
    $("linkRows").appendChild(row);
  }
  function closeModal() { $("recordModal").hidden=true; }
  function saveRecord(e) {
    e.preventDefault();
    const title=$("recordTitle").value.trim(); if(!title){$("recordTitle").focus();return;}
    const links=[...$("linkRows").querySelectorAll(".link-row")].map(row=>({name:row.querySelector(".link-name").value.trim(),url:row.querySelector(".link-url").value.trim()})).filter(l=>l.url);
    for(const l of links){if(!safeURL(l.url)||safeURL(l.url)==="#"){showToast("请填写有效的 http 或 https 链接");return;} if(!l.name)l.name=new URL(l.url).hostname;}
    const id=$("recordId").value||`r-${Date.now()}-${Math.random().toString(16).slice(2,7)}`;
    const old=state.records.find(r=>r.id===id);
    const item={id,title,categoryId:$("recordCategory").value,date:$("recordDate").value,notes:$("recordNotes").value.trim(),links,createdAt:old?.createdAt||new Date().toISOString()};
    if(old)state.records=state.records.map(r=>r.id===id?item:r); else state.records.push(item);
    save(); closeModal();
    if(item.date){const d=new Date(`${item.date}T12:00:00`);state.year=sundayWeekYear(d);state.week=getSundayWeek(d);}
    refresh(); showToast(old?"工作记录已更新":"工作记录已添加");
  }
  function exportData() {
    const blob=new Blob([Storage.exportJSON(state.records,state.categories,new Date().toISOString())],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`weekly-worklog-${dateISO(today)}.json`;a.click();URL.revokeObjectURL(url);showToast("数据导出已开始");
  }
  function importData(file) {
    const reader=new FileReader(); reader.onload=()=>{
      try {
        const data=Storage.parseImport(reader.result);
        if(!confirm(`即将导入 ${data.records.length} 条记录及其工作分类。导入会替换当前浏览器中的全部数据，建议先导出备份。是否继续？`))return;
        state.records=data.records; state.categories=data.categories && data.categories.length ? data.categories : DEFAULT_CATEGORIES.map(c=>({...c}));
        migrateLegacyCategories();save();refresh();showToast("数据导入成功");
      } catch(e) { showToast("文件格式不正确，无法导入"); }
    };reader.readAsText(file);
  }
function reportYearOptions(){const years=new Set([state.year,...state.records.map(r=>{try{return recordWeek(r).year}catch{return state.year}})]);$("reportYear").innerHTML=[...years].sort((a,b)=>b-a).map(y=>`<option value="${y}">${y} 年</option>`).join("");$("reportYear").value=String(state.year);reportWeekOptions();}
function reportWeekOptions(){const y=Number($("reportYear").value),max=weeksInYear(y),old=Number($("reportWeek").value)||state.week;$("reportWeek").innerHTML=Array.from({length:max},(_,i)=>`<option value="${i+1}">第 ${i+1} 周</option>`).join("");$("reportWeek").value=String(Math.min(old,max));const weekly=$("reportScope").value==="week";$("reportWeekWrap").hidden=!weekly;const rec=window.WorklogReport.recordsForPeriod(state.records,y,weekly?Number($("reportWeek").value):null);$("reportInfo").textContent=`当前范围包含 ${rec.length} 条工作记录。HTML 文件可离线查看。`;}
function reportPayload(){return {records:state.records,categories:state.categories,year:Number($("reportYear").value),week:$("reportScope").value==="week"?Number($("reportWeek").value):null};}
function reportBlob(){const p=reportPayload();return {file:`Weekly-Worklog-${p.year}${p.week===null?"":`-W${String(p.week).padStart(2,"0")}`}.html`,blob:new Blob([window.WorklogReport.buildHtml(p)],{type:"text/html;charset=utf-8"})};}
function previewReport(){const {blob}=reportBlob(),url=URL.createObjectURL(blob),w=window.open(url,"_blank","noopener,noreferrer");if(!w)showToast("预览窗口被拦截，可下载 HTML 查看");setTimeout(()=>URL.revokeObjectURL(url),60000);}
function downloadReport(){const {file,blob}=reportBlob(),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=file;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast("HTML 报告已生成");}
  function bind() {
    $("openReport").addEventListener("click",()=>{reportYearOptions();$("reportScope").value="year";reportWeekOptions();$("reportModal").hidden=false;closeSidebar();});
    $("closeReportModal").addEventListener("click",()=>{$("reportModal").hidden=true;});
    $("reportModal").addEventListener("click",e=>{if(e.target===$("reportModal"))$("reportModal").hidden=true;});
    ["reportScope","reportYear","reportWeek"].forEach(id=>$(id).addEventListener("change",reportWeekOptions));
    $("reportPreview").addEventListener("click",previewReport);
    $("reportDownload").addEventListener("click",downloadReport);
    $("prevWeek").addEventListener("click",()=>changeWeek(-1)); $("nextWeek").addEventListener("click",()=>changeWeek(1));
    $("goCurrentWeek").addEventListener("click",()=>{state.year=sundayWeekYear(today);state.week=getSundayWeek(today);refresh();});
    ["yearSelect","yearSelect2"].forEach(id=>$(id).addEventListener("change",e=>{state.year=Number(e.target.value);state.week=Math.min(state.week,weeksInYear(state.year));refresh();}));
    $("searchInput").addEventListener("input",renderRecords);$("categoryFilter").addEventListener("change",renderRecords);
    $("manageCategories").addEventListener("click",openCategoryModal);
    $("closeCategoryModal").addEventListener("click",closeCategoryModal);
    $("categoryModal").addEventListener("click",e=>{if(e.target===$("categoryModal"))closeCategoryModal();});
    $("categoryForm").addEventListener("submit",saveCategory);
    $("cancelCategoryEdit").addEventListener("click",resetCategoryForm);
    $("cancelCategoryDelete").addEventListener("click",()=>{$("categoryDeletePanel").hidden=true;state.deletingCategoryId=null;});
    $("confirmCategoryDelete").addEventListener("click",confirmDeleteCategory);
    $("categoryManagerList").addEventListener("click",e=>{
      const edit=e.target.closest("[data-cat-edit]"), del=e.target.closest("[data-cat-delete]");
      const up=e.target.closest("[data-cat-up]"), down=e.target.closest("[data-cat-down]");
      if(edit){const c=state.categories.find(x=>x.id===edit.dataset.catEdit);if(c){$("categoryId").value=c.id;$("categoryName").value=c.name;$("categoryColor").value=c.color||"gray";$("saveCategoryBtn").textContent="保存修改";$("categoryName").focus();}}
      if(del)requestDeleteCategory(del.dataset.catDelete);
      if(up)moveCategory(up.dataset.catUp,-1);
      if(down)moveCategory(down.dataset.catDown,1);
    });
    ["addRecord","addRecordTop","emptyAdd"].forEach(id=>$(id).addEventListener("click",()=>openModal()));
    $("closeModal").addEventListener("click",closeModal);$("cancelModal").addEventListener("click",closeModal);
    $("recordModal").addEventListener("click",e=>{if(e.target===$("recordModal"))closeModal();});
    $("addLink").addEventListener("click",()=>addLinkRow());$("recordForm").addEventListener("submit",saveRecord);
    ["recordsBody","recordCards"].forEach(containerId=>$(containerId).addEventListener("click",e=>{
      const edit=e.target.closest("[data-edit]"), del=e.target.closest("[data-delete]");
      if(edit){const r=state.records.find(x=>x.id===edit.dataset.edit);if(r)openModal(r);}
      if(del){const r=state.records.find(x=>x.id===del.dataset.delete);if(r&&confirm(`确定删除「${r.title}」吗？`)){state.records=state.records.filter(x=>x.id!==r.id);save();refresh();showToast("记录已删除");}}
    }));
    $("navWeekly").addEventListener("click",()=>{setView("weekly");closeSidebar();});$("navYear").addEventListener("click",()=>{setView("year");renderYear();closeSidebar();});
    $("yearWeekGrid").addEventListener("click",e=>{const tile=e.target.closest("[data-week]");if(tile){state.week=Number(tile.dataset.week);setView("weekly");refresh();closeSidebar();}});
    $("exportBtn").addEventListener("click",()=>{exportData();closeSidebar();});$("importInput").addEventListener("change",e=>{if(e.target.files[0])importData(e.target.files[0]);e.target.value="";closeSidebar();});
    $("closeSidebar").addEventListener("click",closeSidebar);
    $("sidebarOverlay").addEventListener("click",closeSidebar);
    document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeSidebar();closeModal();closeCategoryModal();$("reportModal").hidden=true;closeCategoryModal();}});
    $("mobileMenu").addEventListener("click",openSidebar);
  }
  function openSidebar(){$("sidebar").classList.add("open");$("sidebarOverlay").classList.add("visible");document.body.classList.add("menu-open");}
  function closeSidebar(){$("sidebar").classList.remove("open");$("sidebarOverlay").classList.remove("visible");document.body.classList.remove("menu-open");}
  load();bind();refresh();
})();
