// eBay Stock Checker Content Script - VERSIÓN NO INVASIVA MEJORADA
class EbayStockChecker {
  constructor() {
    this.isChecking = false;
    this.originalText = '';
    this.targetElement = null;
    this.quantityInput = null;
    this.addToCartBtn = null;
    this.debugPanel = null;
    this.isActive = false;
    this.observer = null;
    this.FAST_MODE = true; // Modo rápido basado en script del usuario
    this.hideElementsStyle = null;
    this.init();
  }

  createDebugPanel() {
    // Solo crear panel si no existe
    if (this.debugPanel) return;
    
    // Crear panel de debug visible
    this.debugPanel = document.createElement('div');
    this.debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 320px;
      background: white;
      border: 2px solid #667eea;
      border-radius: 8px;
      padding: 15px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      max-height: 400px;
      overflow-y: auto;
      transition: all 0.3s ease;
    `;
    
    this.debugPanel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0; color: #667eea; font-size: 14px;">🔍 eBay Stock Debug</h3>
        <div>
          <button id="minimize-debug" style="
            background: #f0f0f0;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 5px;
            font-size: 10px;
          ">_</button>
          <button id="close-debug" style="
            background: #ff4757;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
          ">×</button>
        </div>
      </div>
      <div id="debug-content" style="max-height: 200px; overflow-y: auto;">Extension en modo manual - haz clic en el icono para activar</div>
      <div style="margin-top: 10px;">
        <button id="force-check" style="
          background: #667eea;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          width: 100%;
          font-size: 12px;
          margin-bottom: 5px;
        ">🔄 Iniciar Verificación</button>
        <button id="stop-check" style="
          background: #ff4757;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          width: 100%;
          font-size: 12px;
          margin-bottom: 5px;
        ">🛑 PARAR Verificación</button>
        <button id="clear-log" style="
          background: #ff9ff3;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          width: 100%;
          font-size: 11px;
        ">🗑️ Limpiar Log</button>
      </div>
    `;
    
    document.body.appendChild(this.debugPanel);
    
    // Event listeners
    const forceBtn = this.debugPanel.querySelector('#force-check');
    forceBtn.addEventListener('click', () => {
      if (!this.isChecking) {
        this.debugLog('🔄 Verificación iniciada manualmente desde debug panel');
        this.startManualVerification();
      } else {
        this.debugLog('⚠️ Ya hay una verificación en curso');
      }
    });
    
    const stopBtn = this.debugPanel.querySelector('#stop-check');
    stopBtn.addEventListener('click', () => {
      this.debugLog('🛑 VERIFICACIÓN DETENIDA POR USUARIO');
      this.stopVerification();
    });
    
    const closeBtn = this.debugPanel.querySelector('#close-debug');
    closeBtn.addEventListener('click', () => {
      this.debugPanel.style.display = 'none';
    });
    
    const minimizeBtn = this.debugPanel.querySelector('#minimize-debug');
    minimizeBtn.addEventListener('click', () => {
      const content = this.debugPanel.querySelector('#debug-content');
      const buttons = this.debugPanel.querySelectorAll('button');
      if (content.style.display === 'none') {
        content.style.display = 'block';
        buttons.forEach(btn => { if (btn.id !== 'minimize-debug' && btn.id !== 'close-debug') btn.style.display = 'block'; });
        minimizeBtn.textContent = '_';
      } else {
        content.style.display = 'none';
        buttons.forEach(btn => { if (btn.id !== 'minimize-debug' && btn.id !== 'close-debug') btn.style.display = 'none'; });
        minimizeBtn.textContent = '+';
      }
    });
    
    const clearBtn = this.debugPanel.querySelector('#clear-log');
    clearBtn.addEventListener('click', () => {
      const content = this.debugPanel.querySelector('#debug-content');
      content.innerHTML = 'Log limpiado...';
    });
  }

  debugLog(message) {
    console.log(`[eBay Stock] ${message}`);
    if (this.debugPanel) {
      const content = this.debugPanel.querySelector('#debug-content');
      if (content) {
        content.innerHTML += `<div style="margin: 2px 0; color: #333;">${new Date().toLocaleTimeString()}: ${message}</div>`;
        content.scrollTop = content.scrollHeight;
      }
    }
  }

