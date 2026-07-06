<?php
require_once 'config.php';
$stmt = $pdo->query("DESCRIBE invoices");
print_r($stmt->fetchAll());
