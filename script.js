const storageKey = "leadflow-local-leads";

const sampleLeads = [
  {
    id: crypto.randomUUID(),
    name: "Clinica de estetica",
    phone: "(11) 98888-4411",
    segment: "Estetica",
    source: "Instagram",
    interest: "Captacao de leads",
    urgency: "Alta",
    value: 1800,
    status: "Proposta enviada",
    note: "Recebe muitos contatos no Instagram, mas perde historico e follow-up.",
    createdAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    name: "Assistencia de celulares",
    phone: "(11) 97777-2300",
    segment: "Assistencia tecnica",
    source: "Google",
    interest: "Automacao de orcamentos",
    urgency: "Media",
    value: 1200,
    status: "Contato feito",
    note: "Quer responder orcamentos mais rapido e controlar pedidos.",
    createdAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    name: "Restaurante local",
    phone: "(11) 96666-1200",
    segment: "Restaurante",
    source: "Indicacao",
    interest: "Site institucional",
    urgency: "Alta",
    value: 2400,
    status: "Reuniao marcada",
    note: "Precisa receber pedidos e divulgar cardapio com mais profissionalismo.",
    createdAt: new Date().toISOString()
  }
];

let leads = loadLeads();
let selectedLeadId = null;

const form = document.querySelector("#leadForm");
const rows = document.querySelector("#leadRows");
const emptyState = document.querySelector("#emptyState");
const search = document.querySelector("#search");
const statusFilter = document.querySelector("#statusFilter");
const dialog = document.querySelector("#leadDialog");

const formatMoney = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);

  const lead = {
    id: crypto.randomUUID(),
    name: data.get("name").trim(),
    phone: data.get("phone").trim(),
    segment: data.get("segment"),
    source: data.get("source"),
    interest: data.get("interest"),
    urgency: data.get("urgency"),
    value: Number(data.get("value")) || 0,
    status: data.get("status"),
    note: data.get("note").trim(),
    createdAt: new Date().toISOString()
  };

  leads.unshift(lead);
  saveLeads();
  form.reset();
  render();
});

search.addEventListener("input", render);
statusFilter.addEventListener("change", render);

document.querySelector("#seedLeads").addEventListener("click", () => {
  leads = [...sampleLeads, ...leads];
  saveLeads();
  render();
});

document.querySelector("#exportCsv").addEventListener("click", exportCsv);

document.querySelector("#copyWhatsapp").addEventListener("click", async () => {
  const lead = leads.find((item) => item.id === selectedLeadId);
  if (!lead) return;

  const message = `Ola! Vi que o seu negocio tem interesse em ${lead.interest.toLowerCase()}. Posso te mostrar uma ideia simples para organizar seus contatos, reduzir perda de oportunidades e acompanhar cada cliente pelo WhatsApp.`;
  await navigator.clipboard.writeText(message);
  document.querySelector("#copyWhatsapp").textContent = "Mensagem copiada";
  setTimeout(() => {
    document.querySelector("#copyWhatsapp").textContent = "Copiar mensagem WhatsApp";
  }, 1600);
});

function loadLeads() {
  const saved = localStorage.getItem(storageKey);
  return saved ? JSON.parse(saved) : [];
}

function saveLeads() {
  localStorage.setItem(storageKey, JSON.stringify(leads));
}

function getLeadScore(lead) {
  let score = 30;
  if (lead.urgency === "Media") score += 15;
  if (lead.urgency === "Alta") score += 30;
  if (lead.value >= 1000) score += 15;
  if (lead.value >= 2000) score += 10;
  if (lead.source === "Indicacao") score += 10;
  if (lead.status === "Reuniao marcada") score += 10;
  if (lead.status === "Proposta enviada") score += 15;
  if (lead.status === "Fechado") score += 25;
  return Math.min(score, 100);
}

function getVisibleLeads() {
  const term = search.value.trim().toLowerCase();
  const status = statusFilter.value;

  return leads.filter((lead) => {
    const matchesStatus = status === "Todos" || lead.status === status;
    const text = `${lead.name} ${lead.phone} ${lead.segment} ${lead.interest} ${lead.source}`.toLowerCase();
    return matchesStatus && text.includes(term);
  });
}

function render() {
  renderMetrics();
  renderFunnel();
  renderRows();
}

