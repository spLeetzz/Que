# ✨ Que - The Modern Event Platform

> **Transform how you collect feedback, run polls, and engage with your audience**

Que is a powerful, flexible platform that makes creating forms, polls, and interactive discussions effortless. Whether you're gathering customer feedback, running team surveys, or settling those endless group chat debates, Que has you covered.

---

## 🎯 What Makes Que Special

### Three Powerful Event Types

**📝 Forms** - Beautiful, customizable forms that your users will actually want to fill out
- Multiple question types (text, numbers, dates, sliders, multiple choice)
- Conditional logic and validation
- Real-time response tracking
- Export data in multiple formats

**📊 Polls** - Quick, engaging polls for instant feedback
- Single or multiple choice questions
- Live results visualization
- Anonymous or authenticated responses
- Perfect for team decisions and quick surveys

**💬 Banter** - The feature that changes everything

Real-time chat-style discussions that settle debates once and for all. Ever had a WhatsApp group argument that goes on forever? Banter lets everyone share their opinion in a structured way, with live updates and clear visibility of who said what. It's like a poll meets a chat room, designed specifically for those "what should we order for dinner?" moments.

### Why Banter is a Game-Changer

We've all been there - a group chat where 47 messages later, you still don't know what everyone thinks. Banter solves this by:
- **Live participation** - See responses appear in real-time
- **Clear structure** - Everyone's opinion is visible and organized
- **No more scrolling** - All responses in one place
- **Decision-ready** - Quickly see consensus or disagreement
- **Fun & engaging** - Makes group decisions actually enjoyable

---

## 🚀 Key Features

### For Everyone
- **No-code form builder** - Drag, drop, and customize without writing code
- **Beautiful themes** - Choose from preset themes or use custom Unsplash backgrounds
- **Custom URLs** - Share memorable links like `yoursite.com/events/summer-survey`
- **Real-time analytics** - Watch responses come in live with beautiful charts
- **Mobile-first design** - Looks perfect on any device
- **Dark mode support** - Easy on the eyes, day or night

### For Power Users
- **API-first architecture** - Integrate with your existing tools
- **Webhook support** - Get notified when responses come in
- **Advanced analytics** - Track completion rates, abandonment, and trends
- **Export options** - CSV, JSON, or direct database access
- **Custom branding** - Make it yours with themes and styling

### For Developers
- **Forms as a Service** - Embed Que forms in your own applications
- **Personal Access Tokens** - Secure API authentication
- **Hidden fields** - Pass data seamlessly between systems
- **State management** - Handle complex multi-step flows
- **Full REST API** - Complete programmatic control

Want to integrate Que into your app? Check out [DEVELOPER.md](./DEVELOPER.md) for the complete technical guide.

---

## 🎨 Beautiful by Default

Que isn't just functional - it's gorgeous. Every form, poll, and banter session is designed to delight your users:

- **Smooth animations** - Subtle transitions that feel premium
- **Thoughtful spacing** - Clean layouts that guide the eye
- **Smart validation** - Helpful error messages, not frustrating ones
- **Accessible** - WCAG compliant, keyboard navigable, screen reader friendly
- **Fast** - Optimized for performance on any connection

---

## 🔒 Privacy & Security

Your data is yours. Period.

- **Secure by default** - HTTPS everywhere, encrypted at rest
- **Anonymous responses** - Collect feedback without requiring accounts
- **GDPR compliant** - Built with privacy regulations in mind
- **Flexible visibility** - Control who sees results
- **Data export** - Take your data with you anytime

---

## 🌟 Perfect For

- **Product teams** gathering user feedback
- **HR departments** running employee surveys
- **Event organizers** collecting RSVPs and preferences
- **Teachers** creating quizzes and polls
- **Community managers** engaging their audience
- **Friend groups** settling debates (seriously, try Banter!)
- **Developers** needing embeddable forms

---

## 🛠️ Tech Stack

Que is built on modern, battle-tested technologies:

- **Next.js 16** with React 19 - Lightning-fast frontend
- **tRPC** - End-to-end type safety
- **PostgreSQL** - Reliable, scalable database
- **Drizzle ORM** - Type-safe database queries
- **Better Auth** - Secure authentication
- **TailwindCSS** - Beautiful, responsive design
- **Turborepo** - Optimized monorepo builds

For complete architecture details, see [DEVELOPER.md](./DEVELOPER.md).

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database
- (Optional) Google OAuth credentials for social login

### Quick Start

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd que
   pnpm install
   ```

2. **Set up your database**
   ```bash
   # Create a PostgreSQL database
   # Update connection string in packages/database/.env
   
   pnpm db:generate
   pnpm db:migrate
   ```

3. **Configure environment**
   ```bash
   # Copy example env files
   cp apps/web/.env.example apps/web/.env
   cp apps/api/.env.example apps/api/.env
   
   # Add your database URL and auth secrets
   ```

4. **Start developing**
   ```bash
   pnpm dev
   ```

   Your app will be running at:
   - Frontend: `http://localhost:3000`
   - API: `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`

---

## 📦 Project Structure

```
que/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # Express backend server
└── packages/
    ├── database/     # Drizzle ORM & PostgreSQL schemas
    ├── trpc/         # Type-safe API layer
    ├── auth/         # Better Auth configuration
    └── logger/       # Structured logging
```

---

## 🤝 Contributing

We love contributions! Whether it's:
- 🐛 Bug reports
- 💡 Feature suggestions
- 📝 Documentation improvements
- 🔧 Code contributions

All contributions are welcome and appreciated.

---

## 📄 License

[Your License Here]

---

## 💬 Support

Need help? Have questions?
- Check the [Developer Guide](./DEVELOPER.md)
- Open an issue on GitHub

---

**Built with ❤️ for everyone who's ever needed to collect feedback, run a poll, or settle a group chat debate.**

*Try Banter. Your group chats will thank you.* 🎉
