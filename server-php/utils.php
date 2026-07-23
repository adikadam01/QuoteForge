<?php

require_once 'config.php';

// --- CORS ---
function handleCors() {
    // Allow all origins for now, or restrict to specific domains in production
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');    // cache for 1 day
    }

    // Access-Control headers are received during OPTIONS requests
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");         

        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

        exit(0);
    }
}

// --- JSON Response Helper ---
function jsonResponse($data, $status = 200) {
    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function getJsonInput() {
    $input = json_decode(file_get_contents('php://input'), true);
    return $input ?: [];
}

// --- Authentication ---
// Secret should be loaded from env
$JWT_SECRET = getenv('JWT_SECRET') ?: 'super-secret-key-change-in-prod';
$ADMIN_PASSWORD = getenv('ADMIN_PASSWORD') ?: 'admin';

function generateToken($role = 'admin') {
    global $JWT_SECRET;
    $payload = json_encode(['role' => $role, 'ts' => time()]);
    $b64 = base64_encode($payload);
    $signature = hash_hmac('sha256', $payload, $JWT_SECRET);
    return "$b64.$signature";
}

function verifyToken($token) {
    global $JWT_SECRET;
    $parts = explode('.', $token);
    if (count($parts) !== 2) return false;
    
    list($b64, $hash) = $parts;
    $payload = base64_decode($b64);
    if (!$payload) return false;

    // Verify signature
    $checkHash = hash_hmac('sha256', $payload, $JWT_SECRET);
    
    return hash_equals($hash, $checkHash);
}

// function requireAuth() {
//     // Public Routes (whitelist)
    
//     $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
//     $method = $_SERVER['REQUEST_METHOD'];

//     // Strip /api prefix if strictly matching against it, or just partial match
//     // Our router sends us here implies we are handling a request.
    
//     // Explicit public routes
//     if (strpos($path, '/auth/login') !== false) return;
//     if (strpos($path, '/health') !== false) return;
    
//     // Brand Kit GET is public
//     if (strpos($path, '/brand-kit') !== false && $method === 'GET') return;

//     // Public Quotations (GET /api/quotations/:uuid)
//     // UUID regex: 8-4-4-4-12 hex digits
//     // The path might be /api/quotations/some-uuid
//     if ($method === 'GET' && preg_match('#\/api\/quotations\/[\w\-]+$#', $path)) {
//        return;
//     }

//     // Check Header
//     $headers = getallheaders();
//     $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
//     if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
//         jsonResponse(['error' => 'Unauthorized'], 401);
//     }

//     $token = $matches[1];
//     if (!verifyToken($token)) {
//         jsonResponse(['error' => 'Invalid token'], 403);
//     }
// }


function requireAuth() {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $method = $_SERVER['REQUEST_METHOD'];

    // Public routes — no login required
    if (strpos($path, '/auth/login') !== false) return;
    if (strpos($path, '/health') !== false) return;

    // Public quotation share links (view + client accept/decline)
    if (preg_match('#/api/quotations/[\w\-]+$#', $path) && ($method === 'GET' || $method === 'PUT')) return;

    // Public invoice share links (view only)
    if (preg_match('#/api/invoices/[\w\-]+$#', $path) && $method === 'GET') return;
    if (preg_match('#/api/invoices/[\w\-]+/items$#', $path) && $method === 'GET') return;

    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }

    $token = $matches[1];
    if (!verifyToken($token)) {
        jsonResponse(['error' => 'Invalid token'], 403);
    }
}

// Polyfill for getallheaders if running on FPM/Nginx where it might be missing
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}