  init() {
    this.debugLog('eBay Stock Checker iniciado - MODO NO INVASIVO');
    
    // NO crear panel de debug automáticamente
    // NO ejecutar verificación automática
    // SOLO escuchar eventos del usuario
    
    this.debugLog('✅ Extension listo - esperando activación manual desde popup');

    // Escuchar evento para activar verificación (desde popup)
    document.addEventListener('forceStockCheck', () => {
      this.debugLog('🔄 Verificación solicitada desde popup');
      this.startManualVerification();
    });

    // Escuchar evento para mostrar debug panel (opcional)
    document.addEventListener('showDebugPanel', () => {
      this.debugLog('🐛 Panel de debug solicitado');
      this.createDebugPanel();
    });

    // Escuchar evento para ocultar debug panel
    document.addEventListener('hideDebugPanel', () => {
      if (this.debugPanel) {
        this.debugPanel.style.display = 'none';
      }
    });
  }

  setupMutationObserver() {
    // Solo configurar observer si no existe y estamos en verificación activa
    if (this.observer || !this.isActive) return;
    
    this.debugLog('🔍 Configurando MutationObserver controlado...');
    
    this.observer = new MutationObserver((mutations) => {
      if (!this.isActive || this.isChecking) return;
      
      let shouldCheck = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          // Solo verificar cambios relevantes para evitar spam
          const target = mutation.target;
          if (target && target.textContent && 
              (target.textContent.includes('More than 10 available') ||
               target.textContent.includes('Más de 10 disponibles'))) {
            shouldCheck = true;
          }
        }
      });
      
