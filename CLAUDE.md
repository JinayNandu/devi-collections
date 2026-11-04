# DEVI Collections — project context

Read this before changing anything. Everything here was either established by
testing or decided deliberately; none of it is a guess.

---

## What this is

A storefront for **DEVI Collections**, a premium Indian home linen brand
selling bedsheets, bedcovers and quilts, dohars and table runners. The
owner's personal project — **not** connected with their employer's work.

It began wider — artefacts, kurtis, utility goods, bags and gift vouchers —
and was narrowed to bed linen on 2 November 2026 at the owner's instruction.
The `kind: "voucher"` and `shipClass: "bulky"` branches survive that cut on
purpose: both are still live in domain.js, in shop.json and on the product
page, so money.pl now tests them against two SYNTHETIC products rather than
real ones. See *Open, and owned by the user*.

Sibling to `kirana`, and built on its conventions on purpose: same zero-build
stack, same `store.js` facade, same business data in JSON, same Perl check
suite, same refusal to fake a payment.

**The shop does not take money and cannot send an order anywhere.** It builds a
real order with a real code and then hands it to the customer to send on
WhatsApp, by phone or by email. That is not a placeholder for a real mechanism
— it is how an Indian home-decor business of this size already takes orders,
and it works today with no backend, no gateway fee and no settlement delay.

| Piece | State |
|---|---|
| Storefront — browse, search, filter, bag, checkout, order handoff | Built and working |
| 25 products across 4 categories and 5 subcategories | Built, **prices invented** |
| Admin dashboard | Built — six tabs, editing a **patch set** over the catalogue |
| Payment gateway | Seam only. Ships refusing. See *Paying* below |
| Backend | None. `store.js` is nine lines so that is one import away |

---

## Stack and constraints

- **No Node, no npm. Python is blocked by group policy.** Perl 5.42.2 — the
  copy bundled with Git for Windows, `usr/bin/perl.exe` under the Git install
  (it is plain `perl` on the Git Bash PATH).
- Therefore **zero build step** — vanilla HTML/CSS/ES modules, no bundler, no
  `package.json`, no test runner.
- ES modules and `fetch` both refuse to run over `file://`, so local work needs
  a real http:// origin:

```bash
perl tools/serve.pl 8130 app
```

  `tools/serve.pl` is **a copy of kirana's**. Do not edit kirana's — it is
  shared with two other projects. Port **8130**, because 8110 is kirana's and
  8120 is `scorer-dev` in `Projects/.claude/launch.json`.

- **There IS a browser here.** Every route below has been clicked at 375px and
  1440px.

### Verified reachable from this laptop

Zscaler blocks some domains, which would kill a CDN dependency silently.
Checked 2026-11-01, all returned 200:

| Host | For |
|---|---|
| `fonts.googleapis.com` | Cormorant Garamond + Manrope, one request |
| `cdnjs.cloudflare.com` | qrcodejs 1.0.0, the UPI QR |
| `checkout.razorpay.com` | `v1/checkout.js`, for when a gateway exists |

Each is loaded **on demand with an `onerror` branch**, never in the document
head. A blocked CDN with no error branch leaves a spinner turning for ever,
which is the most expensive failure to diagnose from a screenshot.

---

## Layout

```
app/
  index.html        one document: strip, header, rail, 11 <section data-screen>, footer
  app.js            entry -- the only module that knows every screen exists
  router.js         hash routing, the screen stack, teardown. Imports NO page.
  ui.js             shell: $, esc, mount, toast, counts, drawer. Imports NO page.
  sidebar.js        the category tree, and the same tree inside the drawer
  components.js     productCard, priceBlock, swatchRow, qtyStepper, rail, field
  domain.js         PURE -- money, sorts, filters, route parsing, status table,
                    AND every date read in the project
  store.js          the facade. ONE import line is the backend swap.
  backend-local.js  localStorage + cross-tab storage events. The contract.
  art.js            the procedural artwork engine
  brand.js          the jharokha-D monogram, the lotus seal, the rule ornament
  icons.js          stroked 24x24 glyphs, currentColor
  pay.js            payment options, the UPI QR, the DEMO strip
  handoff.js        WhatsApp / tel / mailto / copy -- the honest outbound channel
  gateway-razorpay.js  THE SEAM. Ships knowing only how to refuse.
  overlay.js        PURE -- the admin's field-level patches over the shipped
                    catalogue, and the canonical JSON that pairs with canon.pl
  config.js         CDN pins ONLY. No business data.
  pages/            home listing product cart checkout confirm
                    wishlist account info notfound
                    admin          the shell, the overview, AND the orders
                                   board -- see the setPaid note below
                    admin-catalog  catalogue, inventory, categories, data
  styles/
    tokens.css      THE ONLY file with a :root block or a literal colour
    base.css layout.css components.css pages.css
  data/
    shop.json       EVERYTHING THE OWNER OWNS -- brand, contact, shipping,
                    coupons, the UPI id, the gateway config
    catalog.json    25 products
    categories.json 4 categories, 5 subcategories (two have NONE)
    pages.json      the six content and policy pages, as blocks
tools/
  serve.pl          static server, both loopback families. A COPY of kirana's.
  check.pl          runs all nine
  data.pl money.pl tokens.pl art.pl canon.pl routes.pl honesty.pl clock.pl balance.pl
```

