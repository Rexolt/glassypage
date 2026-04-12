# 🌌 Glassypage

![Glassypage Preview](https://raw.githubusercontent.com/Rexolt/glassypage/main/glassypage_preview.png)

> **Modern, premium, and feature-rich browser startpage with a stunning glassmorphism design.**

Glassypage is a high-performance, aesthetically pleasing dashboard designed to be your browser's new home. It combines deep system integration with productivity tools and a state-of-the-art UI inspired by modern frosted glass effects.

---

## ✨ Key Features

### 🎨 Stunning Aesthetics
- **Premium Glassmorphism**: Frosted glass effects, vibrant gradients, and smooth micro-animations.
- **Dynamic Themes**: Built-in support for Dark, Light, and Auto (time-based) modes, plus a powerful **Custom Theme Editor**.
- **Responsive Design**: Optimized for ultrawide monitors, standard desktops, and mobile devices.

### 🔍 Smart Search & Intelligence
- **Spotlight-Style Search**: A central hub for searching the web (DuckDuckGo/Google) with support for `!bangs`.
- **Smart Tools**: Perform mathematical calculations, currency conversions, and unit translations directly in the search bar.
- **Vim Keys**: Full keyboard-driven navigation with Vim-inspired keybindings for power users.

### 🛠️ Integrated Dashboard
- **System Monitoring**: Real-time stats for CPU, RAM, Disk usage, and Hostname.
- **Arch Linux Integration**: Live trackers for pending package updates (`checkupdates` support).
- **Integrated Terminal**: Run whitelisted shell commands directly from your browser dashboard.
- **Media Controls**: Seamless integration with local media players via MPRIS (`playerctl`).

### 🚀 Productivity Suite
- **Pomodoro Timer**: Stay focused with a customizable timer and visual progress ring.
- **Auto-Saving Scratchpad**: A slip-in panel for quick notes that persists automatically.
- **Agenda & To-Dos**: Manage your daily events and tasks with dedicated widgets.
- **RSS Reader**: Keep up with the latest news via a compact ticker or expanded card view.

### 🔌 Extensibility
- **Plugin System**: Architected for modularity—easily install or develop your own widgets with a manifest-based plugin system.
- **AirDrop-like Clipboard**: Share text and links across your devices on the same LAN effortlessly.

---

## 🛠️ Tech Stack

- **Core**: HTML5, Vanilla JavaScript (ES6+)
- **Styling**: Modern CSS3 (Variables, Flexbox, Grid, Backdrop-Filter)
- **Backend**: Node.js, Express (for system APIs)
- **APIs**: wttr.in (Weather), Frankfurter (Currency), Custom RSS Parser

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [npm](https://www.npmjs.com/)
- (Optional) `playerctl` and `checkupdates` for full system feature support on Linux.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rexolt/glassypage.git
   cd glassypage
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm run dev
   ```

4. **Open in your browser**
   Navigate to `http://localhost:3000`.

---

## ⚙️ Configuration

Glassypage is highly customizable without touching code. Click the **Gear Icon** (bottom-right) to access the settings menu:
- Change background wallpapers (URL or Upload).
- Customize search engines and `!bangs`.
- Manage widget layout and visibility.
- Export/Import your custom themes and settings.

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for new widgets or styles, feel free to open an issue or submit a pull request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Made with 💜 by <a href="https://github.com/Rexolt">Rexolt</a>
</p>
