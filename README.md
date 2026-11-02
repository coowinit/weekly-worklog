# Weekly Worklog — 周度工作记录平台

**版本：v2.0.1（PHP + SQLite）**

基于原生 HTML、CSS、JavaScript、PHP 和 SQLite 的轻量单用户工作记录平台。按**周**整理工作成果、分类、备注和资料链接；可按**年度或单周**导出独立 HTML 报告。项目不引入大型框架，也不把周记录扩展成项目管理系统。

## 主要功能

- 星期日开始、星期六结束的周历；包含 1 月 1 日的那一周是新年的第 1 周（非 ISO 周编号）。
- 记录与分类的增删改、年度周次索引、记录搜索和筛选。
- PHP 登录、SQLite 持久化、数据版本检查与事务保存。
- JSON 数据导入/导出，兼容静态 v1.x 导出的备份文件。
- SQLite 数据库一致性快照下载（VACUUM INTO）。
- 年度/单周 HTML 报告预览、下载，单文件内嵌 CSS、支持 A4 打印。
- 桌面端表格、手机端卡片；中文优先系统字体。

## 安装（PHP + SQLite）

1. 确保 PHP 支持 **PDO SQLite**，Apache 或其他 PHP Web 服务器可正常运行；推荐先在 Windows XAMPP 测试。
2. 将仓库复制到 `htdocs/weekly-worklog/`（或网站对应目录）。
3. 复制 `config.example.php` 为 **`config.local.php`**，设置至少 12 位的独立管理密码，并**确认数据库路径位于 Web 文档根目录之外**。
4. 使用 `http://localhost/weekly-worklog/index.php` 登录。**不要**双击 HTML 文件或用 VS Code Live Server 运行 PHP 动态版。
5. 登录后数据库自动建表（首次为空）；若有 v1.x 旧数据，请先用 JSON 备份再通过“导入数据”迁移。
6. 新增一条测试记录、刷新、编辑、删除、再次刷新；验证 JSON 和 HTML 报告以及 SQLite 备份。

具体升级和恢复注意事项见 [PHP + SQLite 部署指南](README-PHP-SQLITE.md)。

## 文件结构

```text
weekly-worklog/
├── index.php             # PHP 登录与动态页面入口
├── app/workbench-template.php # 仅由 index.php 读取的内部工作台模板
├── api.php               # 登录后的 JSON API
├── backup.php            # 登录后的 SQLite 备份下载
├── app/core.php          # 配置、建表、校验、事务和快照
├── config.example.php    # 配置模板，复制后调整
├── config.local.php      # 本机私有配置，不提交 Git
├── assets/css/style.css
├── assets/js/{app,calendar,report,storage}.js
├── storage/.htaccess     # 旧目录防护；数据库应放 Web 根目录之外
├── tests/
├── README.md
├── README-PHP-SQLITE.md
└── CHANGELOG.md
```

## 数据安全与备份

**注意：本仓库是公开源代码，不应上传任何真实工作记录、密码、数据库或公司内部文件。**

- `config.local.php`、`.sqlite` 文件已由 `.gitignore` 排除，但上传前仍要人工核对提交列表。
- 默认 SQLite 路径用于常见 XAMPP 目录结构；其他主机环境须根据实际 `DOCUMENT_ROOT` 确认数据库位于 Web 公开目录之外。
- 备份 JSON 用于跨版本数据迁移；备份 SQLite 用于完整数据库恢复。两者都应保存在非公开位置。
- JSON 导入会替换数据库当前记录和分类。执行前先备份。
- 管理员密码由本地 PHP 配置校验，不包含多用户系统。已加入会话级登录尝试限制，但**公网仍建议额外配置 IP 访问控制、服务器级限速和 HTTPS**。
- PHP 动态页面及 API 应排除 CDN/WordPress 缓存；不要在共享的公共 URL 下开放未受保护的后台。

## 测试

```bash
node tests/calendar.test.js
node tests/storage.test.js
node tests/report.test.js
```

再使用安装了 `pdo_sqlite` 的 PHP 环境进行实际新增、刷新、导入、备份及恢复验证。Node 测试不能代替 PHP/SQLite 集成测试。

## 版本方向

- **v1.0.0**：本地浏览器工作记录。
- **v1.1.0**：年度/单周 HTML 报告。
- **v2.0.0**：PHP + SQLite 单用户动态平台、数据库备份及安全登录。
- **v2.0.1**：修复独立部署时的工作台模板缺失，正式入口继续使用 `index.php`。

未来以数据可靠性、兼容性、安全性维护为主，不增加复杂的项目管理功能。
