(function() {
  const shortcuts = [
    // Vehículos
    { keys: ['alt+v', 'alt+shift+v', 'ctrl+alt+v'], url: '/vehiculos' },

    // Reservas
    { keys: ['alt+r', 'alt+shift+r', 'ctrl+alt+r'], url: '/reserva' },

    // Contacto
    { keys: ['alt+c', 'alt+shift+c'], url: '/contacto' },

    // Inicio
    { keys: ['alt+i', 'alt+shift+i'], url: '/' }
  ];
  document.addEventListener('keydown', function(e) {
    try {
      if (e.repeat) return;

      const a = document.activeElement;
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) {
        return;
      }

      const parts = [];
      if (e.ctrlKey) parts.push('ctrl');
      if (e.altKey) parts.push('alt');
      if (e.shiftKey) parts.push('shift');
      parts.push((e.key || '').toLowerCase());

      const pressed = parts.join('+');

      for (const sc of shortcuts) {
        if (sc.keys.includes(pressed)) {
          e.preventDefault();
          console.log("Atajo detectado:", pressed, "→", sc.url);
          window.location.href = sc.url;
          return;
        }
      }

    } catch(err) {
      console.error("Error en los atajos:", err);
    }
  });

})();


//Función que cambia de tema (de predeterminado a oscuro y viceversa)
(function () {
  const THEME_KEY = 'site_theme'; // 'dark' | 'light'

  function applyTheme(name) {
    if (name === 'dark') document.documentElement.classList.add('dark-theme');
    else document.documentElement.classList.remove('dark-theme');

    document.querySelectorAll('.tema-opcion').forEach(el => {
      const isActive = (name === 'dark' && el.dataset.value === 'high') ||
                       (name !== 'dark' && el.dataset.value !== 'high');
      el.classList.toggle('active', isActive);
      el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  // Aplicar tema lo antes posible para evitar flicker
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved);
    } else {
      applyTheme('light');
    }
  } catch (err) {
    applyTheme('light');
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.tema-opcion').forEach(opt => {
      opt.addEventListener('click', function (e) {
        e.preventDefault();
        const val = (this.dataset.value === 'high') ? 'dark' : 'light';
        applyTheme(val);
        try { localStorage.setItem(THEME_KEY, val); } catch(e){}
        const toggle = document.getElementById('temaDropdown');
        if (toggle && typeof bootstrap !== 'undefined') {
          const inst = bootstrap.Dropdown.getInstance(toggle) || new bootstrap.Dropdown(toggle);
          inst.hide();
        }
      });
    });
  });
})();

//Función para que no parpadee cuando cambiamos de tema
(function(){
  try {
    if (localStorage.getItem('site_theme') === 'dark') {
      document.documentElement.classList.add('dark-theme');
    }
  } catch(e){}
})();

// CAMBIAR IDIOMA
function setLanguage(lang) {
  try { localStorage.setItem('language', lang); } catch(e){}
  document.documentElement.lang = lang;

  const elementsEs = document.querySelectorAll('.lang-es, .lang.lang-es');
  const elementsEn = document.querySelectorAll('.lang-en, .lang.lang-en');

  if (lang === 'es') {
    elementsEs.forEach(el => el.classList.remove('d-none'));
    elementsEn.forEach(el => el.classList.add('d-none'));
  } else {
    elementsEs.forEach(el => el.classList.add('d-none'));
    elementsEn.forEach(el => el.classList.remove('d-none'));
  }
  
}

// Al cargar la página, aplica el idioma guardado (por defecto "es")
document.addEventListener('DOMContentLoaded', function() {
  const savedLang = localStorage.getItem('language') || 'es';
  setLanguage(savedLang);
});

// Ajuste de tamaño de letra
(function() {
    const SIZE_KEY = 'font_size';

    function applyFontSize(size) {
        const validSize = ['80', '100', '120'].includes(String(size)) ? size : '100';

        document.documentElement.style.fontSize = validSize + '%';

        document.querySelectorAll('.tamanyo-opcion').forEach(el => {
            const isActive = (el.dataset.size === validSize);
            el.classList.toggle('active', isActive);
            el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    try {
        const savedSize = localStorage.getItem(SIZE_KEY);
        if (savedSize) {
            applyFontSize(savedSize);
        } else {
            applyFontSize('100');
        }
    } catch (err) {
        applyFontSize('100');
    }

    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.tamanyo-opcion').forEach(opt => {
            opt.addEventListener('click', function(e) {
                e.preventDefault();
                const newSize = this.dataset.size;
                
                applyFontSize(newSize);
                
                try {
                    localStorage.setItem(SIZE_KEY, newSize);
                } catch (e) {
                }

                const toggle = document.getElementById('accesibilidadDropdown');
                if (toggle && typeof bootstrap !== 'undefined') {
                    const inst = bootstrap.Dropdown.getInstance(toggle) || new bootstrap.Dropdown(toggle);
                    inst.hide();
                }
            });
        });
    });

})();

document.addEventListener('DOMContentLoaded', function() {
  try {
    const currentPath = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
    const navLinks = document.querySelectorAll(".custom-navbar .nav-link");

    navLinks.forEach(link => {
      const href = (link.getAttribute("href") || '').trim();

      if (!href || href.startsWith('#') || href.toLowerCase().startsWith('javascript:') || link.classList.contains('dropdown-toggle')) {
        link.classList.remove('active');
        return;
      }

      const a = href.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
      if (a === currentPath) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  } catch(e){ }
});

//Calcular bien el header y el nav fijo
(function () {
  'use strict';
  const headerNav = document.querySelector('.header-nav');
  const main = document.getElementById('app-main') || document.querySelector('main');

  if (!headerNav || !main) return;

  function updateTopOffset() {
    const rect = headerNav.getBoundingClientRect();
    const height = Math.ceil(rect.height);
    document.documentElement.style.setProperty('--top-offset', height + 'px');
    main.style.paddingTop = 'var(--top-offset)';
  }

  window.addEventListener('load', updateTopOffset);
  window.addEventListener('resize', updateTopOffset);
  window.addEventListener('orientationchange', updateTopOffset);

  document.addEventListener('shown.bs.collapse', updateTopOffset);
  document.addEventListener('hidden.bs.collapse', updateTopOffset);

  if (window.ResizeObserver) {
    const ro = new ResizeObserver(updateTopOffset);
    ro.observe(headerNav);
  }

  updateTopOffset();
})();
