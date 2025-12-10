module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Minimalist Dark Theme Palette
        base: "#0f0f0f",       // Main background (very dark gray, almost black)
        panel: "#161618",      // Card/Header background (slightly lighter)
        border: "#2a2a2c",     // Subtle borders
        neon: "#e0e0e0",       // Primary text (soft white)
        secondary: "#888888",  // Secondary text (muted gray)
        accent: "#ff5700",     // Brand accent (classic orange, but used sparingly)
        "accent-hover": "#ff6b1f",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      }
    }
  },
  plugins: []
};
