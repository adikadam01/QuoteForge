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


// PUT /notifications/read-all
if ($path === "/notifications/read-all" && $method === "PUT") {

    $stmt = $pdo->prepare("
        UPDATE notifications
        SET is_read = true
        WHERE is_read = false
    ");

    $stmt->execute();

    jsonResponse([
        "success" => true
    ]);

    exit;
}

// POST /notifications
if ($path === "/notifications" && $method === "POST") {
    $input = getJsonInput();

    $stmt = $pdo->prepare("
        INSERT INTO notifications (id, quotation_id, invoice_id, client_id, type, title, message, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, false, NOW())
    ");
    $stmt->execute([
        $input['id'],
        $input['quotation_id'] ?? null,
        $input['invoice_id'] ?? null,
        $input['client_id'] ?? null,
        $input['type'],
        $input['title'],
        $input['message'],
    ]);

    jsonResponse(['success' => true]);
    exit;
}

// GET /notifications/check-due-dates
// Idempotent scan: for unpaid invoices whose due_date falls within the
// threshold, insert a "due_soon" notification only if one doesn't already
// exist for that invoice — safe to call repeatedly from polling.
if ($path === "/notifications/check-due-dates" && $method === "GET") {

    $thresholdDays = 3;

    $stmt = $pdo->prepare("
        SELECT id, invoice_number, due_date, quotation_id, client_id
        FROM invoices
        WHERE invoice_status != 'paid'
          AND due_date IS NOT NULL
          AND due_date >= CURRENT_DATE
          AND due_date <= (CURRENT_DATE + INTERVAL '{$thresholdDays} days')
    ");
    $stmt->execute();
    $dueSoon = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $createdCount = 0;

    foreach ($dueSoon as $inv) {
        $existsStmt = $pdo->prepare("
            SELECT id FROM notifications
            WHERE invoice_id = ? AND type = 'due_soon'
            LIMIT 1
        ");
        $existsStmt->execute([$inv['id']]);
        if ($existsStmt->fetch()) {
            continue; // Already notified for this invoice — skip.
        }

        $daysUntilDue = (int) round(
            (strtotime($inv['due_date']) - strtotime(date('Y-m-d'))) / 86400
        );

        $id = bin2hex(random_bytes(16));
        $title = "Invoice due soon";
        $message = "Invoice {$inv['invoice_number']} is due in {$daysUntilDue} day" .
            ($daysUntilDue === 1 ? "" : "s") . ".";

        $insStmt = $pdo->prepare("
            INSERT INTO notifications (id, quotation_id, invoice_id, client_id, type, title, message, is_read, created_at)
            VALUES (?, ?, ?, ?, 'due_soon', ?, ?, false, NOW())
        ");
        $insStmt->execute([$id, $inv['quotation_id'], $inv['id'], $inv['client_id'], $title, $message]);

        $createdCount++;
    }

    jsonResponse(['success' => true, 'notifications_created' => $createdCount]);
    exit;
}

// -----------------------------------------------------------------------
// IMPORTANT: these two literal-path DELETE routes MUST be checked BEFORE
// the generic "DELETE /notifications/:id" route below. That route's regex
// (`[\w\-]+`) matches ANY word/hyphen string — including the literal words
// "clear-read" and "all" — so if it ran first it would swallow these
// requests, treat "clear-read"/"all" as if they were a notification id,
// delete zero rows (no row has that id), and still report success. That
// was the exact bug: "Clear notifications" appeared to work (optimistic
// UI + fake success response) but nothing was actually deleted, so a
// refresh brought everything back.
// -----------------------------------------------------------------------

// DELETE /notifications/clear-read
// Removes every notification already marked as read — this is what
// "Clear notifications" calls, so unread items are never silently lost.
if ($path === "/notifications/clear-read" && $method === "DELETE") {

    $stmt = $pdo->prepare("
        DELETE FROM notifications
        WHERE is_read = true
    ");

    $stmt->execute();

    jsonResponse([
        "success" => true,
        "deleted" => $stmt->rowCount()
    ]);

    exit;
}

// DELETE /notifications/all
// Removes everything, read or not — used if the user wants a hard reset.
if ($path === "/notifications/all" && $method === "DELETE") {

    $stmt = $pdo->prepare("DELETE FROM notifications");
    $stmt->execute();

    jsonResponse([
        "success" => true,
        "deleted" => $stmt->rowCount()
    ]);

    exit;
}

// DELETE /notifications/:id
// Generic single-notification delete — must stay LAST among the DELETE
// routes so the more specific literal-path routes above get first crack
// at matching "clear-read" and "all".
if (
    preg_match('#^/notifications/([\w\-]+)$#', $path, $matches)
    && $method === "DELETE"
) {

    $id = $matches[1];

    $stmt = $pdo->prepare("
        DELETE FROM notifications
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
], 404);