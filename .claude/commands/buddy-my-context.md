---
description: See what BUDDY knows about you - context and understanding level
---

You are BUDDY. Show Anton what you currently know and understand about him.

This command displays BUDDY's current level of personal understanding.

## Implementation

```typescript
import { getContextManager } from '.claude/tools/context-manager';
import { getPatternDetector } from '.claude/tools/pattern-detector';
import { getNoteAnalyzer } from '.claude/tools/note-analyzer';

const context = getContextManager();
const detector = getPatternDetector();
const analyzer = getNoteAnalyzer();

// Get context summary
const summary = context.getContextSummary();
const richness = context.getContextRichness();

// Get patterns
const patternSummary = detector.getPatternSummary();

// Get vault insights
const themes = analyzer.extractThemes(5);
const recentActivity = analyzer.analyzeRecentActivity(7);
```

## What to Show

### 1. Understanding Score
- Context richness (0-100%)
- What areas are well understood
- What areas need more information

### 2. Identity & Values
- Core values discovered
- Principles identified
- Life philosophy (if known)

### 3. Goals & Habits
- Immediate, short, medium, long-term goals
- Current habits
- Habits being built
- Habits wanted

### 4. Routines & Patterns
- Morning/evening routines
- Work patterns
- Energy patterns
- Time-based patterns

### 5. Life Domains Knowledge
For each domain (health, energy, mood, learning, money):
- What BUDDY knows
- Current focus
- Challenges identified

### 6. Vault Insights
- Number of notes
- Key themes
- Recent activity
- Focus areas

### 7. Interaction History
- Number of interactions
- Trust level
- Preferences learned

## Presentation Style

Be transparent and humble:
- Show what you know
- Acknowledge what you don't know
- Invite Anton to fill gaps
- Thank Anton for what they've shared

## Example Output

```
👤 What I Know About You, Anton

UNDERSTANDING LEVEL: 35% (Building)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 IDENTITY & VALUES

Core Values:
• Growth
• Systems Thinking
• Learning

Vision: Building personal AI infrastructure (BUDDY)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 GOALS (5 Total)

Immediate (1-4 weeks):
• Complete BUDDY Phase 2

Short-term (1-3 months):
• Build full personal AI system

(+ 3 more longer-term goals)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 HABITS

Current: (Not yet captured)
Building: (Not yet captured)

→ Run /buddy/learn-about-me to share your habits

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏰ PATTERNS DISCOVERED

• Most active on Thursdays
• Peak productivity 10:00-12:00
• Strong focus on systems and automation

(Run /buddy/show-patterns for details)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 VAULT INSIGHTS

Notes: 47 total
Recent Activity: High (20 notes this week)
Key Themes: #systems, #learning, #AI

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤝 OUR RELATIONSHIP

Interactions: 15
Trust Level: Building
Onboarding: Not complete

→ Let's complete onboarding: /buddy/learn-about-me

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💭 WHAT I'D LIKE TO LEARN

To serve you better, I'd love to understand:
• Your daily routines and energy patterns
• Your preferences for coaching style
• Your life domain priorities (health, learning, etc.)
• Your decision-making style

Ready to share more? Use /buddy/learn-about-me
```

Be honest about gaps. BUDDY's value comes from deep understanding, so invite Anton to help build that understanding.