      if (shouldCheck) {
        this.debugLog('🔄 Cambio relevante detectado por MutationObserver');
        this.findAndReplaceStock();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  stopMutationObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      this.debugLog('🛑 MutationObserver detenido');
    }
  }

  startManualVerification() {
    if (this.isChecking) {
      this.debugLog('⚠️ Ya hay una verificación en curso');
      return;
    }

    this.debugLog('🚀 Iniciando verificación manual...');
    this.isActive = true;
    
    // Crear panel de debug si no existe
    if (!this.debugPanel) {
      this.createDebugPanel();
    }
    
    // Configurar observer para esta sesión
    this.setupMutationObserver();
    
    // Buscar y ejecutar verificación
    this.findAndReplaceStock();
  }

  stopVerification() {
    this.debugLog('🛑 Deteniendo verificación...');
    this.isActive = false;
    this.isChecking = false;
    this.stopMutationObserver();
    
    if (this.targetElement && this.originalText) {
      try {
        this.targetElement.textContent = this.originalText;
        this.debugLog(`🔄 Texto restaurado: "${this.originalText}"`);
      } catch (error) {
        this.debugLog(`❌ Error restaurando texto: ${error.message}`);
      }
    }
    
    this.updateDisplayText('🛑 Verificación detenida por usuario');
  }

  findAndReplaceStock() {
    if (this.isChecking || !this.isActive) {
      this.debugLog('⚠️ Verificación ya en curso o extension inactivo');
      return;
    }

    this.debugLog('🔍 Buscando elementos con "More than 10 available"...');

    // Buscar el elemento con "More than 10 available" - múltiples selectores
    const possibleSelectors = [
      'span.ux-textspans--SECONDARY',
      'span.ux-textspans',
      '.ux-textspans--SECONDARY',
      '.ux-textspans',
      'span[class*="textspans"]',
      'span[class*="secondary"]',
      '*'  // Como último recurso, buscar en todos los elementos
    ];

    let foundElement = null;
    
    for (let selector of possibleSelectors) {
      this.debugLog(`Probando selector: ${selector}`);
      const elements = document.querySelectorAll(selector);
      this.debugLog(`Encontrados ${elements.length} elementos con selector ${selector}`);
      
      for (let element of elements) {
        const text = element.textContent || '';
        if (text.includes('More than 10 available') || 
            text.includes('Más de 10 disponibles') ||
            text.includes('more than 10 available')) {
          
          this.debugLog(`✅ ¡Elemento encontrado! Selector: ${selector}, Texto: "${text}"`);
          
          foundElement = element;
          break;
        }
      }
      
      if (foundElement) break;
    }
    
    if (foundElement) {
      this.targetElement = foundElement;
      this.originalText = foundElement.textContent;
      
      this.debugLog(`🎯 Elemento objetivo establecido: "${this.originalText}"`);
      
      // Buscar elementos necesarios para la prueba
      this.findRequiredElements();
      
      if (this.quantityInput) {
        this.debugLog('✅ Campo de cantidad encontrado, iniciando verificación...');
        this.startStockCheck();
      } else {
        this.debugLog('❌ Campo de cantidad NO encontrado, intentando búsqueda alternativa...');
        this.updateDisplayText('⚠️ Buscando campo de cantidad...');
        
        // Intentar una búsqueda más agresiva después de un delay
        setTimeout(() => {
          this.findRequiredElements();
          if (this.quantityInput) {
            this.debugLog('✅ Campo encontrado en segundo intento');
            this.startStockCheck();
          } else {
            this.updateDisplayText('❌ No se pudo encontrar campo de cantidad');
            this.debugLog('❌ FALLO: No se encontró campo de cantidad después de reintentos');
          }
        }, 2000);
      }
    } else {
      this.debugLog('❌ No se encontró el elemento "More than 10 available"');
      this.debugLog('🔍 Haciendo búsqueda de texto libre...');
      
      // Búsqueda de texto libre en toda la página
      const allText = document.body.innerText || document.body.textContent || '';
      if (allText.includes('More than 10 available')) {
        this.debugLog('✅ Texto encontrado en la página, pero elemento no localizado');
      } else {
        this.debugLog('❌ Texto "More than 10 available" no encontrado en la página');
      }
    }
  }

  findRequiredElements() {
    this.debugLog('🔍 Buscando elementos requeridos...');
    
    // Lista de selectores para el campo de cantidad
    const quantitySelectors = [
      '#qtyTextBox',
      'input[name="quantity"]',
      'input[data-testid="qty-input"]',
      'input[id*="quantity"]',
      '.textbox__control[name="quantity"]',
      '.quantity input',
      '#qtySubTxt',
      'input[class*="textbox"]',
      'input[type="text"]'
    ];
    
    // Buscar campo de cantidad
    for (let selector of quantitySelectors) {
      const element = document.querySelector(selector);
      if (element) {
        this.quantityInput = element;
        this.debugLog(`✅ Campo de cantidad encontrado con selector: ${selector}`);
        break;
      }
    }
    
    if (!this.quantityInput) {
      this.debugLog('🔍 Buscando campos de texto que puedan ser cantidad...');
      const allInputs = document.querySelectorAll('input[type="text"], input[type="number"]');
      this.debugLog(`Encontrados ${allInputs.length} campos de entrada`);
      
      for (let input of allInputs) {
        const value = input.value;
        const name = input.name || '';
        const id = input.id || '';
        const className = input.className || '';
        
        this.debugLog(`Campo: valor="${value}", name="${name}", id="${id}", class="${className}"`);
        
        // Si el input tiene valor "1" y está relacionado con cantidad
        if (value === '1' && (
          name.toLowerCase().includes('qty') ||
          name.toLowerCase().includes('quantity') ||
          id.toLowerCase().includes('qty') ||
          id.toLowerCase().includes('quantity') ||
          className.toLowerCase().includes('qty')
        )) {
          this.quantityInput = input;
          this.debugLog('✅ Campo de cantidad encontrado por heurística');
          break;
        }
      }
    }

    // Buscar botón de agregar al carrito
    const cartButtonSelectors = [
      '[data-testid="cta-top"]',
      '#atcBtn', 
      '.notranslate',
      'a[href*="addToCart"]',
      '[data-testid="atc-cta-button"]',
      'button[class*="btn-prim"]',
      'button[class*="primary"]',
      'a[class*="btn"]'
    ];
    
    for (let selector of cartButtonSelectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          this.addToCartBtn = element;
          this.debugLog(`✅ Botón encontrado con selector: ${selector}`);
          break;
        }
      } catch (error) {
        this.debugLog(`❌ Error con selector "${selector}": ${error.message}`);
      }
    }
    
    // Si no encontramos botón, buscar por texto usando búsqueda manual
    if (!this.addToCartBtn) {
      this.debugLog('🔍 Buscando botón por texto...');
      const allButtons = document.querySelectorAll('button, a');
      for (let btn of allButtons) {
        const text = btn.textContent || btn.innerText || '';
        if (text.toLowerCase().includes('buy it now') || 
            text.toLowerCase().includes('add to cart') ||
            text.toLowerCase().includes('comprar ahora')) {
          this.addToCartBtn = btn;
          this.debugLog(`✅ Botón encontrado por texto: "${text}"`);
          break;
        }
      }
    }
    
    this.debugLog(`📊 Resumen de elementos:
      Campo cantidad: ${this.quantityInput ? 'SÍ' : 'NO'}
      ID: ${this.quantityInput?.id || 'Sin ID'}
      Nombre: ${this.quantityInput?.name || 'Sin nombre'}  
      Valor: ${this.quantityInput?.value || 'Sin valor'}
      Botón carrito: ${this.addToCartBtn ? 'SÍ' : 'NO'}`);
  }

  async startStockCheck() {
    if (this.isChecking || !this.isActive) {
      this.debugLog('⚠️ Verificación ya en curso o extension inactivo');
      return;
    }
    
    this.isChecking = true;
    this.updateDisplayText('🔄 Verificando stock real... (puede tomar tiempo)');
    this.debugLog('🚀 Iniciando verificación de stock CONTROLADA...');

    // Guardar URL inicial para detectar redirecciones
    const initialUrl = window.location.href;
    this.debugLog(`📍 URL inicial: ${initialUrl}`);

    try {
      const realStock = await this.findRealStock();
      
      // Verificar si la página cambió durante el proceso
      if (window.location.href !== initialUrl) {
        this.debugLog(`⚠️ PÁGINA CAMBIÓ durante verificación: ${window.location.href}`);
        this.updateDisplayText('⚠️ Página cambió durante verificación');
        return;
      }
      
      if (realStock > 0) {
        this.updateDisplayText(`${realStock} disponibles ✅`);
        this.debugLog(`✅ Stock real encontrado: ${realStock}`);
      } else {
        this.updateDisplayText('Stock no determinado ❌');
        this.debugLog('❌ No se pudo determinar el stock real');
      }
    } catch (error) {
      this.debugLog(`❌ Error al verificar stock: ${error.message}`);
      this.updateDisplayText('Error al verificar stock ❌');
      
      // Si hay error, posiblemente eBay nos está bloqueando
      if (error.message.includes('blocked') || error.message.includes('redirect')) {
        this.debugLog('🚨 POSIBLE BLOQUEO DE EBAY - Deteniendo verificación');
        this.stopVerification();
      }
    } finally {
      this.isChecking = false;
    }
  }

  async findRealStock() {
    if (!this.quantityInput) {
      this.debugLog('❌ No se encontró el campo de cantidad');
      return 0;
    }

    // Guardar valor original
    const originalValue = this.quantityInput.value;
    this.debugLog(`🚀 NUEVA ESTRATEGIA: Búsqueda exponencial + binaria (valor original: ${originalValue})`);

    try {
      // PASO 1: Intentar leer stock directamente del HTML
      const directStock = await this.tryDirectStockReading();
      if (directStock > 0) {
        this.debugLog(`🎉 Stock encontrado directamente en HTML: ${directStock}`);
        return directStock;
      }

      // PASO 2: Búsqueda exponencial + binaria
      const binaryStock = await this.exponentialBinarySearch(originalValue);
      return binaryStock;

    } catch (error) {
      this.debugLog(`❌ Error en findRealStock: ${error.message}`);
      return 0;
    } finally {
      // Siempre restaurar valor original
      try {
        if (this.quantityInput && document.contains(this.quantityInput)) {
          this.quantityInput.value = originalValue;
          this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
          this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
          this.debugLog(`🔄 Valor restaurado a: ${originalValue}`);
        }
      } catch (restoreError) {
        this.debugLog(`❌ Error restaurando: ${restoreError.message}`);
      }
    }
  }

  async tryDirectStockReading() {
    this.debugLog('🔍 BÚSQUEDA EXHAUSTIVA DE STOCK DIRECTO...');
    
    try {
      // MÉTODO 1: Buscar en el campo de cantidad mismo
      const stockFromQuantityField = this.searchStockInElement(this.quantityInput, 'campo de cantidad');
      if (stockFromQuantityField > 10) {
        return stockFromQuantityField;
      }

      // MÉTODO 2: Buscar en elementos padre del campo de cantidad
      let parent = this.quantityInput.parentElement;
      for (let level = 0; level < 5 && parent; level++) {
        const stockFromParent = this.searchStockInElement(parent, `elemento padre nivel ${level + 1}`);
        if (stockFromParent > 10) {
          return stockFromParent;
        }
        parent = parent.parentElement;
      }

      // MÉTODO 3: Buscar en todo el documento por atributos de stock
      const stockFromDocument = this.searchStockInDocument();
      if (stockFromDocument > 10) {
        return stockFromDocument;
      }

      // MÉTODO 4: Buscar en scripts JSON embebidos
      const stockFromJSON = this.searchStockInJSON();
      if (stockFromJSON > 10) {
        return stockFromJSON;
      }

      // MÉTODO 5: Buscar en variables JavaScript globales
      const stockFromJS = this.searchStockInJavaScript();
      if (stockFromJS > 10) {
        return stockFromJS;
      }

      // MÉTODO 6: Buscar en elementos relacionados con eBay
      const stockFromEbayElements = this.searchStockInEbayElements();
      if (stockFromEbayElements > 10) {
        return stockFromEbayElements;
      }

      this.debugLog('❌ No se pudo leer stock directamente con ningún método');
      return 0;

    } catch (error) {
      this.debugLog(`❌ Error en lectura directa: ${error.message}`);
      return 0;
    }
  }

  searchStockInElement(element, elementName) {
    if (!element) return 0;

    this.debugLog(`🔍 Buscando stock en ${elementName}...`);
    
    const stockAttributes = [
      'data-stock', 'data-inventory', 'data-quantity', 'data-available', 
      'data-max-quantity', 'data-max', 'max', 'data-limit',
      'data-stock-level', 'data-qty', 'data-available-qty',
      'inventory', 'stock', 'quantity', 'available'
    ];

    // Buscar en atributos del elemento
    for (let attr of stockAttributes) {
      const value = element.getAttribute(attr);
      if (value && !isNaN(value)) {
        const numValue = parseInt(value);
        if (numValue > 10 && numValue < 1000000) { // Rango razonable
          this.debugLog(`✅ Stock encontrado en ${elementName}, atributo ${attr}: ${numValue}`);
          return numValue;
        }
      }
    }

    // Buscar en data attributes (dataset)
    if (element.dataset) {
      for (let key in element.dataset) {
        const value = element.dataset[key];
        if (value && !isNaN(value)) {
          const numValue = parseInt(value);
          if (numValue > 10 && numValue < 1000000 && 
              (key.toLowerCase().includes('stock') || 
               key.toLowerCase().includes('inventory') ||
               key.toLowerCase().includes('quantity') ||
               key.toLowerCase().includes('available'))) {
            this.debugLog(`✅ Stock encontrado en ${elementName}, dataset.${key}: ${numValue}`);
            return numValue;
          }
        }
      }
    }

    return 0;
  }

  searchStockInDocument() {
    this.debugLog('🔍 Buscando stock en todo el documento...');

    const stockSelectors = [
      '[data-stock]', '[data-inventory]', '[data-quantity]', '[data-available]',
      '[data-max-quantity]', '[data-max]', '[max]', '[data-limit]',
      '[data-stock-level]', '[data-qty]', '[data-available-qty]'
    ];

    for (let selector of stockSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (let element of elements) {
          const attrName = selector.replace(/[\[\]]/g, '');
          const value = element.getAttribute(attrName);
          if (value && !isNaN(value)) {
            const numValue = parseInt(value);
            if (numValue > 10 && numValue < 1000000) {
              this.debugLog(`✅ Stock encontrado en documento, selector ${selector}: ${numValue}`);
              return numValue;
            }
          }
        }
      } catch (error) {
        continue;
      }
    }

    return 0;
  }

  searchStockInJSON() {
    this.debugLog('🔍 Buscando stock en scripts JSON...');

    const scripts = document.querySelectorAll('script[type="application/json"], script[type="application/ld+json"], script:not([src])');
    
    for (let script of scripts) {
      try {
        const content = script.textContent || script.innerHTML;
        
        if (content.includes('inventory') || content.includes('stock') || 
            content.includes('quantity') || content.includes('available')) {
          
          this.debugLog(`🔍 Script con contenido relevante encontrado: ${content.substring(0, 100)}...`);
          
          // Buscar patrones JSON
          const patterns = [
            /"(?:inventory|stock|quantity|available|availableQuantity|stockLevel)":\s*(\d+)/gi,
            /"(?:data-stock|data-inventory|data-quantity)":\s*"(\d+)"/gi,
            /inventory[":]\s*(\d+)/gi,
            /stock[":]\s*(\d+)/gi,
            /quantity[":]\s*(\d+)/gi,
            /available[":]\s*(\d+)/gi
          ];
          
          for (let pattern of patterns) {
            const matches = content.matchAll(pattern);
            for (let match of matches) {
              const numValue = parseInt(match[1]);
              if (numValue > 10 && numValue < 1000000) {
                this.debugLog(`✅ Stock encontrado en JSON: ${numValue} (patrón: ${pattern})`);
                return numValue;
              }
            }
          }
          
          // Intentar parsear JSON completo
          try {
            const jsonData = JSON.parse(content);
            const stockFromObj = this.searchStockInObject(jsonData);
            if (stockFromObj > 10) {
              return stockFromObj;
            }
          } catch (jsonError) {
            // No es JSON válido, continuar
          }
        }
      } catch (error) {
        continue;
      }
    }

    return 0;
  }

  searchStockInObject(obj, path = '') {
    if (typeof obj !== 'object' || obj === null) return 0;

    for (let key in obj) {
      const value = obj[key];
      const currentPath = path ? `${path}.${key}` : key;
      
      // Si es un número y la clave sugiere stock
      if (typeof value === 'number' && value > 10 && value < 1000000) {
        const keyLower = key.toLowerCase();
        if (keyLower.includes('stock') || keyLower.includes('inventory') ||
            keyLower.includes('quantity') || keyLower.includes('available')) {
          this.debugLog(`✅ Stock encontrado en objeto JSON: ${value} (ruta: ${currentPath})`);
          return value;
        }
      }
      
      // Si es string que contiene número
      if (typeof value === 'string' && !isNaN(value)) {
        const numValue = parseInt(value);
        if (numValue > 10 && numValue < 1000000) {
          const keyLower = key.toLowerCase();
          if (keyLower.includes('stock') || keyLower.includes('inventory') ||
              keyLower.includes('quantity') || keyLower.includes('available')) {
            this.debugLog(`✅ Stock encontrado en objeto JSON (string): ${numValue} (ruta: ${currentPath})`);
            return numValue;
          }
        }
      }
      
      // Recursión en objetos anidados (máximo 3 niveles)
      if (typeof value === 'object' && path.split('.').length < 3) {
        const nestedStock = this.searchStockInObject(value, currentPath);
        if (nestedStock > 10) {
          return nestedStock;
        }
      }
    }

    return 0;
  }

  searchStockInJavaScript() {
    this.debugLog('🔍 Buscando stock en variables JavaScript globales...');

    try {
      // Variables globales comunes de eBay
      const globalVars = [
        'window.ebay', 'window.pageData', 'window.itemData', 
        'window.inventory', 'window.stock', 'window.quantity',
        'window.GH', 'window.raptor', 'window.marko'
      ];

      for (let varPath of globalVars) {
        try {
          const obj = eval(varPath);
          if (obj && typeof obj === 'object') {
            const stockFromVar = this.searchStockInObject(obj);
            if (stockFromVar > 10) {
              this.debugLog(`✅ Stock encontrado en variable ${varPath}: ${stockFromVar}`);
              return stockFromVar;
            }
          }
        } catch (evalError) {
          // Variable no existe, continuar
        }
      }

      // Buscar en todas las variables globales
      for (let key in window) {
        if (typeof window[key] === 'object' && window[key] !== null) {
          const keyLower = key.toLowerCase();
          if (keyLower.includes('stock') || keyLower.includes('inventory') ||
              keyLower.includes('item') || keyLower.includes('product')) {
            const stockFromGlobal = this.searchStockInObject(window[key]);
            if (stockFromGlobal > 10) {
              this.debugLog(`✅ Stock encontrado en variable global ${key}: ${stockFromGlobal}`);
              return stockFromGlobal;
            }
          }
        }
      }

    } catch (error) {
      this.debugLog(`❌ Error buscando en JavaScript: ${error.message}`);
    }

    return 0;
  }

  searchStockInEbayElements() {
    this.debugLog('🔍 Buscando stock en elementos específicos de eBay...');

    // Selectores específicos de eBay que podrían contener stock
    const ebaySelectors = [
      '.vi-qtyS-wrap', '.vi-qty', '.qtyInput', '.quantity',
      '[class*="quantity"]', '[class*="stock"]', '[class*="inventory"]',
      '[id*="quantity"]', '[id*="stock"]', '[id*="inventory"]',
      '.u-flL.condText', '.notranslate', '.vi-price .u-flL'
    ];

    for (let selector of ebaySelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (let element of elements) {
          const stockFromElement = this.searchStockInElement(element, `selector ${selector}`);
          if (stockFromElement > 10) {
            return stockFromElement;
          }
          
          // También buscar en el texto del elemento si contiene números
          const text = element.textContent || '';
          const numbers = text.match(/\d+/g);
          if (numbers) {
            for (let num of numbers) {
              const numValue = parseInt(num);
              if (numValue > 10 && numValue < 1000000) {
                this.debugLog(`✅ Posible stock encontrado en texto de ${selector}: ${numValue}`);
                return numValue;
              }
            }
          }
        }
      } catch (error) {
        continue;
      }
    }

    return 0;
  }

  async exponentialBinarySearch(originalValue) {
    this.debugLog('🐌 BÚSQUEDA ULTRA LENTA: Iniciando búsqueda exponencial + binaria...');

    // FASE 1: Búsqueda exponencial MUY LENTA
    this.debugLog('📈 FASE EXPONENCIAL ULTRA LENTA: Buscando límite superior...');
    
    let exponentialValues = [20, 50, 100, 200, 500, 1000, 2000, 3000, 4000, 5000];
    let lastValidValue = 10;
    let firstInvalidValue = null;

    for (let i = 0; i < exponentialValues.length; i++) {
      const testValue = exponentialValues[i];
      
      this.updateDisplayText(`🐌 Probando exponencial... ${testValue} (${i + 1}/${exponentialValues.length})`);
      this.debugLog(`🔍 EXPONENCIAL: Probando ${testValue}...`);
      
      // Verificar si la página sigue respondiendo
      await this.sleep(1000); // Pausa de 1 segundo antes de cada prueba
      
      const isValid = await this.testQuantity(testValue);
      
      if (!isValid) {
        lastValidValue = exponentialValues[i - 1] || 10;
        firstInvalidValue = testValue;
        this.debugLog(`🎯 LÍMITE ENCONTRADO: válido=${lastValidValue}, inválido=${firstInvalidValue}`);
        break;
      }
      
      // Pausa larga entre cada prueba exponencial
      await this.sleep(2000);
    }

    if (!firstInvalidValue) {
      this.debugLog('⚠️ No se encontró límite en fase exponencial ultra lenta');
      return 0;
    }

    // FASE 2: Búsqueda binaria MUY LENTA
    this.debugLog(`🔍 FASE BINARIA ULTRA LENTA: Buscando entre ${lastValidValue} y ${firstInvalidValue}`);
    
    let low = lastValidValue;
    let high = firstInvalidValue;
    let iterations = 0;
    const maxIterations = 10; // Reducir iteraciones para evitar sobrecargar
    
    while (low < high - 1 && iterations < maxIterations) {
      iterations++;
      
      const mid = Math.floor((low + high) / 2);
      this.updateDisplayText(`🐌 Búsqueda binaria... ${mid} [${low}-${high}] (${iterations}/${maxIterations})`);
      this.debugLog(`🔍 BINARIA iteración ${iterations}: probando ${mid}`);

      // Pausa larga antes de cada prueba binaria
      await this.sleep(2000);
      
      const isValid = await this.testQuantity(mid);
      
      if (isValid) {
        low = mid;
        this.debugLog(`✅ ${mid} válido, nuevo low: ${low}`);
      } else {
        high = mid;
        this.debugLog(`❌ ${mid} inválido, nuevo high: ${high}`);
      }

      // Pausa extra larga entre iteraciones binarias
      await this.sleep(3000);
    }

    const finalResult = low;
    this.debugLog(`🎉 RESULTADO FINAL ULTRA LENTO: Stock real = ${finalResult}`);
    
    // MOSTRAR RESULTADO FINAL
    this.updateDisplayText(`🎉 STOCK REAL: ${finalResult} unidades ✅`);
    
    return finalResult;
  }

  async testQuantity(quantity) {
    try {
      // Verificar que la página sigue válida
      if (!document.body || !this.quantityInput || !document.contains(this.quantityInput)) {
        this.debugLog('❌ Página cambió durante prueba');
        return false;
      }

      this.debugLog(`🧪 PRUEBA MEJORADA: ${quantity}`);

      // Usar simulación de escritura más realista (basado en script del usuario)
      await this.setQuantityWithRealisticInput(quantity);
      
      // Esperar tiempo para que eBay procese
      await this.sleep(this.FAST_MODE ? 200 : 1000);
      
      // Usar detección de errores mejorada
      const hasError = this.checkForErrorImproved();
      
      if (hasError) {
        this.debugLog(`🚨 ERROR DETECTADO con cantidad ${quantity}`);
        return false;
      }

      this.debugLog(`✅ ${quantity} es válido`);
      return true;

    } catch (error) {
      this.debugLog(`❌ Error probando ${quantity}: ${error.message}`);
      return false;
    }
  }

  async setQuantityWithRealisticInput(value) {
    // Simulación de escritura más realista basada en el script del usuario
    const input = this.quantityInput;
    
    // Enfocar y limpiar
    input.focus();
    input.value = '';
    await this.sleep(FAST_MODE ? 10 : 50);
    
    // Escribir carácter por carácter con eventos realistas
    const strValue = String(value);
    for (const char of strValue) {
      const keyCode = char.charCodeAt(0);
      
      // Agregar carácter
      input.value += char;
      
      // Disparar eventos de teclado realistas
      input.dispatchEvent(new KeyboardEvent('keydown', { 
        bubbles: true, cancelable: true, key: char, keyCode 
      }));
      input.dispatchEvent(new KeyboardEvent('keypress', { 
        bubbles: true, cancelable: true, key: char, keyCode 
      }));
      input.dispatchEvent(new InputEvent('input', { 
        bubbles: true, cancelable: true, data: char 
      }));
      input.dispatchEvent(new KeyboardEvent('keyup', { 
        bubbles: true, cancelable: true, key: char, keyCode 
      }));
      
      await this.sleep(FAST_MODE ? 5 : 20);
    }
    
    // Eventos de finalización
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.blur();
    await this.sleep(FAST_MODE ? 50 : 150);
  }

  checkForErrorImproved() {
    // Detección de errores mejorada basada en el script del usuario
    const errorSelectors = [
      '#qtyErrMsg',
      '.textbox__error-msg', 
      '[class*="error"]',
      '[class*="notice"]',
      '[class*="alert"]',
      '[aria-invalid="true"]',
      '[data-error]',
      '[role="alert"]'
    ];
    
    const errorElements = document.querySelectorAll(errorSelectors.join(', '));
    
    // Verificar texto de error en elementos encontrados
    const hasTextError = Array.from(errorElements).some(el => {
      const text = (el.textContent || '').trim().toLowerCase();
      return /please enter a lower number|not available|maximum quantity|exceeds stock|no hay stock|agotado/.test(text);
    });
    
    // Verificar estado del input
    const inputDisabled = this.quantityInput.disabled || this.quantityInput.classList.contains('error');
    
    return hasTextError || inputDisabled;
  }

  async waitForDOMChange(timeout = 300) {
    // Función para esperar cambios en el DOM
    return new Promise(resolve => {
      const observer = new MutationObserver(() => {
        observer.disconnect();
        resolve();
      });
      observer.observe(document.body, { 
        childList: true, 
        subtree: true, 
        attributes: true 
      });
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, timeout);
    });
  }

  createHideProblematicElementsCSS() {
    // Ocultar elementos problemáticos durante verificación (basado en script del usuario)
    const style = document.createElement('style');
    style.id = 'ebay-stock-checker-hide-elements';
    style.textContent = `
      .ebay-stock-checker-active #qtyTextBox {
        opacity: 0.3 !important;
        pointer-events: none !important;
      }
      .ebay-stock-checker-active #qtyErrMsg,
      .ebay-stock-checker-active .textbox__error-msg,
      .ebay-stock-checker-active [class*="error"]:not(.ebay-stock-checker-panel),
      .ebay-stock-checker-active [class*="notice"]:not(.ebay-stock-checker-panel),
      .ebay-stock-checker-active [class*="alert"]:not(.ebay-stock-checker-panel),
      .ebay-stock-checker-active [role="alert"]:not(.ebay-stock-checker-panel) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
    `;
    return style;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  updateDisplayText(text) {
    if (this.targetElement) {
      try {
        this.targetElement.innerHTML = `<span style="color: #2d5aa0; font-weight: bold; background: #e3f2fd; padding: 2px 6px; border-radius: 4px;">${text}</span>`;
        this.debugLog(`📝 Texto actualizado: "${text}"`);
      } catch (error) {
        this.debugLog(`❌ Error actualizando texto: ${error.message}`);
        // Fallback: intentar con textContent
        try {
          this.targetElement.textContent = text;
        } catch (fallbackError) {
          this.debugLog(`❌ Error con fallback: ${fallbackError.message}`);
        }
      }
    } else {
      this.debugLog(`⚠️ No hay elemento objetivo para actualizar texto: "${text}"`);
    }
  }
}

// Inicializar cuando la página esté lista - MODO NO INVASIVO
let ebayChecker = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ebayChecker = new EbayStockChecker();
  });
} else {
  ebayChecker = new EbayStockChecker();
}

// Exponer función para debugging manual si es necesario
window.ebayStockChecker = ebayChecker;