**One HTML document, JavaScript split into modules**, as in kirana. One
document because the palette and the shell must be single-sourced; modules
because eleven screens are genuinely eleven screens.

**Everything the owner owns is in `app/data/shop.json`** — brand copy, phone,
address, GSTIN, shipping rules, coupons, the UPI id, the gateway config. JSON
rather than JavaScript so changing it needs no knowledge of code, and so the
Perl checks read the same numbers the app does.

---

## Hard rules — do not break these

### This site never claims a payment or a confirmation

`tools/honesty.pl` fails on *payment successful / received / confirmed*,
*order confirmed / placed successfully*, *thank you for your purchase* and
*we have received your order*, anywhere in any module.

An order is born **`draft`**, not `placed`. `draft → sent` happens when the
**customer** taps a handoff button. `sent → confirmed` is an **admin** action —
a human at DEVI saying "I have this". Nothing advances on a timer, and there is
no "processing" state because nothing processes. Invalid transitions throw; a
silent no-op is a button that looks like it worked.

### `paid` has exactly one writer, and it is a human

`orders.setPaid()` exists for the admin, after somebody has checked the bank.
`honesty.pl` fails on a call from anywhere else.

⚠️ **A gateway response must never set it.** Razorpay Checkout returns
`razorpay_payment_id` **in the browser**, which is forgeable — anyone can call
the handler from the console. Verifying it needs an HMAC-SHA256 over the key
secret, which cannot exist in a static page without handing it to every
visitor. So `recordGatewayClaim()` writes `{ paymentId, verified: false }` and
leaves `paid` alone.

### There is no login, anywhere, ever

No sign-in, no sign-up, no OTP screen. A login form that accepts any password
is the most dishonest thing this site could ship and the easiest to build by
accident while scaffolding. `honesty.pl` fails on a route, screen or section id
named `login`, `signin`, `signup`, `register` or `otp`.

My Account says so in its first line: no server, no password, everything in
this browser only.

### The free-shipping threshold is measured on items, BEFORE the coupon

A discount code must not win free shipping a basket had not earned.

⚠️ **kirana gets this wrong right now.** `kirana/app/domain.js:146` computes its
fee from the post-coupon total; `kirana/tools/money.pl:47` computes it from the
pre-coupon items total. They have always disagreed, and it is invisible there
only because kirana ships `fee: 0, freeOver: 0` so both branches return zero.
DEVI has a real ₹99 fee and a real ₹1,999 threshold.

`money.pl` case (a) pins the rule with a basket that actually straddles it
(₹2,199 items, ₹1,979 payable), and `check_source()` greps `domain.js` for the
line that implements it and fails if it names a post-discount value. **Proved
by introducing kirana's bug and watching it fail.**

### Money is integer rupees everywhere

No `toFixed`, no rounding rule to argue about, no drift down a thirty-line
basket. The discount rounds **once, on the basket total**, never per line —
per-line rounding lets the sum of the parts disagree with the total. `maxOff`
caps after rounding. A coupon's `minItems` is measured on items **before**
discount, so a code cannot unlock itself.

### A cart line is `{pid, qty, variant}` and nothing else

**No price.** A cart that stores a price disagrees with itself the moment
anyone edits one, and it surfaces as "the cart total isn't the checkout total",
which is unfixable once there are two sources of truth. Price resolves from the
catalogue at render and is snapshotted into the order line at placement — the
one moment it must freeze.

### Line identity is `pid|colour|size`, never `pid`

Two colours of one bed cover are **two lines**. Keying on the product id makes
the second add silently increment the first, and the customer receives two of
the wrong colour with nothing in the UI ever looking wrong. Every cart mutation
takes a `lineKey`. `money.pl` case (d).

### Only the SIZE axis may carry a price delta

Two priced axes make the effective price a 2-D matrix and the admin a
spreadsheet. `data.pl` fails on a non-zero `colour[].delta`.

