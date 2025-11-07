// src/login.js
const STORAGE_KEY = "edge.auth"

function saveAuth(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...profile, savedAt: new Date().toISOString() }))
  } catch (e) {
    console.error("Falha ao salvar perfil:", e)
  }
}

function getEl(nameOrId) {
  return document.querySelector(`[name="${nameOrId}"]`) || document.getElementById(nameOrId)
}

function showError(msg) {
  const box = document.getElementById("loginError")
  if (box) box.textContent = msg
  else if (msg) alert(msg)
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm")
  const signupForm = document.getElementById("signupForm")

  if (!loginForm) return

  const email = getEl("email")
  const senha = getEl("senha")

  // ➜ NÃO redireciona automaticamente se já estiver logado.
  // Apenas mostra um aviso/atalho se você quiser:
  const auth = (() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")
    } catch {
      return null
    }
  })()

  const already = document.getElementById("alreadyLogged")
  if (auth && already) {
    already.hidden = false // exibe um aviso "já logado"
    const go = already.querySelector("button[data-go]")
    go?.addEventListener("click", () => window.location.replace("/dashboard"))
  }

  // Facilitar testes
  if (email && !email.value) email.value = "admin@edge.local"

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault()
    showError("")

    const vEmail = String(email?.value || "").trim()
    const vSenha = String(senha?.value || "").trim()

    if (!vEmail.includes("@") || vSenha.length < 4) {
      showError("E-mail ou senha inválidos.")
      return
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]")
    const usuario = usuarios.find((u) => u.email === vEmail && u.senha === vSenha)

    const tipoAcesso = usuario?.acesso || "ADMIN" // Default ADMIN se não encontrar

    saveAuth({
      email: vEmail,
      name: vEmail.split("@")[0],
      role: "user",
      tipoAcesso: tipoAcesso, // Salvar tipo de acesso
    })
    window.location.replace("/dashboard")
  })

  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const formData = new FormData(signupForm)
      const vEmail = String(formData.get("email") || "").trim()
      const vSenha = String(formData.get("senha") || "").trim()
      const vAcesso = String(formData.get("acesso") || "").trim()

      if (!vEmail.includes("@") || vSenha.length < 4 || !vAcesso) {
        alert("Preencha todos os campos corretamente.")
        return
      }

      // Salvar usuário no localStorage
      const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]")

      // Verificar se usuário já existe
      if (usuarios.find((u) => u.email === vEmail)) {
        alert("Este e-mail já está cadastrado.")
        return
      }

      usuarios.push({ email: vEmail, senha: vSenha, acesso: vAcesso })
      localStorage.setItem("usuarios", JSON.stringify(usuarios))

      alert("Conta criada com sucesso! Faça login para continuar.")

      // Voltar para tela de login
      const tabs = document.querySelectorAll(".auth-tab")
      const panes = document.querySelectorAll(".auth-pane")
      tabs.forEach((b) => b.classList.toggle("is-active", b.dataset.tab === "login"))
      panes.forEach((p) => p.classList.toggle("is-active", p.dataset.pane === "login"))

      signupForm.reset()
    })
  }
})
