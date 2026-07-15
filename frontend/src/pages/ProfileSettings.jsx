import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import useToast from '../hooks/useToast';
import useAuth from '../hooks/useAuth';
import { getProfile, updateProfile, changePassword, getRestaurantSettings, updateRestaurantSettings } from '../services/admin';
import { User, Store, ShieldAlert, KeyRound, Mail, Phone, Clock, MapPin, Camera } from 'lucide-react';
import './ProfileSettings.css';

const ProfileSettings = () => {
  const { addToast } = useToast();
  const { logout } = useAuth();
  
  // Tab State
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password' | 'settings'
  const [loading, setLoading] = useState(true);

  // Tab 1: Profile State
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [profileErrors, setProfileErrors] = useState({});
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Tab 2: Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Tab 3: Restaurant Settings State
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [restaurantPhone, setRestaurantPhone] = useState('');
  const [restaurantHours, setRestaurantHours] = useState('');
  const [settingsErrors, setSettingsErrors] = useState({});
  const [submittingSettings, setSubmittingSettings] = useState(false);

  // Load Settings on mount
  useEffect(() => {
    const loadAllSettings = async () => {
      setLoading(true);
      try {
        const [profile, settings] = await Promise.all([
          getProfile(),
          getRestaurantSettings()
        ]);
        
        // Populate profile
        setAdminName(profile.name);
        setAdminEmail(profile.email);
        setAdminPhone(profile.phone || '');

        // Populate settings
        setRestaurantName(settings.name);
        setRestaurantAddress(settings.address);
        setRestaurantPhone(settings.phone);
        setRestaurantHours(settings.hours);
      } catch (err) {
        addToast('Failed to fetch settings from server', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadAllSettings();
  }, [addToast]);

  // Tab 1 Validate & Save Profile
  const validateProfile = () => {
    const errors = {};
    if (!adminName.trim()) errors.name = 'Profile name is required';
    if (!adminEmail.trim()) {
      errors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(adminEmail)) {
        errors.email = 'Please provide a valid email format';
      }
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (submittingProfile) return;

    if (!validateProfile()) {
      addToast('Please resolve profile errors', 'warning');
      return;
    }

    setSubmittingProfile(true);
    try {
      const updated = await updateProfile({
        name: adminName,
        email: adminEmail,
        phone: adminPhone
      });
      addToast('Admin profile details updated successfully', 'success');
      
      // Update global user values if needed (normally done via re-authenticating or context state syncing, local update suffices here)
      const cachedSession = localStorage.getItem('saleiz_user') ? localStorage : sessionStorage;
      const userObj = JSON.parse(cachedSession.getItem('saleiz_user') || '{}');
      cachedSession.setItem('saleiz_user', JSON.stringify({ ...userObj, name: updated.name, email: updated.email }));
    } catch (err) {
      addToast(err.message || 'Failed to update admin profile', 'error');
    } finally {
      setSubmittingProfile(false);
    }
  };

  // Tab 2 Validate & Change Password
  const validatePassword = () => {
    const errors = {};
    if (!currentPassword) errors.currentPassword = 'Current password is required';
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirmation password is required';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'New password fields do not match';
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (submittingPassword) return;

    if (!validatePassword()) {
      addToast('Mismatched password details', 'warning');
      return;
    }

    setSubmittingPassword(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      addToast('Password updated successfully. Logging out... Please log in with your new password.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
      
      // Delay logout slightly so the user sees the success toast message
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (err) {
      addToast(err.message || 'Change password failed. Verify current credentials.', 'error');
    } finally {
      setSubmittingPassword(false);
    }
  };

  // Tab 3 Validate & Save Restaurant settings
  const validateSettings = () => {
    const errors = {};
    if (!restaurantName.trim()) errors.restaurantName = 'Restaurant name is required';
    if (!restaurantAddress.trim()) errors.restaurantAddress = 'Operating location address is required';
    if (!restaurantPhone.trim()) errors.restaurantPhone = 'Contact phone is required';
    if (!restaurantHours.trim()) errors.restaurantHours = 'Store hours are required';
    
    setSettingsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (submittingSettings) return;

    if (!validateSettings()) {
      addToast('Complete all settings requirements', 'warning');
      return;
    }

    setSubmittingSettings(true);
    try {
      await updateRestaurantSettings({
        name: restaurantName,
        address: restaurantAddress,
        phone: restaurantPhone,
        hours: restaurantHours
      });
      addToast('Restaurant configuration settings saved successfully', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update store settings', 'error');
    } finally {
      setSubmittingSettings(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="profile-settings-container">
      
      {/* Dynamic tab togglers */}
      <div className="settings-tabs-header">
        <button
          className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Admin Profile
        </button>
        <button
          className={`settings-tab-btn ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          Change Password
        </button>
        <button
          className={`settings-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Restaurant Settings
        </button>
      </div>

      {/* Tab 1: Profile details Card */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile}>
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Coordinate login profile identities</CardDescription>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Photo Upload layout details */}
              <div className="photo-upload-section">
                <div className="avatar-circle-placeholder">
                  {adminName ? adminName.charAt(0) : 'A'}
                </div>
                <div className="avatar-upload-info">
                  <h4>Profile Image</h4>
                  <p>PNG or JPG formats up to 2MB. Camera triggers will link to backend files.</p>
                  <Button variant="ghost" size="sm" icon={Camera} style={{ marginTop: '6px' }} onClick={() => addToast('Media upload currently disabled.', 'info')}>
                    Upload Photo
                  </Button>
                </div>
              </div>

              <div className="profile-form-grid">
                <Input
                  label="Administrator Name"
                  placeholder="e.g. Alex"
                  value={adminName}
                  onChange={(e) => {
                    setAdminName(e.target.value);
                    if (profileErrors.name) setProfileErrors(prev => ({ ...prev, name: '' }));
                  }}
                  error={profileErrors.name}
                  icon={User}
                  disabled={submittingProfile}
                  required
                />
                <Input
                  label="Account Email address"
                  type="email"
                  placeholder="admin@saleiz.com"
                  value={adminEmail}
                  onChange={(e) => {
                    setAdminEmail(e.target.value);
                    if (profileErrors.email) setProfileErrors(prev => ({ ...prev, email: '' }));
                  }}
                  error={profileErrors.email}
                  icon={Mail}
                  disabled={submittingProfile}
                  required
                />
              </div>

              <Input
                label="Contact Phone (Optional)"
                placeholder="+1 555-0100"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                icon={Phone}
                disabled={submittingProfile}
              />
            </CardBody>
            <CardFooter>
              <Button type="submit" variant="primary" isLoading={submittingProfile}>
                Save Profile
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* Tab 2: Change password Card */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword}>
          <Card>
            <CardHeader>
              <CardTitle>Change Login Password</CardTitle>
              <CardDescription>Revalidate credentials to secure the restaurant system</CardDescription>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '480px' }}>
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (passwordErrors.currentPassword) setPasswordErrors(prev => ({ ...prev, currentPassword: '' }));
                }}
                error={passwordErrors.currentPassword}
                icon={KeyRound}
                disabled={submittingPassword}
                required
              />
              
              <hr style={{ border: '0', height: '1px', backgroundColor: 'var(--color-border)' }} />
              
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordErrors.newPassword) setPasswordErrors(prev => ({ ...prev, newPassword: '' }));
                }}
                error={passwordErrors.newPassword}
                icon={KeyRound}
                disabled={submittingPassword}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordErrors.confirmPassword) setPasswordErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
                error={passwordErrors.confirmPassword}
                icon={ShieldAlert}
                disabled={submittingPassword}
                required
              />
            </CardBody>
            <CardFooter>
              <Button type="submit" variant="primary" isLoading={submittingPassword}>
                Update Password
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* Tab 3: Restaurant Settings Card */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings}>
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Settings</CardTitle>
              <CardDescription>Identity parameters showing on bills, receipts, and menus</CardDescription>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="profile-form-grid">
                <Input
                  label="Restaurant Name"
                  placeholder="e.g. Saleiz Gourmet"
                  value={restaurantName}
                  onChange={(e) => {
                    setRestaurantName(e.target.value);
                    if (settingsErrors.restaurantName) setSettingsErrors(prev => ({ ...prev, restaurantName: '' }));
                  }}
                  error={settingsErrors.restaurantName}
                  icon={Store}
                  disabled={submittingSettings}
                  required
                />
                <Input
                  label="Business Contact Phone"
                  placeholder="+1 555-0100"
                  value={restaurantPhone}
                  onChange={(e) => {
                    setRestaurantPhone(e.target.value);
                    if (settingsErrors.restaurantPhone) setSettingsErrors(prev => ({ ...prev, restaurantPhone: '' }));
                  }}
                  error={settingsErrors.restaurantPhone}
                  icon={Phone}
                  disabled={submittingSettings}
                  required
                />
              </div>

              <Input
                label="Business Address location"
                placeholder="123 Culinary Boulevard"
                value={restaurantAddress}
                onChange={(e) => {
                  setRestaurantAddress(e.target.value);
                  if (settingsErrors.restaurantAddress) setSettingsErrors(prev => ({ ...prev, restaurantAddress: '' }));
                }}
                error={settingsErrors.restaurantAddress}
                icon={MapPin}
                disabled={submittingSettings}
                required
              />

              <Input
                label="Operating hours"
                placeholder="Mon-Sun: 9:00 AM - 10:00 PM"
                value={restaurantHours}
                onChange={(e) => {
                  setRestaurantHours(e.target.value);
                  if (settingsErrors.restaurantHours) setSettingsErrors(prev => ({ ...prev, restaurantHours: '' }));
                }}
                error={settingsErrors.restaurantHours}
                icon={Clock}
                disabled={submittingSettings}
                required
              />
            </CardBody>
            <CardFooter>
              <Button type="submit" variant="primary" isLoading={submittingSettings}>
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

    </div>
  );
};

export default ProfileSettings;
