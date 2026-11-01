// ============================================================================
// Admin — PASS 2.
//
// This is a placeholder screen, and it says so rather than showing an empty
// dashboard that looks broken. The full build (product and category editors,
// inventory, orders, and the catalogue overlay with its canonical JSON export)
// is the next pass.
//
// ⚠️ NO seed.js, here or ever. kirana seeds demo orders so its counter board is
// not empty the first time somebody is shown it. Doing that here would place
// invented orders into a dashboard whose entire claim is that it never invents
// an order. The empty state explains why it is empty instead.
// ============================================================================

import * as store from '../store.js';
import * as router from '../router.js';
import { esc, h1, notice } from '../ui.js';
import { ornament } from '../brand.js';
import * as D from '../domain.js';

router.registerScreen('admin', async (host) => {
  const [orders, all, shop] = await Promise.all([
    store.orders.mine(), store.catalog.all(), store.catalog.shop(),
  ]);

  const lowStock = all.filter((p) => p.kind !== 'voucher'
    && p.stock <= shop.lowStockAt);

  host.innerHTML = `
  ${h1('Admin', 'Owner', 'Catalogue and order management.')}

  ${notice('warn', '<b>These are orders placed in THIS browser only.</b> '
    + 'There is no server, so an order a customer places on their own phone '
    + 'never appears here — it reaches you on WhatsApp. Two tabs side by side '
    + 'make this look like it works, which is exactly why it is worth saying.')}

  <div class="two-col" style="margin-top:var(--s5)">
    <div>
      <section class="panel">
        <h2 class="t-h3">Orders in this browser</h2>
        ${orders.length ? `<div style="margin-top:var(--s3)">
          ${orders.map((o) => `<div class="ord">
            <div>
              <a href="#/order/${esc(o.code)}" class="ord-code">${esc(o.code)}</a>
              <div class="ord-meta">${D.fmtStamp(o.createdAt)} ·
                ${esc(o.customer.name || 'No name')} · ${D.rupees(o.grand)}
                ${o.paid ? ' · paid' : ' · not marked paid'}</div>
            </div>
            <span class="pill pill-${D.STATUS_TONE[o.status]}">
              ${esc(D.STATUS_LABEL[o.status])}</span>
          </div>`).join('')}
        </div>` : `
        <p class="t-micro dim" style="margin-top:var(--s3)">
          Nothing here yet — and this board will stay empty until somebody
          places an order in this browser. It is not seeded with invented
          orders, because a dashboard that invents orders cannot be trusted
          about the real ones.</p>`}
      </section>

      <section class="panel" style="margin-top:var(--s4)">
        <h2 class="t-h3">Coming in the next pass</h2>
        <ul style="margin-top:var(--s3);display:flex;flex-direction:column;gap:var(--s2)">
          <li class="t-micro">Add, edit and retire products; change prices and discounts.</li>
          <li class="t-micro">Manage categories and subcategories.</li>
          <li class="t-micro">Update inventory.</li>
          <li class="t-micro">Move an order along: sent &rarr; confirmed &rarr; packed
            &rarr; shipped &rarr; delivered. Mark paid, after checking the bank.</li>
          <li class="t-micro">Export the edited catalogue as canonical JSON to
            drop back into <code>app/data/catalog.json</code>.</li>
        </ul>
      </section>
    </div>

    <aside>
      <section class="panel">
        <h2 class="t-h3">Catalogue</h2>
        <div class="totals" style="margin-top:var(--s4)">
          <div class="total-row muted"><span>Products</span><span>${all.length}</span></div>
          <div class="total-row muted"><span>On offer</span>
            <span>${all.filter((p) => p.mrp > p.price).length}</span></div>
          <div class="total-row muted"><span>New</span>
            <span>${all.filter((p) => D.isNew(p, shop)).length}</span></div>
          <div class="total-row muted"><span>Low or out of stock</span>
            <span>${lowStock.length}</span></div>
        </div>
      </section>

      ${lowStock.length ? `
      <section class="panel" style="margin-top:var(--s4)">
        <h2 class="t-h3">Running low</h2>
        <div style="margin-top:var(--s3);display:flex;flex-direction:column;gap:var(--s2)">
          ${lowStock.map((p) => `<div class="total-row muted">
            <span><a href="#/p/${esc(p.slug)}">${esc(p.name)}</a></span>
            <span>${p.stock}</span></div>`).join('')}
        </div>
      </section>` : ''}

      <section class="panel" style="margin-top:var(--s4)">
        <h2 class="t-h3">Editing today</h2>
        <p class="t-micro dim" style="margin-top:var(--s2)">
          Everything the business owns is in
          <code>app/data/shop.json</code> and
          <code>app/data/catalog.json</code>. Edit either, then run
          <code>perl tools/check.pl</code> — the checks read the same numbers
          this page does, so a mistake fails there rather than on the shop.</p>
      </section>
    </aside>
  </div>

  <div style="margin-top:var(--s7)">${ornament()}</div>`;
});
