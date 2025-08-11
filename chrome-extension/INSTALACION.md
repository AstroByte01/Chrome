# 🚀 Instalación de eBay Stock Checker

## ✅ PROBLEMA RESUELTO
Los iconos han sido creados automáticamente. La extensión está completa y lista para instalar.

## 📂 Archivos incluidos
```
chrome-extension/
├── manifest.json          ✅ Configuración principal
├── content.js            ✅ Script principal
├── popup.html            ✅ Interfaz popup
├── popup.js              ✅ Lógica popup
├── popup.css             ✅ Estilos popup
├── styles.css            ✅ Estilos página
├── icon16.png            ✅ Icono 16x16
├── icon32.png            ✅ Icono 32x32
├── icon48.png            ✅ Icono 48x48
├── icon128.png           ✅ Icono 128x128
└── README.md             ✅ Documentación
```

## 🔧 Pasos de instalación

### 1. Preparar archivos
- Copia toda la carpeta `chrome-extension` a tu escritorio
- O descarga: `/app/ebay-stock-checker-extension.tar.gz`

### 2. Instalar en Chrome
1. Abre Chrome y ve a: `chrome://extensions/`
2. Activa **"Modo de desarrollador"** (toggle superior derecha)
3. Haz clic en **"Cargar extensión sin empaquetar"**
4. Selecciona la carpeta `chrome-extension`
5. ¡Listo! Verás el icono en la barra de extensiones

### 3. Verificar instalación
- ✅ No debe haber errores rojos
- ✅ El icono debe aparecer en la barra
- ✅ Debe decir "eBay Stock Checker" al hacer hover

## 🎯 Uso
1. Ve a cualquier producto de eBay
2. Busca "More than 10 available"  
3. La extensión automáticamente lo reemplazará con la cantidad real
4. Haz clic en el icono para forzar verificación manual

## 🔍 Verificar funcionamiento
Prueba con estos productos de ejemplo:
- https://www.ebay.com/itm/177203047872
- https://www.ebay.com/itm/177077940738
- https://www.ebay.com/itm/145507784307

## ❌ Solución de problemas

### Error: "Could not load icon"
- ✅ **RESUELTO**: Los iconos ya están incluidos

### Error: "Could not load manifest"
- Verifica que `manifest.json` esté en la carpeta raíz
- Revisa que no haya errores de sintaxis JSON

### La extensión no aparece
- Refresca `chrome://extensions/`
- Verifica que "Modo desarrollador" esté activado

### No funciona en eBay
- Verifica que estés en una página `/itm/`
- Abre DevTools (F12) > Console para ver logs
- Usa el popup para forzar verificación

## 🚨 IMPORTANTE
- La extensión solo funciona en páginas de productos eBay
- Requiere conexión a internet para funcionar
- Los logs aparecen en la consola del navegador (F12)

## ✅ CONFIRMACIÓN
Si ves el icono de la extensión sin errores rojos, la instalación fue exitosa.

---
**Versión:** 1.0.1  
**Compatible con:** Chrome (Manifest V3)  
**Sitios:** eBay.com, eBay.es, eBay.co.uk