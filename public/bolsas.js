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
const normalizeTermoFields = (source = {}, parsedAt = null) => {
  if (!source) return null

  const inicio =
    source.inicio_vigencia ?? source.vigenciaInicio ?? (source.parsed?.inicio_vigencia ?? source.parsed?.vigenciaInicio) ?? null
  const fim =
    source.fim_vigencia ??
    source.vigenciaFim ??
    source.vigenciaISO ??
    (source.parsed?.fim_vigencia ?? source.parsed?.vigenciaFim ?? source.parsed?.vigenciaISO) ??
    null
  const fonteTexto =
    source.fonte_texto ?? source.vigenciaRaw ?? source.parsed?.fonte_texto ?? source.parsed?.vigenciaRaw ?? ""

  return {
    fileName: source.fileName || source.parsed?.fileName || "termo.pdf",
    size: source.size ?? source.parsed?.size ?? null,
    inicio_vigencia: inicio,
    fim_vigencia: fim,
    vigenciaInicio: inicio,
    vigenciaFim: fim,
    vigenciaISO: fim,
    vigenciaRaw: fonteTexto,
    fonte_texto: fonteTexto,
    valorMaximo:
      source.valorMaximo ?? source.parsed?.valorMaximo ?? null,
    valorMaximoRaw:
      source.valorMaximoRaw ?? source.parsed?.valorMaximoRaw ?? "",
    parsedAt: parsedAt ?? source.parsedAt ?? source.parsed?.parsedAt ?? null,
    rawText: source.rawText ?? source.parsed?.rawText ?? "",
  }
}
export const buildTermoData = (upload, fallback = null, now = defaultNow) => {
  if (upload) {
     const stamp = typeof now === "function" ? now() : defaultNow()
    const parsedAt = stamp instanceof Date ? stamp.toISOString() : new Date(stamp).toISOString()
    const normalized = normalizeTermoFields(
      {
        fileName: upload.fileName,
        size: upload.size,
        rawText: upload.rawText,
        parsed: upload.parsed || {},
      },
      parsedAt,
    )
    return normalized
  }

  if (fallback) {
    return normalizeTermoFields({ ...fallback }, fallback.parsedAt ?? null)
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
   now = defaultNow,
  idFactory = defaultIdFactory,
} = {}) => {
   const stamp = typeof now === "function" ? now() : defaultNow()
  const atualizadoEm = stamp instanceof Date ? stamp.toISOString() : new Date(stamp).toISOString()
  const id = editingId ?? (typeof idFactory === "function" ? idFactory() : defaultIdFactory())

  const termo = buildTermoData(termoUpload, fallbackTermo, () => stamp)

  const historicoAlteracoes = Array.isArray(existingRecord?.historicoAlteracoes)
    ? [...existingRecord.historicoAlteracoes]
    : []

  if (editingId && existingRecord) {
    if (existingRecord.funcao !== funcao) {
      historicoAlteracoes.push({
        campo: "funcao",
        anterior: existingRecord.funcao ?? "",
        atual: funcao,
        modificadoEm: atualizadoEm,
      })
    }

       if (existingRecord.valor !== valorNum) {
      historicoAlteracoes.push({
               campo: "valor",
        anterior: existingRecord.valor ?? null,
        atual: valorNum,
        modificadoEm: atualizadoEm,
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
        atualizadoEm,
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
    let currentPeriodosVinculados = []

    const storageKey = () => `bolsas_${projectId || "default"}`

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

    const saveLocal = () => {
      if (!projectId) return
      try {
        localStorage.setItem(storageKey(), JSON.stringify(bolsistas))
      } catch (err) {
        console.warn("Não foi possível salvar os bolsistas localmente.", err)
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

    const renderPeriodosVinculados = (row) => {
      const periodos = row.periodos_vinculados || []
      if (periodos.length === 0) {
        return '<span class="tiny muted">Nenhum período cadastrado</span>'
      }
      return periodos.map((p) => `<span class="chip">${escapeHtml(p)}</span>`).join(" ")
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
      currentPeriodosVinculados = currentPeriodosVinculados.filter((p) => p !== periodo)
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
      currentPeriodosVinculados = []
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

      currentPeriodosVinculados = Array.isArray(row.periodos_vinculados) ? [...row.periodos_vinculados] : []
      renderPeriodosChips()

      const termo = row.termo || null
      if (termo) {
        if (termoFileName) termoFileName.textContent = termo.fileName || "Termo carregado."

        console.log("[v0] fillModalWithRow - Carregando termo:", termo)

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
 const handleFormSubmit = (event) => {
      event.preventDefault()
      if (!form) return

      setFormFeedback("")

      const nome = nomeInput?.value?.trim() || ""
      if (!nome) {
        setFormFeedback("Informe o nome completo do bolsista.", "error")
        nomeInput?.focus()
        return
      }

      const cpfDigits = onlyDigits(cpfInput?.value || "")
      if (!validateCPF(cpfDigits)) {
        setFormFeedback("CPF inválido. Verifique os 11 dígitos informados.", "error")
        cpfInput?.focus()
        return
      }

      const funcao = funcaoInput?.value?.trim() || ""
      if (!funcao) {
        setFormFeedback("Informe a função exercida no projeto.", "error")
        funcaoInput?.focus()
        return
      }

      const valorBruto = valorInput?.value ?? ""
      const valorNum = parseMoney(valorBruto)
      if (valorNum == null) {
        setFormFeedback("Informe o valor da bolsa em reais.", "error")
        valorInput?.focus()
        return
      }

      const existingRecord =
        editingId != null ? bolsistas.find((item) => String(item.id) === String(editingId)) || null : null

      const record = buildBolsistaRecord({
        editingId,
        nome,
        cpfDigits,
        funcao,
        valorNum,
        termoUpload,
        fallbackTermo: existingRecord?.termo || null,
        existingRecord,
        periodosVinculados: currentPeriodosVinculados,
      })

      bolsistas = upsertBolsistas(bolsistas, record, editingId)
      saveLocal()
      updateFiltroPeriodo()
      renderTable()
      closeModal()
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

      form?.addEventListener("submit", handleFormSubmit)

      filtroPeriodo?.addEventListener("change", renderTable)
      btnExportarExcel?.addEventListener("click", exportarParaExcel)
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
        renderTable()
      } catch (err) {
        console.error("Falha ao carregar dados do projeto.", err)
        initTabs()
        loadLocal()
        renderTable()
      }
    }

    const init = () => {
      const params = new URLSearchParams(window.location.search)
      projectId = params.get("id") || ""

      if (projectId) {
        loadLocal()
        renderTable()
        updateFiltroPeriodo()
      }

      wireInputs()
      wireButtons()
      wireTableClicks()
      loadProject()
    }

    init()
  })
}
