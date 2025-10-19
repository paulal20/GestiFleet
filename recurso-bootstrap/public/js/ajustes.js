document.addEventListener('keydown', function(e) {
    if (e.altKey && e.key.toLowerCase() === 'r') {
      window.location.href = 'reservas.html';
    }
    if (e.altKey && e.key.toLowerCase() === 'i') {
      window.location.href = 'index.html';
    }
    if (e.altKey && e.key.toLowerCase() === 'v') {
      window.location.href = 'vehiculos.html';
    }
    if (e.altKey && e.key.toLowerCase() === 'c') {
      window.location.href = 'contacto.html';
    }
  });
  
//Función que cambia de tema (de predeterminado a oscuro y viceversa)
(function () {
  const THEME_KEY = 'site_theme'; // 'dark' | 'light'

  // Aplica el tema pasado: 'dark' o 'light'
  function applyTheme(name) {
    if (name === 'dark') document.documentElement.classList.add('dark-theme');
    else document.documentElement.classList.remove('dark-theme');
    // opcional: actualizar apariencia de las opciones del dropdown si existen
    document.querySelectorAll('.tema-opcion').forEach(el => {
      const isActive = (name === 'dark' && el.dataset.value === 'high') ||
                       (name !== 'dark' && el.dataset.value !== 'high');
      el.classList.toggle('active', isActive);
      el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  // Inicial: leer localStorage y aplicar (se llama en cada carga de página)
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') applyTheme(saved);
  else applyTheme('light'); // predeterminado

  // Añadir listeners a las opciones si existen en la página
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.tema-opcion').forEach(opt => {
      opt.addEventListener('click', function (e) {
        e.preventDefault();
        const val = (this.dataset.value === 'high') ? 'dark' : 'light';
        applyTheme(val);
        localStorage.setItem(THEME_KEY, val);
        // cerrar dropdown de bootstrap si está disponible (opcional)
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
  // Guardar el idioma en localStorage para mantenerlo en todas las páginas
  localStorage.setItem('language', lang);

  document.documentElement.lang = lang;

  const elementsEs = document.querySelectorAll('.lang-es');
  const elementsEn = document.querySelectorAll('.lang-en');

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

// para que se active el link de la página actual en la barra de navegación
document.addEventListener("DOMContentLoaded", function() {
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll(".custom-navbar .nav-link");

    navLinks.forEach(link => {
      const href = link.getAttribute("href");
      if (href && href === currentPage) {
        link.classList.add("active");
      }
    });
  });