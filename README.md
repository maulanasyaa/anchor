<div align="center">

  <h1>⚓ Anchor</h1>

  <p>A modern, offline-first desktop link manager for power users.</p>

  [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![GitHub stars](https://img.shields.io/github/stars/maulanasyaa/anchor?style=social)](https://github.com/maulanasyaa/anchor/stargazers)
  [![GitHub forks](https://img.shields.io/github/forks/maulanasyaa/anchor?style=social)](https://github.com/maulanasyaa/anchor/network/members)
  [![GitHub issues](https://img.shields.io/github/issues/maulanasyaa/anchor)](https://github.com/maulanasyaa/anchor/issues)
  [![GitHub last commit](https://img.shields.io/github/last-commit/maulanasyaa/anchor)](https://github.com/maulanasyaa/anchor/commits/main)

  <br/>

  <a href="#️-download">Download</a> •
  <a href="#-features">Features</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-packaging--build">Build</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>

  <br/>

</div>

---

**Anchor** is a lightweight, privacy-focused desktop application for saving, organizing, and managing your web bookmarks — entirely locally. Built on a local-first philosophy, your data never leaves your machine while you enjoy a premium, fluid interface that feels like a native OS component.

---

## ⬇️ Download

| Platform | Download |
|---|---|
| macOS (Apple Silicon) | [Anchor-0.1.2-arm64.dmg](https://github.com/maulanasyaa/anchor/releases/latest) |
| macOS (Intel) | [Anchor-0.1.2.dmg](https://github.com/maulanasyaa/anchor/releases/latest) |
| Windows | [Anchor.Setup.0.1.2.exe](https://github.com/maulanasyaa/anchor/releases/latest) |

> **Note:** Anchor is not code-signed. You may need to bypass OS security warnings on first launch.

### macOS
Run the following command in Terminal after installing:
```bash
xattr -cr /Applications/Anchor.app
```

### Windows
Click **"More info"** → **"Run anyway"** when the SmartScreen prompt appears.

---

## ✨ Features

### 🔗 Core Link Management
- **Comprehensive Link Details** — Clicking a card opens a beautiful Detail Modal showing the title, URL, description, assigned folder, and date added — instead of blindly navigating away.
- **Add & Edit Descriptions** — Provide extra context to any saved URL with optional text descriptions.
- **Full CRUD Capabilities** — Add, edit, delete, and manage your links entirely from the UI.

### 🗂️ Organization & Productivity
- **Reading List ("To Read")** — Mark articles, manhua chapters, or research papers as "To Read" and access them all in a dedicated sidebar filter.
- **Pin to Top (Favorites)** — Star ⭐ your most important links to keep them pinned at the top, regardless of the active folder.
- **Smart Sorting** — Instantly sort your view by Newest Added, Oldest Added, or Alphabetical (A–Z).
- **"All Links" Overview** — A dedicated view to see everything you've saved across all folders at once.

### 🎨 Premium UI/UX Experience
- **In-App Keyboard Shortcuts** — Navigate without touching your mouse. Use `Cmd/Ctrl + F` to search and `Cmd/Ctrl + N` to quickly add a new link.
- **Dynamic Favicons** — Automatically fetches and displays the real website favicon for each link, with a smart initial-letter fallback if the icon is unavailable.
- **Strict Data Validation** — Prevents bad data entry with Regex URL validation and required title fields.
- **Smooth Animations & Blur Overlays** — Polished modal transitions with consistent backdrop-blur effects throughout.

### 🔒 Privacy & Data Control
- **100% Offline-First** — Your data never leaves your machine. Anchor relies entirely on secure local storage.
- **JSON Import & Export** — Full control over your data. Back up your entire link database to a `.json` file, or restore it on another machine with a single click.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Core | [Electron](https://www.electronjs.org/) |
| Frontend | [React](https://reactjs.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Build Tool | [Vite](https://vitejs.dev/) |
| State / Persistence | [electron-store](https://github.com/sindresorhus/electron-store) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Icons | [Lucide React](https://lucide.dev/) |

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) `v18.x` or higher
- [npm](https://www.npmjs.com/) `v9.x` or higher

---

## 🚀 Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/maulanasyaa/anchor.git
cd anchor

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will launch as a native desktop window via Electron.

---

## 💻 Usage

Once running, you can:

1. **Add a link** — Click the **+** button and fill in the URL, title, and optional description.
2. **Organize** — Create folders from the sidebar and drag links into them.
3. **Search** — Use the search bar at the top to filter links instantly across all fields.
4. **Open** — Click any link to open it in your default browser.

---

## 📦 Packaging & Build

Produce distributable binaries for your target platform:

```bash
# Build for the current OS
npm run build

# Build for macOS
npm run build:mac

# Build for Windows
npm run build:win
```

> Output executables are generated in the `dist-electron/` directory.

---

## 📂 Project Structure

```text
anchor/
├── electron/           # Main process: IPC, window management, preload scripts
├── src/                # Renderer process (React application)
│   ├── components/     # Reusable UI components & modals
│   ├── lib/            # Utilities and local storage logic
│   ├── assets/         # Stylesheets and static assets
│   └── main.jsx        # React entry point
├── public/             # Static assets and icons for the final build
└── vite.config.mjs     # Vite configuration
```

---

## 🗺️ Roadmap

- [x] Import / export bookmarks (JSON)
- [x] Keyboard shortcut support (`Cmd/Ctrl + F`, `Cmd/Ctrl + N`)
- [x] Tag-based filtering (Reading List, Pinned)
- [ ] Windows build support
- [ ] Link health checker (detect broken URLs)
- [ ] Custom themes / light mode
- [ ] Browser extension for one-click saving

See the [open issues](https://github.com/maulanasyaa/anchor/issues) for the full list of proposed features and known bugs.

---

## 🤝 Contributing

Contributions are welcome and greatly appreciated!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

## 🙏 Acknowledgements

- [Lucide Icons](https://lucide.dev/) — for the beautiful, consistent iconography.
- [Tailwind CSS](https://tailwindcss.com/) — for the utility-first styling framework.
- [Electron](https://www.electronjs.org/) & [React](https://reactjs.org/) communities — for the incredible tooling and ecosystem.

---

<div align="center">
  <sub>Built with ❤️ for the decentralized web.</sub>
</div>
