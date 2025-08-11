# eBay Stock Checker - Extensión de Chrome

Esta extensión de Chrome detecta automáticamente cuando eBay muestra "More than 10 available" y calcula la cantidad real disponible del producto.

## 🚀 Características

- **Detección automática**: Funciona automáticamente al cargar páginas de productos de eBay
- **Cálculo inteligente**: Usa lógica incremental para determinar el stock real
- **Interfaz visual**: Reemplaza el texto original con la cantidad exacta
- **Multi-idioma**: Funciona en eBay.com, eBay.es, eBay.co.uk

## 📋 Cómo funciona

1. La extensión detecta el texto "More than 10 available" en páginas de productos
2. Implementa una lógica de prueba incremental:
   - Prueba cantidades ascendentes en el campo de cantidad
   - Detecta cuando aparece "Please enter a quantity of 1 or more"
   - Calcula el stock real basado en el último número válido
3. Reemplaza el texto original con la cantidad exacta encontrada

## 🛠 Instalación

### Opción 1: Desde archivos locales

1. Descarga todos los archivos de la extensión
2. Abre Chrome y ve a `chrome://extensions/`
3. Activa el "Modo de desarrollador" (toggle en la esquina superior derecha)
4. Haz clic en "Cargar extensión sin empaquetar"
5. Selecciona la carpeta `chrome-extension` que contiene todos los archivos

### Opción 2: Desarrollo local

```bash
# Si estás en el directorio del proyecto
cd /app/chrome-extension

# Los archivos ya están listos para usar
# Solo necesitas cargar la carpeta en Chrome
```

## 📁 Estructura de archivos

```
chrome-extension/
├── manifest.json          # Configuración de la extensión
├── content.js             # Script principal que se ejecuta en eBay
├── popup.html             # Interfaz del popup
├── popup.js               # Lógica del popup
├── popup.css              # Estilos del popup
├── styles.css             # Estilos para el content script
├── icon16.png             # Ícono 16x16 (necesario crear)
├── icon32.png             # Ícono 32x32 (necesario crear)
├── icon48.png             # Ícono 48x48 (necesario crear)
└── icon128.png            # Ícono 128x128 (necesario crear)
```

## 🎯 Uso

1. **Automático**: Navega a cualquier página de producto de eBay
2. **Manual**: Haz clic en el ícono de la extensión para forzar una verificación
3. **Resultado**: El texto "More than 10 available" será reemplazado con la cantidad real

## ⚙️ Configuración

La extensión funciona automáticamente, pero puedes:

- **Ver estado**: Hacer clic en el ícono para ver el popup con información
- **Forzar verificación**: Usar el botón "Verificar Stock Ahora" en el popup
- **Refrescar**: Usar el botón "Refrescar Página" si hay problemas

## 🔧 Características técnicas

- **Manifest V3**: Usa la última versión del sistema de extensiones
- **Content Scripts**: Se ejecuta directamente en las páginas de eBay
- **Observer Pattern**: Detecta cambios dinámicos en la página
- **Error Handling**: Maneja errores y casos edge
- **Performance**: Optimizado para no afectar la velocidad de la página

## 🌐 Sitios compatibles

- eBay.com (Estados Unidos)
- eBay.es (España)  
- eBay.co.uk (Reino Unido)
- Fácilmente extensible a otros dominios de eBay

## 🐛 Resolución de problemas

### La extensión no funciona:
1. Verifica que estés en una página de producto eBay (`/itm/` en la URL)
2. Recarga la página
3. Haz clic en el ícono y usa "Verificar Stock Ahora"

### El stock no se detecta:
1. Verifica que haya texto "More than 10 available" en la página
2. Espera unos segundos para que complete la verificación
3. Algunos productos pueden tener restricciones especiales

### Errores en la consola:
1. Abre DevTools (F12)
2. Ve a la pestaña Console
3. Busca mensajes del "eBay Stock Checker"

## 📝 Notas de desarrollo

- La extensión usa un enfoque no invasivo
- Respeta los límites de velocidad de eBay
- Incluye delays para evitar sobrecargar el sitio
- Restaura valores originales después de la verificación

## 🔒 Privacidad

- No recopila datos personales
- No envía información a servidores externos
- Solo funciona en páginas de eBay
- Código completamente local