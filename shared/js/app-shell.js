/* ============================================================
   <app-shell> — layout maestro del sistema (sidebar + topbar)
   Web Component reutilizable en TODOS los módulos.

   Usa Light DOM (no Shadow DOM) a propósito: así el CSS global
   (tokens, layout, components) sigue aplicando al contenido de
   cada página sin duplicar estilos.

   Uso:
     <app-shell active="mallas"
                page-title="Gestión de Mallas Curriculares"
                page-subtitle="Administración y seguimiento..."
                page-action="Nueva Malla Curricular"
                page-action-id="nueva-malla">
       <!-- aquí va SOLO el contenido del módulo -->
     </app-shell>

   Atributos:
     active            id del NAV_ITEM activo (ver nav-config.js)
     page-title        título de la cabecera de página
     page-subtitle     subtítulo (opcional)
     page-action       texto del botón primario de la cabecera (opcional)
     page-action-id    id para el botón primario (opcional; default "page-action")

   Evento:
     'app-action'      se dispara al hacer clic en el botón primario.
   ============================================================ */

class AppShell extends HTMLElement {
  connectedCallback() {
    // Captura el contenido del módulo antes de reconstruir el shell.
    const moduleContent = this.innerHTML;

    const active     = this.getAttribute('active') || '';
    const title      = this.getAttribute('page-title') || '';
    const subtitle   = this.getAttribute('page-subtitle') || '';
    const actionText = this.getAttribute('page-action') || '';
    const actionId   = this.getAttribute('page-action-id') || 'page-action';

    const user = (typeof CURRENT_USER !== 'undefined') ? CURRENT_USER : {};

    this.innerHTML = `
      <div class="app">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar__brand">
            <div class="sidebar__logo">USIL ERP</div>
            <div class="sidebar__tagline">Gestión Académica</div>
          </div>

          ${actionText ? `
          <div class="sidebar__cta">
            <button class="btn btn--primary btn--block" id="${actionId}">
              <span class="btn__icon" data-icon="plus"></span>
              ${actionText}
            </button>
          </div>` : ''}

          <nav class="sidebar__nav" aria-label="Navegación principal">
            ${this._renderNav(NAV_ITEMS, active)}
          </nav>

          <div class="sidebar__footer">
            ${this._renderNav(NAV_FOOTER, active, true)}
          </div>
        </aside>

        <div class="main">
          <header class="topbar">
            <button class="menu-toggle" id="menu-toggle" data-icon="menu" aria-label="Abrir menú"></button>
            <div class="topbar__actions">
              <button class="topbar__icon-btn" data-icon="bell" aria-label="Notificaciones"></button>
              <button class="topbar__icon-btn" data-icon="help" aria-label="Ayuda"></button>
              <div class="topbar__user">
                <div class="topbar__user-meta">
                <div class="topbar__user-name"></div>
                <div class="topbar__user-role"></div>
                </div>
                ${user.avatar
                ? `<img class="topbar__avatar" src="${user.avatar}" alt="Avatar">`
                  : ''}
              </div>
            </div>
          </header>

          <main class="content">
            <div class="content__inner">
              ${(title || actionText) ? `
              <div class="page-header">
                <div>
                  ${title ? `<h1 class="page-header__title">${title}</h1>` : ''}
                  ${subtitle ? `<p class="page-header__subtitle">${subtitle}</p>` : ''}
                </div>
                ${actionText ? `
                <button class="btn btn--primary" id="${actionId}">
                  <span class="btn__icon" data-icon="plus"></span>
                  ${actionText}
                </button>` : ''}
              </div>` : ''}

              <div class="shell-slot">${moduleContent}</div>
            </div>
          </main>
        </div>
      </div>
    `;

    this._bindEvents(actionId);
    if (typeof renderIcons === 'function') renderIcons(this);
    
    // Sanitiza datos del usuario después de inyectar HTML
    const userNameEl = this.querySelector('.topbar__user-name');
    const userRoleEl = this.querySelector('.topbar__user-role');
    if (userNameEl) userNameEl.textContent = user.name || '';
    if (userRoleEl) userRoleEl.textContent = user.role || '';

    // Avisa a la página que el shell ya montó su contenido.
    this.dispatchEvent(new CustomEvent('shell-ready', { bubbles: true }));
  }

  _renderNav(items, active, small = false) {
    return items.map((item) => {
      const isActive = item.id === active ? ' is-active' : '';
      const sm = small ? ' nav-item--sm' : '';
      return `<a href="${item.href}" class="nav-item${sm}${isActive}"
                 ${item.id === active ? 'aria-current="page"' : ''}>
                <span class="nav-item__icon" data-icon="${item.icon}"></span>${item.label}
              </a>`;
    }).join('');
  }

  _bindEvents(actionId) {
    const toggle  = this.querySelector('#menu-toggle');
    const sidebar = this.querySelector('#sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => sidebar.classList.toggle('is-open'));
    }

    const action = this.querySelector(`#${actionId}`);
    if (action) {
      action.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('app-action', { bubbles: true, detail: actionId }));
      });
    }
  }
}

customElements.define('app-shell', AppShell);
