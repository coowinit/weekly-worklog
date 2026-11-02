<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Weekly Worklog 周度工作档案管理工具">
  <title>Weekly Worklog — 周度工作档案</title>
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <div class="app-shell">
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <a class="brand" href="#" aria-label="Weekly Worklog 首页">
          <span class="brand-mark">W</span>
          <span><strong>Weekly Worklog</strong><small>周度工作档案</small></span>
        </a>
        <button class="sidebar-close" id="closeSidebar" type="button" aria-label="关闭菜单">×</button>
      </div>
      <div class="side-section">
        <div class="side-label">工作空间</div>
        <button class="side-link active" id="navWeekly"><span class="nav-icon">▦</span>周度工作台</button>
        <button class="side-link" id="navYear"><span class="nav-icon">▤</span>年度周次索引</button>
        <button class="side-link" id="openReport"><span class="nav-icon">▧</span>工作报告</button>
      </div>
      <div class="side-bottom">
        <div class="storage-note"><span class="status-dot"></span><span><strong>本地演示模式</strong><small id="storageStatusText">数据保存在当前浏览器</small></span></div>
        <!-- SERVER_TOOLS -->
        <button class="side-link" id="exportBtn"><span class="nav-icon">⇩</span>导出数据</button>
        <label class="side-link import-label"><span class="nav-icon">⇧</span>导入数据<input type="file" id="importInput" accept=".json,application/json"></label>
      </div>
    </aside>

    <main class="main"><div id="storageWarning" class="save-notice" role="alert" hidden><span class="save-notice-icon" aria-hidden="true">!</span><div class="save-notice-copy"><strong id="saveNoticeTitle">数据保存失败</strong><span id="saveNoticeDetail">请检查数据库连接或保存状态。</span></div><button type="button" class="save-notice-dismiss" id="dismissSaveNotice" aria-label="关闭提示">×</button></div>
      <header class="topbar">
        <button class="mobile-menu" id="mobileMenu" aria-label="打开菜单">☰</button>
        <div class="breadcrumb">工作空间 <span>/</span> <strong id="breadcrumbCurrent">周度工作台</strong></div>
        <div class="top-actions">
          <span class="local-indicator"><i></i> <span id="localSaveIndicator">自动保存在本机</span></span>
          <button class="btn btn-primary" id="addRecordTop"><span>＋</span> 新增记录</button>
        </div>
      </header>

      <section class="page" id="weeklyPage">
        <div class="page-heading">
          <div>
            <div class="eyebrow">WEEKLY OVERVIEW</div>
            <h1>周度工作台</h1>
            <p>以周为单位，整理工作成果与相关资料。</p>
          </div>
          <div class="year-select-wrap">
            <label for="yearSelect">工作年份</label>
            <select id="yearSelect" class="select-control"></select>
          </div>
        </div>

        <section class="week-panel">
          <div class="week-main">
            <div class="week-kicker">CURRENT SELECTION</div>
            <div class="week-title-row">
              <button class="icon-btn" id="prevWeek" aria-label="上一周">←</button>
              <div>
                <h2 id="weekTitle">正在加载周次…</h2>
                <div class="week-range" id="weekRange">正在计算日期范围…</div>
              </div>
              <button class="icon-btn" id="nextWeek" aria-label="下一周">→</button>
              <button class="btn btn-soft" id="goCurrentWeek">返回本周</button>
            </div>
            <div class="week-strip" id="weekStrip"></div>
          </div>
          <div class="week-stats">
            <div class="stat-card"><span>本周记录</span><strong id="statRecords">0</strong><small>条工作事项</small></div>
            <div class="stat-card"><span>工作分类</span><strong id="statCategories">0</strong><small>个不同分类</small></div>
            <div class="stat-card"><span>资料链接</span><strong id="statLinks">0</strong><small>个相关链接</small></div>
          </div>
        </section>

        <section class="records-section">
          <div class="section-heading records-heading">
            <div><span class="section-icon">▤</span><h3>工作记录</h3><span class="count-pill" id="recordCount">0 条</span></div>
            <button class="btn btn-primary" id="addRecord"><span>＋</span> 添加工作记录</button>
          </div>
          <div class="toolbar">
            <div class="search-box"><span>⌕</span><input id="searchInput" type="search" placeholder="搜索标题、备注或链接…"></div>
            <select id="categoryFilter" class="select-control filter-select">
              <option value="">全部分类</option>
            </select>
            <button class="btn btn-outline btn-small" id="manageCategories">分类管理</button>
            <span class="toolbar-note">记录按周归档，不要求每天填写</span>
          </div>
          <div class="table-wrap">
            <table class="records-table">
              <thead><tr><th class="col-index">#</th><th>工作标题</th><th class="col-category">分类</th><th>工作备注</th><th class="col-links">相关资料</th><th class="col-actions">操作</th></tr></thead>
              <tbody id="recordsBody"></tbody>
            </table>
            <div class="record-cards" id="recordCards"></div>
            <div class="empty-state" id="emptyState" hidden>
              <div class="empty-icon">▤</div><strong>本周还没有工作记录</strong>
              <p>可以先添加一条工作成果，关联对应的云文档或项目链接。</p>
              <button class="btn btn-primary" id="emptyAdd">＋ 添加第一条记录</button>
            </div>
          </div>
        </section>
      </section>

      <section class="page" id="yearPage" hidden>
        <div class="page-heading">
          <div><div class="eyebrow">YEARLY ARCHIVE</div><h1>年度周次索引</h1><p>快速浏览全年记录分布，点击周次即可查看对应工作档案。</p></div>
          <div class="year-select-wrap"><label for="yearSelect2">工作年份</label><select id="yearSelect2" class="select-control"></select></div>
        </div>
        <div class="year-overview">
          <div><span>全年工作记录</span><strong id="yearRecords">0</strong></div>
          <div><span>已记录周次</span><strong id="yearWeeks">0</strong></div>
          <div><span>关联资料链接</span><strong id="yearLinks">0</strong></div>
        </div>
        <div class="year-grid-card">
          <div class="section-heading"><div><span class="section-icon">▦</span><h3 id="yearGridTitle">2026 年周次分布</h3></div><span class="legend"><i></i>有工作记录</span></div>
          <div class="week-grid" id="yearWeekGrid"></div>
        </div>
        <div class="year-tip">提示：每周从星期日开始，到星期六结束。第 1 周为包含当年 1 月 1 日的那一周，跨年周归属于包含新年 1 月 1 日的年份。</div>
      </section>
      <footer class="footer">Weekly Worklog <span>·</span> v2.0.2 <span>·</span> 周度工作档案</footer>
    </main>
  </div>

  <div class="modal-backdrop" id="recordModal" hidden>
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-header"><div><div class="eyebrow">WORK RECORD</div><h2 id="modalTitle">新增工作记录</h2></div><button class="icon-btn close-modal" id="closeModal" aria-label="关闭">×</button></div>
      <form id="recordForm">
        <input type="hidden" id="recordId">
        <div class="form-grid">
          <div class="form-field full"><label for="recordTitle">工作标题 <b>*</b></label><input id="recordTitle" required maxlength="120" placeholder="例如：完成产品详情页布局优化"></div>
          <div class="form-field"><label for="recordCategory">工作分类</label><select id="recordCategory"></select></div>
          <div class="form-field"><label for="recordDate">完成日期（可选）</label><input id="recordDate" type="date"></div>
          <div class="form-field full"><label for="recordNotes">工作备注</label><textarea id="recordNotes" rows="4" placeholder="记录主要工作内容、完成情况或后续注意事项……"></textarea></div>
        </div>
        <div class="links-editor">
          <div class="links-editor-heading"><div><strong>相关资料链接</strong><small>可添加多个 Google Docs、Drive、GitHub 或网站地址</small></div><button type="button" class="btn btn-outline btn-small" id="addLink">＋ 添加链接</button></div>
          <div id="linkRows"></div>
        </div>
        <div class="modal-footer"><button type="button" class="btn btn-outline" id="cancelModal">取消</button><button type="submit" class="btn btn-primary">保存工作记录</button></div>
      </form>
    </section>
  </div>
  <div class="modal-backdrop" id="categoryModal" hidden>
    <section class="modal category-modal" role="dialog" aria-modal="true" aria-labelledby="categoryModalTitle">
      <div class="modal-header">
        <div><div class="eyebrow">CATEGORY SETTINGS</div><h2 id="categoryModalTitle">工作分类管理</h2></div>
        <button class="icon-btn" id="closeCategoryModal" aria-label="关闭">×</button>
      </div>
      <div class="category-manager-list" id="categoryManagerList"></div>
      <form id="categoryForm" class="category-form">
        <input type="hidden" id="categoryId">
        <div class="form-field"><label for="categoryName">分类名称</label><input id="categoryName" maxlength="30" required placeholder="例如：网站设计"></div>
        <div class="form-field"><label for="categoryColor">标签颜色</label>
          <select id="categoryColor">
            <option value="blue">蓝色</option><option value="green">绿色</option><option value="orange">橙色</option><option value="purple">紫色</option><option value="gray">灰色</option>
          </select>
        </div>
        <div class="category-form-actions">
          <button type="button" class="btn btn-outline" id="cancelCategoryEdit">清空</button>
          <button type="submit" class="btn btn-primary" id="saveCategoryBtn">添加分类</button>
        </div>
      </form>
      <div class="category-delete-panel" id="categoryDeletePanel" hidden>
        <div class="delete-panel-title">该分类仍被工作记录使用</div>
        <p id="categoryDeleteMessage"></p>
        <div class="form-field"><label for="replacementCategory">将这些记录转移到</label><select id="replacementCategory"></select></div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="cancelCategoryDelete">取消</button>
          <button type="button" class="btn btn-primary" id="confirmCategoryDelete">转移并删除分类</button>
        </div>
      </div>
    </section>
  </div>
  <div class="modal-backdrop" id="reportModal" hidden><section class="modal" role="dialog" aria-modal="true" aria-labelledby="reportModalTitle"><div class="modal-header"><div><div class="eyebrow">WORK REPORT</div><h2 id="reportModalTitle">工作报告导出</h2></div><button type="button" class="icon-btn" id="closeReportModal">×</button></div><p class="report-intro">下载可独立打开的 HTML 年度档案或单周报告；样式内嵌，支持浏览器打印。</p><div class="report-fields"><div class="form-field"><label for="reportScope">导出范围</label><select id="reportScope"><option value="year">年度工作档案</option><option value="week">指定周工作报告</option></select></div><div class="form-field"><label for="reportYear">年份</label><select id="reportYear"></select></div><div class="form-field" id="reportWeekWrap" hidden><label for="reportWeek">周次</label><select id="reportWeek"></select></div></div><p class="report-intro" id="reportInfo"></p><div class="modal-footer"><button type="button" class="btn btn-outline" id="reportPreview">预览报告</button><button type="button" class="btn btn-primary" id="reportDownload">下载 HTML</button></div></section></div>
  <div class="toast" id="toast" role="status"></div>
  <script src="assets/js/calendar.js"></script>
  <script src="assets/js/storage.js"></script>
  <script src="assets/js/report.js"></script>
  <script src="assets/js/app.js"></script>
</body>
</html>