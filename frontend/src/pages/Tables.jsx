import React, { useState, useEffect } from 'react';
import api from '../api';
import './Tables.css';

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    table_name: '',
    status: 'Available'
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await api.getTables();
      if (response.success) {
        setTables(response.data);
      }
    } catch (error) {
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      const response = await api.createTable(formData);
      if (response.success) {
        alert(response.message);
        setShowAddModal(false);
        setFormData({ table_name: '', status: 'Available' });
        fetchTables();
      } else {
        alert('Error creating table: ' + response.message);
      }
    } catch (error) {
      alert('Error creating table');
    }
  };

  const handleEditTable = async (e) => {
    e.preventDefault();
    try {
      const response = await api.updateTable({
        id: editingTable.id,
        ...formData
      });
      if (response.success) {
        alert(response.message);
        setShowEditModal(false);
        setEditingTable(null);
        setFormData({ table_name: '', status: 'Available' });
        fetchTables();
      } else {
        alert('Error updating table: ' + response.message);
      }
    } catch (error) {
      alert('Error updating table');
    }
  };

  const handleToggleStatus = async (id, currentActive) => {
    try {
      // Convert to number to handle string values from database
      const currentActiveNum = parseInt(currentActive);
      const newActive = currentActiveNum === 1 ? 0 : 1;


      const response = await api.toggleTableStatus(id, newActive);

      if (response.success) {
        alert(response.message);
        fetchTables();
      } else {
        alert('Error updating status: ' + response.message);
      }
    } catch (error) {
      alert('Error updating status');
    }
  };

  const handleSoftDelete = async (id, tableName) => {
    if (window.confirm(`Are you sure you want to delete "${tableName}"? This action can be undone.`)) {
      try {
        const response = await api.softDeleteTable(id, 1);

        if (response.success) {
          alert(response.message);
          fetchTables();
        } else {
          alert('Error deleting table: ' + response.message);
        }
      } catch (error) {
        alert('Error deleting table');
      }
    }
  };

  const openEditModal = (table) => {
    setEditingTable(table);
    setFormData({
      table_name: table.table_name,
      status: table.status
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingTable(null);
    setFormData({ table_name: '', status: 'Available' });
  };

  return (
    <div className="table-management">
      <div className="page-header">
        <h1>Table Management</h1>
        <div className="header-actions">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <span className="material-icons">add</span>
            Add Table
          </button>
        </div>
      </div>

      <div className="tables-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Table Name</th>
              <th>Status</th>
              <th>Active/Inactive</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tables.map(table => (
              <tr key={table.id}>
                <td>{table.id}</td>
                <td>{table.table_name}</td>
                <td>
                  <span className={`table-status ${table.status.toLowerCase()}`}>
                    {table.status}
                  </span>
                </td>
                <td>
                  <button
                    className={`status-toggle-btn ${parseInt(table.is_active) === 1 ? 'status-active' : 'status-inactive'}`}
                    onClick={() => handleToggleStatus(table.id, table.is_active)}
                  >
                    {parseInt(table.is_active) === 1 ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td>
                  <button
                    className="btn btn-action btn-success"
                    title="Edit Table"
                    onClick={() => openEditModal(table)}
                  >
                    <span className="material-icons">edit</span>
                  </button>
                  <button
                    className="btn btn-action btn-danger"
                    title="Delete Table"
                    onClick={() => handleSoftDelete(table.id, table.table_name)}
                  >
                    <span className="material-icons">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Table</h2>
              <button className="close-btn" onClick={closeModals}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleAddTable}>
              <div className="form-group">
                <label>Table Name</label>
                <input
                  type="text"
                  value={formData.table_name}
                  onChange={(e) => setFormData({...formData, table_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-full-width btn-primary">
                  Add Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Table</h2>
              <button className="close-btn" onClick={closeModals}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleEditTable}>
              <div className="form-group">
                <label>Table Name</label>
                <input
                  type="text"
                  value={formData.table_name}
                  onChange={(e) => setFormData({...formData, table_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-full-width btn-primary">
                  Update Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables;