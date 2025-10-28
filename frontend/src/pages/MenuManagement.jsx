import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_PATH } from '../config';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import api from '../api';
import './MenuManagement.css';

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_path: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, [selectedCategory, currentPage, itemsPerPage]);

  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getMenuItems(selectedCategory, '', currentPage, itemsPerPage);
      if (response.success) {
        setMenuItems(response.data);
        setPagination(response.pagination);
      } else {
        toast.error('Failed to load menu items');
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Error loading menu items');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, currentPage, itemsPerPage, toast]);

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories();
      if (response.success) {
        setCategories(response.data);
      } else {
        toast.error('Failed to load categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error loading categories');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      let imagePath = newItem.image_path;

      // Upload image if selected
      if (selectedImage) {
        const uploadResponse = await api.uploadMenuImage(selectedImage);
        if (uploadResponse.success) {
          imagePath = uploadResponse.image_path;
        } else {
          toast.error('Error uploading image: ' + uploadResponse.message);
          return;
        }
      }

      const itemToCreate = { ...newItem, image_path: imagePath };
      const response = await api.createMenuItem(itemToCreate);

      if (response.success) {
        toast.success('Menu item added successfully');
        setShowAddItemModal(false);
        setNewItem({
          name: '',
          description: '',
          price: '',
          category_id: '',
          image_path: ''
        });
        setSelectedImage(null);
        setImagePreview('');
        fetchMenuItems();
      } else {
        toast.error('Error adding menu item: ' + response.message);
      }
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast.error('Error adding menu item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const response = await api.createCategory(newCategory);
      if (response.success) {
        toast.success('Category added successfully');
        setShowAddCategoryModal(false);
        setNewCategory({ name: '' });
        fetchCategories();
      } else {
        toast.error('Error adding category: ' + response.message);
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Error adding category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      category_id: item.category_id,
      image_path: item.image_path || ''
    });
    setImagePreview(item.image_path ? `${API_BASE_PATH}/${item.image_path}` : '');
    setShowEditModal(true);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      let imagePath = editingItem.image_path;

      // Upload new image if selected
      if (selectedImage) {
        const uploadResponse = await api.uploadMenuImage(selectedImage);
        if (uploadResponse.success) {
          imagePath = uploadResponse.image_path;
        } else {
          toast.error('Error uploading image: ' + uploadResponse.message);
          return;
        }
      }

      const itemToUpdate = { ...editingItem, image_path: imagePath };
      const response = await api.updateMenuItem(itemToUpdate);

      if (response.success) {
        toast.success('Menu item updated successfully');
        setShowEditModal(false);
        setEditingItem(null);
        setSelectedImage(null);
        setImagePreview('');
        fetchMenuItems();
      } else {
        toast.error('Error updating menu item: ' + response.message);
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast.error('Error updating menu item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = parseInt(currentStatus) === 1 ? 0 : 1;
      const response = await api.toggleMenuItemStatus(id, newStatus);

      if (response.success) {
        toast.success(response.message);
        fetchMenuItems();
      } else {
        toast.error('Error updating status: ' + response.message);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    }
  };

  const handleSoftDelete = async (id, itemName) => {
    if (window.confirm(`Are you sure you want to delete "${itemName}"? This action can be undone.`)) {
      try {
        const response = await api.softDeleteMenuItem(id, 1);

        if (response.success) {
          toast.success(response.message);
          fetchMenuItems();
        } else {
          toast.error('Error deleting item: ' + response.message);
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Error deleting item');
      }
    }
  };

  return (
    <div className="menu-management">
      {(loading || submitting) && <Spinner overlay={true} />}
      <div className="page-header">
        <h1>Menu Management</h1>
        <div className="header-actions">
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="btn btn-dark-gray"
          >
            <span className="material-icons">category</span>
            Add Category
          </button>
          <button
            onClick={() => setShowAddItemModal(true)}
            className="btn btn-dark-blue"
          >
            <span className="material-icons">add</span>
            Add Menu Item
          </button>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1); // Reset to first page when filtering
            }}
            className="category-filter"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="menu-items-table">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Description</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map(item => (
              <tr key={item.id}>
                <td>
                  {item.image_path ? (
                    <img
                      src={`${API_BASE_PATH}/${item.image_path}`}
                      alt={item.name}
                      className="menu-item-image"
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </td>
                <td>{item.name}</td>
                <td>{item.category_name}</td>
                <td>{item.description}</td>
                <td>{item.price}</td>
                <td>
                  <button
                    className={`status-toggle-btn ${item.is_active == 1 ? 'status-active' : 'status-inactive'}`}
                    title={item.is_active == 1 ? 'Click to Deactivate' : 'Click to Activate'}
                    onClick={() => handleToggleStatus(item.id, item.is_active)}
                  >
                    {item.is_active == 1 ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td>
                  <button
                    className="btn btn-action btn-success"
                    title="Edit Item"
                    onClick={() => handleEditItem(item)}
                  >
                    <span className="material-icons">edit</span>
                  </button>
                  <button
                    className="btn btn-action btn-danger"
                    title="Delete Item"
                    onClick={() => handleSoftDelete(item.id, item.name)}
                  >
                    <span className="material-icons">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls">
        <div className="pagination-left">
          {pagination && (
            <div className="pagination-info">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.total_records)} of {pagination.total_records} items
            </div>
          )}
          <div className="items-per-page-selector">
            <label>Items per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1); // Reset to first page when changing limit
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
        {pagination && pagination.total_pages > 1 && itemsPerPage < 9999 && (
          <div className="pagination-buttons">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="btn btn-sm btn-secondary"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!pagination.has_prev}
              className="btn btn-sm btn-secondary"
            >
              Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {pagination.total_pages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!pagination.has_next}
              className="btn btn-sm btn-secondary"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(pagination.total_pages)}
              disabled={currentPage === pagination.total_pages}
              className="btn btn-sm btn-secondary"
            >
              Last
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        title="Add Menu Item"
      >
        <form onSubmit={handleAddItem}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({...newItem, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              value={newItem.category_id}
              onChange={(e) => setNewItem({...newItem, category_id: e.target.value})}
              required
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              value={newItem.description}
              onChange={(e) => setNewItem({...newItem, description: e.target.value})}
              rows={3}
              placeholder="Enter item description (optional)"
            />
          </div>
          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              step="0.01"
              value={newItem.price}
              onChange={(e) => setNewItem({...newItem, price: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Image</label>
            <div className="image-upload-container">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="image-upload-input"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="image-upload-btn">
                <span className="material-icons">cloud_upload</span>
                <span className="upload-text">
                  {selectedImage ? 'Change Image' : 'Choose Image'}
                </span>
              </label>
              {imagePreview && (
                <div className="image-preview-container">
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" className="preview-image" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview('');
                        document.getElementById('image-upload').value = '';
                      }}
                      className="remove-image-btn"
                      title="Remove Image"
                    >
                      <span className="material-icons">close</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-full-width">Add Item</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        title="Add Category"
      >
        <form onSubmit={handleAddCategory}>
          <div className="form-group">
            <label>Category Name</label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-full-width">Add Category</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
          setSelectedImage(null);
          setImagePreview('');
        }}
        title="Edit Menu Item"
      >
        <form onSubmit={handleUpdateItem}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={editingItem?.name || ''}
              onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              value={editingItem?.category_id || ''}
              onChange={(e) => setEditingItem({...editingItem, category_id: e.target.value})}
              required
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              value={editingItem?.description || ''}
              onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
              rows={3}
              placeholder="Enter item description (optional)"
            />
          </div>
          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              step="0.01"
              value={editingItem?.price || ''}
              onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Image</label>
            <div className="image-upload-container">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="image-upload-input"
                id="edit-image-upload"
              />
              <label htmlFor="edit-image-upload" className="image-upload-btn">
                <span className="material-icons">cloud_upload</span>
                <span className="upload-text">
                  {selectedImage ? 'Change Image' : 'Choose New Image'}
                </span>
              </label>
              {imagePreview && (
                <div className="image-preview-container">
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" className="preview-image" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview('');
                        document.getElementById('edit-image-upload').value = '';
                      }}
                      className="remove-image-btn"
                      title="Remove Image"
                    >
                      <span className="material-icons">close</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-full-width">Update Item</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MenuManagement;