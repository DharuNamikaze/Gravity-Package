# Gravity - Production Roadmap

## Phase 1: Production-Ready MCP Tools

### Tier 1: Critical Tools (Must Have)

#### 1. `analyze_layout_issues` (Enhanced diagnose_layout)
- Comprehensive layout analysis
- Returns actionable fixes with code snippets
- Detects: overflow, positioning, sizing, spacing issues
- **Output:** Issues with CSS fix suggestions

#### 2. `get_element_metrics`
- Get precise element measurements
- Position relative to viewport, parent, document
- Computed vs declared styles
- Box model breakdown (content, padding, border, margin)
- **Output:** Complete metrics object

#### 3. `find_layout_conflicts`
- Detect z-index stacking issues
- Find overlapping elements
- Detect conflicting CSS rules
- **Output:** List of conflicts with severity

#### 4. `check_responsive_design`
- Test element at multiple breakpoints
- Detect responsive issues
- Check media query effectiveness
- **Output:** Breakpoint analysis

#### 5. `audit_performance`
- Detect layout thrashing
- Find expensive CSS properties
- Check animation performance
- **Output:** Performance issues with suggestions

### Tier 2: Enhancement Tools (Should Have)

#### 6. `get_css_rules`
- Get all CSS rules affecting element
- Show specificity and cascade
- Identify overrides
- **Output:** CSS rules with source

#### 7. `find_similar_elements`
- Find elements with same issues
- Batch fix suggestions
- **Output:** List of affected elements

#### 8. `validate_accessibility`
- WCAG compliance check
- Color contrast verification
- ARIA attribute validation
- Keyboard navigation check
- **Output:** Accessibility report

#### 9. `get_element_state`
- Get element's current state
- Hover, focus, active states
- Animation state
- **Output:** Current state object

#### 10. `compare_elements`
- Compare two elements
- Highlight differences
- Suggest alignment/consistency fixes
- **Output:** Comparison report

### Tier 3: Advanced Tools (Nice to Have)

#### 11. `generate_fix_code`
- AI-powered fix generation
- Multiple solution options
- Explain each fix
- **Output:** Code snippets with explanations

#### 12. `test_fix`
- Apply fix temporarily
- Verify visually
- Rollback if needed
- **Output:** Before/after comparison

#### 13. `export_styles`
- Export element styles as CSS
- Generate SCSS/CSS-in-JS
- **Output:** Style code

#### 14. `find_unused_styles`
- Detect unused CSS rules
- Suggest cleanup
- **Output:** Unused rules list

#### 15. `get_computed_cascade`
- Show CSS cascade for property
- Explain why value is applied
- **Output:** Cascade explanation

---

## Phase 2: NPM Package Structure

```
gravity/gravity/
├── packages/
│   ├── mcp-server/              # MCP Server (TypeScript)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── native-bridge.ts
│   │   │   ├── tools.ts
│   │   │   ├── tools/
│   │   │   │   ├── layout.ts
│   │   │   │   ├── accessibility.ts
│   │   │   │   ├── performance.ts
│   │   │   │   ├── css.ts
│   │   │   │   └── advanced.ts
│   │   │   └── types.ts
│   │   ├── build/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── native-host/             # Native Host (Node.js)
│   │   ├── src/
│   │   │   └── index.js
│   │   ├── bin/
│   │   │   ├── gravity-host.js
│   │   │   ├── gravity-host.bat
│   │   │   └── gravity-host.sh
│   │   ├── package.json
│   │   └── manifest.json
│   │
│   └── extension/               # Chrome Extension
│       ├── src/
│       │   ├── background.ts
│       │   ├── content.ts
│       │   ├── popup.ts
│       │   └── types.ts
│       ├── public/
│       │   ├── manifest.json
│       │   ├── popup.html
│       │   └── icons/
│       ├── build/
│       ├── package.json
│       └── webpack.config.js
│
├── packages/cli/                # CLI Tool for setup
│   ├── src/
│   │   ├── index.ts
│   │   ├── commands/
│   │   │   ├── install.ts
│   │   │   ├── register.ts
│   │   │   └── verify.ts
│   │   └── utils/
│   ├── bin/
│   │   └── gravity.js
│   └── package.json
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SETUP.md
│   ├── TOOLS.md
│   └── EXAMPLES.md
│
├── examples/
│   ├── kiro-integration.md
│   ├── vscode-integration.md
│   ├── cursor-integration.md
│   └── test-page.html
│
├── package.json                 # Root monorepo
├── tsconfig.json
├── lerna.json                   # Monorepo config
└── README.md
```

---

## Phase 3: NPM Publishing

### Package Names
- `gravity/gravity` - Main package
- `gravity/mcp-server` - MCP server only
- `gravity/native-host` - Native host only
- `gravity/extension` - Extension only
- `gravity/cli` - CLI tool

### Publishing Steps
1. Setup npm organization
2. Configure CI/CD (GitHub Actions)
3. Auto-publish on version bump
4. Publish to npm registry

---

## Phase 4: IDE Integration

### Kiro Integration
- Auto-install MCP server
- Auto-register native host
- Auto-load extension

### VSCode Integration
- VSCode extension wrapper
- Auto-setup native host
- Command palette integration

### Cursor Integration
- Similar to VSCode
- Cursor-specific optimizations

---

## Implementation Priority

1. **Week 1:** Tier 1 tools (5 critical tools)
2. **Week 2:** Tier 2 tools (5 enhancement tools)
3. **Week 3:** Tier 3 tools (5 advanced tools)
4. **Week 4:** NPM packaging & CLI
5. **Week 5:** IDE integrations
6. **Week 6:** Testing & documentation

---

## Success Metrics

- [ ] 15 production-ready tools
- [ ] <100ms response time per tool
- [ ] 99% uptime
- [ ] <1MB npm package size
- [ ] Works on Windows, macOS, Linux
- [ ] Works with Kiro, VSCode, Cursor
- [ ] Full test coverage
- [ ] Complete documentation
