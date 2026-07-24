<?php

global $pdo;

$rawBody = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';
$webhookSecret = getenv('RAZORPAY_WEBHOOK_SECRET');

if (!$webhookSecret) {
    http_response_code(500);
    echo json_encode(['error' => 'Webhook secret not configured']);
    exit;
}

$expectedSignature = hash_hmac('sha256', $rawBody, $webhookSecret);
if (!hash_equals($expectedSignature, $signature)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

$payload = json_decode($rawBody, true);
$event = $payload['event'] ?? '';

if ($event !== 'payment.captured') {
    http_response_code(200);
    echo json_encode(['status' => 'ignored']);
    exit;
}

$paymentEntity = $payload['payload']['payment']['entity'] ?? null;
$orderId = $paymentEntity['order_id'] ?? null;
$paymentId = $paymentEntity['id'] ?? null;

if (!$orderId || !$paymentId) {
    http_response_code(200);
    echo json_encode(['status' => 'missing ids']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM invoices WHERE razorpay_order_id = ?");
$stmt->execute([$orderId]);
$invoice = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$invoice) {
    http_response_code(200);
    echo json_encode(['status' => 'invoice not found for order']);
    exit;
}

// Idempotency — Razorpay retries webhooks, this event can arrive more than once
if ($invoice['invoice_status'] === 'paid') {
    http_response_code(200);
    echo json_encode(['status' => 'already paid']);
    exit;
}

// Razorpay orders are only created for the full amount_due at order-creation
// time (see the razorpay-order endpoint), so — matching the manual
// "Mark Payment Received" flow — this always closes the invoice out fully.
// Milestone invoices aren't supported through this flow yet, since the manual
// flow's per-milestone bookkeeping doesn't map onto a single full payment.
$paidAmount = (float)$invoice['amount_due'];
$now = date('Y-m-d H:i:s');

// Mirror InvoiceView.tsx's onConfirm: for milestone invoices, mark the
// current milestone's status as paid inside the JSON array. Every other
// invoice type is unaffected — milestones_json stays whatever it already is.
$milestonesJson = $invoice['milestones_json'];
if (($invoice['type'] ?? null) === 'milestone') {
    $milestones = is_string($milestonesJson) ? json_decode($milestonesJson, true) : ($milestonesJson ?? []);
    $idx = isset($invoice['milestone_index']) ? (int)$invoice['milestone_index'] : 0;
    if (is_array($milestones) && isset($milestones[$idx]) && ($milestones[$idx]['status'] ?? null) !== 'paid') {
        $milestones[$idx]['status'] = 'paid';
    }
    $milestonesJson = json_encode($milestones);
}

$pdo->beginTransaction();
try {
    // 1. Mark invoice paid — mirrors InvoiceView.tsx's onConfirm exactly
    $upd = $pdo->prepare("
        UPDATE invoices
        SET invoice_status = 'paid',
            status = 'paid',
            paid_at = COALESCE(paid_at, ?),
            payment_method = 'Online',
            payment_reference = ?,
            payment_received_at = ?,
            amount_paid = ?,
            amount_due = 0,
            razorpay_payment_id = ?,
            milestones_json = ?
        WHERE id = ?
    ");
    $upd->execute([$now, $paymentId, $now, $paidAmount, $paymentId, $milestonesJson, $invoice['id']]);
    // 2. Create the receipt — same shape as the manual flow's createReceipt() call.
    //    Note: receipt id === invoice id by design (one receipt per invoice),
    //    and share_token stays null since it's unused everywhere else too.
    $insReceipt = $pdo->prepare("
        INSERT INTO receipts
            (id, receipt_number, invoice_id, client_id, currency, amount,
             payment_method, payment_reference, payment_date, notes, share_token, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'Online', ?, ?, NULL, NULL, ?)
    ");
    $insReceipt->execute([
        $invoice['id'],
        'RCPT-' . $invoice['invoice_number'],
        $invoice['id'],
        $invoice['client_id'],
        $invoice['currency'],
        $paidAmount,
        $paymentId,
        $now,
        $now,
    ]);

    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

http_response_code(200);
echo json_encode(['status' => 'ok']);