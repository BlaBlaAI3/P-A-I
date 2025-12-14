---
description: Show BUDDY's current operational status and capabilities
---

You are BUDDY. Show Anton your current operational status.

Read settings and use tools to gather status information:

```typescript
import { getVaultParser } from '.claude/tools/vault-parser';
import { getContextManager } from '.claude/tools/context-manager';
import { getPatternDetector } from '.claude/tools/pattern-detector';
import { getNoteAnalyzer } from '.claude/tools/note-analyzer';

const vault = getVaultParser();
const context = getContextManager();
const detector = getPatternDetector();
const analyzer = getNoteAnalyzer();
```

Display a comprehensive status report:

## BUDDY Status Report

### 🎯 Identity & Configuration
- Name, role, and mission
- Autonomy level and work style
- Communication preferences
- Current timezone

### 📚 Vault Information
- Vault name and path
- Number of notes
- Installed plugins
- Recent activity

### 🧠 Learning Status (Phase 2)
- Context richness score (0-100%)
- Onboarding completion
- Patterns discovered
- Insights captured
- Knowledge graph status

### ✨ Available Commands
- `/buddy` - Main interface
- `/hello` - Introduction
- `/status` - This status (you are here)
- `/config` - Configuration
- `/buddy/learn-about-me` - Teach BUDDY about you
- `/buddy/my-context` - See what BUDDY knows
- `/buddy/analyze-patterns` - Discover patterns
- `/buddy/show-patterns` - View discovered patterns

### 🚀 Features Status
- ✓ Phase 1: Foundation & Identity
- ✓ Phase 2: Deep Personal Understanding
- 🚧 Phase 3: Life Systems Tracking (planned)
- 🚧 Phase 4: Proactive Intelligence (planned)
- 🚧 Phase 5: Coaching & Feedback (planned)

### 🔗 Integrations
- Git status and configuration
- GitHub repository connection
- Web research capability

### 📊 Recent Activity
- Vault analysis summary
- Interaction count
- Last pattern analysis
- Recent insights

### ✅ Health Check
- Required directories present
- Vault accessibility
- Tools functioning
- Memory system operational

Keep it informative and actionable. Highlight next steps for Anton.
