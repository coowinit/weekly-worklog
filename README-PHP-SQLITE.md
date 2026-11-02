# Weekly Worklog · PHP + SQLite 部署与升级指南

> v2.0.0 安装与维护文档。公网访问仍需 HTTPS、独立强密码、数据库置于 Web 公开目录之外，以及服务器层的访问限制和登录限流。

## Windows XAMPP 测试

1. 将 `weekly-worklog` 整个目录复制到 `C:\\xampp\\htdocs\\weekly-worklog`（Windows 实际路径按你的安装情况调整）。
2. 在 XAMPP `php.ini` 中启用 `extension=pdo_sqlite`、`extension=sqlite3`，重启 Apache；确保扩展正确加载。
3. 把 `config.example.php` 复制为 `config.local.php`，修改 `password` 为至少 12 位的私人密码。
4. 浏览器访问 `http://localhost/weekly-worklog/index.php`（必须访问 PHP 入口，而不是直接打开 `index.html`）。
5. 登录后会创建 SQLite 数据库，初始没有工作记录。点击“导入数据”，选择旧版导出的 JSON，并确认导入。
6. 新增记录、刷新验证持久保存；再测试分类管理和年度 HTML 导出。

## 本轮安全和备份增强

- 管理员登录后，侧边栏提供 **备份 SQLite 数据库** 按钮，下载可离线保存的数据库快照。使用 SQLite `VACUUM INTO`，避免直接复制正在读写的数据库文件。
- 增加 **退出登录**，清理 PHP 会话；退出表单带 CSRF 校验。
- **默认数据库路径已经调整**：在 `C:\xampp\htdocs\weekly-worklog` 安装时，数据库默认位于 `C:\xampp\weekly-worklog-private\weekly-worklog.sqlite`，不在公开网页目录下。首次使用请复制新的 `config.example.php`，并按实际目录核对 `database_path`。
- 如果你已有测试版 `config.local.php`，**不要直接覆盖原配置或删除旧数据库**。先登录旧版导出 JSON，并对旧版 SQLite 文件做备份，再确定新的数据库位置。迁移时可以先在新配置里继续指向旧数据库路径，确认无误后再移动数据库（移动时停止 Apache）。
- JSON 备份继续保留，用于跨版本的数据迁移；SQLite 文件备份用于完整恢复数据库。两者不是同一个用途。

### 数据恢复说明

1. 确保已有单独保管的 `.sqlite` 备份文件。
2. 停止 Apache，确认没有程序访问数据库。
3. 在安全位置备份现有数据库文件；把备份文件恢复到 `config.local.php` 指定的数据库路径。
4. 如果原数据库开启过 WAL，请勿在有未合并 WAL 文件的情况下直接覆盖数据库；先通过正常关闭/检查点流程完成一致性处理。
5. 重新启动 Apache 并登录检查记录数量、分类和链接。

**提醒：** 当前仍然是单用户开发预览版，不宜直接部署到公网；如果需要公网使用，还必须增加登录限速、HTTPS 和部署访问控制。

## 当前数据设计

- SQLite 表：`categories`、`records`、`record_links`、`metadata`。
- `index.php` 服务端登录与首次数据快照；`api.php` JSON 读写接口。
- 写入使用事务与版本号检查，避免两个页面互相覆盖；API 必须经过登录会话和 CSRF 校验。
- JSON 导出依然可以作为离线备份；导入操作会**替换数据库现有的分类、记录及链接**，导入前请备份。
- 默认数据库目录由 `config.local.php` 指定；应当位于公开 Web 根目录之外。仓库保留的 `storage/.htaccess` 仅用于旧版本兼容，不是线上唯一安全措施。
- 不要把 `config.local.php`、SQLite 文件或 JSON 真实工作数据提交到公共 GitHub 仓库。

## 重要限制

- 此版本用全量数据快照写入 SQLite，适合单人、少量记录，不是多用户高并发设计。
- 项目维护方已在目标环境完成新增、编辑、JSON 导入与 HTML 报告的手工测试；但自动化的 PHP + SQLite 端到端测试尚未提供，仍需在每个部署环境单独验证。
- PHP 本地版没有接入 WordPress，也不涉及账号注册、云同步或多用户权限。
- `file://` / VS Code Live Server 无法执行 PHP。请务必通过 XAMPP 的 Apache 访问 `index.php`。
- `index.html` 保留作为静态页面参考，不能作为 SQLite 动态入口。


## SQLite 保存故障排查与顶部状态优化（2026-11-02）

### 本轮修改

- SQLite 全量写入改为 PDO `beginTransaction()` / `commit()` / `rollBack()` 对应的事务调用，避免事务状态异常。
- PHP 模式的保存失败显示具体的 HTTP 状态及错误信息，不再误报 `LocalStorage` 容量不足。
- 登录过期（401）、安全令牌失效（403）、数据版本冲突（409）、字段不合法（422）、服务器异常（500）均给出不同提示。
- 顶部原来占满整行的橙色横幅改为右上方紧凑通知框：正常情况下隐藏；错误时显示并可关闭。
- 为 PHP 页面引用的 `app.js` / `storage.js` / `style.css` 增加版本参数，降低线上旧缓存影响。
- `mbstring` 缺失时提供 UTF-8 校验回退，避免因扩展缺少导致整个保存接口 500。
- 若 PHP 页面异常未注入服务器数据，明确报“服务器初始化失败”，不会偷偷回退到浏览器本地存储。

### 安装或更新（确保原数据库不丢失）

1. **先备份旧版 SQLite 数据库、JSON 和 `config.local.php`**。不要把真实数据库上传公共 GitHub。
2. 只替换代码文件；**保留原有 `config.local.php` 和数据库文件**，确认 `database_path` 指向正在使用的数据库。
3. 如果线上有 WP Rocket / Cloudflare 或主机缓存，排除 `/222/index.php` 与 `/222/api.php` 的缓存；应用含登录会话，禁止缓存动态页面和 API。浏览器强制刷新 `Ctrl + F5`。
4. 重新登录，用新建记录测试：保存后按 F5，观察是否继续存在。导入 JSON 前先备份 SQLite。
5. 如保存仍失败，按 F12 → Network → 找到 `api.php` 的 `PUT` 请求，检查状态码及 Response 中的 `error`。**仅分享 HTTP 状态码和经过脱敏的错误提示，不要公开 Cookie、CSRF、密码、数据库路径或整份请求数据。**

### 线上安全

如部署在公共网站 `/222/` 下，请确保使用 HTTPS、设置高强度密码、数据库保存在 Web 公开目录之外，并考虑通过服务器访问控制限制私人工作台。该预览版不含登录尝试限流机制，不建议无额外保护地对互联网开放。 

## GitHub 发布前注意事项

- 不得提交 `config.local.php`、SQLite 数据库、导出的 JSON 或公司内部工作记录。
- PHP 版本使用 `index.php`，`index.html` 仅作为静态参考。
- 如果只希望公开 PHP 动态版代码，不要启用指向 `index.html` 的公开预览链接。
- 本版新增会话级登录失败次数限制，但该限制不能代替服务器级防暴力破解措施。
