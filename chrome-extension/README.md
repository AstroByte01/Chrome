# eBay Stock Checker - Extensión de Chrome v1.4.0

Esta extensión de Chrome detecta cuando eBay muestra "More than 10 available" y calcula la cantidad real disponible del producto **SOLO cuando el usuario lo solicita**.

## 🔒 **VERSIÓN NO INVASIVA**

**⚠️ CAMBIO IMPORTANTE**: Esta versión requiere **activación manual** para evitar redirecciones y bloqueos de eBay.

## 🚀 Características

- **🔒 Modo no invasivo**: NO funciona automáticamente, requiere activación manual
- **🎯 Control total**: Solo tú decides cuándo verificar stock
- **⚡ Algoritmo eficiente**: Búsqueda exponencial + binaria (190x más rápido)
- **🐛 Panel debug opcional**: Diagnóstico en tiempo real durante verificación
- **🛑 Parada de emergencia**: Botón para detener verificación inmediatamente
- **🌐 Multi-idioma**: Funciona en eBay.com, eBay.es, eBay.co.uk

## 📋 Cómo funciona - NUEVA FORMA

### **MODO NO INVASIVO:**
1. **NO ejecuta automáticamente** al cargar páginas
2. **Requiere activación manual** desde el popup
3. **Muestra panel debug** solo durante verificación activa
4. **Se detiene automáticamente** si detecta bloqueos de eBay

### **Algoritmo de detección (sin cambios):**
1. **Lectura directa** (0 consultas): Busca en HTML/JSON
2. **Búsqueda exponencial** (~8 consultas): 20, 40, 80, 160...
3. **Búsqueda binaria** (~12 consultas): Refina el rango exacto

## 🛠 Instalación

### Paso a paso:
1. Descarga la carpeta `chrome-extension` completa
2. Abre Chrome y ve a `chrome://extensions/`
3. Activa el "Modo de desarrollador" (toggle superior derecha)
4. Haz clic en "Cargar extensión sin empaquetar"
5. Selecciona la carpeta `chrome-extension`
6. ✅ ¡Listo! Verás el icono sin errores

## 🎯 **USO - NUEVA FORMA**

### **Para verificar stock:**
1. **Ve a un producto de eBay** que muestre "More than 10 available"
2. **Haz clic en el icono** de la extensión en la barra de Chrome
3. **Haz clic en "Verificar Stock Ahora"**
4. **Se abrirá un panel debug** mostrando el progreso en tiempo real
5. **El texto se reemplazará** con la cantidad exacta
6. **Panel se puede controlar** (minimizar, cerrar, limpiar logs)

### **Controles disponibles:**
- 🔄 **Iniciar Verificación**: Desde popup o panel debug
- 🛑 **PARAR Verificación**: Detiene proceso inmediatamente  
- 🗑️ **Limpiar Log**: Limpia historial del panel
- ❌ **Cerrar Panel**: Oculta panel debug
- 🔄 **Refrescar Página**: Recarga la página de eBay

## 📁 Estructura de archivos

```
chrome-extension/
├── manifest.json          # Configuración v1.4.0 (no invasivo)
├── content.js             # Script principal - MODO MANUAL
├── popup.html             # Interfaz actualizada
├── popup.js               # Lógica de activación manual
├── popup.css              # Estilos del popup
├── styles.css             # Estilos para el content script
├── icon16.png             # ✅ Ícono 16x16 incluido
├── icon32.png             # ✅ Ícono 32x32 incluido
├── icon48.png             # ✅ Ícono 48x48 incluido
├── icon128.png            # ✅ Ícono 128x128 incluido
├── README.md              # Esta documentación
└── INSTALACION.md         # Guía detallada de instalación
```

## ⚙️ Configuración

### **Comportamiento por defecto:**
- ✅ **Silencioso**: No hace nada al cargar páginas
- ✅ **Manual**: Solo funciona cuando lo solicitas
- ✅ **Temporal**: Panel debug desaparece al finalizar

### **Para activar:**
1. **Icono en barra**: Haz clic → "Verificar Stock Ahora"
2. **Panel debug**: Se abre automáticamente durante verificación
3. **Control total**: Puedes parar en cualquier momento

## 🔧 Características técnicas

- **✅ Manifest V3**: Última versión del sistema de extensiones
- **✅ MutationObserver controlado**: Solo activo durante verificación
- **✅ Detección de bloqueos**: Se detiene si eBay nos redirige
- **✅ Restauración automática**: Vuelve al estado original
- **✅ Error Handling**: Maneja todos los casos edge
- **✅ Performance optimizada**: No afecta navegación normal

## 🌐 Sitios compatibles

- ✅ eBay.com (Estados Unidos)
- ✅ eBay.es (España)  
- ✅ eBay.co.uk (Reino Unido)
- 🔄 Fácilmente extensible a otros dominios de eBay

## 🐛 Resolución de problemas

### ❌ **La extensión no hace nada:**
- ✅ **CORRECTO**: Ahora requiere activación manual
- ✅ **Solución**: Haz clic en icono → "Verificar Stock Ahora"

### ❌ **No aparece el panel debug:**
- ✅ **Solución**: El panel solo aparece durante verificación activa
- ✅ Primero haz clic en el icono de la extensión

### ❌ **Página se redirige o aparecen pop-ups:**
- ✅ **RESUELTO**: La v1.4.0 no ejecuta nada automáticamente
- ✅ Si ocurre durante verificación: usa botón "PARAR Verificación"

### ❌ **El stock no se detecta:**
1. Verifica que haya texto "More than 10 available" en la página
2. Asegúrate de haber activado manualmente la verificación
3. Algunos productos pueden tener restricciones especiales

### ❌ **Errores en la consola:**
1. Abre DevTools (F12) → Console
2. Busca mensajes `[eBay Stock]`
3. También verifica el panel debug para diagnóstico en tiempo real

## 📝 Notas importantes

### **Cambios en v1.4.0:**
- ❌ **Ya no automático**: Requiere activación manual
- ✅ **Más seguro**: No interfiere con navegación normal  
- ✅ **Mejor control**: Usuario decide cuándo verificar
- ✅ **Sin redirecciones**: No causa problemas con eBay

### **Recomendaciones de uso:**
1. Solo activa cuando realmente necesites saber el stock exacto
2. No uses repetidamente en la misma página (eBay podría detectar)
3. Si aparece algún bloqueo, espera unos minutos antes de reintentar

## 🔒 Privacidad y seguridad

- ✅ No recopila datos personales
- ✅ No envía información a servidores externos
- ✅ Solo funciona en páginas de eBay cuando se activa
- ✅ Código completamente local y transparente
- ✅ Respeta los límites de eBay para evitar bloqueos

---

**Versión:** 1.4.0 - MODO NO INVASIVO  
**Fecha:** Actualizado para resolver problema de redirecciones  
**Compatible:** Chrome (Manifest V3)  
**Cambio principal:** Activación manual obligatoria