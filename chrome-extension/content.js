// eBay Stock Checker Content Script
class EbayStockChecker {
  constructor() {
    this.isChecking = false;
    this.originalText = '';
    this.targetElement = null;
    this.quantityInput = null;
    this.addToCartBtn = null;
    this.debugPanel = null;
    this.init();
  }

  createDebugPanel() {
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
      <div id="debug-content" style="max-height: 200px; overflow-y: auto;">Iniciando...</div>
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
        ">🔄 Forzar Verificación</button>
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
        this.isChecking = false;
        this.debugLog('🔄 Verificación forzada por usuario');
        this.findAndReplaceStock();
      } else {
        this.debugLog('⚠️ Ya hay una verificación en curso');
      }
    });
    
    const stopBtn = this.debugPanel.querySelector('#stop-check');
    stopBtn.addEventListener('click', () => {
      this.debugLog('🛑 VERIFICACIÓN DETENIDA POR USUARIO');
      this.isChecking = false;
      this.updateDisplayText('🛑 Verificación detenida por usuario');
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
    console.log(message);
    if (this.debugPanel) {
      const content = this.debugPanel.querySelector('#debug-content');
      content.innerHTML += `<div style="margin: 2px 0; color: #333;">${new Date().toLocaleTimeString()}: ${message}</div>`;
      content.scrollTop = content.scrollHeight;
    }
  }

  init() {
    this.debugLog('eBay Stock Checker iniciado');
    this.createDebugPanel();
    
    // Esperar a que la página cargue completamente
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.findAndReplaceStock());
    } else {
      setTimeout(() => this.findAndReplaceStock(), 1000);
    }

    // Observer para detectar cambios dinámicos
    this.setupMutationObserver();
    
    // Escuchar evento personalizado para forzar verificación
    document.addEventListener('forceStockCheck', () => {
      this.debugLog('🔄 Forzando verificación de stock...');
      this.isChecking = false; // Reset del estado
      this.findAndReplaceStock();
    });
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          this.findAndReplaceStock();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  findAndReplaceStock() {
    if (this.isChecking) return;

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
    if (this.isChecking) return;
    
    this.isChecking = true;
    this.updateDisplayText('🔄 Verificando stock real... (puede tomar tiempo)');
    this.debugLog('🚀 Iniciando verificación de stock LENTA para evitar bloqueo...');

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
    this.debugLog('🔍 PASO 1: Intentando leer stock directamente del HTML...');
    
    try {
      // Buscar atributos de stock en el campo de cantidad
      const possibleAttributes = [
        'data-stock', 'data-inventory', 'data-quantity', 'data-available', 
        'data-max-quantity', 'data-max', 'max', 'data-limit'
      ];

      for (let attr of possibleAttributes) {
        const value = this.quantityInput.getAttribute(attr);
        if (value && !isNaN(value) && parseInt(value) > 10) {
          this.debugLog(`✅ Stock encontrado en atributo ${attr}: ${value}`);
          return parseInt(value);
        }
      }

      // Buscar en elementos padre
      let parent = this.quantityInput.parentElement;
      for (let i = 0; i < 3 && parent; i++) {
        for (let attr of possibleAttributes) {
          const value = parent.getAttribute(attr);
          if (value && !isNaN(value) && parseInt(value) > 10) {
            this.debugLog(`✅ Stock encontrado en elemento padre ${attr}: ${value}`);
            return parseInt(value);
          }
        }
        parent = parent.parentElement;
      }

      // Buscar en script tags o JSON embebido
      const scripts = document.querySelectorAll('script[type="application/json"], script:not([src])');
      for (let script of scripts) {
        const content = script.textContent || script.innerHTML;
        if (content.includes('inventory') || content.includes('stock') || content.includes('quantity')) {
          try {
            const matches = content.match(/"(?:inventory|stock|quantity|available)":\s*(\d+)/gi);
            if (matches) {
              for (let match of matches) {
                const num = parseInt(match.match(/\d+/)[0]);
                if (num > 10 && num < 100000) { // Rango razonable
                  this.debugLog(`✅ Stock encontrado en script JSON: ${num}`);
                  return num;
                }
              }
            }
          } catch (jsonError) {
            // Continuar buscando
          }
        }
      }

      this.debugLog('❌ No se pudo leer stock directamente');
      return 0;

    } catch (error) {
      this.debugLog(`❌ Error en lectura directa: ${error.message}`);
      return 0;
    }
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

      this.debugLog(`🧪 === PROBANDO CANTIDAD: ${quantity} ===`);

      // MÉTODO EXHAUSTIVO DE DETECCIÓN
      return await this.testQuantityExhaustive(quantity);

    } catch (error) {
      this.debugLog(`❌ Error probando ${quantity}: ${error.message}`);
      return false;
    }
  }

  async testQuantityExhaustive(quantity) {
    // VERSIÓN ULTRA LENTA para evitar sobrecargar la página
    this.debugLog(`🐌 VERSIÓN ULTRA LENTA: Probando ${quantity} con máximas precauciones`);
    
    // PASO 1: Verificar si la página sigue respondiendo
    if (document.readyState !== 'complete') {
      this.debugLog('⚠️ Página no está completamente cargada, esperando...');
      await this.sleep(3000);
    }

    // PASO 2: Establecer valor de forma ULTRA SUAVE
    this.debugLog('⚙️ Estableciendo valor de forma ultra suave...');
    this.quantityInput.value = quantity;
    await this.sleep(1000); // 1 segundo de pausa
    
    this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
    await this.sleep(2000); // 2 segundos de pausa
    
    this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
    await this.sleep(3000); // 3 segundos para que eBay procese completamente

    // PASO 3: Verificación SIMPLE y DIRECTA
    this.debugLog('🔍 Verificación simple y directa...');
    
    // Método 1: Verificar #qtyErrMsg > span directamente
    const errorElement = document.querySelector('#qtyErrMsg > span');
    if (errorElement && errorElement.textContent.includes('Please enter a lower number')) {
      this.debugLog(`🚨 ERROR DETECTADO DIRECTAMENTE: "${errorElement.textContent}"`);
      return false; // Error encontrado, cantidad no válida
    }

    // Método 2: Verificar toda la página para el texto
    const pageText = document.body.textContent || '';
    if (pageText.includes('Please enter a lower number')) {
      this.debugLog('🚨 ERROR DETECTADO en página completa');
      return false;
    }

    // Método 3: Verificar elementos ux-textspans
    const textspansElements = document.querySelectorAll('.ux-textspans');
    for (let element of textspansElements) {
      if (element.textContent.includes('Please enter a lower number')) {
        this.debugLog(`🚨 ERROR DETECTADO en ux-textspans: "${element.textContent}"`);
        return false;
      }
    }

    this.debugLog(`✅ ${quantity} es VÁLIDO - No hay errores`);
    return true;
  }

  async setQuantityValue(quantity) {
    // Método 1: Eventos estándar
    this.quantityInput.value = quantity;
    this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
    await this.sleep(100);
    this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
    await this.sleep(100);
    
    // Método 2: Simular interacción humana
    this.quantityInput.focus();
    await this.sleep(50);
    this.quantityInput.dispatchEvent(new Event('keyup', { bubbles: true }));
    await this.sleep(50);
    this.quantityInput.blur();
    await this.sleep(100);
    
    // Método 3: Trigger manual adicional
    this.quantityInput.dispatchEvent(new Event('focusout', { bubbles: true }));
    
    this.debugLog(`⚙️ Valor establecido: ${quantity} usando múltiples métodos`);
  }

  captureErrorState() {
    const state = {
      qtyErrMsgSpan: null,
      qtyErrMsgText: '',
      uxTextspansElements: [],
      allErrorElements: [],
      pageTextContainsError: false
    };

    try {
      // Capturar #qtyErrMsg > span específicamente
      const errSpan = document.querySelector('#qtyErrMsg > span');
      if (errSpan) {
        state.qtyErrMsgSpan = errSpan;
        state.qtyErrMsgText = errSpan.textContent || '';
      }

      // Capturar todos los elementos ux-textspans
      const uxSpans = document.querySelectorAll('.ux-textspans');
      state.uxTextspansElements = Array.from(uxSpans).map(el => ({
        text: el.textContent || '',
        visible: el.offsetParent !== null
      }));

      // Capturar elementos que pueden contener errores
      const errorSelectors = ['[class*="error"]', '[id*="error"]', '[class*="notice"]'];
      for (let selector of errorSelectors) {
        const elements = document.querySelectorAll(selector);
        Array.from(elements).forEach(el => {
          state.allErrorElements.push({
            selector: selector,
            text: el.textContent || '',
            visible: el.offsetParent !== null
          });
        });
      }

      // Verificar si la página contiene el texto de error
      const pageText = document.body.textContent || '';
      state.pageTextContainsError = pageText.toLowerCase().includes('please enter a lower number');

    } catch (error) {
      this.debugLog(`❌ Error capturando estado: ${error.message}`);
    }

    return state;
  }

  compareErrorStates(initial, final) {
    // Comparar si apareció texto de error en #qtyErrMsg > span
    if (!initial.qtyErrMsgText && final.qtyErrMsgText) {
      this.debugLog(`🔍 Estado cambió: #qtyErrMsg > span "${initial.qtyErrMsgText}" → "${final.qtyErrMsgText}"`);
      if (final.qtyErrMsgText.toLowerCase().includes('please enter a lower number')) {
        return true;
      }
    }

    // Comparar elementos ux-textspans
    if (final.uxTextspansElements.length > initial.uxTextspansElements.length) {
      this.debugLog('🔍 Aparecieron nuevos elementos ux-textspans');
      for (let element of final.uxTextspansElements) {
        if (element.text.toLowerCase().includes('please enter a lower number')) {
          return true;
        }
      }
    }

    // Comparar si apareció el texto en la página
    if (!initial.pageTextContainsError && final.pageTextContainsError) {
      this.debugLog('🔍 El texto de error apareció en la página');
      return true;
    }

    return false;
  }

  async checkErrorMultipleMethods() {
    this.debugLog('🔍 VERIFICACIÓN MULTI-MÉTODO...');
    
    // MÉTODO 1: Selector específico #qtyErrMsg > span
    try {
      const specificError = document.querySelector('#qtyErrMsg > span');
      if (specificError) {
        const text = specificError.textContent || '';
        this.debugLog(`🔍 Método 1 - #qtyErrMsg > span: "${text}"`);
        if (text.toLowerCase().includes('please enter a lower number')) {
          this.debugLog('🚨 ERROR DETECTADO - Método 1');
          return true;
        }
      } else {
        this.debugLog('🔍 Método 1 - #qtyErrMsg > span: elemento no encontrado');
      }
    } catch (error) {
      this.debugLog(`❌ Error en método 1: ${error.message}`);
    }

    // MÉTODO 2: Todos los selectores posibles de #qtyErrMsg
    const qtySelectors = [
      '#qtyErrMsg > span',
      '#qtyErrMsg span', 
      '#qtyErrMsg > *',
      '#qtyErrMsg',
      '[id="qtyErrMsg"] > span',
      '[id="qtyErrMsg"] span'
    ];

    for (let selector of qtySelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (let element of elements) {
          const text = element.textContent || '';
          if (text.toLowerCase().includes('please enter a lower number')) {
            this.debugLog(`🚨 ERROR DETECTADO - Método 2 (${selector}): "${text}"`);
            return true;
          }
        }
      } catch (error) {
        continue;
      }
    }

    // MÉTODO 3: Buscar por clase ux-textspans
    try {
      const textspans = document.querySelectorAll('.ux-textspans, span.ux-textspans');
      this.debugLog(`🔍 Método 3 - Encontrados ${textspans.length} elementos ux-textspans`);
      for (let element of textspans) {
        const text = element.textContent || '';
        this.debugLog(`🔍 Método 3 - ux-textspans: "${text}"`);
        if (text.toLowerCase().includes('please enter a lower number')) {
          this.debugLog('🚨 ERROR DETECTADO - Método 3');
          return true;
        }
      }
    } catch (error) {
      this.debugLog(`❌ Error en método 3: ${error.message}`);
    }

    // MÉTODO 4: Buscar en toda la página
    try {
      const pageText = document.body.textContent || '';
      if (pageText.toLowerCase().includes('please enter a lower number')) {
        this.debugLog('🚨 ERROR DETECTADO - Método 4 (página completa)');
        return true;
      }
    } catch (error) {
      this.debugLog(`❌ Error en método 4: ${error.message}`);
    }

    // MÉTODO 5: MutationObserver temporal
    try {
      const foundError = await this.checkWithMutationObserver();
      if (foundError) {
        this.debugLog('🚨 ERROR DETECTADO - Método 5 (MutationObserver)');
        return true;
      }
    } catch (error) {
      this.debugLog(`❌ Error en método 5: ${error.message}`);
    }

    // MÉTODO 6: Buscar elementos que acabaron de aparecer
    try {
      const recentElements = document.querySelectorAll('*');
      for (let element of recentElements) {
        const text = element.textContent || '';
        if (text === 'Please enter a lower number' || text === 'please enter a lower number') {
          this.debugLog(`🚨 ERROR DETECTADO - Método 6 (texto exacto): "${text}"`);
          return true;
        }
      }
    } catch (error) {
      this.debugLog(`❌ Error en método 6: ${error.message}`);
    }

    this.debugLog('✅ No se detectaron errores con ningún método');
    return false;
  }

  async checkWithMutationObserver() {
    return new Promise((resolve) => {
      let found = false;
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent && node.textContent.toLowerCase().includes('please enter a lower number')) {
                  found = true;
                }
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                const text = node.textContent || '';
                if (text.toLowerCase().includes('please enter a lower number')) {
                  found = true;
                }
              }
            });
          } else if (mutation.type === 'characterData') {
            const text = mutation.target.textContent || '';
            if (text.toLowerCase().includes('please enter a lower number')) {
              found = true;
            }
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(found);
      }, 200); // Observar por 200ms
    });
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

// Inicializar cuando la página esté lista
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new EbayStockChecker();
  });
} else {
  new EbayStockChecker();
}