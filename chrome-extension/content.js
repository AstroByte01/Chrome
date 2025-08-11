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
    this.debugLog(`🔄 Iniciando verificación MANUAL de 1 en 1, valor original: ${originalValue}`);

    // NUEVA ESTRATEGIA: Probar con números específicos que tú conoces
    const testNumbers = [11, 50, 100, 500, 1000, 2000, 3000, 3400, 3401, 3402, 3500, 4000, 5000];
    
    this.debugLog(`🎯 MODO DEBUG: Probando números específicos: ${testNumbers.join(', ')}`);

    for (let testNumber of testNumbers) {
      // Verificar si la página cambió/se redirigió
      if (!document.body || !this.quantityInput || !document.contains(this.quantityInput)) {
        this.debugLog('❌ PÁGINA CAMBIÓ - Deteniendo verificación');
        break;
      }

      try {
        this.debugLog(`📊 === PROBANDO NÚMERO: ${testNumber} ===`);
        
        // Capturar estado ANTES
        const beforeHTML = this.captureAreaAroundQuantity();
        
        // Establecer valor
        this.quantityInput.value = testNumber;
        this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        await this.sleep(100);
        this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Esperar procesamiento
        await this.sleep(2000); // 2 segundos para estar seguro
        
        // Capturar estado DESPUÉS
        const afterHTML = this.captureAreaAroundQuantity();
        
        // Comparar cambios
        if (beforeHTML !== afterHTML) {
          this.debugLog(`🔄 CAMBIO DETECTADO en ${testNumber}:`);
          this.debugLog(`ANTES: ${beforeHTML.substring(0, 200)}...`);
          this.debugLog(`DESPUÉS: ${afterHTML.substring(0, 200)}...`);
        }
        
        // Verificar error
        const hasError = this.checkForError();
        
        if (hasError) {
          this.debugLog(`🎉 ¡ERROR DETECTADO en ${testNumber}! Stock real debe ser menor`);
          
          // Restaurar inmediatamente
          this.quantityInput.value = originalValue;
          this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
          this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
          
          return testNumber - 1;
        } else {
          this.debugLog(`✅ Sin error en ${testNumber}`);
        }
        
        this.updateDisplayText(`🔄 Probando... ${testNumber}`);
        
      } catch (error) {
        this.debugLog(`❌ Error probando ${testNumber}: ${error.message}`);
        
        // Restaurar valor si hay error
        try {
          this.quantityInput.value = originalValue;
          this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        } catch (restoreError) {
          this.debugLog(`❌ Error restaurando valor: ${restoreError.message}`);
        }
        
        break;
      }
    }

    // Restaurar valor final
    try {
      if (this.quantityInput && document.contains(this.quantityInput)) {
        this.quantityInput.value = originalValue;
        this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
        this.debugLog(`🔄 Valor restaurado a: ${originalValue}`);
      }
    } catch (finalRestoreError) {
      this.debugLog(`❌ Error en restauración final: ${finalRestoreError.message}`);
    }

    this.debugLog(`⚠️ No se detectó límite en números de prueba`);
    return 0;
  }

  captureAreaAroundQuantity() {
    try {
      // Capturar el contenedor padre del campo de cantidad
      let container = this.quantityInput.parentElement;
      if (container && container.parentElement) {
        container = container.parentElement; // Subir un nivel más
      }
      
      const html = container ? container.innerHTML : 'No container found';
      return html;
    } catch (error) {
      return `Error capturing HTML: ${error.message}`;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  checkForError() {
    this.debugLog('🔍 Buscando mensajes de error ESPECÍFICOS...');

    // MÉTODO 1: Buscar texto exacto "Please enter a lower number" en toda la página
    const fullPageText = document.body.innerText || document.body.textContent || '';
    
    if (fullPageText.includes('Please enter a lower number')) {
      this.debugLog('🚨 ENCONTRADO: "Please enter a lower number" en página completa');
      return true;
    }
    
    if (fullPageText.includes('please enter a lower number')) {
      this.debugLog('🚨 ENCONTRADO: "please enter a lower number" en página completa');
      return true;
    }

    // MÉTODO 2: Buscar elementos rojos cerca del campo de cantidad
    try {
      const quantityContainer = this.quantityInput.parentElement;
      const nearbyElements = quantityContainer ? 
        quantityContainer.querySelectorAll('*') : 
        document.querySelectorAll('*');

      for (let element of nearbyElements) {
        const text = element.textContent || element.innerText || '';
        const computedStyle = window.getComputedStyle(element);
        
        // Si es un elemento rojo Y contiene texto relacionado con error
        if (computedStyle.color.includes('rgb(255') || 
            computedStyle.color.includes('red') ||
            computedStyle.color.includes('rgba(255')) {
          
          if (text.toLowerCase().includes('please enter a lower') ||
              text.toLowerCase().includes('enter a lower') ||
              text.toLowerCase().includes('lower number') ||
              text.toLowerCase().includes('not available') ||
              text.toLowerCase().includes('insufficient')) {
            
            this.debugLog(`🚨 ENCONTRADO elemento rojo con error: "${text}"`);
            return true;
          }
        }
      }
    } catch (error) {
      this.debugLog(`❌ Error buscando elementos rojos: ${error.message}`);
    }

    // MÉTODO 3: Buscar cambios en el DOM después de cambiar cantidad
    try {
      // Buscar elementos que aparecieron recientemente
      const allSpans = document.querySelectorAll('span');
      const allDivs = document.querySelectorAll('div');
      const allElements = [...allSpans, ...allDivs];
      
      for (let element of allElements) {
        const text = (element.textContent || '').toLowerCase();
        
        // Si contiene palabras clave de error y tiene poco texto (es un mensaje específico)
        if (text.length > 5 && text.length < 100) {
          if (text.includes('please enter a lower') ||
              text.includes('enter a lower number') ||
              text.includes('lower number') ||
              text.includes('quantity must be') ||
              text.includes('maximum') ||
              text.includes('limit') ||
              text.includes('exceeded') ||
              text.includes('not enough') ||
              text.includes('insufficient stock')) {
            
            this.debugLog(`🚨 ENCONTRADO mensaje de error: "${text}"`);
            return true;
          }
        }
      }
    } catch (error) {
      this.debugLog(`❌ Error buscando en DOM: ${error.message}`);
    }

    // MÉTODO 4: Verificar si apareció algún elemento de notificación/error
    const errorClasses = [
      '.error', '.Error', '.ERROR',
      '.notice', '.Notice', '.NOTICE',
      '.alert', '.Alert', '.ALERT',
      '.warning', '.Warning', '.WARNING',
      '.message', '.Message', '.MESSAGE'
    ];

    for (let className of errorClasses) {
      try {
        const elements = document.querySelectorAll(className);
        for (let element of elements) {
          const text = (element.textContent || '').toLowerCase();
          if (text.includes('lower') || text.includes('limit') || text.includes('maximum')) {
            this.debugLog(`🚨 ENCONTRADO en clase ${className}: "${text}"`);
            return true;
          }
        }
      } catch (error) {
        // Continuar con el siguiente selector
      }
    }

    this.debugLog('✅ No se detectaron errores con métodos específicos');
    return false;
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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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