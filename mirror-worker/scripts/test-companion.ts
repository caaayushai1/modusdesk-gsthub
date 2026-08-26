/**
 * Desktop Companion Automated Verification Suite
 * Tests the companion server endpoints without launching a real browser.
 */

const BASE_URL = 'http://127.0.0.1:9090';
let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ❌ FAIL: ${name} — ${msg}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

async function main() {
  console.log('\n══════════════════════════════════════════');
  console.log('  Desktop Companion Verification Suite');
  console.log('══════════════════════════════════════════\n');

  // Test 1: Health endpoint
  await test('GET /api/health returns 200 with HEALTHY status', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.status === 'HEALTHY', `Expected HEALTHY, got ${data.status}`);
    assert(typeof data.version === 'string', 'version should be a string');
    assert(typeof data.uptime === 'number', 'uptime should be a number');
  });

  // Test 2: Login endpoint rejects empty username
  await test('POST /api/login rejects missing username with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test123' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(data.error.includes('Username'), `Error should mention Username`);
  });

  // Test 3: Login endpoint rejects empty password
  await test('POST /api/login rejects missing password with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_user' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(data.error.includes('Password'), `Error should mention Password`);
  });

  // Test 4: Login endpoint rejects empty strings
  await test('POST /api/login rejects blank strings with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '   ', password: 'test123' }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // Test 5: CORS headers present
  await test('Health endpoint returns CORS headers for localhost', async () => {
    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    const acaoHeader = res.headers.get('access-control-allow-origin');
    assert(acaoHeader !== null, 'CORS header should be present');
  });

  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
