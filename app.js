/* ============================================================
   Iceland Ring Road — app.js
   Vanilla JS, no framework. Inline SVG icons.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- SVG icons (Material Symbols, outline style) ---------- */
  const ICONS = {
    // Person walking with a stick
    walk: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="13" cy="4.5" r="1.6"/><path d="M9.5 22l2-6 2.5 2 1 4"/><path d="M6 13l3.5-3.5L13 11l3 3 3-1"/><path d="M11.5 16L9 13l-3 3"/></svg>',
    // Car (side view)
    drive: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 14l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 9l2 5"/><path d="M3 14h18v4a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1H6.5v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><circle cx="7" cy="16.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="17" cy="16.5" r="1.2" fill="currentColor" stroke="none"/></svg>',
    // Cottage / tent house
    camp: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>',
    // Sun on the horizon (midnight sun)
    midnight: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="3.5"/><path d="M12 6.5V5"/><path d="M6.2 8.2 5.2 7.2"/><path d="M17.8 8.2 18.8 7.2"/><path d="M3 13h2"/><path d="M19 13h2"/><path d="M2 18h20"/></svg>',
    // Warning triangle
    warning: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.5 20h19z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".7" fill="currentColor" stroke="none"/></svg>',
    // Open in new
    openIn: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
    // Pin (location)
    pin: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    // Footprints (km a piedi)
    boot: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4c-1.5 0-2 1.5-2 3v6H4v3a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3v-2l5-2v-2l-5-1V8c0-2.5-2-4-4-4z"/><circle cx="8" cy="7" r=".6" fill="currentColor" stroke="none"/><circle cx="10.5" cy="7.5" r=".6" fill="currentColor" stroke="none"/></svg>',
    // Steering wheel / route
    route: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h8a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8h11"/></svg>',
    // Tent (campsites)
    tent: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 3 20h18z"/><path d="M12 4v16"/><path d="M10 20l2-4 2 4"/></svg>'
  };

  function iconFor(type) {
    switch (type) {
      case 'walk': return ICONS.walk;
      case 'drive': return ICONS.drive;
      case 'camp': return ICONS.camp;
      case 'midnight': return ICONS.midnight;
      default: return ICONS.pin;
    }
  }

  /* ---------- Helpers ---------- */

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.startsWith('on') && typeof attrs[k] === 'function') node.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] !== false && attrs[k] != null) node.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c == null) return;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  function mapsUrl(query) {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
  }

  /* ---------- Render ---------- */

  function renderHeader(meta) {
    document.getElementById('siteTitle').textContent = meta.title;
    const sub = document.getElementById('siteSubtitle');
    sub.textContent = meta.dates + ' · ' + meta.subtitle;
    document.getElementById('fullMapLink').href = meta.mapUrl;
    document.getElementById('fullMapLink').innerHTML =
      ICONS.openIn + '<span>Apri mappa completa in Google Maps</span>';
  }

  function renderSummary(meta) {
    const root = document.getElementById('tripSummary');
    root.innerHTML = '';
    const tiles = [
      { value: '9', label: 'Giorni' },
      { value: meta.totalKmWalk + ' km', label: 'A piedi' },
      { value: meta.totalKmDrive.toLocaleString('it-IT') + ' km', label: 'In furgone' }
    ];
    tiles.forEach(t => {
      root.appendChild(
        el('div', { class: 'summary-tile' }, [
          el('div', { class: 'summary-tile-value' }, t.value),
          el('div', { class: 'summary-tile-label' }, t.label)
        ])
      );
    });
  }

  function renderDayNav(days) {
    const nav = document.getElementById('dayNav');
    nav.innerHTML = '';
    days.forEach(d => {
      const btn = el('button', {
        class: 'day-chip',
        type: 'button',
        'data-day': d.id,
        'aria-label': 'Giorno ' + d.id + ' — ' + d.title,
        onclick: () => {
          const target = document.getElementById('day-' + d.id);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, [
        el('span', { class: 'day-chip-dot' }),
        document.createTextNode('G' + d.id)
      ]);
      nav.appendChild(btn);
    });
  }

  function renderStop(stop) {
    const li = el('li', {
      class: 'stop stop--' + stop.type +
        (stop.warning ? ' stop--warning' : '') +
        (stop.highlight ? ' stop--highlight' : '')
    });

    const iconHtml = stop.warning ? ICONS.warning : iconFor(stop.type);
    const iconBox = el('span', { class: 'stop-icon', 'aria-hidden': 'true', html: iconHtml });
    li.appendChild(iconBox);

    const body = el('div', { class: 'stop-body' });

    if (stop.time) {
      body.appendChild(el('div', { class: 'stop-time' }, stop.time));
    }

    body.appendChild(el('h3', { class: 'stop-title' }, stop.title));

    if (stop.detail) {
      body.appendChild(el('p', { class: 'stop-detail' }, stop.detail));
    }

    const meta = el('div', { class: 'stop-meta' });
    let metaHasItems = false;

    if (stop.distance) {
      const chip = el('span', { class: 'meta-chip', html: ICONS.boot });
      chip.appendChild(document.createTextNode(' ' + stop.distance));
      meta.appendChild(chip);
      metaHasItems = true;
    }
    if (stop.duration) {
      const chip = el('span', { class: 'meta-chip' }, '⏱ ' + stop.duration);
      meta.appendChild(chip);
      metaHasItems = true;
    }
    if (stop.mapsQuery) {
      const link = el('a', {
        class: 'maps-link',
        href: mapsUrl(stop.mapsQuery),
        target: '_blank',
        rel: 'noopener',
        'aria-label': 'Apri in Google Maps: ' + stop.title,
        html: ICONS.pin
      });
      link.appendChild(document.createTextNode(' Maps'));
      meta.appendChild(link);
      metaHasItems = true;
    }
    if (metaHasItems) body.appendChild(meta);

    li.appendChild(body);
    return li;
  }

  function renderDay(day) {
    const card = el('article', {
      class: 'day-card',
      id: 'day-' + day.id,
      'data-day': day.id
    });

    const head = el('header', { class: 'day-head' });

    const top = el('div', { class: 'day-head-top' }, [
      el('span', { class: 'day-number' }, 'Giorno ' + day.id),
      el('span', { class: 'day-date' }, day.date)
    ]);
    head.appendChild(top);
    head.appendChild(el('h2', { class: 'day-title' }, day.title));

    if (day.summary && (day.summary.walk || day.summary.drive)) {
      const summary = el('div', { class: 'day-summary' });
      if (day.summary.walk) {
        const item = el('span', { class: 'day-summary-item', html: ICONS.boot });
        item.appendChild(document.createTextNode(' ' + day.summary.walk));
        summary.appendChild(item);
      }
      if (day.summary.drive) {
        const item = el('span', { class: 'day-summary-item', html: ICONS.drive });
        item.appendChild(document.createTextNode(' ' + day.summary.drive));
        summary.appendChild(item);
      }
      head.appendChild(summary);
    }

    card.appendChild(head);

    const ul = el('ul', { class: 'stops' });
    day.stops.forEach(s => ul.appendChild(renderStop(s)));
    card.appendChild(ul);

    return card;
  }

  function renderDays(days) {
    const root = document.getElementById('days');
    root.innerHTML = '';
    days.forEach(d => root.appendChild(renderDay(d)));
  }

  function renderCampsites(campsites) {
    const root = document.getElementById('campsitesSection');
    root.innerHTML = '';
    root.appendChild(el('h2', { class: 'campsites-title' }, 'Campeggi'));
    const ul = el('ul', { class: 'campsite-list' });
    campsites.forEach(c => {
      const li = el('li', { class: 'campsite-item' + (c.warning ? ' campsite-item--warning' : '') });
      li.appendChild(el('div', { class: 'campsite-night' }, 'N' + c.night));
      const right = el('div', {}, [
        el('p', { class: 'campsite-name' }, c.name),
        el('p', { class: 'campsite-meta' }, c.price + ' · ' + c.booking)
      ]);
      li.appendChild(right);
      ul.appendChild(li);
    });
    root.appendChild(ul);
  }

  /* ---------- Day-chip activation on scroll ---------- */

  function setupDayObserver(days) {
    const chips = Array.from(document.querySelectorAll('.day-chip'));
    const activate = (id) => {
      chips.forEach(c => {
        const isActive = String(c.dataset.day) === String(id);
        if (isActive) {
          c.setAttribute('aria-current', 'true');
          // scroll the active chip into view inside the nav
          c.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          c.removeAttribute('aria-current');
        }
      });
    };

    const sections = days.map(d => document.getElementById('day-' + d.id)).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      // pick the entry closest to the top that is intersecting
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) {
        activate(visible[0].target.dataset.day);
      }
    }, {
      rootMargin: '-140px 0px -55% 0px',
      threshold: 0
    });

    sections.forEach(s => observer.observe(s));

    // initial state
    if (sections.length) activate(sections[0].dataset.day);
  }

  /* ---------- Offline UI ---------- */

  function setupOfflineToast() {
    const toast = document.getElementById('offlineToast');
    function update() {
      if (navigator.onLine) {
        toast.hidden = true;
      } else {
        toast.hidden = false;
      }
    }
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }

  /* ---------- Service worker ---------- */

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(err => {
          console.warn('SW registration failed:', err);
        });
      });
    }
  }

  /* ---------- Boot ---------- */

  function showError(message) {
    const main = document.getElementById('main');
    main.innerHTML = '';
    main.appendChild(el('div', { class: 'day-card' }, [
      el('h2', { class: 'day-title' }, 'Errore'),
      el('p', { class: 'stop-detail' }, message)
    ]));
  }

  async function init() {
    try {
      const res = await fetch('itinerary.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      renderHeader(data.meta);
      renderSummary(data.meta);
      renderDayNav(data.days);
      renderDays(data.days);
      renderCampsites(data.campsites);
      setupDayObserver(data.days);
      setupOfflineToast();
    } catch (err) {
      console.error(err);
      showError('Impossibile caricare i dati dell\'itinerario.');
    }
  }

  registerServiceWorker();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
