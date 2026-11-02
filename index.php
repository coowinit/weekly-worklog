<?php
declare(strict_types=1);
require __DIR__.'/app/core.php';
header('Cache-Control: private, no-store, no-cache, must-revalidate');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
try {$config=config();start_worklog_session();} catch (Throwable $e) {http_response_code(503);echo '<meta charset="utf-8"><p>'.htmlspecialchars($e->getMessage(),ENT_QUOTES,'UTF-8').'</p>';exit;}
if($_SERVER['REQUEST_METHOD']==='POST' && isset($_POST['logout'])) {
    $received=(string)($_POST['csrf']??'');
    if(empty($_SESSION['worklog_auth']) || !hash_equals((string)($_SESSION['worklog_csrf']??''),$received)) {
        http_response_code(403);exit('Forbidden');
    }
    $_SESSION=[];
    if(ini_get('session.use_cookies')) {
        $p=session_get_cookie_params();
        setcookie(session_name(),'',time()-42000,$p['path'],$p['domain'],$p['secure'],$p['httponly']);
    }
    session_destroy();
    header('Location: index.php');exit;
}
if($_SERVER['REQUEST_METHOD']==='POST'&&isset($_POST['login_password'])){
    // Session-based throttle mitigates accidental and repeated password guessing.
    // Internet deployments should ALSO use a server/network-level rate limit.
    $now=time();
    $attempts=array_values(array_filter((array)($_SESSION['worklog_login_attempts']??[]),static fn($t)=>is_int($t)&&$t>$now-900));
    if(count($attempts)>=5){http_response_code(429);$error='登录尝试过多，请稍后再试';}
    elseif(hash_equals($config['password'],(string)$_POST['login_password'])){
        unset($_SESSION['worklog_login_attempts']);
        session_regenerate_id(true);$_SESSION['worklog_auth']=true;
        $_SESSION['worklog_csrf']=bin2hex(random_bytes(32));header('Location: index.php');exit;
    } else {
        $attempts[]=$now;$_SESSION['worklog_login_attempts']=$attempts;$error='密码不正确';
    }
}
if(empty($_SESSION['worklog_auth'])){
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Weekly Worklog 登录</title><style>body{font:14px/1.6 sans-serif;background:#f3f6fb;display:grid;place-items:center;min-height:90vh}form{background:white;padding:30px;border-radius:12px;width:min(340px,92%);box-shadow:0 10px 30px #dbe2ec}input,button{box-sizing:border-box;width:100%;padding:12px;margin:8px 0;font:inherit}button{background:#3169d8;color:white;border:0;border-radius:7px}</style><form method="post"><h2>Weekly Worklog</h2><p>请输入管理员密码</p>'.(isset($error)?'<p style="color:#c44">'.$error.'</p>':'').'<input name="login_password" type="password" required autocomplete="current-password"><button>登录工作台</button></form></html>';exit;
}
try {$snapshot=snapshot(database());}catch(Throwable $e){http_response_code(503);echo '<meta charset="utf-8">数据库不可用：'.htmlspecialchars($e->getMessage(),ENT_QUOTES,'UTF-8');exit;}
$csrf=$_SESSION['worklog_csrf']??=bin2hex(random_bytes(32));
$templatePath=__DIR__.'/app/workbench-template.php';
$html=@file_get_contents($templatePath);
if($html===false || !str_contains($html,'<script src="assets/js/app.js"></script>') || !str_contains($html,'<!-- SERVER_TOOLS -->')){
    http_response_code(503);
    error_log('Weekly Worklog: required internal workbench template is missing or incomplete');
    exit('工作台模板缺失或不完整，请检查部署文件');
}
$html=str_replace('<script src="assets/js/app.js"></script>', '<script>window.WORKLOG_SERVER='.json_encode(['records'=>$snapshot['records'],'categories'=>$snapshot['categories'],'revision'=>$snapshot['revision'],'csrf'=>$csrf],JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE).';</script><script src="assets/js/app.js"></script>',$html);
$logoutForm='<form method="post" action="index.php" class="logout-form"><input type="hidden" name="logout" value="1"><input type="hidden" name="csrf" value="'.htmlspecialchars($csrf,ENT_QUOTES,'UTF-8').'"><button type="submit" class="side-link"><span class="nav-icon">⇥</span>退出登录</button></form>';
$html=str_replace('<!-- SERVER_TOOLS -->','<a class="side-link" href="backup.php"><span class="nav-icon">⇩</span>备份 SQLite 数据库</a>'.$logoutForm,$html);
// Add cache-busting query strings to the PHP-rendered entry only.
// A stale static app.js otherwise attempts to write to browser LocalStorage.
$html=str_replace('assets/js/app.js"','assets/js/app.js?v=2.0.1"',$html);
$html=str_replace('assets/js/storage.js"','assets/js/storage.js?v=2.0.1"',$html);
$html=str_replace('assets/css/style.css"','assets/css/style.css?v=2.0.1"',$html);
$html=str_replace('assets/js/report.js"','assets/js/report.js?v=2.0.1"',$html);
$html=str_replace('assets/js/calendar.js"','assets/js/calendar.js?v=2.0.1"',$html);
$html=str_replace('本地演示模式','SQLite 动态模式',$html);
$html=str_replace('数据保存在当前浏览器','数据已连接至 SQLite',$html);
$html=str_replace('自动保存在本机','自动保存在数据库',$html);
header('Cache-Control: private, no-store, no-cache, must-revalidate');header('Pragma: no-cache');header('Content-Type: text/html; charset=utf-8');echo $html;
