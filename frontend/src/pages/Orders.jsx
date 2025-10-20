import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOrder } from '../context/OrderContext';
import Modal from '../components/Modal';
import api from '../api';
import './Orders.css';

const Orders = () => {
  const [activeTab, setActiveTab] = useState('new-order');
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderInProgress, setOrderInProgress] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [externalOrderId, setExternalOrderId] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [holdOrders, setHoldOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const customerSearchTimeoutRef = useRef(null);

  const {
    cart,
    orderDetails,
    startNewOrder,
    addToCart,
    updateCartQuantity,
    clearCart,
    getTotalAmount
  } = useOrder();

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await api.getMenuItems(selectedCategory, searchTerm);
      if (response.success) {
        setMenuItems(response.data);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
    fetchTables();
    if (activeTab === 'order-management') {
      fetchOrders();
    }
  }, [activeTab, fetchMenuItems]);

  useEffect(() => {
    fetchMenuItems();
  }, [selectedCategory, searchTerm, fetchMenuItems]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (customerSearchTimeoutRef.current) {
        clearTimeout(customerSearchTimeoutRef.current);
      }
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await api.getTables();
      if (response.success) {
        setTables(response.data);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const [holdResponse, completedResponse] = await Promise.all([
        api.getOrders('Hold'),
        api.getOrders('Completed')
      ]);

      if (holdResponse.success) {
        setHoldOrders(holdResponse.data);
      }
      if (completedResponse.success) {
        setCompletedOrders(completedResponse.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleStartNewOrder = () => {
    setShowOrderTypeModal(true);
  };

  const handleOrderTypeSelect = (type) => {
    setSelectedOrderType(type);
    setShowOrderTypeModal(false);
    setShowDetailsModal(true);
  };

  const handleFindCustomer = useCallback(async (mobile) => {
    if (!mobile || mobile.length < 10) return;

    try {
      const response = await api.findCustomer(mobile);
      if (response.success && response.found) {
        setCustomerName(response.customer.name);
      }
      // Don't clear the name if customer not found - let user type manually
    } catch (error) {
      console.error('Error finding customer:', error);
    }
  }, []);

  const handleMobileChange = useCallback((value) => {
    setCustomerMobile(value);

    // Clear existing timeout
    if (customerSearchTimeoutRef.current) {
      clearTimeout(customerSearchTimeoutRef.current);
      customerSearchTimeoutRef.current = null;
    }

    // Set new timeout for customer search
    if (value.length >= 10) {
      customerSearchTimeoutRef.current = setTimeout(() => {
        handleFindCustomer(value);
      }, 1000); // Wait 1 second after user stops typing
    }
  }, [handleFindCustomer]);

  const resetModalFields = useCallback(() => {
    setCustomerMobile('');
    setCustomerName('');
    setDeliveryAddress('');
    setExternalOrderId('');
    setSelectedTable('');
  }, []);

  const handleDetailsSubmit = useCallback(async () => {
    try {
      console.log('handleDetailsSubmit - selectedOrderType:', selectedOrderType);
      let customerId = null;

      if (['Dine In', 'Take Away', 'Delivery'].includes(selectedOrderType)) {
        if (!customerName) {
          alert('Customer name is required');
          return;
        }

        if (customerMobile) {
          const customerResponse = await api.findCustomer(customerMobile);
          if (customerResponse.success && customerResponse.found) {
            customerId = customerResponse.customer.id;
          } else {
            const createResponse = await api.createCustomer({
              name: customerName,
              mobile: customerMobile,
              address: deliveryAddress
            });
            if (createResponse.success) {
              customerId = createResponse.id;
            }
          }
        }
      }

      const orderData = {
        order_type: selectedOrderType,
        customer_id: customerId,
        table_id: selectedTable || null,
        external_order_id: externalOrderId || null
      };

      const response = await api.createOrder(orderData);
      if (response.success) {
        setCurrentOrderId(response.order_id);
        startNewOrder({
          orderType: selectedOrderType,
          customerName,
          customerMobile,
          deliveryAddress,
          externalOrderId,
          tableId: selectedTable
        });
        setOrderInProgress(true);
        setShowDetailsModal(false);
        resetModalFields();
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  }, [selectedOrderType, customerName, customerMobile, deliveryAddress, externalOrderId, selectedTable, startNewOrder, resetModalFields]);

  const handleCustomerNameChange = useCallback((value) => {
    setCustomerName(value);
  }, []);

  const handleDeliveryAddressChange = useCallback((value) => {
    setDeliveryAddress(value);
  }, []);

  const handleExternalOrderIdChange = useCallback((value) => {
    setExternalOrderId(value);
  }, []);

  const handleTableChange = useCallback((value) => {
    setSelectedTable(value);
  }, []);

  const handleHoldOrder = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      const items = cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        price_per_item: item.price
      }));

      await api.addOrderItems({
        order_id: currentOrderId,
        items
      });

      await api.placeOrder({
        order_id: currentOrderId,
        status: 'Hold'
      });

      // Print KOT to thermal printer (backend direct print)
      try {
        const kotResponse = await api.directPrintKOT(currentOrderId);
        if (kotResponse.success) {
          console.log('KOT sent to thermal printer:', kotResponse.message);
        } else {
          console.log('KOT printing message:', kotResponse.message);
        }
      } catch (error) {
        console.error('Error printing KOT:', error);
      }

      alert('Order placed on hold');

      clearCart();
      setOrderInProgress(false);
      setCurrentOrderId(null);

      if (activeTab === 'order-management') {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error holding order:', error);
    }
  };

  const handleCompleteOrder = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      const items = cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        price_per_item: item.price
      }));

      await api.addOrderItems({
        order_id: currentOrderId,
        items
      });

      // Set payment method based on order type
      if (orderDetails?.orderType === 'Uber Eats') {
        setPaymentMethod('Uber Eats');
      } else if (orderDetails?.orderType === 'Pickme Food') {
        setPaymentMethod('PickMe Food');
      } else {
        setPaymentMethod('Cash');
      }

      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error preparing order:', error);
    }
  };

  const handleCancelCurrentOrder = () => {
    if (confirm('Are you sure you want to cancel this order? All items will be removed.')) {
      clearCart();
      setOrderInProgress(false);
      setCurrentOrderId(null);
    }
  };

  const calculateOrderTotal = (orderDetails) => {
    if (!orderDetails) return 0;

    // Try to use the stored total_amount first (but only if it's greater than 0)
    if (orderDetails.total_amount && !isNaN(parseFloat(orderDetails.total_amount)) && parseFloat(orderDetails.total_amount) > 0) {
      return parseFloat(orderDetails.total_amount);
    }

    // Fallback: calculate from items
    if (orderDetails.items && Array.isArray(orderDetails.items)) {
      return orderDetails.items.reduce((total, item) => {
        const price = parseFloat(item.price_per_item) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return total + (price * quantity);
      }, 0);
    }

    return 0;
  };

  const handleEditOrderDetails = () => {
    // Pre-fill the modal with existing order details
    setSelectedOrderType(orderDetails?.orderType || '');
    setCustomerName(orderDetails?.customerName || '');
    setCustomerMobile(orderDetails?.customerMobile || '');
    setDeliveryAddress(orderDetails?.deliveryAddress || '');
    setExternalOrderId(orderDetails?.externalOrderId || '');
    setSelectedTable(orderDetails?.tableId || '');

    // Show the details modal for editing
    setShowDetailsModal(true);
  };

  const handlePaymentConfirm = async () => {
    try {
      await api.placeOrder({
        order_id: currentOrderId,
        status: 'Completed',
        payment_method: paymentMethod
      });

      // Print KOT to thermal printer (backend direct print)
      try {
        const kotResponse = await api.directPrintKOT(currentOrderId);
        if (kotResponse.success) {
          console.log('KOT sent to thermal printer:', kotResponse.message);
        } else {
          console.log('KOT printing message:', kotResponse.message);
        }
      } catch (error) {
        console.error('Error printing KOT:', error);
      }

      // Print Invoice to default printer (backend direct print)
      try {
        const invoiceResponse = await api.directPrintInvoice(currentOrderId);
        if (invoiceResponse.success) {
          console.log('Invoice sent to printer:', invoiceResponse.message);
        } else {
          console.log('Invoice printing failed:', invoiceResponse.message);
        }
      } catch (error) {
        console.error('Error printing invoice:', error);
      }

      alert('Order completed successfully');

      clearCart();
      setOrderInProgress(false);
      setCurrentOrderId(null);
      setShowPaymentModal(false);
      setSelectedOrderDetails(null);
      setPaymentMethod('Cash');

      if (activeTab === 'order-management') {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  const handleAddItemsToOrder = async (order) => {
    try {
      setCurrentOrderId(order.id);
      startNewOrder({
        orderType: order.order_type,
        customerName: order.customer_name,
        customerMobile: order.customer_mobile,
        deliveryAddress: order.customer_address,
        externalOrderId: order.external_order_id,
        tableId: order.table_id
      });

      order.items.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          addToCart({
            id: item.menu_item_id,
            name: item.item_name,
            price: item.price_per_item
          });
        }
      });

      setOrderInProgress(true);
      setActiveTab('new-order');
    } catch (error) {
      console.error('Error loading order for modification:', error);
    }
  };

  const handleCompleteHoldOrder = async (orderId) => {
    try {
      // Fetch order details to get the total amount
      const response = await api.getOrderDetails(orderId);
      setCurrentOrderId(orderId);

      if (response.success && response.data) {
        // Handle the nested API response structure
        const orderData = {
          ...response.data.order,
          items: response.data.items
        };

        // Set selectedOrderDetails for payment modal
        setSelectedOrderDetails(orderData);

        // Set payment method based on order type
        if (orderData.order_type === 'Uber Eats') {
          setPaymentMethod('Uber Eats');
        } else if (orderData.order_type === 'Pickme Food') {
          setPaymentMethod('PickMe Food');
        } else {
          setPaymentMethod('Cash');
        }

        setShowPaymentModal(true);
      } else {
        console.error('API Error:', response.message || 'Unknown error');
        alert('Failed to load order details: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching order for completion:', error);
      alert('Error loading order details');
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await api.updateOrderStatus(orderId, 'Cancelled');
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const handleViewOrderDetails = async (order) => {
    try {
      const response = await api.getOrderDetails(order.id);
      if (response.success) {
        setSelectedOrderDetails({
          ...order,
          items: response.data.items || []
        });
        setShowOrderDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handlePrintInvoice = async (orderId) => {
    try {
      // Print KOT to thermal printer (backend direct print)
      try {
        const kotResponse = await api.directPrintKOT(orderId);
        if (kotResponse.success) {
          console.log('KOT sent to thermal printer:', kotResponse.message);
        } else {
          console.log('KOT printing message:', kotResponse.message);
        }
      } catch (error) {
        console.error('Error printing KOT:', error);
        // Continue to print invoice even if KOT fails
      }

      // Print Invoice to default printer (backend direct print)
      const invoiceResponse = await api.directPrintInvoice(orderId);
      if (invoiceResponse.success) {
        alert('Invoice and KOT sent to printers successfully!');
      } else {
        alert('Failed to print invoice: ' + invoiceResponse.message);
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Error printing invoice: ' + error.message);
    }
  };

  const OrderTypeModal = () => (
    <Modal isOpen={showOrderTypeModal} onClose={() => setShowOrderTypeModal(false)} title="Select Order Type">
      <div className="order-type-buttons">
        {['Dine In', 'Take Away', 'Delivery', 'Uber Eats', 'Pickme Food'].map(type => (
          <button
            key={type}
            onClick={() => handleOrderTypeSelect(type)}
            className="order-type-btn"
          >
            {type}
          </button>
        ))}
      </div>
    </Modal>
  );

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleDetailsSubmit();
  };

  const handleModalClose = useCallback(() => {
    setShowDetailsModal(false);
    resetModalFields();
    setSelectedOrderType('');
  }, [resetModalFields]);

  const renderDetailsModal = () => {
    if (!showDetailsModal) return null;

    return (
      <Modal isOpen={showDetailsModal} onClose={handleModalClose} title="Order Details">
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label>Order Type</label>
            <select
              value={selectedOrderType}
              onChange={(e) => setSelectedOrderType(e.target.value)}
              required
            >
              <option value="">Select Order Type</option>
              <option value="Dine In">Dine In</option>
              <option value="Take Away">Take Away</option>
              <option value="Delivery">Delivery</option>
              <option value="Uber Eats">Uber Eats</option>
              <option value="Pickme Food">Pickme Food</option>
            </select>
          </div>
          {['Dine In', 'Take Away', 'Delivery'].includes(selectedOrderType) && (
            <>
              <div className="form-group">
                <label>Customer Mobile</label>
                <input
                  type="tel"
                  value={customerMobile}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  placeholder="Enter mobile number"
                />
              </div>
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => handleCustomerNameChange(e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              {selectedOrderType === 'Delivery' && (
                <div className="form-group">
                  <label>Delivery Address</label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => handleDeliveryAddressChange(e.target.value)}
                    placeholder="Enter delivery address"
                    required
                    rows={3}
                  />
                </div>
              )}
              {selectedOrderType === 'Dine In' && (
                <div className="form-group">
                  <label>Table</label>
                  <select
                    value={selectedTable}
                    onChange={(e) => handleTableChange(e.target.value)}
                  >
                    <option value="">Select Table</option>
                    {tables.map(table => (
                      <option key={table.id} value={table.id}>
                        {table.table_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
          {['Uber Eats', 'Pickme Food'].includes(selectedOrderType) && (
            <div className="form-group">
              <label>Order ID</label>
              <input
                type="text"
                value={externalOrderId}
                onChange={(e) => handleExternalOrderIdChange(e.target.value)}
                placeholder="Enter order ID"
                required
              />
            </div>
          )}
          <button type="submit" className="submit-btn">Start Order</button>
        </form>
      </Modal>
    );
  };

  const PaymentModal = () => {
    const total = selectedOrderDetails ? calculateOrderTotal(selectedOrderDetails) : getTotalAmount();

    // Don't show modal if we're expecting selectedOrderDetails but it's null
    const isCompletingHoldOrder = currentOrderId && !orderInProgress;
    const shouldShowModal = showPaymentModal && (!isCompletingHoldOrder || selectedOrderDetails);

    return (
      <Modal isOpen={shouldShowModal} onClose={() => {
        setShowPaymentModal(false);
        setSelectedOrderDetails(null);
      }} title="Payment">
        <div className="payment-modal">
          <div className="order-total">
            <h3>Total Amount: Rs. {total.toFixed(2)}</h3>
          </div>
        <div className="payment-methods">
          {(orderDetails?.orderType === 'Uber Eats' || selectedOrderDetails?.order_type === 'Uber Eats') ? (
            <label>
              <input
                type="radio"
                value="Uber Eats"
                checked={paymentMethod === 'Uber Eats'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              Uber Eats
            </label>
          ) : (orderDetails?.orderType === 'Pickme Food' || selectedOrderDetails?.order_type === 'Pickme Food') ? (
            <label>
              <input
                type="radio"
                value="PickMe Food"
                checked={paymentMethod === 'PickMe Food'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              PickMe Food
            </label>
          ) : (
            <>
              <label>
                <input
                  type="radio"
                  value="Cash"
                  checked={paymentMethod === 'Cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Cash
              </label>
              <label>
                <input
                  type="radio"
                  value="Card"
                  checked={paymentMethod === 'Card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Card
              </label>
              <label>
                <input
                  type="radio"
                  value="Bank Transfer"
                  checked={paymentMethod === 'Bank Transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Bank Transfer
              </label>
            </>
          )}
        </div>
        <button onClick={handlePaymentConfirm} className="confirm-payment-btn">
          Confirm Payment
        </button>
      </div>
    </Modal>
    );
  };

  const OrderDetailsModal = () => (
    <Modal
      isOpen={showOrderDetailsModal}
      onClose={() => setShowOrderDetailsModal(false)}
      title={`Order #${selectedOrderDetails?.id} Details`}
      className="order-details-modal"
    >
      {selectedOrderDetails && (
        <div>
          <div className="order-summary">
            <h3>Order Information</h3>
            <div className="order-summary-grid">
              <div className="summary-item">
                <span className="label">Order ID:</span>
                <span className="value order-id">#{selectedOrderDetails.id}</span>
              </div>
              <div className="summary-item">
                <span className="label">Order Type:</span>
                <span className="value">{selectedOrderDetails.order_type}</span>
              </div>
              <div className="summary-item">
                <span className="label">Status:</span>
                <span className="value order-status">{selectedOrderDetails.status}</span>
              </div>
              <div className="summary-item">
                <span className="label">Customer:</span>
                <span className="value">{selectedOrderDetails.customer_name || 'N/A'}</span>
              </div>
              <div className="summary-item">
                <span className="label">Mobile:</span>
                <span className="value">{selectedOrderDetails.customer_mobile || 'N/A'}</span>
              </div>
              <div className="summary-item">
                <span className="label">Table:</span>
                <span className="value">{selectedOrderDetails.table_id ? `Table ${selectedOrderDetails.table_id}` : 'N/A'}</span>
              </div>
              <div className="summary-item">
                <span className="label">Created:</span>
                <span className="value order-time">{new Date(selectedOrderDetails.created_at).toLocaleString()}</span>
              </div>
              <div className="summary-item">
                <span className="label">Total Amount:</span>
                <span className="value order-total">Rs. {parseFloat(selectedOrderDetails.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="order-items">
            <h3>Order Items</h3>
            {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
              <div className="items-list">
                {selectedOrderDetails.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-info">
                      <h4>{item.name || item.item_name}</h4>
                      <p>Quantity: {item.quantity}</p>
                      <p>Price per item: Rs. {parseFloat(item.price_per_item).toFixed(2)}</p>
                    </div>
                    <div className="item-total">
                      <span className="item-total-amount">Rs. {(item.quantity * item.price_per_item).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-items">No items found for this order</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );

  return (
    <div className="orders-page">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'new-order' ? 'active' : ''}`}
          onClick={() => setActiveTab('new-order')}
        >
          New Order
        </button>
        <button
          className={`tab ${activeTab === 'order-management' ? 'active' : ''}`}
          onClick={() => setActiveTab('order-management')}
        >
          Order Management
        </button>
      </div>

      {activeTab === 'new-order' && (
        <div className="new-order-tab">
          {!orderInProgress ? (
            <div className="start-order-section">
              <button onClick={handleStartNewOrder} className="start-order-btn">
                <span className="material-icons">add_circle</span>
                <span>Start New Order</span>
              </button>
            </div>
          ) : (
            <div className="order-interface">
              <div className="menu-section">
                <div className="search-section">
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="categories-section">
                  <button
                    className={`category-btn ${selectedCategory === '' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('')}
                  >
                    All
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>

                <div className="menu-items-grid">
                  {menuItems.map(item => (
                    <div
                      key={item.id}
                      className="menu-item-card"
                      onClick={() => addToCart(item)}
                    >
                      <div className="item-image">
                        {item.image_path ? (
                          <img src={`http://localhost/Afkar New/${item.image_path}`} alt={item.name} />
                        ) : (
                          <div className="placeholder-image">📸</div>
                        )}
                      </div>
                      <h3>{item.name}</h3>
                      <p className="item-description">{item.description}</p>
                      <p className="item-price">Rs. {parseFloat(item.price).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cart-section">
                <div className="order-details">
                  <div className="order-details-header">
                    <h3>Order Details</h3>
                    <button onClick={handleEditOrderDetails} className="edit-details-btn">
                      <span className="material-icons icon-sm">edit</span>
                      Edit
                    </button>
                  </div>
                  <p><strong>Type:</strong> {orderDetails?.orderType}</p>
                  {orderDetails?.customerName && (
                    <p><strong>Customer:</strong> {orderDetails.customerName}</p>
                  )}
                  {orderDetails?.customerMobile && (
                    <p><strong>Mobile:</strong> {orderDetails.customerMobile}</p>
                  )}
                  {orderDetails?.externalOrderId && (
                    <p><strong>Order ID:</strong> {orderDetails.externalOrderId}</p>
                  )}
                </div>

                <div className="cart">
                  <h3>Cart</h3>
                  {cart.length === 0 ? (
                    <p>Cart is empty</p>
                  ) : (
                    <>
                      {cart.map(item => (
                        <div key={item.id} className="cart-item">
                          <div className="item-info">
                            <h4>{item.name}</h4>
                            <p>Rs. {parseFloat(item.price).toFixed(2)}</p>
                          </div>
                          <div className="quantity-controls">
                            <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>+</button>
                          </div>
                          <div className="item-total">
                            Rs. {(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                      <div className="cart-total">
                        <strong>Total: Rs. {getTotalAmount().toFixed(2)}</strong>
                      </div>
                    </>
                  )}
                </div>

                <div className="cart-actions">
                  {currentOrderId && cart.length > 0 && (
                    <button onClick={async () => {
                      try {
                        // Save cart items first before printing
                        const items = cart.map(item => ({
                          menu_item_id: item.id,
                          quantity: item.quantity,
                          price_per_item: item.price
                        }));
                        await api.addOrderItems({
                          order_id: currentOrderId,
                          items
                        });
                        // Then print
                        await handlePrintInvoice(currentOrderId);
                      } catch (error) {
                        console.error('Error saving items before print:', error);
                        alert('Error saving order items');
                      }
                    }} className="print-invoice-order-btn">
                      <span className="material-icons icon-sm">print</span>
                      Print Invoice
                    </button>
                  )}
                  <button onClick={handleHoldOrder} className="hold-btn">
                    <span className="material-icons icon-sm">pause</span>
                    Hold Order
                  </button>
                  <button onClick={handleCompleteOrder} className="cart-complete-btn">
                    <span className="material-icons icon-sm">check_circle</span>
                    Complete Order
                  </button>
                  <button onClick={handleCancelCurrentOrder} className="cancel-order-btn">
                    <span className="material-icons icon-sm">cancel</span>
                    Cancel Order
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'order-management' && (
        <div className="order-management-tab">
          <div className="orders-section">
            <h2>Held Orders</h2>
            <div className="orders-list">
              {holdOrders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-info">
                    <h4>Order #{order.id} - {order.order_type}</h4>
                    <p>Customer: {order.customer_name || 'N/A'}</p>
                    <p>Total: {order.total_amount}</p>
                    <p>Created: {new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="order-actions">
                    <button onClick={() => handleViewOrderDetails(order)} className="view-details-btn" title="View Details">
                      <span className="material-icons icon-sm">visibility</span>
                    </button>
                    <button onClick={() => handlePrintInvoice(order.id)} className="print-invoice-btn" title="Print Invoice">
                      <span className="material-icons icon-sm">print</span>
                    </button>
                    <button onClick={() => handleAddItemsToOrder(order)} className="add-items-btn" title="Add Items">
                      <span className="material-icons icon-sm">add_shopping_cart</span>
                    </button>
                    <button onClick={() => handleCompleteHoldOrder(order.id)} className="complete-btn" title="Complete Order">
                      <span className="material-icons icon-sm">check_circle</span>
                    </button>
                    <button onClick={() => handleCancelOrder(order.id)} className="cancel-btn" title="Cancel Order">
                      <span className="material-icons icon-sm">cancel</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="orders-section">
            <h2>Completed Orders</h2>
            <div className="orders-list">
              {completedOrders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-info">
                    <h4>Order #{order.id} - {order.order_type}</h4>
                    <p>Customer: {order.customer_name || 'N/A'}</p>
                    <p>Total: {order.total_amount}</p>
                    <p>Completed: {new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="order-actions">
                    <button onClick={() => handleViewOrderDetails(order)} className="view-details-btn" title="View Details">
                      <span className="material-icons icon-sm">visibility</span>
                    </button>
                    <button onClick={() => handlePrintInvoice(order.id)} className="print-invoice-btn" title="Print Invoice">
                      <span className="material-icons icon-sm">print</span>
                    </button>
                    <button onClick={() => handleCancelOrder(order.id)} className="cancel-btn" title="Cancel Order">
                      <span className="material-icons icon-sm">cancel</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <OrderTypeModal />
      {renderDetailsModal()}
      <PaymentModal />
      <OrderDetailsModal />
    </div>
  );
};

export default Orders;