### `new`, `sale`, `low-stock` and `sold-out` are DERIVED

`badges` in the JSON holds only what a human chose. A stored "new" badge makes
a product new for three years; a stored "sale" badge survives the sale ending.
`data.pl` fails if a derived name appears in the stored array.

### Every date and clock read lives in `domain.js`

`toISOString().slice(0,10)` is **UTC**. On an IST device between 00:00 and
05:30 it returns *yesterday*. `clock.pl` greps every other module, and closes
**three gaps kirana's `slots.pl` leaves open** — `.substring(0,10)`,
`.split('T')[0]`, and a `const s = d.toISOString()` sliced two lines later. Both
of the first two were proved by writing them into a page and watching the check
fail.

Inside `domain.js`: **`hourCycle:'h23'`, never `hour12:false`** (several
engines return `"24:00"` for midnight, so 00:05 computes as 1445 minutes), and
**`formatToParts`, never a format string** (assembling the parts ourselves
cannot be bent by a locale quirk).

### `ui.js` and `router.js` must never import a page module

Pages import them and register themselves. A circular ES import hands you
`undefined` for something that looks hoisted and throws at render, with a stack
trace pointing somewhere unrelated — `balance.pl` cannot see it because the
brackets are all fine. `routes.pl` greps for it, **including the bare
side-effect form** `import './pages/cart.js'`, which is how every page is
pulled in and therefore the likely one. The first version of that check only
matched the `from` clause and silently missed it.

### `[hidden]{display:none !important}` is load-bearing

Any rule giving an element a `display` beats the UA's `[hidden]`, and this site
has sections that are `display:grid` and category sub-lists that are
`display:flex`. Without the `!important` the whole category tree renders
permanently expanded and every screen stacks on top of every other. This is the
exact bug that left kirana's back button sitting on its home screen.

### A category with one child — or none — renders as a plain link

An expand arrow that reveals a single row, or an empty list, reads as a broken
menu. **Bedcovers & Quilts and Table Runners have no subcategories at all**
and hold their products directly, so both cases are live and `sidebar.js`
handles each in three lines, in `groupHTML()` and again in `syncActive()`.

### A product in such a category carries NO `sub` key

Not `null`, not `""` — absent. Three consequences, each of which bit during
the November 2026 narrowing:

- `data.pl` requires `sub` exactly when the category has children and
  **forbids** it when it does not. A leftover `sub` from a reorganised tree
  points at another category's child and files the product under a heading
  nobody can navigate to.
- `relatedTo()` in domain.js must compare `cat` **before** `sub`. A bare
  `x.sub === p.sub` matches `undefined` to `undefined`, which put every
  bedcover in every table runner's related list.
- `art.js` is keyed on `product.sub || product.cat`. An undefined key falls
  through to the default folded-bedsheet silhouette, so every table runner
  would have been drawn as a sheet — silently, and only in the artwork.

The admin writes `sub: null` to UNSET it, and `applyOverlay()` deletes any
key whose patch value is `null`. That is the only place `null` exists; it
never reaches an exported file.

### No `seed.js`, here or ever

kirana seeds demo orders so its counter board is not empty the first time
somebody is shown it. Doing that here would place invented orders into a
dashboard whose entire claim is that it never invents an order. The admin's
empty state explains why it is empty instead.

---

## The brand band

The logo sits in its own centred row **above** the navigation, added on
2 November 2026. Three decisions in it:

**The band is not sticky; the header below it is.** That is what pays for
the band's height — it scrolls away. The sticky header therefore carries the
**monogram alone** (`mark(26)`, not `logo('sm')`): two full lockups on
screen at once read as a mistake rather than as emphasis.

**`brand.logo` in shop.json swaps the drawn lockup for a real file.** Empty,
as it ships, draws the lockup from `brand.js`. Set it to a path relative to
`app/` and the band renders an `<img>` instead. SVG is strongly preferred;
a PNG wants to be about 3× the displayed height (~170px) or it looks soft
on a phone.

⚠️ **A path, never an upload, and `data.pl` fails on both mistakes** — a
file that is not on disk, and a leading slash. A root-relative path is the
specific trap here: it works locally and breaks on GitHub Pages, which
serves this site from a **subpath**.

⚠️ **The `<img>` height is fixed in CSS and its width is free**, so a logo
of any aspect ratio drops in without the row changing height. Otherwise the
swap shifts every page down by however many pixels the file disagrees by.

`brand.js` escapes the path with a four-line local helper rather than
importing `esc` from `ui.js` — **ui.js already imports brand.js**, and the
cycle hands one of them an undefined export that only throws at render.
`routes.pl` checks the direction of that dependency.

