// Tabs: one page, hash routing (#application, #landing, #ads, #growth, #creators, #claims)
(function () {
  const views = [...document.querySelectorAll('main > section.view')];
  const tabs = [...document.querySelectorAll('.topbar a.tab')];
  // A hash can name a tab (#growth, held by section#view-growth) or an element inside one (#g3, #chat, #calc):
  // open the tab that holds it, then scroll to it. Tab sections carry a "view-" prefix so the browser's own
  // anchor jump doesn't scroll past the header when a tab link is opened directly.
  function show() {
    const id = decodeURIComponent((location.hash || '#application').slice(1));
    const el = id && (document.getElementById('view-' + id) || document.getElementById(id));
    const view = el && (el.matches('main > section.view') ? el : el.closest('main > section.view'));
    const target = view ? view.id.replace(/^view-/, '') : 'application';
    views.forEach(v => v.classList.toggle('active', v.id === 'view-' + target));
    tabs.forEach(t => {
      const on = t.getAttribute('href') === '#' + target;
      t.classList.toggle('active', on);
      if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
    const tab = tabs.find(t => t.getAttribute('href') === '#' + target);
    // On narrow screens the tab strip scrolls sideways: keep the active tab in view
    const strip = document.querySelector('.topbar .tabs');
    if (tab && strip) strip.scrollLeft = tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2;
    document.title = target === 'application' || !tab ? 'Danilo x Bird&Be' : tab.textContent.trim() + ' · Danilo x Bird&Be';
    const go = () => (view && el !== view)
      ? el.scrollIntoView({ block: 'start', behavior: 'instant' })
      : window.scrollTo({ top: 0, behavior: 'instant' });
    go();
    requestAnimationFrame(go);
    return go;
  }
  window.addEventListener('hashchange', show);
  const settle = show();
  // Images above the target change the layout as they load; land on the target again once they have.
  window.addEventListener('load', () => { if (location.hash) settle(); });
  // Web fonts change tab widths; re-centre the active tab once they're in
  if (document.fonts) document.fonts.ready.then(() => {
    const strip = document.querySelector('.topbar .tabs'), t = strip && strip.querySelector('.tab.active');
    if (t) strip.scrollLeft = t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2;
  });

  // Ad size switch: 1:1 / 4:5 / 9:16
  const feed = document.querySelector('.feed');
  document.querySelectorAll('.ratio button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.ratio button').forEach(x => x.classList.toggle('on', x === b));
    if (feed) feed.dataset.r = b.dataset.r;
  }));
  // ?r=45 or ?r=916 opens the ads in that size (used by the screenshot QA script)
  const r = new URLSearchParams(location.search).get('r');
  const start = r && document.querySelector('.ratio button[data-r="' + r + '"]');
  if (start) start.click();

  // Review filter on the landing page
  document.querySelectorAll('.reviews-filter button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.reviews-filter button').forEach(x => x.classList.toggle('on', x === b));
    const f = b.dataset.f;
    document.querySelectorAll('.rev').forEach(r => { r.style.display = (f === 'all' || r.dataset.t.split(' ').includes(f)) ? '' : 'none'; });
  }));

  // Creator economics calculator
  const calc = document.getElementById('calc');
  if (calc) {
    const $ = id => calc.querySelector('#' + id);
    const money = n => '$' + Math.round(n).toLocaleString('en-US');
    function run() {
      const creators = +$('c-n').value, pay = +$('c-pay').value, perWeek = +$('c-wk').value,
        median = +$('c-med').value, breakPct = +$('c-brk').value / 100, viralPct = +$('c-vir').value / 100;
      const videos = creators * perWeek * 52 / 12;
      const normal = videos * (1 - breakPct - viralPct);
      const views = normal * median + videos * breakPct * median * 10 + videos * viralPct * 750000;
      const cost = creators * pay;
      const cpm = views ? cost / (views / 1000) : 0;
      $('o-cost').textContent = money(cost);
      $('o-vid').textContent = Math.round(videos).toLocaleString('en-US');
      $('o-views').textContent = (views / 1e6).toFixed(1) + 'M';
      $('o-cpm').textContent = '$' + cpm.toFixed(2);
      // Viral share needed for $1 per 1,000 views, everything else unchanged
      const perVideo = cost * 1000 / videos;
      const need = (perVideo - (1 - breakPct) * median - breakPct * median * 10) / (750000 - median);
      $('o-verdict').textContent = cpm <= 1
        ? '✓ At or under the $1 target at these inputs.'
        : '✕ Above the $1 target at these inputs. What has to be true to hit $1: about ' +
          (need * 100).toFixed(1) + '% of videos going viral, or a higher median. The day-90 gate exists for this: keep the accounts that clear it, replace the rest.';
    }
    calc.querySelectorAll('input').forEach(i => i.addEventListener('input', run));
    run();
  }
})();
