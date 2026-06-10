import React, { useState, useEffect, useRef } from "react";

const BRAND = "#056EB7";
const BRAND_DARK = "#045A94";

const useVisible = (threshold = 0.15) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

const BenefitIcons = [
  <svg width="28" height="28" fill="none" stroke="#056EB7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  <svg width="28" height="28" fill="none" stroke="#056EB7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>,
  <svg width="28" height="28" fill="none" stroke="#056EB7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg width="28" height="28" fill="none" stroke="#056EB7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  <svg width="28" height="28" fill="none" stroke="#056EB7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  <svg width="28" height="28" fill="none" stroke="#056EB7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
];

const benefits = [
  { title: "Sin Stock Propio", desc: "Vendé productos sin necesidad de tener inventario. El proveedor se encarga de todo." },
  { title: "Logística Integrada", desc: "Fixy, Legex y más transportadoras disponibles. Tu pedido sale sin que muevas un dedo." },
  { title: "Ganancias Claras", desc: "Fijás tu precio de venta, nosotros mostramos tu ganancia estimada en tiempo real." },
  { title: "Analytics en Tiempo Real", desc: "Seguí tus ventas, unidades y rentabilidad desde un panel centralizado." },
  { title: "Pagos Seguros", desc: "Wallet propio con recaudo o sin recaudo. Tu dinero siempre claro y disponible." },
  { title: "Alta en Minutos", desc: "Registrate, elegí productos y empezá a vender el mismo día. Sin burocracia." },
];

