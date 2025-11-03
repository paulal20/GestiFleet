document.addEventListener('keydown', function(e) {
  if (e.altKey && e.key.toLowerCase() === 'r') {
    window.location.href = '/reserva';
  }
  if (e.altKey && e.key.toLowerCase() === 'i') {
    window.location.href = '/';
  }
  if (e.altKey && e.key.toLowerCase() === 'v') {
    window.location.href = '/vehiculos';
  }
  if (e.altKey && e.key.toLowerCase() === 'c') {
    window.location.href = '/contacto';
  }
});

//Función que cambia de tema (de predeterminado a oscuro y viceversa)
(function () {
  const THEME_KEY = 'site_theme'; // 'dark' | 'light'

  function applyTheme(name) {
    if (name === 'dark') document.documentElement.classList.add('dark-theme');
    else document.documentElement.classList.remove('dark-theme');

    // Actualizar estado visual de opciones si existen
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
    // en entornos con bloqueo de localStorage
    applyTheme('light');
  }

  // Añadir listeners a opciones del dropdown una vez cargado el DOM
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.tema-opcion').forEach(opt => {
      opt.addEventListener('click', function (e) {
        e.preventDefault();
        const val = (this.dataset.value === 'high') ? 'dark' : 'light';
        applyTheme(val);
        try { localStorage.setItem(THEME_KEY, val); } catch(e){}
        // cerrar dropdown bootstrap si está presente
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


document.addEventListener('DOMContentLoaded', function() {
  try {
    const currentPath = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
    const navLinks = document.querySelectorAll(".custom-navbar .nav-link");

    navLinks.forEach(link => {
      const href = (link.getAttribute("href") || '').trim();

      // Ignorar anchors, triggers de dropdown y enlaces vacíos o javascript:
      if (!href || href.startsWith('#') || href.toLowerCase().startsWith('javascript:') || link.classList.contains('dropdown-toggle')) {
        link.classList.remove('active');
        return;
      }

      // normalizar: quitar query/hash y slash final
      const a = href.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
      if (a === currentPath) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  } catch(e){ /* no crítico */ }
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
    // actualizar variable CSS y padding directo (por redundancia)
    document.documentElement.style.setProperty('--top-offset', height + 'px');
    main.style.paddingTop = 'var(--top-offset)';
  }

  // eventos
  window.addEventListener('load', updateTopOffset);
  window.addEventListener('resize', updateTopOffset);
  window.addEventListener('orientationchange', updateTopOffset);

  // Eventos de Bootstrap (cuando se abre/cierra el collapse en móvil)
  document.addEventListener('shown.bs.collapse', updateTopOffset);
  document.addEventListener('hidden.bs.collapse', updateTopOffset);

  // Observador para cambios dinámicos en .header-nav
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(updateTopOffset);
    ro.observe(headerNav);
  }

  // cálculo inicial ya
  updateTopOffset();
})();

