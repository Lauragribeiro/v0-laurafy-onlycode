const defaultNow = () => new Date()
const defaultIdFactory = () => `${Date.now()}_${Math.random().toString(36).slice(2)}`

export const resolveStoredBolsistas = ({ previous = [], stored = null, projectId = "" } = {}) => {
  const prevList = Array.isArray(previous) ? [...previous] : []
  if (!projectId) {
    return { list: prevList, shouldPersist: false }
  }

  if (Array.isArray(stored) && stored.length > 0) {
    return { list: stored, shouldPersist: false }
  }

  if (prevList.length > 0) {
    return { list: prevList, shouldPersist: true }
  }

  return { list: Array.isArray(stored) ? [...stored] : [], shouldPersist: false }
}

export const buildTermoData = (upload, fallback = null, now = defaultNow) => {
  if (upload) {
    const stamp = now()
    const iso = stamp.toISOString()
    return {
      fileName: upload.fileName,
      vigenciaRaw: upload.parsed?.vigenciaRaw || "",
      vigenciaISO: upload.parsed?.vigenciaISO || null,
      valorMaximoRaw: upload.parsed?.valorMaximoRaw || "",
      valorMaximo: upload.parsed?.valorMaximo ?? null,
      parsedAt: iso,
    }
  }

  if (fallback) {
    return { ...fallback }
  }

  return null
}

export const buildBolsistaRecord = ({
  editingId = null,
  nome = "",
  cpfDigits = "",
  funcao = "",
  valorNum = 0,
  termoUpload = null,
  fallbackTermo = null,
  existingRecord = null,
  periodosVinculados = [],
} = {}) => {
  const now = new Date().toISOString()
  const id = editingId ?? Date.now()

  let termo = null
  if (termoUpload) {
    termo = {
      fileName: termoUpload.fileName || "termo.pdf",
      inicio_vigencia: termoUpload.parsed?.inicio_vigencia || null,
      fim_vigencia: termoUpload.parsed?.fim_vigencia || null,
      vigenciaInicio: termoUpload.parsed?.inicio_vigencia || null,
      vigenciaFim: termoUpload.parsed?.fim_vigencia || null,
      vigenciaISO: termoUpload.parsed?.fim_vigencia || termoUpload.parsed?.vigenciaISO || null,
      vigenciaRaw: termoUpload.parsed?.fonte_texto || termoUpload.parsed?.vigenciaRaw || "",
      fonte_texto: termoUpload.parsed?.fonte_texto || "",
      valorMaximo: termoUpload.parsed?.valorMaximo || null,
      valorMaximoRaw: termoUpload.parsed?.valorMaximoRaw || "",
    }
  } else if (fallbackTermo) {
    termo = {
      fileName: fallbackTermo.fileName || "termo.pdf",
      inicio_vigencia: fallbackTermo.inicio_vigencia || fallbackTermo.vigenciaInicio || null,
      fim_vigencia: fallbackTermo.fim_vigencia || fallbackTermo.vigenciaFim || fallbackTermo.vigenciaISO || null,
      vigenciaInicio: fallbackTermo.inicio_vigencia || fallbackTermo.vigenciaInicio || null,
      vigenciaFim: fallbackTermo.fim_vigencia || fallbackTermo.vigenciaFim || null,
      vigenciaISO: fallbackTermo.fim_vigencia || fallbackTermo.vigenciaFim || fallbackTermo.vigenciaISO || null,
      vigenciaRaw: fallbackTermo.fonte_texto || fallbackTermo.vigenciaRaw || "",
      fonte_texto: fallbackTermo.fonte_texto || fallbackTermo.vigenciaRaw || "",
      valorMaximo: fallbackTermo.valorMaximo || null,
      valorMaximoRaw: fallbackTermo.valorMaximoRaw || "",
    }
  }

  const historicoAlteracoes = Array.isArray(existingRecord?.historicoAlteracoes)
    ? [...existingRecord.historicoAlteracoes]
    : []

  if (editingId && existingRecord) {
    if (existingRecord.funcao !== funcao) {
      historicoAlteracoes.push({
        campo: "funcao",
        campoLabel: "Função no Projeto",
        anterior: existingRecord.funcao,
        atual: funcao,
        modificadoEm: now,
      })
    }
    if (existingRecord.valor !== valorNum) {
      historicoAlteracoes.push({
        campo: "valor",
        campoLabel: "Valor da Bolsa",
        anterior: existingRecord.valor,
        atual: valorNum,
        modificadoEm: now,
      })
    }
  }

  return {
    id,
    nome,
    cpf: cpfDigits,
    funcao,
    valor: valorNum,
    termo,
    historicoAlteracoes,
    periodos_vinculados: Array.isArray(periodosVinculados) ? [...periodosVinculados] : [],
    updatedAt: now,
  }
}

