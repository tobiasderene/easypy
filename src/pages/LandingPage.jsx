import React, { useState, useEffect, useRef } from "react";
import "../styles/landingpage.css";

const useVisible = (threshold = 0.15) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVisible(true);
    }, { threshold });

    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return [ref, visible];
};

const BRAND = "#056EB7";

const BenefitIcons = [
  "📦",
  "🚚",
  "📊",
  "📈",
  "🔐",
  "⚡"
];

const benefits = [
  { title: "Sin Stock Propio", desc: "Vendé sin inventario. El proveedor se encarga." },
  { title: "Logística Integrada", desc: "Envíos automáticos con múltiples transportadoras." },
  { title: "Ganancias Claras", desc: "Visualizá tu margen en tiempo real." },
  { title: "Analytics", desc: "Datos de ventas y rendimiento centralizados." },
  { title: "Pagos Seguros", desc: "Wallet con control total de tus ingresos." },
  { title: "Alta Rápida", desc: "Empezá a vender en minutos." },
];

const products = [
  {
    name: "Apple Watch Series 9",
    price: "Gs. 87.000",
    suggested: "Gs. 219.000",
    category: "Electrónica",
    img: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600"
  },
  {
    name: "Maleta Cabina",
    price: "Gs. 145.000",
    suggested: "Gs. 350.000",
    category: "Equipaje",
    img: "https://images.unsplash.com/photo-1581553680321-4fffae59fccd?w=600"
  },
  {
    name: "Skincare Vitamina C",
    price: "Gs. 55.000",
    suggested: "Gs. 120.000",
    category: "Belleza",
    img: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600"
  }
];

export default function LandingPage() {
  const [heroRef, heroVisible] = useVisible();
  const [benefitsRef, benefitsVisible] = useVisible();
  const [productsRef, productsVisible] = useVisible();

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="lp">

      {/* HEADER */}
      <header className="lp-header">
        <div className="lp-container header-inner">
          <div className="logo">EasyPy</div>

          <nav className="nav">
            <button onClick={() => scrollTo("benefits")}>Beneficios</button>
            <button onClick={() => scrollTo("products")}>Productos</button>
          </nav>

          <button className="btn primary" onClick={() => window.location.href = "/login"}>
            Conectate
          </button>
        </div>
      </header>

      {/* HERO */}
      <section id="hero" ref={heroRef} className="hero section">
        <div className={`fade ${heroVisible ? "show" : ""}`}>
          <h1>
            Vendé sin stock<br />
            <span>Ganá en serio</span>
          </h1>

          <p>
            Plataforma de dropshipping con proveedores locales y logística integrada.
          </p>

          <div className="cta">
            <button className="btn primary" onClick={() => window.location.href = "/signup"}>
              Empezar gratis
            </button>
            <button className="btn outline" onClick={() => scrollTo("products")}>
              Ver productos
            </button>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" ref={benefitsRef} className="section white">
        <div className="lp-container">

          <h2 className={`fade ${benefitsVisible ? "show" : ""}`}>
            Todo lo que necesitás
          </h2>

          <div className="grid-3">
            {benefits.map((b, i) => (
              <div key={i} className="card">
                <div className="icon">{BenefitIcons[i]}</div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" ref={productsRef} className="section gray">
        <div className="lp-container">

          <h2 className={`fade ${productsVisible ? "show" : ""}`}>
            Productos listos para vender
          </h2>

          <div className="grid-3">
            {products.map((p, i) => (
              <div key={i} className="product">
                <img
                  src={p.img}
                  alt={p.name}
                  loading="lazy"
                  onError={(e) => e.target.src = "/placeholder.jpg"}
                />
                <div className="product-body">
                  <span>{p.category}</span>
                  <h3>{p.name}</h3>
                  <div className="prices">
                    <div>{p.price}</div>
                    <small>{p.suggested}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-section">
        <h2>Empezá hoy mismo</h2>
        <div className="cta">
          <button className="btn white" onClick={() => window.location.href = "/signup"}>
            Crear cuenta
          </button>
          <button className="btn outline-white" onClick={() => window.location.href = "/login"}>
            Login
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        © 2026 EasyPy
      </footer>

    </div>
  );
}