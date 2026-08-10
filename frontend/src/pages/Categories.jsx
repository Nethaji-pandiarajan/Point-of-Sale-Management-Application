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
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categories';
import { Plus, Edit, Trash2, RefreshCw, X } from 'lucide-react';
import IconPickerModal from '../components/ui/IconPickerModal';
import { getIconEmoji, getIconLabel } from '../utils/icons';
import AdvancedDataTable from '../components/AdvancedDataTable/AdvancedDataTable';
import './Categories.css';

const Categories = () => {
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // null = Add, object = Edit
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('salad');
  const [status, setStatus] = useState('active');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Icon Picker Overlay State
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const iconPickerButtonRef = useRef(null);

  const fetchCategoriesList = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
      setErrorState('Failed to load categories. Please verify your connection.');
      addToast('Error fetching categories list', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCategoriesList();
  }, [fetchCategoriesList]);

  // Handle Modal Close with Smooth Reverse Animation
  const handleCloseModal = useCallback(() => {
    if (submitting) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 260);
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
    setSelectedCategory(null);
    setName('');
    setDescription('');
    setIcon('salad');
    setStatus('active');
    setFormErrors({});
    setIsClosing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setSelectedCategory(cat);
    setName(cat.name);
    setDescription(cat.description);
    setIcon(cat.icon);
    setStatus(cat.status);
    setFormErrors({});
    setIsClosing(false);
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Category name is required';
    } else if (name.trim().length > 30) {
      errors.name = 'Category name cannot exceed 30 characters';
    } else {
      // Duplicate check (except self when editing)
      const isDuplicate = categories.some(
        c => (!selectedCategory || c.id !== selectedCategory.id) &&
             c.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (isDuplicate) {
        errors.name = 'A category with this name already exists';
      }
    }

    if (!icon) {
      errors.icon = 'Category icon is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!validateForm()) {
      addToast('Please correct form validation errors', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        icon,
        status
      };

      if (selectedCategory) {
        await updateCategory(selectedCategory.id, payload);
        addToast(`Category "${payload.name}" updated successfully`, 'success');
      } else {
        await createCategory(payload);
        addToast(`Category "${payload.name}" created successfully`, 'success');
      }
      handleCloseModal();
      fetchCategoriesList(); // reload categories
    } catch (err) {
      addToast(err.message || 'Failed to save category information', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Inline Status Toggle
  const handleToggleStatus = async (cat) => {
    const newStatus = cat.status === 'active' ? 'inactive' : 'active';
    try {
      await updateCategory(cat.id, { status: newStatus });
      addToast(`Category "${cat.name}" status updated to ${newStatus}`, 'success');
      // local update to avoid full reload flicker
      setCategories(prev =>
        prev.map(c => c.id === cat.id ? { ...c, status: newStatus } : c)
      );
    } catch (err) {
      addToast('Failed to toggle category status', 'error');
    }
  };

  // Delete Category
  const handleDeleteCategory = async (cat) => {
    const confirmed = await confirm({
      title: 'Delete Category?',
      message: `Are you sure you want to delete "${cat.name}"? This action will delete the category. Any products listed under it will be unassigned/removed.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      await deleteCategory(cat.id);
      addToast(`Category "${cat.name}" deleted successfully`, 'success');
      fetchCategoriesList();
    } catch (err) {
      addToast('Failed to delete category', 'error');
    }
  };

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Category Management</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Configure and maintain menu classifications
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenAddModal}>
          Add Category
        </Button>
      </div>

      {/* Advanced Enterprise Data Table */}
      {errorState ? (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '40px' }}>
            <p className="text-secondary" style={{ marginBottom: '16px' }}>{errorState}</p>
            <Button variant="secondary" icon={RefreshCw} onClick={fetchCategoriesList}>
              Retry Fetching
            </Button>
          </CardBody>
        </Card>
      ) : (
        <AdvancedDataTable
          tableKey="categories"
          data={categories}
          loading={loading}
          searchFields={['name', 'description']}
          searchPlaceholder="Search categories... (Ctrl+F)"
          onRefresh={fetchCategoriesList}
          emptyStateTitle="No Categories Found"
          emptyStateDescription="Create custom groups to organize your food and beverage menu."
          filterConfigs={[
            {
              key: 'status',
              label: 'Publishing Status',
              type: 'select',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]
            }
          ]}
          columns={[
            {
              key: 'icon',
              title: 'Icon',
              width: '70px',
              sortable: false,
              render: (cat) => (
                <span style={{ fontSize: '1.5rem', display: 'block', textAlign: 'center' }}>
                  {getIconEmoji(cat.icon)}
                </span>
              )
            },
            {
              key: 'name',
              title: 'Category Name',
              sortable: true,
              render: (cat) => <span style={{ fontWeight: '600' }}>{cat.name}</span>
            },
            {
              key: 'description',
              title: 'Description',
              sortable: true,
              render: (cat) => (
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  {cat.description || 'No description provided.'}
                </span>
              )
            },
            {
              key: 'productCount',
              title: 'Products Count',
              sortable: true,
              render: (cat) => (
                <span style={{ fontWeight: '600', display: 'block', textAlign: 'center' }}>
                  {cat.productCount || 0}
                </span>
              )
            },
            {
              key: 'status',
              title: 'Status',
              sortable: true,
              render: (cat) => (
                <Badge variant={cat.status === 'active' ? 'success' : 'secondary'}>
                  {cat.status}
                </Badge>
              )
            },
            {
              key: 'actions',
              title: 'Actions',
              width: '180px',
              render: (cat) => (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(cat)}
                  >
                    {cat.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    onClick={() => handleOpenEditModal(cat)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    className="text-danger"
                    onClick={() => handleDeleteCategory(cat)}
                  />
                </div>
              )
            }
          ]}
        />
      )}

      {/* Add / Edit Category 2-Column Restaurant Menu Card Modal */}
      {isModalOpen && (
        <div className={`menu-card-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleCloseModal}>
          <div className={`menu-card-container ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            
            {/* LEFT SIDE — CATEGORY PREVIEW PANEL */}
            <div className="menu-card-preview-panel">
              <div className="preview-decor-top">
                <span className="preview-tag-badge">MENU CATEGORY</span>
              </div>

              <div className="preview-center-stage">
                <div className="preview-icon-circle-wrapper">
                  <div className="preview-icon-circle">
                    <span key={icon} className="preview-icon-emoji category-icon-scale-in">{getIconEmoji(icon)}</span>
                  </div>
                </div>

                <div className="preview-info-block">
                  <h4 className="preview-category-name">
                    {name.trim() ? name.trim() : 'NEW CATEGORY'}
                  </h4>
                  <p className="preview-category-desc">
                    {description.trim() ? description.trim() : 'Organize your delicious dishes into this custom menu group.'}
                  </p>
                </div>
              </div>

              <div className="preview-footer-status">
                <Badge variant={status === 'active' ? 'success' : 'secondary'}>
                  {status === 'active' ? '● Active in Menu' : '○ Draft / Inactive'}
                </Badge>
              </div>
            </div>

            {/* RIGHT SIDE — FORM CONTROLS */}
            <div className="menu-card-form-panel">
              <div className="menu-card-header">
                <div>
                  <h3 className="menu-card-title">
                    {selectedCategory ? 'Edit Menu Category' : 'Create New Category'}
                  </h3>
                  <p className="menu-card-subtitle">
                    Organize your menu with a new category
                  </p>
                </div>
                <button
                  type="button"
                  className="menu-card-close-btn"
                  onClick={handleCloseModal}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="menu-card-form">
                <div className="menu-card-form-body">
                  
                  {/* Category Name Input */}
                  <div className="category-field-group">
                    <label className="category-field-label">
                      Category Name <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className={`category-input-control ${formErrors.name ? 'has-error' : ''}`}
                      placeholder="e.g. Italian Pasta"
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

                  {/* Publishing Status & Icon row */}
                  <div className="menu-card-form-row">
                    <div className="category-field-group">
                      <label className="category-field-label">
                        Publishing Status
                      </label>
                      <div className="category-select-wrapper">
                        <select
                          className="category-select-control"
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          disabled={submitting}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        <span className="category-select-arrow" />
                      </div>
                    </div>

                    <div className="category-field-group">
                      <label className="category-field-label">
                        Category Icon <span className="required-star">*</span>
                      </label>
                      <button
                        ref={iconPickerButtonRef}
                        type="button"
                        className={`menu-card-icon-btn ${formErrors.icon ? 'has-error' : ''}`}
                        onClick={() => setIsPickerOpen(true)}
                        disabled={submitting}
                      >
                        <span key={icon + '-emoji'} className="icon-btn-emoji category-icon-scale-in">{getIconEmoji(icon)}</span>
                        <span key={icon + '-label'} className="icon-btn-label category-icon-scale-in">{icon ? getIconLabel(icon) : 'Select Icon'}</span>
                      </button>
                      {formErrors.icon && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{formErrors.icon}</span>
                      )}
                    </div>
                  </div>

                  {/* Description Textarea */}
                  <div className="category-field-group">
                    <label className="category-field-label">Description</label>
                    <textarea
                      className="menu-card-textarea"
                      placeholder="Short description of food/beverage items in this category"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                </div>

                {/* Bottom Footer Actions */}
                <div className="menu-card-footer">
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
                    className="menu-card-submit-btn"
                  >
                    {selectedCategory ? 'Save Changes →' : 'Create Category →'}
                  </Button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Modern Visual Icon Picker Overlay */}
      <IconPickerModal
        isOpen={isPickerOpen}
        onClose={() => {
          setIsPickerOpen(false);
          setTimeout(() => {
            iconPickerButtonRef.current?.focus();
          }, 50);
        }}
        initialIcon={icon}
        onSelect={(selectedIconKey) => {
          setIcon(selectedIconKey);
          if (formErrors.icon) setFormErrors(prev => ({ ...prev, icon: '' }));
        }}
      />

    </div>
  );
};

export default Categories;
