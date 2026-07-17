<?php

/*
|--------------------------------------------------------------------------
| Load .env
|--------------------------------------------------------------------------
*/

if (file_exists(__DIR__ . '/../.env')) {

    $lines = file(
        __DIR__ . '/../.env',
        FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES
    );

    foreach ($lines as $line) {

        $line = trim($line);

        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        if (!str_contains($line, '=')) {
            continue;
        }

        [$name, $value] = explode('=', $line, 2);

        $name = trim($name);
        $value = trim($value, "\"' ");

        putenv("$name=$value");

        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }
}

/*
|--------------------------------------------------------------------------
| Database Configuration
|--------------------------------------------------------------------------
*/

$db_host = getenv('DB_HOST');
$db_port = getenv('DB_PORT') ?: '5432';
$db_name = getenv('DB_NAME');
$db_user = getenv('DB_USER');
$db_pass = getenv('DB_PASSWORD');

try {

    $dsn =
        "pgsql:" .
        "host={$db_host};" .
        "port={$db_port};" .
        "dbname={$db_name};" .
        "sslmode=require";

    $pdo = new PDO(

        $dsn,

        $db_user,

        $db_pass,

        [

            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,

            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

            PDO::ATTR_EMULATE_PREPARES => false,

        ]

    );

} catch (PDOException $e) {

    http_response_code(500);

    header('Content-Type: application/json');

    echo json_encode([

        'error' => 'Database connection failed',

        'message' => $e->getMessage()

    ]);

    exit;
}