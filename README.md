# Aredia's PC: A Pokémon Team Builder!

A modern, browser-based Pokémon Team Builder built with **React + TypeScript + Vite**.  
Browse Pokémon from every generation, set up your own team of 6, and see their strengths and weaknesses, alongside some recommended movesets from **Smogon**, going from most recent viable sets to older ones. 

---

## Features

- **Browse all Pokémon** across Generations I–IX, powered by the [PokéAPI](https://pokeapi.co/)
- **Filter** by name, type, and region (Kanto -> Paldea)
- **Team Builder**: pick up to 6 Pokémon and build your roster!
- **Smogon Movesets**: fetches competitive sets (Singles OU, Doubles OU, VGC) via [@pkmn/smogon](https://github.com/pkmn/smogon)
- **Type Weakness Analysis**: real-time tally grid showing your team's coverage and gaps
- **i18n Support**: English, Español, Français, 日本語
- **Dark / Light theme** toggle

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- npm

### Install & Run

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

---

## Project Structure

```
src/
├── App.tsx              # Main application component
├── index.css            # Global styles & design tokens
├── main.tsx             # React entry point
├── services/
│   ├── pokeApi.ts       # PokéAPI integration (Pokémon list, details)
│   └── smogonApi.ts     # Smogon competitive set fetching
├── utils/
│   ├── i18n.ts          # Internationalization (EN/ES/FR/JA)
│   └── typeMath.ts      # Type effectiveness calculations
└── resources/
    ├── sun.png          # Light mode toggle icon
    └── moon.png         # Dark mode toggle icon
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Dev server & bundler |
| @pkmn/smogon | Competitive movesets |
| @pkmn/dex | Pokémon data |
| PokéAPI | Sprites & Pokémon details |
| lucide-react | Icons |

---

## License

MIT

Made with <3 by Alan E. Ramirez!
