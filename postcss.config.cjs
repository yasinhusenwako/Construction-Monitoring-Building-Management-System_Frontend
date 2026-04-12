/**
 * PostCSS Configuration for Next.js
 * 
 * Next.js requires PostCSS configuration to have a plugins key.
 * Tailwind CSS and autoprefixer are included by default.
 * 
 * Using .cjs extension because package.json has "type": "module"
 */

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