## Design

Warm ivory `--paper`, antique gold `--gold`, terracotta `--rose` for a saving
only. **67 tokens, declared identically in all three palette blocks.** No
component rule names a colour; `tokens.pl` enforces both halves of that and
`art.pl` enforces the same two rules over the modules that emit SVG.

**Light-only, declared honestly.** The brand's whole claim is warm ivory and a
dark mode inverts exactly that. All three `:root` blocks carry the light values
**and `color-scheme:light`** — that last part is what makes it honest rather
than a dodge. Copy light values in but leave `color-scheme:dark` and the page
renders ivory while the browser renders scrollbars and date pickers dark on top
of it. Adding a real dark palette later is filling in two blocks and nothing
else.

Three values were **measured and moved** rather than shipped:

- `--gold` at `#9C7A2E` failed both ways at once — white on it 4.01, dark ink on
  it 4.18, the mid-luminance dead zone. `#AE8936` is the only value where
  dark-on-gold clears 4.5 (**4.95**) *and* gold-on-paper clears 3:1 (**3.08**)
  so it can also be a hairline rule.
- `--edge-2` at `#D3C6B4` measured **1.68** on `--card`. It carries the text
  input border, which is the control's only affordance, so it needs 3:1. Moved
  to `#968468` (3.62 / 3.42 / 3.08).
- ⚠️ **`--on-gold` is DARK.** This is the "never hardcode `#fff` on an accent"
  rule biting in *light* mode, which is where nobody expects it.

**The focus ring is two-tone and that is not optional.** A single `--ink` ring
measures **2.66** on `--good`. A `box-shadow:0 0 0 2px var(--paper)` halo puts
the ring on `--paper` always, where it measures 15.82 whatever the element is
filled with — provably correct for every future accent too.

**Cormorant Garamond is voice, Manrope is data.** Headings, category names and
the tagline are the serif; product names, prices, labels, buttons and form
fields are the sans. Applying the serif to everything is what makes a template
collapse at 13px. ⚠️ **Cormorant is never used below 20px** — its thin strokes
hint away on Windows and look cheap. Form inputs are **16px**, because under
that iOS zooms the viewport on focus and the checkout visibly lurches.

**Manrope carries U+20B9 ₹ — measured, not assumed (2026-11-02).** After
`document.fonts.ready`, canvas `measureText('₹')` gives 9.61px against 12.45px
for the guaranteed-missing `U+FFFF`, so it is a real glyph and not a tofu box
wearing one. `Segoe UI` behind it in `--f-ui` has it too (8.63 vs 10.33). This
mattered because a missing ₹ turns every price on a premium storefront into a
box and the whole read dies at a glance.

**Products float; nothing is boxed.** The card has no border, no fill and no
shadow — only the image tile has an edge. A bordered white rectangle around
every tile is the single most recognisable template signature. Same reasoning
in the sidebar: a column of type on `--paper`, not a tinted panel, and the
active row gets a 2px gold left bar rather than a filled pill.

**No emoji anywhere**, carried from kirana. **No carousel** — auto-rotating
heroes lose clicks and every unseen slide is dead weight.

⚠️ **Under `prefers-reduced-motion` the card's hover zoom is replaced by a gold
inset ring.** The blanket `transition:none` rule would otherwise delete all
hover feedback, since it was carried entirely by a transform. That is a common
and completely invisible accessibility regression.

### The artwork engine

There are no photographs. `art.js` draws one deterministically per product from
the real grammar of Indian textiles — *zameen* (ground), *buta* (motif),
*pallu* (border band), selvedge — rather than an invented layer stack, which is
what stops the output reading as generated noise.

**FNV-1a with a salted stream per axis**, nine axes. Salting rather than
slicing one hash is about axis count: 32 bits in 8-bit slices gives four axes
and this needs nine; at the fifth you reuse bits and the axes correlate, so the
motif would predict the rotation. Motif + colourway **alone** gave only 56
distinct looks across 120 products with a worst bucket of five — rotation,
scale and weight are what take that to 120. They are load-bearing, not polish.

**Category drives it through silhouette clipping**, which is the highest-value
idea here: the patterned fill is clipped to a per-category path, so the same
bagru print reads as a folded sheet on a bedsheet and a narrow band on a table
runner. A runner runs VERTICALLY down the 4:5 tile with a mitred point and
tassels at each end — laid across it, the band would be 60px of pattern in a
500px frame and read as a stripe. A razai never gets an ikat chevron.

