import React, { useState, useEffect, useCallback, useRef } from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardBody } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/products';
import { getCategories } from '../services/categories';
import { Plus, Edit, Trash2, Search, RefreshCw, FilterX, X, Camera } from 'lucide-react';
import { formatCurrency, getProductImageUrl } from '../utils/helpers';
import AdvancedDataTable from '../components/AdvancedDataTable/AdvancedDataTable';
import { useNavigate } from 'react-router-dom';
import './Products.css';

const Products = () => {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  // Filters state
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // null = Add, object = Edit
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [availability, setAvailability] = useState('available');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // File Upload States
  const [image, setImage] = useState(''); // relative path URL or fallback emoji
  const [imageFile, setImageFile] = useState(null); // Selected File object
  const [imagePreview, setImagePreview] = useState(''); // Local Blob Preview URL or static path

  // Image File Upload Input Ref
  const fileInputRef = useRef(null);

  // Fetch Categories on Mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        // Only keep active categories for product grouping
        setCategories(data.filter(c => c.status === 'active'));
      } catch (err) {
        console.error('Failed to load categories for filters:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Products based on filters
  const fetchProductsList = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const data = await getProducts({
        category: filterCategory,
        availability: filterAvailability,
        search: filterSearch
      });
      setProducts(data);
    } catch (err) {
      console.error(err);
      setErrorState('Failed to load products. Please check connection and try again.');
      addToast('Error fetching products list', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterAvailability, filterSearch, addToast]);

  useEffect(() => {
    fetchProductsList();
  }, [fetchProductsList]);

  // Handle Modal Close with Smooth Reverse Animation
  const handleCloseModal = useCallback(() => {
    if (submitting) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 240);
  }, [submitting]);

  // Keyboard Escape Key Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen && !submitting) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, submitting, handleCloseModal]);

  // Open Modal Helpers
  const handleOpenAddModal = () => {
    if (categories.length === 0) {
      addToast('Please create at least one active category first', 'warning');
      return;
    }
    setSelectedProduct(null);
    setName('');
    setDescription('');
    setCategoryId(categories[0]?.id || '');
    setPrice('');
    setAvailability('available');
    setImage('');
    setImageFile(null);
    setImagePreview('');
    setFormErrors({});
    setIsClosing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setSelectedProduct(prod);
    setName(prod.name);
    setDescription(prod.description);
    setCategoryId(prod.categoryId);
    setPrice(prod.price.toString());
    setAvailability(prod.availability);
    setImage(prod.image || '');
    setImageFile(null);
    setImagePreview(prod.image || '');
    setFormErrors({});
    setIsClosing(false);
    setIsModalOpen(true);
  };

  // Drag and Drop event handlers for product image
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (!file) return;

    // Size limit validation (5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFormErrors(prev => ({ ...prev, image: 'File size must be less than 5 MB' }));
      addToast('File is too large (max 5 MB)', 'error');
      return;
    }

    // Format validation
    const validFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      setFormErrors(prev => ({ ...prev, image: 'Unsupported format. Use PNG, JPG, JPEG, or WebP.' }));
      addToast('Unsupported file format', 'error');
      return;
    }

    // Cache the native file object for FormData
    setImageFile(file);

    // Create a local object URL for instant, low-memory previewing
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    setFormErrors(prev => ({ ...prev, image: '' }));
    addToast('Image selected successfully', 'success');
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImage('');
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Product name is required';
    } else if (name.trim().length > 50) {
      errors.name = 'Product name cannot exceed 50 characters';
    }

    if (!categoryId) {
      errors.categoryId = 'Menu category is required';
    }

    const numPrice = parseFloat(price);
    if (!price || isNaN(numPrice)) {
      errors.price = 'Price is required';
    } else if (numPrice < 0) {
      errors.price = 'Price must be a positive number';
    }

    if (!imageFile && !image) {
      errors.image = 'Product image is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!validateForm()) {
      addToast('Please fix validation errors', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        categoryId,
        price: parseFloat(price),
        availability,
        // Send raw File object if newly chosen, otherwise send the existing string URL/emoji
        image: imageFile || image
      };

      if (selectedProduct) {
        await updateProduct(selectedProduct.id, payload);
        addToast(`Dish "${payload.name}" updated successfully`, 'success');
      } else {
        await createProduct(payload);
        addToast(`Dish "${payload.name}" created successfully`, 'success');
      }
      handleCloseModal();
      fetchProductsList(); // reload products
    } catch (err) {
      addToast(err.message || 'Failed to save product information', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Availability Inline
  const handleToggleAvailability = async (prod) => {
    const newStatus = prod.availability === 'available' ? 'out_of_stock' : 'available';
    try {
      await updateProduct(prod.id, { availability: newStatus });
      addToast(`Availability for "${prod.name}" updated to ${newStatus === 'available' ? 'Available' : 'Out of Stock'}`, 'success');
      setProducts(prev =>
        prev.map(p => p.id === prod.id ? { ...p, availability: newStatus } : p)
      );
    } catch (err) {
      addToast('Failed to toggle product availability', 'error');
    }
  };

  // Delete Product Handler
  const handleDeleteProduct = async (prod) => {
    const confirmed = await confirm({
      title: 'Delete Product?',
      message: `Are you sure you want to delete "${prod.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      await deleteProduct(prod.id);
      addToast(`Dish "${prod.name}" deleted successfully`, 'success');
      fetchProductsList();
    } catch (err) {
      addToast('Failed to delete product', 'error');
    }
  };

  const clearFilters = () => {
    setFilterSearch('');
    setFilterCategory('');
    setFilterAvailability('');
  };

  const getAvailabilityBadge = (status) => {
    switch (status) {
      case 'available':
        return <Badge variant="success">Available</Badge>;
      case 'out_of_stock':
        return <Badge variant="error">Out of Stock</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(c => ({ value: c.id, label: c.name }))
  ];

  const modalCategoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

  const availabilityOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'available', label: 'Available' },
    { value: 'out_of_stock', label: 'Out of Stock' }
  ];

  const modalAvailabilityOptions = [
    { value: 'available', label: 'Available' },
    { value: 'out_of_stock', label: 'Out of Stock' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Food Product Management</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Manage food dishes, beverages, availability statuses and prices
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenAddModal}>
          Add Product
        </Button>
      </div>

      {/* Advanced Enterprise Data Table */}
      {errorState ? (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '40px' }}>
            <p className="text-secondary" style={{ marginBottom: '16px' }}>{errorState}</p>
            <Button variant="secondary" icon={RefreshCw} onClick={fetchProductsList}>
              Retry Fetching
            </Button>
          </CardBody>
        </Card>
      ) : (
        <AdvancedDataTable
          tableKey="products"
          data={products}
          loading={loading}
          searchFields={['name', 'description', 'categoryName']}
          searchPlaceholder="Search food dishes or categories... (Ctrl+F)"
          onRefresh={fetchProductsList}
          emptyStateTitle="No Products Found"
          emptyStateDescription="No dishes match your active search terms or category filter rules."
          filterConfigs={[
            {
              key: 'categoryId',
              label: 'Category',
              type: 'select',
              options: categories.map(c => ({ value: c.id, label: c.name }))
            },
            {
              key: 'availability',
              label: 'Availability',
              type: 'select',
              options: [
                { value: 'available', label: 'Available' },
                { value: 'out_of_stock', label: 'Out of Stock' }
              ]
            },
            {
              key: 'priceRange',
              label: 'Price Range (₹)',
              type: 'range',
              minKey: 'prodMinPrice',
              maxKey: 'prodMaxPrice'
            }
          ]}
          columns={[
            {
              key: 'image',
              title: 'Image',
              width: '80px',
              sortable: false,
              render: (prod) => (
                <div style={{ textAlign: 'center' }}>
                  {prod.image && (prod.image.startsWith('data:') || prod.image.startsWith('http') || prod.image.startsWith('/') || prod.image.startsWith('blob:')) ? (
                    <img 
                      src={getProductImageUrl(prod.image)} 
                      alt={prod.name} 
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: 'var(--radius-sm)', 
                        objectFit: 'cover',
                        display: 'block',
                        margin: '0 auto',
                        border: '1px solid var(--color-border)'
                      }} 
                    />
                  ) : (
                    <span style={{ fontSize: '1.5rem' }}>{prod.image || '🍔'}</span>
                  )}
                </div>
              )
            },
            {
              key: 'name',
              title: 'Product Name',
              sortable: true,
              render: (prod) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '600' }}>{prod.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {prod.description || 'No description provided.'}
                  </span>
                </div>
              )
            },
            {
              key: 'categoryName',
              title: 'Category',
              sortable: true,
              render: (prod) => <span style={{ fontWeight: '500' }}>{prod.categoryName}</span>
            },
            {
              key: 'price',
              title: 'Price',
              sortable: true,
              render: (prod) => <span style={{ fontWeight: '600' }}>{formatCurrency(prod.price)}</span>
            },
            {
              key: 'availability',
              title: 'Availability',
              sortable: true,
              render: (prod) => getAvailabilityBadge(prod.availability)
            },
            {
              key: 'actions',
              title: 'Actions',
              width: '210px',
              render: (prod) => (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleAvailability(prod)}
                  >
                    {prod.availability === 'available' ? 'Mark Out of Stock' : 'Mark Available'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    onClick={() => handleOpenEditModal(prod)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    className="text-danger"
                    onClick={() => handleDeleteProduct(prod)}
                  />
                </div>
              )
            }
          ]}
        />
      )}

      {/* Add / Edit Menu Product Modal Container */}
      {isModalOpen && (
        <div className={`product-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleCloseModal}>
          <div className={`product-modal-container ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="product-modal-header">
              <div className="product-modal-header-text">
                <h3 className="product-modal-title">
                  {selectedProduct ? 'Edit Menu Product' : 'Add New Menu Product'}
                </h3>
                <p className="product-modal-subtitle">
                  Create a new item for your restaurant menu
                </p>
              </div>
              <button
                type="button"
                className="product-modal-close-btn"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
              <div className="product-modal-body">
                
                {/* Product Image Upload Section */}
                <div className="product-image-section">
                  <label className="product-field-label">
                    Product Image <span className="required-star">*</span>
                  </label>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/png, image/jpeg, image/jpg, image/webp" 
                    style={{ display: 'none' }} 
                  />
                  
                  {imagePreview ? (
                    <div className="product-image-preview-card">
                      <img 
                        src={imagePreview.startsWith('blob:') ? imagePreview : getProductImageUrl(imagePreview)} 
                        alt="Preview" 
                        className="product-preview-img"
                      />
                      <div className="product-preview-actions">
                        <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                          Replace Image
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="text-danger" onClick={handleRemoveImage}>
                          Remove Image
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className={`product-image-dropzone ${formErrors.image ? 'has-error' : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="upload-icon-circle">
                        <Camera size={22} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="upload-title">Upload product image</span>
                        <span className="upload-subtitle">Drag & drop or click to browse</span>
                      </div>
                      <span className="upload-spec-pill">JPG • PNG • WEBP • Max 5MB</span>
                    </div>
                  )}
                  
                  {formErrors.image && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{formErrors.image}</span>
                  )}
                </div>

                {/* ROW 1: Product Name & Category */}
                <div className="product-form-row">
                  <div className="product-field-group">
                    <label className="product-field-label">
                      Product Name <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className={`product-input-control ${formErrors.name ? 'has-error' : ''}`}
                      placeholder="Enter product name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                      }}
                      disabled={submitting}
                      required
                    />
                    {formErrors.name && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{formErrors.name}</span>
                    )}
                  </div>

                  <div className="product-field-group">
                    <label className="product-field-label">
                      Category <span className="required-star">*</span>
                    </label>
                    <div className="product-select-wrapper">
                      <select
                        className={`product-select-control ${formErrors.categoryId ? 'has-error' : ''}`}
                        value={categoryId}
                        onChange={(e) => {
                          setCategoryId(e.target.value);
                          if (formErrors.categoryId) setFormErrors(prev => ({ ...prev, categoryId: '' }));
                        }}
                        disabled={submitting}
                        required
                      >
                        {modalCategoryOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <span className="product-select-arrow" />
                    </div>
                    {formErrors.categoryId && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{formErrors.categoryId}</span>
                    )}
                  </div>
                </div>

                {/* ROW 2: Price & Availability Status */}
                <div className="product-form-row">
                  <div className="product-field-group">
                    <label className="product-field-label">
                      Price (₹) <span className="required-star">*</span>
                    </label>
                    <div className="product-price-wrapper">
                      <span className="product-currency-symbol">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`product-input-control product-price-input ${formErrors.price ? 'has-error' : ''}`}
                        placeholder="150.00"
                        value={price}
                        onChange={(e) => {
                          setPrice(e.target.value);
                          if (formErrors.price) setFormErrors(prev => ({ ...prev, price: '' }));
                        }}
                        disabled={submitting}
                        required
                      />
                    </div>
                    {formErrors.price && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{formErrors.price}</span>
                    )}
                  </div>

                  <div className="product-field-group">
                    <label className="product-field-label">
                      Availability Status
                    </label>
                    <div className="availability-status-group">
                      <button
                        type="button"
                        className={`availability-btn ${availability === 'available' ? 'selected' : ''}`}
                        onClick={() => setAvailability('available')}
                        disabled={submitting}
                      >
                        <span className="status-dot">🟢</span>
                        <span>Available</span>
                      </button>
                      <button
                        type="button"
                        className={`availability-btn ${availability === 'out_of_stock' ? 'selected' : ''}`}
                        onClick={() => setAvailability('out_of_stock')}
                        disabled={submitting}
                      >
                        <span className="status-dot">🔴</span>
                        <span>Out of Stock</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ROW 3: Description Textarea */}
                <div className="product-field-group">
                  <label className="product-field-label">Description</label>
                  <textarea
                    className="product-textarea"
                    placeholder="Describe ingredients, portion size, or other important details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={submitting}
                  />
                </div>

              </div>

              {/* Modal Footer (Fixed) */}
              <div className="product-modal-footer">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submitting}
                  className="product-submit-btn"
                >
                  {selectedProduct ? 'Save Changes' : 'Create Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Products;
