// eBay Stock Checker Content Script
class EbayStockChecker {
  constructor() {
    this.isChecking = false;
    this.originalText = '';
    this.targetElement = null;
    this.quantityInput = null;
    this.addToCartBtn = null;
    this.init();
  }

  init() {
    console.log('eBay Stock Checker iniciado');
    
    // Esperar a que la página cargue completamente
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.findAndReplaceStock());
    } else {
      this.findAndReplaceStock();
    }

    // Observer para detectar cambios dinámicos
    this.setupMutationObserver();
    
    // Escuchar evento personalizado para forzar verificación
    document.addEventListener('forceStockCheck', () => {
      console.log('Forzando verificación de stock...');
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

    console.log('Buscando elementos con "More than 10 available"...');

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
      console.log(`Probando selector: ${selector}`);
      const elements = document.querySelectorAll(selector);
      console.log(`Encontrados ${elements.length} elementos con selector ${selector}`);
      
      for (let element of elements) {
        const text = element.textContent || '';
        if (text.includes('More than 10 available') || 
            text.includes('Más de 10 disponibles') ||
            text.includes('more than 10 available')) {
          
          console.log('¡Elemento encontrado!', {
            selector: selector,
            text: text,
            element: element
          });
          
          foundElement = element;
          break;
        }
      }
      
      if (foundElement) break;
    }
    
    if (foundElement) {
      this.targetElement = foundElement;
      this.originalText = foundElement.textContent;
      
      console.log('Elemento objetivo establecido:', {
        text: this.originalText,
        element: this.targetElement
      });
      
      // Buscar elementos necesarios para la prueba
      this.findRequiredElements();
      
      if (this.quantityInput) {
        console.log('Campo de cantidad encontrado, iniciando verificación...');
        this.startStockCheck();
      } else {
        console.log('Campo de cantidad NO encontrado');
        this.updateDisplayText('❌ Campo de cantidad no encontrado');
      }
    } else {
      console.log('No se encontró el elemento "More than 10 available"');
    }
  }

  findRequiredElements() {
    console.log('Buscando elementos requeridos...');
    
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
        console.log(`Campo de cantidad encontrado con selector: ${selector}`, element);
        break;
      }
    }
    
    if (!this.quantityInput) {
      console.log('Buscando campos de texto que puedan ser cantidad...');
      const allInputs = document.querySelectorAll('input[type="text"], input[type="number"]');
      for (let input of allInputs) {
        const value = input.value;
        const name = input.name || '';
        const id = input.id || '';
        const className = input.className || '';
        
        // Si el input tiene valor "1" y está relacionado con cantidad
        if (value === '1' && (
          name.toLowerCase().includes('qty') ||
          name.toLowerCase().includes('quantity') ||
          id.toLowerCase().includes('qty') ||
          id.toLowerCase().includes('quantity') ||
          className.toLowerCase().includes('qty')
        )) {
          this.quantityInput = input;
          console.log('Campo de cantidad encontrado por heurística:', input);
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
        console.log(`Botón encontrado con selector: ${selector}`, element);
        break;
      }
    }
    
    console.log('Elementos encontrados:', {
      quantityInput: this.quantityInput ? 'SÍ' : 'NO',
      quantityInputId: this.quantityInput?.id || 'Sin ID',
      quantityInputName: this.quantityInput?.name || 'Sin nombre',
      quantityInputValue: this.quantityInput?.value || 'Sin valor',
      addToCartBtn: this.addToCartBtn ? 'SÍ' : 'NO'
    });
  }

  async startStockCheck() {
    if (this.isChecking) return;
    
    this.isChecking = true;
    this.updateDisplayText('🔄 Verificando stock real...');

    try {
      const realStock = await this.findRealStock();
      
      if (realStock > 0) {
        this.updateDisplayText(`${realStock} disponibles ✅`);
      } else {
        this.updateDisplayText('Stock no determinado ❌');
      }
    } catch (error) {
      console.error('Error al verificar stock:', error);
      this.updateDisplayText('Error al verificar stock ❌');
    } finally {
      this.isChecking = false;
    }
  }

  async findRealStock() {
    if (!this.quantityInput) {
      console.log('No se encontró el campo de cantidad');
      return 0;
    }

    let currentQuantity = 11; // Empezar desde 11
    let maxQuantity = 0;
    const maxAttempts = 200; // Límite de seguridad aumentado
    
    // Guardar valor original
    const originalValue = this.quantityInput.value;
    console.log('Iniciando verificación de stock, valor original:', originalValue);

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
          break;
        }
        
        this.updateDisplayText(`🔄 Buscando límite... ${testQuantity}`);
      } catch (error) {
        console.error('Error en búsqueda de límite:', error);
        break;
      }
    }

    if (!foundLimit) {
      console.log('No se encontró límite superior, usando búsqueda incremental');
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
        } else {
          low = mid;
          maxQuantity = mid;
        }
        
        this.updateDisplayText(`🔄 Verificando... ${mid} (${low}-${high})`);
        
      } catch (error) {
        console.error('Error en búsqueda binaria:', error);
        break;
      }
    }

    // Restaurar valor original
    this.quantityInput.value = originalValue;
    this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
    this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));

    console.log('Stock real encontrado:', maxQuantity);
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