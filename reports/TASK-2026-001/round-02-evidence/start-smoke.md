# Smoke do comando de execução

Data: 2026-10-19. Executado pelo Manager a pedido do Tester para evitar espera de solicitação de execução no subagente.

1. `npm start` iniciou `node server.mjs` e imprimiu `Acervo disponível em http://127.0.0.1:3000`. Sessão de execução: 57255.
2. Comando executado:

```powershell
node -e "Promise.all(['/', '/api/assets', '/app.js', '/styles.css'].map(async p => { const r = await fetch('http://127.0.0.1:3000'+p); console.log(p, r.status, r.headers.get('content-type')); if (!r.ok) process.exitCode=1; if(p==='/api/assets') console.log('Inventario inicial:', await r.text()); }))"
```

Resultado: saída 0; todos os quatro caminhos retornaram HTTP 200, respectivamente HTML, JSON, JavaScript e CSS. API retornou `[]`. Nenhum registro real criado.

3. Enviado Ctrl+C à sessão 57255 para encerrar o processo iniciado nesta verificação. Sessão encerrou com saída 1 pela interrupção, sem mensagem de erro da aplicação.
4. Verificação após encerramento:

```powershell
node -e "fetch('http://127.0.0.1:3000',{signal:AbortSignal.timeout(1000)}).then(()=>{console.error('Servidor ainda responde');process.exitCode=1}).catch(()=>console.log('Servidor encerrado: conexao recusada'))"
```

Resultado: saída 0, `Servidor encerrado: conexao recusada`. Pasta `data/` criada vazia pelo início normal; inventário não foi populado.

Verificação APROVADA: comando documentado inicia a aplicação, arquivos/API respondem e processo foi encerrado após teste.
