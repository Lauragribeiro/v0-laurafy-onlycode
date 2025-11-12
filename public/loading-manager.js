/**
 * Sistema Global de Gerenciamento de Loading
 * Garante que todas as operações assíncronas mostrem indicadores visuais
 */

(function () {
  "use strict"

  // Verificar se já foi inicializado
  if (window.__loadingManagerInitialized) {
    return
  }
  window.__loadingManagerInitialized = true

  // ===== ELEMENTO DE LOADING GLOBAL =====
  let globalLoadingEl = null
  let loadingSeq = 0
  const loadingEntries = new Map()

  function initLoadingElement() {
    if (globalLoadingEl) return globalLoadingEl

    // Verificar se já existe
    globalLoadingEl = document.getElementById("global-loading")
    if (globalLoadingEl) return globalLoadingEl

    // Criar elemento se não existir
    globalLoadingEl = document.createElement("div")
    globalLoadingEl.id = "global-loading"
    globalLoadingEl.className = "loading-overlay"
    globalLoadingEl.innerHTML = `
      <div class="loading-box">
        <div class="loading-spinner"></div>
        <p class="global-loading-text">Processando...</p>
      </div>
    `
    document.body.appendChild(globalLoadingEl)
    return globalLoadingEl
  }

  function renderGlobalLoading() {
    if (!globalLoadingEl) {
      initLoadingElement()
    }
    if (!globalLoadingEl) return

    const textEl = globalLoadingEl.querySelector(".global-loading-text")
    if (textEl && loadingEntries.size > 0) {
      const messages = Array.from(loadingEntries.values())
      const latestMessage = messages[messages.length - 1] || "Processando..."
      textEl.textContent = latestMessage
      globalLoadingEl.classList.add("is-visible")
      globalLoadingEl.removeAttribute("hidden")
    } else if (loadingEntries.size === 0) {
      globalLoadingEl.classList.remove("is-visible")
      globalLoadingEl.setAttribute("hidden", "")
    }
  }

  function startGlobalLoading(message) {
    if (!globalLoadingEl) {
      initLoadingElement()
    }
    if (!globalLoadingEl) return null

    // Fechar modais abertos quando o loading começar
    const modals = document.querySelectorAll("dialog.modal, .modal, #pc-modal, #zip-modal")
    modals.forEach((modal) => {
      if (modal.hasAttribute("open") || modal.classList.contains("open")) {
        if (typeof modal.close === "function") {
          modal.close()
        } else {
          modal.removeAttribute("open")
          modal.classList.remove("open")
        }
      }
    })
    document.body.classList.remove("modal-open")

    const id = ++loadingSeq
    const label = typeof message === "string" && message.trim() ? message.trim() : "Processando…"
    loadingEntries.set(id, label)
    renderGlobalLoading()
    return id
  }

  function finishGlobalLoading(id) {
    if (!globalLoadingEl) return
    if (id != null && loadingEntries.has(id)) {
      loadingEntries.delete(id)
    }
    if (loadingEntries.size === 0) {
      stopAnimatedLoading()
    }
    renderGlobalLoading()
  }

  // ===== MENSAGENS ANIMADAS =====
  const loadingMessages = {
    "mapa-cotacao": [
      "📄 Analisando cotações...",
      "🤖 Processando com IA...",
      "📊 Extraindo dados dos PDFs...",
      "🔍 Lendo documentos...",
      "✍️ Gerando mapa de cotação...",
      "✅ Finalizando documento...",
    ],
    "generate": [
      "📝 Preparando documento...",
      "🔄 Processando dados...",
      "📄 Gerando arquivo...",
      "✅ Finalizando...",
    ],
    "parse": [
      "📄 Lendo arquivo...",
      "🔍 Extraindo informações...",
      "🤖 Processando com IA...",
      "✅ Processando dados...",
    ],
    "upload": [
      "📤 Enviando arquivo...",
      "⏳ Processando upload...",
      "✅ Carregando...",
    ],
    "projects": [
      "📋 Carregando projetos...",
      "💾 Salvando projeto...",
      "🔄 Atualizando dados...",
    ],
    "bolsas": [
      "📄 Analisando termo de outorga...",
      "🔍 Extraindo informações...",
      "💾 Salvando dados...",
    ],
    "evidencias": [
      "📤 Enviando notificação...",
      "💾 Salvando evidências...",
      "🔄 Atualizando...",
    ],
    "cnpj": [
      "🔍 Consultando CNPJ...",
      "📊 Buscando informações...",
      "✅ Carregando dados...",
    ],
    "default": [
      "⏳ Processando...",
      "🔄 Carregando...",
      "✅ Finalizando...",
    ],
  }

  let currentMessageIndex = 0
  let messageInterval = null
  let currentMessageKey = null

  function startAnimatedLoading(messageKey) {
    if (messageInterval) {
      clearInterval(messageInterval)
    }
    currentMessageKey = messageKey
    const messages = loadingMessages[messageKey] || loadingMessages.default
    currentMessageIndex = 0

    const textEl = globalLoadingEl?.querySelector(".global-loading-text")
    if (textEl && messages.length > 0) {
      textEl.textContent = messages[0]
    }

    messageInterval = setInterval(() => {
      if (!globalLoadingEl || loadingEntries.size === 0) {
        stopAnimatedLoading()
        return
      }
      currentMessageIndex = (currentMessageIndex + 1) % messages.length
      const textEl = globalLoadingEl.querySelector(".global-loading-text")
      if (textEl) {
        textEl.textContent = messages[currentMessageIndex]
      }
    }, 2000)
  }

  function stopAnimatedLoading() {
    if (messageInterval) {
      clearInterval(messageInterval)
      messageInterval = null
    }
    currentMessageKey = null
    currentMessageIndex = 0
  }

  // ===== DETECÇÃO AUTOMÁTICA DE MENSAGENS POR URL =====
  function defaultLoadingMessageForFetch(input) {
    const url =
      typeof input === "string"
        ? input
        : input && typeof input === "object" && typeof input.url === "string"
          ? input.url
          : ""
    if (!url) return "Processando…"

    // Mapa de Cotação (IA)
    if (url.includes("/api/generate/mapa-cotacao")) {
      startAnimatedLoading("mapa-cotacao")
      return "📄 Analisando cotações com IA..."
    }

    // Geração de documentos
    if (url.includes("/api/generate/")) {
      startAnimatedLoading("generate")
      return "📝 Gerando documento…"
    }

    // Parsing e extração
    if (url.includes("/api/parse") || url.includes("/api/extrair")) {
      startAnimatedLoading("parse")
      return "📄 Processando arquivos…"
    }

    // Uploads
    if (url.includes("/api/upload") || url.includes("/api/uploads")) {
      startAnimatedLoading("upload")
      return "📤 Enviando arquivo…"
    }

    // Projetos
    if (url.includes("/api/projects")) {
      const method = typeof input === "object" && input.method ? input.method.toUpperCase() : "GET"
      if (method === "POST" || method === "PATCH" || method === "PUT") {
        startAnimatedLoading("projects")
        return "💾 Salvando projeto…"
      }
      return "📋 Carregando projetos…"
    }

    // Bolsas
    if (url.includes("/api/parse-termo") || url.includes("/bolsas")) {
      startAnimatedLoading("bolsas")
      return "📄 Analisando termo de outorga…"
    }

    // Evidências
    if (url.includes("/api/notificar") || url.includes("/evidencias")) {
      startAnimatedLoading("evidencias")
      return "📤 Enviando notificação…"
    }

    // CNPJ
    if (url.includes("/api/cnpj")) {
      startAnimatedLoading("cnpj")
      return "🔍 Consultando CNPJ…"
    }

    // Purchases
    if (url.includes("/api/purchases")) {
      return "🔄 Sincronizando dados…"
    }

    // Default
    return "⏳ Processando…"
  }

  // ===== INTERCEPTAÇÃO GLOBAL DE FETCH =====
  if (typeof window !== "undefined" && window.fetch && !window.__fetchWrapped) {
    const nativeFetch = window.fetch.bind(window)
    window.fetch = async function (input, init) {
      let fetchInit = init
      let message = defaultLoadingMessageForFetch(input)

      // Verificar se há mensagem customizada
      const hasRequest = typeof Request !== "undefined"
      if (fetchInit && typeof fetchInit === "object" && !(hasRequest && fetchInit instanceof Request)) {
        if (Object.prototype.hasOwnProperty.call(fetchInit, "loadingMessage")) {
          const custom = fetchInit.loadingMessage
          if (typeof custom === "string" && custom.trim()) {
            message = custom.trim()
          }
          fetchInit = { ...fetchInit }
          delete fetchInit.loadingMessage
        }
      }

      const token = startGlobalLoading(message)
      try {
        const response = await nativeFetch(input, fetchInit)
        return response
      } catch (error) {
        console.error("[LoadingManager] Erro na requisição:", error)
        throw error
      } finally {
        finishGlobalLoading(token)
      }
    }
    window.__fetchWrapped = true
  }

  // ===== INTERCEPTAÇÃO DE XMLHttpRequest (para compatibilidade) =====
  if (typeof window !== "undefined" && window.XMLHttpRequest && !window.__xhrWrapped) {
    const NativeXHR = window.XMLHttpRequest
    window.XMLHttpRequest = function () {
      const xhr = new NativeXHR()
      const originalOpen = xhr.open
      const originalSend = xhr.send
      let loadingToken = null

      xhr.open = function (method, url, ...args) {
        this._method = method
        this._url = url
        return originalOpen.apply(this, [method, url, ...args])
      }

      xhr.send = function (...args) {
        const message = defaultLoadingMessageForFetch(this._url || "")
        loadingToken = startGlobalLoading(message)
        this.addEventListener("loadend", () => {
          if (loadingToken) {
            finishGlobalLoading(loadingToken)
            loadingToken = null
          }
        })
        this.addEventListener("error", () => {
          if (loadingToken) {
            finishGlobalLoading(loadingToken)
            loadingToken = null
          }
        })
        return originalSend.apply(this, args)
      }

      return xhr
    }
    window.__xhrWrapped = true
  }

  // ===== EXPORTAR FUNÇÕES GLOBAIS =====
  window.startGlobalLoading = startGlobalLoading
  window.finishGlobalLoading = finishGlobalLoading
  window.startAnimatedLoading = startAnimatedLoading
  window.stopAnimatedLoading = stopAnimatedLoading

  // Inicializar elemento quando DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLoadingElement)
  } else {
    initLoadingElement()
  }

  console.log("[LoadingManager] Sistema de loading inicializado")
})()

