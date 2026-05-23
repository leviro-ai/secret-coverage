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

- [ ] Recurring heartbeat guard: check local package version vs published npm version; when it changes, inspect release/code/doc changes and update `context.md`, active plans, TODO/progress notes, and stale publish packets before the next marketing/build slice
- [x] README planned integrations section
- [x] `docs/roadmap/` directory
- [x] `docs/integrations/` directory
- [x] First concrete GitHub Actions missing-secret demo/article draft
- [x] First Dev.to channel-specific draft framing for the GitHub Actions missing-secret demo
- [x] Commit/push demo + article + Dev.to draft once reviewed for link readiness
- [x] Draft Reddit-specific discussion framing for the GitHub Actions drift demo without posting
- [x] Draft Hacker News / Show HN readiness notes for the GitHub Actions drift demo without posting
- [x] Draft X/Twitter thread framing for the GitHub Actions drift demo without posting
- [x] Add a post-Dev.to cooldown X/Twitter follow-up variant without posting
- [x] Create/log in to Medium free account and add Medium distribution strategy as a secondary channel
- [x] Prepare first public-post recommendation with channel, final text, approval options, and risk notes
- [x] Add one more concrete demo before public posting: Docker Compose missing Redis URL
- [x] Adapt the first Dev.to public-post recommendation to include both GitHub Actions and Docker Compose demos
- [x] Add one more non-public demo while approval is pending: Vercel missing Supabase service key
- [x] Add one more non-public demo while approval is pending: CircleCI missing deploy key
- [x] Draft first long-tail SEO checklist page for CI/CD environment variable validation
- [x] Draft real-repo-style AI-agent PR environment review walkthrough without posting publicly
- [x] After Darius approval, publish the first Dev.to post through CloakBrowser and record the real URL/metrics
- [x] Adapt first-post recommendation to optionally reference the Vercel and CircleCI demos without making the post too broad
- [x] After Darius approval, publish the recommended Dev.to post as either two-demo-only or two-demo plus optional Vercel/CircleCI follow-up links
- [x] Monitor first Dev.to post metrics/comment and draft a non-posted reply packet for the first visible comment
- [x] After Darius approval, reply to the Dev.to comment with a concise, non-defensive positioning clarification
- [x] Draft GitHub Actions missing-secrets troubleshooting page without posting publicly
- [x] Draft Docker Compose environment variable troubleshooting page without posting publicly
- [x] Draft Vercel environment variable troubleshooting page without posting publicly
- [x] Draft CircleCI environment variable troubleshooting page without posting publicly
- [x] Draft HashiCorp Vault environment variable troubleshooting page without claiming Vault API/dashboard integration
- [ ] Individual future integration pages for Jenkins, Coolify, Fly.io, Firebase, CapRover
- [x] Draft Supabase environment variable troubleshooting page without claiming Supabase API/dashboard integration
- [x] Draft Railway environment variable troubleshooting page without claiming Railway API/dashboard integration
- [x] Draft Render environment variable troubleshooting page without claiming Render API/dashboard integration
- [x] Draft Terraform environment variable troubleshooting page without claiming Terraform Cloud or cloud-provider API integration
- [x] Draft Kubernetes environment variable troubleshooting page without claiming cluster API/dashboard integration
- [x] Draft AWS Secrets Manager environment variable troubleshooting page without claiming AWS API/dashboard integration
- [ ] More SEO pages for long-tail deployment drift queries
- [x] Draft the first Medium-native article: AI agents are making deployment drift easier to create
- [x] Prepare Medium publish packet for the AI/deployment-drift article
- [x] Rewrite Medium draft title to shorter SEO-friendly version after preview review
- [x] Publish the Medium-native AI/deployment-drift article after final preview verification
- [x] Add lightweight README navigation links to the checklist and AI-agent PR walkthrough
- [x] Prepare a copy/paste Dev.to publish packet
- [x] Add one more non-public demo/support asset while approval is pending: GitLab CI missing deploy token
- [x] Package existing demos and support pages into a docs/articles index
- [x] Add one more demo/support asset after first Dev.to post: Next.js missing Stripe secret
- [x] Draft Azure Key Vault environment variable troubleshooting page without claiming Azure API/dashboard integration
- [ ] Adapt the AI-agent walkthrough into a platform-native public post when it is the next best distribution slice
