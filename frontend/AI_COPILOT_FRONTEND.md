# 🤖 AI Copilot Frontend

A premium, interactive AI-powered data analysis assistant built with React, Framer Motion, and Tailwind CSS.

## 🎨 Features

### ✨ Premium Design
- **Glassmorphism UI** - Modern glass-panel design with backdrop blur effects
- **Smooth Animations** - Powered by Framer Motion for fluid interactions
- **Gradient Accents** - Beautiful blue-purple-pink gradient themes
- **Responsive Layout** - Works seamlessly on all screen sizes
- **Dark Mode** - Sleek dark theme optimized for extended use

### 🧠 AI Capabilities
- **Natural Language Queries** - Ask questions in plain English
- **Context-Aware Analysis** - Understands dataset statistics and metadata
- **Real-time Responses** - Instant AI-powered insights
- **Local Processing** - All AI processing via Ollama (Gemma 3:4b)
- **Privacy-First** - No data sent to external APIs

### 💬 Chat Interface
- **Conversational UI** - Intuitive chat-based interaction
- **Message History** - Full conversation tracking
- **Typing Indicators** - Visual feedback during AI processing
- **Suggested Questions** - Quick-start prompts for common queries
- **Status Indicators** - Real-time service health monitoring

## 📁 File Structure

```
frontend/src/
├── components/
│   ├── AICopilot.jsx           # Main chat interface component
│   └── AICopilotButton.jsx     # Floating action button
├── pages/
│   └── AICopilotDemo.jsx       # Demo/showcase page
└── App.jsx                      # Main app with routing
```

## 🚀 Components

### 1. AICopilot.jsx
The main chat interface component with:
- Full-screen modal overlay
- Message thread display
- Input area with send button
- Service health monitoring
- Context-aware prompting

**Props:**
- `isOpen` (boolean) - Controls modal visibility
- `onClose` (function) - Callback when modal closes
- `datasetInfo` (object) - Dataset metadata (optional)
- `statistics` (object) - Dataset statistics (optional)

### 2. AICopilotButton.jsx
Floating action button with:
- Animated entrance
- Pulsing ring effect
- Online/offline status indicator
- Hover tooltip
- Dataset context badge

**Props:**
- `datasetInfo` (object) - Dataset metadata (optional)
- `statistics` (object) - Dataset statistics (optional)

### 3. AICopilotDemo.jsx
Showcase page featuring:
- Feature highlights
- Interactive demo modes
- Sample questions
- System status display

## 🎯 Usage

### Basic Integration

Add the floating button to any page:

```jsx
import AICopilotButton from './components/AICopilotButton';

function MyPage() {
  return (
    <div>
      {/* Your page content */}
      <AICopilotButton />
    </div>
  );
}
```

### With Dataset Context

Pass dataset information for context-aware analysis:

```jsx
import AICopilotButton from './components/AICopilotButton';

function DatasetPage() {
  const datasetInfo = {
    name: "sales_data.csv",
    rows: 10000,
    columns: 15
  };

  const statistics = {
    numeric: {
      "Revenue": { mean: 5000, std: 2000, min: 100, max: 50000 }
    },
    categorical: {
      "Region": { unique: 5, top: "North" }
    },
    missing: {
      "Email": 150
    },
    quality: {
      score: 87
    }
  };

  return (
    <div>
      {/* Your page content */}
      <AICopilotButton 
        datasetInfo={datasetInfo}
        statistics={statistics}
      />
    </div>
  );
}
```

## 🎨 Styling

The components use Tailwind CSS with custom utilities defined in `index.css`:

- `.glass-panel` - Glassmorphism effect
- `.glass-button` - Glass-style buttons
- `.custom-scrollbar` - Styled scrollbars

### Color Scheme
- **Primary**: Blue (#3B82F6)
- **Secondary**: Purple (#8B5CF6)
- **Accent**: Pink (#EC4899)
- **Success**: Green (#10B981)
- **Error**: Red (#EF4444)

## 🔌 API Integration

The frontend connects to the AI Copilot backend service:

### Endpoints Used

1. **Health Check**
   ```
   GET http://localhost:5000/health
   ```
   Returns service status and model information

2. **Chat (No Context)**
   ```
   POST http://localhost:5000/chat
   Body: { "message": "Your question" }
   ```

3. **Analyze (With Context)**
   ```
   POST http://localhost:5000/analyze
   Body: {
     "query": "Your question",
     "statistics": {...},
     "datasetInfo": {...}
   }
   ```

## 📊 Sample Questions

### General Questions
- "What can you help me with?"
- "How do you analyze data?"
- "What insights can you provide?"

### Dataset-Specific Questions
- "What can you tell me about this dataset?"
- "Are there any missing values?"
- "What's the data quality score?"
- "Can you identify any patterns?"
- "What are the key features?"
- "Suggest data cleaning steps"
- "Are there any anomalies?"
- "What's the distribution of [column]?"

## 🎭 Animations

Powered by Framer Motion:

- **Entrance**: Scale and fade-in with spring physics
- **Exit**: Smooth fade-out
- **Hover**: Scale transformations
- **Pulsing**: Infinite pulse animation for status indicators
- **Message Appear**: Staggered fade-in for chat messages

## 🔧 Configuration

### Environment Variables
The backend service URL is currently hardcoded. To make it configurable:

```jsx
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:5000';
```

### Customization

**Change Colors:**
Edit the gradient classes in the components:
```jsx
// From
className="bg-gradient-to-br from-blue-500 to-purple-600"

// To
className="bg-gradient-to-br from-green-500 to-teal-600"
```

**Adjust Animation Speed:**
```jsx
transition={{ duration: 0.3 }} // Faster
transition={{ duration: 1.0 }} // Slower
```

## 🐛 Troubleshooting

### AI Copilot Shows Offline
1. Check if AI Copilot service is running: `http://localhost:5000/health`
2. Verify Ollama is running: `http://localhost:11434/api/tags`
3. Check browser console for CORS errors

### Messages Not Sending
1. Verify backend service is accessible
2. Check network tab for failed requests
3. Ensure request payload is properly formatted

### Animations Not Working
1. Verify framer-motion is installed: `npm list framer-motion`
2. Check for React version compatibility
3. Clear browser cache

## 📦 Dependencies

```json
{
  "framer-motion": "^10.16.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "tailwindcss": "^3.3.5"
}
```

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🎓 Best Practices

1. **Always check service status** before enabling features
2. **Provide context** when available for better insights
3. **Handle errors gracefully** with user-friendly messages
4. **Optimize re-renders** using React.memo for performance
5. **Test with real datasets** to validate AI responses

## 🚀 Future Enhancements

- [ ] Voice input support
- [ ] Export conversation history
- [ ] Multi-language support
- [ ] Custom themes
- [ ] Keyboard shortcuts
- [ ] Message reactions
- [ ] File attachments
- [ ] Code syntax highlighting
- [ ] Chart/graph generation
- [ ] Collaborative sessions

## 📝 License

Part of the SYNTHESIS Intelligence Engine platform.

---

**Built with ❤️ using React, Framer Motion, and Tailwind CSS**
