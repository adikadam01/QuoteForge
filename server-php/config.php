<?php

// Load environment variables if .env file exists (simple parser)
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        // Remove quotes if present
        $value = trim($value, '"\'');
        putenv(sprintf('%s=%s', $name, $value));
        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }
}

// Database Configuration
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_port = getenv('DB_PORT') ?: '3306';
$db_name = getenv('DB_NAME') ?: 'agency_app';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASSWORD') ?: '';

try {
    $dsn = "mysql:host=$db_host;port=$db_port;dbname=$db_name;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
}catch (\PDOException $e) {

    http_response_code(500);

    echo json_encode([
        'error' => 'Database connection failed',
        'message' => $e->getMessage()
    ]);

    exit;
}




// catch (\PDOException $e) {
//     // In production, log this and show generic error
//     error_log($e->getMessage());
//     http_response_code(500);
//     echo json_encode(['error' => 'Database connection failed']);
//     exit;
// }
