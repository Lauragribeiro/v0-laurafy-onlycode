// public/bolsas.js
// Módulo para gerenciamento de bolsistas

/**
 * Cria ou atualiza um registro de bolsista
 * @param {Object} params
 * @param {string} [params.editingId] - ID do bolsista sendo editado
 * @param {string} params.nome - Nome do bolsista
 * @param {string} params.cpfDigits - CPF (apenas dígitos)
 * @param {string} params.funcao - Função/cargo do bolsista
 * @param {number} params.valorNum - Valor da bolsa
 * @param {Object} [params.termoUpload] - Arquivo do termo de outorga
 * @param {Object} [params.fallbackTermo] - Termo existente (fallback)
 * @param {Function} [params.now] - Função para obter data atual (para testes)
 * @param {Function} [params.idFactory] - Função para gerar ID (para testes)
 * @param {Object} [params.existingRecord] - Registro existente (para comparação)
 * @returns {Object} Registro do bolsista
 */
export function buildBolsistaRecord({
  editingId = null,
  nome = "",
  cpfDigits = "",
  funcao = "",
  valorNum = 0,
  termoUpload = null,
  fallbackTermo = null,
  now = () => new Date(),
  idFactory = () => `bolsista-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  existingRecord = null,
} = {}) {
  const currentTime = now()
  const id = editingId || idFactory()

  // Processa o termo de outorga
  let termo = null
  if (termoUpload && termoUpload.parsed) {
    termo = {
      fileName: termoUpload.fileName || "termo.pdf",
      vigenciaISO: termoUpload.parsed.vigenciaISO || null,
      vigenciaRaw: termoUpload.parsed.vigenciaRaw || null,
      valorMaximo: termoUpload.parsed.valorMaximo || null,
      valorMaximoRaw: termoUpload.parsed.valorMaximoRaw || null,
      parsedAt: currentTime.toISOString(),
    }
  } else if (fallbackTermo) {
    termo = fallbackTermo
  }

  // Registra histórico de alterações
  const historicoAlteracoes = existingRecord?.historicoAlteracoes || []

  if (existingRecord) {
    // Verifica mudanças na função
    if (existingRecord.funcao !== funcao) {
      historicoAlteracoes.push({
        campo: "funcao",
        anterior: existingRecord.funcao,
        atual: funcao,
        modificadoEm: currentTime.toISOString(),
      })
    }

    // Verifica mudanças no valor
    if (existingRecord.valor !== valorNum) {
      historicoAlteracoes.push({
        campo: "valor",
        anterior: existingRecord.valor,
        atual: valorNum,
        modificadoEm: currentTime.toISOString(),
      })
    }
  }

  return {
    id,
    nome: nome.trim(),
    cpf: cpfDigits.trim(),
    funcao: funcao.trim(),
    valor: valorNum,
    termo,
    atualizadoEm: currentTime.toISOString(),
    historicoAlteracoes,
  }
}

/**
 * Adiciona ou atualiza um bolsista na lista
 * @param {Array} lista - Lista atual de bolsistas
 * @param {Object} record - Registro do bolsista
 * @param {string|null} editingId - ID do bolsista sendo editado (null para novo)
 * @returns {Array} Lista atualizada
 */
export function upsertBolsistas(lista = [], record = {}, editingId = null) {
  if (!Array.isArray(lista)) {
    lista = []
  }

  if (editingId) {
    // Atualiza bolsista existente
    const index = lista.findIndex((b) => b.id === editingId)
    if (index >= 0) {
      const updated = [...lista]
      updated[index] = record
      return updated
    }
  }

  // Adiciona novo bolsista
  return [...lista, record]
}

/**
 * Resolve conflitos entre dados em memória e armazenamento local
 * @param {Object} params
 * @param {Array} params.previous - Lista anterior (em memória)
 * @param {Array|null} params.stored - Lista armazenada (localStorage)
 * @param {string} params.projectId - ID do projeto
 * @returns {Object} { list: Array, shouldPersist: boolean }
 */
export function resolveStoredBolsistas({ previous = [], stored = null, projectId = null } = {}) {
  // Se não há dados armazenados, mantém os dados em memória e persiste
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    return {
      list: previous || [],
      shouldPersist: true,
    }
  }

  // Se há dados armazenados, prioriza eles
  return {
    list: stored,
    shouldPersist: false,
  }
}
