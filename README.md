# PersoDashbodo 🧠
> **Your Private, AI-Powered, Local-First Digital Brain.**

![PersoDashbodo Banner](/public/file.svg)

**PersoDashbodo** is a personal dashboard designed for privacy enthusiasts who want a beautiful, "deep dark" interface to manage their digital life. It combines financial tracking, movie watchlists, secure notes, and password management into one cohesive application.

## 🌟 Key Features

### 🎨 Deep Dark UI
- A stunning "glassmorphism" aesthetic with a deep, OLED-friendly color palette.
- Reactive "Click Spark" effects and smooth animations.
- Fully responsive mobile drawer navigation.

### 🔒 Privacy-First & Local-First
- **Your Data, Your Device**: by default, all data (transactions, notes, passwords) is stored **locally** in your browser's `localStorage`.
- **Zero-Knowledge Cloud**: Optional cloud sync uses a PIN-based encryption key (`user_data_<PIN>`) stored in Redis. Even if the database is compromised, your data structure is obfuscated without the PIN.
- **Smart Session**: A secure session system that remembers trusted devices for 30 days while locking out strangers.

### 🤖 AI-Powered Finance
- **Smart Parsing**: Upload generic bank statements (PDF/Images) or paste text, and the integrated AI (Llama 3 via Groq) automatically extracts, categorizes, and logs your transactions.
- **Context Aware**: Understands "Transfer to Mom" vs "McDonalds" to categorize expenses accurately.

### 🛠️ Complete Toolset
- **💰 Finance**: Expense tracking, monthly summaries, and investment portfolio management.
- **🎬 Movies**: Watchlist with OMDb integration for ratings and posters.
- **📝 Notes**: A simple, searchable markdown notepad.
- **🔐 Passwords**: A basic local password manager (for non-critical credentials).

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Vercel Account (for deployment)
- A Groq Cloud API Key (for AI features)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Swotboysandy/persodashbodo.git
    cd persodashbodo
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**:
    Create a `.env.local` file:
    ```bash
    GROQ_API_KEY="your_groq_api_key"
    NEXT_PUBLIC_OMDB_API_KEY="your_omdb_key"
    
    # Optional: For Cloud Sync (Redis Cloud)
    REDIS_URL="redis://your_redis_url..."
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser.

## ☁️ Deployment (Vercel)

1.  Push your code to GitHub.
2.  Import the project into Vercel.
3.  Add the environment variables (`GROQ_API_KEY`, etc.) in the Vercel Dashboard.
4.  Deploy!

## 🛡️ Security Note

This dashboard is designed for **personal use**. While it implements PIN protection and basic encryption:
- Do not store critical banking passwords or high-value crypto keys.
- The "Cloud Sync" feature relies on your PIN as the seed; a weak PIN (1234) makes your cloud data vulnerable if someone guesses the key format. Use a strong 6-8 digit PIN.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the UI or add new "brain modules".

---

*Built with Next.js, Tailwind CSS, and simple magic.* ✨