⚠️ **Inline SVG, never a CSS `background-image`.** A data-URI SVG is a separate
document and **cannot read the page's CSS custom properties**, so every colour
would have to be a literal hex inside a component rule — which `tokens.pl`
fails on, and rightly, because those colours could never follow a theme. The
favicon in `app.js` is the one data-URI, and it reads `--gold` out of the
computed style rather than hardcoding it.

⚠️ **SVG ids are document-global, and product+view is not unique enough.** The
same product appears in several rails on one home page, and the detail page
renders view 0 as both the main image and its first thumbnail. Every generated
id carries an **instance placeholder** that `art()` swaps for a fresh number
after the memo cache. Before that was added there were **sixteen duplicate ids
on the home page, measured**. They painted correctly only because the colliding
definitions happened to be identical — which is exactly what made it dangerous.

⚠️ **Gold is a fill, never a stroke.** `--art-gold` measures 2.43–2.65 against
the pastel grounds and fails 3:1. It is not fixed by darkening; every gold
shape carries an `--art-ink` outline (4.11), so the shape's edge carries the
contrast. That is also how real zari and khari block-printing physically looks
— metallic fill inside a printed outline. The accessibility fix and the craft
authenticity are the same decision.

**The artwork tokens are non-varying by design** — identical in all three
palette blocks, like kirana's `--qr-paper`/`--qr-ink`. A generated swatch is
cloth under light; inverting it would make every product read as a cut-out, and
a real photograph (the swap path) is shot on white and cannot invert at all.
`art.pl` checks all ten.

**The photography swap path**: a product may carry an `img` array. `img[view]`
present → photograph; absent or `null` → generated artwork. Per product *and*
per view, so a partial shoot stays coherent. The tile is `aspect-ratio:4/5`
locked in CSS and the SVG uses `preserveAspectRatio="slice"` against the
`<img>`'s `object-fit:cover`, so swapping one for the other shifts nothing.
Adding a photograph is **a data edit plus a file**, never a code change — and
`data.pl` `-f` checks every declared path, because a broken-image glyph on a
premium storefront is strictly worse than the artwork it replaced.

---

## Paying — UPI, and no gateway

The app does **not** take money. A UPI QR carries the shop's id, the exact
amount and the order code; the customer scans it with whatever app they already
use. No gateway, no per-transaction fee, no settlement delay, no card details
anywhere near this code.

⚠️ **There is deliberately no `upi://` deep-link button.** It does nothing at
all on a desktop, and on a phone it hands off to an app that may not be
installed — so it looks broken more often than it works. A QR works from any
device with a camera.

⚠️ **It currently carries a DEMO id — `demo.not.real@example`.** `example` is
not a real UPI handle, so no payment app can resolve a payee and money
physically cannot move. The pay block wears an amber strip saying so, because
somebody looking at a QR should not have to understand UPI handles to feel safe
about it. `data.pl` **fails** if `upi.demo` is true and the handle after the @
is a real one (`ybl`, `okaxis`, `paytm`…), since a demo id on a live handle
could send a customer's money to whoever owns it.

**To go live:** put the real id in `shop.json` and set `demo` to false. The
strip disappears by itself.

### Why not a real gateway

Asked and answered: it is not a day's work and it is architecturally blocked.

- A gateway needs a **server**. The amount has to be computed and signed
  somewhere the customer cannot edit, or anyone pays ₹1 for a ₹5,000 basket.
- Confirming a payment needs an HMAC over the key secret, which cannot exist in
  a static page, plus a `payment.captured` webhook — the only confirmation that
  never passes through a browser.
- It needs business registration, GST, a settlement account and KYC, and costs
  ~2% plus GST, settling T+1.

`gateway-razorpay.js` holds the seam and the full four-step checklist. It ships
throwing `GATEWAY_NOT_CONFIGURED`. `data.pl` **fails** on `gateway.live: true`
with an empty `serverBase`, and on an `rzp_test_` key with `live: true` — it
must not be possible to flip one boolean and have the site start claiming more
than it can prove.

---

## The admin, and the overlay

`#/admin/:tab` — overview, orders, catalogue, inventory, categories, data.
One screen, six renderers, split across two files.

### It edits a patch set, never a catalogue

This is the whole design and everything else follows from it.

The catalogue ships as `app/data/catalog.json`: reviewed, in version control.
The admin edits it in a browser. If the browser kept **a copy** of the
catalogue, then the next time the shipped file gained a product or fixed a
typo, the browser's copy would silently win and none of it would ever be seen
again.

So `app/overlay.js` keeps **field-level patches** instead:

```js
{ rev: 1, patch: { 'p-bc-kalamkari-indigo': { price: 3299 } },
  added: [...], retired: [...], catPatch: {...} }
```

