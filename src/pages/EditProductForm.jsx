import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Upload, DollarSign, Package, Tag, Grid, FileText, Lock, Search, UserCheck } from 'lucide-react';
import { getProduct, updateProduct, getProductImages, uploadProductImage, deleteImage,
         getProductAssignments, addProductAssignment, removeProductAssignment, toggleProductPrivate,
         getUsers } from '../services/api';
import '../styles/addproductform.css';

const EditProductForm = () => {
  const navigate          = useNavigate();
  const { id }            = useParams();
  const [loading, setLoading]           = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors]             = useState({});

  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', category: '',
    price: '', discount: '0', suggested_price: '', stock: '',
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages]           = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);

  // Exclusividad
  const [isPrivate, setIsPrivate]       = useState(false);
  const [assignments, setAssignments]   = useState([]); // sellers asignados
  const [allSellers, setAllSellers]     = useState([]); // todos los sellers
  const [sellerSearch, setSellerSearch] = useState('');
  const [addingId, setAddingId]         = useState(null);
  const [removingId, setRemovingId]     = useState(null);

  const categories = [
    { value: '', label: 'Selecciona una categoría' },
    { value: 'electronics', label: 'Electrónica' },
    { value: 'home', label: 'Hogar' },
    { value: 'office', label: 'Oficina' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'accessories', label: 'Accesorios' },
    { value: 'beauty', label: 'Belleza' },
    { value: 'clothing', label: 'Ropa' },
    { value: 'toys', label: 'Juguetes' },
  ];

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [product, images, assigns, sellers] = await Promise.all([
          getProduct(id),
          getProductImages(id),
          getProductAssignments(id).catch(() => []),
          getUsers({ role: 'seller' }).catch(() => []),
        ]);
        setFormData({
          name:            product.product_name        || '',
          sku:             product.product_sku         || '',
          description:     product.product_description || '',
          category:        product.product_category    || '',
          price:           String(product.product_base_cost || ''),
          discount:        String(product.product_discount  || '0'),
          suggested_price: product.suggested_price ? String(product.suggested_price) : '',
          stock:           String(product.stock_available ?? ''),
        });
        setIsPrivate(product.is_private || false);
        setAssignments(assigns || []);
        setAllSellers(sellers || []);
        const sorted = [...(images || [])].sort((a, b) => b.is_primary - a.is_primary);
        setExistingImages(sorted);
      } catch {
        setErrors({ submit: 'No se pudo cargar el producto.' });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    if (existingImages.length + newImages.length + files.length > 5) {
      setErrors(prev => ({ ...prev, images: 'Máximo 5 imágenes permitidas' }));
      return;
    }
    setErrors(prev => ({ ...prev, images: '' }));
    setNewImages(prev => [...prev, ...files.map(file => ({ file, preview: URL.createObjectURL(file) }))]);
  };

  const removeExistingImage = (imageId) => {
    setExistingImages(prev => prev.filter(img => img.image_id !== imageId));
    setDeletedImageIds(prev => [...prev, imageId]);
  };

  const removeNewImage = (index) => setNewImages(prev => prev.filter((_, i) => i !== index));

  // ── Exclusividad ──────────────────────────────────────────────────────────
  const handleTogglePrivate = async () => {
    try {
      const res = await toggleProductPrivate(id);
      setIsPrivate(res.is_private);
    } catch {
      alert('No se pudo cambiar la visibilidad del producto');
    }
  };

  const handleAddSeller = async (sellerId) => {
    setAddingId(sellerId);
    try {
      const assign = await addProductAssignment(id, sellerId);
      setAssignments(prev => [...prev, assign]);
    } catch {
      alert('No se pudo asignar el vendedor');
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveSeller = async (buyerId) => {
    setRemovingId(buyerId);
    try {
      await removeProductAssignment(id, buyerId);
      setAssignments(prev => prev.filter(a => a.buyer_id !== buyerId));
    } catch {
      alert('No se pudo remover el vendedor');
    } finally {
      setRemovingId(null);
    }
  };

  const assignedIds     = new Set(assignments.map(a => a.buyer_id));
  const filteredSellers = allSellers.filter(s =>
    !assignedIds.has(s.user_id) &&
    (s.user_nickname || '').toLowerCase().includes(sellerSearch.toLowerCase())
  );

  // ── Validación y submit ───────────────────────────────────────────────────
  const validateForm = () => {
    const e = {};
    if (!formData.name.trim() || formData.name.trim().length < 5)
      e.name = 'El nombre debe tener al menos 5 caracteres';
    if (!formData.sku.trim())     e.sku = 'El SKU es requerido';
    if (!formData.description.trim() || formData.description.trim().length < 20)
      e.description = 'La descripción debe tener al menos 20 caracteres';
    if (!formData.category)       e.category = 'Selecciona una categoría';
    if (!formData.price || parseFloat(formData.price) <= 0)
      e.price = 'El precio debe ser mayor a 0';
    if (existingImages.length + newImages.length === 0)
      e.images = 'Agrega al menos una imagen';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setIsSubmitting(true);
    try {
      await updateProduct(id, {
        product_name:        formData.name,
        product_sku:         formData.sku,
        product_description: formData.description,
        product_category:    formData.category,
        product_base_cost:   parseFloat(formData.price),
        product_discount:    parseFloat(formData.discount) || 0,
        suggested_price:     formData.suggested_price ? parseFloat(formData.suggested_price) : null,
        stock_available:     formData.stock !== '' ? parseInt(formData.stock) : undefined,
      });
      await Promise.all(deletedImageIds.map(imgId => deleteImage(imgId)));
      const isPrimaryTaken = existingImages.some(img => img.is_primary);
      await Promise.all(
        newImages.map((img, index) =>
          uploadProductImage(id, img.file, !isPrimaryTaken && index === 0, existingImages.length + index)
        )
      );
      navigate('/provider-catalog');
    } catch (err) {
      setErrors({ submit: err.message || 'Error al guardar los cambios.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('¿Descartás los cambios?')) navigate('/provider-catalog');
  };

  if (loading) return (
    <div className="add-product-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ color: '#9ca3af' }}>Cargando producto...</p>
    </div>
  );

  const totalImages = existingImages.length + newImages.length;

  return (
    <div className="add-product-page">
      <div className="add-product-container">

        <div className="add-product-header">
          <div className="header-left">
            <Package size={32} />
            <div>
              <h1>Editar Producto</h1>
              <p>Modificá la información de tu producto</p>
            </div>
          </div>
          <button className="btn-close-form" onClick={handleCancel} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">

          {/* Imágenes */}
          <div className="form-section">
            <h2 className="section-title"><Upload size={20} />Imágenes del Producto</h2>
            <div className="image-upload-area">
              {existingImages.map((img, index) => (
                <div key={img.image_id} className="image-preview">
                  <img src={img.image_url} alt={`Imagen ${index + 1}`} />
                  <button type="button" className="btn-remove-image" onClick={() => removeExistingImage(img.image_id)}><X size={16} /></button>
                  {img.is_primary && <span className="main-badge">Principal</span>}
                </div>
              ))}
              {newImages.map((img, index) => (
                <div key={`new-${index}`} className="image-preview">
                  <img src={img.preview} alt={`Nueva ${index + 1}`} />
                  <button type="button" className="btn-remove-image" onClick={() => removeNewImage(index)}><X size={16} /></button>
                  <span className="main-badge" style={{ background: '#16a34a' }}>Nueva</span>
                </div>
              ))}
              {totalImages < 5 && (
                <label className="upload-box">
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleNewImages} style={{ display: 'none' }} />
                  <Upload size={32} />
                  <span>Agregar imágenes</span>
                  <span className="upload-hint">{5 - totalImages} disponibles</span>
                </label>
              )}
            </div>
            {errors.images && <span className="error-text">{errors.images}</span>}
          </div>

          {/* Información básica */}
          <div className="form-section">
            <h2 className="section-title"><FileText size={20} />Información Básica</h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Nombre del Producto *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                  placeholder="Ej: Smart Watch Serie 8" className={errors.name ? 'error' : ''} />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label>SKU *</label>
                <div className="input-with-icon"><Tag size={18} />
                  <input type="text" name="sku" value={formData.sku} onChange={handleInputChange}
                    placeholder="SW-001" className={errors.sku ? 'error' : ''} />
                </div>
                {errors.sku && <span className="error-text">{errors.sku}</span>}
              </div>
              <div className="form-group">
                <label>Categoría *</label>
                <div className="input-with-icon"><Grid size={18} />
                  <select name="category" value={formData.category} onChange={handleInputChange}
                    className={errors.category ? 'error' : ''}>
                    {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                </div>
                {errors.category && <span className="error-text">{errors.category}</span>}
              </div>
              <div className="form-group full-width">
                <label>Descripción *</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange}
                  placeholder="Describí tu producto..." rows="4" className={errors.description ? 'error' : ''} />
                <span className="char-count">{formData.description.length} caracteres</span>
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>
            </div>
          </div>

          {/* Precio y stock */}
          <div className="form-section">
            <h2 className="section-title"><DollarSign size={20} />Precio y Stock</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Precio Base (Gs.) *</label>
                <div className="input-with-icon"><span className="currency-symbol">Gs.</span>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange}
                    placeholder="0" min="0" step="100" className={errors.price ? 'error' : ''} />
                </div>
                {errors.price && <span className="error-text">{errors.price}</span>}
              </div>
              <div className="form-group">
                <label>Descuento (%)</label>
                <div className="input-with-icon"><span className="currency-symbol">%</span>
                  <input type="number" name="discount" value={formData.discount} onChange={handleInputChange}
                    placeholder="0" min="0" max="100" />
                </div>
              </div>
              <div className="form-group">
                <label>Precio Sugerido de Venta (Gs.)</label>
                <div className="input-with-icon"><span className="currency-symbol">Gs.</span>
                  <input type="number" name="suggested_price" value={formData.suggested_price}
                    onChange={handleInputChange} placeholder="0" min="0" step="100" />
                </div>
                <span className="char-count" style={{ marginTop: '4px' }}>Visible para los vendedores</span>
              </div>
              <div className="form-group">
                <label>Stock disponible</label>
                <div className="input-with-icon"><Package size={18} />
                  <input type="number" name="stock" value={formData.stock}
                    onChange={handleInputChange} placeholder="0" min="0" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Exclusividad ── */}
          <div className="form-section">
            <h2 className="section-title"><Lock size={20} />Visibilidad y Asignación</h2>

            {/* Toggle privado */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: isPrivate ? '#eff6ff' : '#f9fafb', border: `1.5px solid ${isPrivate ? '#bfdbfe' : '#e5e7eb'}`, borderRadius: '10px', marginBottom: '16px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                  {isPrivate ? 'Producto exclusivo' : 'Producto público'}
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                  {isPrivate
                    ? 'Solo los vendedores asignados pueden verlo y venderlo'
                    : 'Visible para todos los vendedores en el catálogo'}
                </p>
              </div>
              <button type="button" onClick={handleTogglePrivate}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                  background: isPrivate ? '#056EB7' : '#e5e7eb',
                  color:      isPrivate ? 'white'   : '#6b7280' }}>
                {isPrivate ? 'Hacer público' : 'Hacer exclusivo'}
              </button>
            </div>

            {/* Asignaciones — solo si es privado */}
            {isPrivate && (
              <div>
                {/* Vendedores asignados */}
                {assignments.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Vendedores con acceso ({assignments.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {assignments.map(a => {
                        const seller = allSellers.find(s => s.user_id === a.buyer_id);
                        return (
                          <div key={a.assignment_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '9px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#16a34a20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#16a34a', fontSize: '14px' }}>
                                {(seller?.user_nickname || `#${a.buyer_id}`)[0].toUpperCase()}
                              </div>
                              <div>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>{seller?.user_nickname || `Vendedor #${a.buyer_id}`}</p>
                                {seller?.email && <p style={{ fontSize: '11px', color: '#6b7280' }}>{seller.email}</p>}
                              </div>
                            </div>
                            <button type="button" onClick={() => handleRemoveSeller(a.buyer_id)} disabled={removingId === a.buyer_id}
                              style={{ background: 'none', border: '1.5px solid #fca5a5', borderRadius: '7px', color: '#dc2626', padding: '5px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                              {removingId === a.buyer_id ? '...' : 'Quitar'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Buscador de vendedores */}
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Agregar vendedor
                </p>
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="text"
                    placeholder="Buscar vendedor..."
                    value={sellerSearch}
                    onChange={e => setSellerSearch(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                {filteredSellers.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '12px' }}>
                    {sellerSearch ? 'No se encontraron vendedores' : 'Todos los vendedores ya tienen acceso'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '220px', overflowY: 'auto' }}>
                    {filteredSellers.map(s => (
                      <div key={s.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '9px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#056EB7', fontSize: '14px' }}>
                            {(s.user_nickname || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>{s.user_nickname}</p>
                            {s.email && <p style={{ fontSize: '11px', color: '#6b7280' }}>{s.email}</p>}
                          </div>
                        </div>
                        <button type="button" onClick={() => handleAddSeller(s.user_id)} disabled={addingId === s.user_id}
                          style={{ background: '#056EB7', border: 'none', borderRadius: '7px', color: 'white', padding: '5px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                          {addingId === s.user_id ? '...' : 'Asignar'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {errors.submit && <div className="error-box" style={{ marginBottom: '16px' }}>{errors.submit}</div>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCancel} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditProductForm;