<?php

// POST /api/auth/login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getJsonInput();
    $password = $input['password'] ?? '';
    
    // $ADMIN_PASSWORD defined in utils.php (from config)
    if ($password === $ADMIN_PASSWORD) {
        $token = generateToken();
        jsonResponse(['token' => $token]);
    } else {
        jsonResponse(['error' => 'Invalid password'], 401);
    }
}
