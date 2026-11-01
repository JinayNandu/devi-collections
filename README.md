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

## Publishing

`docs/` is the published site: one self-contained HTML file holding every
stylesheet, all 25 modules and the whole catalogue.

```bash
perl tools/mksingle.pl            # regenerate docs/index.html
```

It is generated — never edit it by hand. Serve it with GitHub Pages
(*Settings → Pages → main → /docs*) or drop the folder on any static host.
