# OpenCode Studio — backlog

Backlog, roadmap değil. Her madde "yapmak isterse yaparım"; "yapmalıyım"
değil. Yarın bir madde gereksiz görünürse rahatça düşer.

Tüm scope (~28 saat work) 8 sürüme bölündü. Her faz kapanınca tagged
release çıkıyor. Sıra zorunlu değil — Faz 1 her zaman ilk (foundation),
sonrası ihtiyaca göre yeniden sıralanabilir.

## Faz 1 — Foundation & speed `studio-v0.4.2` (~2 saat)

| # | İş | Effort |
|---|---|---|
| 1A | Lag profile + fix — Activity Monitor + DevTools recording, root cause, patch | 1.5 saat |
| 1B | Build/dev watch script — kod değişince auto-rebuild + reinstall, döngü 90sn → 15sn | 30 dk |

## Faz 2 — Multi-session backbone `studio-v0.5.0` (~10 saat)

| # | İş | Effort |
|---|---|---|
| 2A | Session tabs — TabContainer + drag/drop + URL routing rewrite + suspended-session memory pattern (8GB için kritik). Tahmin iyimser olabilir, 8-10 saat realistic. | 8-10 saat |
| 2B | Background tab badges — hangi tab'da tool çalışıyor / yeni mesaj var | 30 dk |
| 2C | Smart paste auto-fold — >50 satır yapıştırınca collapsible block | 30 dk |

## Faz 3 — Cost & usage `studio-v0.5.1` (~3.5 saat)

| # | İş | Effort |
|---|---|---|
| 3A | Inline cost meter — prompt input altında turn / session / today | 45 dk |
| 3B | Cost dashboard — gün × hafta × ay × project × model breakdown | 1.5 saat |
| 3C | Multi-model routing — trivial → Haiku, complex → Opus, otomatik %30+ tasarruf | 1-1.5 saat |
| 3D | Token saver mode — budget'a yaklaşırken auto-aggressive compaction | 30 dk |

## Faz 4 — Agent ekosistemi `studio-v0.5.2` (~3 saat)

| # | İş | Effort |
|---|---|---|
| 4A | Subagent activity dashboard — sağ panel "Agents" sekmesi, canlı subagent listesi | 1.5 saat |
| 4C | Agent quick-switch ⌘⇧A — palette tarzı agent picker | 45 dk |
| 4D | Context tab implementation — token usage live + cost + active model + attached files | 45 dk |
| 4E | Tasks panel skill-driven badge — manuel todowrite vs skill-emitted ayrımı | 30 dk |

## Faz 5 — Real-time flow `studio-v0.5.3` (~2.75 saat)

| # | İş | Effort |
|---|---|---|
| 5A | Tool result streaming — bash/edit/grep gerçek zamanlı progress | 1 saat |
| 5B | Inline diff viewer — edit uygulanmadan önce preview | 1 saat |
| 5D | Skill picker UI ⌘⇧S — skill'leri ara/çağır popup | 45 dk |

## Faz 6 — Power user polish `studio-v0.6.0` (~1.75 saat)

| # | İş | Effort |
|---|---|---|
| 6B | Pin messages — uzun session'larda önemli mesajları sticky | 45 dk |
| 6C | Search in chat history — full-text, ⌘F + ⌘⇧F (cross-session) | 1 saat |

## Faz 7 — Quality of life `studio-v0.6.1` (~1.5 saat)

| # | İş | Effort |
|---|---|---|
| 7A | Auto-archive old sessions — 30+ gün eski sessions disk'e archive (8GB için critical) | 45 dk |
| 7B | Drag&drop file attachments — finder'dan drop → context attached | 45 dk |

## Bonus — Küçük zaferler `studio-v0.6.2` (~3.5 saat)

| # | İş | Effort |
|---|---|---|
| B1 | Smart truncation — uzun bash output agent görmeden kısalt + cache file path ver | 45 dk |
| B2 | Permission audit log — yolo mode'da neler approved oldu, sonradan review | 45 dk |
| B3 | Demo gallery sidebar — ~/Demos thumbnail + "tekrar üret" buton | 1 saat |
| B4 | Inline image preview — `<img src>` veya screenshot path otomatik render | 30 dk |
| B5 | Bash output search — uzun output'ta inline search bar | 30 dk |

## Toplam

```
28 madde kaldı (17 madde kesildi → daha iyi roadmap)
~28 saat work
8 tagged release: v0.4.2 → v0.6.2
```

## Atlanan maddeler ve sebepleri

Backlog'a girmeyenler — istersen sonra tekrar değerlendir:

- **Multi-window support** — tek monitör + 8GB, gerçek hayatta kullanmıyor
- **Subagent chain visualization** — şıklık var, actionable değil; dashboard yeter
- **Session export** — sıklığı sıfır
- **Vim mode** — vim user değil
- **Theme variants** — amber'den memnun
- **Custom keybindings UI** — JSON edit yeter
- **Workspace presets** — workspace switch nadir
- **A/B test mode** — günlük kullanım sıfıra yakın
- **Plugin/skill marketplace UI** — tek kullanıcı
- **Settings cloud sync** — tek makine
- **Onboarding tour** — kendi yapıyor
- **Voice input** — istemedi
- **Slash commands** — kullanmıyor
- **Quick redo / Project switcher / Speed dial / Stats widget / Diff stats** — nice-to-have, real ROI yok

## Ship discipline

- Her faz kendi commit + tag'i ile kapanır
- `STUDIO_FEEDBACK.md` her sürümde release entry ekler
- Faz arası çalıştırılan demo'lar `~/Demos/STUDIO_FEEDBACK_RELEASES.md`'de smoke-test gibi loglanabilir (opsiyonel)
- Her faz başında `git fetch` + status + divergence kontrolü zorunlu
