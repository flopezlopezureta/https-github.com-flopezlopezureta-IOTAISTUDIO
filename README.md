
# Selcom IoT Hub - Guía de Despliegue (Hostinger / Apache)

## 1. Preparación
Antes de compilar, asegúrate de crear un archivo `.env` en la raíz con tu clave de Google:
```
API_KEY=AIzaSyTuClaveAqui...
```

## 2. Compilación (Build)
Ejecuta el siguiente comando en tu terminal:
```bash
npm run build
```
Esto creará una carpeta llamada `dist/`.

## 3. Subida a Hostinger
1. Ve al Administrador de Archivos de Hostinger.
2. Abre la carpeta `public_html`.
3. Sube **todo el contenido** de la carpeta `dist/` (no la carpeta en sí, sino los archivos que están dentro).
   - Deberías ver `index.html`, `assets/`, `api.php`, `.htaccess`, etc.

## 4. Base de Datos
1. Crea una base de datos MySQL en Hostinger.
2. Importa el archivo `schema.sql` usando phpMyAdmin.
3. Edita el archivo `api.php` y `api/iot_backend.php` en el servidor y pon usuario y contraseña de la base de datos que creaste.

## Estructura generada en /dist
- `index.html`: Entrada de la aplicación React.
- `.htaccess`: Reglas de reescritura para que React Router funcione.
- `api.php`: API para consultar datos.
- `api/iot_backend.php`: API para recibir datos de los sensores.
- `assets/`: Archivos JS y CSS compilados.
