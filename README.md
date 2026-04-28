# Career-Ops UI 🚀

**Career-Ops UI** is a beautiful, modern, native Desktop application for the [Career-Ops](https://github.com/santifer/career-ops) AI Job Search Pipeline. 

The original `career-ops` project was built by Santiago Fernández de Valderrama as a powerful terminal-based (CLI) pipeline to automatically discover, track, and evaluate job applications using AI. 

This repository **(career-ops-ui)** takes that incredibly powerful backend and wraps it in a fully native Desktop Application.

## 🌟 What I Did
I built a completely new React frontend and wrapped the existing Node.js backend into an **Electron** Desktop application. 

Key contributions and features of this UI:
- **Zero-Terminal Experience:** You no longer need to use the terminal. The app is a standalone executable (packaged with Electron) that you can simply download and double-click to run.
- **Glassmorphism UI:** A sleek, premium, dark-mode/light-mode ready interface built with modern React (Vite).
- **Visual Config Editor:** Replaced manual editing of `portals.yml` with a visual "Target Roles & Companies" editor.
- **Live Pipeline Tracker:** See all of your pending, scored, and applied jobs in a beautiful data table, complete with a "Post Date" column.
- **AI Application Assistant:** A new "Apply" modal that automatically parses your AI evaluations and generates copy-paste answers for tricky job application forms (Workday/Greenhouse).

## 🛠 Tech Stack
- **Frontend:** React (Vite), CSS (Glassmorphism design language)
- **Backend:** Node.js (Express server spawned seamlessly within Electron)
- **AI Engine:** Google Gemini (using the original `gemini-eval.mjs` core)
- **Desktop Wrapper:** Electron & electron-builder

## 📦 How to Use
Since this is an open-source project, you can easily run it locally!

### For Users (No Coding Required)
1. Go to the **Releases** tab.
2. Download the `.dmg` (Mac) or `.exe` (Windows) file.
3. Install and run it like any other desktop app!

### For Developers
If you want to run it from source:
```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/career-ops-ui.git
cd career-ops-ui

# 2. Install dependencies
npm install

# 3. Run the development environment
npm run electron:dev

# 4. Build the final Desktop App (.dmg / .exe)
npm run electron:build
```

## 🤝 Open Source
This project is fully open source. It builds upon the brilliant foundation of `career-ops` and aims to make AI job hunting accessible to everyone, not just developers. Feel free to fork, contribute, and submit pull requests!
