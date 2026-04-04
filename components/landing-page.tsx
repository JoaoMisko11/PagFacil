"use client"

import { useEffect } from "react"
import Link from "next/link"

export function LandingPage() {
  useEffect(() => {
    // Nav scroll effect
    const handleScroll = () => {
      document.getElementById("landing-nav")?.classList.toggle("scrolled", window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)

    // Animate bars on load
    document.querySelectorAll<HTMLElement>(".mockup-bar").forEach((bar, i) => {
      const h = bar.style.height
      bar.style.height = "0"
      setTimeout(() => { bar.style.height = h }, 200 + i * 80)
    })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  function toggleFaq(btn: HTMLButtonElement) {
    const item = btn.parentElement!
    const answer = item.querySelector<HTMLElement>(".faq-answer")!
    const isOpen = item.classList.contains("open")

    document.querySelectorAll(".faq-item.open").forEach(i => {
      i.classList.remove("open")
      const a = i.querySelector<HTMLElement>(".faq-answer")
      if (a) a.style.maxHeight = "0"
    })

    if (!isOpen) {
      item.classList.add("open")
      answer.style.maxHeight = answer.scrollHeight + "px"
    }
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: landingStyles }} />

      {/* Nav */}
      <nav className="landing-nav" id="landing-nav">
        <div className="landing-container landing-nav-inner">
          <a href="#" className="landing-nav-logo" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }) }}>
            <div className="landing-nav-logo-icon">P</div>
            PagaFacil
          </a>
          <ul className="landing-nav-links">
            <li><a href="#features" onClick={e => { e.preventDefault(); scrollTo("features") }}>Funcionalidades</a></li>
            <li><a href="#how-it-works" onClick={e => { e.preventDefault(); scrollTo("how-it-works") }}>Como funciona</a></li>
            <li><a href="#channels" onClick={e => { e.preventDefault(); scrollTo("channels") }}>Canais</a></li>
            <li><a href="#pricing" onClick={e => { e.preventDefault(); scrollTo("pricing") }}>Preco</a></li>
            <li><a href="#faq" onClick={e => { e.preventDefault(); scrollTo("faq") }}>FAQ</a></li>
          </ul>
          <div className="landing-nav-cta">
            <Link href="/login" className="landing-btn landing-btn-outline">Entrar</Link>
            <Link href="/login" className="landing-btn landing-btn-primary">Comecar gratis</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-container landing-hero-inner">
          <div>
            <div className="landing-hero-badge">
              <div className="landing-hero-badge-dot" />
              100% gratuito, sem cartao de credito
            </div>
            <h1>Suas contas a pagar <span>organizadas</span> de verdade</h1>
            <p className="landing-hero-description">
              Chega de planilha, caderno e esquecimento. Cadastre suas contas, receba lembretes e
              nunca mais pague com atraso.
            </p>
            <div className="landing-hero-buttons">
              <Link href="/login" className="landing-btn landing-btn-primary landing-btn-lg">Comecar agora &#8594;</Link>
              <a href="#features" className="landing-btn landing-btn-outline landing-btn-lg" onClick={e => { e.preventDefault(); scrollTo("features") }}>Ver funcionalidades</a>
            </div>
            <div className="landing-hero-social-proof">
              <div className="landing-hero-avatars">
                <div className="landing-hero-avatar" style={{ marginLeft: 0, background: "#dbeafe", color: "#3b82f6" }}>JM</div>
                <div className="landing-hero-avatar" style={{ background: "#dcfce7", color: "#008B55" }}>AL</div>
                <div className="landing-hero-avatar" style={{ background: "#fef3c7", color: "#b45309" }}>CS</div>
                <div className="landing-hero-avatar" style={{ background: "#ede9fe", color: "#8b5cf6" }}>+</div>
              </div>
              <span>Usado por MEIs e pessoas fisicas no Brasil</span>
            </div>
          </div>

          <div className="landing-hero-mockup">
            <div className="landing-hero-float landing-hero-float-1">&#128276; Lembrete enviado!</div>
            <div className="landing-hero-float landing-hero-float-2">&#9989; Conta paga!</div>
            <div className="landing-hero-mockup-frame">
              <div className="landing-hero-mockup-bar">
                <div className="landing-hero-mockup-dot" style={{ background: "#ef4444" }} />
                <div className="landing-hero-mockup-dot" style={{ background: "#f59e0b" }} />
                <div className="landing-hero-mockup-dot" style={{ background: "#22c55e" }} />
                <div className="landing-hero-mockup-url">pagafacil.work/dashboard</div>
              </div>
              <div className="mockup-dashboard">
                <div className="mockup-greeting">Bom dia, Joao &#9728;&#65039;</div>
                <div className="mockup-cards">
                  <div className="mockup-card">
                    <div className="mockup-card-value" style={{ color: "#ef4444" }}>2</div>
                    <div className="mockup-card-label">Vencidas</div>
                  </div>
                  <div className="mockup-card">
                    <div className="mockup-card-value" style={{ color: "#f59e0b" }}>1</div>
                    <div className="mockup-card-label">Hoje</div>
                  </div>
                  <div className="mockup-card">
                    <div className="mockup-card-value" style={{ color: "#3b82f6" }}>5</div>
                    <div className="mockup-card-label">7 dias</div>
                  </div>
                </div>
                <div className="mockup-chart">
                  <div className="mockup-bar mockup-bar-green" style={{ height: "30%" }} />
                  <div className="mockup-bar mockup-bar-gray" style={{ height: "45%" }} />
                  <div className="mockup-bar mockup-bar-green" style={{ height: "55%" }} />
                  <div className="mockup-bar mockup-bar-gray" style={{ height: "30%" }} />
                  <div className="mockup-bar mockup-bar-green" style={{ height: "70%" }} />
                  <div className="mockup-bar mockup-bar-gray" style={{ height: "20%" }} />
                  <div className="mockup-bar mockup-bar-green" style={{ height: "85%" }} />
                  <div className="mockup-bar mockup-bar-gray" style={{ height: "40%" }} />
                  <div className="mockup-bar mockup-bar-green" style={{ height: "60%" }} />
                  <div className="mockup-bar mockup-bar-gray" style={{ height: "55%" }} />
                </div>
                <div className="mockup-list">
                  <div className="mockup-list-item">
                    <div className="mockup-list-left">
                      <div className="mockup-list-dot" style={{ background: "#ef4444" }} />
                      <span className="mockup-list-name">Aluguel</span>
                    </div>
                    <span className="mockup-list-value">R$ 1.800,00</span>
                    <span className="mockup-list-btn">Pagar</span>
                  </div>
                  <div className="mockup-list-item">
                    <div className="mockup-list-left">
                      <div className="mockup-list-dot" style={{ background: "#f59e0b" }} />
                      <span className="mockup-list-name">Internet</span>
                    </div>
                    <span className="mockup-list-value">R$ 119,90</span>
                    <span className="mockup-list-btn">Pagar</span>
                  </div>
                  <div className="mockup-list-item">
                    <div className="mockup-list-left">
                      <div className="mockup-list-dot" style={{ background: "#3b82f6" }} />
                      <span className="mockup-list-name">Contador</span>
                    </div>
                    <span className="mockup-list-value">R$ 450,00</span>
                    <span className="mockup-list-btn">Pagar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="landing-trust-bar">
        <div className="landing-container landing-trust-inner">
          <div className="landing-trust-item"><span className="landing-trust-icon">&#128274;</span> Dados protegidos</div>
          <div className="landing-trust-item"><span className="landing-trust-icon">&#9889;</span> 100% gratuito</div>
          <div className="landing-trust-item"><span className="landing-trust-icon">&#128241;</span> Funciona no celular</div>
          <div className="landing-trust-item"><span className="landing-trust-icon">&#128276;</span> Lembretes automaticos</div>
          <div className="landing-trust-item"><span className="landing-trust-icon">&#129302;</span> Bot Telegram</div>
        </div>
      </div>

      {/* Features */}
      <section className="landing-section" id="features">
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="landing-section-label">Funcionalidades</div>
            <h2 className="landing-section-title">Tudo que voce precisa para nunca mais atrasar um pagamento</h2>
            <p className="landing-section-subtitle">Simples de usar, poderoso nos bastidores. Sem complicacao, sem custo.</p>
          </div>

          <div className="landing-features-grid">
            {[
              { icon: "📋", title: "Cadastro de contas", desc: "Fornecedor, valor, vencimento, categoria e observacoes. Crie uma por uma ou importe centenas de uma planilha.", bg: "icon-bg-green" },
              { icon: "📈", title: "Dashboard inteligente", desc: "Resumo financeiro, grafico de barras (pago vs pendente), calendario mensal, insights e streak de pontualidade.", bg: "icon-bg-blue" },
              { icon: "📅", title: "Calendario visual", desc: "Veja todas as contas do mes com dots coloridos. Clique no dia para detalhes. Totalizadores por mes.", bg: "icon-bg-amber" },
              { icon: "🔔", title: "Lembretes D-1", desc: "Receba uma notificacao 1 dia antes do vencimento por email e/ou Telegram. Nunca mais esqueca.", bg: "icon-bg-red" },
              { icon: "🔁", title: "Contas recorrentes", desc: "Semanal, quinzenal, mensal ou anual. Parcelas geradas automaticamente por 90 dias. Data de fim opcional.", bg: "icon-bg-purple" },
              { icon: "🤖", title: "Bot Telegram", desc: "Crie contas, liste pendencias e marque como paga direto pelo chat. Sem abrir o navegador.", bg: "icon-bg-blue" },
              { icon: "📄", title: "Importacao por planilha", desc: "Suba um arquivo Excel ou CSV e cadastre centenas de contas de uma vez. Preview com validacao antes de salvar.", bg: "icon-bg-green" },
              { icon: "👪", title: "Family Link", desc: "Compartilhe suas contas com outra pessoa via link de convite. Ambos veem e gerenciam tudo junto.", bg: "icon-bg-amber" },
              { icon: "🌓", title: "Dark mode", desc: "Modo escuro, claro ou automatico. Sem flash ao carregar. Perfeito para usar a noite.", bg: "icon-bg-purple" },
            ].map(f => (
              <div className="landing-feature-card" key={f.title}>
                <div className={`landing-feature-icon ${f.bg}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section landing-section-dark" id="how-it-works">
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="landing-section-label">Como funciona</div>
            <h2 className="landing-section-title">Comece a usar em menos de 1 minuto</h2>
            <p className="landing-section-subtitle">Sem instalacao, sem configuracao complicada. Abra, logue e pronto.</p>
          </div>

          <div className="landing-steps">
            {[
              { n: "1", color: "#00A868", title: "Faca login", desc: "Google, email ou Telegram. Sem senha para decorar, sem formulario de cadastro." },
              { n: "2", color: "#3b82f6", title: "Cadastre contas", desc: "Adicione uma por uma, importe da planilha ou crie em lote. Voce escolhe." },
              { n: "3", color: "#f59e0b", title: "Receba lembretes", desc: "Um dia antes do vencimento, voce recebe uma notificacao por email ou Telegram." },
              { n: "4", color: "#8b5cf6", title: "Marque como paga", desc: "1 clique no app ou no Telegram. Contas recorrentes geram a proxima automaticamente." },
            ].map(s => (
              <div className="landing-step" key={s.n}>
                <div className="landing-step-number" style={{ background: s.color }}>{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="landing-section-label">Por que trocar</div>
            <h2 className="landing-section-title">Planilha vs PagaFacil</h2>
            <p className="landing-section-subtitle">Voce ja sabe que a planilha nao funciona. Veja a diferenca.</p>
          </div>

          <div className="landing-comparison">
            <div className="landing-comparison-card landing-comparison-old">
              <h3>&#128196; Planilha / Caderno</h3>
              <ul className="landing-comparison-list">
                <li><span>&#10060;</span> Esquece de olhar e paga com atraso</li>
                <li><span>&#10060;</span> Nao avisa quando vence</li>
                <li><span>&#10060;</span> Dificil de manter atualizada</li>
                <li><span>&#10060;</span> Sem visao geral do mes</li>
                <li><span>&#10060;</span> So funciona no computador</li>
                <li><span>&#10060;</span> Nao compartilha com ninguem</li>
              </ul>
            </div>
            <div className="landing-comparison-card landing-comparison-new">
              <h3>&#9889; PagaFacil</h3>
              <ul className="landing-comparison-list">
                <li><span>&#9989;</span> Lembrete automatico 1 dia antes</li>
                <li><span>&#9989;</span> Notificacao por email e Telegram</li>
                <li><span>&#9989;</span> Contas recorrentes geram sozinhas</li>
                <li><span>&#9989;</span> Dashboard com graficos e calendario</li>
                <li><span>&#9989;</span> Funciona no celular como app (PWA)</li>
                <li><span>&#9989;</span> Family Link para compartilhar</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className="landing-section landing-section-dark" id="channels">
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="landing-section-label">Acesse de qualquer lugar</div>
            <h2 className="landing-section-title">3 formas de gerenciar suas contas</h2>
            <p className="landing-section-subtitle">Web, celular ou Telegram. Use o que for mais comodo pra voce.</p>
          </div>

          <div className="landing-channels-grid">
            {[
              { emoji: "💻", title: "Web App", desc: "Dashboard completo com graficos, calendario, filtros e gestao total. Funciona em qualquer navegador." },
              { emoji: "📱", title: "PWA no celular", desc: "Instale no celular como um app nativo. Mobile-first, rapido, funciona offline. Sem app store." },
              { emoji: "🤖", title: "Bot Telegram", desc: "@pagafacil_bot: /contas para listar, /nova para criar, /pagar para quitar. Tudo pelo chat." },
            ].map(c => (
              <div className="landing-channel-card" key={c.title}>
                <div className="landing-channel-emoji">{c.emoji}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="landing-section" id="pricing">
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="landing-section-label">Preco</div>
            <h2 className="landing-section-title">Gratis. De verdade.</h2>
            <p className="landing-section-subtitle">Sem plano premium, sem trial, sem cartao de credito. Todas as funcionalidades, para sempre.</p>
          </div>

          <div className="landing-pricing-card">
            <div className="landing-pricing-tag">Gratis</div>
            <div className="landing-pricing-price">R$ 0</div>
            <div className="landing-pricing-period">para sempre, sem limite</div>
            <ul className="landing-pricing-features">
              {[
                "Contas ilimitadas",
                "Dashboard com graficos e calendario",
                "Lembretes por email e Telegram",
                "Bot Telegram completo",
                "Importacao por planilha",
                "Contas recorrentes automaticas",
                "Family Link (compartilhar contas)",
                "Dark mode",
                "PWA (instalar no celular)",
              ].map(f => (
                <li key={f}><span className="landing-pricing-check">&#10003;</span> {f}</li>
              ))}
            </ul>
            <Link href="/login" className="landing-btn landing-btn-primary landing-btn-lg" style={{ width: "100%" }}>Comecar agora &#8594;</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section landing-section-dark" id="faq">
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="landing-section-label">FAQ</div>
            <h2 className="landing-section-title">Perguntas frequentes</h2>
          </div>

          <div className="landing-faq-list">
            {[
              { q: "Preciso pagar alguma coisa?", a: "Nao. O PagaFacil e 100% gratuito. Nao tem plano pago, nao tem trial, nao pede cartao de credito. Todas as funcionalidades estao disponiveis para todos os usuarios." },
              { q: "Preciso instalar alguma coisa?", a: 'Nao. O PagaFacil funciona direto no navegador, como um site. Se quiser, pode instalar como app no celular (PWA) — basta acessar e clicar em "Adicionar a tela inicial". Nao precisa de app store.' },
              { q: "Como funciona o login?", a: "Voce pode entrar com Google (1 clique), receber um link magico por email, ou usar um codigo OTP enviado pelo Telegram. Nao precisa criar senha." },
              { q: "Meus dados estao seguros?", a: "Sim. Usamos autenticacao JWT, validacao em todas as acoes, banco PostgreSQL com criptografia em transito e cada usuario so ve seus proprios dados. Nao compartilhamos informacoes com terceiros." },
              { q: "O que e o Family Link?", a: "O Family Link permite compartilhar suas contas com outra pessoa (conjuge, socio, etc). Voce gera um link de convite, a pessoa aceita, e ambos passam a ver e gerenciar as mesmas contas." },
              { q: "Posso importar minhas contas de uma planilha?", a: "Sim! Basta subir um arquivo Excel (.xlsx, .xls) ou CSV. O sistema identifica as colunas automaticamente, mostra um preview para voce validar, e importa todas as contas de uma vez. Ate 500 contas por arquivo." },
              { q: "Funciona para empresa (MEI)?", a: "Sim. O PagaFacil foi feito para MEIs e pessoas fisicas. As categorias incluem: Fixo, Variavel, Imposto, Fornecedor, Assinatura, Funcionario e Outro — cobrindo os gastos mais comuns de um pequeno negocio." },
            ].map((item, i) => (
              <div className="faq-item" key={i}>
                <button className="landing-faq-question" onClick={e => toggleFaq(e.currentTarget)}>
                  {item.q}
                  <svg className="landing-faq-chevron" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
                </button>
                <div className="faq-answer"><div className="landing-faq-answer-inner">{item.a}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="landing-cta-section">
        <div className="landing-container landing-cta-content">
          <h2>Pare de pagar com <span>atraso</span></h2>
          <p>Comece agora em menos de 1 minuto. Sem cadastro complicado, sem custo.</p>
          <div className="landing-cta-buttons">
            <Link href="/login" className="landing-btn landing-btn-primary landing-btn-lg">Comecar gratis &#8594;</Link>
            <a href="#features" className="landing-btn landing-btn-white landing-btn-lg" onClick={e => { e.preventDefault(); scrollTo("features") }}>Ver funcionalidades</a>
          </div>
          <p className="landing-cta-note">&#128274; Sem cartao de credito. Seus dados protegidos.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="landing-footer-brand-icon">P</div>
            <span>PagaFacil</span>
          </div>
          <ul className="landing-footer-links">
            <li><a href="#features" onClick={e => { e.preventDefault(); scrollTo("features") }}>Funcionalidades</a></li>
            <li><a href="#pricing" onClick={e => { e.preventDefault(); scrollTo("pricing") }}>Preco</a></li>
            <li><a href="#faq" onClick={e => { e.preventDefault(); scrollTo("faq") }}>FAQ</a></li>
            <li><Link href="/login">Entrar</Link></li>
          </ul>
          <span className="landing-footer-copy">&copy; 2026 PagaFacil. Todos os direitos reservados.</span>
        </div>
      </footer>
    </>
  )
}

/* ===== All landing page styles (scoped with landing- prefix) ===== */
const landingStyles = `
  /* Reset for landing only */
  .landing-nav, .landing-hero, .landing-section, .landing-section-dark,
  .landing-trust-bar, .landing-cta-section, .landing-footer {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
  }

  .landing-container { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
  .landing-section { padding: 96px 0; }
  .landing-section-dark { background: #f8fafc; padding: 96px 0; }

  .landing-section-header { text-align: center; max-width: 640px; margin: 0 auto 56px; }
  .landing-section-label { display: inline-block; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #00A868; margin-bottom: 12px; }
  .landing-section-title { font-size: 2.25rem; font-weight: 800; color: #0f172a; line-height: 1.2; margin-bottom: 16px; }
  .landing-section-subtitle { font-size: 1.1rem; color: #64748b; line-height: 1.7; }

  .landing-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 1rem; font-weight: 600; padding: 14px 32px; border-radius: 12px; border: none; cursor: pointer; transition: all 0.2s; text-decoration: none; }
  .landing-btn-primary { background: #00A868; color: white; box-shadow: 0 4px 14px rgba(0,168,104,0.35); }
  .landing-btn-primary:hover { background: #00C978; box-shadow: 0 6px 20px rgba(0,168,104,0.4); transform: translateY(-1px); }
  .landing-btn-outline { background: transparent; color: #00A868; border: 2px solid #00A868; }
  .landing-btn-outline:hover { background: rgba(0,168,104,0.08); }
  .landing-btn-white { background: white; color: #008B55; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07); }
  .landing-btn-white:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08); transform: translateY(-1px); }
  .landing-btn-lg { font-size: 1.1rem; padding: 16px 40px; border-radius: 14px; }

  /* Nav */
  .landing-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid #e2e8f0; transition: box-shadow 0.3s; }
  .landing-nav.scrolled { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07); }
  .landing-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 64px; }
  .landing-nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; font-weight: 800; font-size: 1.25rem; color: #0f172a; }
  .landing-nav-logo-icon { width: 36px; height: 36px; border-radius: 10px; background: #00A868; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.1rem; }
  .landing-nav-links { display: flex; align-items: center; gap: 32px; list-style: none; }
  .landing-nav-links a { text-decoration: none; color: #475569; font-size: 0.9rem; font-weight: 500; transition: color 0.2s; }
  .landing-nav-links a:hover { color: #00A868; }
  .landing-nav-cta { display: flex; align-items: center; gap: 12px; }
  .landing-nav-cta .landing-btn { padding: 10px 24px; font-size: 0.9rem; }

  /* Hero */
  .landing-hero { padding: 140px 0 100px; background: linear-gradient(180deg, #fff 0%, #f8fafc 100%); position: relative; overflow: hidden; }
  .landing-hero::before { content: ''; position: absolute; top: -40%; right: -20%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(0,168,104,0.07) 0%, transparent 70%); border-radius: 50%; }
  .landing-hero-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; position: relative; z-index: 1; }
  .landing-hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(0,168,104,0.08); border: 1px solid rgba(0,168,104,0.15); color: #008B55; padding: 6px 16px; border-radius: 100px; font-size: 0.8rem; font-weight: 600; margin-bottom: 24px; }
  .landing-hero-badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #00A868; animation: landing-pulse 2s ease-in-out infinite; }
  @keyframes landing-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
  .landing-hero h1 { font-size: 3.5rem; font-weight: 800; color: #0f172a; line-height: 1.1; margin-bottom: 20px; letter-spacing: -0.02em; }
  .landing-hero h1 span { background: linear-gradient(135deg, #00A868 0%, #00C978 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .landing-hero-description { font-size: 1.2rem; color: #64748b; line-height: 1.7; margin-bottom: 36px; max-width: 480px; }
  .landing-hero-buttons { display: flex; gap: 16px; margin-bottom: 40px; }
  .landing-hero-social-proof { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: #64748b; }
  .landing-hero-avatars { display: flex; }
  .landing-hero-avatar { width: 36px; height: 36px; border-radius: 50%; border: 2px solid white; margin-left: -8px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; }

  /* Mockup */
  .landing-hero-mockup { position: relative; }
  .landing-hero-mockup-frame { background: #fff; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.08), 0 0 0 1px #e2e8f0; padding: 20px; overflow: hidden; }
  .landing-hero-mockup-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
  .landing-hero-mockup-dot { width: 10px; height: 10px; border-radius: 50%; }
  .landing-hero-mockup-url { flex: 1; background: #f1f5f9; border-radius: 6px; padding: 6px 12px; font-size: 0.75rem; color: #64748b; font-family: monospace; }
  .mockup-dashboard { display: flex; flex-direction: column; gap: 12px; }
  .mockup-greeting { font-size: 1rem; font-weight: 700; color: #0f172a; }
  .mockup-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .mockup-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; }
  .mockup-card-value { font-size: 1.1rem; font-weight: 800; margin-bottom: 2px; }
  .mockup-card-label { font-size: 0.65rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .mockup-chart { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; height: 100px; display: flex; align-items: flex-end; gap: 6px; justify-content: center; }
  .mockup-bar { width: 20px; border-radius: 4px 4px 0 0; transition: height 0.5s; }
  .mockup-bar-green { background: #00A868; }
  .mockup-bar-gray { background: #cbd5e1; }
  .mockup-list { display: flex; flex-direction: column; gap: 6px; }
  .mockup-list-item { display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 0.8rem; }
  .mockup-list-left { display: flex; align-items: center; gap: 8px; }
  .mockup-list-dot { width: 8px; height: 8px; border-radius: 50%; }
  .mockup-list-name { font-weight: 600; color: #334155; }
  .mockup-list-value { font-weight: 700; color: #0f172a; font-size: 0.8rem; }
  .mockup-list-btn { background: rgba(0,168,104,0.08); color: #00A868; border: 1px solid rgba(0,168,104,0.15); border-radius: 6px; padding: 4px 10px; font-size: 0.7rem; font-weight: 600; }

  .landing-hero-float { position: absolute; background: white; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08); padding: 12px 16px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 8px; animation: landing-float 3s ease-in-out infinite; z-index: 2; }
  .landing-hero-float-1 { top: -10px; right: -20px; color: #008B55; }
  .landing-hero-float-2 { bottom: 40px; left: -30px; color: #3b82f6; animation-delay: 1s; }
  @keyframes landing-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

  /* Trust */
  .landing-trust-bar { padding: 48px 0; border-bottom: 1px solid #e2e8f0; }
  .landing-trust-inner { display: flex; align-items: center; justify-content: center; gap: 48px; flex-wrap: wrap; }
  .landing-trust-item { display: flex; align-items: center; gap: 10px; color: #94a3b8; font-size: 0.9rem; font-weight: 600; }
  .landing-trust-icon { font-size: 1.5rem; }

  /* Features */
  .landing-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .landing-feature-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; transition: all 0.3s; position: relative; overflow: hidden; }
  .landing-feature-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #00A868; opacity: 0; transition: opacity 0.3s; }
  .landing-feature-card:hover { border-color: rgba(0,168,104,0.15); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08); transform: translateY(-4px); }
  .landing-feature-card:hover::before { opacity: 1; }
  .landing-feature-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 20px; }
  .icon-bg-green { background: rgba(0,168,104,0.1); }
  .icon-bg-blue { background: rgba(59,130,246,0.1); }
  .icon-bg-amber { background: rgba(245,158,11,0.1); }
  .icon-bg-red { background: rgba(239,68,68,0.1); }
  .icon-bg-purple { background: rgba(139,92,246,0.1); }
  .landing-feature-card h3 { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
  .landing-feature-card p { font-size: 0.9rem; color: #64748b; line-height: 1.6; }

  /* Steps */
  .landing-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; position: relative; }
  .landing-steps::before { content: ''; position: absolute; top: 32px; left: 15%; right: 15%; height: 2px; background: linear-gradient(90deg, #00A868 0%, #3b82f6 50%, #8b5cf6 100%); opacity: 0.2; }
  .landing-step { text-align: center; position: relative; }
  .landing-step-number { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; color: white; margin: 0 auto 20px; position: relative; z-index: 1; }
  .landing-step h3 { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
  .landing-step p { font-size: 0.9rem; color: #64748b; line-height: 1.6; }

  /* Comparison */
  .landing-comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; max-width: 800px; margin: 0 auto; }
  .landing-comparison-card { border-radius: 16px; padding: 36px; }
  .landing-comparison-old { background: #f8fafc; border: 1px solid #e2e8f0; }
  .landing-comparison-new { background: linear-gradient(135deg, #00A868 0%, #008B55 100%); color: white; box-shadow: 0 8px 32px rgba(0,168,104,0.3); }
  .landing-comparison-card h3 { font-size: 1.15rem; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
  .landing-comparison-old h3 { color: #475569; }
  .landing-comparison-new h3 { color: white; }
  .landing-comparison-list { list-style: none; display: flex; flex-direction: column; gap: 12px; padding: 0; }
  .landing-comparison-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.9rem; line-height: 1.5; }
  .landing-comparison-old .landing-comparison-list li { color: #64748b; }
  .landing-comparison-new .landing-comparison-list li { color: rgba(255,255,255,0.9); }

  /* Channels */
  .landing-channels-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .landing-channel-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; text-align: center; transition: all 0.3s; }
  .landing-channel-card:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08); transform: translateY(-4px); }
  .landing-channel-emoji { font-size: 2.5rem; margin-bottom: 16px; }
  .landing-channel-card h3 { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
  .landing-channel-card p { font-size: 0.9rem; color: #64748b; line-height: 1.6; }

  /* Pricing */
  .landing-pricing-card { max-width: 480px; margin: 0 auto; background: #fff; border: 2px solid #00A868; border-radius: 24px; padding: 48px; text-align: center; position: relative; overflow: hidden; }
  .landing-pricing-tag { position: absolute; top: 20px; right: -32px; background: #00A868; color: white; font-size: 0.75rem; font-weight: 700; padding: 6px 40px; transform: rotate(45deg); text-transform: uppercase; letter-spacing: 1px; }
  .landing-pricing-price { font-size: 4rem; font-weight: 800; color: #00A868; margin-bottom: 4px; }
  .landing-pricing-period { font-size: 1rem; color: #64748b; margin-bottom: 32px; }
  .landing-pricing-features { list-style: none; text-align: left; display: flex; flex-direction: column; gap: 14px; margin-bottom: 36px; padding: 0; }
  .landing-pricing-features li { display: flex; align-items: center; gap: 12px; font-size: 0.95rem; color: #334155; }
  .landing-pricing-check { width: 24px; height: 24px; border-radius: 50%; background: rgba(0,168,104,0.08); color: #00A868; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }

  /* FAQ */
  .landing-faq-list { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
  .faq-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; transition: border-color 0.2s; }
  .faq-item.open { border-color: #00A868; }
  .landing-faq-question { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; background: none; border: none; cursor: pointer; font-size: 1rem; font-weight: 600; color: #0f172a; text-align: left; line-height: 1.4; font-family: inherit; }
  .landing-faq-chevron { width: 20px; height: 20px; flex-shrink: 0; transition: transform 0.3s; color: #94a3b8; }
  .faq-item.open .landing-faq-chevron { transform: rotate(180deg); color: #00A868; }
  .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
  .landing-faq-answer-inner { padding: 0 24px 20px; font-size: 0.95rem; color: #64748b; line-height: 1.7; }

  /* CTA */
  .landing-cta-section { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 96px 0; text-align: center; position: relative; overflow: hidden; }
  .landing-cta-section::before { content: ''; position: absolute; top: -50%; left: 50%; transform: translateX(-50%); width: 800px; height: 800px; background: radial-gradient(circle, rgba(0,168,104,0.12) 0%, transparent 60%); border-radius: 50%; }
  .landing-cta-content { position: relative; z-index: 1; }
  .landing-cta-section h2 { font-size: 2.5rem; font-weight: 800; color: white; margin-bottom: 16px; }
  .landing-cta-section h2 span { color: #00A868; }
  .landing-cta-section p { font-size: 1.15rem; color: #94a3b8; margin-bottom: 36px; max-width: 500px; margin-left: auto; margin-right: auto; }
  .landing-cta-buttons { display: flex; justify-content: center; gap: 16px; }
  .landing-cta-note { margin-top: 20px; font-size: 0.85rem; color: #64748b; }

  /* Footer */
  .landing-footer { background: #0f172a; border-top: 1px solid #334155; padding: 48px 0 32px; }
  .landing-footer-inner { display: flex; align-items: center; justify-content: space-between; }
  .landing-footer-brand { display: flex; align-items: center; gap: 10px; }
  .landing-footer-brand-icon { width: 32px; height: 32px; border-radius: 8px; background: #00A868; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 0.9rem; }
  .landing-footer-brand span { font-weight: 700; color: white; font-size: 1rem; }
  .landing-footer-copy { font-size: 0.85rem; color: #64748b; }
  .landing-footer-links { display: flex; gap: 24px; list-style: none; padding: 0; }
  .landing-footer-links a { color: #94a3b8; text-decoration: none; font-size: 0.85rem; transition: color 0.2s; }
  .landing-footer-links a:hover { color: #00A868; }

  /* Responsive */
  @media (max-width: 1024px) {
    .landing-hero h1 { font-size: 2.75rem; }
    .landing-features-grid { grid-template-columns: repeat(2, 1fr); }
    .landing-steps { grid-template-columns: repeat(2, 1fr); gap: 24px; }
    .landing-steps::before { display: none; }
  }
  @media (max-width: 768px) {
    .landing-nav-links { display: none; }
    .landing-nav-cta .landing-btn-outline { display: none; }
    .landing-hero { padding: 100px 0 60px; }
    .landing-hero-inner { grid-template-columns: 1fr; gap: 40px; text-align: center; }
    .landing-hero h1 { font-size: 2.25rem; }
    .landing-hero-description { margin: 0 auto 32px; font-size: 1.05rem; }
    .landing-hero-buttons { justify-content: center; flex-wrap: wrap; }
    .landing-hero-social-proof { justify-content: center; }
    .landing-hero-mockup { max-width: 400px; margin: 0 auto; }
    .landing-hero-float { display: none; }
    .landing-section, .landing-section-dark { padding: 64px 0; }
    .landing-section-title { font-size: 1.75rem; }
    .landing-features-grid { grid-template-columns: 1fr; }
    .landing-steps { grid-template-columns: 1fr; }
    .landing-comparison { grid-template-columns: 1fr; }
    .landing-channels-grid { grid-template-columns: 1fr; }
    .landing-cta-section h2 { font-size: 1.75rem; }
    .landing-cta-buttons { flex-direction: column; align-items: center; }
    .landing-footer-inner { flex-direction: column; gap: 20px; text-align: center; }
    .landing-footer-links { flex-wrap: wrap; justify-content: center; }
    .landing-trust-inner { gap: 24px; }
  }
  @media (max-width: 480px) {
    .landing-hero h1 { font-size: 1.85rem; }
    .mockup-cards { grid-template-columns: 1fr; }
    .landing-pricing-card { padding: 32px 24px; }
    .landing-pricing-price { font-size: 3rem; }
  }
`
