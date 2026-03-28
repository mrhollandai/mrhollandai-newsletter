# 🎼 The Tempo - Automated AI News Pipeline

**Daily AI news brief with automated gathering, manual curation, and multi-platform distribution.**

## Overview

"The Tempo" is MrHollandAI's daily AI news brief that delivers 3-5 curated AI stories to our community every day. The system combines automated news gathering with human curation to cut through AI hype and deliver genuinely valuable insights.

### Philosophy
- **Anti-hype:** Filter out "revolutionary" and "game-changing" fluff
- **Practical focus:** Business value over buzzwords  
- **Community first:** Daily value reinforces premium newsletter subscriptions
- **Speed over perfection:** Fresh insights beat stale analysis

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  8:00 AM UTC    │    │   Manual         │    │   Multi-Platform    │
│  Automated      │───▶│   Curation       │───▶│   Distribution      │
│  News Gathering │    │   (30 minutes)   │    │   (Discord/Email)   │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
       │                        │                         │
   10-15 articles          Select 3-5 best         Instant community 
   Auto-scored by          Add MrHollandAI         value delivery
   relevance/quality       perspective/angles      + subscription 
                                                   reinforcement
```

## Components

### 1. Automated News Gathering
**File:** `.github/workflows/daily-ai-news.yml`
**Schedule:** Every day at 8:00 AM UTC (3:00 AM EST)

**What it does:**
- Searches 3 parallel news streams:
  - General AI developments
  - AI startup funding & business news  
  - AI tool launches & product releases
- Combines and saves raw results to `data/daily-news/YYYY-MM-DD.json`
- Typically gathers 10-15 articles per day

**Manual trigger:**
```bash
# Via GitHub Actions UI or API
curl -X POST \
  https://api.github.com/repos/mrhollandai/mrhollandai-newsletter/actions/workflows/daily-ai-news.yml/dispatches \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -d '{"ref":"main"}'
```

### 2. Curation System
**File:** `scripts/curate-tempo.js`
**Usage:** Manual step after news gathering

**Smart Pre-filtering:**
- **Recency scoring:** Newer articles get higher priority
- **Source credibility:** Bonus points for Reuters, Bloomberg, TechCrunch, etc.
- **Keyword relevance:** "funding", "policy", "breakthrough" boost scores
- **Anti-hype filtering:** Penalizes "revolutionary", "game-changing", etc.
- **Auto-categorization:** Policy, Funding, Tools, Research, Reality Check

**Workflow:**
```bash
# Generate curation template from today's raw news
node scripts/curate-tempo.js generate

# This creates: data/curated/YYYY-MM-DD-tempo.json
# Edit the JSON file to:
# 1. Set "selected": true for 3-5 best stories
# 2. Add "curator_note" with your take
# 3. Add "curator_angle" with unique perspective
# 4. Write "curator_intro" and "curator_reflection"

# Validate your curation
node scripts/curate-tempo.js validate
```

### 3. Multi-Platform Distribution
**File:** `scripts/distribute-tempo.js`
**Usage:** After curation is complete

**Supported Platforms:**
- **Discord:** Rich markdown with emoji categories, auto-splits long messages
- **Email:** Beautiful HTML with gradients and responsive design
- **Notion:** Structured blocks for public archive page
- **Future:** WhatsApp, Telegram, SMS via messaging APIs

**Usage:**
```bash
# Preview the brief before distribution
node scripts/distribute-tempo.js preview

# Distribute to Discord (requires webhook URL)
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
node scripts/distribute-tempo.js discord

