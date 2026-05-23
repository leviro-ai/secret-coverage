# Secret Coverage Marketing Account Inventory

Last checked: 2026-05-23 06:43 EEST

Scope: channels from the organic authority plan: GitHub, npm, Dev.to, Medium, Reddit, Hacker News, X/Twitter.

No passwords, tokens, cookies, or secret values are recorded here.

## Summary

| Channel | Status | Evidence | Next action |
| --- | --- | --- | --- |
| GitHub | Available via CLI | `gh auth status` shows logged in as `dariuskasperavicius` with repo/workflow scopes | Can manage repo/issues/releases when approved |
| npm | Available via CLI | `npm whoami` returns `dariuskasperavicius`; package `@leviro-ai/secret-coverage@0.1.5` is published as `latest` | Can inspect package; publishing still requires OTP/explicit approval |
| Dev.to | Available via running CloakBrowser | CDP check reached `https://dev.to/dashboard`; page shows dashboard and `Create Post` | Can draft/post after content is ready and Darius approves public posting |
| Medium | Available via running CloakBrowser | Created/logged in with free account via Google; profile observed as `https://medium.com/@dardar.hermes` | Use as secondary channel for Medium-native rewrites and founder/engineering narratives |
| Reddit | Available via running CloakBrowser | CDP check reached `https://www.reddit.com/settings/profile`; page shows Settings/Profile/Create Post UI | Can post/comment carefully after subreddit-specific review |
| Hacker News | Available via running CloakBrowser | CDP check on HN topbar shows logged-in user and `logout` | Can submit/comment carefully after Show HN/article asset is ready |
| X/Twitter | Available via running CloakBrowser | CDP check reached `https://x.com/home`; page shows home timeline and post composer | Can post concise technical updates after assets are ready |
| Dev.to/Reddit/HN/X CLI automation | Browser only | `xurl` command not installed; access verified through CloakBrowser on remote debugging port `9222` | Use the already-open CloakBrowser session for posting |

## Notes

- Use free/no-cost plans by default.
- Do not create paid trials.
- Do not fake engagement, comments, stars, testimonials, or reviews.
- Public posting should wait for concrete assets: demo repo, screenshot-ready CLI output, and first article draft.
- Prefer GitHub + npm + repo-hosted content first because those are already available and credible.
