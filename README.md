# DevDebug AI 🔧

AI-powered Chrome extension for console debugging with PushEngage integration.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![License](https://img.shields.io/badge/license-MIT-gray)

## Features

### 🐛 Error Debugging
- **Automatic Error Capture**: Captures `console.error`, `console.warn`, uncaught exceptions, and unhandled promise rejections
- **Real-time Detection**: Errors appear instantly without page refresh
- **Deduplication**: Identical errors within 5 seconds are grouped
- **AI Analysis**: Get AI-powered explanations and solutions for any error
- **Stack Trace Viewer**: Expandable stack traces with file and line information

### 📊 PushEngage Integration
- **SDK Detection**: Automatically detects PushEngage SDK on any webpage
- **Configuration Viewer**: View and search through PE configuration data
- **Natural Language Queries**: Ask questions about your PE setup in plain English
- **Campaign Overview**: Summary cards for browse, cart, and custom trigger campaigns
- **Quick Questions**: Pre-built query suggestions for common questions

### 🤖 Multi-Provider AI Support
- **OpenAI**: GPT-4o, GPT-4-turbo, GPT-4, GPT-3.5-turbo
- **Anthropic Claude**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **Google Gemini**: Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini Pro
- **Streaming Responses**: Real-time AI responses with streaming

## Installation

### From Source

1. **Clone the repository**
   ```bash
   cd /Applications/pe/chrome-extensions\ debugger
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development Mode

```bash
npm run dev
```

This starts Vite with HMR support for faster development.

## Getting API Keys

### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy and paste into the extension settings

### Anthropic Claude
1. Visit [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Create a new API key
3. Copy and paste into the extension settings

### Google Gemini
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and paste into the extension settings

## Usage

### Debug Mode
1. Open any webpage
2. Click the DevDebug AI extension icon
3. Console errors will automatically appear in the Errors tab
4. Click "Analyze" on any error to get AI assistance
5. Ask follow-up questions in the Chat tab

### PushEngage Mode
1. Navigate to a website with PushEngage installed
2. The extension will automatically detect the PE SDK
3. Go to the PE tab to view configuration
4. Click "Ask AI" or use quick questions to query the data
5. Get insights about campaigns, settings, and more

### Example Queries

**Debug Mode:**
- "What's causing this TypeError?"
- "How do I fix this 'undefined is not a function' error?"
- "Explain this stack trace step by step"
- "Show me a code example to fix this"

**PushEngage Mode:**
- "Show me all active campaigns"
- "What are my cart abandonment settings?"
- "List all browse abandonment campaigns"
- "Is geo location enabled?"
- "What segments do I have configured?"
- "Explain my opt-in configuration"

## Architecture

```
src/
├── content/
│   ├── content.ts      # Error capture + PE detection (MAIN world)
│   └── bridge.ts       # Message relay (ISOLATED world)
├── background/
│   └── background.ts   # Service worker
├── popup/
│   ├── App.tsx         # Main app component
│   ├── components/     # React components
│   └── hooks/          # Custom hooks (useAIChat)
├── services/
│   ├── aiProvider.ts   # AI API integration
│   └── pushEngage.ts   # PE data service
├── types/
│   ├── index.ts        # Core types
│   └── pushEngage.ts   # PE types
└── utils/
    ├── storage.ts      # Chrome storage utilities
    └── llm-providers.ts # AI provider configs
```

## How PushEngage Data is Handled

1. **Detection**: The content script checks for `window.PushEngage` every 5 seconds
2. **Fetching**: When detected, calls `PushEngage.getAppConfig()` to get configuration
3. **Storage**: Data is stored in `chrome.storage.local`
4. **Context Building**: `PushEngageService.buildAIContext()` formats data for AI prompts
5. **Querying**: `@tanstack/ai-client` receives the full PE context and answers questions based on it

### PushEngage AI Query Flow

```
User Query → useAIChat Hook → buildSystemPrompt()
                                    ↓
                          PushEngageService.buildAIContext(peData)
                                    ↓
                          @tanstack/ai-client.chat.stream()
                                    ↓
                          Streaming AI Response → UI
```

## Privacy & Security

- ✅ **Local Storage Only**: All data stays in your browser
- ✅ **No Telemetry**: Zero tracking or analytics
- ✅ **Secure API Keys**: Stored in Chrome's encrypted storage
- ✅ **Direct API Calls**: Only communicates with your chosen AI provider
- ✅ **No Backend**: Completely client-side

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **@crxjs/vite-plugin** - Chrome extension build support
- **@tanstack/ai-client** - TanStack AI SDK for unified AI provider access
- **Lucide React** - Icons
- **React Markdown** - Markdown rendering

## AI Integration with @tanstack/ai-client

This extension uses `@tanstack/ai-client` from the TanStack AI SDK for all AI functionality:

```typescript
import { createAIClient } from '@tanstack/ai-client';

// Create client with your provider
const client = createAIClient({
  provider: 'openai', // or 'anthropic', 'google'
  apiKey: 'your-api-key',
  model: 'gpt-4o',
});

// Stream chat completions
await client.chat.stream({
  messages: [{ role: 'user', content: 'Hello!' }],
  onChunk: (chunk) => console.log(chunk.content),
});
```

The TanStack AI SDK provides:
- **Unified API** across all providers (OpenAI, Anthropic, Google)
- **Streaming support** for real-time responses
- **No vendor lock-in** - easily switch providers

## Troubleshooting

### Extension not loading errors
- Make sure you've run `npm run build`
- Check that you're loading the `dist` folder
- Try removing and re-adding the extension

### AI not responding
- Verify your API key is correct
- Check that you have credits/quota with your provider
- Try the "Test Connection" button in settings

### PushEngage not detected
- Make sure the website has PushEngage SDK installed
- Wait a few seconds after page load
- Click "Refresh" in the PE panel

### Errors not capturing
- Some errors may be caught by the page itself
- Cross-origin scripts may not show full details
- Check that the extension has permission for the site

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to test
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

Made with ❤️ for developers

