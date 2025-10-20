import React, { useState, useEffect, useCallback } from 'react';
import './CustomerManagement.css';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [nameFilter, setNameFilter] = useState('');
  const [mobileFilter, setMobileFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '' // Optional field
  });

  // API base URL
  const API_BASE = 'http://localhost/Afkar%20New/api/customers';

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/read.php`);
      const result = await response.json();

      if (result.success) {
        setCustomers(result.data || []);
        setFilteredCustomers(result.data || []);
      } else {
        console.error('Failed to fetch customers:', result.message);
        alert('Failed to load customers. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      alert('Error loading customers. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Filter customers based on search criteria
  const filterCustomers = useCallback(() => {
    let filtered = customers;

    // Filter by name
    if (nameFilter) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    // Filter by mobile
    if (mobileFilter) {
      filtered = filtered.filter(customer =>
        customer.mobile.includes(mobileFilter)
      );
    }

    // Filter by address
    if (addressFilter) {
      filtered = filtered.filter(customer =>
        (customer.address || '').toLowerCase().includes(addressFilter.toLowerCase())
      );
    }

    setFilteredCustomers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [customers, nameFilter, mobileFilter, addressFilter]);

  // Load customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Apply filters when customers or filter criteria change
  useEffect(() => {
    filterCustomers();
  }, [customers, nameFilter, mobileFilter, addressFilter, filterCustomers]);

  // Pagination functions
  const getPaginatedCustomers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCustomers.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredCustomers.length / itemsPerPage);
  };

  const handleAddCustomer = () => {
    setFormData({ name: '', mobile: '', address: '' });
    setShowAddModal(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      mobile: customer.mobile,
      address: customer.address || '' // Handle cases where address might be null
    });
    setShowEditModal(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim()) {
      alert('Name and Mobile are required fields');
      return;
    }

    // Client-side check for duplicate mobile number
    const isDuplicateMobile = customers.some(customer =>
      customer.mobile === formData.mobile.trim()
    );

    if (isDuplicateMobile) {
      alert('This mobile number already exists. Please use a different mobile number.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/create.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          mobile: formData.mobile.trim(),
          address: formData.address.trim() || ''
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchCustomers(); // Refresh the customer list
        setShowAddModal(false);
        setFormData({ name: '', mobile: '', address: '' });
        alert('Customer added successfully!');
      } else {
        alert('Failed to add customer: ' + result.message);
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Error adding customer. Please try again.');
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim()) {
      alert('Name and Mobile are required fields');
      return;
    }

    // Client-side check for duplicate mobile number (excluding current customer)
    const isDuplicateMobile = customers.some(customer =>
      customer.mobile === formData.mobile.trim() && customer.id !== editingCustomer.id
    );

    if (isDuplicateMobile) {
      alert('This mobile number already exists. Please use a different mobile number.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/update.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingCustomer.id,
          name: formData.name.trim(),
          mobile: formData.mobile.trim(),
          address: formData.address.trim() || ''
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchCustomers(); // Refresh the customer list
        setShowEditModal(false);
        setEditingCustomer(null);
        setFormData({ name: '', mobile: '', address: '' });
        alert('Customer updated successfully!');
      } else {
        alert('Failed to update customer: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Error updating customer. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingCustomer(null);
    setFormData({ name: '', mobile: '', address: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="customer-management-page">
      <div className="page-header">
        <h1>Customer Management</h1>
        <button className="btn btn-primary" onClick={handleAddCustomer}>
          <span className="material-icons">add</span>
          Add Customer
        </button>
      </div>

      <div className="search-filters">
        <div className="search-row">
          <div className="search-field">
            <label>Name</label>
            <input
              type="text"
              placeholder="Search by name..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="search-field">
            <label>Mobile</label>
            <input
              type="text"
              placeholder="Search by mobile..."
              value={mobileFilter}
              onChange={(e) => setMobileFilter(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="search-field">
            <label>Address</label>
            <input
              type="text"
              placeholder="Search by address..."
              value={addressFilter}
              onChange={(e) => setAddressFilter(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="search-actions">
            <button
              onClick={() => {
                setNameFilter('');
                setMobileFilter('');
                setAddressFilter('');
              }}
              className="btn btn-secondary clear-search-btn"
              title="Clear all search filters"
            >
              <span className="material-icons">refresh</span>
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="customers-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  <h3>Loading...</h3>
                  <p>Please wait while we load your customers.</p>
                </td>
              </tr>
            ) : customers.length > 0 ? (
              getPaginatedCustomers().map((customer, index) => (
                <tr key={customer.id}>
                  <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td>{customer.name}</td>
                  <td>{customer.mobile}</td>
                  <td>{customer.address || 'N/A'}</td>
                  <td>
                    <button
                      className="btn btn-action btn-success"
                      title="Edit Customer"
                      onClick={() => handleEditCustomer(customer)}
                    >
                      <span className="material-icons">edit</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-state">
                  <h3>No Customers Found</h3>
                  <p>No customers have been added to the system yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls">
        <div className="pagination-left">
          <div className="pagination-info">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
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

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Customer</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitAdd}>
              <div className="form-group">
                <label htmlFor="name">
                  Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="mobile">
                  Mobile <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="Enter mobile number"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">
                  Address <span className="optional">(Optional)</span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter address (optional)"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <span className="material-icons">add</span>
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Customer</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className="form-group">
                <label htmlFor="edit-name">
                  Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-mobile">
                  Mobile <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  id="edit-mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="Enter mobile number"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-address">
                  Address <span className="optional">(Optional)</span>
                </label>
                <textarea
                  id="edit-address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter address (optional)"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <span className="material-icons">save</span>
                  Update Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;