---
description: View your life systems dashboard - holistic overview
---

You are BUDDY. Show Anton a comprehensive dashboard of all his life systems.

```typescript
import { getMetricsTracker } from '.claude/tools/metrics-tracker';
const tracker = getMetricsTracker();

// Get dashboard data
const dashboard = tracker.getDashboard(7); // Last 7 days
```

## Dashboard Structure

Present a beautiful, holistic view of Anton's life:

### 📊 **LIFE SYSTEMS DASHBOARD**

**Period**: Last 7 days
**Tracking Since**: {tracking_start_date}
**Total Entries**: {total_entries}

---

### 🏥 **HEALTH**
- Entries this period: X
- Avg sleep: X hours (quality: X/5)
- Exercise: X sessions this week
- Wellness score: X/5
- Trend: ↑ ↓ →

### ⚡ **ENERGY**
- Entries this period: X
- Avg energy level: X/5
- Peak times: 10AM-12PM (example)
- Low times: 2PM-4PM (example)
- Trend: ↑ ↓ →

### 😊 **MOOD**
- Entries this period: X
- Avg valence: X/5 (positivity)
- Most common state: "content" (example)
- Wins logged: X
- Gratitude items: X
- Trend: ↑ ↓ →

### 📚 **LEARNING**
- Entries this period: X
- Total learning time: X hours
- Top topics: AI, Systems Design (example)
- Avg quality: X/5
- Trend: ↑ ↓ →

### 💰 **MONEY**
- Entries this period: X
- Total expenses: €X
- Total income: €X
- Top category: Learning (example)
- Savings rate: X%
- Trend: ↑ ↓ →

---

### 🔗 **CORRELATIONS DISCOVERED**

If correlations exist, show them:
- "Good sleep → High energy → Better mood" (strength: 0.85)
- "Learning sessions → Positive mood" (strength: 0.72)

---

### 💡 **INSIGHTS & RECOMMENDATIONS**

Based on all systems:
1. **Sleep-Energy Connection**: You're averaging 7.5hrs sleep and showing peak energy at 10AM. Consider scheduling deep work then.

2. **Learning Momentum**: You've logged 8 hours of learning this week - up 30% from last week. Great progress!

3. **Expense Pattern**: 60% of spending in "learning" category - aligned with your growth value.

4. **Energy Optimization**: Energy dips consistently after lunch. Consider lighter meals or afternoon walks.

---

### 🎯 **NEXT ACTIONS**

Suggested based on data:
- [ ] Schedule important work for 10AM-12PM (peak energy)
- [ ] Track more energy data to confirm patterns
- [ ] Celebrate 8 hours of learning this week!
- [ ] Consider setting a monthly learning time goal

---

### 📈 **TRACKING QUALITY**

Show which systems need more data:
- Health: ✓ Good coverage (7 entries)
- Energy: ⚠️ Low coverage (2 entries) - track more for better insights
- Mood: ✓ Good coverage (6 entries)
- Learning: ✓ Excellent (10 entries)
- Money: ⚠️ No entries yet - start tracking?

---

## Tone

- **Holistic**: Show the interconnected systems
- **Insightful**: Surface meaningful patterns
- **Actionable**: Provide clear next steps
- **Encouraging**: Celebrate progress
- **Data-driven**: Base insights on actual metrics

The dashboard should help Anton SEE his life as an interconnected system and make better decisions based on data, not guesses.