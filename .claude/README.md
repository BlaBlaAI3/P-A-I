# BUDDY's Brain - .claude Directory

This directory contains all of BUDDY's configuration, commands, tools, and memory.

## Directory Structure

```
.claude/
├── README.md                   # This file
├── settings.json              # BUDDY's configuration
├── commands/                  # Slash commands
│   ├── buddy.md              # Main BUDDY interface
│   ├── hello.md              # Introduction
│   ├── status.md             # Status check
│   ├── config.md             # Configuration
│   ├── buddy/                # BUDDY-specific commands (future)
│   ├── obsidian/             # Obsidian commands (future)
│   ├── systems/              # Life systems commands (future)
│   └── automation/           # Automation commands (future)
├── hooks/                     # Event-driven automation (future)
├── agents/                    # Specialized sub-agents (future)
│   ├── coach/                # Life coaching agent
│   ├── analyst/              # Data analysis agent
│   ├── writer/               # Content creation agent
│   ├── automator/            # Workflow automation agent
│   └── researcher/           # Research agent
├── skills/                    # Domain expertise modules
│   ├── CORE/                 # Foundation
│   │   └── CONSTITUTION.md   # BUDDY's identity & values
│   ├── ObsidianMastery/      # Obsidian integration (future)
│   ├── LifeSystems/          # Life tracking (future)
│   ├── ProactiveAI/          # Proactive suggestions (future)
│   ├── LearningEngine/       # Learning & improvement (future)
│   └── Automation/           # Workflow automation (future)
├── memory/                    # Persistent memory (future)
│   ├── personal-context.json # Your habits, values, preferences
│   ├── interaction-history.json # Learning from interactions
│   ├── patterns.json         # Identified patterns
│   └── knowledge-graph.json  # Connections & insights
└── tools/                     # Utilities & scripts
    ├── logger.ts             # Logging system
    ├── vault-parser.ts       # Obsidian vault parser
    └── [more tools...]       # Additional utilities
```

## Current Status: Phase 1 Complete ✓

### What's Implemented:
- ✓ Directory structure created
- ✓ Settings.json configured
- ✓ CONSTITUTION established
- ✓ Logging system (TypeScript)
- ✓ Vault parser tool (TypeScript)
- ✓ Basic slash commands (/buddy, /hello, /status, /config)

### What's Next (Phase 2):
- Personal context learning
- Pattern detection
- Obsidian knowledge extraction

## How to Use

### Slash Commands
- `/hello` - Meet BUDDY for the first time
- `/status` - Check BUDDY's current state
- `/config` - Configure BUDDY's settings
- `/buddy` - Main BUDDY interface for tasks

### TypeScript Tools
Tools in the `tools/` directory can be imported and used by BUDDY:

```typescript
import { getLogger } from '.claude/tools/logger';
import { getVaultParser } from '.claude/tools/vault-parser';

const logger = getLogger();
const vault = getVaultParser();
```

## Configuration

Edit `settings.json` to customize:
- Identity and personality
- User preferences
- Autonomy level
- Work style
- Enabled features
- Life systems to track
- Integrations

## Philosophy

Everything in this directory follows BUDDY's CONSTITUTION:
- Deep personal understanding
- Proactive service
- Systems thinking
- Continuous learning
- Collaborative partnership
- Obsidian-first
- Privacy & trust

## Version

Current Version: 1.0.0 (Phase 1)
Last Updated: 2025-12-14
