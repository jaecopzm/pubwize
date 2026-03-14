# Production Monitoring Checklist

## Daily Checks

### 1. Health Endpoint
```bash
curl https://your-app.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-03-08T...",
  "checks": {
    "redis": "healthy",
    "firestore": "healthy",
    "gemini": "healthy"
  }
}
```

**Action if unhealthy**: Check service status and logs

### 2. Upstash Redis Dashboard
Visit: https://console.upstash.com

Check:
- [ ] Memory usage < 80%
- [ ] Request rate is normal
- [ ] No connection errors
- [ ] Cache hit rate > 70%

### 3. Firebase Console
Visit: https://console.firebase.google.com

Check:
- [ ] Firestore read/write counts
- [ ] Authentication success rate
- [ ] No quota warnings
- [ ] Storage usage

### 4. Application Logs
Check server logs for:
- [ ] No repeated errors
- [ ] Rate limit rejections < 1%
- [ ] API response times < 2s
- [ ] No external service failures

## Weekly Checks

### 1. Cache Performance
Review cache metrics:
- Cache hit rate by endpoint
- Most frequently cached keys
- Cache memory usage trends
- TTL effectiveness

**Optimize if**:
- Hit rate < 70% for frequently accessed data
- Memory usage growing rapidly
- Many cache misses for same keys

### 2. Rate Limiting Analysis
Review rate limit data:
- Which endpoints are rate limited most
- Which users hit limits frequently
- Are limits too strict or too loose?

**Adjust if**:
- Legitimate users hitting limits
- Abuse patterns detected
- Cost concerns with external APIs

### 3. API Performance
Monitor response times:
- Average response time per endpoint
- 95th percentile response times
- Slowest endpoints
- Database query performance

**Optimize if**:
- Response times > 2s consistently
- Specific endpoints are slow
- Database queries need indexing

### 4. Error Rates
Track error patterns:
- Most common errors
- Error rate trends
- User-facing vs system errors
- External service failures

**Fix if**:
- Error rate > 1%
- Specific errors repeating
- User experience impacted

## Monthly Checks

### 1. Cost Analysis
Review service costs:
- Upstash Redis usage and cost
- Firebase Firestore operations
- SERP API usage (Serper)
- AI API usage (Gemini/OpenRouter)
- Unsplash API usage

**Optimize if**:
- Costs growing faster than users
- Specific services are expensive
- Cache could reduce API calls

### 2. Security Review
Check security metrics:
- Failed authentication attempts
- Rate limit violations
- Suspicious IP addresses
- Unusual access patterns

**Investigate if**:
- Spike in failed auth attempts
- Same IP hitting rate limits
- Unusual traffic patterns

### 3. User Growth Impact
Analyze scaling needs:
- User count growth
- API request volume
- Database size growth
- Cache memory needs

**Scale if**:
- Approaching service limits
- Performance degrading
- Need higher tier plans

### 4. Dependency Updates
Check for updates:
- Next.js framework
- Firebase SDK
- Upstash Redis client
- Other npm packages

**Update if**:
- Security vulnerabilities
- Performance improvements
- New features needed

## Alerts to Set Up

### Critical Alerts (Immediate Action)
1. **Health check fails** - Service down
2. **Error rate > 5%** - Major issue
3. **Redis connection fails** - Cache down
4. **Firestore quota exceeded** - Service degraded

### Warning Alerts (Review Soon)
1. **Cache hit rate < 50%** - Cache not effective
2. **Rate limit rejections > 5%** - Limits too strict
3. **API response time > 5s** - Performance issue
4. **Memory usage > 80%** - Scaling needed

### Info Alerts (Monitor)
1. **New user signups** - Growth tracking
2. **High API usage** - Cost monitoring
3. **Cache memory growing** - Capacity planning
4. **External service slow** - Dependency issue

## Metrics to Track

### Performance Metrics
- API response time (avg, p95, p99)
- Cache hit rate
- Database query time
- External API latency

### Reliability Metrics
- Uptime percentage
- Error rate
- Failed requests
- Service availability

### Usage Metrics
- Active users
- API requests per day
- Articles generated
- WordPress publishes

### Cost Metrics
- Redis operations
- Firestore reads/writes
- SERP API calls
- AI API tokens used

## Monitoring Tools

### Current Setup
1. **Upstash Console** - Redis metrics
2. **Firebase Console** - Database and auth metrics
3. **Server Logs** - Application logs
4. **Health Endpoint** - Service status

### Recommended Additions (When Budget Allows)
1. **Sentry** - Error tracking and performance monitoring
2. **Datadog/New Relic** - APM and infrastructure monitoring
3. **LogRocket** - Session replay and user monitoring
4. **PagerDuty** - Alert management and on-call

## Response Procedures

### If Health Check Fails
1. Check Upstash Redis status
2. Check Firebase status page
3. Check Gemini API status
4. Review recent deployments
5. Check server logs for errors
6. Restart services if needed

### If Cache Hit Rate Drops
1. Check Redis memory usage
2. Review cache invalidation logic
3. Check if TTLs are too short
4. Verify cache keys are correct
5. Look for cache eviction patterns

### If Rate Limits Hit Frequently
1. Identify which endpoints
2. Check if legitimate traffic
3. Review rate limit settings
4. Consider increasing limits
5. Add user communication

### If Costs Spike
1. Check which service increased
2. Review API call patterns
3. Look for inefficient queries
4. Check for abuse/spam
5. Optimize caching strategy

## Performance Baselines

### Expected Response Times
- GET /api/articles: < 200ms (cached), < 1s (uncached)
- GET /api/calendar: < 300ms (cached), < 1.5s (uncached)
- POST /api/research/keywords: < 3s (cached), < 8s (uncached)
- POST /api/articles/generate: 30-60s (AI generation)
- POST /api/wordpress/publish: 5-10s (external API)

### Expected Cache Hit Rates
- User plan: > 80%
- Articles list: > 70%
- Calendar events: > 75%
- Keyword research: > 60%
- Sites list: > 85%

### Expected Error Rates
- Overall: < 0.5%
- 4xx errors: < 1%
- 5xx errors: < 0.1%
- Rate limit rejections: < 0.5%

## Optimization Opportunities

### Quick Wins
1. Increase cache TTLs for stable data
2. Add caching to more endpoints
3. Optimize database queries
4. Reduce external API calls

### Medium Effort
1. Implement request deduplication
2. Add cache warming after invalidation
3. Optimize AI prompts for speed
4. Add database indexes

### Long Term
1. Implement CDN for static assets
2. Add read replicas for database
3. Implement background job processing
4. Add service worker for offline support

## Documentation

Keep these docs updated:
- [ ] API endpoint documentation
- [ ] Cache key documentation
- [ ] Rate limit documentation
- [ ] Error code documentation
- [ ] Deployment procedures
- [ ] Incident response playbook

## Review Schedule

- **Daily**: Health checks, error logs
- **Weekly**: Performance metrics, cache analysis
- **Monthly**: Cost review, security audit
- **Quarterly**: Architecture review, scaling plan

## Success Criteria

The app is healthy when:
- ✅ Health endpoint returns 200
- ✅ Cache hit rate > 70%
- ✅ Error rate < 0.5%
- ✅ API response time < 2s (p95)
- ✅ No service outages
- ✅ Costs within budget
- ✅ User satisfaction high
