<?php

require_once 'config.php';

try {

    echo "<pre>";

    echo "Connected!\n";

    $stmt = $pdo->query("SELECT DATABASE() as db");
    print_r($stmt->fetch());

    $stmt = $pdo->query("SHOW TABLES");
    print_r($stmt->fetchAll());

} catch (Exception $e) {

    echo "ERROR:\n";
    echo $e->getMessage();

}