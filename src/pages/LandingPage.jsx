import React, { useState, useEffect, useRef } from "react";
import "../styles/landingpage.css";

const useVisible = (threshold = 0.15) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
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
  { title: "Sin Stock Propio",         desc: "Vendé productos sin necesidad de tener inventario. El proveedor se encarga de todo." },
  { title: "Logística Integrada",      desc: "Fixy, Legex y más transportadoras disponibles. Tu pedido sale sin que muevas un dedo." },
  { title: "Analytics en Tiempo Real", desc: "Seguí tus ventas, unidades y rentabilidad desde un panel centralizado." },
];

const stats = [
  { value: "500+", label: "Productos disponibles" },
  { value: "3",    label: "Logísticas integradas" },
  { value: "100%", label: "Digital y sin stock"   },
  { value: "24h",  label: "Soporte al vendedor"   },
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

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="lp-root">

      {/* HEADER */}
      <header className={`lp-header ${scrolled ? "scrolled" : ""}`}>
        <div className="lp-header-inner">
          <div className="lp-logo" onClick={() => scrollTo("hero")}>
            <img src="/full-logo.png" alt="EasyPy" />
          </div>
          <nav className="lp-nav">
            <button className="nav-link" onClick={() => scrollTo("benefits")}>Beneficios</button>
            <button className="nav-link" onClick={() => scrollTo("about")}>Nosotros</button>
          </nav>
          <button className="btn-primary btn-sm" onClick={() => window.location.href="/login"}>
            Conectate
          </button>
        </div>
      </header>

      {/* HERO */}
      <section id="hero" className="lp-hero" ref={heroRef}>
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="lp-container">
          <div className="hero-grid">
            <div className="hero-left">
              <h1 className={`hero-title fade-up d1 ${heroVisible ? "visible" : ""}`}>
                Vendé sin stock.<br /><span>Ganá en serio.</span>
              </h1>
              <p className={`hero-sub fade-up d2 ${heroVisible ? "visible" : ""}`}>
                EasyPy conecta vendedores con proveedores locales. Sin inventario, sin complicaciones. Solo ventas.
              </p>
              <div className={`hero-cta fade-up d3 ${heroVisible ? "visible" : ""}`}>
                <button className="btn-primary btn-lg" onClick={() => window.location.href="/login"}>
                  Empezar gratis
                </button>
              </div>
              <div className={`hero-stats fade-up d4 ${heroVisible ? "visible" : ""}`}>
                {[["500+","Productos"],["3+","Logísticas"]].map(([val, label]) => (
                  <div key={label} className="hero-stat">
                    <span className="hero-stat-val">{val}</span>
                    <span className="hero-stat-lbl">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`hero-right fade-up d2 ${heroVisible ? "visible" : ""}`}>
              <div className="hero-float">
                <div className="hero-card">
                  <div className="hero-card-img">
                    <img src="/smartwatch.jpeg" alt="Smart Watch Pro" />
                  </div>
                  <div className="hero-card-body">
                    <span className="hero-card-cat">Electrónica</span>
                    <h3 className="hero-card-name">Smart Watch Pro</h3>
                    <p className="hero-card-label">Precio de compra</p>
                    <p className="hero-card-price">Gs. 800.000</p>
                    <p className="hero-card-suggested">Venta sugerida: Gs. 1.200.000</p>
                  </div>
                </div>
                <div className="hero-badge-gain">+Gs. 400k ganancia</div>
                <div className="hero-badge-ship">Envío en 24hs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="lp-benefits" ref={benefitsRef}>
        <div className="lp-benefits-inner">
          <div className={`benefits-header fade-up ${benefitsVisible ? "visible" : ""}`}>
            <h2 className="benefits-title">Todo lo que necesitás<br />para empezar a vender</h2>
            <p className="benefits-sub">Una plataforma completa diseñada para vendedores que quieren crecer sin complicaciones.</p>
          </div>
          <div className="benefits-grid">
            {benefits.map((b, i) => (
              <div key={i} className={`benefit-card fade-up d${Math.min(i+1,6)} ${benefitsVisible ? "visible" : ""}`}>
                <div className="benefit-icon">{BenefitIcons[i]}</div>
                <h3 className="benefit-title">{b.title}</h3>
                <p className="benefit-desc">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="lp-about" ref={aboutRef}>
        <div className="lp-container">
          <div className="about-grid">
            <div className={`about-left fade-up ${aboutVisible ? "visible" : ""}`}>
              <h2 className="about-title">Nació en Paraguay<br />para Paraguay</h2>
              <p className="about-text">EasyPy es una plataforma local que conecta proveedores con vendedores de todo el país. Creemos que cualquier persona puede construir un negocio online sin necesidad de capital para stock.</p>
              <p className="about-text">Integramos logísticas reales, procesamos pagos con recaudo o sin recaudo, y te damos las herramientas para escalar tu negocio con datos claros.</p>
              <button className="btn-primary btn-md" onClick={() => window.location.href="/login"}>
                Unirme a EasyPy
              </button>
            </div>
            <div className={`about-right fade-up d2 ${aboutVisible ? "visible" : ""}`}>
              <div className="stats-grid-2x2">
                {stats.map((s, i) => (
                  <div key={i} className={`stat-item ${i % 2 === 0 ? "stat-item-alt" : ""}`}>
                    <div className="stat-val">{s.value}</div>
                    <div className="stat-lbl">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta" ref={ctaRef}>
        <div className="cta-blob cta-blob-1" />
        <div className="cta-blob cta-blob-2" />
        <div className="cta-inner">
          <div className={`fade-up ${ctaVisible ? "visible" : ""}`}>
            <h2 className="cta-title">Empezá a vender hoy.<br />Sin stock. Sin excusas.</h2>
            <p className="cta-sub">Registrate gratis, elegí productos del catálogo y empezá a generar ingresos desde el primer día.</p>
            <div className="cta-btns">
              <button className="cta-btn-white" onClick={() => window.location.href="/login"}>Crear cuenta gratis</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <img src="/full-logo.png" alt="EasyPy" />
          <p>© 2026 EasyPy. Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  );
}