const stats = [
  { value: "500+", label: "Productos disponibles" },
  { value: "3",    label: "Logísticas integradas" },
  { value: "100%", label: "Digital y sin stock" },
  { value: "24h",  label: "Soporte al vendedor" },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [heroRef,     heroVisible]     = useVisible(0.1);
  const [benefitsRef, benefitsVisible] = useVisible(0.1);
  const [aboutRef,    aboutVisible]    = useVisible(0.1);
  const [ctaRef,      ctaVisible]      = useVisible(0.1);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#f8fafc", color: "#111827", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .fade-up { opacity: 0; transform: translateY(32px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        .fade-up.d1 { transition-delay: 0.1s; }
        .fade-up.d2 { transition-delay: 0.2s; }
        .fade-up.d3 { transition-delay: 0.3s; }
        .fade-up.d4 { transition-delay: 0.4s; }
        .fade-up.d5 { transition-delay: 0.5s; }
        .fade-up.d6 { transition-delay: 0.6s; }
        .nav-link { background: none; border: none; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: #374151; transition: color 0.2s; padding: 8px 12px; border-radius: 8px; }
        .nav-link:hover { color: ${BRAND}; }
        .btn-primary { background: ${BRAND}; color: white; border: none; border-radius: 10px; font-family: 'Inter', sans-serif; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { background: ${BRAND_DARK}; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(5,110,183,0.25); }
        .btn-outline { background: white; color: ${BRAND}; border: 2px solid ${BRAND}; border-radius: 10px; font-family: 'Inter', sans-serif; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-outline:hover { background: ${BRAND}; color: white; transform: translateY(-2px); }
        .benefit-card { background: white; border-radius: 16px; padding: 28px 24px; border: 1.5px solid #e5e7eb; transition: all 0.3s; text-align: center; }
        .benefit-card:hover { border-color: ${BRAND}; box-shadow: 0 8px 32px rgba(5,110,183,0.1); transform: translateY(-4px); }
        .hero-blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.15; pointer-events: none; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .stat-item { text-align: center; padding: 24px 16px; }
        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; text-align: center; }
          .hero-stats { justify-content: center !important; }
          .hero-cta { justify-content: center !important; }
          .benefits-grid { grid-template-columns: 1fr 1fr !important; }
          .about-grid { flex-direction: column !important; text-align: center; }
          .cta-btns { flex-direction: column !important; align-items: center !important; }
        }
        @media (max-width: 480px) {
          .benefits-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #e5e7eb" : "none",
        transition: "all 0.3s", padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <div style={{ cursor: "pointer" }} onClick={() => scrollTo("hero")}>
            <img src="/full-logo.png" alt="EasyPy" style={{ height: 36, objectFit: "contain" }} />
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[["Beneficios","benefits"],["Nosotros","about"]].map(([label, id]) => (
              <button key={id} className="nav-link" onClick={() => scrollTo(id)}>{label}</button>
            ))}
          </nav>
          <button className="btn-primary" style={{ padding: "9px 24px", fontSize: 14 }} onClick={() => window.location.href="/login"}>
            Conectate
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section id="hero" ref={heroRef} style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", background: "linear-gradient(135deg, #f0f7ff 0%, #ffffff 50%, #f8fafc 100%)", paddingTop: 68 }}>
        <div className="hero-blob" style={{ width: 500, height: 500, background: BRAND, top: -100, right: -100 }} />
        <div className="hero-blob" style={{ width: 300, height: 300, background: "#22d3ee", bottom: 50, left: -80 }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px", width: "100%" }}>
          <div className="hero-grid" style={{ display: "flex", alignItems: "center", gap: 64 }}>

            {/* Left — texto centrado */}
            <div style={{ flex: 1, textAlign: "center" }}>
              <h1 className={`fade-up d1 ${heroVisible ? "visible" : ""}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 24, color: "#0f172a" }}>
                Vendé sin stock.<br />
                <span style={{ color: BRAND }}>Ganá en serio.</span>
              </h1>
              <span className={`fade-up d2 ${heroVisible ? "visible" : ""}`} style={{ fontSize: 18, color: "#475569", lineHeight: 1.7, marginBottom: 36, maxWidth: 520, margin: "0 auto 36px" }}>
                EasyPy es la plataforma que conecta vendedores con proveedores locales. Sin inventario, sin complicaciones. Solo ventas.
              </span>
              <div className={`hero-cta fade-up d3 ${heroVisible ? "visible" : ""}`} style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn-primary" style={{ padding: "14px 32px", fontSize: 16 , marginTop: "20px"}} onClick={() => window.location.href="/signup"}>
                  Empezar gratis
                </button>
              </div>
              <div className={`hero-stats fade-up d4 ${heroVisible ? "visible" : ""}`} style={{ display: "flex", gap: 28, marginTop: 40, justifyContent: "center", flexWrap: "wrap" }}>
                {[["500+","Productos"],["3","Logísticas"],["0 stock","Requerido"]].map(([val, label]) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: BRAND, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{val}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — card */}
            <div className={`fade-up d2 ${heroVisible ? "visible" : ""}`} style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative" }}>
              <div style={{ position: "relative", animation: "float 4s ease-in-out infinite" }}>
                <div style={{ width: 340, height: 420, background: "white", borderRadius: 28, boxShadow: "0 32px 80px rgba(5,110,183,0.18)", overflow: "hidden", border: "1.5px solid #e5e7eb" }}>
                  <div style={{ height: 200, overflow: "hidden" }}>
                    <img src="/smartwatch.jpeg" alt="Smart Watch" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "20px 24px" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: 0.5 }}>Electrónica</span>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 6, marginBottom: 8 }}>Smart Watch Pro</h3>
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>Precio de compra</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: BRAND, marginBottom: 4 }}>Gs. 800.000</div>
                    <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>Venta sugerida: Gs. 1.200.000</div>
                  </div>
                </div>
                <div style={{ position: "absolute", top: -16, right: -24, background: "#16a34a", color: "white", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 700, boxShadow: "0 4px 16px rgba(22,163,74,0.3)" }}>
                  +Gs. 400k ganancia
                </div>
                <div style={{ position: "absolute", bottom: 40, left: -28, background: "white", borderRadius: 12, padding: "10px 16px", fontSize: 12, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb", color: "#374151" }}>
                  Envío en 24hs
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section id="benefits" ref={benefitsRef} style={{ background: "white", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className={`fade-up ${benefitsVisible ? "visible" : ""}`} style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>
              Todo lo que necesitás<br />para empezar a vender
            </h2>
            <span style={{ fontSize: 17, color: "#64748b", maxWidth: 520, margin: "0 auto" }}>
              Una plataforma completa diseñada para vendedores que quieren crecer sin complicaciones.
            </span>
          </div>
          <div className="benefits-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {benefits.map((b, i) => (
              <div key={i} className={`benefit-card fade-up d${Math.min(i+1,6)} ${benefitsVisible ? "visible" : ""}`}>
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
                  <div style={{ width: 52, height: 52, background: "#eff6ff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {BenefitIcons[i]}
                  </div>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: "#0f172a" }}>{b.title}</h3>
                <span style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>{b.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT US ── */}
      <section id="about" ref={aboutRef} style={{ background: "#f8fafc", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="about-grid" style={{ display: "flex", gap: 80, alignItems: "center" }}>
            <div className={`fade-up ${aboutVisible ? "visible" : ""}`} style={{ flex: 1, textAlign: "center" }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#0f172a", marginBottom: 20, lineHeight: 1.15 }}>
                Nació en Paraguay<br />para Paraguay
              </h2>
              <span style={{ fontSize: 16, color: "#475569", lineHeight: 1.8, marginBottom: 20 }}>
                EasyPy es una plataforma local que conecta proveedores con vendedores de todo el país. Creemos que cualquier persona puede construir un negocio online sin necesidad de capital para stock.
              </span>
              <span style={{ fontSize: 16, color: "#475569", lineHeight: 1.8, marginBottom: 32 }}>
                Integramos logísticas reales, procesamos pagos con recaudo o sin recaudo, y te damos las herramientas para escalar tu negocio con datos claros.
              </span>
              <button className="btn-primary" style={{ padding: "13px 28px", fontSize: 15 , marginTop: "20px"}} onClick={() => window.location.href="/signup"}>
                Unirme a EasyPy
              </button>
            </div>
            <div className={`fade-up d2 ${aboutVisible ? "visible" : ""}`} style={{ flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, background: "#e5e7eb", borderRadius: 20, overflow: "hidden" }}>
                {stats.map((s, i) => (
                  <div key={i} className="stat-item" style={{ background: i % 2 === 0 ? "#f0f7ff" : "white" }}>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 800, color: BRAND, marginBottom: 6 }}>{s.value}</div>
                    <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={ctaRef} style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #0284c7 100%)`, padding: "96px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, background: "rgba(255,255,255,0.06)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 200, height: 200, background: "rgba(255,255,255,0.06)", borderRadius: "50%" }} />
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div className={`fade-up ${ctaVisible ? "visible" : ""}`}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: "white", marginBottom: 20, lineHeight: 1.15 }}>
              Empezá a vender hoy.<br />Sin stock. Sin excusas.
            </h2>
            <span style={{ fontSize: 18, color: "rgba(255,255,255,0.85)", marginBottom: 40, lineHeight: 1.6 }}>
              Registrate gratis, elegí productos del catálogo y empezá a generar ingresos desde el primer día.
            </span>
            <div className="cta-btns" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: "20px"}}>
              <button onClick={() => window.location.href="/signup"}
                style={{ background: "white", color: BRAND, border: "none", borderRadius: 12, padding: "15px 36px", fontSize: 16, fontWeight: 800, cursor: "pointer", transition: "all 0.2s", fontFamily: "'Inter', sans-serif" }}
                onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 28px rgba(0,0,0,0.2)"; }}
                onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "none"; }}>
                Crear cuenta gratis
              </button>
              <button onClick={() => window.location.href="/login"}
                style={{ background: "transparent", color: "white", border: "2px solid rgba(255,255,255,0.5)", borderRadius: 12, padding: "15px 28px", fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", fontFamily: "'Inter', sans-serif" }}
                onMouseEnter={e => { e.target.style.borderColor = "white"; e.target.style.background = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.5)"; e.target.style.background = "transparent"; }}>
                Ya tengo cuenta
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0f172a", color: "#94a3b8", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <img src="/full-logo.png" alt="EasyPy" style={{ height: 32, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
          </div>
          <span style={{ fontSize: 14 }}>© 2026 EasyPy. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  );
}