function renderMetrics() {
  const activeLeads = leads.filter((lead) => lead.status !== "Fechado");
  const hotLeads = leads.filter((lead) => getLeadScore(lead) >= 75);
  const proposalLeads = leads.filter((lead) => lead.status === "Proposta enviada");
  const potentialValue = leads.reduce((sum, lead) => sum + lead.value, 0);

  document.querySelector("#metricTotal").textContent = activeLeads.length;
  document.querySelector("#metricHot").textContent = hotLeads.length;
  document.querySelector("#metricProposal").textContent = proposalLeads.length;
  document.querySelector("#metricValue").textContent = formatMoney.format(potentialValue);
}

function renderFunnel() {
  const countByStatus = (status) => leads.filter((lead) => lead.status === status).length;
  document.querySelector("#funnelNew").textContent = countByStatus("Novo");
  document.querySelector("#funnelContact").textContent = countByStatus("Contato feito");
  document.querySelector("#funnelMeeting").textContent = countByStatus("Reuniao marcada");
  document.querySelector("#funnelProposal").textContent = countByStatus("Proposta enviada");
  document.querySelector("#funnelClosed").textContent = countByStatus("Fechado");
}

function renderRows() {
  const visibleLeads = getVisibleLeads();
  rows.innerHTML = "";
  emptyState.style.display = visibleLeads.length ? "none" : "block";

  visibleLeads.forEach((lead) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <strong>${escapeHtml(lead.name)}</strong>
        <small>${escapeHtml(lead.phone)} · ${escapeHtml(lead.segment)}</small>
      </td>
      <td>
        <strong>${escapeHtml(lead.interest)}</strong>
        <small>${escapeHtml(lead.source)}</small>
      </td>
      <td><span class="badge">${escapeHtml(lead.status)}</span></td>
      <td><span class="score">${getLeadScore(lead)}</span></td>
      <td>${formatMoney.format(lead.value)}</td>
      <td>
        <div class="actions">
          <button class="icon-button" type="button" title="Ver detalhes" data-action="view" data-id="${lead.id}">i</button>
          <button class="icon-button" type="button" title="Avancar status" data-action="next" data-id="${lead.id}">+</button>
          <button class="icon-button" type="button" title="Excluir lead" data-action="delete" data-id="${lead.id}">x</button>
        </div>
      </td>
    `;
    rows.appendChild(tr);
  });
}

rows.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const leadId = button.dataset.id;
  const action = button.dataset.action;

  if (action === "view") openLead(leadId);
  if (action === "next") advanceStatus(leadId);
  if (action === "delete") deleteLead(leadId);
});

function openLead(id) {
  const lead = leads.find((item) => item.id === id);
  if (!lead) return;

  selectedLeadId = id;
  document.querySelector("#dialogTitle").textContent = lead.name;
  document.querySelector("#dialogContent").innerHTML = `
    <span><strong>WhatsApp:</strong> ${escapeHtml(lead.phone)}</span>
    <span><strong>Segmento:</strong> ${escapeHtml(lead.segment)}</span>
    <span><strong>Origem:</strong> ${escapeHtml(lead.source)}</span>
    <span><strong>Interesse:</strong> ${escapeHtml(lead.interest)}</span>
    <span><strong>Urgencia:</strong> ${escapeHtml(lead.urgency)}</span>
    <span><strong>Status:</strong> ${escapeHtml(lead.status)}</span>
    <span><strong>Score:</strong> ${getLeadScore(lead)} / 100</span>
    <span><strong>Valor estimado:</strong> ${formatMoney.format(lead.value)}</span>
    <span><strong>Observacao:</strong> ${escapeHtml(lead.note || "Sem observacao")}</span>
  `;
  dialog.showModal();
}

function advanceStatus(id) {
  const flow = ["Novo", "Contato feito", "Reuniao marcada", "Proposta enviada", "Fechado"];
  leads = leads.map((lead) => {
    if (lead.id !== id) return lead;
    const currentIndex = flow.indexOf(lead.status);
    const nextStatus = flow[Math.min(currentIndex + 1, flow.length - 1)];
    return { ...lead, status: nextStatus };
  });
  saveLeads();
  render();
}

function deleteLead(id) {
  leads = leads.filter((lead) => lead.id !== id);
  saveLeads();
  render();
}

function exportCsv() {
  if (!leads.length) return;

  const headers = ["Nome", "WhatsApp", "Segmento", "Origem", "Interesse", "Urgencia", "Status", "Score", "Valor", "Observacao"];
  const lines = leads.map((lead) => [
    lead.name,
    lead.phone,
    lead.segment,
    lead.source,
    lead.interest,
    lead.urgency,
    lead.status,
    getLeadScore(lead),
    lead.value,
    lead.note
  ].map(toCsvCell).join(","));

  const blob = new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "leads.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function toCsvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
