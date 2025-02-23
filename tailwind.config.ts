import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {

      backgroundImage: {
        'hero-pattern': "url('/images/fondo_spotinet-min.jpg')",
        },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        principal_blue: "#002b4e",
        secondary_blue: "#00ffff"
        
      },
    },
  },
  plugins: [],
};
export default config;
