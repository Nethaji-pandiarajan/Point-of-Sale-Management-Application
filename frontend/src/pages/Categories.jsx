import React, { useState, useEffect, useCallback, useRef } from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardBody } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categories';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import IconPickerModal from '../components/ui/IconPickerModal';
import { getIconEmoji, getIconLabel } from '../utils/icons';

const Categories = () => {
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Open Modal Helpers
  const handleOpenAddModal = () => {
    setSelectedCategory(null);
    setName('');
    setDescription('');
    setIcon('salad');
    setStatus('active');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setSelectedCategory(cat);
    setName(cat.name);
    setDescription(cat.description);
    setIcon(cat.icon);
    setStatus(cat.status);
    setFormErrors({});
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
      setIsModalOpen(false);
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

      {/* Primary listings block */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spinner size="lg" />
        </div>
      ) : errorState ? (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '40px' }}>
            <p className="text-secondary" style={{ marginBottom: '16px' }}>{errorState}</p>
            <Button variant="secondary" icon={RefreshCw} onClick={fetchCategoriesList}>
              Retry Fetching
            </Button>
          </CardBody>
        </Card>
      ) : categories.length === 0 ? (
        <EmptyState
          title="No Categories Available"
          description="Create custom groups to organize your food and beverage menu list."
          icon={Plus}
          actionLabel="Add First Category"
          onActionClick={handleOpenAddModal}
        />
      ) : (
        <Card>
          <CardBody style={{ padding: '0px' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: '80px', textAlign: 'center' }}>Icon</TableHead>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead style={{ textAlign: 'center' }}>Products Count</TableHead>
                  <TableHead style={{ textAlign: 'center' }}>Status</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell style={{ fontSize: '1.6rem', textAlign: 'center' }}>
                      {getIconEmoji(cat.icon)}
                    </TableCell>
                    <TableCell style={{ fontWeight: '600' }}>
                      {cat.name}
                    </TableCell>
                    <TableCell style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                      {cat.description || 'No description provided.'}
                    </TableCell>
                    <TableCell style={{ textAlign: 'center', fontWeight: '500' }}>
                      {cat.productCount || 0}
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Badge variant={cat.status === 'active' ? 'success' : 'secondary'}>
                        {cat.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
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
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          className="text-danger"
                          onClick={() => handleDeleteCategory(cat)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Add / Edit Category Dialog Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCategory ? 'Edit Menu Category' : 'Add Menu Category'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleFormSubmit} isLoading={submitting}>
              {selectedCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Large Card Icon Picker Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>Category Icon *</label>
            <button
              ref={iconPickerButtonRef}
              type="button"
              className="icon-picker-large-card"
              onClick={() => setIsPickerOpen(true)}
              disabled={submitting}
              onMouseEnter={(e) => { if (!submitting) { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.backgroundColor = 'var(--color-primary-light)'; } }}
              onMouseLeave={(e) => { if (!submitting) { e.currentTarget.style.borderColor = formErrors.icon ? 'var(--color-error)' : 'var(--color-border)'; e.currentTarget.style.backgroundColor = 'var(--color-surface)'; } }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(183, 28, 28, 0.1)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = formErrors.icon ? 'var(--color-error)' : 'var(--color-border)'; }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '20px',
                border: formErrors.icon ? '2px dashed var(--color-error)' : '2px dashed var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface)',
                cursor: submitting ? 'not-allowed' : 'pointer',
                width: '100%',
                outline: 'none',
                minHeight: '110px',
                fontFamily: 'var(--font-body)',
                transition: 'all var(--transition-fast)'
              }}
            >
              {icon ? (
                <>
                  <span style={{ fontSize: '2.8rem', lineHeight: 1 }}>{getIconEmoji(icon)}</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.95rem' }}>
                    {getIconLabel(icon)}
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '2rem', color: 'var(--color-text-light)' }}>🍽️</span>
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: '500', fontSize: '0.875rem' }}>
                    Click to choose category icon
                  </span>
                </>
              )}
            </button>
            {formErrors.icon && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{formErrors.icon}</span>
            )}
          </div>

          <Input
            label="Category Name"
            placeholder="e.g. Pasta dishes"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
            }}
            error={formErrors.name}
            disabled={submitting}
            required
            className="w-full"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Description</label>
            <textarea
              placeholder="Short description of items in this category"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                padding: '10px 14px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                minHeight: '80px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <Select
            label="Publishing Status"
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={submitting}
          />
        </form>
      </Modal>

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
