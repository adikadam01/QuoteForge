<?php

global $pdo, $path, $method;

// GET /notifications
if ($path === "/notifications" && $method === "GET") {

    $stmt = $pdo->query("
        SELECT *
        FROM notifications
        ORDER BY created_at DESC
    ");

    jsonResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

// PUT /notifications/:id/read
if (
    preg_match('#^/notifications/([\w\-]+)/read$#', $path, $matches)
    && $method === "PUT"
) {

    $id = $matches[1];

$stmt = $pdo->prepare("
    UPDATE notifications
    SET is_read = true
    WHERE id = ?
");

    $stmt->execute([$id]);

    jsonResponse([
        "success" => true
    ]);

    exit;
}

jsonResponse([
    "error" => "Notifications route not found"
],404);