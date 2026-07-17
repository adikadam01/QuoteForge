<?php

require_once 'config.php';

try {

    echo "<pre>";

    echo "Connected to Supabase successfully!\n\n";

    $stmt = $pdo->query("SELECT version()");
    echo "Database Version:\n";
    print_r($stmt->fetch());

    echo "\n\n";

    $stmt = $pdo->query("
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    ");

    echo "Tables:\n";
    print_r($stmt->fetchAll());

} catch (Exception $e) {

    echo "ERROR\n\n";
    echo $e->getMessage();

}