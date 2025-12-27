# 🎨 Design System Documentation

Modern, professional design system pro networking platformu s plnou podporou responzivity, dark mode a přístupnosti.

## 📱 Responzivita

### Breakpointy
```css
sm:  640px  /* Mobile landscape / Small tablets */
md:  768px  /* Tablets */
lg:  1024px /* Desktop */
xl:  1280px /* Large desktop */
2xl: 1536px /* Extra large desktop */
```

### Mobile-First Přístup
Design je optimalizovaný pro mobily s postupným vylepšováním pro větší displeje:

```jsx
// Mobile (default)
<div className="p-4">

// Tablet
<div className="p-4 md:p-6">

// Desktop
<div className="p-4 md:p-6 lg:p-8">
```

### Landscape Mode Optimalizace
Speciální úpravy pro landscape orientaci mobilů:

```css
/* Automaticky aplikováno při landscape a výšce < 600px */
.nav-mobile        /* Menší navigace */
.sidebar-mobile    /* Skrytý sidebar */
.content-landscape /* Menší padding */
```

### Touch Device Optimalizace
- **Minimální velikost touch targets**: 44x44px
- **Active states** místo hover pro dotykové displeje
- **Gestura podpora**: Swipe, dlouhý stisk, atd.

## 🎨 Barevná Paleta

### Primary (Modrá - hlavní barva)
```css
primary-50  až primary-950  /* LinkedIn-style modrá */
```

### Secondary (Teal - sekundární akcenty)
```css
secondary-50 až secondary-900
```

### Semantic Colors
```css
success-*  /* Zelená - úspěch, potvrzení */
warning-*  /* Žlutá - varování */
danger-*   /* Červená - chyby, smazání */
gray-*     /* Šedá - text, pozadí */
```

### Dark Mode
Automatická podpora dark mode:

```jsx
<div className="bg-white dark:bg-gray-800
                text-gray-900 dark:text-gray-50">
```

Aktivace dark mode:
```javascript
// Přidat class="dark" na <html> element
document.documentElement.classList.add('dark');
```

## 🔤 Typografie

### Font Stack
- **Primary**: Inter (Google Fonts) - moderní, čitelný
- **Fallback**: System fonts

### Font Sizes
```css
text-xs   /* 0.75rem - 12px */
text-sm   /* 0.875rem - 14px */
text-base /* 1rem - 16px */
text-lg   /* 1.125rem - 18px */
text-xl   /* 1.25rem - 20px */
text-2xl  /* 1.5rem - 24px */
text-3xl  /* 1.875rem - 30px */
text-4xl  /* 2.25rem - 36px */
```

### Využití
```jsx
<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
<p className="text-sm md:text-base text-gray-600">
```

## 🎯 Komponenty

### Buttons

#### Varianty
```jsx
// Primary - hlavní CTA
<button className="btn-primary">
  Odeslat
</button>

// Secondary - vedlejší akce
<button className="btn-secondary">
  Zrušit
</button>

// Outline - terciární akce
<button className="btn-outline">
  Více info
</button>

// Ghost - minimalistická akce
<button className="btn-ghost">
  <Icon /> Upravit
</button>
```

#### Velikosti
```jsx
<button className="btn-primary btn-sm">Malé</button>
<button className="btn-primary">Normální</button>
<button className="btn-primary btn-lg">Velké</button>
```

#### Stavy
```jsx
<button className="btn-primary" disabled>
  Načítání...
</button>

<button className="btn-primary hover:bg-primary-700 active:scale-95">
  Interaktivní
</button>
```

### Cards

#### Základní Card
```jsx
<div className="card p-6">
  <h3 className="text-lg font-semibold mb-2">Nadpis</h3>
  <p className="text-gray-600 dark:text-gray-400">Obsah...</p>
</div>
```

#### Interaktivní Card
```jsx
<div className="card-hover p-6">
  <h3>Klikatelná karta</h3>
</div>

<div className="card-interactive p-6">
  <h3>Karta s scale efektem</h3>
</div>
```

### Inputs

#### Text Input
```jsx
<input
  type="text"
  className="input"
  placeholder="Zadejte text..."
/>
```

#### Input se stavem
```jsx
// Chyba
<input className="input input-error" />
<p className="text-sm text-danger-600 mt-1">Chybová zpráva</p>

// Úspěch
<input className="input input-success" />
```

### Badges

```jsx
<span className="badge-primary">Primary</span>
<span className="badge-success">Aktivní</span>
<span className="badge-warning">Čeká</span>
<span className="badge-danger">Smazáno</span>
<span className="badge-gray">Draft</span>
```

