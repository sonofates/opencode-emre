# OpenCode → "Emre IDE Edition" — Implementation Plan

**Hedef:** OpenCode.app'i Cursor + Claude Desktop arası bir görünüm + Plan/Task & MD preview paneli ile yeni bir binary olarak paketlemek.

**Stratji:** Fork (MIT lisans). Mevcut workspace/sohbet verileri **dokunulmaz** (`~/Library/Application Support/OpenCode/` ayrı yer). Yedek alınacak.

---

## 1. Stack Özeti (gerçek tespit)

| Katman | Teknoloji | Yer |
|---|---|---|
| UI Framework | **SolidJS** 1.9 | `packages/app/src/` |
| Styling | **Tailwind CSS** 4.1 | aynı |
| Build | **Vite** 7.1 | `vite.config.ts` |
| Component lib | shared `@opencode-ai/ui` | `packages/ui/src/components/` |
| Desktop wrapper | **Electron** (`electron-vite` + `electron-builder`) | `packages/desktop-electron/` |
| MD render | `marked` + `marked-shiki` | (zaten kurulu) |
| Syntax highlight | `shiki` 3.20 | (zaten kurulu) |
| Reactive state | SolidJS signals + Context API | `packages/app/src/context/` |

**Build komutu:** `bun --cwd packages/desktop-electron package:mac` → `.dmg` + `.app` çıkar

---

## 2. Hedef Layout (Hibrit C — onaylı)

```
┌─────────────────────────────────────────────────────────────┐
│ TitleBar (mevcut, sadece renk tweak)                         │
├──┬──────────────┬──────────────────────┬──────────────────┤
│💬│              │                        │                  │
│📂│  Sidebar 2   │   Ana Konuşma Alanı   │  Plan & Tasks    │
│🔍│  (chat list, │                        │  + MD Preview    │
│⚙️│   files,     │   user: ...           │  (toggle: ⌘J)    │
│  │   settings)  │   assistant: ...      │                  │
│📋│              │                        │  ## Plan          │
│  │              │   ┌──────────────────┐│  ✓ Adım 1        │
│  │              │   │ Ask anything... ││  → Adım 2         │
│  │              │   └──────────────────┘│  ☐ Adım 3        │
│  │              │                        │                  │
│  │              │                        │  📄 Live MD       │
│  │              │                        │  ```             │
│  │              │                        │  preview...     │
└──┴──────────────┴────────────────────────┴──────────────────┘
│ [git: main] [DeepSeek V4 Pro] [tokens 28%] [$2.69]            │
└────────────────────────────────────────────────────────────────┘
   └── Status Bar (yeni)
```

**Klavye kısayolları:**
- `⌘B` — Sidebar 2 toggle (chat list/files)
- `⌘J` — Plan/Task & MD preview panel toggle
- `⌘I` — Context (analytics) popover
- `⌘K` — Komut paleti (mevcut)

---

## 3. Yapılacak Değişiklikler — Dosya Bazlı

### 3.1 Activity Bar (yeni)
**Dosya:** `packages/app/src/components/activity-bar.tsx` *(yeni)*
- 5 ikon: 💬 Chat, 📂 Files, 🔍 Search, 📋 Tasks, ⚙️ Settings
- Aktif tab state → Layout context'e bağla
- Solid Kobalte `Tabs` veya kendi state ile

**CSS:** `packages/app/src/components/activity-bar.css` *(yeni)*

### 3.2 Sidebar 2 (modüler)
**Dosya:** `packages/app/src/components/sidebar.tsx` *(yeni)*
- Activity Bar'daki seçime göre içerik değişir:
  - **Chat mode** → mevcut `session/session-list.tsx` (varsa) veya yeni
  - **Files mode** → mevcut `file-tree.tsx`
  - **Search mode** → search input + sonuç listesi
  - **Settings mode** → mevcut `settings-list.tsx`
- ⌘B ile gizle/göster (Layout context'te `sidebarOpen` signal)

### 3.3 Layout Context Güncelleme
**Dosya:** `packages/app/src/context/layout.tsx` *(düzenle)*
- Yeni state'ler ekle:
  ```ts
  activityTab: 'chat' | 'files' | 'search' | 'tasks' | 'settings'
  sidebarOpen: boolean
  rightPanelOpen: boolean
  rightPanelTab: 'tasks' | 'preview' | 'context'
  ```

### 3.4 Plan & Task Paneli (yeni)
**Dosya:** `packages/app/src/components/right-panel/tasks-view.tsx` *(yeni)*
- Mevcut session'daki tool calls'ları yakala
- Özellikle `TodoWrite`, `Plan`, markdown checklist'leri parse et
- Component:
  ```tsx
  <TaskList>
    <Task status="done">Veriyi analiz et</Task>
    <Task status="active">Code yaz</Task>
    <Task status="pending">Test et</Task>
  </TaskList>
  ```
- Reactive: AI yeni todo eklediğinde otomatik update (SolidJS signal)

### 3.5 MD Live Preview (yeni)
**Dosya:** `packages/app/src/components/right-panel/md-preview.tsx` *(yeni)*
- Mevcut session'da AI'nın yazdığı `.md` dosyalarını dinle
- `marked` ile render et (zaten kurulu)
- Tab: aktif dosyalar arası geçiş (eğer birden fazla varsa)
- Auto-scroll: yeni eklenen satıra

### 3.6 Right Panel Container (yeni)
**Dosya:** `packages/app/src/components/right-panel/index.tsx` *(yeni)*
- 3 sekme: **Tasks** | **Preview** | **Context (analytics)**
- ⌘J ile aç/kapa
- Üst köşede sekme switcher

### 3.7 Status Bar (yeni)
**Dosya:** `packages/app/src/components/status-bar.tsx` *(yeni)*
- Sol: workspace adı + git branch (varsa, `simple-git` veya CLI ile)
- Orta: aktif model adı (mevcut `models` context'ten)
- Sağ: token kullanımı + cost ($/session)
- Tıklayınca → Context popover (⌘I)

### 3.8 Context Popover (mevcut Context panel → popover)
**Dosya:** `packages/app/src/components/dialog-context.tsx` *(yeni)*
- Mevcut "Context" panelindeki bilgileri tek dialog'a topla
- ⌘I ile aç
- Status bar'dan tıklanınca da aç

### 3.9 Ana Layout Düzenleme
**Dosya:** `packages/app/src/app.tsx` *(düzenle)*
- Mevcut layout'ı yeni component'lerle değiştir:
  ```tsx
  <Layout>
    <TitleBar />
    <ActivityBar />
    <Sidebar />        {/* mode switcher */}
    <MainContent />    {/* mevcut session view */}
    <RightPanel />     {/* tasks/preview/context */}
    <StatusBar />
  </Layout>
  ```

### 3.10 Tema (renkler)
**Dosya:** `packages/app/src/index.css` *(düzenle)*
- Tailwind theme extend:
  ```css
  /* Cursor benzeri dark + Claude'un sıcaklığı */
  --color-bg-primary: #18181b;     /* zinc-900 */
  --color-bg-secondary: #27272a;   /* zinc-800 */
  --color-bg-tertiary: #3f3f46;    /* zinc-700 */
  --color-accent: #f59e0b;          /* amber-500 (Claude vibe) */
  --color-accent-hover: #fbbf24;
  --color-text-primary: #fafafa;
  --color-text-secondary: #a1a1aa;
  --color-border: #3f3f46;
  ```

### 3.11 Kısayollar
**Dosya:** `packages/app/src/context/command.tsx` *(düzenle)*
- ⌘B → `toggleSidebar()`
- ⌘J → `toggleRightPanel()`
- ⌘I → `openContextDialog()`

### 3.12 Branding (opsiyonel)
**Dosya:** `packages/desktop-electron/electron-builder.config.ts` *(düzenle)*
- App name: `OpenCode-Emre` (kendi `.app` olsun, mevcut'la çakışmasın)
- Bundle ID: `ai.opencode.desktop.emre` (TCC izinleri ayrı kalsın)
- Icon: gerekirse değiştir

---

## 4. Build & Test Akışı

```bash
cd ~/Desktop/opencode-emre

# 1. Bağımlılıklar (~3-5 dk)
bun install

# 2. Dev mode (hot reload, test için)
bun run dev:desktop          # Electron + Vite dev
# veya
bun --cwd packages/desktop-electron dev

# 3. Production build
bun --cwd packages/desktop-electron build

# 4. .app + .dmg paketle (~3-5 dk)
bun --cwd packages/desktop-electron package:mac

# 5. Sonuç:
# packages/desktop-electron/dist/OpenCode-Emre-1.x.x-arm64.dmg
# packages/desktop-electron/dist/mac-arm64/OpenCode-Emre.app

# 6. Kuruluma kopyala
cp -r packages/desktop-electron/dist/mac-arm64/OpenCode-Emre.app /Applications/
```

---

## 5. Workspace Verileri Güvenliği

**ADIM 0 (her şeyden önce, otomatik yapacağım):**
```bash
# Tam yedek
cp -R "$HOME/Library/Application Support/OpenCode" \
      "$HOME/Library/Application Support/OpenCode.backup.$(date +%Y%m%d_%H%M%S)"
