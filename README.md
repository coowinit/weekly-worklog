# Weekly Worklog — 周度工作记录平台

**版本：v2.0.2（PHP + SQLite）**

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

## SQLite 数据库保存位置与迁移

本项目使用 **SQLite 文件数据库**，无需单独安装 MySQL/MariaDB 服务。工作记录、工作分类、关联资料链接等数据保存在一个数据库文件 **`weekly-worklog.sqlite`** 中，而不是保存在浏览器或 GitHub 仓库。

### 1. 数据库路径由哪个文件决定？

部署时将 `config.example.php` 复制为根目录的 **`config.local.php`**。真正生效的路径来自 `config.local.php` 中的 `database_path`：

```php
return [
    'password' => '请设置你自己的强密码',
    'database_path' => dirname(__DIR__, 2) . '/weekly-worklog-private/weekly-worklog.sqlite',
];
```

这里的 `__DIR__` 是 **`config.local.php` 所在的项目目录**，`dirname(__DIR__, 2)` 表示向上两级目录，再进入 `weekly-worklog-private/`。以上是示例配置；如果你曾自行修改过 `database_path`，请以当前 `config.local.php` 为准。

### 2. 不同环境中的路径示例

**Windows + XAMPP：** 假设项目安装在 `C:\xampp\htdocs\weekly-worklog\`，按示例配置，数据库将保存到：

```text
C:\xampp\
├── htdocs\
│   └── weekly-worklog\
│       ├── index.php
│       └── config.local.php
└── weekly-worklog-private\
    └── weekly-worklog.sqlite
```

**SiteGround / Linux 主机：** 假设代码位于 `/home/customer/www/example.com/public_html/222/`，同样按示例配置，路径将解析为：

```text
/home/customer/www/example.com/
├── public_html/
│   └── 222/
│       ├── index.php
│       └── config.local.php
└── weekly-worklog-private/
    └── weekly-worklog.sqlite
```

**这只是目录结构示例，不代表服务器的实际路径。** SiteGround 等主机的真实主目录可能不同。请通过主机文件管理器或 SSH 查看 `config.local.php` 的配置与所在位置，并确认数据库目录位于实际 Web 文档根目录（如 `public_html`）之外。不要直接把含有密码的完整配置文件贴到公开渠道。

### 3. 数据库如何创建？如何找到？

- 首次成功登录并使用数据库连接时，程序会根据 `database_path` 创建缺失的目录及数据库，并自动初始化数据表。前提是 PHP 进程对父目录有写入权限。
- 已经运行过的站点，**不要因为找不到数据库就随意修改路径**；修改后可能创建另一份空数据库，看起来像工作记录丢失。
- 数据库包含 `categories`（分类）、`records`（工作记录）、`record_links`（资料链接）和 `metadata`（数据修订版本）等表。
- `storage/.htaccess` 是遗留目录的辅助访问保护，**不能替代将数据库保存在 Web 根目录之外**。不同服务器也不一定支持 Apache 的 `.htaccess`。

### 4. 备份和恢复

| 备份类型 | 用途 | 推荐操作 |
| --- | --- | --- |
| **SQLite 快照**（`.sqlite`） | 完整数据库恢复 | 登录工作台后点击「备份 SQLite 数据库」下载；由 SQLite `VACUUM INTO` 生成一致性快照 |
| **JSON**（`.json`） | 跨版本迁移、记录及分类导入导出 | 点击「导出数据」保存；导入 JSON 会替换当前数据库中的记录与分类 |

建议将备份文件放在**网站目录和 GitHub 仓库之外**，并定期保留多份。

恢复 SQLite 备份时：**先备份现有数据库**，停止或暂停网站写入，确认没有尚未合并的 SQLite WAL 文件，再把一致性备份恢复至 `config.local.php` 指定的路径。不要在程序正在写入时直接覆盖数据库。恢复后重新登录，核对记录、分类和链接数量。

**升级代码不等于迁移数据库**：更新 PHP、CSS、JavaScript、README 时应保留现有 `config.local.php` 和 `weekly-worklog.sqlite`，除非经过备份并明确计划迁移。

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
node tests/template-contract.test.js
```

再使用安装了 `pdo_sqlite` 的 PHP 环境进行实际新增、刷新、导入、备份及恢复验证。Node 测试不能代替 PHP/SQLite 集成测试。

## 版本方向

- **v1.0.0**：本地浏览器工作记录。
- **v1.1.0**：年度/单周 HTML 报告。
- **v2.0.0**：PHP + SQLite 单用户动态平台、数据库备份及安全登录。
- **v2.0.1**：修复独立部署时的工作台模板缺失，正式入口继续使用 `index.php`。
- **v2.0.2**：修复旧模板与 JS 不匹配导致页面无法初始化、旧周次占位内容残留的问题。

未来以数据可靠性、兼容性、安全性维护为主，不增加复杂的项目管理功能。
