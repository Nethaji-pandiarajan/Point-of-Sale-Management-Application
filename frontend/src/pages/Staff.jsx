import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { getStaff, createStaff, updateStaff, resetStaffPassword, deleteStaff } from '../services/staff';
import { Plus, Edit, Trash2, RefreshCw, X, Users, UserCheck, KeyRound, Mail, Phone, Lock, UserX } from 'lucide-react';
import AdvancedDataTable from '../components/AdvancedDataTable/AdvancedDataTable';
import './Staff.css';

const Staff = () => {
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Filters state
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Add/Edit Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null); // null = Add, object = Edit
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Reset Password Modal States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordStaff, setPasswordStaff] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Fetch Staff list
  const fetchStaffList = useCallback(async (pageNum = page) => {
    setLoading(true);
    setErrorState(null);
    try {
      const filters = {
        status: filterStatus,
        search: filterSearch
      };

      const response = await getStaff(filters, pageNum, limit);
      setStaffList(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
      setPage(response.pagination.page);
    } catch (err) {
      console.error(err);
      setErrorState('Failed to retrieve staff records. Please check connection and try again.');
      addToast('Error fetching staff members', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSearch, page, limit, addToast]);

  useEffect(() => {
    setPage(1);
    fetchStaffList(1);
  }, [filterStatus, filterSearch]);

  const handlePageChange = (pageNum) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    fetchStaffList(pageNum);
  };

  const handleCloseModal = useCallback(() => {
    if (submitting) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
    }, 240);
  }, [submitting]);

  const handleClosePasswordModal = useCallback(() => {
    if (submittingPassword) return;
    setIsPasswordModalOpen(false);
    setPasswordStaff(null);
    setNewPassword('');
    setPasswordError('');
  }, [submittingPassword]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isModalOpen && !submitting) handleCloseModal();
        if (isPasswordModalOpen && !submittingPassword) handleClosePasswordModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, submitting, isPasswordModalOpen, submittingPassword, handleCloseModal, handleClosePasswordModal]);

  const handleOpenAddModal = () => {
    setSelectedStaff(null);
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setStatus('active');
    setFormErrors({});
    setIsClosing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff) => {
    setSelectedStaff(staff);
    setName(staff.name);
    setEmail(staff.email);
    setPassword('');
    setPhone(staff.phone || '');
    setStatus(staff.status);
    setFormErrors({});
    setIsClosing(false);
    setIsModalOpen(true);
  };

  const handleOpenPasswordModal = (staff) => {
    setPasswordStaff(staff);
    setNewPassword('');
    setPasswordError('');
    setIsPasswordModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!name.trim()) errors.name = 'Staff name is required';
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Valid email address format required';
      }
    }

    if (!selectedStaff) {
      if (!password) {
        errors.password = 'Initial password is required';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!validateForm()) {
      addToast('Please resolve form errors', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (selectedStaff) {
        await updateStaff(selectedStaff.id, {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          status
        });
        addToast(`Staff member "${name.trim()}" updated successfully`, 'success');
      } else {
        await createStaff({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          status
        });
        addToast(`Waiter "${name.trim()}" created successfully`, 'success');
      }

      handleCloseModal();
      fetchStaffList(page);
    } catch (err) {
      addToast(err.message || 'Failed to save staff member details', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (submittingPassword) return;

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setSubmittingPassword(true);
    try {
      await resetStaffPassword(passwordStaff.id, newPassword);
      addToast(`Password for "${passwordStaff.name}" updated successfully`, 'success');
      handleClosePasswordModal();
    } catch (err) {
      addToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleToggleStatus = async (staff) => {
    const newStatus = staff.status === 'active' ? 'inactive' : 'active';
    try {
      await updateStaff(staff.id, { status: newStatus });
      addToast(`Staff member "${staff.name}" status changed to ${newStatus}`, 'success');
      fetchStaffList(page);
    } catch (err) {
      addToast(err.message || 'Failed to toggle status', 'error');
    }
  };

  const handleDeleteStaff = async (staff) => {
    const confirmed = await confirm({
      title: 'Remove Staff Member?',
      message: `Are you sure you want to delete waiter account for "${staff.name}"? This action cannot be undone.`,
      confirmLabel: 'Remove Account',
      cancelLabel: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      await deleteStaff(staff.id);
      addToast(`Staff member "${staff.name}" removed successfully`, 'success');
      fetchStaffList(page);
    } catch (err) {
      addToast(err.message || 'Failed to delete staff member', 'error');
    }
  };

  const getStatusBadge = (userStatus) => {
    switch (userStatus) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'blocked':
        return <Badge variant="error">Blocked</Badge>;
      default:
        return <Badge variant="secondary">{userStatus}</Badge>;
    }
  };

  // KPI Metrics Calculation
  const totalStaff = totalCount;
  const activeCount = staffList.filter(s => s.status === 'active').length;
  const inactiveCount = staffList.filter(s => s.status === 'inactive' || s.status === 'blocked').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Staff Management</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Manage restaurant waiters, service personnel accounts, and login access for Dine-In ordering
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenAddModal}>
          Add Staff Member
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div className="staff-kpi-grid">
        <div className="staff-kpi-card">
          <div className="staff-kpi-icon total">
            <Users size={22} />
          </div>
          <div className="staff-kpi-info">
            <span className="staff-kpi-value">{totalStaff}</span>
            <span className="staff-kpi-label">Total Waiters & Staff</span>
          </div>
        </div>

        <div className="staff-kpi-card">
          <div className="staff-kpi-icon active">
            <UserCheck size={22} />
          </div>
          <div className="staff-kpi-info">
            <span className="staff-kpi-value">{activeCount}</span>
            <span className="staff-kpi-label">Active Accounts</span>
          </div>
        </div>

        <div className="staff-kpi-card">
          <div className="staff-kpi-icon inactive">
            <UserX size={22} />
          </div>
          <div className="staff-kpi-info">
            <span className="staff-kpi-value">{inactiveCount}</span>
            <span className="staff-kpi-label">Inactive / Suspended</span>
          </div>
        </div>
      </div>

      {/* Staff Data Table */}
      {errorState ? (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '40px' }}>
            <p className="text-secondary" style={{ marginBottom: '16px' }}>{errorState}</p>
            <Button variant="secondary" icon={RefreshCw} onClick={() => fetchStaffList(page)}>
              Retry Fetching
            </Button>
          </CardBody>
        </Card>
      ) : (
        <AdvancedDataTable
          tableKey="staff"
          data={staffList}
          loading={loading}
          searchFields={['name', 'email', 'phone', 'status']}
          searchPlaceholder="Search waiter name, email, or phone... (Ctrl+F)"
          onRefresh={() => fetchStaffList(page)}
          emptyStateTitle="No Staff Members Found"
          emptyStateDescription="No waiter accounts match your search filters or status parameters."
          serverSide={true}
          serverTotalItems={totalCount}
          serverPage={page}
          serverLimit={limit}
          onServerPageChange={handlePageChange}
          onServerSearchChange={(val) => {
            setFilterSearch(val);
            setPage(1);
          }}
          onServerFilterChange={(newFilters) => {
            setFilterStatus(newFilters.status || '');
            setPage(1);
          }}
          filterConfigs={[
            {
              key: 'status',
              label: 'Account Status',
              type: 'select',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]
            }
          ]}
          columns={[
            {
              key: 'name',
              title: 'Staff Member',
              sortable: true,
              render: (s) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="staff-avatar-box">
                    {s.name ? s.name.charAt(0).toUpperCase() : 'W'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.925rem' }}>{s.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      ID: #{s.id}
                    </span>
                  </div>
                </div>
              )
            },
            {
              key: 'email',
              title: 'Email Address',
              sortable: true,
              render: (s) => <span style={{ fontWeight: '500' }}>{s.email}</span>
            },
            {
              key: 'phone',
              title: 'Phone Contact',
              sortable: false,
              render: (s) => <span style={{ fontSize: '0.875rem' }}>{s.phone || 'N/A'}</span>
            },
            {
              key: 'role',
              title: 'Assigned Role',
              sortable: false,
              render: () => <Badge variant="info">Waiter</Badge>
            },
            {
              key: 'status',
              title: 'Status',
              sortable: true,
              render: (s) => getStatusBadge(s.status)
            },
            {
              key: 'actions',
              title: 'Actions',
              width: '180px',
              render: (s) => (
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={KeyRound}
                    title="Reset Password"
                    onClick={() => handleOpenPasswordModal(s)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    title="Edit Staff Details"
                    onClick={() => handleOpenEditModal(s)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={s.status === 'active' ? UserX : UserCheck}
                    title={s.status === 'active' ? 'Deactivate' : 'Activate'}
                    onClick={() => handleToggleStatus(s)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    className="text-danger"
                    title="Delete Account"
                    onClick={() => handleDeleteStaff(s)}
                  />
                </div>
              )
            }
          ]}
        />
      )}

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className={`staff-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleCloseModal}>
          <div className={`staff-modal-container ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="staff-modal-header">
              <div>
                <h3 className="staff-modal-title">
                  {selectedStaff ? 'Edit Staff Details' : 'Add Staff Member'}
                </h3>
                <p className="staff-modal-subtitle">
                  Configure waiter account identity and login credentials
                </p>
              </div>
              <button
                type="button"
                className="staff-modal-close-btn"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit}>
              <div className="staff-modal-body">
                <Input
                  label="Full Name *"
                  placeholder="e.g. Marco Ross"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                  }}
                  error={formErrors.name}
                  icon={Users}
                  disabled={submitting}
                  required
                />

                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="marco.waiter@saleiz.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                  }}
                  error={formErrors.email}
                  icon={Mail}
                  disabled={submitting}
                  required
                />

                {!selectedStaff && (
                  <Input
                    label="Initial Account Password *"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formErrors.password) setFormErrors(prev => ({ ...prev, password: '' }));
                    }}
                    error={formErrors.password}
                    icon={Lock}
                    disabled={submitting}
                    required
                  />
                )}

                <Input
                  label="Phone Contact (Optional)"
                  placeholder="+1 555-0100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  icon={Phone}
                  disabled={submitting}
                />

                <div className="staff-status-toggle">
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', flexGrow: 1 }}>
                    Account Login Status
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      type="button"
                      variant={status === 'active' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setStatus('active')}
                      disabled={submitting}
                    >
                      Active
                    </Button>
                    <Button
                      type="button"
                      variant={status === 'inactive' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setStatus('inactive')}
                      disabled={submitting}
                    >
                      Inactive
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="staff-modal-footer">
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
                >
                  {selectedStaff ? 'Save Changes' : 'Create Staff Member'}
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isPasswordModalOpen && passwordStaff && (
        <div className="staff-modal-overlay" onClick={handleClosePasswordModal}>
          <div className="staff-modal-container" onClick={(e) => e.stopPropagation()}>
            
            <div className="staff-modal-header">
              <div>
                <h3 className="staff-modal-title">Reset Staff Password</h3>
                <p className="staff-modal-subtitle">
                  Set a new password for <strong>{passwordStaff.name}</strong> ({passwordStaff.email})
                </p>
              </div>
              <button
                type="button"
                className="staff-modal-close-btn"
                onClick={handleClosePasswordModal}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordResetSubmit}>
              <div className="staff-modal-body">
                <Input
                  label="New Password *"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  error={passwordError}
                  icon={Lock}
                  disabled={submittingPassword}
                  required
                />
              </div>

              <div className="staff-modal-footer">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClosePasswordModal}
                  disabled={submittingPassword}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submittingPassword}
                >
                  Update Password
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Staff;
