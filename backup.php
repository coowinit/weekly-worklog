<?php
declare(strict_types=1);
require __DIR__.'/app/core.php';
header('Cache-Control: no-store, private');
try {
    config();start_worklog_session();
    if(empty($_SESSION['worklog_auth'])) {
        http_response_code(401);exit('请先登录');
    }
    // A temporary SQLite file is created by SQLite itself, not copied from a potentially active database.
    $tmp=tempnam(sys_get_temp_dir(),'weekly-worklog-');
    if($tmp===false)throw new RuntimeException('无法创建临时备份文件');
    unlink($tmp); // VACUUM INTO requires the target not to exist.
    try {
        $db=database();
        $db->exec('VACUUM INTO '.$db->quote($tmp));
        if(!is_file($tmp)||filesize($tmp)===false)throw new RuntimeException('数据库备份失败');
        header('Content-Type: application/vnd.sqlite3');
        header('Content-Disposition: attachment; filename="weekly-worklog-'.date('Y-m-d-His').'.sqlite"');
        header('Content-Length: '.filesize($tmp));
        header('X-Content-Type-Options: nosniff');
        readfile($tmp);
    } finally {
        if(is_file($tmp))unlink($tmp);
    }
} catch(Throwable $e) {
    error_log((string)$e);
    if(!headers_sent())http_response_code(500);
    exit('无法生成 SQLite 备份，请检查 PHP 日志和临时目录权限');
}