Edit a price and only `price` is pinned; every other field still comes from the
shipped file. **Measured**: patch the price, and `desc` still reads from
`catalog.json`.

⚠️ **A value equal to the shipped one is deleted from the patch, not stored.**
Without that, typing a price back to what it was would *pin* it, and that field
would never pick up a catalogue update again — an edit that looks like an undo
and silently is not. Proved by setting a price back and watching the overlay
return to `none`.

⚠️ **Patching is per TOP-LEVEL field**, which matters for the structured ones.
Editing one size delta patches the whole `variants` value, so a colour added to
that product later will not flow through. Scalars do not have this problem. The
editor says so on the variants panel, and `reconcile()` surfaces it as a
conflict rather than losing it.

### `rev`, and why a stale overlay is not applied

`rev` records which shipped catalogue the patches were written against. When it
stops matching, **the patches are held back and the shop reverts to the shipped
file.** That is the safe direction: a price set against last month's catalogue
is an opinion about a product that may no longer be the same product.

The Data tab then shows a review split three ways — `agreed` (the new file
already says this, drop it), `conflicts` (needs a human), and `gone` (the
product no longer exists, so applying it would resurrect a retired product at a
price nobody chose). Exporting **bumps `rev`**, which is what lets the overlay
retire itself: once the file is in place everything it held is agreed by
definition, and it clears in one click.

### The export is byte-identical to `canon.pl`

`JSON.stringify` emits keys in insertion order, so `sortDeep()` sorts before
stringifying rather than asking stringify to. **Proved by hash**: the browser's
export of a known patch and a Perl script applying the same patch with
`canon.pl`'s own `JSON::PP` settings both produce 76,314 bytes with SHA-256
`623e1190…`. The exported file was then run through `perl tools/data.pl <path>`
and passes every catalogue check.

⚠️ **The admin's self-check reverses every object's keys first, and that is
not decoration.** The shipped files are *already* sorted, because `canon.pl`
wrote them that way, so `JSON.parse` hands back sorted keys and re-encoding
reproduces the file **even with `sortDeep()` removed** — measured. Reversing
first is what makes the check able to fail. Proved by stubbing `sortDeep` to
`return v` and watching both files report ✕ at character 5.

### Three things that are where they are on purpose

⚠️ **The orders board lives in `pages/admin.js`, not `admin-catalog.js`.**
`honesty.pl` allows `setPaid()` from exactly two files: `backend-local.js`
where it is defined, and `pages/admin.js`. `paid` is the one field in this
project a human must assert, so moving the board would mean widening that
exemption — the wrong direction.

⚠️ **`clearEverything()` skips the overlay.** That button is on the customer's
account screen and clears what the shop knows about *them*. The overlay is the
owner's unexported catalogue work, with no copy anywhere else. The admin has
its own `clearOverlay()`, which says what it is about to throw away.

⚠️ **Marking paid is a two-tap confirm, not `window.confirm()`.** The artifact
and single-file viewers return `false` from `confirm()` immediately without
showing anything, so a dialog there would cancel every attempt silently.

### A stale async render can clobber the current tab

Every tab is one screen, so moving between them re-enters `admin` without the
router swapping sections. `draw()` is async and a `live` subscription can start
one at any moment, so a draw begun for Data can land after Catalogue has
rendered — URL saying one tab, page showing another. **Reproduced every time**
by clearing the overlay and navigating in the same breath.

`router.onLeave()` cannot help: it unsubscribes, but a `draw()` already past
its `await` is listening to nothing. So each entry takes a number and a stale
draw drops its own result. Guarded twice, because `renderData()` awaits again
after the first check.

### No uploads, ever

⚠️ An image field takes a **path**. localStorage is about 5 MB; four base64
JPEGs fill it, and after that every cart write fails — silently, because a
quota error surfaces nowhere near the thing that broke.

### No seeding

kirana seeds demo orders so its board is not empty the first time somebody is
shown it. Doing that here would put invented orders into a dashboard whose
entire claim is that it never invents one. The empty state explains why it is
empty instead.

## The Supabase swap

`store.js` is nine lines. Changing one import is the whole swap:

```js
import * as backend from './backend-local.js';
// import * as backend from './backend-supabase.js';   // <-- the swap
```

It works because both backends obey four rules — **every method is `async`**
even when answered from memory; **returns are deep-cloned**; **ids are minted
by the backend**; and **`live.subscribe` returns an unsubscribe function**. A
fifth, quieter one: `backend-local.js` imports nothing secret, so the app runs
with no credentials file at all.

