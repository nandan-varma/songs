# Hook Analysis Documentation Index

This folder contains a comprehensive deep-dive analysis of your data fetching patterns and hook organization.

## Documents

### 1. **HOOK_ANALYSIS.md** (Main Report - 10 sections)
The complete technical analysis with detailed explanations, code examples, and recommendations.

**Contents:**
- Executive Summary
- React Query Usage Analysis (15 hooks, boilerplate issues, prefetch opportunities)
- Search Implementation Analysis (3 implementations, debouncing, memory leaks)
- Hook Organization Assessment (39 hooks across 10 categories)
- UI Hooks Analysis (too many wrappers)
- Network & Offline Analysis (duplicated hooks, excellent cache manager)
- Comprehensive Metrics & Statistics
- Detailed Recommendations with Code Examples
- Execution Roadmap (Week 1-3 plan)
- Summary Table (Before vs After)

**Key Finding:** 60% of queries.ts (304 LOC) is boilerplate that could be reduced to ~120 LOC with a factory pattern.

### 2. **HOOK_ANALYSIS_SUMMARY.txt** (Executive Summary)
A formatted text file with quick reference metrics and high-level findings.

**Best For:** Quick overview, team discussions, presentations

### 3. **HOOK_OPTIMIZATION_CHECKLIST.md** (Action Items)
Detailed, step-by-step checklist broken into 4 phases with estimated time and LOC impact.

**Contents:**
- Phase 1: Quick Wins (Day 1) - 2-3 hours
  - Consolidate network detection
  - Remove useAnimationPreferences
  - Move usePerformanceMonitor to dev-tools
  - Add prefetch hooks
  
- Phase 2: Major Refactor (Days 2-3) - 6-8 hours
  - Create query hook factory (60% LOC reduction!)
  - Remove pages/ category (48 LOC)
  - Merge playback/ into player/
  - Create storage/ category
  
- Phase 3: Advanced Features (Days 4-5) - 6 hours
  - Enable SWWR (Stale-While-Revalidate)
  - Add keepPreviousData to search
  - Refactor search suggestions to React Query
  - Add mutation hooks
  
- Phase 4: Cleanup & Testing (Days 5-6) - 4 hours
  - Update documentation
  - Update barrel exports
  - Run test suite
  - Update imports
  - Verify performance

---

## Quick Stats

| Metric | Current | Target | Reduction |
|--------|---------|--------|-----------|
| **Total Hooks** | 39 | 28-32 | 18-28% |
| **Categories** | 10 | 6 | 40% |
| **hooks/ LOC** | 3,371 | 2,800-3,000 | 12-15% |
| **queries.ts LOC** | 304 | ~120 | 60% |
| **Network Detection** | 2 hooks | 1 hook | 50% |
| **Estimated Time** | - | 1 week | - |

---

## Key Recommendations

### 🔴 CRITICAL (Do First)
1. **Create Query Hook Factory** (Priority 1)
   - Eliminates 60% boilerplate in queries.ts
   - Saves ~180 LOC
   - Makes adding new queries trivial
   - Estimated: 1.5 days

2. **Consolidate Hook Organization** (Priority 2)
   - Move pages/ → data/ (unnecessary wrapper category)
   - Merge playback/ → player/ (confusion between similar names)
   - Create storage/ (unify offline/cache/download)
   - Result: 10 categories → 6 categories
   - Estimated: 2-3 days

3. **Eliminate Duplicated Network Hooks** (Priority 3)
   - 80% code duplication between useNetworkDetection & useOffline
   - Create single useOnlineStatus hook
   - Saves ~45 LOC
   - Estimated: 1 day

### 🟡 IMPORTANT (Do Second)
4. **Enable React Query Best Practices** (Priority 4)
   - Add prefetch hooks (0 → 5)
   - Enable SWWR (refetchOnWindowFocus: true)
   - Add keepPreviousData to search
   - Move search suggestions to React Query (remove manual debouncing)
   - Estimated: 2 days

5. **Remove UI Wrapper Hooks** (Priority 5)
   - Remove useAnimationPreferences (15 LOC, use motion/react directly)
   - Move usePerformanceMonitor to dev-tools (114 LOC)
   - Consider simplifying useControlledState
   - Saves ~90 LOC
   - Estimated: 1 day

### 🟢 NICE TO HAVE (Do Third)
6. **Add Mutation Hooks** (Priority 6, Optional)
   - Centralize mutations in hooks/data/mutations.ts
   - Add optimistic updates
   - Consistent error handling with toasts
   - Estimated: 1 day

