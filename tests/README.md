# Gravity Test Suite

Comprehensive test suite with 100 tests across 10 different test types.

## Test Types

### 1. Unit Tests (10 tests)
**Location:** `tests/unit/native-host.test.ts`

Tests individual functions and components in isolation:
- WebSocket server creation
- Log file handling
- Connection events
- Message parsing
- Error handling
- Process lifecycle

**Run:** `npm test tests/unit/native-host.test.ts`

### 2. Integration Tests (10 tests)
**Location:** `tests/integration/extension-native-host.test.ts`

Tests interaction between Chrome extension and native host:
- Native host process startup
- WebSocket connections from MCP server
- Message forwarding (MCP ↔ Extension)
- Multiple concurrent connections
- Reconnection after connection loss
- Native messaging protocol
- Message validation
- Large message handling
- Message ordering
- stdin/stdout communication

**Run:** `npm test tests/integration/extension-native-host.test.ts`

### 3. End-to-End Tests (10 tests)
**Location:** `tests/e2e/full-flow.test.ts`

Tests complete flow from IDE to Browser:
- Full diagnostic flow (IDE → MCP → Native Host → Extension → Browser)
- MCP server startup and connection
- CSS layout diagnosis
- Browser connection status check
- Element highlighting
- Connection timeout handling
- Connection retry logic
- Multiple sequential requests
- State management
- Resource cleanup

**Run:** `npm test tests/e2e/full-flow.test.ts`

### 4. Performance Tests (10 tests)
**Location:** `tests/performance/load.test.ts`

Tests system performance under load:
- 100 concurrent WebSocket connections
- 1000 messages per second processing
- Large message payloads (1MB)
- Memory usage under load
- Response time (< 100ms)
- Burst traffic handling (1000 requests/second)
- Long-running connection stability
- Rapid connect/disconnect cycles
- CDP command processing speed
- 10,000 diagnostic requests

**Run:** `npm test tests/performance/load.test.ts`

### 5. Security Tests (10 tests)
**Location:** `tests/security/validation.test.ts`

Tests security validations and protections:
- Malformed JSON rejection
- Extension ID format validation
- CSS selector sanitization (XSS prevention)
- Message type validation
- Origin authorization
- CDP method name validation
- Command injection prevention
- Port number validation
- Message size limits (DoS prevention)
- Directory traversal prevention

**Run:** `npm test tests/security/validation.test.ts`

### 6. Error Handling Tests (10 tests)
**Location:** `tests/error-handling/recovery.test.ts`

Tests error scenarios and recovery:
- WebSocket connection errors
- Native host crash recovery
- JSON parse error handling
- Missing extension ID handling
- Registry write failures
- Port already in use errors
- CDP command timeout
- Debugger detach events
- Tab close events
- Uncaught exception handling

**Run:** `npm test tests/error-handling/recovery.test.ts`

### 7. Compatibility Tests (10 tests)
**Location:** `tests/compatibility/browser.test.ts`

Tests compatibility across browsers and environments:
- Chrome browser detection
- Brave browser detection
- Edge browser detection
- Windows platform support
- Chrome Manifest V3 support
- Chrome DevTools Protocol 1.3 support
- Chrome profile structure handling
- Node.js 16+ support
- Extension ID format support
- WebSocket protocol support

**Run:** `npm test tests/compatibility/browser.test.ts`

### 8. Regression Tests (10 tests)
**Location:** `tests/regression/bug-fixes.test.ts`

Tests to ensure previously fixed bugs don't reoccur:
- Bug #1: Absolute path in batch file
- Bug #2: Immediate exit after connection
- Bug #3: Extension manifest version format
- Bug #4: All Chrome profiles scanning
- Bug #5: WebSocket connection close handling
- Bug #6: Logging for debugging
- Bug #7: stdin close handling
- Bug #8: Auto-registration of extension ID
- Bug #9: Multiple reconnection attempts
- Bug #10: Registry key path validation

**Run:** `npm test tests/regression/bug-fixes.test.ts`

### 9. Stress Tests (10 tests)
**Location:** `tests/stress/extreme-load.test.ts`

Tests system behavior under extreme conditions:
- 10,000 concurrent connections
- 1 million message processing
- Rapid connection churn (1000/second)
- 100MB message payload
- Memory pressure (1GB allocated)
- 24-hour continuous operation
- CPU-intensive operations
- Disk I/O pressure
- Network latency spikes
- Resource exhaustion recovery

**Run:** `npm test tests/stress/extreme-load.test.ts`

### 10. Functional Tests (10 tests)
**Location:** `tests/functional/mcp-protocol.test.ts`

Tests MCP protocol compliance:
- JSON-RPC 2.0 request formatting
- JSON-RPC 2.0 response formatting
- JSON-RPC 2.0 error response formatting
- tools/list request handling
- tools/list response with available tools
- initialize request handling
- initialize response with capabilities
- Notification handling (no id)
- Tool argument validation against schema
- Tool execution timeout

**Run:** `npm test tests/functional/mcp-protocol.test.ts`

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Type
```bash
npm test tests/unit/
npm test tests/integration/
npm test tests/e2e/
npm test tests/performance/
npm test tests/security/
npm test tests/error-handling/
npm test tests/compatibility/
npm test tests/regression/
npm test tests/stress/
npm test tests/functional/
```

### Run Single Test File
```bash
npm test tests/unit/native-host.test.ts
```

## Test Coverage

Total: **100 tests** across **10 test types**

- Unit Tests: 10
- Integration Tests: 10
- End-to-End Tests: 10
- Performance Tests: 10
- Security Tests: 10
- Error Handling Tests: 10
- Compatibility Tests: 10
- Regression Tests: 10
- Stress Tests: 10
- Functional Tests: 10

## Prerequisites

1. Build the project:
   ```bash
   npm run build
   ```

2. Install globally (for some tests):
   ```bash
   npm install -g .
   ```

3. Setup native host (for integration/e2e tests):
   ```bash
   npx gravity-core setup-native-host
   ```

## Test Environment

- Node.js: 16+
- Platform: Windows (some tests are Windows-specific)
- Browser: Chrome/Brave/Edge with Gravity extension loaded

## Notes

- Some tests require the native host to be running
- Some tests require the Chrome extension to be loaded
- Performance and stress tests may take longer to complete
- Integration and E2E tests may require manual setup

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: |
    npm install
    npm run build
    npm test
```

## Contributing

When adding new features:
1. Add corresponding unit tests
2. Add integration tests if the feature involves multiple components
3. Add E2E tests if the feature affects the complete flow
4. Update regression tests if fixing a bug
5. Ensure all tests pass before submitting PR
