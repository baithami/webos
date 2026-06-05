# STYLE_GUIDE.md — WebOS Design System

> Claude Code references this for all styling decisions.
> Never hardcode values that appear here — always use the CSS variable or Tailwind token.

---

## Typography

```css
/* System font stack — mimics macOS */
font-family: 'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont,
  'Helvetica Neue', Helvetica, Arial, sans-serif;

/* Monospace — Terminal, TextEdit code mode */
font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace;
```

| Role | Size | Weight |
|---|---|---|
| Menu bar text | 13px | 400 |
| Dock label | 11px | 500 |
| Window title | 13px | 600 |
| Body / app content | 14px | 400 |
| Spotlight input | 22px | 300 |
| System alert | 13px | 400 |

---

## Color Tokens

Define all of these in `globals.css` as CSS custom properties.

```css
:root {
  /* Desktop */
  --color-desktop-bg: #1c1c1e;
  --color-menubar-bg: rgba(30, 30, 30, 0.72);
  --color-dock-bg: rgba(255, 255, 255, 0.18);

  /* Window chrome */
  --color-window-bg: rgba(28, 28, 30, 0.85);
  --color-window-border: rgba(255, 255, 255, 0.12);
  --color-window-titlebar: rgba(44, 44, 46, 0.9);
  --color-window-shadow: rgba(0, 0, 0, 0.5);

  /* Traffic lights */
  --color-close: #ff5f57;
  --color-minimize: #febc2e;
  --color-fullscreen: #28c840;

  /* Text */
  --color-text-primary: rgba(255, 255, 255, 0.92);
  --color-text-secondary: rgba(255, 255, 255, 0.55);
  --color-text-tertiary: rgba(255, 255, 255, 0.28);

  /* Accent (user-selectable, default blue) */
  --color-accent: #0a84ff;
  --color-accent-hover: #409cff;

  /* Sidebar */
  --color-sidebar-bg: rgba(44, 44, 46, 0.7);
  --color-sidebar-active: rgba(255, 255, 255, 0.1);

  /* Spotlight */
  --color-spotlight-bg: rgba(40, 40, 40, 0.88);
  --color-spotlight-border: rgba(255, 255, 255, 0.1);
}

/* Light mode overrides */
[data-theme="light"] {
  --color-desktop-bg: #e8e8ed;
  --color-menubar-bg: rgba(236, 236, 241, 0.82);
  --color-dock-bg: rgba(200, 200, 210, 0.55);
  --color-window-bg: rgba(242, 242, 247, 0.92);
  --color-window-border: rgba(0, 0, 0, 0.08);
  --color-window-titlebar: rgba(230, 230, 235, 0.95);
  --color-text-primary: rgba(0, 0, 0, 0.88);
  --color-text-secondary: rgba(0, 0, 0, 0.5);
  --color-text-tertiary: rgba(0, 0, 0, 0.25);
  --color-sidebar-bg: rgba(215, 215, 220, 0.75);
}
```

---

## Glass Effect Mixin

Apply to: menu bar, dock, windows, panels, spotlight, notification center.

```css
.glass {
  background: var(--color-window-bg);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--color-window-border);
}
```

---

## Shadows

```css
/* Window drop shadow */
.window-shadow {
  box-shadow: 0 22px 70px 4px rgba(0, 0, 0, 0.56),
              0 0 0 1px rgba(255, 255, 255, 0.06);
}

/* Dock shadow */
.dock-shadow {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Menu bar shadow */
.menubar-shadow {
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06);
}
```

---

## Accent Color Options

Provide these 8 options in Settings:

| Name | Hex |
|---|---|
| Blue (default) | `#0a84ff` |
| Purple | `#bf5af2` |
| Pink | `#ff375f` |
| Red | `#ff453a` |
| Orange | `#ff9f0a` |
| Yellow | `#ffd60a` |
| Green | `#32d74b` |
| Graphite | `#98989d` |

---

## Animation Tokens (Framer Motion)

```ts
// Standard window open
export const windowOpenVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, scale: 0.96, y: 4, transition: { duration: 0.12 } },
}

// Dock icon bounce on launch
export const dockBounceVariants = {
  bounce: { y: [0, -18, 0, -9, 0], transition: { duration: 0.5, times: [0, 0.3, 0.55, 0.75, 1] } },
}

// Spotlight slide in
export const spotlightVariants = {
  hidden: { opacity: 0, y: -12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.12 } },
}

// Notification slide in from top-right
export const notificationVariants = {
  hidden: { opacity: 0, x: 60, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, x: 60, transition: { duration: 0.15 } },
}
```

---

## Z-Index Scale

```ts
export const Z = {
  desktop: 0,
  window: 100,         // base; stacking adds to this
  windowActive: 200,
  dock: 500,
  menubar: 600,
  spotlight: 800,
  notification: 900,
  loginScreen: 1000,
  sleepScreen: 1100,
}
```

---

## Wallpaper Options (v1 defaults)

Store in `/public/wallpapers/`. Provide 4 at minimum:

| Filename | Style |
|---|---|
| `sonoma-dark.jpg` | macOS Sonoma dark gradient landscape |
| `sonoma-light.jpg` | macOS Sonoma light gradient landscape |
| `abstract-dark.jpg` | Dark abstract gradient mesh |
| `monterey-classic.jpg` | Classic macOS mountain silhouette |

If images aren't available, generate CSS gradient fallbacks in the wallpaper picker component.
