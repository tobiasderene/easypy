// OrderForm.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../App';
import { getLogistics, createOrder, getProducts, getProductImages, searchCustomers, createCustomer, updateCustomer, getLogisticsQuote, getLogisticsZones, getCities } from '../services/api';
import '../styles/orderform.css';

const COUNTRY_CODES = [
  { code: '+595', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+57',  flag: '🇨🇴', name: 'Colombia' },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '+52',  flag: '🇲🇽', name: 'México' },
  { code: '+51',  flag: '🇵🇪', name: 'Perú' },
  { code: '+56',  flag: '🇨🇱', name: 'Chile' },
  { code: '+58',  flag: '🇻🇪', name: 'Venezuela' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+598', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia' },
];

const PLATFORM_COMMISSION = 0.05;
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

let mapsScriptLoaded = false;
function loadMapsScript() {
  if (mapsScriptLoaded || window.google?.maps) { mapsScriptLoaded = true; return Promise.resolve(); }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}`;
    script.async = true;
    script.onload  = () => { mapsScriptLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ── Formateadores de documento ────────────────────────────────────────────────
const formatRUC = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 1) return digits;
  return digits.slice(0, -1) + '-' + digits.slice(-1);
};

const formatCedula = (value) => value.replace(/\D/g, '').slice(0, 8);

const OrderForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const { initialItem, supplierId, supplierCity: supplierCityFromState } = location.state || {};

  const [items, setItems]                       = useState(initialItem ? [initialItem] : []);
  const [salePrices, setSalePrices]             = useState(initialItem ? { [initialItem.id]: '' } : {});
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [loadingProducts, setLoadingProducts]   = useState(false);
  const [showProductList, setShowProductList]   = useState(false);
  const [logistics, setLogistics]               = useState([]);
  const [loadingLogistics, setLoadingLogistics] = useState(true);
  const [submitting, setSubmitting]             = useState(false);
  const [quote, setQuote]                       = useState(null);
  const [zones, setZones]                         = useState([]);
  const [allZones, setAllZones]                   = useState({});  // { logistic_id: [zones] }
  const [cities, setCities]                       = useState([]);
  const [logisticPrices, setLogisticPrices]       = useState({});  // { logistic_id: price | null }
  const [quoting, setQuoting]                   = useState(false);
  const [fixySuggestions, setFixySuggestions]   = useState([]);
  const [fixyCp, setFixyCp]                     = useState(null);
  const [showFixySug, setShowFixySug]           = useState(false);
  const [otraCiudad, setOtraCiudad]             = useState(false);
  const fixyInputRef                            = useRef(null);
  const [submitError, setSubmitError]           = useState('');
  const [showConfirm, setShowConfirm]           = useState(false);

  // ── Mapa ──────────────────────────────────────────────────────────────────
  const [showMap, setShowMap]     = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError]   = useState('');
  const [coords, setCoords]       = useState(null);
  const mapRef                    = useRef(null);
  const mapInstanceRef            = useRef(null);
  const markerRef                 = useRef(null);
  const mapWrapRef                = useRef(null);

  // ── Autocompletado clientes ───────────────────────────────────────────────
  const [suggestions, setSuggestions]               = useState([]);
  const [showSuggestions, setShowSuggestions]       = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const searchTimeoutRef                            = useRef(null);
  const autocompleteRef                             = useRef(null);

  const [form, setForm] = useState({
    firstName: '', lastName: '', countryCode: '+595', phone: '',
    city: '', region: '', address: '', addressComplement: '',
    email: '', docType: '', docNumber: '',
    collectionType: 'con_recaudo', logisticsId: null,
  });
  const [errors, setErrors] = useState({});

  const [supplierCity, setSupplierCity] = useState(supplierCityFromState || '');
  console.log('[OrderForm] supplierCityFromState:', supplierCityFromState, '| supplierId:', supplierId);

  useEffect(() => {
    getCities().then(data => setCities(data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    getLogistics()
      .then(async data => {
        setLogistics(data || []);
        // Pre-cargar zonas de todas las logísticas manuales
        const manualOnes = (data || []).filter(l => l.api_type === 'manual');
        const zoneMap = {};
        await Promise.all(manualOnes.map(async l => {
          try {
            const z = await getLogisticsZones(l.logistic_id);
            if (z && z.length > 0) zoneMap[l.logistic_id] = z;
          } catch {}
        }));
        setAllZones(zoneMap);
      })
      .catch(() => setLogistics([]))
      .finally(() => setLoadingLogistics(false));
  }, []);

  // ── Calcular precios de todas las logísticas cuando cambia la ciudad ────────
  useEffect(() => {
    if (!form.city) { setLogisticPrices({}); return; }
    const normalize = s => (s || '').toLowerCase().trim();
    const prices = {};

    logistics.forEach(l => {
      if (l.api_type === 'manual') {
        const lZones = allZones[l.logistic_id] || [];
        if (lZones.length === 0) { prices[l.logistic_id] = null; return; }

        const recipientZone = lZones.find(z => normalize(z.city) === normalize(form.city));
        const supplierZone  = lZones.find(z => normalize(z.city) === normalize(supplierCity));

        // Proveedor debe estar en cobertura
        // Si no tiene ciudad configurada, bloquear
        if (!supplierCity) { prices[l.logistic_id] = 'unavailable'; return; }
        if (!supplierZone) { prices[l.logistic_id] = 'unavailable'; return; }
        // Destinatario debe estar en cobertura
        if (!recipientZone) { prices[l.logistic_id] = 'unavailable'; return; }

        // Precio = max de ambos
        const rPrice = parseFloat(recipientZone.price);
        const sPrice = supplierZone ? parseFloat(supplierZone.price) : 0;
        prices[l.logistic_id] = Math.max(rPrice, sPrice);
      } else if (l.api_type === 'fixy') {
        // Fixy — usar cotización disponible o marcar como cotizando
        if (quoting) {
          prices[l.logistic_id] = 'quoting';
        } else if (quote && !quote.error && quote.total) {
          prices[l.logistic_id] = quote.total;
        } else if (quote === null && fixyCp) {
          prices[l.logistic_id] = 'unavailable';
        } else {
          prices[l.logistic_id] = null;
        }
      }
    });

    setLogisticPrices(prices);
  }, [form.city, supplierCity, allZones, logistics, quote, quoting, fixyCp]);

  // ── Cargar zonas cuando cambia logística ─────────────────────────────────
  useEffect(() => {
    const selectedLogistic = logistics.find(l => l.logistic_id === form.logisticsId);
    if (!selectedLogistic || selectedLogistic.api_type !== 'manual') {
      setZones([]);
      return;
    }
    getLogisticsZones(form.logisticsId)
      .then(z => setZones(z || []))
      .catch(() => setZones([]));
  }, [form.logisticsId]);

  // ── Auto-cotizar Fixy cuando cambia ciudad o logística ───────────────────
  useEffect(() => {
    if (!fixyCp) { setQuote(null); return; }

    // Buscar logística Fixy disponible
    const fixyLogistic = logistics.find(l => l.api_type === 'fixy');
    if (!fixyLogistic) { setQuote(null); return; }

    const totalBultos = items.reduce((s, i) => s + i.quantity, 0) || 1;
    setQuoting(true);
    setQuote(null);
    getLogisticsQuote(fixyLogistic.logistic_id, totalBultos, 1.0, fixyCp)
      .then(result => setQuote(result))
      .catch(() => setQuote(null))
      .finally(() => setQuoting(false));
  }, [fixyCp, logistics]);

  useEffect(() => {
    if (!supplierId) return;
    setLoadingProducts(true);
    getProducts()
      .then(async (data) => {
        const fromSupplier = (data || []).filter(p => p.user_id === supplierId && p.product_status === 'active');
        const withImages = await Promise.all(
          fromSupplier.map(async (p) => {
            try {
              const imgs    = await getProductImages(p.product_id);
              const primary = imgs.find(i => i.is_primary) || imgs[0];
              return { id: p.product_id, name: p.product_name, price: parseFloat(p.product_base_cost), image: primary?.image_url || null };
            } catch {
              return { id: p.product_id, name: p.product_name, price: parseFloat(p.product_base_cost), image: null };
            }
          })
        );
        setSupplierProducts(withImages);
      })
      .catch(() => setSupplierProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [supplierId]);

  // Cerrar sugerencias al click afuera
  useEffect(() => {
    const handler = (e) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Helper Fixy ───────────────────────────────────────────────────────────
  const isFixyLogistics = () => {
    if (!form.logisticsId) return false;
    const l = logistics.find(x => x.logistic_id === form.logisticsId);
    return l?.api_type === 'fixy';
  };

  const handleCityInput = (value) => {
    handleChange('city', value);
    if (isFixyLogistics() && value.length >= 2) {
      const results = buscarLocalidad(value);
      setFixySuggestions(results);
      setShowFixySug(results.length > 0);
    } else {
      setFixySuggestions([]);
      setShowFixySug(false);
    }
    // No resetear fixyCp aquí — solo se resetea al cambiar la ciudad en el select
  };

  const selectFixyLocalidad = (loc) => {
    handleChange('city', loc.localidad);
    handleChange('region', loc.provincia);
    setFixyCp(loc.cp);
    setQuote(null);
  };

  // ── Búsqueda autocompletado ───────────────────────────────────────────────
  const triggerSearch = (query) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (query.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchCustomers(query);
        setSuggestions(results || []);
        setShowSuggestions((results || []).length > 0);
      } catch { setSuggestions([]); }
    }, 300);
  };

  const handleFirstName = (value) => {
    setForm(prev => ({ ...prev, firstName: value }));
    if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }));
    setSelectedCustomerId(null);
    triggerSearch(`${value} ${form.lastName}`.trim() || value);
  };

  const handleLastName = (value) => {
    setForm(prev => ({ ...prev, lastName: value }));
    if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }));
    setSelectedCustomerId(null);
    triggerSearch(`${form.firstName} ${value}`.trim() || value);
  };

  const handlePhoneInput = (value) => {
    const clean = value.replace(/\D/g, '');
    setForm(prev => ({ ...prev, phone: clean }));
    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
    setSelectedCustomerId(null);
    triggerSearch(clean);
  };

  const fillFromCustomer = (customer) => {
    setForm(prev => ({
      ...prev,
      firstName:         customer.first_name,
      lastName:          customer.last_name,
      countryCode:       customer.phone_code || '+595',
      phone:             customer.phone,
      email:             customer.email        || '',
      city:              customer.city         || '',
      region:            customer.region       || '',
      address:           customer.address      || '',
      addressComplement: customer.address_complement || '',
      docType:           customer.doc_type     || '',
      docNumber:         customer.doc_number   || '',
    }));
    setSelectedCustomerId(customer.customer_id);
    setSuggestions([]);
    setShowSuggestions(false);
    setShowMap(false);
    setCoords(null);
    mapInstanceRef.current = null;
    markerRef.current = null;

    // Actualizar fixyCp con la ciudad del cliente para que cotice Fixy
    if (customer.city) {
      const loc = cities.find(c => c.name.toLowerCase() === customer.city.toLowerCase());
      if (loc?.cp) setFixyCp(loc.cp);
      else setFixyCp(null);
    } else {
      setFixyCp(null);
    }
    setQuote(null);
  };

  // ── Mapa ──────────────────────────────────────────────────────────────────
  const initMap = useCallback((lat, lng) => {
    if (!mapRef.current || !window.google?.maps) return;
    const center = { lat, lng };
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center, zoom: 16,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
      });
    } else {
      mapInstanceRef.current.setCenter(center);
    }
    if (markerRef.current) {
      markerRef.current.setPosition(center);
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: center, map: mapInstanceRef.current,
        draggable: true, title: 'Arrastrá para ajustar la ubicación',
      });
      markerRef.current.addListener('dragend', (e) => {
        setCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
    }
    setCoords({ lat, lng });
  }, []);

  const handleVerMap = async () => {
    if (!form.address.trim() || !form.city.trim()) {
      setGeoError('Ingresá al menos la dirección y la ciudad para ver el mapa');
      return;
    }
    setGeoError('');
    setGeocoding(true);
    try {
      await loadMapsScript();
      const address = [form.address, form.city, form.region, 'Paraguay'].filter(Boolean).join(', ');
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          setShowMap(true);
          setTimeout(() => {
            initMap(loc.lat(), loc.lng());
            if (mapWrapRef.current) mapWrapRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            if (errors.map) setErrors(prev => ({ ...prev, map: '' }));
          }, 150);
        } else {
          setGeoError('No se encontró la dirección. Intentá con más detalle.');
        }
        setGeocoding(false);
      });
    } catch {
      setGeoError('Error al cargar el mapa. Verificá tu conexión.');
      setGeocoding(false);
    }
  };

  // ── Documento ─────────────────────────────────────────────────────────────
  const handleDocType = (value) => {
    setForm(prev => ({ ...prev, docType: value, docNumber: '' }));
  };

  const handleDocNumber = (value) => {
    let formatted = value;
    if (form.docType === 'ruc')    formatted = formatRUC(value);
    if (form.docType === 'cedula') formatted = formatCedula(value);
    setForm(prev => ({ ...prev, docNumber: formatted }));
  };

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const getSalePrice      = (id) => parseFloat(salePrices[id]) || 0;
  const totalSupplierCost = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalRecaudo      = items.reduce((s, i) => s + getSalePrice(i.id) * i.quantity, 0);
  // Precio de zona manual — bidireccional, se toma el más lejano (mayor precio)
  const zonePrice = (() => {
    if (zones.length === 0) return 0;
    const normalize = s => (s || '').toLowerCase().trim();
    const recipientZone = zones.find(z => normalize(z.city) === normalize(form.city));
    const supplierZone  = zones.find(z => normalize(z.city) === normalize(supplierCity));
    const rPrice = recipientZone ? parseFloat(recipientZone.price) : 0;
    const sPrice = supplierZone  ? parseFloat(supplierZone.price)  : 0;
    return Math.max(rPrice, sPrice);
  })();
  const rawShipping = (quote && !quote.error && quote.total)
    ? quote.total
    : zonePrice;
  const commission        = rawShipping * 0.25;                          // 25% sobre envío
  const logisticCost      = rawShipping + commission;                    // lo que ve el vendedor (envío + comisión sumados)
  const earnings          = totalRecaudo - totalSupplierCost - logisticCost;

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(v);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (['address', 'city', 'region'].includes(field)) {
      setShowMap(false);
      setCoords(null);
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
  };

  const setSalePrice = (id, value) => {
    setSalePrices(prev => ({ ...prev, [id]: value }));
    if (errors[`price_${id}`]) setErrors(prev => ({ ...prev, [`price_${id}`]: '' }));
  };

  const addItem = (product) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
    setSalePrices(prev => ({ ...prev, [product.id]: prev[product.id] || '' }));
    setShowProductList(false);
  };

  const updateQty  = (id, qty) => { if (qty < 1) return; setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i)); };
  const removeItem = (id) => { setItems(prev => prev.filter(i => i.id !== id)); setSalePrices(prev => { const n = { ...prev }; delete n[id]; return n; }); };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName   = 'Requerido';
    if (!form.lastName.trim())  e.lastName    = 'Requerido';
    if (!form.phone.trim())     e.phone       = 'Requerido';
    if (!form.city.trim())      e.city        = 'Requerido';
    if (!form.region.trim())    e.region      = 'Requerido';
    if (!form.address.trim())   e.address     = 'Requerido';
    // email opcional
    if (!form.logisticsId)      e.logisticsId = 'Seleccioná una transportadora';
    if (!coords)                e.map         = 'Confirmá la ubicación en el mapa antes de enviar la orden';
    items.forEach(item => {
      if (!getSalePrice(item.id) || getSalePrice(item.id) <= 0)
        e[`price_${item.id}`] = 'Requerido';
    });
    return e;
  };

  // ── Guardar cliente en agenda ─────────────────────────────────────────────
  const saveCustomerToAgenda = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) return;
    const data = {
      buyer_id:           user.user_id,
      first_name:         form.firstName,
      last_name:          form.lastName,
      phone:              form.phone,
      phone_code:         form.countryCode,
      email:              form.email        || null,
      city:               form.city         || null,
      region:             form.region       || null,
      address:            form.address      || null,
      address_complement: form.addressComplement || null,
      doc_type:           form.docType      || null,
      doc_number:         form.docNumber    || null,
    };
    try {
      if (selectedCustomerId) await updateCustomer(selectedCustomerId, data);
      else                    await createCustomer(data);
    } catch {} // No bloquear la orden si falla
  };

  const handleSubmit = async () => {
    setSubmitError('');
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.map) {
        setTimeout(() => mapWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      }
      return;
    }
    if (items.length === 0) { setSubmitError('Agregá al menos un producto'); return; }
    if (earnings < 0) { setErrors(prev => ({ ...prev, general: 'La utilidad no puede ser negativa. Subí el precio de venta.' })); return; }
    if (!form.logisticsId) { setErrors(prev => ({ ...prev, logisticsId: 'Seleccioná una transportadora' })); return; }
    if (logisticCost <= 0) { setErrors(prev => ({ ...prev, logisticsId: 'La logística seleccionada no tiene costo configurado para esta ciudad' })); return; }
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);

    const payload = {
      buyer_id:      user.user_id,
      supplier_id:   supplierId,
      logistic_id:   form.logisticsId,
      final_price:   totalRecaudo,
      logistic_cost: rawShipping,
      platform_fee:  commission,
      buyer_profit:  earnings,
      status:        'pending',
      collection_type:              form.collectionType,
      recipient_name:               `${form.firstName} ${form.lastName}`.trim(),
      recipient_phone:              `${form.countryCode}${form.phone}`,
      recipient_email:              form.email,
      recipient_city:               form.city,
      recipient_region:             form.region,
      recipient_address:            form.address,
      recipient_address_complement: form.addressComplement || null,
      recipient_lat:                coords.lat,
      recipient_lng:                coords.lng,
      items: items.map(item => ({
        product_id:    item.id,
        quantity:      item.quantity,
        supplier_cost: item.price,
      })),
    };

    setSubmitting(true);
    try {
      await Promise.all([createOrder(payload), saveCustomerToAgenda()]);
      navigate('/catalogo', { replace: true });
    } catch (err) {
      setSubmitError(err.message?.includes('Saldo insuficiente')
        ? err.message
        : err.message || 'Ocurrió un error al crear la orden'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Modal de confirmación ────────────────────────────────────────────────
  const ConfirmModal = () => {
    const selectedLogistic = logistics.find(l => l.logistic_id === form.logisticsId);
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '44px', height: '44px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" fill="none" stroke="#056EB7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>Confirmar orden</h3>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Revisá el resumen antes de enviar</p>
            </div>
          </div>

          <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#6b7280' }}>Destinatario</span>
              <span style={{ fontWeight: '600', color: '#111827' }}>{form.firstName} {form.lastName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#6b7280' }}>Ciudad</span>
              <span style={{ fontWeight: '600', color: '#111827' }}>{form.city}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#6b7280' }}>Logística</span>
              <span style={{ fontWeight: '600', color: '#111827' }}>{selectedLogistic?.name || '—'}</span>
            </div>
            <div style={{ height: '1px', background: '#e5e7eb', margin: '2px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#6b7280' }}>Total a recaudar</span>
              <span style={{ fontWeight: '700', color: '#16a34a' }}>{formatCurrency(totalRecaudo)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#6b7280' }}>Costo de envío</span>
              <span style={{ fontWeight: '600', color: '#ef4444' }}>- {formatCurrency(logisticCost)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingTop: '4px' }}>
              <span style={{ fontWeight: '700', color: '#111827' }}>Ganancia estimada</span>
              <span style={{ fontWeight: '800', color: earnings >= 0 ? '#16a34a' : '#ef4444' }}>{formatCurrency(earnings)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowConfirm(false)}
              style={{ flex: 1, padding: '10px', border: '1.5px solid #e5e7eb', borderRadius: '9px', background: 'white', color: '#6b7280', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
            >
              Revisar
            </button>
            <button
              onClick={handleConfirmSubmit}
              disabled={submitting}
              style={{ flex: 2, padding: '10px', border: 'none', borderRadius: '9px', background: 'linear-gradient(135deg, #056EB7, #044f85)', color: 'white', fontWeight: '800', fontSize: '13px', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Enviando...' : 'Confirmar y enviar orden'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!supplierId) {
    return (
      <div className="of-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <p style={{ color: '#6b7280' }}>No hay producto seleccionado.</p>
          <button style={{ padding: '8px 20px', background: '#056EB7', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            onClick={() => navigate('/catalogo')}>
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="of-page">
      {showConfirm && <ConfirmModal />}
      <div className="of-card">
        <div className="of-columns">

          {/* ══ COL 1 — Cliente ══ */}
          <div className="of-col">
            <div className="of-section-head">
              <span className="of-num">1</span>
              <div>
                <p className="of-col-title">Datos del Cliente</p>
                <p className="of-col-sub">Información de entrega</p>
              </div>
            </div>

            {/* ── Nombre + apellido con autocompletado ── */}
            <div ref={autocompleteRef} style={{ position: 'relative' }}>
              <div className="of-row2">
                <div className="of-field">
                  <label className="of-label">Nombre <span className="of-req">*</span></label>
                  <input
                    className={`of-input ${errors.firstName ? 'err' : ''}`}
                    placeholder="Carlos"
                    value={form.firstName}
                    onChange={e => handleFirstName(e.target.value)}
                    autoComplete="off"
                  />
                  {errors.firstName && <span className="of-err">{errors.firstName}</span>}
                </div>
                <div className="of-field">
                  <label className="of-label">Apellido <span className="of-req">*</span></label>
                  <input
                    className={`of-input ${errors.lastName ? 'err' : ''}`}
                    placeholder="Ramírez"
                    value={form.lastName}
                    onChange={e => handleLastName(e.target.value)}
                    autoComplete="off"
                  />
                  {errors.lastName && <span className="of-err">{errors.lastName}</span>}
                </div>
              </div>

              {/* Dropdown de sugerencias */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="of-suggestions">
                  {suggestions.map(c => (
                    <div key={c.customer_id} className="of-suggestion-item" onMouseDown={() => fillFromCustomer(c)}>
                      <div className="of-sug-avatar">{c.first_name[0]}{c.last_name[0]}</div>
                      <div className="of-sug-info">
                        <span className="of-sug-name">{c.first_name} {c.last_name}</span>
                        <span className="of-sug-sub">{c.phone_code}{c.phone} · {c.city || '—'}</span>
                      </div>
                      {c.doc_number && (
                        <span className="of-sug-doc">{c.doc_type === 'ruc' ? 'RUC' : 'CI'} {c.doc_number}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Teléfono ── */}
            <div className="of-field">
              <label className="of-label">Teléfono <span className="of-req">*</span></label>
              <div className={`of-phone ${errors.phone ? 'err' : ''}`}>
                <select className="of-phone-code" value={form.countryCode} onChange={e => handleChange('countryCode', e.target.value)}>
                  {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
                <input
                  className="of-phone-num"
                  placeholder="0981 000 000"
                  value={form.phone}
                  onChange={e => handlePhoneInput(e.target.value)}
                  maxLength={10}
                  autoComplete="off"
                />
              </div>
              {errors.phone && <span className="of-err">{errors.phone}</span>}
            </div>

            {/* ── Documento ── */}
            <div className="of-row2">
              <div className="of-field">
                <label className="of-label">Tipo de documento</label>
                <select className="of-input" value={form.docType} onChange={e => handleDocType(e.target.value)} style={{ background: 'white' }}>
                  <option value="">Sin documento</option>
                  <option value="cedula">Cédula</option>
                  <option value="ruc">RUC</option>
                </select>
              </div>
              <div className="of-field">
                <label className="of-label">
                  {form.docType === 'ruc' ? 'RUC (con guión)' : form.docType === 'cedula' ? 'Número de cédula' : 'Número'}
                </label>
                <input
                  className="of-input"
                  placeholder={form.docType === 'ruc' ? 'XXXXXXXX-X' : form.docType === 'cedula' ? '12345678' : '—'}
                  value={form.docNumber}
                  onChange={e => handleDocNumber(e.target.value)}
                  disabled={!form.docType}
                />
              </div>
            </div>

            {/* ── Ciudad / Región ── */}
            <div className="of-row2">
              <div className="of-field">
                <label className="of-label">Ciudad <span className="of-req">*</span></label>
                <select
                  className={`of-input ${errors.city ? 'err' : ''}`}
                  style={{ background: 'white' }}
                  value={otraCiudad ? '__otro__' : form.city}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '__otro__') {
                      setOtraCiudad(true);
                      handleChange('city', '');
                      handleChange('region', '');
                      setFixyCp(null);
                      return;
                    }
                    setOtraCiudad(false);
                    const loc = cities.find(l => l.name === val);
                    if (loc) {
                      handleChange('city', loc.name);
                      handleChange('region', loc.department);
                      setFixyCp(loc.cp);
                      setQuote(null);
                      setLogisticPrices({});  // resetear precios al cambiar ciudad
                      handleChange('logisticsId', null);  // deseleccionar logística
                    } else {
                      handleChange('city', val);
                      setFixyCp(null);
                      setQuote(null);
                      setLogisticPrices({});
                      handleChange('logisticsId', null);
                    }
                  }}
                >
                  <option value="">Seleccioná una ciudad...</option>
                  {cities.map(loc => (
                    <option key={loc.city_id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                  <option value="__otro__">Otra ciudad</option>
                </select>

                {otraCiudad && (
                  <input
                    className={`of-input ${errors.city ? 'err' : ''}`}
                    placeholder="Escribí la ciudad"
                    value={form.city}
                    onChange={e => handleChange('city', e.target.value)}
                    style={{ marginTop: '6px' }}
                    autoFocus
                  />
                )}


                {errors.city && <span className="of-err">{errors.city}</span>}
              </div>
              <div className="of-field">
                <label className="of-label">Dpto / Región <span className="of-req">*</span></label>
                <input className={`of-input ${errors.region ? 'err' : ''}`} placeholder="Central" value={form.region} onChange={e => handleChange('region', e.target.value)} />
                {errors.region && <span className="of-err">{errors.region}</span>}
              </div>
            </div>

            {/* ── Dirección ── */}
            <div className="of-row2">
              <div className="of-field">
                <label className="of-label">Dirección <span className="of-req">*</span></label>
                <input className={`of-input ${errors.address ? 'err' : ''}`} placeholder="Av. España 1234" value={form.address} onChange={e => handleChange('address', e.target.value)} />
                {errors.address && <span className="of-err">{errors.address}</span>}
              </div>
              <div className="of-field">
                <label className="of-label">Complemento</label>
                <input className="of-input" placeholder="Apto, Torre..." value={form.addressComplement} onChange={e => handleChange('addressComplement', e.target.value)} />
              </div>
            </div>

            {/* ── Mapa obligatorio ── */}
            <div className="of-field">
              <button className={`of-map-btn ${coords ? 'confirmed' : ''}`} onClick={handleVerMap} disabled={geocoding} type="button">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {geocoding ? 'Buscando...' : coords ? '✓ Ubicación confirmada — actualizar' : 'Ver y confirmar en mapa *'}
              </button>
              {errors.map && <span className="of-err">{errors.map}</span>}
              {geoError  && <span className="of-err">{geoError}</span>}
              {coords && !errors.map && (
                <span style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px', display: 'block' }}>
                  Arrastrá el pin para ajustar la posición exacta
                </span>
              )}
            </div>

            {showMap && (
              <div ref={mapWrapRef} className="of-map-wrap">
                <div ref={mapRef} className="of-map-container" />
              </div>
            )}

            {/* ── Email ── */}
            <div className="of-field">
              <label className="of-label">Correo Electrónico <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 400 }}>(opcional)</span></label>
              <input className={`of-input ${errors.email ? 'err' : ''}`} type="email" placeholder="cliente@email.com" value={form.email} onChange={e => handleChange('email', e.target.value)} />
              {errors.email && <span className="of-err">{errors.email}</span>}
            </div>

            {/* ── Productos ── */}
            <div className="of-field">
              <label className="of-label">Productos</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map(item => (
                  <div key={item.id} style={{ border: '1.5px solid #e5e7eb', borderRadius: '9px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.image && <img src={item.image} alt={item.name} className="of-product-img" style={{ flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="of-product-name">{item.name}</span>
                        <span className="of-product-cost" style={{ display: 'block' }}>Costo: {formatCurrency(item.price)}</span>
                      </div>
                      <div className="of-qty" style={{ flexShrink: 0 }}>
                        <button className="of-qty-btn" onClick={() => updateQty(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                        <span className="of-qty-val">{item.quantity}</span>
                        <button className="of-qty-btn" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                      </div>
                      <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', fontSize: '16px', flexShrink: 0 }}>×</button>
                    </div>
                    <div>
                      <label className="of-label" style={{ marginBottom: '4px', display: 'block' }}>
                        Precio de venta <span className="of-req">*</span>
                      </label>
                      <div className={`of-price-wrap ${errors[`price_${item.id}`] ? 'err' : ''}`}>
                        <span className="of-price-sign">Gs.</span>
                        <input className="of-price-input" type="number" placeholder="0" min="0" value={salePrices[item.id] || ''} onChange={e => setSalePrice(item.id, e.target.value)} />
                      </div>
                      {errors[`price_${item.id}`] && <span className="of-err">{errors[`price_${item.id}`]}</span>}
                    </div>
                  </div>
                ))}
              </div>

              <button className="of-toggle-btn" style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }} onClick={() => setShowProductList(!showProductList)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                Agregar otro producto
              </button>

              {showProductList && (
                <div style={{ border: '1.5px solid #e5e7eb', borderRadius: '9px', overflow: 'hidden', marginTop: '6px' }}>
                  {loadingProducts ? (
                    <p style={{ padding: '12px', fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>Cargando productos...</p>
                  ) : supplierProducts.filter(p => !items.find(i => i.id === p.id)).length === 0 ? (
                    <p style={{ padding: '12px', fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>No hay otros productos disponibles</p>
                  ) : (
                    supplierProducts.filter(p => !items.find(i => i.id === p.id)).map(p => (
                      <div key={p.id} onClick={() => addItem(p)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', background: 'white', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        {p.image ? <img src={p.image} alt={p.name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#f3f4f6', flexShrink: 0 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                          <p style={{ fontSize: '12px', color: '#056EB7', fontWeight: '600' }}>{formatCurrency(p.price)}</p>
                        </div>
                        <svg width="16" height="16" fill="none" stroke="#056EB7" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" /></svg>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="of-divider" />

          {/* ══ COL 2 — Logística ══ */}
          <div className="of-col">
            <div className="of-section-head">
              <span className="of-num">2</span>
              <div>
                <p className="of-col-title">Servicio Logístico</p>
                <p className="of-col-sub">Tipo de envío y transportadora</p>
              </div>
            </div>

            <div className="of-field">
              <label className="of-label">Tipo de Servicio</label>
              <div className="of-toggle">
                <button className={`of-toggle-btn ${form.collectionType === 'con_recaudo' ? 'active' : ''}`} onClick={() => handleChange('collectionType', 'con_recaudo')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
                  Con Recaudo
                </button>
                <button className={`of-toggle-btn ${form.collectionType === 'sin_recaudo' ? 'active' : ''}`} onClick={() => handleChange('collectionType', 'sin_recaudo')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  Sin Recaudo
                </button>
              </div>
              <p className="of-hint">
                {form.collectionType === 'con_recaudo'
                  ? '✓ El cliente paga contra entrega. No necesitás saldo previo.'
                  : '✓ Ya cobraste del cliente. Se reservará el costo del proveedor de tu wallet.'}
              </p>
            </div>

            <div className="of-field">
              <label className="of-label">Transportadora <span className="of-req">*</span></label>
              {errors.logisticsId && <span className="of-err">{errors.logisticsId}</span>}
              {loadingLogistics ? (
                <p style={{ fontSize: '13px', color: '#9ca3af' }}>Cargando transportadoras...</p>
              ) : (
                <div className="of-logistics">
                  {logistics.map(l => {
                    const price      = logisticPrices[l.logistic_id];
                    const unavailable = price === 'unavailable';
                    const isQuoting   = price === 'quoting';
                    const hasPrice    = typeof price === 'number';
                    const disabled    = unavailable;

                    return (
                      <button key={l.logistic_id}
                        className={`of-logistics-opt ${form.logisticsId === l.logistic_id ? 'active' : ''}`}
                        disabled={disabled}
                        onClick={() => { if (disabled) return; handleChange('logisticsId', l.logistic_id); setQuote(null); setOtraCiudad(false); }}
                        style={disabled ? { opacity: 0.45, cursor: 'not-allowed', filter: 'grayscale(1)' } : {}}
                      >
                        <div className="of-logistics-info">
                          <span className="of-logistics-name">{l.name}</span>
                          {form.city && (
                            <span style={{ fontSize: '11px', fontWeight: '500', display: 'block', marginTop: '1px',
                              color: unavailable ? '#ef4444' : hasPrice ? '#6b7280' : '#9ca3af' }}>
                              {unavailable
                                ? 'No disponible'
                                : isQuoting
                                  ? 'Cotizando...'
                                  : hasPrice
                                    ? formatCurrency(price * 1.25)
                                    : '—'}
                            </span>
                          )}
                        </div>
                        <div className={`of-check ${form.logisticsId === l.logistic_id ? 'active' : ''}`}>
                          {form.logisticsId === l.logistic_id && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M20 6L9 17l-5-5" /></svg>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cotizando — indicador automático */}
            {quoting && (
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>Cotizando envío...</p>
            )}
          </div>

          <div className="of-divider" />

          {/* ══ COL 3 — Resumen ══ */}
          <div className="of-col of-col-summary">
            <div className="of-section-head">
              <span className="of-num">3</span>
              <div>
                <p className="of-col-title">Resumen de Orden</p>
                <p className="of-col-sub">Detalle financiero</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {items.map(item => {
                const sp = getSalePrice(item.id);
                return (
                  <div key={item.id} className="of-summary-product">
                    {item.image && <img src={item.image} alt={item.name} className="of-sum-img" />}
                    <div className="of-sum-product-info">
                      <span className="of-sum-name">{item.name}</span>
                      <span className="of-sum-qty">x{item.quantity} · Costo: {formatCurrency(item.price)}</span>
                    </div>
                    <span className="of-sum-price">{sp > 0 ? formatCurrency(sp * item.quantity) : '—'}</span>
                  </div>
                );
              })}
            </div>

            <div className="of-breakdown">
              <div className="of-brow">
                <span className="of-blabel">Total a recaudar</span>
                <span className="of-bval green">{totalRecaudo > 0 ? formatCurrency(totalRecaudo) : '—'}</span>
              </div>
              <div className="of-brow">
                <span className="of-blabel">Costo proveedor</span>
                <span className="of-bval red">- {formatCurrency(totalSupplierCost)}</span>
              </div>
              <div className="of-brow">
                <span className="of-blabel">Costo de envío</span>
                <span className="of-bval red">
                  {quoting
                    ? 'Calculando...'
                    : logisticCost > 0
                      ? `- ${formatCurrency(logisticCost)}`
                      : '—'}
                </span>
              </div>
              <div className="of-bdivider" />
              <div className="of-brow of-brow-earnings">
                <span className="of-blabel-earn">Tus Ganancias</span>
                <span className={`of-earn-val ${totalRecaudo > 0 ? (earnings >= 0 ? 'green' : 'red') : ''}`}>
                  {totalRecaudo > 0 ? formatCurrency(earnings) : '—'}
                </span>
              </div>
              {totalRecaudo > 0 && earnings < 0 && (
                <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>
                  ⚠️ Subí el precio de venta para cubrir los costos
                </div>
              )}
            </div>

            {submitError && (
              <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#dc2626' }}>
                {submitError}
              </div>
            )}

            <div className="of-actions">
              <button className="of-btn-cancel" onClick={() => navigate(-1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                Cancelar
              </button>
              <button className="of-btn-submit" onClick={handleSubmit}
                disabled={submitting || (totalRecaudo > 0 && earnings < 0) || (form.logisticsId && logisticCost <= 0)}
                title={earnings < 0 ? 'La utilidad no puede ser negativa' : logisticCost <= 0 && form.logisticsId ? 'Sin costo de envío configurado' : ''}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" /></svg>
                {submitting ? 'Enviando...' : 'Enviar Orden'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderForm;
