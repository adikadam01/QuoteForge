<?php

require_once __DIR__ . '/../config.php';

$input = getJsonInput();
$password = $input['password'] ?? '';

// Hardcoded password (swap for env var later)
$ADMIN_PASSWORD = 'admin123';

if ($password === $ADMIN_PASSWORD) {
    $token = generateToken('admin');
    jsonResponse(['token' => $token]);
} else {
    jsonResponse(['error' => 'Invalid password'], 401);
}