---

## What's Working Well ✅

- **Excellent cache architecture** with 3-tier strategy (Query → IndexedDB → localStorage)
- **Clean dependency graph** with no circular imports or spaghetti code
- **Type-safe** throughout with TypeScript strict mode
- **Well-organized cache keys** (CACHE_KEYS) and timing (CACHE_TIMES)
- **Good use of React Query** for core data fetching
- **Zustand store** is well-implemented and organized
- **Service Worker integration** works smoothly

These are NOT the problem. The issue is:
- Too much boilerplate around this good foundation
- Too many hooks (39 is too many)
- Duplicated patterns
- Unused React Query features

---

## What Needs Improvement 🔴

1. **Query Boilerplate** (Highest Impact)
   - 28 useQuery calls with 90% identical patterns
   - Could use a factory function to reduce 304 LOC → 120
   
2. **Hook Proliferation**
   - 39 hooks is too many (10 categories)
   - Should consolidate to 28-32 hooks (6 categories)
   
3. **Duplicated Patterns**
   - Network detection: 2 nearly identical hooks
   - Search logic: split across 2 places
   
4. **Unused React Query Features**
   - No prefetch hooks
   - No keepPreviousData
   - SWWR disabled (refetchOnWindowFocus: false)
   - No skipToken usage
   
5. **Unnecessary Wrappers**
   - useAnimationPreferences (15 LOC)
   - usePerformanceMonitor (114 LOC)
   - pages/ category (48 LOC, just thin wrappers)

---

## How to Use This Documentation

### For Team Leads / Project Managers
1. Read **HOOK_ANALYSIS_SUMMARY.txt** (5 min overview)
2. Check the summary table for metrics
3. Review "Quick Wins" section for scope

### For Developers Implementing Changes
1. Start with **HOOK_OPTIMIZATION_CHECKLIST.md**
2. Follow phases in order (1 → 2 → 3 → 4)
3. Reference **HOOK_ANALYSIS.md** for detailed explanations
4. Use code examples from **HOOK_ANALYSIS.md** as templates

### For Code Reviews
1. Reference **HOOK_ANALYSIS.md** sections when reviewing related code
2. Use metrics from summary for before/after comparisons
3. Check if recommendations are being followed

---

## Implementation Strategy

### Week 1: Foundation
- **Mon:** Phase 1 Quick Wins (consolidate network, remove wrappers)
- **Tue-Wed:** Phase 2 Major Refactor (factory pattern, reorganize categories)
- **Thu:** Phase 3 Advanced Features (SWWR, prefetch, mutations)
- **Fri:** Phase 4 Cleanup & Testing

### Communication
- Update AGENTS.md hook guidelines after Phase 2
- Document new patterns in README.md
- Add code examples for factory pattern usage

### Testing Strategy
- Run `npm run build` after each phase
- Run `npm run lint` to catch issues early
- Manual testing in browser for each phase
- Verify bundle size doesn't increase

---

## FAQ

**Q: How much time will this take?**
A: ~1 week for full optimization, ~2-3 days for quick wins

**Q: Is this a breaking change?**
A: No, with backward-compatible re-exports and careful migration

**Q: Can I do this incrementally?**
A: Yes! Each phase can be done independently, though Phase 1 should come first

**Q: Will this improve performance?**
A: Primarily improves code maintainability and developer experience. Performance is already good.

**Q: Should I do the optional Priority 6 (mutations)?**
A: Yes, but after Phases 1-3. It provides consistency across the codebase.

---

## Related Analysis

- **AUDIO_COMPLEXITY_ANALYSIS.md** - Audio system deep dive
- **REFACTORING_ROADMAP.md** - General refactoring priorities
- **ANALYSIS_SUMMARY.md** - Previous analysis work

---

## Success Metrics

After implementing all recommendations:
- Hook count: 39 → 28-32 (18-28% reduction)
- Categories: 10 → 6 (40% consolidation)
- LOC: 3,371 → 2,800-3,000 (12-15% reduction)
- Boilerplate: 304 → 120 in queries.ts (60% reduction)
- Developer experience: Much easier to add new queries and hooks

---

## Next Steps

1. **Schedule review** with team on findings
2. **Start Phase 1** this week (quick wins, ~3 hours)
3. **Plan Phase 2** for next week (major refactor, ~7 hours)
4. **Update documentation** as you implement changes
5. **Measure results** at end of week

---

*Analysis Date: 2026-04-04*
*Codebase: songs/ (Next.js music app)*
*Tools: React Query 6.x, Zustand, TypeScript strict mode*