**`backend-supabase.js` is deliberately not written.** Several hundred lines of
untested code against a schema that does not exist is speculation, not
preparation. This is also the step that makes orders actually reach the
merchant — until then, WhatsApp does.

---

## Getting it onto a phone

Four ways out of this folder, in order of how much setup they need.

| | command | gives you | needs |
|---|---|---|---|
| **Dev** | `perl tools/serve.pl 8130 app` | `http://127.0.0.1:8130/` | nothing |
| **Same Wi-Fi** | `perl tools/serve.pl --lan 8131 app` | `http://<this machine>:8131/` | the phone on the same network, and the firewall to allow it |
| **One file** | `perl tools/mksingle.pl` | `build/devi-collections.html` | nothing at all — no server, no network |
| **A public URL** | `perl tools/mksingle.pl`, then commit `docs/` | <https://jinaynandu.github.io/devi-collections/> | a GitHub account |

**`--lan` is opt-in and must stay that way.** `serve.pl` binds `127.0.0.1`
and `::1` and nothing else, because a dev server has no business on a network
by default. The flag swaps both for one `0.0.0.0` socket — one, not three,
because the wildcard already covers loopback and a second bind on the same
port just fails with `EADDRINUSE`. It prints the address another device must
type, found by opening a UDP socket toward a public resolver and reading back
which interface the routing table chose; no packet is sent, and it beats
parsing `ipconfig` output that is localised on some machines.

⚠️ **On a corporate or guest network this will often not work**, and that is
not a bug in the server. Managed networks commonly isolate clients from each
other, and a managed laptop's firewall blocks inbound connections by default.
If the phone cannot reach it, use the single file instead rather than
weakening the firewall.

### The single-file build

`tools/mksingle.pl` inlines all five stylesheets, all 25 modules and all four
data files into one `.html`. It opens from a messaging app, a Files app or an
email attachment — no server, no network, nothing to install — and it is also
exactly what you upload to a static host.

It is a **real bundler**, not `cat app/*.js`, because concatenation fails
twice over:

- **Order.** `ui.js` must exist before `cart.js` runs, and alphabetical order
  is not dependency order. So it walks the real import graph from `app.js` and
  sorts it topologically, **dying on a cycle** rather than emitting code that
  hands you `undefined` at import time. `routes.pl` forbids the one cycle this
  project could plausibly grow; the two checks guard the same property from
  opposite ends.
- **Names.** `price`, `product`, `valid`, `variant`, `is` and `fmt` are each
  declared at the top level of more than one module. In separate module scopes
  that is fine and deliberate; poured into one scope it is a redeclaration
  error, or worse, silently the wrong function. So every module keeps its own
  function scope — which is what a module scope *is*.

