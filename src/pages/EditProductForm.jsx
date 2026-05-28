import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Upload, DollarSign, Package, Tag, Grid, FileText } from 'lucide-react';
import { getProduct, updateProduct, getProductImages, uploadProductImage, deleteImage } from '../services/api';
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

  // Imágenes existentes (ya subidas) y nuevas (a subir)
  const [existingImages, setExistingImages] = useState([]); // { image_id, image_url, is_primary }
  const [newImages, setNewImages]           = useState([]); // { file, preview }
  const [deletedImageIds, setDeletedImageIds] = useState([]);

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
    const fetchProduct = async () => {
      try {
        const [product, images] = await Promise.all([
          getProduct(id),
          getProductImages(id),
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
        const sorted = [...(images || [])].sort((a, b) => b.is_primary - a.is_primary);
        setExistingImages(sorted);
      } catch {
        setErrors({ submit: 'No se pudo cargar el producto.' });
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length + newImages.length + files.length;
    if (totalImages > 5) {
      setErrors(prev => ({ ...prev, images: 'Máximo 5 imágenes permitidas' }));
      return;
    }
    setErrors(prev => ({ ...prev, images: '' }));
    const previews = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setNewImages(prev => [...prev, ...previews]);
  };

  const removeExistingImage = (imageId) => {
    setExistingImages(prev => prev.filter(img => img.image_id !== imageId));
    setDeletedImageIds(prev => [...prev, imageId]);
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const e = {};
    if (!formData.name.trim() || formData.name.trim().length < 5)
      e.name = 'El nombre debe tener al menos 5 caracteres';
    if (!formData.sku.trim())
      e.sku = 'El SKU es requerido';
    if (!formData.description.trim() || formData.description.trim().length < 20)
      e.description = 'La descripción debe tener al menos 20 caracteres';
    if (!formData.category)
      e.category = 'Selecciona una categoría';
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
      // 1. Actualizar datos del producto
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

      // 2. Eliminar imágenes marcadas para borrar
      await Promise.all(deletedImageIds.map(imgId => deleteImage(imgId)));

      // 3. Subir nuevas imágenes
      const isPrimaryTaken = existingImages.some(img => img.is_primary);
      await Promise.all(
        newImages.map((img, index) =>
          uploadProductImage(id, img.file, !isPrimaryTaken && index === 0, existingImages.length + index)
        )
      );

      navigate('/provider-catalog');
    } catch (err) {
      setErrors({ submit: err.message || 'Error al guardar los cambios. Intentá de nuevo.' });
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

              {/* Imágenes existentes */}
              {existingImages.map((img, index) => (
                <div key={img.image_id} className="image-preview">
                  <img src={img.image_url} alt={`Imagen ${index + 1}`} />
                  <button type="button" className="btn-remove-image" onClick={() => removeExistingImage(img.image_id)}>
                    <X size={16} />
                  </button>
                  {img.is_primary && <span className="main-badge">Principal</span>}
                </div>
              ))}

              {/* Nuevas imágenes */}
              {newImages.map((img, index) => (
                <div key={`new-${index}`} className="image-preview">
                  <img src={img.preview} alt={`Nueva ${index + 1}`} />
                  <button type="button" className="btn-remove-image" onClick={() => removeNewImage(index)}>
                    <X size={16} />
                  </button>
                  <span className="main-badge" style={{ background: '#16a34a' }}>Nueva</span>
                </div>
              ))}

              {/* Botón agregar */}
              {totalImages < 5 && (
                <label className="upload-box">
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleNewImages} style={{ display: 'none' }} />
                  <Upload size={32} />
                  <span>Agregar imágenes</span>
                  <span className="upload-hint">{5 - totalImages} disponibles (JPG, PNG, WEBP)</span>
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
                <label htmlFor="name">Nombre del Producto *</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange}
                  placeholder="Ej: Smart Watch Serie 8" className={errors.name ? 'error' : ''} />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="sku">SKU *</label>
                <div className="input-with-icon">
                  <Tag size={18} />
                  <input type="text" id="sku" name="sku" value={formData.sku} onChange={handleInputChange}
                    placeholder="SW-001" className={errors.sku ? 'error' : ''} />
                </div>
                {errors.sku && <span className="error-text">{errors.sku}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="category">Categoría *</label>
                <div className="input-with-icon">
                  <Grid size={18} />
                  <select id="category" name="category" value={formData.category} onChange={handleInputChange}
                    className={errors.category ? 'error' : ''}>
                    {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                </div>
                {errors.category && <span className="error-text">{errors.category}</span>}
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Descripción *</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleInputChange}
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
                <label htmlFor="price">Precio Base (Gs.) *</label>
                <div className="input-with-icon">
                  <span className="currency-symbol">Gs.</span>
                  <input type="number" id="price" name="price" value={formData.price} onChange={handleInputChange}
                    placeholder="0" min="0" step="100" className={errors.price ? 'error' : ''} />
                </div>
                {errors.price && <span className="error-text">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="discount">Descuento (%)</label>
                <div className="input-with-icon">
                  <span className="currency-symbol">%</span>
                  <input type="number" id="discount" name="discount" value={formData.discount} onChange={handleInputChange}
                    placeholder="0" min="0" max="100" step="1" />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="suggested_price">Precio Sugerido de Venta (Gs.)</label>
                <div className="input-with-icon">
                  <span className="currency-symbol">Gs.</span>
                  <input type="number" id="suggested_price" name="suggested_price" value={formData.suggested_price}
                    onChange={handleInputChange} placeholder="0" min="0" step="100" />
                </div>
                <span className="char-count" style={{ marginTop: '4px' }}>Visible para los vendedores</span>
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stock disponible</label>
                <div className="input-with-icon">
                  <Package size={18} />
                  <input type="number" id="stock" name="stock" value={formData.stock}
                    onChange={handleInputChange} placeholder="0" min="0" step="1" />
                </div>
                <span className="char-count" style={{ marginTop: '4px' }}>Unidades disponibles para vender</span>
              </div>

            </div>
          </div>

          {errors.submit && <div className="error-box" style={{ marginBottom: '16px' }}>{errors.submit}</div>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </button>
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
