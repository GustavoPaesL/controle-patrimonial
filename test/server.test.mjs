import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server.mjs';
import http from 'node:http';

const sample = (identification = 'PAT-001') => ({ identification, description: 'Notebook de trabalho', location: 'Escritório', responsible: 'Ana', value: 3299.90, acquiredAt: '2024-02-29', status: 'ativo' });
async function setup(t) {
  const directory = await mkdtemp(join(tmpdir(), 'acervo-test-'));
  const dataFile = join(directory, 'assets.json');
  let server;
  let base;
  async function start() {
    server = await createApp({ dataFile });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  }
  async function stop() { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
  await start();
  t.after(async () => { await stop(); await rm(directory, { recursive: true, force: true }); });
  return { dataFile, restart: async () => { await stop(); await start(); }, call: async (path = '/api/assets', method = 'GET', body, headers = {}) => {
    const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, data: await response.json(), headers: response.headers };
  }, raw: (...args) => fetch(`${base}${args[0]}`, args[1]), foreignHost: () => new Promise((resolve, reject) => {
    const request = http.get(`${base}/api/assets`, { headers: { Host: 'example.com' } }, response => { response.resume(); resolve(response.statusCode); });
    request.on('error', reject);
  }) };
}
test('cadastro, consulta, edição, baixa preservada e persistência após reinício', async t => {
  const app = await setup(t);
  assert.deepEqual((await app.call()).data, []);
  const created = await app.call('/api/assets', 'POST', sample());
  assert.equal(created.status, 201);
  const id = created.data.id;
  assert.equal((await app.call(`/api/assets/${id}`)).data.identification, 'PAT-001');
  const edited = await app.call(`/api/assets/${id}`, 'PUT', { ...sample(), location: 'Sala 02', status: 'manutencao' });
  assert.equal(edited.status, 200);
  assert.equal(edited.data.location, 'Sala 02');
  const retired = await app.call(`/api/assets/${id}/retire`, 'POST');
  assert.equal(retired.status, 200);
  assert.equal(retired.data.status, 'baixado');
  assert.ok(retired.data.retiredAt);
  assert.equal((await app.call(`/api/assets/${id}/retire`, 'POST')).status, 409);
  assert.equal((await app.call(`/api/assets/${id}`, 'PUT', sample())).status, 400);
  await app.restart();
  const stored = (await app.call()).data;
  assert.equal(stored.length, 1);
  assert.equal(stored[0].status, 'baixado');
  assert.equal(stored[0].location, 'Sala 02');
  assert.equal(JSON.parse(await readFile(app.dataFile, 'utf8'))[0].id, id);
});
test('validação de campos, valores, datas, situação e identificação única', async t => {
  const app = await setup(t);
  assert.equal((await app.call('/api/assets', 'POST', sample())).status, 201);
  assert.equal((await app.call('/api/assets', 'POST', sample(' pat-001 '))).status, 409);
  for (const invalid of [null, [], {}, { ...sample('A'), description: ' ' }, { ...sample('A'), identification: 'x'.repeat(81) }, { ...sample('A'), value: -1 }, { ...sample('A'), value: '12' }, { ...sample('A'), value: 1.123 }, { ...sample('A'), acquiredAt: '2025-02-29' }, { ...sample('A'), acquiredAt: '2024-13-01' }, { ...sample('A'), status: 'desconhecido' }, { ...sample('A'), status: 'baixado' }]) {
    assert.equal((await app.call('/api/assets', 'POST', invalid)).status, 400);
  }
  const second = await app.call('/api/assets', 'POST', sample('PAT-002'));
  assert.equal((await app.call(`/api/assets/${second.data.id}`, 'PUT', sample())).status, 409);
  assert.equal((await app.call('/api/assets/ausente')).status, 404);
  assert.equal((await app.call('/api/assets/ausente', 'PUT', sample('A'))).status, 404);
  assert.equal((await app.call('/api/assets/ausente/retire', 'POST')).status, 404);
});
test('mutações concorrentes não perdem dados e serializam duplicidade', async t => {
  const app = await setup(t);
  const results = await Promise.all(Array.from({ length: 10 }, (_, i) => app.call('/api/assets', 'POST', sample(`P-${i}`))));
  assert.ok(results.every(result => result.status === 201));
  const duplicates = await Promise.all([app.call('/api/assets', 'POST', sample('X')), app.call('/api/assets', 'POST', sample('x'))]);
  assert.deepEqual(duplicates.map(item => item.status).sort(), [201, 409]);
  assert.equal((await app.call()).data.length, 11);
  await app.restart();
  assert.equal((await app.call()).data.length, 11);
});
test('proteção de origem/host, JSON inválido, limite e arquivos públicos', async t => {
  const app = await setup(t);
  assert.equal((await app.call('/api/assets', 'POST', sample(), { Origin: 'https://example.com' })).status, 403);
  assert.equal(await app.foreignHost(), 403);
  assert.equal((await app.raw('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' })).status, 400);
  assert.equal((await app.raw('/api/assets', { method: 'POST', body: '{}' })).status, 415);
  assert.equal((await app.call('/api/assets', 'POST', { big: 'a'.repeat(17000) })).status, 413);
  for (const path of ['/', '/app.js', '/styles.css']) {
    const response = await app.raw(path);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
  }
  assert.equal((await app.raw('/server.mjs')).status, 404);
  assert.equal((await app.raw('/data/assets.json')).status, 404);
});
test('arquivo corrompido impede inicialização sem sobrescrever dados', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'acervo-corrupt-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const dataFile = join(directory, 'assets.json');
  await writeFile(dataFile, 'arquivo inválido');
  await assert.rejects(createApp({ dataFile }), /arquivo foi preservado/);
  assert.equal(await readFile(dataFile, 'utf8'), 'arquivo inválido');
});
