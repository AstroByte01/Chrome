// Popup JavaScript
document.addEventListener('DOMContentLoaded', function() {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const toggleBtn = document.getElementById('toggleBtn');
  const refreshBtn = document.getElementById('refreshBtn');

  // Verificar si estamos en una página de eBay
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    const isEbayPage = currentTab.url.includes('ebay.com') && currentTab.url.includes('/itm/');
    
    if (isEbayPage) {
      statusIndicator.style.color = '#28a745';
      statusText.textContent = 'Activo en esta página';
      toggleBtn.textContent = 'Verificar Stock Ahora';
    } else {
      statusIndicator.style.color = '#ffc107';
      statusText.textContent = 'No es una página de producto eBay';
      toggleBtn.textContent = 'Ir a eBay';
      toggleBtn.onclick = () => {
        chrome.tabs.create({url: 'https://www.ebay.com'});
      };
    }
  });

  // Botón toggle
  toggleBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      
      if (currentTab.url.includes('ebay.com') && currentTab.url.includes('/itm/')) {
        // Ejecutar script en la página actual
        chrome.scripting.executeScript({
          target: {tabId: currentTab.id},
          function: forceStockCheck
        });
        
        statusText.textContent = 'Verificando stock...';
        statusIndicator.style.color = '#007bff';
        
        setTimeout(() => {
          statusText.textContent = 'Verificación completada';
          statusIndicator.style.color = '#28a745';
        }, 3000);
      }
    });
  });

  // Botón refresh
  refreshBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.reload(tabs[0].id);
      window.close();
    });
  });
});

// Función que se ejecuta en el contexto de la página
function forceStockCheck() {
  // Buscar instancia del checker y forzar verificación
  const event = new CustomEvent('forceStockCheck', {
    detail: { force: true }
  });
  document.dispatchEvent(event);
}