export const upsertBolsistas = (bolsistas = [], record, editingId = null) => {
  const list = Array.isArray(bolsistas) ? [...bolsistas] : []
  if (!record) return list

  if (editingId != null) {
    const idx = list.findIndex((item) => String(item.id) === String(editingId))
    if (idx >= 0) {
      list[idx] = record
      return list
    }
  }

  list.push(record)
  return list
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const $ = (sel, root = document) => root.querySelector(sel)
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))

    const requestTermoAnalysis = async (file) => {
      const fd = new FormData()
      fd.append("termo", file)

      let response
      try {
        response = await fetch("/api/parse-termo-outorga", { method: "POST", body: fd })
      } catch (err) {
        console.error("Falha na requisição de análise do termo:", err)
        throw new Error("Não foi possível enviar o termo para análise. Verifique sua conexão e tente novamente.")
      }

      let payload = null
      try {
        payload = await response.json()
      } catch (err) {
        const text = await response.text().catch(() => "")
        console.error("Resposta inesperada ao analisar termo:", err, text)
        throw new Error("Resposta inválida do servidor ao analisar o termo de outorga.")
      }

      if (!response.ok || !payload?.ok) {
        const message = payload?.message || `Erro ao processar o termo (HTTP ${response.status}).`
        throw new Error(message)
      }

      return payload?.data || {}
    }

    const escapeHtml = (t = "") =>
      String(t).replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c] || c,
      )

    const onlyDigits = (val = "") => String(val).replace(/\D+/g, "")

    const formatCPF = (cpf = "") => {
      const digits = onlyDigits(cpf)
      if (digits.length !== 11) return digits || cpf
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    }

    const formatBRL = (value) => {
      if (value == null || value === "") return ""
      const num = Number(value)
      if (Number.isNaN(num)) return ""
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num)
    }

    const parseMoney = (raw) => {
      if (raw == null || raw === "") return null
      let str = String(raw).trim()
      if (!str) return null
      str = str.replace(/[^0-9,.-]/g, "")
      if (!str) return null
      if (str.includes(",")) {
        str = str.replace(/\./g, "").replace(",", ".")
      } else {
        const parts = str.split(".")
        if (parts.length > 2) {
          const dec = parts.pop()
          str = `${parts.join("")}.${dec}`
        }
        str = str.replace(/,/g, ".")
      }
      const num = Number(str)
      return Number.isFinite(num) ? num : null
    }

    const formatDateBR = (iso) => {
      if (!iso) return ""
      const match = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (match) return `${match[3]}/${match[2]}/${match[1]}`
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return ""
      return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`
    }

    const formatDateTimeBR = (iso) => {
      if (!iso) return ""
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) {
        return String(iso)
      }
      const dia = String(date.getDate()).padStart(2, "0")
      const mes = String(date.getMonth() + 1).padStart(2, "0")
      const ano = date.getFullYear()
      const hora = String(date.getHours()).padStart(2, "0")
      const minuto = String(date.getMinutes()).padStart(2, "0")
      return `${dia}/${mes}/${ano} às ${hora}:${minuto}`
    }

    const toISODate = (raw) => {
      if (!raw) return null
      const text = String(raw).trim()
      let m = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/)
      if (m) {
        const [_, y, mth, d] = m
        return `${y.padStart(4, "0")}-${mth.padStart(2, "0")}-${d.padStart(2, "0")}`
      }
      m = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
      if (m) {
        let [_, d, mth, y] = m
        if (y.length === 2) y = (Number(y) >= 70 ? "19" : "20") + y
        return `${y.padStart(4, "0")}-${mth.padStart(2, "0")}-${d.padStart(2, "0")}`
      }
      return null
    }

    const validateCPF = (raw) => {
      const cpf = onlyDigits(raw)
      if (cpf.length !== 11) return false
      if (/^(\d)\1{10}$/.test(cpf)) return false

      let sum = 0
      for (let i = 0; i < 9; i += 1) {
        sum += Number(cpf[i]) * (10 - i)
      }
      let check = (sum * 10) % 11
      if (check === 10) check = 0
      if (check !== Number(cpf[9])) return false

      sum = 0
      for (let i = 0; i < 10; i += 1) {
        sum += Number(cpf[i]) * (11 - i)
      }
      check = (sum * 10) % 11
      if (check === 10) check = 0
      return check === Number(cpf[10])
    }

    const collectMatches = (regex, text) => {
      const matches = []
      let match
      while ((match = regex.exec(text)) !== null) {
        matches.push({ match: match[0], index: match.index })
      }
      return matches
    }

    const analyseTermoText = (text = "") => {
      const simplified = text.replace(/\s+/g, " ").trim()
      const normalizedText = simplified.replace(/Período/gi, "Periodo").replace(/período/gi, "periodo")

      // Tentar encontrar "Periodo: DD/MM/YYYY até DD/MM/YYYY"
      const periodoRegex =
        /periodo\s*[:\-–—]?\s*(\d{2}[/.-]\d{2}[/.-]\d{4})\s*(?:até|ate|at[ée]|a)\s*(\d{2}[/.-]\d{2}[/.-]\d{4})/gi

      const match = periodoRegex.exec(normalizedText)

      if (match) {
        const inicio = toISODate(match[1])
        const fim = toISODate(match[2])

        if (inicio && fim) {
          return {
            inicio_vigencia: inicio > fim ? fim : inicio,
            fim_vigencia: inicio > fim ? inicio : fim,
            fonte_texto: match[0],
            valorMaximoRaw: "",
            valorMaximo: null,
          }
        }
      }

      // Fallback: buscar todas as datas
      const dateRegex = /(\d{2}[/.-]\d{2}[/.-]\d{4})/g
      const allDates = []
      let dateMatch

      while ((dateMatch = dateRegex.exec(simplified)) !== null) {
        const isoDate = toISODate(dateMatch[1])
        if (isoDate) {
          allDates.push({
            raw: dateMatch[1],
            iso: isoDate,
            index: dateMatch.index,
          })
        }
      }

      if (allDates.length >= 2) {
        const periodoIndex = normalizedText.toLowerCase().indexOf("periodo")

        if (periodoIndex !== -1) {
          const datesAfterPeriodo = allDates.filter((d) => d.index > periodoIndex)

          if (datesAfterPeriodo.length >= 2) {
            const inicio = datesAfterPeriodo[0].iso
            const fim = datesAfterPeriodo[1].iso

            return {
              inicio_vigencia: inicio > fim ? fim : inicio,
              fim_vigencia: inicio > fim ? inicio : fim,
              fonte_texto: `Período: ${datesAfterPeriodo[0].raw} até ${datesAfterPeriodo[1].raw}`,
              valorMaximoRaw: "",
              valorMaximo: null,
            }
          }
        }

        // Usar as duas primeiras datas
        const inicio = allDates[0].iso
        const fim = allDates[1].iso

        return {
          inicio_vigencia: inicio > fim ? fim : inicio,
          fim_vigencia: inicio > fim ? inicio : fim,
          fonte_texto: `${allDates[0].raw} até ${allDates[1].raw}`,
          valorMaximoRaw: "",
          valorMaximo: null,
        }
      }

      // Se não encontrou nada, retornar null
      return {
        inicio_vigencia: null,
        fim_vigencia: null,
        fonte_texto: "",
        valorMaximoRaw: "",
        valorMaximo: null,
      }
    }

    const parseTermoPDF = async (file) => {
      if (!file) throw new Error("Nenhum arquivo informado")
      if (!/pdf$/i.test(file.type) && !file.name.toLowerCase().endsWith(".pdf")) {
        throw new Error("Apenas arquivos PDF são aceitos.")
      }

      const remoteData = await requestTermoAnalysis(file)
      const rawText = remoteData.rawText || remoteData.text || ""

      let parsed = null
      if (remoteData.parsed && typeof remoteData.parsed === "object") {
        parsed = { ...remoteData.parsed }
      }

      if (rawText && (!parsed || (!parsed.fim_vigencia && !parsed.vigenciaISO && parsed.valorMaximo == null))) {
        const fallback = analyseTermoText(rawText)
        parsed = { ...fallback, ...(parsed || {}) }
      }

      return {
        fileName: remoteData.fileName || file.name,
        size: remoteData.size ?? file.size,
        parsed,
        rawText,
      }
    }

    const computeIndicator = (row) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const vigenciaISO = row?.termo?.fim_vigencia || row?.termo?.vigenciaFim || row?.termo?.vigenciaISO
      const valorMax = row?.termo?.valorMaximo
      const valorBolsa = row?.valor

      let okVigencia = true
      let vigenciaDetail = ""
      if (!vigenciaISO) {
        okVigencia = false
        vigenciaDetail = "Vigência não identificada."
      } else {
        const date = new Date(`${vigenciaISO}T00:00:00`)
        if (Number.isNaN(date.getTime())) {
          okVigencia = false
          vigenciaDetail = "Data de vigência inválida no termo."
        } else if (date < today) {
          okVigencia = false
          vigenciaDetail = `Termo vencido em ${formatDateBR(vigenciaISO)}.`
        } else {
          vigenciaDetail = `Vigente até ${formatDateBR(vigenciaISO)}.`
        }
      }

      let okValor = true
      let valorDetail = ""
      if (valorMax == null || Number.isNaN(valorMax)) {
        okValor = false
        valorDetail = "Valor máximo não encontrado no termo."
      } else if (valorBolsa != null && Number(valorBolsa) > valorMax + 0.009) {
        okValor = false
        valorDetail = `Valor acima do limite de ${formatBRL(valorMax)}.`
      } else {
        valorDetail = `Limite identificado: ${formatBRL(valorMax)}.`
      }

      const ok = okVigencia
      const label = ok ? "Vigente" : "Não Vigente"
      let detail = vigenciaDetail
      if (!okValor && valorDetail) {
        detail = `${vigenciaDetail} ${valorDetail}`.trim()
      }

      return {
        status: ok ? "vigente" : "nao_vigente",
        label,
        detail: detail.replace(/\s+/g, " ").trim(),
        vigenciaDetail,
        valorDetail,
      }
    }

    const renderIndicator = (row) => {
      const info = computeIndicator(row)
      const cls = info.status === "vigente" ? "status-pill status-pill--ok" : "status-pill status-pill--alert"
      const secondary = info.status === "vigente" ? info.detail : `${info.vigenciaDetail} ${info.valorDetail}`.trim()
      return `
        <span class="${cls}">${escapeHtml(info.label)}</span>
        <span class="status-pill__detail">${escapeHtml(secondary || info.detail)}</span>
      `
    }

    const updateTermoSummary = (data) => {
      const summary = document.getElementById("termo-summary")
      if (!summary) return

      if (!data || !data.parsed) {
        summary.innerHTML = ""
        summary.hidden = true
        return
      }

      const parts = []
      if (data.fileName) {
        parts.push(`
          <div class="termo-summary__item">
            <span class="termo-summary__label">Arquivo:</span>
            <span class="termo-summary__value">${escapeHtml(data.fileName)}</span>
          </div>
        `)
      }

      const inicioVigencia = data.parsed?.inicio_vigencia || data.parsed?.vigenciaInicio
      const fimVigencia = data.parsed?.fim_vigencia || data.parsed?.vigenciaFim || data.parsed?.vigenciaISO
      const fonteTexto = data.parsed?.fonte_texto || data.parsed?.vigenciaRaw

      let vigenciaText = ""
      if (inicioVigencia && fimVigencia) {
        vigenciaText = `${formatDateBR(inicioVigencia)} a ${formatDateBR(fimVigencia)}`
        if (fonteTexto) {
          vigenciaText += ` (encontrado como "${escapeHtml(fonteTexto)}")`
        }
      } else if (fimVigencia) {
        vigenciaText = `${formatDateBR(fimVigencia)}`
        if (fonteTexto) {
          vigenciaText += ` (encontrado como "${escapeHtml(fonteTexto)}")`
        }
      } else if (fonteTexto) {
        vigenciaText = `Não foi possível converter a data "${escapeHtml(fonteTexto)}".`
      } else {
        vigenciaText = "Vigência não identificada no documento."
      }

      parts.push(`
        <div class="termo-summary__item">
          <span class="termo-summary__label">Vigência:</span>
          <span class="termo-summary__value">${vigenciaText}</span>
        </div>
      `)

      const valorText =
        data.parsed?.valorMaximo != null
          ? `${formatBRL(data.parsed.valorMaximo)}${data.parsed.valorMaximoRaw ? ` ("${escapeHtml(data.parsed.valorMaximoRaw)}")` : ""}`
          : data.parsed?.valorMaximoRaw
            ? `Não foi possível converter o valor "${escapeHtml(data.parsed.valorMaximoRaw)}".`
            : "Valor máximo não identificado."

      parts.push(`
        <div class="termo-summary__item">
          <span class="termo-summary__label">Valor máximo previsto:</span>
          <span class="termo-summary__value">${valorText}</span>
        </div>
      `)

      summary.innerHTML = parts.join("")
      summary.hidden = false
    }

    const historicoCampoLabels = {
      valor: "Valor da Bolsa",
      funcao: "Função no Projeto",
    }

    const formatHistoricoValue = (campo, raw) => {
      if (campo === "valor") {
        if (raw == null || raw === "") return "—"
        return formatBRL(raw) || "—"
      }
      if (raw == null || raw === "") return "—"
      return String(raw)
    }

    const updateHistoricoSection = (row = null) => {
      const historicoCard = document.getElementById("historico-card")
      const historicoList = document.getElementById("historico-list")

      if (!historicoCard || !historicoList) return

      if (!row) {
        historicoCard.hidden = true
        historicoList.innerHTML =
          '<p class="history-block__empty muted">Nenhuma alteração registrada até o momento.</p>'
        return
      }

      const historico = Array.isArray(row.historicoAlteracoes) ? row.historicoAlteracoes : []
      historicoCard.hidden = false

      if (!historico.length) {
        historicoList.innerHTML =
          '<p class="history-block__empty muted">Nenhuma alteração registrada até o momento.</p>'
        return
      }

      const items = historico.map((entry) => {
        const campo = entry.campo || entry.field || ""
        const label = historicoCampoLabels[campo] || entry.campoLabel || campo || "Campo"
        const anterior = escapeHtml(formatHistoricoValue(campo, entry.anterior))
        const atual = escapeHtml(formatHistoricoValue(campo, entry.atual))
        const rawData = entry.modificadoEm || entry.alteradoEm || entry.data || entry.timestamp || ""
        const dataTexto = formatDateTimeBR(rawData) || "—"
        const dataAttr = rawData ? ` datetime="${escapeHtml(rawData)}"` : ""
        const dataHtml = rawData
          ? `<time class="history-item__date"${dataAttr}>${escapeHtml(dataTexto)}</time>`
          : `<span class="history-item__date">${escapeHtml(dataTexto)}</span>`

        return `
          <article class="history-item">
            <div class="history-item__header">
              <span class="history-item__field">${escapeHtml(label)}</span>
              ${dataHtml}
            </div>
            <div class="history-item__values">
              <div class="history-item__value history-item__value--previous">
                <span class="history-item__label">Anterior</span>
                <span class="history-item__content">${anterior}</span>
              </div>
              <div class="history-item__value history-item__value--current">
                <span class="history-item__label">Atual</span>
                <span class="history-item__content">${atual}</span>
              </div>
            </div>
          </article>
        `
      })

      historicoList.innerHTML = items.join("")
    }

    const tableBody = document.getElementById("lista-bolsistas")

    const modal = document.getElementById("bolsista-modal")
    const modalTitle = document.getElementById("modal-title")
    const btnClose = document.getElementById("modal-close")
    const btnNovo = document.getElementById("btn-novo-bolsista")
    const btnCancelar = document.getElementById("btn-cancelar")
    const form = document.getElementById("bolsista-form")
    const nomeInput = document.getElementById("campo-nome")
    const cpfInput = document.getElementById("campo-cpf")
    const funcaoInput = document.getElementById("campo-funcao")
    const valorInput = document.getElementById("campo-valor")
    const termoInput = document.getElementById("campo-termo")
    const btnSelecionarTermo = document.getElementById("btn-selecionar-termo")
    const termoFileName = document.getElementById("termo-file-name")
    const termoFeedback = document.getElementById("termo-feedback")
    const formFeedback = document.getElementById("form-feedback")
    const historicoCard = document.getElementById("historico-card")
    const historicoList = document.getElementById("historico-list")

    const projectNome = document.getElementById("p-nome")
    const projectCodigo = document.getElementById("p-codigo")
    const projectGerente = document.getElementById("p-gerente")
    const projectStatus = document.getElementById("p-status")

    const tabEvid = document.getElementById("tab-evidencias")
    const tabDoc = document.getElementById("tab-docfin")
    const tabBolsas = document.getElementById("tab-bolsas")

    const periodoMesInput = document.getElementById("campo-periodo-mes")
    const periodoAnoInput = document.getElementById("campo-periodo-ano")
    const btnAdicionarPeriodo = document.getElementById("btn-adicionar-periodo")
    const periodosChipsContainer = document.getElementById("periodos-chips")
    const periodosEmpty = document.getElementById("periodos-empty")
    const filtroPeriodo = document.getElementById("filtro-periodo")
    const btnExportarExcel = document.getElementById("btn-exportar-excel")

    let projectId = ""
    let bolsistas = []
    let editingId = null
    let termoUpload = null
    const currentPeriodosVinculados = []

    let pagamentos = []
    let editingPagamentoKey = null

    const storageKey = () => `bolsas_${projectId || "default"}`

    const pagamentosStorageKey = () => `pagamentos_${projectId || "default"}`

    const saveLocal = () => {
      if (!projectId) return
      try {
        localStorage.setItem(storageKey(), JSON.stringify(bolsistas))
      } catch (err) {
        console.warn("Não foi possível salvar os bolsistas localmente.", err)
      }
    }

    const savePagamentosLocal = () => {
      if (!projectId) return
      try {
        localStorage.setItem(pagamentosStorageKey(), JSON.stringify(pagamentos))
      } catch (err) {
        console.warn("Não foi possível salvar os pagamentos localmente.", err)
      }
    }

    const loadLocal = () => {
      const previous = Array.isArray(bolsistas) ? bolsistas : []
      let storedList = null

      if (projectId) {
        try {
          const raw = localStorage.getItem(storageKey())
          if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) storedList = parsed
          }
        } catch (err) {
          console.warn("Não foi possível carregar os bolsistas armazenados.", err)
        }
      }

      const { list, shouldPersist } = resolveStoredBolsistas({
        previous,
        stored: storedList,
        projectId,
      })

      bolsistas = list
      if (shouldPersist) {
        saveLocal()
      }
    }

    const loadPagamentosLocal = () => {
      if (!projectId) return
      try {
        const raw = localStorage.getItem(pagamentosStorageKey())
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            pagamentos = parsed
          }
        }
      } catch (err) {
        console.warn("Não foi possível carregar os pagamentos armazenados.", err)
      }
    }

    const exportarParaExcel = () => {
      if (!window.XLSX) {
        alert("Biblioteca XLSX não carregada. Por favor, recarregue a página.")
        return
      }

      const periodoFiltro = filtroPeriodo?.value || ""
      let bolsistasFiltrados = bolsistas

      if (periodoFiltro) {
        bolsistasFiltrados = bolsistas.filter((row) => {
          const periodos = row.periodos_vinculados || []
          return periodos.includes(periodoFiltro)
        })
      }

      if (bolsistasFiltrados.length === 0) {
        alert("Nenhum bolsista para exportar.")
        return
      }

      const dados = bolsistasFiltrados.map((row) => {
        const indicator = computeIndicator(row)
        const periodos = row.periodos_vinculados || []

        return {
          "Nome Completo": row.nome || "",
          CPF: formatCPF(row.cpf),
          "Função no Projeto": row.funcao || "",
          "Valor da Bolsa": formatBRL(row.valor),
          "Período de Vinculação": periodos.join(", "),
          "Status Vigência": indicator.status === "vigente" ? "Vigente" : "Não Vigente",
          "Detalhes Vigência": indicator.vigenciaDetail,
          "Detalhes Valor": indicator.valorDetail,
        }
      })

      const ws = window.XLSX.utils.json_to_sheet(dados)
      const wb = window.XLSX.utils.book_new()
      window.XLSX.utils.book_append_sheet(wb, ws, "Recursos Humanos")

      const now = new Date()
      const timestamp = now.toISOString().slice(0, 16).replace("T", "_").replace(/:/g, "-")
      const filename = `recursos_humanos_${timestamp}.xlsx`

      window.XLSX.writeFile(wb, filename)
    }

    const exportarPagamentosParaExcel = () => {
      if (!window.XLSX) {
        alert("Biblioteca XLSX não carregada. Por favor, recarregue a página.")
        return
      }

      const periodoFiltro = document.getElementById("filtro-periodo-pagamentos")?.value || ""

      if (!periodoFiltro) {
        alert("Selecione um período para exportar.")
        return
      }

      const bolsistasFiltrados = bolsistas.filter((row) => {
        const periodos = row.periodos_vinculados || []
        return periodos.includes(periodoFiltro)
      })

      if (bolsistasFiltrados.length === 0) {
        alert("Nenhum pagamento para exportar neste período.")
        return
      }

      const dados = bolsistasFiltrados.map((row) => {
        const key = `${row.id}_${periodoFiltro}`
        const pagamento = pagamentos.find((p) => p.key === key) || {}

        const valorBolsa = parseMoney(pagamento.valor_bolsa) || row.valor || 0
        const encargos = parseMoney(pagamento.encargos) || 0
        const beneficios = parseMoney(pagamento.beneficios) || 0
        const provisionamento = parseMoney(pagamento.provisionamento) || 0
        const total = valorBolsa + encargos + beneficios + provisionamento

        return {
          CPF: formatCPF(row.cpf),
          Favorecido: row.nome || "",
          Tipo: "Bolsista",
          "Aloc. Projeto (%)": pagamento.aloc_projeto || "",
          "Horas Totais": pagamento.horas_totais || "",
          "Horas Projeto": pagamento.horas_projeto || "",
          "%Horas": pagamento.perc_horas || "",
          "Valor da Bolsa": formatBRL(valorBolsa),
          Encargos: formatBRL(encargos),
          Benefícios: formatBRL(beneficios),
          "Provisionam.": formatBRL(provisionamento),
          Total: formatBRL(total),
          "N° do extrato": pagamento.num_extrato || "",
          "NF/ND": pagamento.nf_nd || "",
          "Data emissão NF/ND": pagamento.data_emissao ? formatDateBR(pagamento.data_emissao) : "",
          "Data pagamento": pagamento.data_pagamento ? formatDateBR(pagamento.data_pagamento) : "",
        }
      })

      const ws = window.XLSX.utils.json_to_sheet(dados)
      const wb = window.XLSX.utils.book_new()
      window.XLSX.utils.book_append_sheet(wb, ws, "Pagamentos")

      const now = new Date()
      const timestamp = now.toISOString().slice(0, 16).replace("T", "_").replace(/:/g, "-")
      const filename = `pagamentos_${periodoFiltro.replace("/", "-")}_${timestamp}.xlsx`

      window.XLSX.writeFile(wb, filename)
    }

    const adicionarPeriodo = () => {
      const mes = periodoMesInput?.value
      const ano = periodoAnoInput?.value

      if (!mes || !ano) {
        alert("Por favor, informe o mês e o ano.")
        return
      }

      const mesNum = Number.parseInt(mes, 10)
      const anoNum = Number.parseInt(ano, 10)

      if (mesNum < 1 || mesNum > 12) {
        alert("Mês deve estar entre 1 e 12.")
        return
      }

      if (anoNum < 2020 || anoNum > 2099) {
        alert("Ano deve estar entre 2020 e 2099.")
        return
      }

      const periodo = `${String(mesNum).padStart(2, "0")}/${anoNum}`

      if (currentPeriodosVinculados.includes(periodo)) {
        alert("Este período já foi adicionado.")
        return
      }

      currentPeriodosVinculados.push(periodo)
      renderPeriodosChips()

      if (periodoMesInput) periodoMesInput.value = ""
      if (periodoAnoInput) periodoAnoInput.value = ""
      periodoMesInput?.focus()
    }

    const removerPeriodo = (periodo) => {
      const index = currentPeriodosVinculados.indexOf(periodo)
      if (index > -1) {
        currentPeriodosVinculados.splice(index, 1)
      }
      renderPeriodosChips()
    }

    const renderPeriodosChips = () => {
      if (!periodosChipsContainer) return

      if (currentPeriodosVinculados.length === 0) {
        periodosChipsContainer.innerHTML =
          '<span class="tiny muted" id="periodos-empty">Nenhum período adicionado.</span>'
        return
      }

      const chipsHtml = currentPeriodosVinculados
        .sort((a, b) => {
          const [mesA, anoA] = a.split("/").map(Number)
          const [mesB, anoB] = b.split("/").map(Number)
          if (anoA !== anoB) return anoA - anoB
          return mesA - mesB
        })
        .map(
          (periodo) => `
          <span class="chip" style="display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.5rem; background: #e3f2fd; border-radius: 16px; font-size: 0.875rem;">
            ${escapeHtml(periodo)}
            <button type="button" class="chip-remove" data-periodo="${escapeHtml(periodo)}" style="background: none; border: none; cursor: pointer; padding: 0; margin: 0; font-size: 1rem; line-height: 1; color: #666;" title="Remover">×</button>
          </span>
        `,
        )
        .join("")

      periodosChipsContainer.innerHTML = chipsHtml

      periodosChipsContainer.querySelectorAll(".chip-remove").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault()
          const periodo = btn.dataset.periodo
          removerPeriodo(periodo)
        })
      })
    }

    const wireTableClicks = () => {
      tableBody?.addEventListener("click", (ev) => {
        const rowEl = ev.target.closest("tr[data-id]")
        if (!rowEl) return
        const { id } = rowEl.dataset
        const row = bolsistas.find((item) => String(item.id) === String(id))
        if (!row) return
        openEditModal(row)
      })
    }

    const setFormFeedback = (message, type = "info") => {
      if (!formFeedback) return
      formFeedback.textContent = message || ""
      formFeedback.classList.toggle("form-feedback--error", type === "error")
      formFeedback.classList.toggle("form-feedback--success", type === "success")
    }

    const setTermoFeedback = (message, type = "info") => {
      if (!termoFeedback) return
      termoFeedback.textContent = message || ""
      termoFeedback.classList.toggle("form-feedback--error", type === "error")
      termoFeedback.classList.toggle("form-feedback--success", type === "success")
    }

    const renderPeriodosVinculados = (row) => {
      const periodos = row.periodos_vinculados || []
      if (periodos.length === 0) {
        return '<span class="tiny muted">Nenhum período cadastrado</span>'
      }
      return periodos.map((p) => `<span class="chip">${escapeHtml(p)}</span>`).join(" ")
    }

    const renderTable = () => {
      if (!tableBody) return

      const periodoFiltro = filtroPeriodo?.value || ""
      let bolsistasFiltrados = bolsistas

      if (periodoFiltro) {
        bolsistasFiltrados = bolsistas.filter((row) => {
          const periodos = row.periodos_vinculados || []
          return periodos.includes(periodoFiltro)
        })
      }

      if (!Array.isArray(bolsistasFiltrados) || bolsistasFiltrados.length === 0) {
        tableBody.innerHTML =
          '<tr class="table-empty"><td colspan="6">Nenhum bolsista cadastrado até o momento.</td></tr>'
        return
      }

      const rowsHtml = bolsistasFiltrados
        .map(
          (row) => `
        <tr data-id="${escapeHtml(String(row.id))}" class="table-row">
          <td>${escapeHtml(row.nome || "")}</td>
          <td>${escapeHtml(formatCPF(row.cpf))}</td>
          <td>${escapeHtml(row.funcao || "")}</td>
          <td>${escapeHtml(formatBRL(row.valor))}</td>
          <td>${renderPeriodosVinculados(row)}</td>
          <td>${renderIndicator(row)}</td>
        </tr>
      `,
        )
        .join("")

      tableBody.innerHTML = rowsHtml
    }

    const updateFiltroPeriodo = () => {
      if (!filtroPeriodo) return

      const todosOsPeriodos = new Set()
      bolsistas.forEach((row) => {
        const periodos = row.periodos_vinculados || []
        periodos.forEach((p) => todosOsPeriodos.add(p))
      })

      const periodosOrdenados = Array.from(todosOsPeriodos).sort((a, b) => {
        const [mesA, anoA] = a.split("/").map(Number)
        const [mesB, anoB] = b.split("/").map(Number)
        if (anoA !== anoB) return anoA - anoB
        return mesA - mesB
      })

      const currentValue = filtroPeriodo.value
      filtroPeriodo.innerHTML =
        '<option value="">Todos os períodos</option>' +
        periodosOrdenados.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("")

      if (currentValue && periodosOrdenados.includes(currentValue)) {
        filtroPeriodo.value = currentValue
      }
    }

    const closeModal = () => {
      if (!modal) return
      modal.close()
      setFormFeedback("")
      setTermoFeedback("")
      updateTermoSummary(null)
      updateHistoricoSection(null)
      termoUpload = null
      editingId = null
    }

    const openModal = () => {
      if (!modal) return
      if (typeof modal.showModal === "function") modal.showModal()
      else modal.setAttribute("open", "")
    }

    const resetModalFields = () => {
      if (!form) return
      form.reset()
      nomeInput?.removeAttribute("readonly")
      cpfInput?.removeAttribute("readonly")
      nomeInput?.removeAttribute("disabled")
      cpfInput?.removeAttribute("disabled")
      if (termoFileName) termoFileName.textContent = "Nenhum arquivo selecionado."
      updateTermoSummary(null)
      setFormFeedback("")
      setTermoFeedback("")
      updateHistoricoSection(null)
      termoUpload = null
      currentPeriodosVinculados.length = 0
      renderPeriodosChips()
    }

    const openCreateModal = () => {
      resetModalFields()
      editingId = null
      modalTitle.textContent = "Novo Bolsista"
      setTermoFeedback("Envie o Termo de Outorga em PDF para que o sistema extraia vigência e valor máximo.", "info")
      nomeInput?.focus()
      openModal()
    }

    const fillModalWithRow = (row) => {
      if (!row) return
      resetModalFields()
      editingId = row.id
      modalTitle.textContent = "Detalhes do Bolsista"

      if (nomeInput) {
        nomeInput.value = row.nome || ""
        nomeInput.setAttribute("readonly", "readonly")
        nomeInput.setAttribute("disabled", "disabled")
      }
      if (cpfInput) {
        cpfInput.value = formatCPF(row.cpf)
        cpfInput.setAttribute("readonly", "readonly")
        cpfInput.setAttribute("disabled", "disabled")
      }
      if (funcaoInput) funcaoInput.value = row.funcao || ""
      if (valorInput) valorInput.value = formatBRL(row.valor) || ""

      currentPeriodosVinculados.length = 0
      currentPeriodosVinculados.push(...(Array.isArray(row.periodos_vinculados) ? row.periodos_vinculados : []))
      renderPeriodosChips()

      const termo = row.termo || null
      if (termo) {
        if (termoFileName) termoFileName.textContent = termo.fileName || "Termo carregado."

        updateTermoSummary({
          fileName: termo.fileName,
          parsed: {
            inicio_vigencia: termo.inicio_vigencia || termo.vigenciaInicio,
            fim_vigencia: termo.fim_vigencia || termo.vigenciaFim || termo.vigenciaISO,
            fonte_texto: termo.fonte_texto || termo.vigenciaRaw,
            valorMaximo: termo.valorMaximo,
            valorMaximoRaw: termo.valorMaximoRaw,
          },
        })
        const indicator = computeIndicator(row)
        setTermoFeedback(
          `${indicator.vigenciaDetail} ${indicator.valorDetail}`.trim(),
          indicator.status === "vigente" ? "success" : "error",
        )
      } else {
        if (termoFileName) termoFileName.textContent = "Nenhum termo cadastrado."
        updateTermoSummary(null)
        setTermoFeedback("Faça upload de um Termo de Outorga em PDF.", "info")
      }

      updateHistoricoSection(row)
    }

    const openEditModal = (row) => {
      fillModalWithRow(row)
      openModal()
    }

    const normalizeValorInput = () => {
      if (!valorInput) return
      const num = parseMoney(valorInput.value)
      if (num == null) {
        valorInput.value = ""
        return
      }
      valorInput.value = formatBRL(num)
    }

    const normalizeCPFInput = () => {
      if (!cpfInput) return
      const digits = onlyDigits(cpfInput.value)
      if (digits.length <= 11) cpfInput.value = formatCPF(digits)
    }

    const wireInputs = () => {
      valorInput?.addEventListener("blur", normalizeValorInput)
      cpfInput?.addEventListener("blur", normalizeCPFInput)

      btnAdicionarPeriodo?.addEventListener("click", adicionarPeriodo)

      periodoMesInput?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          periodoAnoInput?.focus()
        }
      })

      periodoAnoInput?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          adicionarPeriodo()
        }
      })

      btnSelecionarTermo?.addEventListener("click", () => {
        termoInput?.click()
      })

      termoInput?.addEventListener("change", async (ev) => {
        const file = ev.target.files?.[0]
        if (!file) {
          if (termoFileName) termoFileName.textContent = "Nenhum arquivo selecionado."
          setTermoFeedback("")
          updateTermoSummary(null)
          termoUpload = null
          return
        }

        if (termoFileName) termoFileName.textContent = file.name
        setTermoFeedback("Processando termo de outorga…", "info")

        try {
          termoUpload = await parseTermoPDF(file)
          updateTermoSummary(termoUpload)
          if (
            termoUpload.parsed?.fim_vigencia ||
            termoUpload.parsed?.vigenciaISO ||
            termoUpload.parsed?.valorMaximo != null
          ) {
            setTermoFeedback("Termo de Outorga lido com sucesso.", "success")
          } else {
            setTermoFeedback(
              "Termo lido, porém não encontramos vigência ou valor máximo. Verifique manualmente.",
              "error",
            )
          }
        } catch (err) {
          console.error("Falha ao ler o termo de outorga:", err)
          setTermoFeedback(err.message || "Não foi possível processar o PDF.", "error")
          updateTermoSummary(null)
          termoUpload = null
        }
      })
    }

    const wireButtons = () => {
      btnNovo?.addEventListener("click", openCreateModal)
      btnClose?.addEventListener("click", closeModal)
      btnCancelar?.addEventListener("click", closeModal)

      filtroPeriodo?.addEventListener("change", renderTable)
      btnExportarExcel?.addEventListener("click", exportarParaExcel)

      const filtroPeriodoPagamentos = document.getElementById("filtro-periodo-pagamentos")
      const btnExportarPagamentos = document.getElementById("btn-exportar-pagamentos")
      const btnFolhaDeRosto = document.getElementById("btn-folha-de-rosto")

      filtroPeriodoPagamentos?.addEventListener("change", renderPagamentosTable)
      btnExportarPagamentos?.addEventListener("click", exportarPagamentosParaExcel)
      btnFolhaDeRosto?.addEventListener("click", gerarFolhaDeRosto)
    }

    const wireForm = () => {
      form?.addEventListener("submit", async (e) => {
        e.preventDefault()
        setFormFeedback("")

        const nome = nomeInput?.value?.trim() || ""
        const cpfRaw = cpfInput?.value || ""
        const funcao = funcaoInput?.value?.trim() || ""
        const valorRaw = valorInput?.value || ""

        if (!nome) {
          setFormFeedback("Nome completo é obrigatório.", "error")
          nomeInput?.focus()
          return
        }

        const cpfDigits = onlyDigits(cpfRaw)
        if (!validateCPF(cpfDigits)) {
          setFormFeedback("CPF inválido.", "error")
          cpfInput?.focus()
          return
        }

        if (!funcao) {
          setFormFeedback("Função no projeto é obrigatória.", "error")
          funcaoInput?.focus()
          return
        }

        const valorNum = parseMoney(valorRaw)
        if (valorNum == null || valorNum <= 0) {
          setFormFeedback("Valor da bolsa inválido.", "error")
          valorInput?.focus()
          return
        }

        if (currentPeriodosVinculados.length === 0) {
          setFormFeedback("Adicione pelo menos um período de vinculação.", "error")
          periodoMesInput?.focus()
          return
        }

        const existingRecord = editingId ? bolsistas.find((b) => String(b.id) === String(editingId)) : null

        const record = buildBolsistaRecord({
          editingId,
          nome,
          cpfDigits,
          funcao,
          valorNum,
          termoUpload,
          fallbackTermo: existingRecord?.termo,
          existingRecord,
          periodosVinculados: [...currentPeriodosVinculados],
        })

        bolsistas = upsertBolsistas(bolsistas, record, editingId)
        saveLocal()
        renderTable()
        updateFiltroPeriodo()
        closeModal()

        setFormFeedback(editingId ? "Bolsista atualizado com sucesso!" : "Bolsista cadastrado com sucesso!", "success")
      })
    }

    const initTabs = () => {
      const qs = projectId ? `?id=${encodeURIComponent(projectId)}` : ""
      if (tabEvid) tabEvid.href = `/prestacao.html${qs}`
      if (tabDoc) tabDoc.href = `/docfin.html${qs}`
      if (tabBolsas) tabBolsas.href = `/bolsas.html${qs}`
      tabBolsas?.classList.add("active")
    }

    const loadProject = async () => {
      try {
        const url = new URL(window.location.href)
        projectId = url.searchParams.get("id") || ""

        const res = await fetch("/api/projects")
        if (!res.ok) throw new Error("Falha ao carregar os projetos.")
        const json = await res.json()
        const list = Array.isArray(json?.data) ? json.data : []

        let project = list.find((item) => String(item.id) === String(projectId))
        if (!project && list.length) {
          project = list[0]
          projectId = String(project.id)
        }

        if (project) {
          projectNome.textContent = project.titulo || "—"
          projectCodigo.textContent = project.codigo || project.id || "—"
          projectGerente.textContent = project.responsavel || "—"
          projectStatus.textContent = (project.status || "—").replace("_", " ")
        }

        initTabs()
        loadLocal()
        loadPagamentosLocal()
        renderTable()
        updateFiltroPeriodo()
        updateFiltroPeriodoPagamentos()
        renderPagamentosTable() // Chamada adicionada para renderizar a tabela de pagamentos ao carregar o projeto
      } catch (err) {
        console.error("Falha ao carregar dados do projeto.", err)
        initTabs()
        loadLocal()
        loadPagamentosLocal()
        renderTable()
        updateFiltroPeriodo()
        updateFiltroPeriodoPagamentos()
        renderPagamentosTable() // Chamada adicionada para renderizar a tabela de pagamentos em caso de erro
      }
    }

    const updateFiltroPeriodoPagamentos = () => {
      const filtroPeriodoPagamentos = document.getElementById("filtro-periodo-pagamentos")
      if (!filtroPeriodoPagamentos) return

      const todosOsPeriodos = new Set()
      bolsistas.forEach((row) => {
        const periodos = row.periodos_vinculados || []
        periodos.forEach((p) => todosOsPeriodos.add(p))
      })

      const periodosOrdenados = Array.from(todosOsPeriodos).sort((a, b) => {
        const [mesA, anoA] = a.split("/").map(Number)
        const [mesB, anoB] = b.split("/").map(Number)
        if (anoA !== anoB) return anoA - anoB
        return mesA - mesB
      })

      const currentValue = filtroPeriodoPagamentos.value
      filtroPeriodoPagamentos.innerHTML =
        '<option value="">Selecione mês/ano</option>' +
        periodosOrdenados.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("")

      if (currentValue && periodosOrdenados.includes(currentValue)) {
        filtroPeriodoPagamentos.value = currentValue
      }
    }

    const renderPagamentosTable = () => {
      const tbody = document.getElementById("lista-pagamentos")
      if (!tbody) {
        console.log("[v0] tbody lista-pagamentos não encontrado")
        return
      }

      const filtroPeriodoPagamentos = document.getElementById("filtro-periodo-pagamentos")
      const periodoFiltro = filtroPeriodoPagamentos?.value || ""

      console.log("[v0] Renderizando tabela. Período filtro:", periodoFiltro)
      console.log("[v0] Total de bolsistas:", bolsistas.length)

      if (!periodoFiltro) {
        tbody.innerHTML =
          '<tr class="table-empty"><td colspan="16">Selecione um período para visualizar os pagamentos.</td></tr>'
        return
      }

      const bolsistasFiltrados = bolsistas.filter((row) => {
        const periodos = row.periodos_vinculados || []
        const includes = periodos.includes(periodoFiltro)
        console.log("[v0] Bolsista:", row.nome, "Periodos:", periodos, "Includes:", includes)
        return includes
      })

      console.log("[v0] Bolsistas filtrados:", bolsistasFiltrados.length)

      if (bolsistasFiltrados.length === 0) {
        tbody.innerHTML = '<tr class="table-empty"><td colspan="16">Nenhum bolsista vinculado a este período.</td></tr>'
        return
      }

      const rowsHtml = bolsistasFiltrados
        .map((row) => {
          const key = `${row.id}_${periodoFiltro}`
          const pagamento = pagamentos.find((p) => p.key === key) || {}

          const valorBolsa = parseMoney(pagamento.valor_bolsa) || row.valor || 0
          const encargos = parseMoney(pagamento.encargos) || 0
          const beneficios = parseMoney(pagamento.beneficios) || 0
          const provisionamento = parseMoney(pagamento.provisionamento) || 0
          const total = valorBolsa + encargos + beneficios + provisionamento

          return `
            <tr data-key="${escapeHtml(key)}" class="table-row" style="cursor: pointer;">
              <td>${escapeHtml(formatCPF(row.cpf))}</td>
              <td>${escapeHtml(row.nome || "")}</td>
              <td>Bolsista</td>
              <td>${escapeHtml(pagamento.aloc_projeto || "")}</td>
              <td>${escapeHtml(pagamento.horas_totais || "")}</td>
              <td>${escapeHtml(pagamento.horas_projeto || "")}</td>
              <td>${escapeHtml(pagamento.perc_horas || "")}</td>
              <td>${escapeHtml(formatBRL(valorBolsa))}</td>
              <td>${escapeHtml(formatBRL(encargos))}</td>
              <td>${escapeHtml(formatBRL(beneficios))}</td>
              <td>${escapeHtml(formatBRL(provisionamento))}</td>
              <td><strong>${escapeHtml(formatBRL(total))}</strong></td>
              <td>${escapeHtml(pagamento.num_extrato || "")}</td>
              <td>${escapeHtml(pagamento.nf_nd || "")}</td>
              <td>${escapeHtml(pagamento.data_emissao ? formatDateBR(pagamento.data_emissao) : "")}</td>
              <td>${escapeHtml(pagamento.data_pagamento ? formatDateBR(pagamento.data_pagamento) : "")}</td>
            </tr>
          `
        })
        .join("")

      tbody.innerHTML = rowsHtml
      console.log("[v0] Tabela renderizada com", bolsistasFiltrados.length, "linhas")

      wirePagamentosTableClicks()
    }

    const wirePagamentosTableClicks = () => {
      console.log("[v0] wirePagamentosTableClicks iniciado")

      const tbody = document.getElementById("lista-pagamentos")
      if (!tbody) {
        console.log("[v0] tbody lista-pagamentos não encontrado")
        return
      }

      const newTbody = tbody.cloneNode(true)
      tbody.parentNode.replaceChild(newTbody, tbody)

      const finalTbody = document.getElementById("lista-pagamentos")

      console.log(
        "[v0] Registrando event listener. Linhas na tabela:",
        finalTbody.querySelectorAll("tr[data-key]").length,
      )

      finalTbody.addEventListener("click", (ev) => {
        console.log("[v0] Click detectado no tbody")
        console.log("[v0] ev.target:", ev.target)
        console.log("[v0] ev.target.tagName:", ev.target.tagName)
        console.log("[v0] ev.target.closest('tr[data-key]'):", ev.target.closest("tr[data-key]"))

        const rowEl = ev.target.closest("tr[data-key]")
        if (!rowEl) {
          console.log("[v0] Nenhuma linha com data-key encontrada no closest")
          return
        }

        const { key } = rowEl.dataset
        console.log("[v0] Key da linha clicada:", key)

        if (!key) {
          console.log("[v0] Key vazia")
          return
        }

        console.log("[v0] Chamando openPagamentoModal com key:", key)
        openPagamentoModal(key)
      })

      console.log("[v0] Event listener registrado com sucesso no tbody")
    }

    const openPagamentoModal = (key) => {
      console.log("[v0] openPagamentoModal chamado com key:", key)

      const modal = document.getElementById("pagamento-modal")
      if (!modal) {
        console.error("[v0] Modal pagamento-modal não encontrado no DOM!")
        alert("Modal de pagamento não encontrado. Verifique o HTML.")
        return
      }

      console.log("[v0] Modal encontrado:", modal)

      const [bolsistaIdRaw, periodo] = key.split("_")
      // Extrair apenas a parte numérica do ID
      const bolsistaId = bolsistaIdRaw.includes("_") ? bolsistaIdRaw.split("_")[0] : bolsistaIdRaw

      console.log("[v0] bolsistaId extraído:", bolsistaId, "periodo:", periodo)
      console.log("[v0] Total de bolsistas no array:", bolsistas.length)

      const bolsista = bolsistas.find((b) => {
        const bId = String(b.id).includes("_") ? String(b.id).split("_")[0] : String(b.id)
        return bId === String(bolsistaId)
      })

      if (!bolsista) {
        console.error("[v0] Bolsista não encontrado para ID:", bolsistaId)
        console.error("[v0] Bolsistas disponíveis:", bolsistas.map((b) => `${b.id}: ${b.nome}`).join(", "))
        alert("Bolsista não encontrado.")
        return
      }

      console.log("[v0] Bolsista encontrado:", bolsista.nome)

      const pagamento = pagamentos.find((p) => p.key === key) || {}
      console.log("[v0] Pagamento encontrado:", pagamento)

      editingPagamentoKey = key

      // Preencher os campos do modal
      document.getElementById("pagamento-bolsista-id").value = bolsistaId
      document.getElementById("pagamento-periodo").value = periodo
      document.getElementById("pagamento-cpf").value = formatCPF(bolsista.cpf)
      document.getElementById("pagamento-favorecido").value = bolsista.nome || ""
      document.getElementById("pagamento-tipo").value = "Bolsista"
      document.getElementById("pagamento-aloc-projeto").value = pagamento.aloc_projeto || ""
      document.getElementById("pagamento-horas-totais").value = pagamento.horas_totais || ""
      document.getElementById("pagamento-horas-projeto").value = pagamento.horas_projeto || ""
      document.getElementById("pagamento-perc-horas").value = pagamento.perc_horas || ""
      document.getElementById("pagamento-valor-bolsa").value = formatBRL(bolsista.valor)
      document.getElementById("pagamento-encargos").value = pagamento.encargos
        ? formatBRL(parseMoney(pagamento.encargos))
        : ""
      document.getElementById("pagamento-beneficios").value = pagamento.beneficios
        ? formatBRL(parseMoney(pagamento.beneficios))
        : ""
      document.getElementById("pagamento-provisionamento").value = pagamento.provisionamento
        ? formatBRL(parseMoney(pagamento.provisionamento))
        : ""
      document.getElementById("pagamento-num-extrato").value = pagamento.num_extrato || ""
      document.getElementById("pagamento-nf-nd").value = pagamento.nf_nd || ""
      document.getElementById("pagamento-data-emissao").value = pagamento.data_emissao || ""
      document.getElementById("pagamento-data-pagamento").value = pagamento.data_pagamento || ""

      calcularTotalPagamento()

      console.log("[v0] Tentando abrir modal...")

      try {
        if (typeof modal.showModal === "function") {
          modal.showModal()
          console.log("[v0] Modal aberto com showModal()")
        } else {
          modal.setAttribute("open", "")
          console.log("[v0] Modal aberto com setAttribute('open', '')")
        }
      } catch (err) {
        console.error("[v0] Erro ao abrir modal:", err)
        alert("Erro ao abrir modal: " + err.message)
      }
    }

    const closePagamentoModal = () => {
      const modal = document.getElementById("pagamento-modal")
      if (!modal) return
      modal.close()
      editingPagamentoKey = null

      const feedback = document.getElementById("pagamento-form-feedback")
      if (feedback) feedback.textContent = ""
    }

    const calcularTotalPagamento = () => {
      const valorBolsaRaw = document.getElementById("pagamento-valor-bolsa")?.value || ""
      const encargosRaw = document.getElementById("pagamento-encargos")?.value || ""
      const beneficiosRaw = document.getElementById("pagamento-beneficios")?.value || ""
      const provisionamentoRaw = document.getElementById("pagamento-provisionamento")?.value || ""

      const valorBolsa = parseMoney(valorBolsaRaw) || 0
      const encargos = parseMoney(encargosRaw) || 0
      const beneficios = parseMoney(beneficiosRaw) || 0
      const provisionamento = parseMoney(provisionamentoRaw) || 0

      const total = valorBolsa + encargos + beneficios + provisionamento

      const totalInput = document.getElementById("pagamento-total")
      if (totalInput) {
        totalInput.value = formatBRL(total)
      }
    }

    const normalizePagamentoMoneyInputs = () => {
      const encargosInput = document.getElementById("pagamento-encargos")
      const beneficiosInput = document.getElementById("pagamento-beneficios")
      const provisionamentoInput = document.getElementById("pagamento-provisionamento")

      if (encargosInput) {
        const num = parseMoney(encargosInput.value)
        encargosInput.value = num != null ? formatBRL(num) : ""
      }

      if (beneficiosInput) {
        const num = parseMoney(beneficiosInput.value)
        beneficiosInput.value = num != null ? formatBRL(num) : ""
      }

      if (provisionamentoInput) {
        const num = parseMoney(provisionamentoInput.value)
        provisionamentoInput.value = num != null ? formatBRL(num) : ""
      }

      calcularTotalPagamento()
    }

    const wirePagamentoInputs = () => {
      const encargosInput = document.getElementById("pagamento-encargos")
      const beneficiosInput = document.getElementById("pagamento-beneficios")
      const provisionamentoInput = document.getElementById("pagamento-provisionamento")

      encargosInput?.addEventListener("blur", normalizePagamentoMoneyInputs)
      beneficiosInput?.addEventListener("blur", normalizePagamentoMoneyInputs)
      provisionamentoInput?.addEventListener("blur", normalizePagamentoMoneyInputs)

      encargosInput?.addEventListener("input", calcularTotalPagamento)
      beneficiosInput?.addEventListener("input", calcularTotalPagamento)
      provisionamentoInput?.addEventListener("input", calcularTotalPagamento)
    }

    const wirePagamentoButtons = () => {
      const btnClose = document.getElementById("pagamento-modal-close")
      const btnCancelar = document.getElementById("pagamento-btn-cancelar")

      btnClose?.addEventListener("click", closePagamentoModal)
      btnCancelar?.addEventListener("click", closePagamentoModal)
    }

    const wirePagamentoForm = () => {
      const form = document.getElementById("pagamento-form")
      const feedback = document.getElementById("pagamento-form-feedback")

      form?.addEventListener("submit", (e) => {
        e.preventDefault()

        if (!editingPagamentoKey) return

        const [bolsistaId, periodo] = editingPagamentoKey.split("_")
        const bolsista = bolsistas.find((b) => String(b.id) === String(bolsistaId))
        if (!bolsista) return

        const pagamentoData = {
          key: editingPagamentoKey,
          bolsista_id: bolsistaId,
          periodo: periodo,
          aloc_projeto: document.getElementById("pagamento-aloc-projeto")?.value || "",
          horas_totais: document.getElementById("pagamento-horas-totais")?.value || "",
          horas_projeto: document.getElementById("pagamento-horas-projeto")?.value || "",
          perc_horas: document.getElementById("pagamento-perc-horas")?.value || "",
          valor_bolsa: formatBRL(bolsista.valor),
          encargos: document.getElementById("pagamento-encargos")?.value || "",
          beneficios: document.getElementById("pagamento-beneficios")?.value || "",
          provisionamento: document.getElementById("pagamento-provisionamento")?.value || "",
          num_extrato: document.getElementById("pagamento-num-extrato")?.value || "",
          nf_nd: document.getElementById("pagamento-nf-nd")?.value || "",
          data_emissao: document.getElementById("pagamento-data-emissao")?.value || "",
          data_pagamento: document.getElementById("pagamento-data-pagamento")?.value || "",
          updatedAt: new Date().toISOString(),
        }

        const existingIndex = pagamentos.findIndex((p) => p.key === editingPagamentoKey)
        if (existingIndex >= 0) {
          pagamentos[existingIndex] = pagamentoData
        } else {
          pagamentos.push(pagamentoData)
        }

        savePagamentosLocal()
        renderPagamentosTable()
        closePagamentoModal()

        if (feedback) {
          feedback.textContent = "Pagamento salvo com sucesso!"
          feedback.classList.add("form-feedback--success")
          setTimeout(() => {
            feedback.textContent = ""
            feedback.classList.remove("form-feedback--success")
          }, 3000)
        }
      })
    }

    const gerarFolhaDeRosto = () => {
      if (!window.XLSX) {
        alert("Biblioteca XLSX não carregada. Por favor, recarregue a página.")
        return
      }

      const filtroPeriodoPagamentos = document.getElementById("filtro-periodo-pagamentos")
      const periodoFiltro = filtroPeriodoPagamentos?.value || ""

      if (!periodoFiltro) {
        alert("Selecione um período para gerar a Folha de Rosto.")
        return
      }

      const bolsistasFiltrados = bolsistas.filter((row) => {
        const periodos = row.periodos_vinculados || []
        return periodos.includes(periodoFiltro)
      })

      if (bolsistasFiltrados.length === 0) {
        alert("Nenhum bolsista vinculado a este período.")
        return
      }

      const wb = window.XLSX.utils.book_new()
      const ws_data = []

      // Linhas vazias iniciais (8 linhas)
      for (let i = 0; i < 8; i++) {
        ws_data.push([])
      }

      // Cabeçalho do documento (linhas 9-12 no índice 8-11)
      ws_data.push(["", "CNPJ:", ""])
      ws_data.push(["", "Termo de Parceria nº:", ""])
      ws_data.push(["", "Projeto:", ""])
      ws_data.push(["", "Prestação de Contas:", ""])
      ws_data.push([""]) // Linha vazia após cabeçalho

      // Quadros de bolsistas
      bolsistasFiltrados.forEach((row, index) => {
        const key = `${row.id}_${periodoFiltro}`
        const pagamento = pagamentos.find((p) => p.key === key) || {}
        const valorBolsa = parseMoney(pagamento.valor_bolsa) || row.valor || 0

        // Linha 1: Natureza de Dispêndio | Recursos humanos diretos e indiretos
        ws_data.push([
          "",
          "Natureza de Dispêndio",
          "",
          "",
          "Recursos humanos diretos e indiretos",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ])

        // Linha 2: Favorecido | CPF | Nº extrato
        ws_data.push(["", "Favorecido", "", "", "CPF", "", "", "", "Nº extrato", "", "", "", ""])

        // Linha 3: Valores
        ws_data.push([
          "",
          row.nome || "",
          "",
          "",
          formatCPF(row.cpf),
          "",
          "",
          "",
          pagamento.num_extrato || "",
          "",
          "",
          "",
          "",
        ])

        // Linha 4: NF/ND | Data de emissão | Data do pagamento | Rendimentos
        ws_data.push([
          "",
          "NF/ND",
          "",
          "",
          "Data de emissão da NF/ND",
          "",
          "Data do pagamento",
          "",
          "",
          "Rendimentos",
          "",
          "",
          "",
        ])

        // Linha 5: Valores
        ws_data.push([
          "",
          pagamento.nf_nd || "",
          "",
          "",
          pagamento.data_emissao ? formatDateBR(pagamento.data_emissao) : "",
          "",
          pagamento.data_pagamento ? formatDateBR(pagamento.data_pagamento) : "",
          "",
          "",
          formatBRL(valorBolsa),
          "",
          "",
          "",
        ])

        // Linha vazia entre quadros
        if (index < bolsistasFiltrados.length - 1) {
          ws_data.push([])
        }
      })

      const ws = window.XLSX.utils.aoa_to_sheet(ws_data)

      ws["!views"] = [{ showGridLines: false }]

      // Definindo largura das colunas
      ws["!cols"] = [
        { wch: 3 }, // A
        { wch: 25 }, // B
        { wch: 20 }, // C
        { wch: 5 }, // D
        { wch: 25 }, // E
        { wch: 5 }, // F
        { wch: 20 }, // G
        { wch: 5 }, // H
        { wch: 5 }, // I
        { wch: 15 }, // J
        { wch: 5 }, // K
        { wch: 5 }, // L
        { wch: 5 }, // M
      ]

      const merges = []

      // Cabeçalho do documento
      merges.push({ s: { r: 8, c: 1 }, e: { r: 8, c: 2 } }) // CNPJ B:C
      merges.push({ s: { r: 9, c: 1 }, e: { r: 9, c: 2 } }) // Termo de Parceria B:C
      merges.push({ s: { r: 10, c: 1 }, e: { r: 10, c: 2 } }) // Projeto B:C
      merges.push({ s: { r: 11, c: 1 }, e: { r: 11, c: 2 } }) // Prestação de Contas B:C

      // Quadros de bolsistas
      let currentRow = 13
      bolsistasFiltrados.forEach((row, index) => {
        // Linha 1: Natureza B:D, Recursos E:M
        merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: 3 } })
        merges.push({ s: { r: currentRow, c: 4 }, e: { r: currentRow, c: 12 } })

        // Linha 2: Favorecido B:D, CPF E:H, Nº extrato I:M
        merges.push({ s: { r: currentRow + 1, c: 1 }, e: { r: currentRow + 1, c: 3 } })
        merges.push({ s: { r: currentRow + 1, c: 4 }, e: { r: currentRow + 1, c: 7 } })
        merges.push({ s: { r: currentRow + 1, c: 8 }, e: { r: currentRow + 1, c: 12 } })

        // Linha 3: Nome B:D, CPF E:H, Extrato I:M
        merges.push({ s: { r: currentRow + 2, c: 1 }, e: { r: currentRow + 2, c: 3 } })
        merges.push({ s: { r: currentRow + 2, c: 4 }, e: { r: currentRow + 2, c: 7 } })
        merges.push({ s: { r: currentRow + 2, c: 8 }, e: { r: currentRow + 2, c: 12 } })

        // Linha 4: NF/ND B:D, Data emissão E:F, Data pagamento G:I, Rendimentos J:M
        merges.push({ s: { r: currentRow + 3, c: 1 }, e: { r: currentRow + 3, c: 3 } })
        merges.push({ s: { r: currentRow + 3, c: 4 }, e: { r: currentRow + 3, c: 5 } })
        merges.push({ s: { r: currentRow + 3, c: 6 }, e: { r: currentRow + 3, c: 8 } })
        merges.push({ s: { r: currentRow + 3, c: 9 }, e: { r: currentRow + 3, c: 12 } })

        // Linha 5: Valores B:D, E:F, G:I, J:M
        merges.push({ s: { r: currentRow + 4, c: 1 }, e: { r: currentRow + 4, c: 3 } })
        merges.push({ s: { r: currentRow + 4, c: 4 }, e: { r: currentRow + 4, c: 5 } })
        merges.push({ s: { r: currentRow + 4, c: 6 }, e: { r: currentRow + 4, c: 8 } })
        merges.push({ s: { r: currentRow + 4, c: 9 }, e: { r: currentRow + 4, c: 12 } })

        currentRow += 6
      })

      ws["!merges"] = merges

      // AplicAR formatações com bordas, cores e negrito
      const borderStyle = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      }

      const range = window.XLSX.utils.decode_range(ws["!ref"])

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_ref = window.XLSX.utils.encode_cell({ c: C, r: R })

          if (!ws[cell_ref]) {
            ws[cell_ref] = { t: "s", v: "" }
          }

          // Cabeçalho do documento (linhas 8-11, colunas B-C)
          if (R >= 8 && R <= 11 && C >= 1 && C <= 2) {
            ws[cell_ref].s = {
              font: { name: "Arial", sz: 12, bold: true },
              alignment: { vertical: "center", horizontal: "left" },
              border: { right: { style: "thin", color: { rgb: "000000" } } },
            }
          }

          // Quadros de bolsistas (a partir da linha 13)
          if (R >= 13 && C >= 1 && C <= 12) {
            const rowInQuadro = (R - 13) % 6
            const isHeaderRow = rowInQuadro === 0 || rowInQuadro === 1 || rowInQuadro === 3

            if (isHeaderRow) {
              ws[cell_ref].s = {
                fill: { fgColor: { rgb: "D3D3D3" } },
                font: { bold: true, color: { rgb: "666666" } },
                alignment: { vertical: "center", horizontal: "center" },
                border: borderStyle,
              }
            } else if (rowInQuadro === 2 || rowInQuadro === 4) {
              ws[cell_ref].s = {
                alignment: { vertical: "center", horizontal: "center" },
                border: borderStyle,
              }
            }
          }
        }
      }

      window.XLSX.utils.book_append_sheet(wb, ws, "Folha de Rosto")

      const now = new Date()
      const timestamp = now.toISOString().slice(0, 16).replace("T", "_").replace(/:/g, "-")
      const filename = `folha_de_rosto_${periodoFiltro.replace("/", "-")}_${timestamp}.xlsx`

      window.XLSX.writeFile(wb, filename)
    }

    const init = () => {
      wireInputs()
      wireButtons()
      wireForm()
      wireTableClicks()
      wirePagamentoInputs()
      wirePagamentoButtons()
      wirePagamentoForm()
      loadProject()
    }

    init()
  })
}
