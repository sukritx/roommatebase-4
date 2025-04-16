/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        card: '#ffffff',
        primary: '#2563eb',
        'primary-foreground': '#ffffff',
        secondary: '#f1f5f9',
        'secondary-foreground': '#1e293b',
        accent: '#e0e7ff',
        'accent-foreground': '#3730a3',
        destructive: '#ef4444',
        'destructive-foreground': '#fff1f2',
        muted: '#e5e7eb',
        'muted-foreground': '#6b7280',
        ring: '#6366f1',
        input: '#f1f5f9',
      },
    },
  },
  plugins: [],
}