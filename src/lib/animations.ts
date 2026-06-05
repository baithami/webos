import type { Variants } from 'framer-motion'

// Framer Motion animation tokens — see STYLE_GUIDE.md.

/** Standard window open/close. */
export const windowOpenVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, scale: 0.96, y: 4, transition: { duration: 0.12 } },
}

/** Dock icon bounce on launch. */
export const dockBounceVariants: Variants = {
  bounce: {
    y: [0, -18, 0, -9, 0],
    transition: { duration: 0.5, times: [0, 0.3, 0.55, 0.75, 1] },
  },
}

/** Spotlight slide in. */
export const spotlightVariants: Variants = {
  hidden: { opacity: 0, y: -12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.12 } },
}

/** Notification slide in from top-right. */
export const notificationVariants: Variants = {
  hidden: { opacity: 0, x: 60, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
  exit: { opacity: 0, x: 60, transition: { duration: 0.15 } },
}
