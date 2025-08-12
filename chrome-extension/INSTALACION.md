# 🚀 Instalación de eBay Stock Checker v1.4.0

## 🔒 **VERSIÓN NO INVASIVA - PROBLEMA SOLUCIONADO**

### ⚠️ **¿Qué cambió en v1.4.0?**
- ❌ **Antes**: La extensión se ejecutaba automáticamente al cargar páginas, causando redirecciones
- ✅ **Ahora**: **MODO NO INVASIVO** - solo funciona cuando el usuario lo solicita
- ✅ **Activación manual**: Haz clic en "Verificar Stock Ahora" en el popup
- ✅ **Panel debug opcional**: Se muestra solo durante la verificación
- ✅ **Sin redirecciones**: No interfiere con la navegación normal

### 🎯 **Características Principales**
- ✅ **Activación manual**: Total control del usuario
- ✅ **MutationObserver controlado**: Solo activo durante verificación
- ✅ **Detección de bloqueos**: Se detiene automáticamente si eBay bloquea
- ✅ **Panel debug temporal**: Aparece solo durante verificación
- ✅ **Restauración automática**: Vuelve al estado original al parar

## 🚀 ALGORITMO REVOLUCIONARIO CONSERVADO

### ⚡ **BÚSQUEDA EXPONENCIAL + BINARIA**
**¿Qué se mantiene?**
- ✅ **Velocidad**: ~22 consultas vs 3400 del método anterior
- ✅ **Mejora**: 190x más rápido que incremento de 1 en 1
- ✅ **Seguridad**: Delays controlados para evitar saturar eBay

### 🧮 **Cómo Funciona (sin cambios):**

1. **PASO 1: Lectura Directa** (0 consultas)
   - Busca stock en HTML: `data-stock`, `data-inventory`, etc.
   - Analiza scripts JSON embebidos
   - Si encuentra → resultado instantáneo

2. **PASO 2: Búsqueda Exponencial** (~8 consultas)
   - Prueba: 20, 40, 80, 160, 320, 640, 1280, 2560...
   - Para cuando encuentra primer error
   - Ejemplo: 2560 ✅, 5120 ❌ → límite entre 2560-5120

3. **PASO 3: Búsqueda Binaria** (~12 consultas)
   - Rango: 2560-5120 → prueba 3840
   - Si 3840 ✅ → rango 3840-5120
   - Si 3840 ❌ → rango 2560-3840
   - Continúa hasta encontrar valor exacto

## 📂 Archivos incluidos
```
chrome-extension/
├── manifest.json          ✅ Configuración v1.4.0
├── content.js            ✅ Script NO INVASIVO
├── popup.html            ✅ Interfaz actualizada
├── popup.js              ✅ Lógica manual
├── popup.css             ✅ Estilos
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
- O descarga el archivo completo

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

## 🎯 Uso - NUEVA FORMA

### **MODO NO INVASIVO:**
1. Ve a cualquier producto de eBay que muestre "More than 10 available"
2. **Haz clic en el icono de la extensión** en la barra de Chrome
3. **Haz clic en "Verificar Stock Ahora"**
4. Se abrirá un panel de debug que mostrará el progreso en tiempo real
5. El texto "More than 10 available" se reemplazará con la cantidad real
6. El panel se puede minimizar, cerrar o limpiar según necesites

### **Controles disponibles:**
- 🔄 **Iniciar Verificación**: Desde el panel debug o popup
- 🛑 **PARAR Verificación**: Detiene el proceso inmediatamente  
- 🗑️ **Limpiar Log**: Limpia el historial del panel debug
- ❌ **Cerrar Panel**: Oculta el panel debug

## 🔍 Verificar funcionamiento
Prueba con estos productos de ejemplo:
- https://www.ebay.com/itm/177203047872
- https://www.ebay.com/itm/177077940738
- https://www.ebay.com/itm/145507784307

**Pasos para probar:**
1. Ve a uno de estos enlaces
2. Haz clic en el icono de la extensión
3. Haz clic en "Verificar Stock Ahora"
4. Observa el panel debug para ver el proceso

## ❌ Solución de problemas

### No aparece el panel debug
- ✅ **Solución**: Haz clic en el icono de la extensión primero
- ✅ El panel solo aparece cuando inicias una verificación

### La extensión no hace nada
- ✅ **Correcto**: Ahora requiere activación manual
- ✅ Haz clic en el icono → "Verificar Stock Ahora"

### Página se redirige o aparecen pop-ups
- ✅ **RESUELTO**: La v1.4.0 no ejecuta nada automáticamente
- ✅ Si ocurre, usa el botón "PARAR Verificación"

### Error: "Could not load manifest"
- Verifica que `manifest.json` esté en la carpeta raíz
- Revisa que no haya errores de sintaxis JSON

### No funciona en eBay
- Verifica que estés en una página `/itm/`
- Abre DevTools (F12) > Console para ver logs
- Asegúrate de activar manualmente desde el popup

## 🚨 IMPORTANTE
- ✅ **NUEVA REGLA**: La extensión NO funciona automáticamente
- ✅ **Control total**: Solo tú decides cuándo verificar stock
- ✅ La extensión solo funciona en páginas de productos eBay
- ✅ Requiere conexión a internet para funcionar
- ✅ Los logs aparecen en el panel debug y en la consola (F12)

## ✅ CONFIRMACIÓN
Si ves el icono de la extensión sin errores rojos y el popup responde al hacer clic, la instalación fue exitosa.

---
**Versión:** 1.4.0 - MODO NO INVASIVO
**Compatible con:** Chrome (Manifest V3)  
**Sitios:** eBay.com, eBay.es, eBay.co.uk
**Cambio principal:** Activación manual para evitar redirecciones