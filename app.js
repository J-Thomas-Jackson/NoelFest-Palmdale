'use strict';
(() => {
  // ---------- Constants & schema ----------
  const KEY = 'noelFest.v1';
  const EVENT_STATUS = ['Planned', 'Ongoing', 'Completed', 'Cancelled'];
  const COST_TYPES = ['Venue', 'Catering', 'Prizes', 'Decor', 'Marketing', 'Staff', 'Other'];
  const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
  // Editable by default. Add ?view to the link to share a read-only copy of the published data.
  // (This is a convenience switch, not access control; protect who can publish via your hosting.)
  const EDIT = !new URLSearchParams(location.search).has('view');
  // s=string, n=number>=0, z=nullable number, b=boolean
  const SCHEMA = {
    events: { name: 's', date: 's', venue: 's', status: 's', budget: 'n', description: 's' },
    categories: { eventId: 's', name: 's', description: 's', maxFinalists: 'n', prize1: 'n', prize2: 'n', prize3: 'n' },
    participants: { eventId: 's', categoryId: 's', name: 's', email: 's', phone: 's', score: 'z', finalist: 'b', finalScore: 'z' },
    costs: { eventId: 's', categoryId: 's', item: 's', type: 's', amount: 'n', paid: 'b', date: 's' },
    entries: { key: 's', name: 's' },
    owners: { key: 's', value: 's' }
  };

  // ---------- Utilities ----------
  const uid = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join('');
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2, minimumFractionDigits: 0 });
  const fmt = n => money.format(n || 0);
  const ord = n => ({ 1: '1st', 2: '2nd', 3: '3rd' }[n] || n + 'th');
  const fmtDate = s => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return s || '—';
    return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (k === 'value') e.value = v;
      else e.setAttribute(k, v === true ? '' : String(v));
    }
    const add = c => {
      if (c === null || c === undefined || c === false) return;
      if (Array.isArray(c)) c.forEach(add);
      else e.append(c instanceof Node ? c : document.createTextNode(String(c)));
    };
    kids.forEach(add);
    return e;
  }

  function clean(type, v) {
    if (type === 's') return typeof v === 'string' ? v.trim().slice(0, 500) : '';
    if (type === 'b') return v === true;
    if (v === null || v === undefined || v === '' || !Number.isFinite(+v)) return type === 'z' ? null : 0;
    return Math.min(Math.max(+v, 0), 1e9);
  }

  function sanitize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const out = {};
    for (const [coll, fields] of Object.entries(SCHEMA)) {
      const src = Array.isArray(raw[coll]) ? raw[coll].slice(0, 5000) : [];
      out[coll] = [];
      const seen = new Set();
      for (const item of src) {
        if (!item || typeof item !== 'object') continue;
        if (typeof item.id !== 'string' || !/^[\w-]{1,64}$/.test(item.id) || seen.has(item.id)) continue;
        seen.add(item.id);
        const o = { id: item.id };
        for (const [f, t] of Object.entries(fields)) o[f] = clean(t, item[f]);
        out[coll].push(o);
      }
    }
    // Owners are per event: collapse older per-category keys (date|event|category) to date|event.
    const ownerSeen = new Set();
    out.owners = out.owners.map(o => ({ ...o, key: o.key.split('|').slice(0, 2).join('|') }))
      .filter(o => o.value && !ownerSeen.has(o.key) && ownerSeen.add(o.key));
    // referential integrity
    const ev = new Set(out.events.map(x => x.id));
    out.categories = out.categories.filter(c => ev.has(c.eventId));
    const cat = new Map(out.categories.map(c => [c.id, c]));
    out.participants = out.participants.filter(p => ev.has(p.eventId) && cat.get(p.categoryId)?.eventId === p.eventId);
    out.costs = out.costs.filter(c => ev.has(c.eventId));
    out.costs.forEach(c => { if (c.categoryId && cat.get(c.categoryId)?.eventId !== c.eventId) c.categoryId = ''; });
    out.events.forEach(e => { if (!EVENT_STATUS.includes(e.status)) e.status = 'Planned'; });
    out.costs.forEach(c => { if (!COST_TYPES.includes(c.type)) c.type = 'Other'; });
    return out;
  }

  function seed() {
    const ev = uid();
    const cats = [
      ['Carol Singing', 3, 500, 300, 150],
      ['Christmas Cake Baking', 3, 300, 200, 100],
      ['Best Decorated Tree', 3, 250, 150, 75],
      ['Kids Fancy Dress', 3, 200, 100, 50]
    ].map(([name, m, a, b, c]) => ({ id: uid(), eventId: ev, name, description: '', maxFinalists: m, prize1: a, prize2: b, prize3: c }));
    const P = (ci, name, score, finalist, finalScore) => ({
      id: uid(), eventId: ev, categoryId: cats[ci].id, name,
      email: name.toLowerCase().replace(/\W+/g, '.') + '@example.com', phone: '', score, finalist, finalScore
    });
    const participants = [
      P(0, 'Maria Dsouza', 88, true, 92), P(0, 'John Pereira', 84, true, 89), P(0, 'Anita Rao', 79, true, 89), P(0, 'Tom Fernandes', 70, false, null),
      P(1, 'Lena Gomes', 91, true, null), P(1, 'Ravi Menon', 85, true, null), P(1, 'Sara Thomas', 66, false, null),
      P(2, 'The Millers', 90, false, null), P(3, 'Eva Lobo', 95, false, null)
    ];
    const C = (item, type, amount, paid, ci) => ({ id: uid(), eventId: ev, categoryId: ci === undefined ? '' : cats[ci].id, item, type, amount, paid, date: '' });
    return {
      events: [{ id: ev, name: 'Noel Fest 2026', date: '2026-12-19', venue: 'Palmdale Community Hall', status: 'Planned', budget: 8000, description: 'Annual Palmdale Christmas festival.' }],
      categories: cats,
      participants,
      entries: [],
      owners: [],
      costs: [C('Hall booking', 'Venue', 1500, true), C('Catering', 'Catering', 2200, false), C('Decorations', 'Decor', 600, true), C('Posters & flyers', 'Marketing', 350, true), C('Sound system hire', 'Other', 700, false)]
    };
  }

  // ---------- State ----------
  let S;
  function load() {
    // Editors continue from their saved draft; viewers always see the published data.
    if (EDIT) {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw !== null) { const d = sanitize(JSON.parse(raw)); if (d) return d; }
      } catch (e) { console.error('Load failed'); }
    }
    return sanitize(window.NF_PUBLISHED) || seed();
  }
  // Edits mark the data as unsaved; the Save button (commit) writes it to browser storage.
  let dirty = false;
  function showSaveState() {
    const b = document.querySelector('[data-action="save"]');
    const s = document.querySelector('#saveState');
    if (!b || !s) return;
    b.disabled = !dirty;
    s.textContent = dirty ? 'Unsaved changes' : 'All changes saved';
    s.classList.toggle('dirty', dirty);
  }
  function changed() { dirty = true; showSaveState(); }
  function commit() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast('Could not save: browser storage unavailable'); return false; }
    dirty = false; showSaveState();
    return true;
  }
  S = load();
  if (EDIT) commit();

  // ---------- UI primitives ----------
  const $ = s => document.querySelector(s);
  const view = $('#view');
  const dlg = $('#dlg');
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  const btn = (label, cls, onclick, extra) => h('button', { type: 'button', class: 'btn ' + (cls || ''), onclick, ...extra }, label);
  const badge = (text, cls) => h('span', { class: 'badge ' + (cls || '') }, text);

  function closeDialog() { if (dlg.open) dlg.close(); }
  function showDialog(title, body) {
    closeDialog();
    dlg.replaceChildren(
      h('div', { class: 'dlg-head' }, h('h2', {}, title), h('button', { type: 'button', 'aria-label': 'Close', onclick: closeDialog }, '\u00d7')),
      h('div', { class: 'dlg-body' }, body));
    dlg.showModal();
  }

  // ---------- Views ----------
  const views = {};

  // ---------- Schedule table (home page) ----------
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const SCH = (window.NF_SCHEDULE || []).map(r => {
    const day = new Date(+r.date.slice(0, 4), +r.date.slice(5, 7) - 1, +r.date.slice(8, 10)).toLocaleDateString('en-US', { weekday: 'long' });
    const text = [fmtDate(r.date), day, r.event, ...r.categories, ...r.entries, r.venue, r.host, r.coordinator, r.phone, r.competition ? '' : 'not scored'].join(' ').toLowerCase();
    return { ...r, day, text };
  }).filter(r => new Date(+r.date.slice(0, 4), +r.date.slice(5, 7) - 1, +r.date.slice(8, 10)) >= today);
  const schState = { q: '', event: '', category: '', owner: '' };

  function scheduleSection() {
    const uniq = (fn, sort) => { const v = [...new Set(SCH.map(fn))]; return sort ? v.sort((a, b) => a.localeCompare(b)) : v; };
    const ownerValues = [...new Set(S.owners.map(o => o.value).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const filters = [
      ['event', 'All events', uniq(r => r.event).map(v => [v, v])],
      ['category', 'All categories', [...new Set(SCH.flatMap(r => r.categories))].sort((a, b) => a.localeCompare(b)).map(v => [v, v])],
      ['owner', 'All owners', ownerValues.map(v => [v, v])]
    ];
    const body = h('tbody');
    const mobileCards = h('div', { class: 'sched-cards' });
    const count = h('span', { class: 'small muted', role: 'status' });
    const lines = arr => h('div', { class: 'lines' }, arr.map(x => h('div', {}, x)));
    const keyOf = (r, cat) => `${r.date}|${r.event}|${cat}`;

    // Participant cell for one event + category: list of names plus an add form.
    const partCell = key => {
      if (!EDIT) {
        const names = S.entries.filter(e => e.key === key);
        return h('td', { class: 'parts' }, names.length ? h('ul', { class: 'plist' }, names.map(e => h('li', {}, h('strong', {}, e.name)))) : h('span', { class: 'muted' }, '—'));
      }
      const list = h('ul', { class: 'plist' });
      const paint = () => list.replaceChildren(...S.entries.filter(e => e.key === key).map(e =>
        h('li', {},
          h('strong', {}, e.name),
          h('button', { type: 'button', class: 'x', 'aria-label': `Remove ${e.name}`, title: 'Remove',
            onclick: () => { S.entries = S.entries.filter(x => x.id !== e.id); changed(); paint(); } }, '\u00d7'))));
      const name = h('input', { type: 'text', class: 'nm', placeholder: 'Participant name', maxlength: 60, 'aria-label': 'Participant name' });
      const form = h('form', { class: 'padd', novalidate: true, onsubmit: ev => {
        ev.preventDefault();
        const n = name.value.trim();
        if (!n) { toast('Enter participant name'); name.focus(); return; }
        S.entries.push({ id: uid(), key, name: n });
        changed(); paint(); name.value = ''; name.focus();
      } }, name, h('button', { type: 'submit', class: 'btn sm' }, 'Add'));
      paint();
      return h('td', { class: 'parts' }, list, form);
    };

    // Owner cell: one blank, editable text box per event (empty value = nothing stored).
    const ownerCell = (key, span) => {
      if (!EDIT) {
        const v = S.owners.find(o => o.key === key)?.value;
        return h('td', { class: 'owner', rowspan: span }, v ? h('strong', {}, v) : h('span', { class: 'muted' }, '—'));
      }
      const inp = h('input', { type: 'text', class: 'own', placeholder: 'Owner', maxlength: 60, 'aria-label': 'Owner' });
      inp.value = S.owners.find(o => o.key === key)?.value || '';
      inp.addEventListener('input', () => {
        const v = inp.value.trim();
        const cur = S.owners.find(o => o.key === key);
        if (!v) S.owners = S.owners.filter(o => o.key !== key);
        else if (cur) cur.value = v;
        else S.owners.push({ id: uid(), key, value: v });
        changed();
      });
      return h('td', { class: 'owner', rowspan: span }, inp);
    };
    let currentRows = [];
    const draw = () => {
      const q = schState.q.trim().toLowerCase();
      const partText = r => S.entries.filter(e => e.key.startsWith(`${r.date}|${r.event}|`)).map(e => e.name).concat(S.owners.filter(o => o.key === `${r.date}|${r.event}`).map(o => o.value)).join(' ').toLowerCase();
      currentRows = SCH.filter(r =>
        (!q || r.text.includes(q) || partText(r).includes(q)) &&
        (!schState.event || r.event === schState.event) &&
        (!schState.category || r.categories.includes(schState.category)) &&
        (!schState.owner || S.owners.find(o => o.key === `${r.date}|${r.event}`)?.value === schState.owner));
      const rows = currentRows;
      count.textContent = `Showing ${rows.length} of ${SCH.length} events`;

      // Desktop table
      body.replaceChildren(...(rows.length ? rows.flatMap(r => {
        const cats = schState.category ? [schState.category] : r.categories;
        const span = cats.length;
        return cats.map((cat, i) => h('tr', { class: i === 0 ? 'ev-first' : '' },
          i === 0 && h('td', { rowspan: span }, h('strong', {}, fmtDate(r.date)), h('div', { class: 'small muted' }, r.day)),
          i === 0 && h('td', { rowspan: span }, h('strong', {}, r.event), !r.competition && h('div', {}, badge('Not scored', 'warn'))),
          i === 0 && ownerCell(`${r.date}|${r.event}`, span),
          h('td', {}, cat),
          partCell(keyOf(r, cat)),
          i === 0 && h('td', { rowspan: span }, lines(r.entries)),
          i === 0 && h('td', { rowspan: span }, r.venue),
          i === 0 && h('td', { rowspan: span }, r.host),
          i === 0 && h('td', { rowspan: span }, r.coordinator, h('div', { class: 'small' }, h('a', { href: 'tel:' + r.phone.replace(/\D/g, '') }, r.phone)))));
      }) : [h('tr', {}, h('td', { colspan: 9, class: 'muted' }, 'No events match your search or filters.'))]));

      // Mobile cards
      mobileCards.replaceChildren(...(rows.length ? rows.map(r => {
        const owner = S.owners.find(o => o.key === `${r.date}|${r.event}`)?.value;
        const cats = schState.category ? [schState.category] : r.categories;
        const participants = S.entries.filter(e => e.key.startsWith(`${r.date}|${r.event}|`));
        return h('div', { class: 'sched-card' },
          h('div', { class: 'sched-card-head' },
            h('div', {},
              h('div', { class: 'sched-card-title' }, r.event, !r.competition && ' ', !r.competition && badge('Not scored', 'warn')),
              h('div', { class: 'sched-card-date' }, fmtDate(r.date), ' · ', r.day)),
            owner && h('div', { class: 'sched-card-owner' }, owner)),
          h('div', { class: 'sched-card-meta' },
            r.venue && h('span', {}, '📍 ', r.venue),
            r.coordinator && h('span', {}, '📞 ', h('a', { href: 'tel:' + r.phone.replace(/\D/g, '') }, r.coordinator))),
          ...cats.map(cat => {
            const names = participants.filter(e => e.key === keyOf(r, cat));
            return h('div', { class: 'sched-cat' },
              h('div', { class: 'sched-cat-name' }, cat),
              names.length ? h('ul', { class: 'plist' }, names.map(e => h('li', {}, h('strong', {}, e.name)))) : h('span', { class: 'muted small' }, 'No participants yet'));
          }));
      }) : [h('div', { class: 'empty' }, 'No events match your search or filters.')]));
    };

    // Export to Excel (CSV)
    function exportCsv(rows) {
      const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const headers = ['Date', 'Day', 'Event', 'Owner', 'Category', 'Participants', 'Entries per Association', 'Venue', 'Host', 'Co-ordinator', 'Phone'];
      const csvRows = [headers.map(escape).join(',')];
      rows.forEach(r => {
        const owner = S.owners.find(o => o.key === `${r.date}|${r.event}`)?.value || '';
        const cats = schState.category ? [schState.category] : r.categories;
        cats.forEach(cat => {
          const names = S.entries.filter(e => e.key === keyOf(r, cat)).map(e => e.name).join('; ');
          csvRows.push([r.date, r.day, r.event, owner, cat, names, r.entries.join('; '), r.venue, r.host, r.coordinator, r.phone].map(escape).join(','));
        });
      });
      const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = h('a', { href: url, download: 'noel-fest-schedule.csv' });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Schedule exported as CSV (open with Excel)');
    }

    const search = h('input', { type: 'search', placeholder: 'Search event, category, participant, owner, venue…', 'aria-label': 'Search schedule', maxlength: 100,
      oninput: e => { schState.q = e.target.value; draw(); } });
    search.value = schState.q;
    const selects = filters.map(([key, label, values]) => {
      const sel = h('select', { 'aria-label': label, onchange: e => { schState[key] = e.target.value; draw(); } },
        h('option', { value: '' }, label), ...values.map(([v, l]) => h('option', { value: v }, l)));
      sel.value = schState[key];
      if (sel.value !== schState[key]) schState[key] = '';
      return sel;
    });
    const resetBtn = btn('Reset', 'ghost sm', () => {
      Object.keys(schState).forEach(k => { schState[k] = ''; });
      search.value = ''; selects.forEach(s => { s.value = ''; }); draw();
    });
    draw();
    return h('div', { class: 'table-card sched' },
      h('div', { class: 'card-head' }, h('h2', {}, 'Schedule of Events - Noel Fest 2026'), count),
      h('div', { class: 'toolbar' },
        search, ...selects, resetBtn,
        h('div', { class: 'toolbar-actions' },
          btn('⬇ Excel', 'ghost sm', () => exportCsv(currentRows)),
          btn('🖨 Print', 'ghost sm', () => window.print()))),
      h('div', { class: 'table-wrap' }, h('table', {},
        h('thead', {}, h('tr', {}, ['Event date', 'Event name', 'Owner', 'Category', 'Participant name', 'Participants from each association', 'Venue', 'Hosting association', 'Co-ordinator'].map(t => h('th', {}, t)))),
        body)),
      mobileCards,
      h('p', { class: 'small muted' }, '**Freestyle Group Dance is not a competition item and will not be awarded any points.'));
  }

  views.dashboard = () => [scheduleSection()];


  // ---------- Render ----------
  function render() {
    document.title = 'Dashboard · Noel Palmdale — Noel Fest';
    view.replaceChildren(...views.dashboard().flat());
  }

  // ---------- Backup / restore ----------
  function exportData() {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: `noel-fest-backup-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importData(file) {
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) { toast('File too large'); return; }
    try {
      const data = sanitize(JSON.parse(await file.text()));
      if (!data) throw new Error('bad');
      showDialog('Restore backup', [
        h('p', {}, `This replaces all current data with ${data.events.length} event(s), ${data.categories.length} categories, ${data.participants.length} participants and ${data.costs.length} cost items.`),
        h('div', { class: 'form-actions' }, btn('Cancel', 'ghost', closeDialog),
          btn('Replace data', 'red', () => { S = data; commit(); closeDialog(); render(); toast('Backup restored'); }))
      ]);
    } catch (e) { toast('Invalid backup file'); }
  }

  // Publish: download published.js (owners + participants only). Upload it to the host to update what everyone sees.
  function publishData() {
    if (dirty && !commit()) return;
    const shared = { entries: S.entries.map(({ id, key, name }) => ({ id, key, name })), owners: S.owners.map(({ id, key, value }) => ({ id, key, value })) };
    const js = '// Published data for the Noel Fest dashboard. Generated by Publish.\nwindow.NF_PUBLISHED = ' + JSON.stringify(shared, null, 2) + ';\n';
    const url = URL.createObjectURL(new Blob([js], { type: 'text/javascript' }));
    const a = h('a', { href: url, download: 'published.js' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('published.js downloaded. Upload it to replace the shared copy.');
  }

  // ---------- Init ----------
  if (!EDIT) {
    document.querySelectorAll('.edit-only').forEach(el => el.remove());
    document.body.classList.add('view-only');
  } else {
    document.querySelector('#modeBadge')?.remove();
    document.querySelector('[data-action="save"]').addEventListener('click', () => { if (commit()) toast('Changes saved'); });
    document.querySelector('[data-action="publish"]').addEventListener('click', publishData);
    document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (dirty && commit()) toast('Changes saved'); } });
    window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
    showSaveState();
    document.querySelector('[data-action="export"]').addEventListener('click', exportData);
    document.querySelector('[data-action="import"]').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', e => { importData(e.target.files[0]); e.target.value = ''; });
  }
  render();
})();