The parser is line-by-line, so two **pre-passes** fold the forms that wrap:
a multi-line destructured re-export (`store.js`'s whole job) and a named import
broken across lines, which `pages/admin.js` was the first to need. Both are
fixed in the tool rather than by reflowing the source to suit it — a rule
saying "imports must fit on one line" is one nobody remembers, nothing
enforces, and that only fails at build time, long after the edit.

Four guards run on every build: nothing is still fetched, no `import`/`export`
survived, every module appears exactly once, and every module appears after
everything it imports.

⚠️ **Two things in the real source exist because of `file://`**, and must not
be "tidied away":

- `backend-local.js` checks `globalThis.__DEVI_DATA` before it fetches. The
  check lives in the real source rather than the bundler rewriting the
  function, so the served app and the single file run byte-identical code.
- `router.js` wraps `history.replaceState` in a `try`. A `file://` page has an
  **opaque origin**, where `replaceState` with a URL throws `SecurityError`.
  Unhandled, `paint()` is never reached — so changing a sort or a price filter
  does nothing at all, silently. The fallback costs one history entry, which
  was the only thing `replaceState` was buying.

⚠️ **The single file has been verified over `http://` only.** Every route, the
variant and coupon arithmetic and a 375px layout were driven in a browser, and
the build guards prove nothing is fetched — but this machine's browser pane
refuses both a `file://` navigation and a sandboxed frame, so the opaque-origin
path is reasoned about, not measured. Open it once on a phone before sending it
to anyone.

---

## Verification

```bash
perl tools/check.pl
```

Nine checks. **Each one was proved by breaking the code and watching it fail**,
not by passing on a clean tree.

| script | catches |
|---|---|
| `data.pl` | ids, slugs, subcategory parentage, whole rupees, `price <= mrp`, derived badges not stored, voucher/goods shape, coupon shape, every `fromShop` path, every declared image on disk. **Fails while `placeholder` is true**, on a demo UPI id on a real handle, and on `gateway.live` with no server. Takes an optional path, so an admin export can be validated *before* it replaces anything. |
| `money.pl` | 500 random baskets plus six named cases — chiefly **(a)** a ₹2,199 basket with `DEVI10` keeps free shipping though the payable falls to ₹1,979. Also greps `domain.js` for the line that implements it, which is what would have caught kirana's bug. |
| `tokens.pl` | all three `:root` blocks in `tokens.css` only, identical sets, the two dark blocks byte-identical, `color-scheme` consistent, every `var()` resolves, no literal colour in a component rule. |
| `art.pl` | the same two rules over the 17 modules that emit markup — **the hole `tokens.pl` cannot see** — plus that all ten artwork tokens are identical in all three palettes. |
| `canon.pl` | the data files are already in the form the admin export produces. Without it the first export is a 2,700-line diff with no content and the catalogue is never reviewable again. `--write` fixes them. |
| `routes.pl` | every `#/…` literal resolves; every `#/c/` literal names a category and subcategory **that exist in categories.json**, because a dead slug still matches the route shape; every route has a section and exactly one registered screen; and **no shell module imports a page** — in either import form. |
| `honesty.pl` | the four forbidden claims; `setPaid` outside the admin; a gateway claim feeding `paid`; an order born in any state but `draft`; a login/signup/OTP route or screen; a `<form>` with an action; and that five load-bearing notices still exist *and* are still referenced. |
| `clock.pl` | date reads outside `domain.js`, closing three gaps kirana's `slots.pl` leaves; and that `domain.js` uses `hourCycle h23`, `Asia/Kolkata` and `formatToParts`. |
| `balance.pl` | unbalanced brackets and strings. **One loop with a context stack**, so a `${}` hole is ordinary code and every literal rule applies at every depth. A first version walked holes separately, missed a regex inside one (`.replace(/"/g, …)` in `art.js`) and reported an unclosed brace 180 lines earlier in a file that was fine. |

⚠️ **`data.pl` fails on a clean tree today, on purpose** — see below.

---

## Open, and owned by the user

- ⚠️ **`placeholder` is `true`, and `data.pl` FAILS while it is.** The brand
  story, every phone number, the address, the GSTIN and all 25 prices are
  **invented** — realistic, not real. That flag makes shipping them impossible
  rather than merely inadvisable. A phone number that does not dial is the
  worst thing to ship by accident on a real business's site.

  **To clear it:** fill in `contact` in `app/data/shop.json`, check the prices,
  set `placeholder` to false. `data.pl` then checks every contact field is
  non-empty.

  Until it is filled in, the order handoff shows only **Copy the text** and
  says why — there is genuinely nowhere for a WhatsApp or a `tel:` link to go.

- **Prices are illustrative.** Realistic 2026 Indian lifestyle pricing, but
  anyone in the trade will spot a wrong dohar price instantly. The admin's
  catalogue tab is now the fastest way to correct them — edit, then export and
  commit. A `pricelist.pl` / `setprice.pl` round trip like kirana's would still
  beat it for a bulk pass over all 54.

- ⚠️ **Hash routes do not rank in search.** Fragments are not sent to the
  server and are poorly crawled. Real SEO needs server-side rendering or a
  prerender build, and there is neither. Written down here rather than
  discovered in month three.

- **The admin's order board shows this browser's orders only.** Two tabs side
  by side make it look like it works, which is exactly why the board carries a
  permanent strip saying a customer ordering on their own phone never appears
  there — it reaches you on WhatsApp.

- **There are no gift vouchers and nothing is bulky in the catalogue today**,
  but both branches are still live in the code and in `shop.json`. The two
  `money.pl` cases that cover them use SYNTHETIC products, deliberately:
  they used to point at a gift card and a stool, and when those were
  delisted `totals()` skipped the unknown id and the suite went on
  reporting green while testing nothing. `totals()` now **dies** on an
  unknown product id. If vouchers come back, the PDP still says DEVI
  issues the code by hand — an auto-generated code nothing can honour is
  worse than no sale. The voucher terms, and the gift-card line in the
  returns policy, came out of `pages.json` on 4 November 2026; both are in
  git history.

- **The wordmark is live text, not outlined paths.** A trade made knowingly:
  outlines would not reflow when Cormorant arrives, but live text stays
  selectable and readable by a screen reader, and it is two lines rather than a
  wall of hand-corrected path data nobody can edit. The Georgia fallback is
  metrically close. If the swap is ever visible on a slow connection,
  converting those two lines to outlines is the fix.

- **Still to check by hand**: the site on a real phone rather than an emulated
  viewport, and that a `tel:` link dials once a real number is in.
