import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import api from '../api';
import './Expenses.css';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [searchDescription, setSearchDescription] = useState('');
  const [searchPrice, setSearchPrice] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editExpense, setEditExpense] = useState({
    description: '',
    amount: '',
    date: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    let filtered = expenses;

    // Filter by description
    if (searchDescription) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchDescription.toLowerCase())
      );
    }

    // Filter by price
    if (searchPrice) {
      filtered = filtered.filter(expense =>
        expense.amount.toString().includes(searchPrice)
      );
    }

    // Filter by date
    if (searchDate) {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date).toISOString().split('T')[0];
        return expenseDate === searchDate;
      });
    }

    setFilteredExpenses(filtered);
  }, [expenses, searchDescription, searchPrice, searchDate]);

  const fetchExpenses = async () => {
    try {
      const response = await api.getExpenses();
      if (response.success) {
        setExpenses(response.data);
      }
    } catch (fetchError) {
      console.error('Error fetching expenses:', fetchError);
    }
  };


  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const response = await api.createExpense(newExpense);
      if (response.success) {
        alert('Expense added successfully');
        setShowAddModal(false);
        setNewExpense({
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0]
        });
        fetchExpenses();
      } else {
        alert('Error adding expense: ' + response.message);
      }
    } catch (addError) {
      console.error('Error adding expense:', addError);
      alert('Error adding expense');
    }
  };

  const getTotalExpenses = () => {
    return filteredExpenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
  };

  const getPaginatedExpenses = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredExpenses.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredExpenses.length / itemsPerPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setEditExpense({
      description: expense.description,
      amount: expense.amount,
      date: expense.date
    });
    setShowEditModal(true);
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    try {
      const response = await api.updateExpense({
        id: editingExpense.id,
        ...editExpense
      });
      if (response.success) {
        alert('Expense updated successfully');
        setShowEditModal(false);
        setEditingExpense(null);
        setEditExpense({
          description: '',
          amount: '',
          date: ''
        });
        fetchExpenses();
      } else {
        alert('Error updating expense: ' + response.message);
      }
    } catch (updateError) {
      console.error('Error updating expense:', updateError);
      alert('Error updating expense');
    }
  };

  return (
    <div className="expenses-page">
      <div className="page-header">
        <h1>Expense Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <span className="material-icons">add</span>
          Add Expense
        </button>
      </div>

      <div className="search-section">
        <h3 className="search-title">Search Expenses</h3>
        <div className="search-container">
          <div className="search-field-wrapper">
            <label htmlFor="searchDescription">Description:</label>
            <div className="search-input-wrapper">
              <input
                id="searchDescription"
                type="text"
                placeholder="Search by description..."
                value={searchDescription}
                onChange={(e) => setSearchDescription(e.target.value)}
                className="search-input"
              />
              {searchDescription && (
                <button
                  onClick={() => setSearchDescription('')}
                  className="clear-search-btn"
                  title="Clear description search"
                >
                  <span className="material-icons">clear</span>
                </button>
              )}
            </div>
          </div>

          <div className="search-field-wrapper">
            <label htmlFor="searchPrice">Price:</label>
            <div className="search-input-wrapper">
              <input
                id="searchPrice"
                type="text"
                placeholder="Search by price..."
                value={searchPrice}
                onChange={(e) => setSearchPrice(e.target.value)}
                className="search-input"
              />
              {searchPrice && (
                <button
                  onClick={() => setSearchPrice('')}
                  className="clear-search-btn"
                  title="Clear price search"
                >
                  <span className="material-icons">clear</span>
                </button>
              )}
            </div>
          </div>

          <div className="search-field-wrapper">
            <label htmlFor="searchDate">Date:</label>
            <div className="search-input-wrapper">
              <input
                id="searchDate"
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="search-input"
              />
              {searchDate && (
                <button
                  onClick={() => setSearchDate('')}
                  className="clear-search-btn"
                  title="Clear date search"
                >
                  <span className="material-icons">clear</span>
                </button>
              )}
            </div>
          </div>

          <div className="search-actions">
            <button
              onClick={() => {
                setSearchDescription('');
                setSearchPrice('');
                setSearchDate('');
              }}
              className="clear-all-btn"
              title="Reset all search filters"
            >
              <span className="material-icons">refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="expense-summary">
        <div className="summary-card">
          <h3>Total Expenses ({filteredExpenses.length} items)</h3>
          <p className="total-amount">{getTotalExpenses().toFixed(2)}</p>
        </div>
      </div>

      <div className="expenses-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {getPaginatedExpenses().map(expense => (
              <tr key={expense.id}>
                <td>{new Date(expense.date).toLocaleDateString()}</td>
                <td>{expense.description}</td>
                <td>{parseFloat(expense.amount).toFixed(2)}</td>
                <td>
                  <button
                    className="btn btn-action btn-success"
                    title="Edit expense"
                    onClick={() => handleEditExpense(expense)}
                  >
                    <span className="material-icons">edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-section">
        <div className="pagination-controls">
          <div className="items-per-page">
            <label>Items per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
              className="items-per-page-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={100}>100</option>
              <option value={9999}>All</option>
            </select>
          </div>

          <div className="pagination-info">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} entries
          </div>

          <div className="pagination-buttons">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-xs btn-secondary nav-btn"
            >
              ‹
            </button>

            {[...Array(getTotalPages())].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`btn btn-xs ${currentPage === index + 1 ? 'btn-primary' : 'btn-secondary'}`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === getTotalPages()}
              className="btn btn-xs btn-secondary nav-btn"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Expense"
      >
        <form onSubmit={handleAddExpense}>
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={newExpense.description}
              onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              step="0.01"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Add Expense</button>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Expense"
      >
        <form onSubmit={handleUpdateExpense}>
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={editExpense.description}
              onChange={(e) => setEditExpense({...editExpense, description: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              step="0.01"
              value={editExpense.amount}
              onChange={(e) => setEditExpense({...editExpense, amount: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={editExpense.date}
              onChange={(e) => setEditExpense({...editExpense, date: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Update Expense</button>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;