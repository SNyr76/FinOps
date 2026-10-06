import type { Config } from 'tailwindcss'
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'], theme: { extend: { colors: { ink: '#122033', muted: '#6d7b8d', line: '#e6ebf1', navy: '#19324d', teal: '#0c8f87', amber: '#d99526' }, boxShadow: { card: '0 8px 30px rgba(20,42,67,.06)' } } }, plugins: [] } satisfies Config
