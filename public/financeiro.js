document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, r = document) => r.querySelector(s)
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s))

  const url = new URL(location.href)
  const projectId = url.searchParams.get("id")

  const pNome = $("#p-nome"),
    pCodigo = $("#p-codigo"),
    pGerente = $("#p-gerente"),
    pStatus = $("#p-status")
  const tabEvid = $("#tab-evidencias")
  const tabDoc = $("#tab-docfin")
  const tabBolsas = $("#tab-bolsas")

  const tbody = $("#tbl-compras tbody")
  const btnNovaCompra = $("#btn-nova-compra")
  const modalCompra = $("#modal-compra")
  const btnFecharModal = $("#modal-close")
  const btnCancelarCompra = $("#btn-cancelar-compra")
  const formCompra = $("#form-compra")

  let compras = []
  const LS_KEY = (id) => `compras_${id}`

  const escapeHtml = (t = "") =>
    String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])

  const formatBRL = (value) => {
    if (value == null || value === "") return ""
    const num = Number(value)
    if (Number.isNaN(num)) return ""
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num)
  }

  const formatDateBR = (iso) => {
    if (!iso) return ""
    const [y, m, d] = iso.split("-")
    return `${d}/${m}/${y}`
  }

  const saveLS = () => {
    if (!projectId) return
    try {
      localStorage.setItem(LS_KEY(projectId), JSON.stringify(compras))
    } catch (err) {
      console.warn("Erro ao salvar compras:", err)
    }
  }

  const loadLS = () => {
    if (!projectId) return
    try {
      const raw = localStorage.getItem(LS_KEY(projectId))
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) compras = parsed
      }
    } catch (err) {
      console.warn("Erro ao carregar compras:", err)
    }
  }

  const renderTable = () => {
    if (!tbody) return

    if (compras.length === 0) {
      tbody.innerHTML = '<tr class="table-empty"><td colspan="8">Nenhuma compra cadastrada.</td></tr>'
      return
    }

    tbody.innerHTML = compras
      .map(
        (compra, i) => `
      <tr data-id="${i}">
        <td>${escapeHtml(compra.descricao || "")}</td>
        <td>${escapeHtml(compra.fornecedor || "")}</td>
        <td>${formatBRL(compra.valor)}</td>
        <td>${escapeHtml(compra.categoria || "")}</td>
        <td>${escapeHtml(compra.numeroNota || "")}</td>
        <td>${formatDateBR(compra.dataEmissao)}</td>
        <td>${escapeHtml(compra.status || "")}</td>
        <td>
          <button class="btn btn-sm btn-danger btn-excluir" data-id="${i}">Excluir</button>
        </td>
      </tr>
    `,
      )
      .join("")

    $$(".btn-excluir").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const id = +e.target.dataset.id
        if (confirm("Deseja realmente excluir esta compra?")) {
          compras.splice(id, 1)
          saveLS()
          renderTable()
        }
      }),
    )
  }

  const openModal = () => {
    if (!modalCompra) return
    if (typeof modalCompra.showModal === "function") modalCompra.showModal()
    else modalCompra.setAttribute("open", "")
  }

  const closeModal = () => {
    if (!modalCompra) return
    modalCompra.close()
    formCompra?.reset()
  }

  btnNovaCompra?.addEventListener("click", openModal)
  btnFecharModal?.addEventListener("click", closeModal)
  btnCancelarCompra?.addEventListener("click", closeModal)

  formCompra?.addEventListener("submit", (e) => {
    e.preventDefault()

    const descricao = $("#campo-descricao")?.value?.trim() || ""
    const fornecedor = $("#campo-fornecedor")?.value?.trim() || ""
    const valor = $("#campo-valor")?.value || ""
    const categoria = $("#campo-categoria")?.value?.trim() || ""
    const numeroNota = $("#campo-numero-nota")?.value?.trim() || ""
    const dataEmissao = $("#campo-data-emissao")?.value || ""
    const status = $("#campo-status")?.value || "Pendente"

    if (!descricao || !fornecedor || !valor) {
      alert("Preencha todos os campos obrigatórios.")
      return
    }

    const novaCompra = {
      descricao,
      fornecedor,
      valor: Number.parseFloat(valor.replace(/[^\d,.-]/g, "").replace(",", ".")),
      categoria,
      numeroNota,
      dataEmissao,
      status,
      criadoEm: new Date().toISOString(),
    }

    compras.push(novaCompra)
    saveLS()
    renderTable()
    closeModal()
  })

  const loadProject = async () => {
    try {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Falha ao carregar projetos")
      const json = await res.json()
      const list = Array.isArray(json?.data) ? json.data : []

      let project = list.find((p) => String(p.id) === String(projectId))
      if (!project && list.length) project = list[0]

      if (project) {
        pNome.textContent = project.titulo || "—"
        pCodigo.textContent = project.codigo || project.id || "—"
        pGerente.textContent = project.responsavel || "—"
        pStatus.textContent = (project.status || "—").replace("_", " ")
      }
    } catch (err) {
      console.error("Erro ao carregar projeto:", err)
    }
  }

  const wireTabs = () => {
    const qs = projectId ? `?id=${encodeURIComponent(projectId)}` : ""
    if (tabEvid) tabEvid.href = `/prestacao.html${qs}`
    if (tabDoc) tabDoc.href = `/docfin.html${qs}`
    if (tabBolsas) tabBolsas.href = `/bolsas.html${qs}`
    tabDoc?.classList.add("active")
  }

  const init = () => {
    wireTabs()
    loadLS()
    loadProject()
    renderTable()
  }

  init()
})
