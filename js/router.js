export function initRouter(routes, ctx) {
  const view = document.getElementById('view');
  const render = () => {
    const name = (location.hash.replace(/^#\//, '') || 'practice').split('/')[0];
    const route = routes[name] || routes.practice;
    document.querySelectorAll('#tabbar a').forEach(a =>
      a.classList.toggle('active', a.dataset.tab === name));
    view.innerHTML = '';
    route(view, ctx);
  };
  window.addEventListener('hashchange', render);
  render();
}

export function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(el._t); el._t = setTimeout(() => { el.hidden = true; }, 2000);
}
