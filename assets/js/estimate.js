/* =============================================
   WEDDING ESTIMATE BUILDER
   Prices live in estimate-pricing.js, not here.
   ============================================= */
(function () {
    'use strict';

    const CONFIG = window.ESTIMATE_PRICING;
    if (!CONFIG) return;

    const EMAIL = 'petalandpearlflowerskc@gmail.com';
    const STORAGE_KEY = 'pp-wedding-estimate-v1';
    const DEFAULT_MAX = 99;

    // ---------- Item lookup ----------
    const ITEMS = {};
    const ORDER = [];
    CONFIG.categories.forEach(cat => {
        cat.items.forEach(item => {
            ITEMS[item.id] = item;
            ORDER.push(item.id);
        });
    });
    const maxFor = id => (ITEMS[id] && ITEMS[id].max) || DEFAULT_MAX;
    const clampQty = (id, n) => {
        n = parseInt(n, 10);
        if (!Number.isFinite(n) || n < 0) return 0;
        return Math.min(n, maxFor(id));
    };

    // ---------- State ----------
    const state = {
        qty: {},
        details: { name: '', date: '', venue: '', notes: '' },
        helper: { guests: '', bridesmaids: '', groomsmen: '', family: '' }
    };
    ORDER.forEach(id => { state.qty[id] = 0; });

    // ---------- Helpers ----------
    const $ = sel => document.querySelector(sel);
    const money = n => '$' + Math.round(n).toLocaleString('en-US');

    function totals(qtyMap) {
        let low = 0, high = 0, count = 0;
        ORDER.forEach(id => {
            const q = qtyMap[id] || 0;
            if (!q) return;
            low += q * ITEMS[id].low;
            high += q * ITEMS[id].high;
            count += q;
        });
        return { low, high, count };
    }

    function save() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
    }

    let loadedFromLink = false;
    function load() {
        // A shared link (#e=...) wins over anything saved on this device.
        const fromHash = parseHash();
        if (fromHash) {
            Object.assign(state.qty, fromHash.qty);
            Object.assign(state.details, fromHash.details);
            loadedFromLink = true;
            // Drop the hash so later edits (saved on this device) aren't overwritten on reload.
            history.replaceState(null, '', location.pathname + location.search);
            return;
        }
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (!saved) return;
            if (saved.qty) ORDER.forEach(id => { state.qty[id] = clampQty(id, saved.qty[id]); });
            if (saved.details) Object.keys(state.details).forEach(k => { if (typeof saved.details[k] === 'string') state.details[k] = saved.details[k]; });
            if (saved.helper) Object.keys(state.helper).forEach(k => { if (saved.helper[k] != null) state.helper[k] = String(saved.helper[k]); });
        } catch (e) { /* ignore bad data */ }
    }

    // ---------- Share links ----------
    function shareUrl() {
        const parts = ORDER.filter(id => state.qty[id] > 0).map(id => id + ':' + state.qty[id]);
        const params = new URLSearchParams();
        params.set('e', parts.join(','));
        if (state.details.date) params.set('d', state.details.date);
        const base = location.href.split('#')[0];
        return base + '#' + params.toString();
    }

    function parseHash() {
        if (!location.hash || location.hash.length < 3) return null;
        const params = new URLSearchParams(location.hash.slice(1));
        const e = params.get('e');
        if (e === null) return null;
        const qty = {};
        ORDER.forEach(id => { qty[id] = 0; });
        e.split(',').forEach(pair => {
            const [id, n] = pair.split(':');
            if (ITEMS[id]) qty[id] = clampQty(id, n);
        });
        const details = {};
        const d = params.get('d');
        if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) details.date = d;
        return { qty, details };
    }

    // ---------- Toast ----------
    let toastTimer;
    function toast(msg) {
        const el = $('#est-toast');
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
    }

    // ---------- Animated numbers ----------
    const animState = new WeakMap();
    function animateNumber(el, to) {
        const prev = animState.get(el);
        const from = prev ? prev.current : 0;
        if (prev && prev.raf) cancelAnimationFrame(prev.raf);
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce || from === to) {
            el.textContent = money(to);
            animState.set(el, { current: to });
            return;
        }
        const start = performance.now();
        const dur = 450;
        const s = { current: from };
        animState.set(el, s);
        const step = now => {
            const t = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - t, 3);
            s.current = from + (to - from) * eased;
            el.textContent = money(s.current);
            if (t < 1) s.raf = requestAnimationFrame(step);
            else { s.current = to; s.raf = null; }
        };
        s.raf = requestAnimationFrame(step);
    }

    // ---------- Render: packages ----------
    function renderPackages() {
        const grid = $('#package-grid');
        grid.innerHTML = '';
        CONFIG.packages.forEach(pkg => {
            const qty = {};
            Object.keys(pkg.items).forEach(id => { if (ITEMS[id]) qty[id] = clampQty(id, pkg.items[id]); });
            const t = totals(qty);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'package-card';
            btn.dataset.pkg = pkg.id;
            btn.innerHTML =
                '<span class="package-name"></span>' +
                '<span class="package-tagline"></span>' +
                '<span class="package-range">' + money(t.low) + ' &ndash; ' + money(t.high) + '</span>' +
                '<span class="package-count">' + t.count + ' pieces</span>';
            btn.querySelector('.package-name').textContent = pkg.name;
            btn.querySelector('.package-tagline').textContent = pkg.tagline;
            btn.addEventListener('click', () => applyPackage(pkg, qty));
            grid.appendChild(btn);
        });
    }

    function applyPackage(pkg, qty) {
        ORDER.forEach(id => { state.qty[id] = qty[id] || 0; });
        update();
        toast(pkg.name + ' loaded. Adjust anything you like below.');
        const list = $('#category-list');
        if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function markActivePackage() {
        document.querySelectorAll('.package-card').forEach(card => {
            const pkg = CONFIG.packages.find(p => p.id === card.dataset.pkg);
            const matches = pkg && ORDER.every(id => (state.qty[id] || 0) === clampQty(id, pkg.items[id] || 0));
            card.classList.toggle('active', !!matches);
            card.setAttribute('aria-pressed', matches ? 'true' : 'false');
        });
    }

    // ---------- Render: items ----------
    function renderItems() {
        const list = $('#category-list');
        list.innerHTML = '';
        CONFIG.categories.forEach(cat => {
            const section = document.createElement('div');
            section.className = 'est-category';
            section.innerHTML =
                '<div class="est-category-head">' +
                    '<i class="fa-solid ' + (cat.icon || 'fa-seedling') + '"></i>' +
                    '<div><h3></h3><p></p></div>' +
                    '<span class="est-category-sub" data-cat-sub="' + cat.id + '"></span>' +
                '</div>';
            section.querySelector('h3').textContent = cat.title;
            section.querySelector('p').textContent = cat.blurb || '';

            cat.items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'est-item';
                row.dataset.id = item.id;
                row.innerHTML =
                    '<div class="est-item-info">' +
                        '<h4></h4>' +
                        '<p class="est-item-desc"></p>' +
                        '<span class="est-item-price">' + money(item.low) + ' &ndash; ' + money(item.high) + ' each</span>' +
                    '</div>' +
                    '<div class="est-item-controls">' +
                        '<div class="stepper">' +
                            '<button type="button" class="step-btn" data-step="-1" aria-label="Remove one"><i class="fa-solid fa-minus"></i></button>' +
                            '<input type="number" class="step-input" min="0" max="' + maxFor(item.id) + '" inputmode="numeric">' +
                            '<button type="button" class="step-btn" data-step="1" aria-label="Add one"><i class="fa-solid fa-plus"></i></button>' +
                        '</div>' +
                        '<span class="est-item-sub"></span>' +
                    '</div>';
                row.querySelector('h4').textContent = item.name;
                row.querySelector('.est-item-desc').textContent = item.desc || '';
                const input = row.querySelector('.step-input');
                input.setAttribute('aria-label', item.name + ' quantity');

                row.querySelectorAll('.step-btn').forEach(b => {
                    b.addEventListener('click', () => {
                        state.qty[item.id] = clampQty(item.id, state.qty[item.id] + parseInt(b.dataset.step, 10));
                        update();
                        bump(row);
                    });
                });
                input.addEventListener('input', () => {
                    if (input.value === '') return; // let them clear and retype
                    state.qty[item.id] = clampQty(item.id, input.value);
                    update({ skipInput: input });
                });
                input.addEventListener('blur', () => {
                    state.qty[item.id] = clampQty(item.id, input.value);
                    update();
                });
                input.addEventListener('focus', () => input.select());

                section.appendChild(row);
            });
            list.appendChild(section);
        });
    }

    function bump(row) {
        row.classList.remove('bump');
        void row.offsetWidth; // restart animation
        row.classList.add('bump');
    }

    // ---------- Update everything ----------
    function update(opts) {
        opts = opts || {};
        const t = totals(state.qty);

        // Item rows
        document.querySelectorAll('.est-item').forEach(row => {
            const id = row.dataset.id;
            const q = state.qty[id];
            const item = ITEMS[id];
            const input = row.querySelector('.step-input');
            if (input !== opts.skipInput) input.value = q;
            row.classList.toggle('selected', q > 0);
            row.querySelector('[data-step="-1"]').disabled = q <= 0;
            row.querySelector('[data-step="1"]').disabled = q >= maxFor(id);
            row.querySelector('.est-item-sub').textContent = q > 0 ? money(q * item.low) + ' – ' + money(q * item.high) : '';
        });

        // Category subtotals
        CONFIG.categories.forEach(cat => {
            const el = document.querySelector('[data-cat-sub="' + cat.id + '"]');
            if (!el) return;
            let lo = 0, hi = 0;
            cat.items.forEach(i => { lo += state.qty[i.id] * i.low; hi += state.qty[i.id] * i.high; });
            el.textContent = hi > 0 ? money(lo) + ' – ' + money(hi) : '';
        });

        // Totals
        animateNumber($('#total-low'), t.low);
        animateNumber($('#total-high'), t.high);
        $('#mobile-total').textContent = money(t.low) + ' – ' + money(t.high);
        $('#summary-count').textContent = t.count === 0
            ? 'Add a few flowers to see your range.'
            : t.count + (t.count === 1 ? ' piece' : ' pieces') + ' in your wish list';
        $('#range-fill').style.setProperty('--low-pct', t.high > 0 ? (t.low / t.high * 100).toFixed(1) + '%' : '0%');
        $('#range-fill').classList.toggle('has-value', t.high > 0);
        document.body.classList.toggle('has-estimate', t.count > 0);

        // Line items
        const lines = $('#summary-lines');
        lines.innerHTML = '';
        ORDER.filter(id => state.qty[id] > 0).forEach(id => {
            const li = document.createElement('li');
            const q = state.qty[id];
            const name = document.createElement('span');
            name.className = 'line-name';
            name.textContent = q + ' × ' + ITEMS[id].name;
            const amt = document.createElement('span');
            amt.className = 'line-amt';
            amt.textContent = money(q * ITEMS[id].low) + ' – ' + money(q * ITEMS[id].high);
            li.append(name, amt);
            lines.appendChild(li);
        });

        // Minimum note
        const minNote = $('#summary-min-note');
        const min = CONFIG.weddingMinimum || 0;
        if (min > 0 && t.count > 0 && t.high < min) {
            minNote.hidden = false;
            minNote.textContent = 'Heads up: wedding orders start at ' + money(min) + '. Smaller celebrations are welcome too, just reach out and we\'ll find the right fit.';
        } else {
            minNote.hidden = true;
        }

        // Disable send when empty
        $('#send-estimate').classList.toggle('disabled', t.count === 0);
        $('#send-estimate').setAttribute('aria-disabled', t.count === 0 ? 'true' : 'false');

        markActivePackage();
        save();
    }

    // ---------- Text / email ----------
    function formatDate(iso) {
        if (!iso) return '';
        const [y, m, d] = iso.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        if (isNaN(dt)) return iso;
        return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }

    function estimateText(includeGreeting) {
        const t = totals(state.qty);
        const d = state.details;
        const lines = [];
        if (includeGreeting) {
            lines.push('Hi Hannah!', '', 'I built a wedding flower estimate on your website and would love to set up a consultation.', '');
        }
        if (d.name) lines.push('Name: ' + d.name);
        if (d.date) lines.push('Wedding date: ' + formatDate(d.date));
        if (d.venue) lines.push('Venue / city: ' + d.venue);
        if (d.notes) lines.push('Colors & vibe: ' + d.notes);
        if (d.name || d.date || d.venue || d.notes) lines.push('');

        lines.push('MY FLOWER WISH LIST');
        CONFIG.categories.forEach(cat => {
            const chosen = cat.items.filter(i => state.qty[i.id] > 0);
            if (!chosen.length) return;
            lines.push('', cat.title + ':');
            chosen.forEach(i => {
                const q = state.qty[i.id];
                lines.push('  • ' + q + ' × ' + i.name + '  (' + money(q * i.low) + ' – ' + money(q * i.high) + ')');
            });
        });
        lines.push('', 'Estimated range: ' + money(t.low) + ' – ' + money(t.high));
        lines.push('', 'View or edit this estimate: ' + shareUrl());
        if (includeGreeting) lines.push('', 'Thank you!', d.name || '');
        return lines.join('\n');
    }

    function mailtoHref() {
        const d = state.details;
        let subject = 'Wedding Estimate';
        if (d.name) subject += ' - ' + d.name;
        if (d.date) subject += ' - ' + formatDate(d.date);
        subject += ' - Petal and Pearl Flowers';
        return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(estimateText(true));
    }

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            let ok = false;
            try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
            ta.remove();
            return ok;
        }
    }

    // ---------- Party-size helper ----------
    function applyHelper() {
        const h = state.helper;
        const num = v => (v === '' || v == null) ? null : Math.max(0, parseInt(v, 10) || 0);
        const guests = num(h.guests), maids = num(h.bridesmaids), men = num(h.groomsmen), fam = num(h.family);
        const changes = [];
        const set = (id, n, label) => {
            if (!ITEMS[id]) return;
            const v = clampQty(id, n);
            if (state.qty[id] !== v) changes.push(v + ' ' + label);
            state.qty[id] = v;
        };

        if (guests === null && maids === null && men === null && fam === null) {
            toast('Fill in at least one number and I\'ll do the math.');
            return;
        }
        if (state.qty['bridal-bouquet'] === 0) set('bridal-bouquet', 1, 'bridal bouquet');
        if (maids !== null) set('bridesmaid-bouquet', maids, 'bridesmaid bouquets');
        if (men !== null) set('boutonniere', men + 3, 'boutonnieres');
        if (fam !== null) set('corsage', fam, 'corsages');
        if (guests !== null) set('centerpiece', Math.ceil(guests / 8), 'centerpieces');

        update();
        toast(changes.length ? 'Updated: ' + changes.join(', ') + '.' : 'Your quantities already match. Nice!');
    }

    // ---------- Wire up ----------
    function bindDetails() {
        const map = { name: '#d-name', date: '#d-date', venue: '#d-venue', notes: '#d-notes' };
        Object.keys(map).forEach(k => {
            const el = $(map[k]);
            el.value = state.details[k] || '';
            el.addEventListener('input', () => { state.details[k] = el.value; save(); });
        });

        const hmap = { guests: '#h-guests', bridesmaids: '#h-bridesmaids', groomsmen: '#h-groomsmen', family: '#h-family' };
        Object.keys(hmap).forEach(k => {
            const el = $(hmap[k]);
            el.value = state.helper[k] || '';
            el.addEventListener('input', () => { state.helper[k] = el.value; save(); });
            el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); applyHelper(); } });
        });
        $('#helper-apply').addEventListener('click', applyHelper);
    }

    function bindActions() {
        $('#send-estimate').addEventListener('click', e => {
            e.preventDefault();
            if (totals(state.qty).count === 0) {
                toast('Add at least one item first.');
                return;
            }
            window.location.href = mailtoHref();
        });

        $('#copy-estimate').addEventListener('click', async () => {
            if (totals(state.qty).count === 0) return toast('Add at least one item first.');
            toast(await copyText(estimateText(false)) ? 'Estimate copied to your clipboard.' : 'Couldn\'t copy. Try the Print button instead.');
        });

        $('#share-estimate').addEventListener('click', async () => {
            if (totals(state.qty).count === 0) return toast('Add at least one item first.');
            const url = shareUrl();
            if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
                try { await navigator.share({ title: 'Our Wedding Flower Estimate', url }); return; } catch (e) { /* cancelled */ }
            }
            toast(await copyText(url) ? 'Link copied. Send it to your partner or planner!' : url);
        });

        $('#print-estimate').addEventListener('click', () => window.print());

        $('#reset-estimate').addEventListener('click', () => {
            if (totals(state.qty).count > 0 && !confirm('Clear your estimate and start over?')) return;
            ORDER.forEach(id => { state.qty[id] = 0; });
            update();
            toast('Fresh start!');
        });

        // Hide the mobile bar when the summary itself is on screen.
        const bar = $('#mobile-total-bar');
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(entries => {
                entries.forEach(en => bar.classList.toggle('summary-visible', en.isIntersecting));
            }, { threshold: 0.15 }).observe($('#summary'));
        }
    }

    // ---------- Init ----------
    load();
    renderPackages();
    renderItems();
    bindDetails();
    bindActions();
    update();
    if (loadedFromLink) toast('Loaded a shared estimate.');
})();