### Links

```jsx
<a href="#" className="link">
  Odkaz s hover efektem
</a>
```

## 🎬 Animace

### Základní Animace
```jsx
// Fade in
<div className="animate-fade-in">

// Slide up
<div className="animate-slide-up">

// Scale in
<div className="animate-scale-in">
```

### Komplexní Animace
```jsx
// Pulse
<div className="animate-pulse-soft">

// Shimmer (loading efekt)
<div className="relative overflow-hidden">
  <div className="animate-shimmer bg-shimmer">
</div>

// Shake (chybový stav)
<div className="animate-shake">
```

### Přechody
```jsx
<button className="transition-all duration-200 hover:scale-105">
  Smooth hover
</button>
```

## 💀 Skeleton Loading

```jsx
// Text skeleton
<div className="skeleton-text" />

// Title skeleton
<div className="skeleton-title" />

// Avatar skeleton
<div className="skeleton-avatar" />

// Custom skeleton
<div className="skeleton h-20 w-full rounded-lg" />
```

## 🌟 Speciální Efekty

### Glass Morphism
```jsx
<div className="glass p-6 rounded-xl">
  Průhledný blur efekt
</div>
```

### Gradient Text
```jsx
<h1 className="text-gradient text-4xl font-bold">
  Gradient nadpis
</h1>
```

### Custom Shadows
```jsx
<div className="shadow-card">Jemný stín</div>
<div className="shadow-hover">Hover stín</div>
<div className="shadow-elevated">Zvýšený stín</div>
<div className="shadow-glass">Skleněný efekt</div>
```

## 📐 Layout Patterns

### Container
```jsx
<div className="container-responsive">
  <!-- max-width 7xl, responsive padding -->
</div>
```

### Grid Layout
```jsx
// Responzivní grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="card">1</div>
  <div className="card">2</div>
  <div className="card">3</div>
</div>
```

### Flexbox Layout
```jsx
<div className="flex flex-col md:flex-row gap-4">
  <aside className="w-full md:w-64">Sidebar</aside>
  <main className="flex-1">Content</main>
</div>
```

## 📱 Mobile-Specific Components

### Bottom Navigation (Mobile)
```jsx
<nav className="mobile-bottom-nav">
  <button className="touch-target">Home</button>
  <button className="touch-target">Search</button>
  <button className="touch-target">Profile</button>
</nav>
```

### Mobile Modal
```jsx
<div className="mobile-modal">
  <div className="safe-top p-4">
    <!-- Content s safe area pro notch -->
  </div>
</div>
```

## 🎨 LinkedIn-Style Příklady

### Profile Card
```jsx
<div className="card p-6 hover:shadow-hover transition-shadow">
  <div className="flex items-start gap-4">
    <div className="skeleton-avatar flex-shrink-0" />
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Jan Novák
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Senior Developer at Company
      </p>
      <div className="flex gap-2 mt-3">
        <button className="btn-primary btn-sm">Connect</button>
        <button className="btn-ghost btn-sm">Message</button>
      </div>
    </div>
  </div>
</div>
```

### Job Card
```jsx
<div className="card-hover p-6">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <h3 className="text-xl font-semibold mb-2">Frontend Developer</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-2">
        Company Name • Prague, Czech Republic
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="badge-primary">React</span>
        <span className="badge-primary">TypeScript</span>
        <span className="badge-success">Remote</span>
      </div>
      <p className="text-sm text-gray-500">Posted 2 days ago</p>
    </div>
    <button className="btn-ghost">
      <svg className="w-6 h-6"><!-- Bookmark icon --></svg>
    </button>
  </div>
</div>
```

### Feed Post
```jsx
<article className="card p-6">
  <header className="flex items-center gap-3 mb-4">
    <div className="skeleton-avatar" />
    <div>
      <h4 className="font-semibold">User Name</h4>
      <p className="text-sm text-gray-500">Software Engineer • 2h</p>
    </div>
  </header>
  <div className="mb-4">
    <p className="text-gray-900 dark:text-gray-100">
      Post content goes here...
    </p>
  </div>
  <footer className="flex gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
    <button className="btn-ghost btn-sm">
      <svg className="w-5 h-5 mr-1"><!-- Like icon --></svg>
      Like
    </button>
    <button className="btn-ghost btn-sm">
      <svg className="w-5 h-5 mr-1"><!-- Comment icon --></svg>
      Comment
    </button>
    <button className="btn-ghost btn-sm">
      <svg className="w-5 h-5 mr-1"><!-- Share icon --></svg>
      Share
    </button>
  </footer>
</article>
```

