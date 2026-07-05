# TomParo Job Discovery Feature

## Overview

Automatically discover and rank job listings that match a user's CV at 85%+ compatibility. Available to Premium users only.

## The Value Proposition

"Stop searching for jobs. Let jobs find you."

## Core Features

### 1. Auto Job Discovery

- Scans multiple job boards every 4 hours
- AI matches each job to user's CV
- Shows jobs with 85%+ match
- Sends notifications for 95%+ matches

### 2. User Preferences

- Job titles wanted
- Location (remote/hybrid/onsite/hybrid)
- Salary range
- Industry
- Company size
- Experience level

### 3. Match Explanation

- Overall match %
- Matched skills (green)
- Partial skills (yellow)
- Missing skills (red)
- Experience fit
- Salary fit

### 4. 1-Click Apply

- Auto-fill applications
- Use saved templates
- Attach optimized CV
- Track application status

### 5. Application Tracker

- Applied count
- Interview status
- Offer tracking
- Response times

### 6. Smart Notifications

- Email daily digest
- WhatsApp for perfect matches
- Browser push notifications

## Job Sources

### Phase 1 (Launch)

- RemotiveAPI (free)
- Adzuna API (free tier)
- RSS from Jobberman, MyJobMag, etc.

### Phase 2 (Growth)

- Scrape top Nigerian job boards
- Rotating proxies for scaling

### Phase 3 (Scale)

- Official partnerships (LinkedIn, Indeed)
- Direct API access

## Pricing Impact

This is a **Premium-only feature**. It's the "killer feature" that justifies:

- Consumer Premium: ₦5,000/month
- Increases retention by 40%+
- Reduces churn significantly
- Word-of-mouth marketing driver

## Technical Requirements

### Backend:

- Cron jobs (every 4 hours)
- Job scraper service
- CV-to-Job matching AI
- Notification service

### Database Tables Needed:

- Jobs (scraped listings)
- UserPreferences
- MatchedJobs (per user)
- Applications (tracking)
- ApplicationStatus

### API Integrations:

- RemotiveAPI
- Adzuna
- LinkedIn (future)
- Indeed (future)

## Build Timeline

### Sprint 1 (Week 1): Foundation

- User preferences page
- Preferences database schema
- Basic job listing table

### Sprint 2 (Week 2): First Job Source

- Integrate RemotiveAPI
- Store jobs in database
- Basic display of jobs

### Sprint 3 (Week 3): AI Matching

- Match jobs to CVs
- Ranking algorithm
- Show matches on dashboard

### Sprint 4 (Week 4): Notifications

- Email daily digest
- WhatsApp integration (Termii for Nigeria)
- Browser push notifications

### Sprint 5+ (Ongoing): More Sources

- Add Jobberman scraper
- Add LinkedIn (when possible)
- Application tracking
