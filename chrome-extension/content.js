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

    // Buscar el elemento con "More than 10 available"
    const stockElements = document.querySelectorAll('span.ux-textspans--SECONDARY');
    
    for (let element of stockElements) {
      if (element.textContent.includes('More than 10 available') || 
          element.textContent.includes('Más de 10 disponibles')) {
        
        this.targetElement = element;
        this.originalText = element.textContent;
        
        // Buscar elementos necesarios para la prueba
        this.findRequiredElements();
        
        if (this.quantityInput && this.addToCartBtn) {
          this.startStockCheck();
        }
        break;
      }
    }
  }

  findRequiredElements() {
    // Buscar campo de cantidad - usar el selector específico primero
    this.quantityInput = document.querySelector('#qtyTextBox') ||
                        document.querySelector('input[name="quantity"]') ||
                        document.querySelector('input[data-testid="qty-input"]') ||
                        document.querySelector('input[id*="quantity"]') ||
                        document.querySelector('.textbox__control[name="quantity"]') ||
                        document.querySelector('.quantity input') ||
                        document.querySelector('#qtySubTxt');

    // Buscar botón de agregar al carrito para triggear validación
    this.addToCartBtn = document.querySelector('[data-testid="cta-top"]') ||
                       document.querySelector('#atcBtn') ||
                       document.querySelector('.notranslate') ||
                       document.querySelector('a[href*="addToCart"]') ||
                       document.querySelector('[data-testid="atc-cta-button"]');
    
    console.log('Elementos encontrados:', {
      quantityInput: this.quantityInput ? 'Encontrado' : 'No encontrado',
      quantityInputId: this.quantityInput?.id || 'Sin ID',
      addToCartBtn: this.addToCartBtn ? 'Encontrado' : 'No encontrado'
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
    if (!this.quantityInput) return 0;

    let currentQuantity = 11; // Empezar desde 11
    let maxQuantity = 0;
    const maxAttempts = 100; // Límite de seguridad
    
    // Guardar valor original
    const originalValue = this.quantityInput.value;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Establecer cantidad
        this.quantityInput.value = currentQuantity;
        this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Esperar un poco para que se procese
        await this.sleep(200);

        // Verificar si hay mensaje de error
        const errorMessages = document.querySelectorAll('.ux-textspans, .error, .ebay-notice-content, .textbox__error-msg, #qtyErrMsg');
        let hasError = false;

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
            hasError = true;
            console.log('Error detectado:', errorText);
            break;
          }
        }

        if (hasError) {
          maxQuantity = currentQuantity - 1;
          break;
        }

        // Actualizar display con progreso
        this.updateDisplayText(`🔄 Verificando... ${currentQuantity}`);
        
        currentQuantity += 10; // Incrementar en pasos de 10 para ir más rápido
        
        // Si llegamos muy alto, cambiar a incrementos de 1
        if (currentQuantity > 500) {
          currentQuantity = maxQuantity + 1;
          for (let i = currentQuantity; i < currentQuantity + 50; i++) {
            this.quantityInput.value = i;
            this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
            await this.sleep(100);
            
            const hasDetailedError = Array.from(errorMessages).some(el => 
              el.textContent.toLowerCase().includes('please enter a quantity of 1 or more')
            );
            
            if (hasDetailedError) {
              maxQuantity = i - 1;
              break;
            }
          }
          break;
        }

      } catch (error) {
        console.error('Error en intento:', error);
        break;
      }
    }

    // Restaurar valor original
    this.quantityInput.value = originalValue;
    this.quantityInput.dispatchEvent(new Event('input', { bubbles: true }));

    return maxQuantity;
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