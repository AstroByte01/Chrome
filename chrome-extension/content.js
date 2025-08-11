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
      <button id="force-check" style="
        background: #667eea;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
        width: 100%;
        font-size: 12px;
      ">🔄 Forzar Verificación</button>
      <button id="clear-log" style="
        background: #ff9ff3;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 5px;
        width: 100%;
        font-size: 11px;
      ">🗑️ Limpiar Log</button>
    `;
    
    document.body.appendChild(this.debugPanel);
    
    // Event listeners
    const forceBtn = this.debugPanel.querySelector('#force-check');
    forceBtn.addEventListener('click', () => {
      this.isChecking = false;
      this.debugLog('🔄 Verificación forzada por usuario');
      this.findAndReplaceStock();
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
    this.updateDisplayText('🔄 Verificando stock real...');
    this.debugLog('🚀 Iniciando verificación de stock...');

    try {
      const realStock = await this.findRealStock();
      
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
    this.debugLog(`🔄 Iniciando verificación, valor original: ${originalValue}`);

    // Estrategia mejorada: empezar con búsqueda binaria directa
    let low = 11;
    let high = 10000; // Límite más alto inicial
    let maxQuantity = 0;
    let attempt = 0;
    const maxAttempts = 50; // Reducir intentos para ser más eficiente

    this.debugLog(`🎯 Usando búsqueda binaria: rango inicial ${low}-${high}`);

    while (low <= high && attempt < maxAttempts) {
      const mid = Math.floor((low + high) / 2);
      attempt++;
      
      try {
        this.debugLog(`📊 Intento ${attempt}: probando cantidad ${mid}`);
        
        // Establecer valor y disparar eventos
        this.quantityInput.value = mid;
        this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
        this.quantityInput.dispatchEvent(new Event('keyup', { bubbles: true }));
        this.quantityInput.dispatchEvent(new Event('blur', { bubbles: true }));
        
        // Esperar a que se procese
        await this.sleep(400); // Aumentar tiempo de espera
        
        // Verificar error
        const hasError = this.checkForError();
        
        if (hasError) {
          this.debugLog(`🚨 Error detectado en ${mid}, ajustando high a ${mid - 1}`);
          high = mid - 1;
        } else {
          this.debugLog(`✅ Sin error en ${mid}, ajustando low a ${mid + 1}`);
          maxQuantity = mid;
          low = mid + 1;
        }
        
        this.updateDisplayText(`🔄 Verificando... ${mid} (${low}-${high}) [${attempt}/${maxAttempts}]`);
        
      } catch (error) {
        this.debugLog(`❌ Error en búsqueda binaria: ${error.message}`);
        break;
      }
    }

    // Si no encontramos nada, probar búsqueda incremental pequeña
    if (maxQuantity === 0) {
      this.debugLog('⚠️ Búsqueda binaria sin resultados, probando incremental...');
      maxQuantity = await this.incrementalSearchSmall(originalValue);
    }

    // Restaurar valor original
    this.quantityInput.value = originalValue;
    this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
    this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));

    this.debugLog(`🎉 Stock real encontrado: ${maxQuantity} después de ${attempt} intentos`);
    return maxQuantity;
  }

  async incrementalSearchSmall(originalValue) {
    let currentQuantity = 11;
    let maxQuantity = 0;
    const maxAttempts = 100; // Búsqueda más limitada
    
    this.debugLog('🔄 Iniciando búsqueda incremental pequeña...');
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        this.quantityInput.value = currentQuantity;
        this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
        this.quantityInput.dispatchEvent(new Event('keyup', { bubbles: true }));
        this.quantityInput.dispatchEvent(new Event('blur', { bubbles: true }));
        
        await this.sleep(300);

        if (this.checkForError()) {
          maxQuantity = currentQuantity - 1;
          this.debugLog(`🎯 Límite encontrado en: ${maxQuantity}`);
          break;
        }

        this.updateDisplayText(`🔄 Incremental... ${currentQuantity}`);
        
        // Incrementar más conservadoramente
        if (currentQuantity < 50) {
          currentQuantity += 5;
        } else if (currentQuantity < 200) {
          currentQuantity += 10;
        } else {
          currentQuantity += 25;
        }

      } catch (error) {
        this.debugLog(`❌ Error en búsqueda incremental: ${error.message}`);
        break;
      }
    }

    this.debugLog(`📊 Búsqueda incremental completada: ${maxQuantity}`);
    return maxQuantity;
  }

  async incrementalSearch(originalValue) {
    let currentQuantity = 11;
    let maxQuantity = 0;
    const maxAttempts = 500;
    
    this.debugLog('🔄 Iniciando búsqueda incremental...');
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        this.quantityInput.value = currentQuantity;
        this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
        this.quantityInput.dispatchEvent(new Event('keyup', { bubbles: true }));
        
        await this.sleep(200);

        if (this.checkForError()) {
          maxQuantity = currentQuantity - 1;
          this.debugLog(`🎯 Límite encontrado en: ${maxQuantity}`);
          break;
        }

        this.updateDisplayText(`🔄 Verificando... ${currentQuantity}`);
        
        // Incrementar inteligentemente
        if (currentQuantity < 100) {
          currentQuantity += 10;
        } else if (currentQuantity < 500) {
          currentQuantity += 25;
        } else {
          currentQuantity += 50;
        }

      } catch (error) {
        this.debugLog(`❌ Error en búsqueda incremental: ${error.message}`);
        break;
      }
    }

    // Restaurar valor original
    this.quantityInput.value = originalValue;
    this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
    this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));

    this.debugLog(`📊 Búsqueda incremental completada: ${maxQuantity}`);
    return maxQuantity;
  }

  checkForError() {
    // Primero buscar mensajes de error específicos de eBay
    const specificErrorMessages = [
      'Please enter a lower number',
      'please enter a lower number', 
      'Please enter a quantity of 1 or more',
      'please enter a quantity of 1 or more',
      'Quantity must be',
      'quantity must be',
      'exceeded',
      'superado',
      'maximum quantity',
      'cantidad máxima',
      'available quantity',
      'cantidad disponible',
      'inventory limit',
      'límite de inventario',
      'enter a lower',
      'ingresa un número menor',
      'ingresa una cantidad',
      'la cantidad debe ser'
    ];

    // Buscar en todo el texto de la página primero
    const pageText = document.body.innerText || document.body.textContent || '';
    const lowerPageText = pageText.toLowerCase();
    
    for (let errorMsg of specificErrorMessages) {
      if (lowerPageText.includes(errorMsg.toLowerCase())) {
        this.debugLog(`🚨 Error detectado en página: "${errorMsg}"`);
        return true;
      }
    }

    // Buscar en elementos específicos con selectores más amplios
    const errorSelectors = [
      '.ux-textspans', 
      '.error', 
      '.ebay-notice-content', 
      '.textbox__error-msg', 
      '#qtyErrMsg',
      '[class*="error"]',
      '[class*="notice"]',
      '[class*="alert"]',
      '[id*="error"]',
      '[style*="color: red"]',
      '[style*="color:red"]',
      '*[class*="text-"]', // Clases que contengan text-
      'span[class*="ux-"]'   // Elementos span con clases ux-
    ];
    
    for (let selector of errorSelectors) {
      try {
        const errorMessages = document.querySelectorAll(selector);
        for (let errorEl of errorMessages) {
          const errorText = (errorEl.textContent || errorEl.innerText || '').toLowerCase();
          
          // Buscar cualquier mensaje de error
          for (let errorMsg of specificErrorMessages) {
            if (errorText.includes(errorMsg.toLowerCase())) {
              this.debugLog(`🚨 Error detectado con selector "${selector}": "${errorText.substring(0, 50)}..."`);
              return true;
            }
          }
        }
      } catch (error) {
        this.debugLog(`❌ Error con selector "${selector}": ${error.message}`);
      }
    }

    // Búsqueda adicional en elementos que pueden contener errores
    try {
      const allElements = document.querySelectorAll('*');
      for (let element of allElements) {
        const text = (element.textContent || element.innerText || '').toLowerCase();
        const style = window.getComputedStyle(element);
        
        // Si el elemento tiene texto rojo y contiene un mensaje de error
        if (style.color.includes('rgb(255') || style.color.includes('red')) {
          for (let errorMsg of specificErrorMessages) {
            if (text.includes(errorMsg.toLowerCase()) && text.length < 100) { // Evitar textos muy largos
              this.debugLog(`🚨 Error detectado por color rojo: "${text.substring(0, 50)}..."`);
              return true;
            }
          }
        }
      }
    } catch (error) {
      this.debugLog(`❌ Error en búsqueda por color: ${error.message}`);
    }
    
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