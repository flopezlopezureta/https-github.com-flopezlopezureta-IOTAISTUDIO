
<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Configuración de base de datos (ajustar según servidor)
$host = "localhost";
$user = "root"; 
$pass = ""; 
$db   = "selcom_iot";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(["error" => "Conexión fallida"]));
}

// Recibir JSON del dispositivo
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['mac']) || !isset($data['value'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Datos inválidos"]);
    exit;
}

$mac = $conn->real_escape_with_string($data['mac']);
$value = floatval($data['value']);

// 1. Registrar medición
$stmt = $conn->prepare("INSERT INTO measurements (device_key, value) VALUES (?, ?)");
$stmt->bind_param("sd", $mac, $value);
$stmt->execute();

// 2. Actualizar estado del dispositivo
$stmt_dev = $conn->prepare("UPDATE devices SET last_value = ?, status = 'online', last_update = NOW() WHERE device_key = ?");
$stmt_dev->bind_param("ds", $value, $mac);
$stmt_dev->execute();

echo json_encode(["status" => "success", "received" => $value]);

$conn->close();
?>
