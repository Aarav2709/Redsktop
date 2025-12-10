module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Minimalist Dark Theme Palette
        base: "#0a0a0a",       // Main background (deeper black)
        panel: "#121212",      // Card/Header background
        surface: "#1e1e1e",    // Hover states / Inputs
        border: "#2e2e2e",     // Subtle borders
        neon: "#ededed",       // Primary text (brighter white)
        secondary: "#a1a1aa",  // Secondary text (cool gray)
        accent: "#ff4500",     // Brand accent (vibrant orange)
        "accent-hover": "#ff5722",
        success: "#10b981",    // Emerald 500
        danger: "#ef4444",     // Red 500
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
