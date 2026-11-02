<?php
declare(strict_types=1);
require __DIR__.'/app/core.php';
header('Cache-Control: private, no-store, max-age=0');header('X-Frame-Options: DENY');header('Referrer-Policy: no-referrer');header('X-Content-Type-Options: nosniff');header('Content-Type: application/json; charset=utf-8');
try {
    config(); start_worklog_session();
    if(empty($_SESSION['worklog_auth'])){http_response_code(401);echo json_encode(['error'=>'需要先登录']);exit;}
    if($_SERVER['REQUEST_METHOD']==='GET'){echo json_encode(snapshot(database()),JSON_UNESCAPED_UNICODE);exit;}
    if($_SERVER['REQUEST_METHOD']!=='PUT'){http_response_code(405);echo json_encode(['error'=>'不支持此请求']);exit;}
    if(!hash_equals($_SESSION['worklog_csrf']??'',$_SERVER['HTTP_X_WORKLOG_CSRF']??'')){http_response_code(403);echo json_encode(['error'=>'安全令牌无效']);exit;}
    $json=file_get_contents('php://input',false,null,0,15000001);
    if(strlen($json)>15000000)throw new InvalidArgumentException('数据文件过大');
    $data=json_decode($json,true,512,JSON_THROW_ON_ERROR);
    if(!is_array($data))throw new InvalidArgumentException('JSON 格式无效');
    echo json_encode(persist(database(),$data),JSON_UNESCAPED_UNICODE);
} catch(DomainException $e){http_response_code(409);echo json_encode(['error'=>$e->getMessage()],JSON_UNESCAPED_UNICODE);}
catch(InvalidArgumentException|JsonException $e){http_response_code(422);echo json_encode(['error'=>$e->getMessage()],JSON_UNESCAPED_UNICODE);}
catch(Throwable $e){error_log('Weekly Worklog API error: '.(string)$e);http_response_code(500);echo json_encode(['error'=>'服务器处理失败，请检查 PHP 错误日志（数据库路径、PDO SQLite、PHP 扩展或文件权限）'],JSON_UNESCAPED_UNICODE);}
