# TomParo Opportunity Discovery Engine

## Vision

TomParo scans multiple sources to find opportunities matching a user's CV at 85%+ compatibility. Not just jobs — freelance gigs, social media hiring posts, and contract work.

## Opportunity Types

- Full-time jobs
- Contract work
- Freelance gigs (Upwork, Fiverr style)
- Social media hiring posts
- Remote positions
- Startup opportunities

## Data Sources by Priority

### Phase 1: Easy Wins (Month 3-4)

**Free APIs:**

- Remotive API (remote jobs)
- Arbeitnow API (Europe/remote)
- Adzuna API (500k+ global jobs)
- The Muse API (curated jobs)

**RSS Feeds:**

- We Work Remotely
- RemoteOK
- Working Nomads
- Hacker News "Who's Hiring"

**Cost:** Free
**Coverage:** ~60% of formal jobs globally

### Phase 2: Nigerian Focus (Month 4-5)

- Jobberman (RSS/scrape)
- MyJobMag (RSS/scrape)
- Terawork
- Findworka
- Andela Career page

**Cost:** ~₦30k/month (rotating proxies)
**Coverage:** Nigerian market

### Phase 3: Freelance Platforms (Month 5-6)

- Upwork (partnership or scrape carefully)
- Fiverr (partnership only)
- Toptal
- Freelancer.com
- Contra
- Fastwork

**Cost:** ₦50-100k/month
**Coverage:** Global freelance

### Phase 4: Social Media (Month 7+)

- Twitter API v2 ($100/mo basic)
- LinkedIn (partnership required)
- Facebook (limited)
- Telegram channels (custom bot)

**Cost:** ₦100-200k/month
**Coverage:** Real-time opportunities

## User Submission Feature

Users can paste any link or job description:

- AI extracts details
- AI matches to their CV
- Adds to community feed
- User gets credits/rewards

## User Preferences

- Full-time / Contract / Freelance / All
- Remote / Hybrid / Onsite / All
- Minimum salary
- Preferred skills
- Preferred industries
- Company size preference
- Location filters
- Notification frequency

## Notification Channels

- Email daily digest
- WhatsApp for 95%+ matches (via Termii for Nigeria)
- Browser push notifications
- Mobile app (future)

## Feature Access

- **Free users:** See sample opportunities (5/day)
- **Premium users:** All opportunities, unlimited
- **Recruiter users:** Post opportunities

## Technical Architecture

- Cron jobs (every 4 hours) to fetch new opportunities
- Store in database with metadata
- AI matching engine (Gemini)
- Notification service
- Deduplication logic (same job on multiple sites)

## Success Metrics

- Number of opportunities found daily
- Match accuracy (users applying to matches)
- Application-to-interview conversion
- User retention (do they check daily?)
