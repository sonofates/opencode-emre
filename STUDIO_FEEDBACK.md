# Studio feedback log

Personal use journal for OpenCode Studio. Drop a line whenever something
frustrates you, surprises you, or feels missing. The goal is to come back
in ~2 weeks with a real prioritised list — not the brainstorm we'd write
without usage data.

How to use this file:
- One bullet per friction. No formatting nazi-ness.
- If it stops you from working, prefix with `‼` so it's easy to find later.
- If you're not sure if it matters, write it anyway. Filter when triaging.
- Keep dates so we know how often something hits.

---

## Bugs / breakage

<!-- crash, wrong rendering, "this should work but doesn't" -->

- _(no entries yet)_

## Missing features I actually wanted

<!-- something you reached for and it wasn't there. NOT brainstorm-tier "would be cool" — only things that interrupted real work. -->

- _(no entries yet)_

## Ergonomics / annoyances

<!-- "had to click 3 times", "wrong default", "wish this lived elsewhere" -->

- _(no entries yet)_

## Performance / cost surprises

<!-- session got slow, token bill higher than expected, cache didn't seem to hit -->

- _(no entries yet)_

## Model / provider observations

<!-- "DeepSeek lost track here", "Kimi rambled on this prompt", "Claude was great at X" — only real instances, not vibes -->

- _(no entries yet)_

## Audit mode in practice

<!-- did it produce useful reports? did permission profile leak? did it drift into edits? -->

- _(no entries yet)_

## Things that worked surprisingly well

<!-- worth noting so we don't accidentally regress them. -->

- _(no entries yet)_

---

## Triage cadence

- First check-in: 1 week from `studio-v0.2.1` ship date
- Real triage session: 2 weeks
- At triage: re-rank brainstorm ideas (per-model presets, parallel batching,
  LSP, modes) against this file. Anything not here gets parked.

---

## Releases

Append-only build log. Each entry: what shipped, why, and what's next.
New on top.

### v0.5 · 2026-04-25 · Demo builder gets a component library

**What shipped (no Studio code change — skill + workspace only):**
- `~/Demos/components/` — 11-piece hand-built Nest-grade snippet
  library (header-3row · hero-slider · hero-split · promo-banner-row
  · category-tiles · deals-carousel · product-grid · trust-counter
  · brand-marquee · newsletter-banner · footer-full) plus
  `harness.html` for visual preview and `README.md` composition
  guide.
- `~/Demos/scripts/quality-gate.sh` — 10 deterministic grep checks
  (scroll-reveal coverage, motion strips, counters, clickable
  products, footer SVGs, no placeholders, sticky header, no
  `<marquee>`, section density). Exit 1 = deploy blocked.
- `demo-builder` skill bumped to **v0.5** with frontmatter version
  field, mandatory `components/README.md` read for e-commerce, the
  new quality-gate workflow step, and a "never mark a todo
  completed before the work is verifiably done" rule (small models
  over-claimed in v0.3/v0.4).
- `DESIGN_SYSTEM.md` "Single index.html" rule **dropped** for
  e-commerce — demos may now ship `product/<slug>.html` and
  optional `category/<slug>.html`. Still pure static HTML, no
  build step.

**Why we built a component library:**
Three demo iterations of `grand-bazaar-grocery` (v1 → v3). Each
DESIGN_SYSTEM tightening produced ~10% quality bump but the demos
still felt flat vs the Nest WordPress reference. Diagnosed:
1. Kimi K2.6 / DeepSeek V4 do minimum-viable when the spec says
   "at least one X". They satisfy the letter, not the spirit.
2. Single-index constraint blocked clickable products → the demo
   had nowhere to "go".
3. Inline AI generation of 1500-line HTML in 8 minutes raced and
   the racing killed polish.

The library moves polish *out* of generation time. The agent now
COMPOSES proven snippets instead of re-inventing markup under
budget pressure. v0.5 is a structural fix, not a prompt fix.

**Studio code unchanged.** No `.app` rebuild for v0.5. Tag
`studio-v0.5.0` exists for repo continuity, but the binary is
still v0.4.0. The skill hot-loads from
`~/.claude/skills/demo-builder/SKILL.md` so users get the new
workflow on the next demo run.

**Test plan:** slug `grand-bazaar-grocery-v4`, same English-only
intake as v3, sector `e-commerce`, accent `#D97706`. Compare URLs
side-by-side (v1 → v4). v4 should clearly read as Nest-grade, not
brochure-grade. Next ratchet if it still feels flat: image quality
(move from Unsplash placeholders to per-demo Replicate generations).

**Carryovers:**
- Promote `grand-bazaar-grocery-v4` to `~/Demos/EXAMPLES/` if it
  ships clean (the first true v0.5-grade reference demo).
- Service-sector component library (home-services / contractor /
  beauty-salon / restaurant) — same idea, different snippets.
- Auto-mirror selected `~/Demos/` files into the repo for tracking
  (`DESIGN_SYSTEM`, `components/`, `scripts/`) so future
  contributors can read them from the codebase, not the user's
  home.