# See all format examples
node scripts/distribute-tempo.js formats
```

## Daily Workflow

### Morning (Automated)
1. **8:00 AM UTC:** GitHub Actions runs news gathering
2. **~8:05 AM:** Raw data available in `data/daily-news/`
3. **Notification:** Check GitHub Actions success/failure

### Curation (Manual - 30 minutes)
4. **Generate template:** `node scripts/curate-tempo.js generate`
5. **Review candidates:** Open `data/curated/YYYY-MM-DD-tempo.json`
6. **Select 3-5 stories:** Set `"selected": true` for best ones
7. **Add insights:** Write `curator_note` and `curator_angle` for each
8. **Frame the day:** Write `curator_intro` and `curator_reflection`
9. **Validate:** `node scripts/curate-tempo.js validate`

### Distribution (Automated)
10. **Preview:** `node scripts/distribute-tempo.js preview`
11. **Discord:** `node scripts/distribute-tempo.js discord`
12. **Email/SMS:** (Integration pending)
13. **Archive:** Stories flow into weekly newsletter content

## Content Categories

| Category | Emoji | Focus |
|----------|-------|-------|
| **Government & Policy** | 🏛️ | Regulation, legislation, government AI initiatives |
| **Funding & Business** | 💰 | Startup funding, IPOs, business developments |
| **Tools & Products** | 🔧 | New AI tools, product launches, feature releases |
| **Research & Breakthroughs** | 🔬 | Academic research, scientific breakthroughs |
| **Reality Check** | 🎯 | Hype-busting, realistic takes on AI claims |

## Example Output

### Discord Format
```markdown
🎼 **The Tempo** - AI News Brief
📅 Friday, March 28, 2026

Starting strong today with policy moves that actually matter...

🏛️ **White House Releases National AI Policy Framework**
*Finally, some structure to the regulatory chaos*
This isn't just another policy paper - it includes specific 
legislative recommendations and federal preemption guidelines 
that could shape state AI laws for years...
🔗 [Read more](https://link) • Ropes & Gray LLP

💰 **NVIDIA Stock Called "No-Brainer" Investment**
*The Motley Fool might be right, but here's the nuance*
While everyone's focused on the headline, the real story 
is in their data center revenue trajectory...
🔗 [Read more](https://link) • The Motley Fool

---
💭 **MrHollandAI's Take:** Policy clarity is finally emerging, 
but the real test will be implementation. Watch for state 
resistance to federal preemption.

📧 *Subscribe to our full newsletter for weekly deep dives*
🎵 *Composing your AI-powered future, one beat at a time*
```

## Setup Requirements

### GitHub Secrets
Add these secrets to your repository settings:

```bash
COMPOSIO_API_KEY=your_composio_api_key_here
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook
EMAIL_API_KEY=your_email_service_key  # Future
```

### Local Development
```bash
# Clone and setup
git clone https://github.com/mrhollandai/mrhollandai-newsletter.git
cd mrhollandai-newsletter
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your API keys

# Test the pipeline
node scripts/curate-tempo.js generate
node scripts/distribute-tempo.js preview
```

### Dependencies
- Node.js 18+
- GitHub Actions (for automation)
- Composio API access
- Discord webhook (for distribution)

## Monitoring & Analytics

### Success Metrics
- **Coverage:** 10-15 articles gathered daily
- **Quality:** 3-5 stories selected (20-50% curation rate)
- **Speed:** Raw news → published brief in under 30 minutes
- **Engagement:** Discord reactions, email opens, newsletter signups

### Failure Modes
- **News gathering fails:** Check Composio API limits, GitHub Actions logs
- **No good stories:** Broaden search terms, lower quality threshold
- **Distribution errors:** Verify webhook URLs, check character limits

## Roadmap

### Phase 1: Core Pipeline ✅
- [x] Automated news gathering
- [x] Curation tools
- [x] Discord distribution
- [x] Multi-format support

### Phase 2: Enhanced Distribution
- [ ] Email integration (Beehiiv API)
- [ ] Notion public page
- [ ] WhatsApp/Telegram feeds
- [ ] SMS alerts for breaking news

### Phase 3: Intelligence Layer
- [ ] Trend detection across days/weeks
- [ ] Automated summary generation
- [ ] Community feedback integration
- [ ] A/B testing for content formats

### Phase 4: Monetization Bridge
- [ ] Newsletter content pipeline
- [ ] Premium subscriber previews
- [ ] Sponsor integration slots
- [ ] Analytics dashboard

## Contributing

Want to improve The Tempo pipeline? Here's how:

1. **Content Quality:** Suggest better news sources or filtering criteria
2. **Distribution:** Add new platform integrations
3. **Automation:** Improve scoring algorithms or failure handling
4. **Design:** Enhance email/Discord formatting

## Support

- **Issues:** GitHub Issues for bugs and feature requests
- **Discord:** Join our community for real-time support
- **Email:** Direct feedback to mrhollandai@gmail.com

---

🎼 **Built with love by MrHollandAI**  
*Composing your AI-powered future, one beat at a time*
