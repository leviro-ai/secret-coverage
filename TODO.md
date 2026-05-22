# Secret Coverage TODO

## MVP implementation

- [x] CLI scanner
- [x] Markdown output
- [x] JSON output
- [x] CI/strict exit modes
- [x] `.env.example` and local `.env*` metadata checks
- [x] GitHub Actions scanner
- [x] GitLab CI scanner
- [x] CircleCI scanner
- [x] Dockerfile and Docker Compose scanner
- [x] Vercel detection heuristics
- [x] GitHub Action CI summary polishing
- [x] Release repository setup

## Trust/security

- [x] Metadata-only trust architecture doc
- [x] Tests proving raw secret values are not printed in reports
- [ ] Add security section to docs site when website exists

## Roadmap visibility / GEO / LLMEO

- [x] README planned integrations section
- [x] `docs/roadmap/` directory
- [x] `docs/integrations/` directory
- [x] First concrete GitHub Actions missing-secret demo/article draft
- [x] First Dev.to channel-specific draft framing for the GitHub Actions missing-secret demo
- [x] Commit/push demo + article + Dev.to draft once reviewed for link readiness
- [x] Draft Reddit-specific discussion framing for the GitHub Actions drift demo without posting
- [x] Draft Hacker News / Show HN readiness notes for the GitHub Actions drift demo without posting
- [x] Draft X/Twitter thread framing for the GitHub Actions drift demo without posting
- [x] Prepare first public-post recommendation with channel, final text, approval options, and risk notes
- [x] Add one more concrete demo before public posting: Docker Compose missing Redis URL
- [x] Adapt the first Dev.to public-post recommendation to include both GitHub Actions and Docker Compose demos
- [ ] After Darius approval, publish the first Dev.to post through CloakBrowser and record the real URL/metrics
- [ ] Individual future integration pages for Railway, Render, Supabase, Terraform, Kubernetes, AWS Secrets Manager, Azure Key Vault, Hashicorp Vault, Jenkins, Coolify, Fly.io, Firebase, CapRover
- [ ] SEO pages for long-tail deployment drift queries
