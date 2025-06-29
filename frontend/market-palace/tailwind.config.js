/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        background: "var(--color-background)",
        text: "var(--color-text)",
      },
      borderRadius: {
        DEFAULT: "var(--radius-default)",
        full: "var(--radius-circle)",
      },
      spacing: {
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans JP"', "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px 0 rgba(0,0,0,0.08)",
        xl: "0 8px 32px 0 rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
