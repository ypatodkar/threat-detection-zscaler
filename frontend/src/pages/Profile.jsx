import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCamera } from 'react-icons/fa';
import './Profile.css';

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      const headers = { 'x-user-id': userId };
      const response = await axios.get('http://localhost:3001/auth/profile', { headers });

      if (response.data.success) {
        setUserData(response.data.user);
        setEditForm({
          name: response.data.user.name || '',
          email: response.data.user.email || ''
        });
      } else {
        setError(response.data.error || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: userData?.name || '',
      email: userData?.email || ''
    });
    setProfilePicture(null);
  };

  const handleSave = async () => {
    try {
      setUploading(true);
      const userId = localStorage.getItem('userId');
      const headers = { 'x-user-id': userId };

      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('email', editForm.email);
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      const response = await axios.put('http://localhost:3001/auth/profile', formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setUserData(response.data.user);
        setIsEditing(false);
        setProfilePicture(null);
        // Update localStorage
        if (response.data.user.name) {
          localStorage.setItem('name', response.data.user.name);
        }
        if (response.data.user.email) {
          localStorage.setItem('email', response.data.user.email);
        }
        if (response.data.user.profilePicture) {
          localStorage.setItem('profilePicture', response.data.user.profilePicture);
        }
        // Refresh page to update profile icon
        window.location.reload();
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only image files are allowed (jpeg, jpg, png, gif, webp)');
        return;
      }
      setProfilePicture(file);
      setError('');
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-error">{error}</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-page">
        <div className="profile-error">No user data available</div>
      </div>
    );
  }

  const getProfileImage = () => {
    if (userData?.profilePicture) {
      return `http://localhost:3001${userData.profilePicture}`;
    }
    return null;
  };

  const getInitials = () => {
    if (userData?.name) {
      return userData.name.charAt(0).toUpperCase();
    }
    return userData?.username?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-container">
            {isEditing ? (
              <div className="profile-avatar-edit">
                <label htmlFor="profile-picture-upload" className="avatar-upload-label">
                  {profilePicture ? (
                    <img 
                      src={URL.createObjectURL(profilePicture)} 
                      alt="Preview" 
                      className="avatar-preview"
                    />
                  ) : getProfileImage() ? (
                    <img 
                      src={getProfileImage()} 
                      alt="Profile" 
                      className="avatar-preview"
                    />
                  ) : (
                    <div className="profile-avatar">{getInitials()}</div>
                  )}
                  <div className="avatar-upload-overlay">
                    <span><FaCamera /></span>
                    <span>Change Photo</span>
                  </div>
                </label>
                <input
                  id="profile-picture-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div className="profile-avatar">
                {getProfileImage() ? (
                  <img src={getProfileImage()} alt="Profile" />
                ) : (
                  <span>{getInitials()}</span>
                )}
              </div>
            )}
          </div>
          <h2>User Profile</h2>
          {!isEditing && (
            <button onClick={handleEdit} className="edit-profile-button">
              Edit Profile
            </button>
          )}
        </div>

        <div className="profile-details">
          {error && <div className="profile-error-message">{error}</div>}
          
          <div className="profile-section">
            <h3>Account Information</h3>
            <div className="profile-field">
              <label>Username</label>
              <div className="profile-value">{userData.username}</div>
            </div>
            <div className="profile-field">
              <label>Name</label>
              {isEditing ? (
                <input
                  type="text"
                  className="profile-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter your name"
                />
              ) : (
                <div className="profile-value">
                  {userData.name || <span className="no-value">Not set</span>}
                </div>
              )}
            </div>
            <div className="profile-field">
              <label>Email</label>
              {isEditing ? (
                <input
                  type="email"
                  className="profile-input"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="your.email@example.com"
                />
              ) : (
                <div className="profile-value">
                  {userData.email || <span className="no-email">Not provided</span>}
                </div>
              )}
            </div>
            <div className="profile-field">
              <label>User ID</label>
              <div className="profile-value">{userData.id}</div>
            </div>
            <div className="profile-field">
              <label>Member Since</label>
              <div className="profile-value">
                {new Date(userData.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>Statistics</h3>
            <div className="profile-field">
              <label>Total Logs Uploaded</label>
              <div className="profile-value profile-stat">{userData.totalLogs}</div>
            </div>
          </div>

          {isEditing && (
            <div className="profile-actions">
              <button 
                onClick={handleSave} 
                className="save-button"
                disabled={uploading}
              >
                {uploading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={handleCancel} 
                className="cancel-button"
                disabled={uploading}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;

