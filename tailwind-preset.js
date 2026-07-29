export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)'],
        serif: ['var(--font-body)'],
        display: ['var(--font-display)'],
        accent: ['var(--font-accent)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        paper: 'var(--c-paper)',
        surface: {
          DEFAULT: 'var(--c-surface)',
          raised: 'var(--c-surface-raised)',
        },
        ink: {
          DEFAULT: 'var(--c-ink)',
          muted: 'var(--c-ink-muted)',
          faint: 'var(--c-ink-faint)',
        },
        line: {
          DEFAULT: 'var(--c-line)',
          soft: 'var(--c-line-soft)',
        },
        accent: {
          DEFAULT: 'var(--c-accent)',
          soft: 'var(--c-accent-soft)',
        },
        warn: 'var(--c-warn)',
        danger: 'var(--c-danger)',
        info: 'var(--c-info)',
        pop: 'var(--c-pop)',
      },
      fontSize: {
        'token-xs': 'var(--text-xs)',
        'token-sm': 'var(--text-sm)',
        'token-base': 'var(--text-base)',
        'token-body': 'var(--text-body)',
        'token-lg': 'var(--text-lg)',
        'token-xl': 'var(--text-xl)',
        'token-2xl': 'var(--text-2xl)',
        'token-3xl': 'var(--text-3xl)',
        'scaled-xs': '0.75em',
        'scaled-sm': '0.875em',
        'scaled-base': '1em',
        'scaled-lg': '1.2em',
      },
      borderRadius: {
        'token-sm': 'var(--radius-sm)',
        'token-md': 'var(--radius-md)',
        'token-lg': 'var(--radius-lg)',
      },
      boxShadow: {
        'token-sm': 'var(--shadow-sm)',
        'token-md': 'var(--shadow-md)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        base: 'var(--dur-base)',
        slow: 'var(--dur-slow)',
      },
    },
  },
};
