const $ = selector => document.querySelector(selector);
const labels = { ativo: 'Ativo', manutencao: 'Em manutenção', baixado: 'Baixado' };
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = value => value ? value.slice(0, 10).split('-').reverse().join('/') : '—';
const form = $('#asset-form');
const dialog = $('#asset-dialog');
const retireDialog = $('#retire-dialog');
let assets = [];
let selected = null;
let pending = false;
let toastTimer;

async function request(path, options = {}) {
  let response;
  try { response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000) }); }
  catch { throw new Error('Não foi possível conectar ao aplicativo. Verifique se o servidor está em execução e tente novamente.'); }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
  return data;
}
function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function notify(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500);
}
function showError(element, message) { element.textContent = message; element.hidden = false; }
function normalize(text) { return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR'); }
function render() {
  const inUse = assets.filter(asset => asset.status !== 'baixado');
  $('#total-count').textContent = assets.length;
  $('#active-count').textContent = inUse.length;
  $('#total-value').textContent = currency.format(inUse.reduce((sum, asset) => sum + asset.value, 0));
  const term = normalize($('#search').value.trim());
  const status = $('#status-filter').value;
  const filtered = assets.filter(asset => (status === 'all' || asset.status === status) && normalize([asset.identification, asset.description, asset.location, asset.responsible].join(' ')).includes(term));
  $('#result-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'bem' : 'bens'}`;
  const list = $('#asset-list');
  list.replaceChildren();
  for (const asset of [...filtered].reverse()) {
    const row = node('tr');
    const identity = node('td');
    identity.append(node('span', 'asset-description', asset.description), node('span', 'asset-code', asset.identification));
    const location = node('td');
    location.append(node('span', 'cell-main', asset.location), node('span', 'cell-subtitle', asset.responsible));
    const state = node('td');
    state.append(node('span', `badge ${asset.status}`, labels[asset.status]));
    const action = node('td');
    const button = node('button', 'details-button', 'Ver detalhes →');
    button.setAttribute('aria-label', `Ver detalhes de ${asset.identification}`);
    button.addEventListener('click', () => showDetails(asset.id));
    action.append(button);
    row.append(identity, location, node('td', 'money', currency.format(asset.value)), state, action);
    list.append(row);
  }
  $('#table-wrap').hidden = !filtered.length;
  $('#empty').hidden = !!filtered.length;
  $('#empty-title').textContent = assets.length ? 'Nenhum bem encontrado' : 'Seu inventário começa aqui';
  $('#empty-text').textContent = assets.length ? 'Experimente outro termo ou escolha uma situação diferente.' : 'Cadastre o primeiro bem para acompanhar seu patrimônio.';
  $('#empty-create').hidden = !!assets.length;
}
async function load() {
  $('#loading').hidden = false;
  $('#load-error').hidden = true;
  $('#empty').hidden = true;
  $('#table-wrap').hidden = true;
  try { assets = await request('/api/assets'); render(); }
  catch (error) { $('#load-error').hidden = false; $('#load-error-text').textContent = error.message; }
  finally { $('#loading').hidden = true; }
}
function openDialog() { if (!dialog.open) dialog.showModal(); }
function editAsset(asset = null) {
  selected = asset;
  form.reset();
  $('#details').hidden = true;
  form.hidden = false;
  $('#form-error').hidden = true;
  $('#dialog-eyebrow').textContent = asset ? asset.identification : 'PATRIMÔNIO';
  $('#dialog-title').textContent = asset ? 'Editar bem' : 'Cadastrar bem';
  $('#save').textContent = asset ? 'Salvar alterações' : 'Cadastrar bem';
  if (asset) for (const field of ['identification', 'description', 'location', 'responsible', 'value', 'acquiredAt', 'status']) form.elements[field].value = asset[field];
  form.elements.status.disabled = asset?.status === 'baixado';
  openDialog();
  form.elements.identification.focus();
}
function showDetails(id) {
  selected = assets.find(asset => asset.id === id);
  if (!selected) return;
  const asset = selected;
  form.hidden = true;
  const details = $('#details');
  details.hidden = false;
  details.replaceChildren();
  $('#dialog-eyebrow').textContent = asset.identification;
  $('#dialog-title').textContent = 'Detalhes do bem';
  const grid = node('dl', 'detail-grid');
  for (const [label, value, className] of [['Descrição', asset.description, 'detail-description'], ['Localização', asset.location], ['Responsável', asset.responsible], ['Valor de aquisição', currency.format(asset.value)], ['Data de aquisição', formatDate(asset.acquiredAt)], ['Situação', labels[asset.status]], ...(asset.retiredAt ? [['Data da baixa', formatDate(asset.retiredAt)]] : [])]) {
    const group = node('div', className);
    group.append(node('dt', '', label), node('dd', '', value));
    grid.append(group);
  }
  const actions = node('div', 'dialog-actions detail-actions');
  if (asset.status !== 'baixado') {
    const retire = node('button', 'button text-danger', 'Dar baixa');
    retire.addEventListener('click', () => openRetire(asset));
    actions.append(retire);
  }
  const right = node('div');
  const close = node('button', 'button secondary', 'Fechar');
  close.addEventListener('click', () => dialog.close());
  const edit = node('button', 'button primary', 'Editar bem');
  edit.addEventListener('click', () => editAsset(asset));
  right.append(close, edit);
  actions.append(right);
  details.append(grid, actions);
  openDialog();
}
function openRetire(asset) {
  selected = asset;
  dialog.close();
  $('#retire-description').textContent = `${asset.identification} · ${asset.description}`;
  $('#retire-error').hidden = true;
  retireDialog.showModal();
  $('#cancel-retire').focus();
}
function busy(value) {
  pending = value;
  for (const button of document.querySelectorAll('dialog button')) button.disabled = value;
  for (const field of form.elements) if (field.tagName !== 'BUTTON') field.disabled = value || (field.name === 'status' && selected?.status === 'baixado');
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (pending) return;
  const values = Object.fromEntries(new FormData(form));
  values.value = Number(values.value);
  if (selected?.status === 'baixado') values.status = 'baixado';
  $('#form-error').hidden = true;
  const originalLabel = $('#save').textContent;
  busy(true);
  $('#save').textContent = 'Salvando…';
  try {
    const result = await request(selected ? `/api/assets/${selected.id}` : '/api/assets', { method: selected ? 'PUT' : 'POST', body: JSON.stringify(values) });
    const index = assets.findIndex(asset => asset.id === result.id);
    if (index < 0) assets.push(result); else assets[index] = result;
    render();
    dialog.close();
    notify(index < 0 ? 'Bem cadastrado com sucesso.' : 'Alterações salvas com sucesso.');
  } catch (error) { showError($('#form-error'), error.message); }
  finally { busy(false); $('#save').textContent = originalLabel; }
});
$('#confirm-retire').addEventListener('click', async () => {
  if (pending) return;
  busy(true);
  $('#confirm-retire').textContent = 'Registrando…';
  try {
    const result = await request(`/api/assets/${selected.id}/retire`, { method: 'POST' });
    assets = assets.map(asset => asset.id === result.id ? result : asset);
    render();
    retireDialog.close();
    notify('Baixa registrada. O bem permanece no histórico.');
  } catch (error) { showError($('#retire-error'), error.message); }
  finally { busy(false); $('#confirm-retire').textContent = 'Confirmar baixa'; }
});
for (const id of ['create', 'empty-create']) $(`#${id}`).addEventListener('click', () => editAsset());
for (const id of ['close-dialog', 'cancel-form']) $(`#${id}`).addEventListener('click', () => dialog.close());
for (const id of ['close-retire', 'cancel-retire']) $(`#${id}`).addEventListener('click', () => { retireDialog.close(); showDetails(selected.id); });
for (const modal of [dialog, retireDialog]) modal.addEventListener('cancel', event => { if (pending) event.preventDefault(); });
$('#search').addEventListener('input', render);
$('#status-filter').addEventListener('change', render);
$('#retry').addEventListener('click', load);
load();
