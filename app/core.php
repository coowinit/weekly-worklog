<?php
declare(strict_types=1);

function config(): array {
    $path = dirname(__DIR__).'/config.local.php';
    if (!is_file($path)) throw new RuntimeException('请复制 config.example.php 为 config.local.php 并配置密码');
    $c = require $path;
    if (!is_array($c) || !is_string($c['password'] ?? null) || strlen($c['password']) < 12 || $c['password'] === 'CHANGE-THIS-TO-A-STRONG-PRIVATE-PASSWORD') {
        throw new RuntimeException('请在 config.local.php 设置长度至少 12 位的私有密码');
    }
    return $c;
}
function start_worklog_session(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        ini_set('session.use_strict_mode','1');
        ini_set('session.cookie_httponly','1');
        ini_set('session.cookie_samesite','Lax');
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ini_set('session.cookie_secure','1');
        session_start();
    }
}
function database(): PDO {
    $config = config();
    if (!extension_loaded('pdo_sqlite')) throw new RuntimeException('PHP 缺少 pdo_sqlite 扩展，请在 XAMPP php.ini 中启用');
    $path = $config['database_path'];
    if (!is_string($path) || !$path) throw new RuntimeException('数据库路径未配置');
    $directory = dirname($path);
    if (!is_dir($directory)) mkdir($directory,0700,true);
    $db = new PDO('sqlite:'.$path,null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    $db->exec('PRAGMA foreign_keys=ON');
    $db->exec('PRAGMA busy_timeout=5000');
    $db->exec('CREATE TABLE IF NOT EXISTS categories(id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE, color TEXT NOT NULL, sort INTEGER NOT NULL)');
    $db->exec('CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY, title TEXT NOT NULL, category_id TEXT NOT NULL REFERENCES categories(id), date TEXT, notes TEXT NOT NULL, created_at TEXT NOT NULL)');
    $db->exec('CREATE TABLE IF NOT EXISTS record_links(id INTEGER PRIMARY KEY AUTOINCREMENT, record_id TEXT NOT NULL REFERENCES records(id) ON DELETE CASCADE, label TEXT NOT NULL, url TEXT NOT NULL, sort INTEGER NOT NULL)');
    $db->exec('CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    $db->exec("INSERT OR IGNORE INTO metadata(key,value) VALUES ('revision','0')");
    return $db;
}
function snapshot(PDO $db): array {
    $cats = array_map(static fn(array $r):array=>['id'=>$r['id'],'name'=>$r['name'],'color'=>$r['color'],'sort'=>(int)$r['sort']],$db->query('SELECT * FROM categories ORDER BY sort, name')->fetchAll());
    $records=[];$lookup=[];
    foreach ($db->query('SELECT * FROM records ORDER BY date, created_at') as $r) {
       $lookup[$r['id']]=count($records);
       $records[]=['id'=>$r['id'],'title'=>$r['title'],'categoryId'=>$r['category_id'],'date'=>$r['date']??'','notes'=>$r['notes'],'createdAt'=>$r['created_at'],'links'=>[]];
    }
    foreach ($db->query('SELECT * FROM record_links ORDER BY record_id, sort, id') as $r) {
       if(isset($lookup[$r['record_id']]))$records[$lookup[$r['record_id']]]['links'][]=['name'=>$r['label'],'url'=>$r['url']];
    }
    return ['records'=>$records,'categories'=>$cats,'revision'=>(int)$db->query("SELECT value FROM metadata WHERE key='revision'")->fetchColumn()];
}
function valid_date(?string $value): bool {
    if($value===null || $value==='')return true;
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$value)) return false;
    $parts=explode('-',$value);return checkdate((int)$parts[1],(int)$parts[2],(int)$parts[0]);
}
function utf8_length(string $value): int {
    if (function_exists('mb_strlen')) return mb_strlen($value, 'UTF-8');
    $length = preg_match_all('/./us', $value, $matches);
    if ($length === false) throw new InvalidArgumentException('提交的数据包含无效 UTF-8 字符');
    return $length;
}
function utf8_lower(string $value): string {
    return function_exists('mb_strtolower') ? mb_strtolower($value, 'UTF-8') : strtolower($value);
}
function validate_payload(array $data): void {
    if(!isset($data['records'],$data['categories']) || !is_array($data['records']) || !is_array($data['categories']))throw new InvalidArgumentException('缺少记录或分类数组');
    if(count($data['records'])>100000||count($data['categories'])>500)throw new InvalidArgumentException('数据过大');
    $ids=[];$names=[];
    foreach($data['categories'] as $cat){
        if(!is_array($cat)||!is_string($cat['id']??null)||!preg_match('/^[a-zA-Z0-9_-]{1,80}$/D',$cat['id'])||!is_string($cat['name']??null)||utf8_length($cat['name'])>30||trim($cat['name'])===''||!in_array($cat['color']??'', ['blue','green','orange','purple','gray'],true)) throw new InvalidArgumentException('分类字段无效');
        if(isset($ids[$cat['id']])||isset($names[utf8_lower(trim($cat['name']))]))throw new InvalidArgumentException('分类 ID 或名称重复');
        $ids[$cat['id']]=true;$names[utf8_lower(trim($cat['name']))]=true;
    }
    if(!$ids) throw new InvalidArgumentException('至少保留一个分类');
    $recordIds=[];
    foreach($data['records'] as $r){
        if(!is_array($r)||!is_string($r['id']??null)||!preg_match('/^[a-zA-Z0-9_-]{1,100}$/D',$r['id'])||isset($recordIds[$r['id']])||!is_string($r['title']??null)||trim($r['title'])===''||utf8_length($r['title'])>120||!isset($ids[$r['categoryId']??''])||!valid_date($r['date']??null)||!is_string($r['notes']??null)||utf8_length($r['notes'])>20000||!is_array($r['links']??null)||count($r['links'])>100)throw new InvalidArgumentException('工作记录字段无效');
        $recordIds[$r['id']]=true;
        foreach($r['links'] as $link){
            if(!is_array($link)||!is_string($link['name']??null)||utf8_length($link['name'])>100||!is_string($link['url']??null)||strlen($link['url'])>4096||!filter_var($link['url'],FILTER_VALIDATE_URL)||!in_array(strtolower((string)parse_url($link['url'],PHP_URL_SCHEME)),['http','https'],true))throw new InvalidArgumentException('记录链接无效');
        }
    }
}
function persist(PDO $db,array $data): array {
    validate_payload($data);
    $db->beginTransaction();
    try {
        $revision=(int)$db->query("SELECT value FROM metadata WHERE key='revision'")->fetchColumn();
        if(isset($data['revision'])&&(int)$data['revision']!==$revision){throw new DomainException('数据已被其他页面修改，请备份当前内容后刷新');}
        $db->exec('DELETE FROM record_links');$db->exec('DELETE FROM records');$db->exec('DELETE FROM categories');
        $c=$db->prepare('INSERT INTO categories(id,name,color,sort) VALUES(?,?,?,?)');
        foreach($data['categories'] as $item)$c->execute([$item['id'],trim($item['name']),$item['color'],(int)($item['sort']??0)]);
        $r=$db->prepare('INSERT INTO records(id,title,category_id,date,notes,created_at) VALUES(?,?,?,?,?,?)');
        $l=$db->prepare('INSERT INTO record_links(record_id,label,url,sort) VALUES(?,?,?,?)');
        foreach($data['records'] as $item){
            $r->execute([$item['id'],$item['title'],$item['categoryId'],$item['date']??'', $item['notes']??'', $item['createdAt']??gmdate('c')]);
            foreach($item['links'] as $i=>$link)$l->execute([$item['id'],$link['name'],$link['url'],$i]);
        }
        $next=$revision+1;
        $db->prepare("UPDATE metadata SET value=? WHERE key='revision'")->execute([(string)$next]);
        $db->commit();return ['revision'=>$next];
    }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
}
