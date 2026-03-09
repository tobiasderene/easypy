import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Upload, DollarSign, Package, Tag, Grid, FileText } from 'lucide-react';
import { createProduct, uploadProductImage } from '../services/api';
import { useUser } from '../App';
import '../styles/addproductform.css';

const AddProductForm = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    price: '',
    discount: '0',
    images: []
  });
  const [errors, setErrors] = useState({});
  const [previewImages, setPreviewImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: '', label: 'Selecciona una categoría' },
    { value: 'electronics', label: 'Electrónica' },
    { value: 'home', label: 'Hogar' },
    { value: 'office', label: 'Oficina' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'accessories', label: 'Accesorios' },
    { value: 'beauty', label: 'Belleza' },
    { value: 'clothing', label: 'Ropa' },
    { value: 'toys', label: 'Juguetes' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + previewImages.length > 5) {
      setErrors(prev => ({ ...prev, images: 'Máximo 5 imágenes permitidas' }));
      return;
    }
    const newPreviews = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setPreviewImages(prev => [...prev, ...newPreviews]);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const removeImage = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre del producto es requerido';
    else if (formData.name.trim().length < 5) newErrors.name = 'El nombre debe tener al menos 5 caracteres';
    if (!formData.sku.trim()) newErrors.sku = 'El SKU es requerido';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    else if (formData.description.trim().length < 20) newErrors.description = 'La descripción debe tener al menos 20 caracteres';
    if (!formData.category) newErrors.category = 'Selecciona una categoría';
    if (!formData.price) newErrors.price = 'El precio es requerido';
    else if (parseFloat(formData.price) <= 0) newErrors.price = 'El precio debe ser mayor a 0';
    if (previewImages.length === 0) newErrors.images = 'Agrega al menos una imagen';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsSubmitting(true);
    try {
      // 1. Crear el producto
      const product = await createProduct({
        product_name: formData.name,
        product_sku: formData.sku,
        product_description: formData.description,
        product_category: formData.category,
        product_base_cost: parseFloat(formData.price),
        product_discount: parseFloat(formData.discount) || 0,
        product_status: 'active',
        user_id: user.user_id,
        created_at: new Date().toISOString(),
      });

      // 2. Subir imágenes
      await Promise.all(
        formData.images.map((file, index) =>
          uploadProductImage(product.product_id, file, index === 0, index)
        )
      );

      navigate('/provider-catalog');
    } catch (err) {
      setErrors({ submit: err.message || 'Error al publicar el producto. Intentá de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('¿Estás seguro de cancelar? Se perderán los datos ingresados.')) {
      navigate('/provider-catalog');
    }
  };

  return (
    <div className="add-product-page">
      <div className="add-product-container">

        <div className="add-product-header">
          <div className="header-left">
            <Package size={32} />
            <div>
              <h1>Publicar Nuevo Producto</h1>
              <p>Completa la información de tu producto</p>
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
              {previewImages.length < 5 && (
                <label className="upload-box">
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                  <Upload size={32} />
                  <span>Haz clic para subir imágenes</span>
                  <span className="upload-hint">Máximo 5 imágenes (JPG, PNG, WEBP)</span>
                </label>
              )}
              {previewImages.map((img, index) => (
                <div key={index} className="image-preview">
                  <img src={img.preview} alt={`Preview ${index + 1}`} />
                  <button type="button" className="btn-remove-image" onClick={() => removeImage(index)}>
                    <X size={16} />
                  </button>
                  {index === 0 && <span className="main-badge">Principal</span>}
                </div>
              ))}
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
                  placeholder="Ej: Smart Watch Serie 8 - Pantalla AMOLED" className={errors.name ? 'error' : ''} />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="sku">SKU (Código del Producto) *</label>
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
                <label htmlFor="description">Descripción del Producto *</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleInputChange}
                  placeholder="Describe las características principales de tu producto..." rows="4"
                  className={errors.description ? 'error' : ''} />
                <span className="char-count">{formData.description.length} caracteres</span>
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>
            </div>
          </div>

          {/* Precio */}
          <div className="form-section">
            <h2 className="section-title"><DollarSign size={20} />Precio</h2>
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

            </div>
          </div>

          {errors.submit && <div className="error-box" style={{ marginBottom: '16px' }}>{errors.submit}</div>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Publicando...' : 'Publicar Producto'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddProductForm;