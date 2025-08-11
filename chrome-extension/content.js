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
      width: 300px;
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
    `;
    
    this.debugPanel.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #667eea;">🔍 eBay Stock Checker Debug</h3>
      <div id="debug-content">Iniciando...</div>
      <button id="force-check" style="
        background: #667eea;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
        width: 100%;
      ">Forzar Verificación</button>
    `;
    
    document.body.appendChild(this.debugPanel);
    
    // Agregar event listener al botón
    const forceBtn = this.debugPanel.querySelector('#force-check');
    forceBtn.addEventListener('click', () => {
      this.isChecking = false;
      this.debugLog('🔄 Verificación forzada por usuario');
      this.findAndReplaceStock();
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
      'button:contains("Buy It Now")',
      'a:contains("Buy It Now")'
    ];
    
    for (let selector of cartButtonSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        this.addToCartBtn = element;
        this.debugLog(`✅ Botón encontrado con selector: ${selector}`);
        break;
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

    let currentQuantity = 11; // Empezar desde 11
    let maxQuantity = 0;
    const maxAttempts = 200; // Límite de seguridad aumentado
    
    // Guardar valor original
    const originalValue = this.quantityInput.value;
    this.debugLog(`🔄 Iniciando verificación, valor original: ${originalValue}`);

    // Estrategia de búsqueda binaria modificada
    let low = 11;
    let high = 1000; // Empezar con un límite alto
    let foundLimit = false;

    // Primero, encontrar un límite superior aproximado
    for (let testQuantity = 50; testQuantity <= 2000; testQuantity *= 2) {
      try {
        this.quantityInput.value = testQuantity;
        this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
        this.quantityInput.dispatchEvent(new Event('keyup', { bubbles: true }));
        
        await this.sleep(300);

        if (this.checkForError()) {
          high = testQuantity;
          foundLimit = true;
          this.debugLog(`🎯 Límite superior encontrado: ${testQuantity}`);
          break;
        }
        
        this.updateDisplayText(`🔄 Buscando límite... ${testQuantity}`);
        this.debugLog(`📊 Probando límite: ${testQuantity} - Sin error`);
      } catch (error) {
        this.debugLog(`❌ Error en búsqueda de límite: ${error.message}`);
        break;
      }
    }

    if (!foundLimit) {
      this.debugLog('⚠️ No se encontró límite superior, usando búsqueda incremental');
      return await this.incrementalSearch(originalValue);
    }

    // Ahora usar búsqueda binaria para encontrar el valor exacto
    while (low < high - 1) {
      const mid = Math.floor((low + high) / 2);
      
      try {
        this.quantityInput.value = mid;
        this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
        this.quantityInput.dispatchEvent(new Event('keyup', { bubbles: true }));
        
        await this.sleep(250);
        
        if (this.checkForError()) {
          high = mid;
          this.debugLog(`📊 Binaria: ${mid} = ERROR, nuevo high: ${high}`);
        } else {
          low = mid;
          maxQuantity = mid;
          this.debugLog(`📊 Binaria: ${mid} = OK, nuevo low: ${low}`);
        }
        
        this.updateDisplayText(`🔄 Verificando... ${mid} (${low}-${high})`);
        
      } catch (error) {
        this.debugLog(`❌ Error en búsqueda binaria: ${error.message}`);
        break;
      }
    }

    // Restaurar valor original
    this.quantityInput.value = originalValue;
    this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
    this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));

    this.debugLog(`🎉 Stock real encontrado: ${maxQuantity}`);
    return maxQuantity;
  }

  async incrementalSearch(originalValue) {
    let currentQuantity = 11;
    let maxQuantity = 0;
    const maxAttempts = 500;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        this.quantityInput.value = currentQuantity;
        this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
        this.quantityInput.dispatchEvent(new Event('keyup', { bubbles: true }));
        
        await this.sleep(200);

        if (this.checkForError()) {
          maxQuantity = currentQuantity - 1;
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
        console.error('Error en búsqueda incremental:', error);
        break;
      }
    }

    // Restaurar valor original
    this.quantityInput.value = originalValue;
    this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
    this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));

    return maxQuantity;
  }

  checkForError() {
    const errorMessages = document.querySelectorAll('.ux-textspans, .error, .ebay-notice-content, .textbox__error-msg, #qtyErrMsg');
    
    for (let errorEl of errorMessages) {
      const errorText = errorEl.textContent.toLowerCase();
      if (errorText.includes('please enter a quantity of 1 or more') ||
          errorText.includes('ingresa una cantidad de 1 o más') ||
          errorText.includes('quantity must be') ||
          errorText.includes('la cantidad debe ser') ||
          errorText.includes('exceeded') ||
          errorText.includes('superado') ||
          errorText.includes('maximum quantity') ||
          errorText.includes('cantidad máxima') ||
          errorText.includes('available quantity') ||
          errorText.includes('cantidad disponible') ||
          errorText.includes('inventory limit') ||
          errorText.includes('límite de inventario')) {
        return true;
      }
    }
    return false;
  }

  updateDisplayText(text) {
    if (this.targetElement) {
      this.targetElement.innerHTML = `<span style="color: #2d5aa0; font-weight: bold;">${text}</span>`;
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