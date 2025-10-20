import { API_BASE_URL, API_BASE_PATH } from '../config';
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [usernameFilter, setUsernameFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: ''
  });

  const API_BASE = `${API_BASE_URL}/users`;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers();
      if (response.success) {
        setUsers(response.data);
        setFilteredUsers(response.data);
      }
    } catch (error) {
      alert('Error loading users. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search criteria
  const filterUsers = useCallback(() => {
    let filtered = users;

    // Filter by username
    if (usernameFilter) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(usernameFilter.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter) {
      filtered = filtered.filter(user =>
        user.role.toLowerCase().includes(roleFilter.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [users, usernameFilter, roleFilter]);

  // Apply filters when users or filter criteria change
  useEffect(() => {
    filterUsers();
  }, [users, usernameFilter, roleFilter, filterUsers]);

  // Pagination functions
  const getPaginatedUsers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredUsers.length / itemsPerPage);
  };

  // Handle add user
  const handleAddUser = () => {
    setFormData({ username: '', password: '', role: '' });
    setShowAddModal(true);
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't show existing password
      role: user.role
    });
    setShowEditModal(true);
  };

  // Handle soft delete user
  const handleSoftDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      try {
        const response = await fetch(`${API_BASE}/soft_delete.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: userId }),
        });

        const result = await response.json();

        if (result.success) {
          await fetchUsers(); // Refresh the users list
          alert('User deleted successfully!');
        } else {
          alert('Failed to delete user: ' + result.message);
        }
      } catch (error) {
        alert('Error deleting user. Please try again.');
      }
    }
  };

  // Handle submit edit
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.role.trim()) {
      alert('Username and Role are required fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/update.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingUser.id,
          username: formData.username.trim(),
          role: formData.role.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchUsers(); // Refresh the users list
        setShowEditModal(false);
        setEditingUser(null);
        setFormData({ username: '', password: '', role: '' });
        alert('User updated successfully!');
      } else {
        alert('Failed to update user: ' + result.message);
      }
    } catch (error) {
      alert('Error updating user. Please try again.');
    }
  };

  // Handle submit add
  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim() || !formData.role.trim()) {
      alert('Username, Password, and Role are required fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/create.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password.trim(),
          role: formData.role.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchUsers(); // Refresh the users list
        setShowAddModal(false);
        setFormData({ username: '', password: '', role: '' });
        alert('User added successfully!');
      } else {
        alert('Failed to add user: ' + result.message);
      }
    } catch (error) {
      alert('Error adding user. Please try again.');
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingUser(null);
    setFormData({ username: '', password: '', role: '' });
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getRoleBadge = (role) => {
    const className = `role-badge ${role.toLowerCase().replace(' ', '-')}`;
    return <span className={className}>{role}</span>;
  };

  return (
    <div className="user-management-page">
      <div className="page-header">
        <h1>User Management</h1>
        <button className="btn btn-primary" onClick={handleAddUser}>
          <span className="material-icons">add</span>
          Add User
        </button>
      </div>

      <div className="search-filters">
        <div className="search-row">
          <div className="search-field">
            <label>Username</label>
            <input
              type="text"
              placeholder="Search by username..."
              value={usernameFilter}
              onChange={(e) => setUsernameFilter(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="search-field">
            <label>Role</label>
            <input
              type="text"
              placeholder="Search by role..."
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '15px'}}>
          <button
            onClick={() => {
              setUsernameFilter('');
              setRoleFilter('');
            }}
            className="clear-all-btn"
            title="Reset all search filters"
            style={{
              backgroundColor: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            <span className="material-icons" style={{fontSize: '18px'}}>refresh</span>
          </button>
        </div>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Role</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  <h3>Loading...</h3>
                  <p>Please wait while we load your users.</p>
                </td>
              </tr>
            ) : filteredUsers.length > 0 ? (
              getPaginatedUsers().map((user, index) => (
                <tr key={user.id}>
                  <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td>{user.username}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-action btn-success"
                      title="Edit User"
                      onClick={() => handleEditUser(user)}
                    >
                      <span className="material-icons">edit</span>
                    </button>
                    <button
                      className="btn btn-action btn-danger"
                      title="Delete User"
                      onClick={() => handleSoftDeleteUser(user.id, user.username)}
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-state">
                  <h3>No Users Found</h3>
                  <p>No users match your search criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls">
        <div className="pagination-left">
          <div className="pagination-info">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
          </div>
          <div className="items-per-page-selector">
            <label>Items per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="items-per-page-filter"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={100}>100</option>
              <option value={9999}>All</option>
            </select>
          </div>
        </div>
        {getTotalPages() > 1 && itemsPerPage < 9999 && (
          <div className="pagination-buttons">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="btn btn-sm btn-secondary"
            >
              ≪
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-sm btn-secondary"
            >
              ‹
            </button>
            <span className="page-info">
              Page {currentPage} of {getTotalPages()}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === getTotalPages()}
              className="btn btn-sm btn-secondary"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(getTotalPages())}
              disabled={currentPage === getTotalPages()}
              className="btn btn-sm btn-secondary"
            >
              ≫
            </button>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitAdd}>
              <div className="form-group">
                <label htmlFor="add-username">
                  Username <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="add-username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="add-password">
                  Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="add-password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="add-role">
                  Role <span className="required">*</span>
                </label>
                <select
                  id="add-role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Cashier">Cashier</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <span className="material-icons">add</span>
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className="form-group">
                <label htmlFor="edit-username">
                  Username <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="edit-username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-role">
                  Role <span className="required">*</span>
                </label>
                <select
                  id="edit-role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Cashier">Cashier</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <span className="material-icons">save</span>
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;