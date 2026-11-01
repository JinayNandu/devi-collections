# DEVI Collections

A storefront for a premium Indian lifestyle brand — home furnishings,
decorative artefacts, ethnic wear, lifestyle goods, bags and gift vouchers.

Vanilla HTML, CSS and ES modules. **No build step, no dependencies, nothing to
install** — there is no `package.json` because there is nothing to put in one.

```bash
perl tools/serve.pl 8130 app      # http://127.0.0.1:8130/
perl tools/check.pl               # the nine checks
```

[`CLAUDE.md`](CLAUDE.md) is the real documentation: the architecture, the hard
rules and the bug each one prevents, the artwork engine, and what is still
open.

---

## ⚠️ Read before putting this in front of a customer

**The brand details and all 54 prices are invented.** The phone number, the
address and the GSTIN are empty; the UPI id is a demo value that will not
collect money. `app/data/shop.json` carries `"placeholder": true` and
**`tools/data.pl` fails while it is true**, which is deliberate: a phone number
that does not dial is the worst thing to ship by accident on a real business's
site.

To clear it: fill in `contact` in `app/data/shop.json`, check every price, set
`placeholder` to `false`, then run `perl tools/check.pl`.

**This site does not take payment.** An order placed here is a record in the
customer's own browser; it reaches DEVI when they send it on WhatsApp or call.
Card and net banking ship disabled with the reason shown on the control. The
Razorpay seam exists in `app/gateway-razorpay.js` and refuses until a key and a
server are configured — a payment cannot be verified in a static page, because
verification needs an HMAC over a secret that must never be in one.

There is no login, no sign-up and no OTP screen anywhere, and that is enforced
by `tools/honesty.pl`.

---

## The admin

At `#/admin` — overview, orders, catalogue, inventory, categories, data. It is
not behind a login, because there is no server to hold one; it is simply a
route, like every other screen.

**It edits a patch set, not the catalogue.** Change a price and only `price` is
pinned in this browser — every other field still comes from
`app/data/catalog.json`, so the next catalogue update flows through untouched.
The Data tab turns those patches back into a canonical file to commit, and
`perl tools/data.pl <path>` will validate it *before* it replaces anything.

Edits live in one browser and nobody else sees them until they are exported and
committed. Every tab says so, and the orders board says the other half: an
order a customer places on their own phone never appears there — it reaches
DEVI on WhatsApp.

---

## Publishing

`docs/` is the published site: one self-contained HTML file holding every
stylesheet, all 25 modules and the whole catalogue.

```bash
perl tools/mksingle.pl            # regenerate docs/index.html
```

It is generated — never edit it by hand.

**Live at <https://jinaynandu.github.io/devi-collections/>** — GitHub Pages, *Settings → Pages → Deploy from a branch →
`main` / `/docs`*. A project site is served from a **subpath**, so every link in
the page must stay relative; `.nojekyll` sits beside it because Jekyll would
otherwise silently drop any file whose name begins with an underscore.

`docs/robots.txt` is generated too, **from the same `placeholder` flag**.
While the flag is true the site asks search engines to stay away, because
invented prices indexed under a real brand's name are a harm the flag already
exists to prevent. Clearing the flag and rebuilding opens it up — there is
nothing separate to remember and nothing to undo by hand.
