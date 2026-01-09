// ============================================
// Configuración para GitHub Pages
// ============================================

(function() {
    'use strict';
    
    /**
     * Detecta si estamos en GitHub Pages y retorna el BASE_PATH
     * @returns {string} - Path base del repositorio (ej: "/BookStore" o "")
     */
    function getBasePath() {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        
        console.log('🔍 Hostname:', hostname);
        console.log('🔍 Pathname:', pathname);
        
        // Si NO estamos en GitHub Pages (desarrollo local)
        if (!hostname.includes('github.io')) {
            console.log('📍 Modo: Desarrollo Local');
            return '';
        }
        
        console.log('📍 Modo: GitHub Pages');
        
        // Extraer nombre del repositorio de la URL
        // Ej: /BookStore/index.html -> ["BookStore", "index.html"]
        const parts = pathname.split('/').filter(part => part.length > 0);
        
        if (parts.length > 0 && !parts[0].endsWith('.html')) {
            const basePath = `/${parts[0]}`;
            console.log('✅ BASE_PATH detectado:', basePath);
            return basePath;
        }
        
        console.log('✅ BASE_PATH: raíz');
        return '';
    }

    // Obtener y configurar BASE_PATH
    const BASE_PATH = getBasePath();
    
    // Exportar globalmente
    window.BASE_PATH = BASE_PATH;
    
    // Log de confirmación
    console.log('🎯 BASE_PATH configurado:', window.BASE_PATH || '(raíz)');
    console.log('🌐 URL completa:', window.location.href);
    
})();