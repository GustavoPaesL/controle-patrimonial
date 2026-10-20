import http from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const root = dirname(fileURLToPath(import.meta.url));
const statuses = ['ativo', 'manutencao', 'baixado'];
const fail = (status, message) => Object.assign(new Error(message), { status });

function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw fail(400, 'Informe os dados do bem.');
  const result = {};
  for (const [key, label, max] of [
    ['identification', 'Identificação', 80], ['description', 'Descrição', 500],
    ['location', 'Localização', 120], ['responsible', 'Responsável', 120],
  ]) {
    if (typeof input[key] !== 'string' || !input[key].trim() || input[key].trim().length > max)
      throw fail(400, `${label}: preencha entre 1 e ${max} caracteres.`);
    result[key] = input[key].trim();
  }
  if (typeof input.value !== 'number' || !Number.isFinite(input.value) || input.value < 0 || input.value > 999999999999.99 || Number(input.value.toFixed(2)) !== input.value)
    throw fail(400, 'Valor: informe um número positivo ou zero, com até duas casas decimais.');
  result.value = Math.round(input.value * 100) / 100;
  const date = input.acquiredAt;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < '0001-01-01' || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date)
    throw fail(400, 'Data de aquisição: informe uma data válida.');
  result.acquiredAt = date;
  if (!statuses.includes(input.status)) throw fail(400, 'Selecione uma situação válida.');
  result.status = input.status;
  return result;
}

export async function createApp({ dataFile = join(root, 'data', 'assets.json') } = {}) {
  await mkdir(dirname(dataFile), { recursive: true });
  let assets;
  try {
    assets = JSON.parse(await readFile(dataFile, 'utf8'));
    if (!Array.isArray(assets) || assets.some(item => typeof item.id !== 'string' || !item.id)) throw new Error('Formato de armazenamento inválido.');
    for (const asset of assets) validate(asset);
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('Não foi possível ler os dados patrimoniais. O arquivo foi preservado.', { cause: error });
    assets = [];
  }
  let queue = Promise.resolve();
  function mutate(operation) {
    const pending = queue.then(async () => {
      const next = structuredClone(assets);
      const result = operation(next);
      const temporary = `${dataFile}.${randomUUID()}.tmp`;
      await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { flag: 'wx' });
      await rename(temporary, dataFile);
      assets = next;
      return result;
    });
    queue = pending.catch(() => {});
    return pending;
  }
  function unique(items, candidate, id) {
    const key = candidate.identification.toLocaleLowerCase('pt-BR');
    if (items.some(item => item.id !== id && item.identification.toLocaleLowerCase('pt-BR') === key))
      throw fail(409, 'Esta identificação já está cadastrada. Use uma identificação única.');
  }
  async function body(request) {
    if (!request.headers['content-type']?.startsWith('application/json')) throw fail(415, 'Envie os dados em JSON.');
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 16384) throw fail(413, 'Os dados enviados excedem o tamanho permitido.');
      chunks.push(chunk);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw fail(400, 'Os dados enviados não são um JSON válido.'); }
  }
  const staticFiles = { '/': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'], '/styles.css': ['styles.css', 'text/css; charset=utf-8'] };
  const server = http.createServer(async (request, response) => {
    const send = (status, payload) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(payload));
    };
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    try {
      const host = request.headers.host;
      if (!host || !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host)) throw fail(403, 'Acesso permitido apenas pelo endereço local.');
      if (request.headers.origin && request.headers.origin !== `http://${host}`) throw fail(403, 'Origem da solicitação não permitida.');
      const path = new URL(request.url, `http://${host}`).pathname;
      if (request.method === 'GET' && staticFiles[path]) {
        const [file, type] = staticFiles[path];
        const content = await readFile(join(root, 'public', file));
        response.writeHead(200, { 'Content-Type': type });
        response.end(content);
        return;
      }
      if (path === '/api/assets' && request.method === 'GET') { await queue; return send(200, assets); }
      if (path === '/api/assets' && request.method === 'POST') {
        const input = validate(await body(request));
        if (input.status === 'baixado') throw fail(400, 'Cadastre o bem antes de dar baixa.');
        const result = await mutate(items => {
          unique(items, input);
          const asset = { id: randomUUID(), ...input, createdAt: new Date().toISOString(), retiredAt: null };
          items.push(asset);
          return asset;
        });
        return send(201, result);
      }
      const match = path.match(/^\/api\/assets\/([^/]+)(\/retire)?$/);
      if (match) {
        const [, id, retire] = match;
        if (request.method === 'GET' && !retire) {
          await queue;
          const asset = assets.find(item => item.id === id);
          if (!asset) throw fail(404, 'Bem não encontrado.');
          return send(200, asset);
        }
        if ((request.method === 'PUT' && !retire) || (request.method === 'POST' && retire)) {
          const input = retire ? null : validate(await body(request));
          const result = await mutate(items => {
            const asset = items.find(item => item.id === id);
            if (!asset) throw fail(404, 'Bem não encontrado.');
            if (retire) {
              if (asset.status === 'baixado') throw fail(409, 'Este bem já recebeu baixa.');
              asset.status = 'baixado';
              asset.retiredAt = new Date().toISOString();
            } else {
              unique(items, input, id);
              if ((asset.status === 'baixado') !== (input.status === 'baixado')) throw fail(400, 'Use a ação de baixa para encerrar o registro. Bens baixados mantêm essa situação.');
              Object.assign(asset, input);
            }
            return asset;
          });
          return send(200, result);
        }
      }
      throw fail(404, 'Página ou operação não encontrada.');
    } catch (error) {
      if (!error.status) console.error('Falha na operação patrimonial:', error.code ?? error.name);
      if (!response.headersSent) send(error.status ?? 500, { error: error.status ? error.message : 'Não foi possível concluir a operação. Tente novamente.' });
      else response.end();
    }
  });
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000);
  try {
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT deve ser um número entre 1 e 65535.');
    const server = await createApp();
    server.on('error', error => { console.error(`Não foi possível iniciar o servidor (${error.code}). Verifique se a porta está disponível.`); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`Acervo disponível em http://127.0.0.1:${port}\nEncerre com Ctrl+C.`));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
