
<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

// IMPORTANTE: Cambiar estas credenciales por las de Hostinger
$host = "localhost";
$user = "root";
$pass = "";
$db   = "selcom_iot";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    // En producción, no mostrar errores detallados de conexión
    die(json_encode(["error" => "Error de conexión a base de datos"]));
}

$action = $_GET['action'] ?? '';

switch($action) {
    case 'get_devices':
        $company_id = $_GET['company_id'] ?? '';
        // Prevenir inyección SQL básica
        $company_id = $conn->real_escape_string($company_id);
        
        $sql = "SELECT * FROM devices";
        if ($company_id) $sql .= " WHERE company_id = '$company_id'";
        
        $result = $conn->query($sql);
        $devices = [];
        if ($result) {
            while($row = $result->fetch_assoc()) {
                $devices[] = [
                    "id" => $row['id'],
                    "name" => $row['name'],
                    "mac_address" => $row['device_key'],
                    "value" => floatval($row['last_value']),
                    "status" => $row['status'],
                    "unit" => $row['unit'],
                    "company_id" => $row['company_id']
                ];
            }
        }
        echo json_encode($devices);
        break;

    case 'get_history':
        $mac = $_GET['mac'] ?? '';
        $stmt = $conn->prepare("SELECT value, timestamp FROM measurements WHERE device_key = ? ORDER BY timestamp DESC LIMIT 50");
        if ($stmt) {
            $stmt->bind_param("s", $mac);
            $stmt->execute();
            $res = $stmt->get_result();
            $history = [];
            while($row = $res->fetch_assoc()) {
                $history[] = $row;
            }
            echo json_encode($history);
        } else {
            echo json_encode([]);
        }
        break;

    default:
        echo json_encode(["status" => "online", "version" => "1.0.2", "server" => $_SERVER['SERVER_NAME']]);
        break;
}

$conn->close();
?>