## ♿ Přístupnost

### Focus States
Všechny interaktivní prvky mají viditelné focus states:
```jsx
<button className="focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
```

### Color Contrast
- **WCAG AA**: Minimální poměr kontrastu 4.5:1 pro běžný text
- **WCAG AAA**: Poměr kontrastu 7:1 pro důležitý text

### Reduced Motion
Respektuje uživatelské preference:
```css
@media (prefers-reduced-motion: reduce) {
  /* Minimální/žádné animace */
}
```

### Screen Readers
```jsx
<button aria-label="Close modal">
  <svg aria-hidden="true"><!-- Icon --></svg>
</button>
```

## 🖨️ Print Styles

```jsx
<header className="no-print">
  <!-- Skryto při tisku -->
</header>

<div className="hidden print-only">
  <!-- Viditelné pouze při tisku -->
</div>
```

## 🎯 Best Practices

### 1. Mobile-First
```jsx
// ✅ Correct
<div className="p-4 md:p-6 lg:p-8">

// ❌ Wrong
<div className="lg:p-8 md:p-6 p-4">
```

### 2. Semantic HTML
```jsx
// ✅ Correct
<article className="card">
  <header>
    <h2>Title</h2>
  </header>
</article>

// ❌ Wrong
<div className="card">
  <div>
    <div className="text-xl font-bold">Title</div>
  </div>
</div>
```

### 3. Dark Mode
```jsx
// ✅ Always specify dark mode variant
<div className="bg-white dark:bg-gray-800">

// ❌ Missing dark mode
<div className="bg-white">
```

### 4. Touch Targets
```jsx
// ✅ Minimum 44x44px
<button className="min-h-[44px] min-w-[44px] touch-target">

// ❌ Too small
<button className="p-1">
```

### 5. Loading States
```jsx
// ✅ Show skeleton while loading
{loading ? (
  <div className="skeleton h-20 w-full" />
) : (
  <Content />
)}

// ❌ No loading state
{data && <Content />}
```

## 📊 Performance

### GPU Acceleration
```jsx
<div className="transform-gpu transition-transform hover:scale-105">
```

### Will-change
Používáno automaticky v `transform-gpu` utility.

### Lazy Loading
```jsx
<img
  loading="lazy"
  className="w-full h-auto"
/>
```

## 🔧 Utility Classes

### Text Utilities
```css
.text-balance      /* Optimální zalamování textu */
.line-clamp-1      /* Oříznutí na 1 řádek */
.line-clamp-2      /* Oříznutí na 2 řádky */
.line-clamp-3      /* Oříznutí na 3 řádky */
```

### Scroll Utilities
```css
.scrollbar-hide    /* Skrytý scrollbar */
.scroll-smooth     /* Plynulé scrollování */
```

### Safe Area
```css
.safe-top         /* Padding pro notch nahoře */
.safe-bottom      /* Padding pro home indicator */
```

## 🌍 Internacionalizace

Font Inter podporuje rozšířené znakové sady:
- Latina (základní a rozšířená)
- **Čeština**: Plná podpora (á, č, ď, é, ě, í, ň, ó, ř, š, ť, ú, ů, ý, ž)
- Kyrilice
- Řečtina

## 📈 Metrics

### Design Tokens
```javascript
// Spacing scale: 4px base
spacing: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96...]

// Border radius
rounded-sm: 6px
rounded-md: 8px
rounded-lg: 12px
rounded-xl: 16px
rounded-2xl: 20px
rounded-3xl: 24px

// Shadows
shadow-card: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)
shadow-hover: 0 4px 12px rgba(0,0,0,0.15)
shadow-elevated: 0 8px 24px rgba(0,0,0,0.12)
```

## ✨ Summary

Design systém poskytuje:
- ✅ **Plnou responzivitu** - Mobile, tablet, desktop, landscape
- ✅ **Dark mode** - Automatická podpora
- ✅ **Moderní animace** - Fade, slide, scale, shimmer
- ✅ **Přístupnost** - WCAG AA, reduced motion, screen readers
- ✅ **Professional components** - LinkedIn/Indeed-style
- ✅ **Touch optimalizace** - 44px targets, gestures
- ✅ **Performance** - GPU acceleration, lazy loading
- ✅ **Print styles** - Optimalizováno pro tisk

Připraveno pro produkci! 🚀