```

**Bundle ID stratejisi:**
- Yeni app **farklı bundle ID** ile (`ai.opencode.desktop.emre`)
- Bu sayede:
  - Mevcut OpenCode silinmez
  - Yeni app **yeni bir Application Support** klasörü kullanır (default)
  - **Veya** symlink ile mevcut workspaces'i yeni app'e bağlarız:
    ```bash
    ln -s "$HOME/Library/Application Support/OpenCode" \
          "$HOME/Library/Application Support/OpenCode-Emre"
    ```

**Sonuç:** İki app yan yana yaşar, biri çalışmazsa diğer hazır.

---

## 6. Risk Değerlendirmesi

| Risk | İhtimal | Önlem |
|---|---|---|
| SolidJS karmaşası | Düşük | React benzeri, `marked` zaten var |
| Tool calls'tan plan parse zor | Orta | Önce regex bazlı, sonra AST |
| Electron build hatası | Düşük | `electron-vite` standart, repo zaten build alıyor |
| Mevcut data bozulması | **Sıfır** | Bundle ID farklı, yedek alındı |
| Code signing eksiği | Orta | macOS "unsigned app" uyarısı verebilir → `xattr -cr` ile geçilir |
| Upstream değişikliklerinin çatışması | Orta | Branch'te çalış, periyodik rebase |

---

## 7. Süre Tahmini (gerçekçi)

| Aşama | Süre |
|---|---|
| 1. Repo install + dev mode test | 15 dk |
| 2. Activity Bar + Sidebar refactor | 1.5 sa |
| 3. Right panel container + tabs | 1 sa |
| 4. Tasks view (tool calls parse) | 1.5 sa |
| 5. MD preview | 1 sa |
| 6. Status bar | 30 dk |
| 7. Context popover | 30 dk |
| 8. Tema + spacing tweaks | 45 dk |
| 9. Kısayollar | 15 dk |
| 10. Build + package + install | 30 dk |
| **TOPLAM** | **~7-8 saat** |

**Aceleyle (sadece çalışan binary):** 4-5 saat
**Polish ile:** 8-10 saat

---

## 8. Karar Noktaları (sen onaylayacaksın)

1. **App ismi**: `OpenCode-Emre`? `OpenCode IDE`? `Emre Code`? — sen söyle
2. **Bundle ID**: yan yana yaşasın mı yoksa mevcuti **değiştirsin** mi?
3. **Workspaces**: yeni app de aynı verileri görsün mü (symlink) yoksa sıfırdan mı başlasın?
4. **Renkler**: amber accent uyar mı, yoksa farklı bir vurgu rengi mi (mavi, mor, yeşil)?
5. **İlk versiyon kapsamı**: 8 maddenin hepsi mi, yoksa sadece ana 4-5 (Activity Bar, Sidebar, Tasks panel, Status bar) mi?

---

## 9. Geri Dönüş Planı

Eğer beğenmezsen:
- Mevcut `/Applications/OpenCode.app` zaten **yerinde** duruyor (silmedim)
- Yeni app'i `/Applications/`'tan trash'e at, bitti
- Workspaces yedek hazır → `OpenCode.backup.xxx` rename ederek geri al
- Repo `~/Desktop/opencode-emre` kalır → istersen tut, istersen sil

---

## 10. Sıra Önerisi (eğer onaylarsan)

```
ADIM 1: bun install + dev mode    [15dk] → çalışır halde mevcut UI'ı görelim
ADIM 2: Activity Bar              [1sa]  → ilk görsel değişiklik
ADIM 3: Sidebar refactor          [30dk] → toggle çalışsın
ADIM 4: Status Bar                [30dk] → alt bar görünür
ADIM 5: Tema (renkler)            [45dk] → "vay be değişmiş" anı
[CHECKPOINT 1 — sana göstereyim]

ADIM 6: Right panel container     [1sa]
ADIM 7: Tasks view                [1.5sa]
ADIM 8: MD preview                [1sa]
ADIM 9: Context popover           [30dk]
[CHECKPOINT 2 — sana göstereyim]

ADIM 10: Build + package + install [30dk]
ADIM 11: Smoke test               [30dk]
[FINAL — yaşıyor mu görelim]
```

İki checkpoint'te sana ekran görüntüsü/build gösterip "iyi mi devam edelim mi" diye soracağım.

---

**Karar bekliyorum:**
- ✅ "Onayla, başla" → ADIM 1'den itibaren sırayla
- 🔧 "Şu maddeyi değiştir" → planı revize ederim
- 🎨 "Önce mockup göster" → 1-2 saat HTML mockup, sonra başlarız
