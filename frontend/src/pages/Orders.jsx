import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_PATH } from '../config';
import { useOrder } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import Spinner from '../components/Spinner';
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
  const [isCompletingNewOrder, setIsCompletingNewOrder] = useState(false);
  const customerSearchTimeoutRef = useRef(null);
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountModalOrderId, setDiscountModalOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customerVisitCount, setCustomerVisitCount] = useState(0);

  // Order Management Search and Pagination
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [holdOrdersPage, setHoldOrdersPage] = useState(1);
  const [completedOrdersPage, setCompletedOrdersPage] = useState(1);
  const [ordersPerPage] = useState(10);

  // Pending order data (not saved to database until Hold or Complete)
  const [pendingOrderData, setPendingOrderData] = useState(null);

  // Confirm modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({});

  // Track if items were just saved (to avoid duplicate saves)
  const [itemsJustSaved, setItemsJustSaved] = useState(false);

  const toast = useToast();

  const {
    cart,
    orderDetails,
    startNewOrder,
    addToCart,
    updateCartQuantity,
    updateCartItemNotes,
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
    }
  };

  const fetchTables = async () => {
    try {
      const response = await api.getTables();
      if (response.success) {
        setTables(response.data);
      }
    } catch (error) {
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
    }
  };

  // Filter orders based on search term
  const filterOrders = (orders) => {
    if (!orderSearchTerm) return orders;

    const searchLower = orderSearchTerm.toLowerCase();
    return orders.filter(order =>
      order.id.toString().includes(searchLower) ||
      (order.customer_name || '').toLowerCase().includes(searchLower) ||
      (order.customer_mobile || '').includes(searchLower) ||
      (order.order_type || '').toLowerCase().includes(searchLower)
    );
  };

  // Paginate orders
  const paginateOrders = (orders, currentPage) => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    return orders.slice(startIndex, endIndex);
  };

  // Get filtered and paginated orders
  const getDisplayedHoldOrders = () => {
    const filtered = filterOrders(holdOrders);
    return {
      orders: paginateOrders(filtered, holdOrdersPage),
      totalPages: Math.ceil(filtered.length / ordersPerPage),
      totalCount: filtered.length
    };
  };

  const getDisplayedCompletedOrders = () => {
    const filtered = filterOrders(completedOrders);
    return {
      orders: paginateOrders(filtered, completedOrdersPage),
      totalPages: Math.ceil(filtered.length / ordersPerPage),
      totalCount: filtered.length
    };
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
    if (!mobile || mobile.length < 10) {
      setCustomerVisitCount(0);
      return;
    }

    try {
      const response = await api.findCustomer(mobile);

      if (response.success && response.found) {
        setCustomerName(response.customer.name);

        // Fetch customer visit count
        const countResponse = await api.getCustomerOrderCount(response.customer.id);

        if (countResponse.success) {
          setCustomerVisitCount(countResponse.order_count);
        } else {
          setCustomerVisitCount(0);
        }
      } else {
        // Customer not found - reset visit count
        setCustomerVisitCount(0);
      }
      // Don't clear the name if customer not found - let user type manually
    } catch (error) {
      setCustomerVisitCount(0);
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

  const resetModalFields = useCallback((resetVisitCount = true) => {
    setCustomerMobile('');
    setCustomerName('');
    setDeliveryAddress('');
    setExternalOrderId('');
    setSelectedTable('');
    if (resetVisitCount) {
      setCustomerVisitCount(0);
    }
  }, []);

  const handleDetailsSubmit = useCallback(async () => {
    try {
      let customerId = null;

      if (['Dine In', 'Take Away', 'Delivery'].includes(selectedOrderType)) {
        if (!customerName) {
          toast.error('Customer name is required');
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

      // Store order data in state - don't save to database yet
      const orderData = {
        order_type: selectedOrderType,
        customer_id: customerId,
        table_id: selectedTable || null,
        external_order_id: externalOrderId || null
      };

      setPendingOrderData(orderData);

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
      resetModalFields(false); // Don't reset visit count - keep it visible in order details
    } catch (error) {
      toast.error('Error preparing order');
    }
  }, [selectedOrderType, customerName, customerMobile, deliveryAddress, externalOrderId, selectedTable, startNewOrder, resetModalFields, toast]);

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
      toast.warning('Cart is empty');
      return;
    }

    try {
      setLoading(true);

      let orderId = currentOrderId;

      // If no currentOrderId, create a new order
      if (!orderId) {
        if (!pendingOrderData) {
          toast.error('Order details not found');
          setLoading(false);
          return;
        }

        const createResponse = await api.createOrder(pendingOrderData);
        if (!createResponse.success) {
          toast.error('Failed to create order');
          setLoading(false);
          return;
        }

        orderId = createResponse.order_id;
      }

      // Add items to the order
      const items = cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        price_per_item: item.price,
        notes: item.notes || ''
      }));

      await api.addOrderItems({
        order_id: orderId,
        items
      });

      // Set order status to Hold
      await api.placeOrder({
        order_id: orderId,
        status: 'Hold'
      });

      // Print KOT to thermal printer (backend direct print)
      try {
        const kotResponse = await api.directPrintKOT(orderId);
        if (kotResponse.success) {
          toast.success('KOT printed successfully');
        } else {
          toast.error('Failed to print KOT');
        }
      } catch (error) {
        toast.error('Error printing KOT');
      }

      toast.success('Order placed on hold');

      clearCart();
      setOrderInProgress(false);
      setCurrentOrderId(null);
      setPendingOrderData(null);

      if (activeTab === 'order-management') {
        fetchOrders();
      }
    } catch (error) {
      toast.error('Error holding order');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (cart.length === 0) {
      toast.warning('Cart is empty');
      return;
    }

    try {
      setLoading(true);

      let orderId = currentOrderId;

      // If no currentOrderId, create a new order
      if (!orderId) {
        if (!pendingOrderData) {
          toast.error('Order details not found');
          setLoading(false);
          return;
        }

        const createResponse = await api.createOrder(pendingOrderData);
        if (!createResponse.success) {
          toast.error('Failed to create order');
          setLoading(false);
          return;
        }

        orderId = createResponse.order_id;
        setCurrentOrderId(orderId); // Set the order ID for payment modal
      }

      // Add items to the order
      const items = cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        price_per_item: item.price,
        notes: item.notes || ''
      }));

      await api.addOrderItems({
        order_id: orderId,
        items
      });

      // Load saved discount from database
      try {
        const response = await api.getOrderDetails(orderId);
        if (response.success && response.data.order) {
          const order = response.data.order;
          // Load saved discount if exists
          if (order.discount_type) {
            setDiscountType(order.discount_type);
            setDiscountValue(order.discount_value || 0);
          } else {
            setDiscountType('fixed');
            setDiscountValue(0);
          }
        }
      } catch (error) {
        console.error('Error loading discount:', error);
        setDiscountType('fixed');
        setDiscountValue(0);
      }

      // Reset paid amount
      setPaidAmount(0);

      // Mark as completing a new order (should print both Invoice + KOT)
      setIsCompletingNewOrder(true);

      // Set payment method based on order type
      if (orderDetails?.orderType === 'Uber Eats') {
        setPaymentMethod('Uber Eats');
      } else if (orderDetails?.orderType === 'Pickme Food') {
        setPaymentMethod('PickMe Food');
      } else {
        setPaymentMethod('Cash');
      }

      setLoading(false);
      setShowPaymentModal(true);
    } catch (error) {
      toast.error('Error preparing order for completion');
      setLoading(false);
    }
  };

  const handleCancelCurrentOrder = () => {
    setConfirmConfig({
      title: 'Cancel Current Order',
      message: 'Are you sure you want to cancel this order? All items will be removed.',
      confirmText: 'Yes, Cancel Order',
      cancelText: 'No',
      type: 'danger'
    });
    setConfirmAction(() => () => {
      clearCart();
      setOrderInProgress(false);
      setCurrentOrderId(null);
      setPendingOrderData(null);
      setCustomerVisitCount(0);
      toast.success('Order cancelled');
    });
    setShowConfirmModal(true);
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

  const handleEditOrderDetails = async () => {
    // Pre-fill the modal with existing order details
    setSelectedOrderType(orderDetails?.orderType || '');
    setCustomerName(orderDetails?.customerName || '');
    setCustomerMobile(orderDetails?.customerMobile || '');
    setDeliveryAddress(orderDetails?.deliveryAddress || '');
    setExternalOrderId(orderDetails?.externalOrderId || '');
    setSelectedTable(orderDetails?.tableId || '');

    // Fetch visit count if customer mobile exists
    if (orderDetails?.customerMobile) {
      handleFindCustomer(orderDetails.customerMobile);
    }

    // Show the details modal for editing
    setShowDetailsModal(true);
  };

  const handlePaymentConfirm = async (localDiscountType, localDiscountValue, localPaidAmount) => {
    try {
      const total = selectedOrderDetails ? calculateOrderTotal(selectedOrderDetails) : getTotalAmount();

      // Calculate discount amount
      const discountAmount = localDiscountType === 'percentage'
        ? (total * localDiscountValue) / 100
        : parseFloat(localDiscountValue) || 0;

      // Calculate final amount after discount
      const finalAmount = total - discountAmount;

      // Validate cash payment
      if (paymentMethod === 'Cash') {
        const paid = parseFloat(localPaidAmount) || 0;
        if (paid < finalAmount) {
          toast.error('Paid amount must be at least Rs. ' + finalAmount.toFixed(2));
          return;
        }
      }

      setLoading(true);

      // Calculate balance
      const balance = paymentMethod === 'Cash' ? (parseFloat(localPaidAmount) || 0) - finalAmount : 0;

      await api.placeOrder({
        order_id: currentOrderId,
        status: 'Completed',
        payment_method: paymentMethod,
        discount_type: localDiscountType,
        discount_value: parseFloat(localDiscountValue) || 0,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        paid_amount: paymentMethod === 'Cash' ? parseFloat(localPaidAmount) || 0 : finalAmount,
        balance: balance
      });

      // Print KOT only if completing a NEW order (not held order)
      if (isCompletingNewOrder) {
        try {
          const kotResponse = await api.directPrintKOT(currentOrderId);
          if (kotResponse.success) {
            toast.success('KOT printed successfully');
          } else {
            toast.error('Failed to print KOT');
          }
        } catch (error) {
          toast.error('Error printing KOT');
        }
      }

      // Always print invoice
      try {
        const invoiceResponse = await api.directPrintInvoice(currentOrderId);
        if (invoiceResponse.success) {
          toast.success('Invoice printed successfully');
        } else {
          toast.error('Failed to print invoice');
        }
      } catch (error) {
        toast.error('Error printing invoice');
      }

      toast.success('Order completed successfully');

      clearCart();
      setOrderInProgress(false);
      setCurrentOrderId(null);
      setPendingOrderData(null);
      setShowPaymentModal(false);
      setSelectedOrderDetails(null);
      setPaymentMethod('Cash');
      setDiscountType('fixed');
      setDiscountValue(0);
      setPaidAmount(0);
      setIsCompletingNewOrder(false); // Reset flag
      setCustomerVisitCount(0); // Reset visit count for next order

      if (activeTab === 'order-management') {
        fetchOrders();
      }
    } catch (error) {
      toast.error('Error completing order');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemsToOrder = async (order) => {
    try {
      setCurrentOrderId(order.id);
      setPendingOrderData(null); // Clear pending data since this is an existing order
      startNewOrder({
        orderType: order.order_type,
        customerName: order.customer_name,
        customerMobile: order.customer_mobile,
        deliveryAddress: order.customer_address,
        externalOrderId: order.external_order_id,
        tableId: order.table_id
      });

      // Fetch full order details to get notes
      const response = await api.getOrderDetails(order.id);
      const orderItems = response.success ? response.data.items : order.items;

      orderItems.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          addToCart({
            id: item.menu_item_id,
            name: item.item_name || item.name,
            price: item.price_per_item,
            notes: item.notes || ''
          });
        }
      });

      setOrderInProgress(true);
      setActiveTab('new-order');
    } catch (error) {
    }
  };

  const handleCompleteHoldOrder = async (orderId) => {
    try {
      setLoading(true);
      // Mark as completing a held order (should print Invoice only, NOT KOT)
      setIsCompletingNewOrder(false);

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

        // Load saved discount if exists
        if (orderData.discount_type) {
          setDiscountType(orderData.discount_type);
          setDiscountValue(orderData.discount_value || 0);
        } else {
          setDiscountType('fixed');
          setDiscountValue(0);
        }

        // Reset paid amount
        setPaidAmount(0);

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
        toast.error('Failed to load order details: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      toast.error('Error loading order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = (orderId) => {
    setConfirmConfig({
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? The order will be marked as cancelled and excluded from reports.',
      confirmText: 'Yes, Cancel Order',
      cancelText: 'No',
      type: 'warning'
    });
    setConfirmAction(() => async () => {
      try {
        setLoading(true);
        const response = await api.updateOrderStatus(orderId, 'Cancelled');

        if (response.success) {
          toast.success('Order cancelled successfully');
          fetchOrders();
        } else {
          toast.error('Failed to cancel order: ' + (response.message || 'Unknown error'));
        }
      } catch (error) {
        toast.error('Error cancelling order');
      } finally {
        setLoading(false);
      }
    });
    setShowConfirmModal(true);
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
    }
  };

  const handlePrintInvoice = async (orderId = null) => {
    try {
      let orderIdToUse = orderId || currentOrderId;

      // If no order ID exists yet (new order not saved), create it first
      if (!orderIdToUse) {
        if (!pendingOrderData) {
          toast.error('Order details not found');
          return;
        }

        if (cart.length === 0) {
          toast.warning('Cart is empty');
          return;
        }

        setLoading(true);

        // Create the order
        const createResponse = await api.createOrder(pendingOrderData);
        if (!createResponse.success) {
          toast.error('Failed to create order');
          setLoading(false);
          return;
        }

        orderIdToUse = createResponse.order_id;
        setCurrentOrderId(orderIdToUse);

        // Add items to the order
        const items = cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price_per_item: item.price,
          notes: item.notes || ''
        }));

        await api.addOrderItems({
          order_id: orderIdToUse,
          items
        });

        // Mark that items were just saved to avoid duplicate save
        setItemsJustSaved(true);

        setLoading(false);
      }

      // Fetch current discount from database if exists
      try {
        const response = await api.getOrderDetails(orderIdToUse);
        if (response.success && response.data.order) {
          const order = response.data.order;
          // Load saved discount if exists
          if (order.discount_type) {
            setDiscountType(order.discount_type);
            setDiscountValue(order.discount_value || 0);
          } else {
            setDiscountType('fixed');
            setDiscountValue(0);
          }
        }
      } catch (error) {
        console.error('Error loading discount:', error);
        setDiscountType('fixed');
        setDiscountValue(0);
      }

      // Open discount modal
      setDiscountModalOrderId(orderIdToUse);
      setShowDiscountModal(true);
    } catch (error) {
      toast.error('Error preparing invoice');
      setLoading(false);
    }
  };

  const handleDiscountConfirmAndPrint = async (localDiscountType, localDiscountValue) => {
    try {
      setLoading(true);
      // Save items first (only if we have a current order with items in cart AND items weren't just saved)
      if (currentOrderId && cart.length > 0 && !itemsJustSaved) {
        const items = cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price_per_item: item.price,
          notes: item.notes || ''
        }));

        await api.addOrderItems({
          order_id: currentOrderId,
          items
        });
      }

      // Get order details to calculate discount on actual total
      let total = 0;
      try {
        const response = await api.getOrderDetails(discountModalOrderId);
        if (response.success && response.data.order) {
          total = parseFloat(response.data.order.total_amount) || 0;
        }
      } catch (error) {
        // Fallback to cart total if we can't get order details
        total = getTotalAmount();
      }

      // Calculate discount
      const discountAmount = localDiscountType === 'percentage'
        ? (total * localDiscountValue) / 100
        : parseFloat(localDiscountValue) || 0;
      const finalAmount = total - discountAmount;

      // Save discount to database
      await api.saveDiscount({
        order_id: discountModalOrderId,
        discount_type: localDiscountType,
        discount_value: parseFloat(localDiscountValue) || 0,
        discount_amount: discountAmount,
        final_amount: finalAmount
      });

      // Print invoice
      const invoiceResponse = await api.directPrintInvoice(discountModalOrderId);
      if (invoiceResponse.success) {
        toast.success('Invoice sent to printer successfully!');
      } else {
        toast.error('Failed to print invoice: ' + invoiceResponse.message);
      }

      setShowDiscountModal(false);
      setDiscountModalOrderId(null);
      setItemsJustSaved(false); // Reset the flag
    } catch (error) {
      toast.error('Error printing invoice: ' + error.message);
      setItemsJustSaved(false); // Reset even on error
    } finally {
      setLoading(false);
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
    const [localDiscountType, setLocalDiscountType] = useState('fixed');
    const [localDiscountValue, setLocalDiscountValue] = useState(0);
    const [localPaidAmount, setLocalPaidAmount] = useState(0);
    const hasLoadedRef = useRef(false);

    // Load saved discount when modal opens
    useEffect(() => {
      if (!showPaymentModal) {
        hasLoadedRef.current = false;
        return;
      }

      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;

      // Load discount from parent state (set by handleCompleteOrder or handleCompleteHoldOrder)
      setLocalDiscountType(discountType);
      setLocalDiscountValue(discountValue);
      setLocalPaidAmount(paidAmount);
    }, [showPaymentModal, discountType, discountValue, paidAmount]);

    const total = selectedOrderDetails ? calculateOrderTotal(selectedOrderDetails) : getTotalAmount();

    // Calculate discount amount
    const discountAmount = localDiscountType === 'percentage'
      ? (total * localDiscountValue) / 100
      : parseFloat(localDiscountValue) || 0;

    // Calculate final amount after discount
    const finalAmount = total - discountAmount;

    // Calculate balance for cash payments
    const balance = paymentMethod === 'Cash' ? (parseFloat(localPaidAmount) || 0) - finalAmount : 0;

    // Don't show modal if we're expecting selectedOrderDetails but it's null
    const isCompletingHoldOrder = currentOrderId && !orderInProgress;
    const shouldShowModal = showPaymentModal && (!isCompletingHoldOrder || selectedOrderDetails);

    const handleLocalPaymentConfirm = () => {
      handlePaymentConfirm(localDiscountType, localDiscountValue, localPaidAmount);
    };

    return (
      <Modal isOpen={shouldShowModal} onClose={() => {
        setShowPaymentModal(false);
        setSelectedOrderDetails(null);
        setDiscountType('fixed');
        setDiscountValue(0);
        setPaidAmount(0);
      }} title="Payment">
        <div className="payment-modal">
          <div className="order-total">
            <h3>Subtotal: Rs. {total.toFixed(2)}</h3>
          </div>

          {/* Discount Section */}
          <div className="discount-section">
            <h4>Discount</h4>
            <div className="discount-controls">
              <select
                value={localDiscountType}
                onChange={(e) => setLocalDiscountType(e.target.value)}
                className="discount-type-select"
              >
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={localDiscountValue}
                onChange={(e) => setLocalDiscountValue(e.target.value)}
                placeholder="0"
                className="discount-input"
              />
              {localDiscountType === 'percentage' && <span className="discount-symbol">%</span>}
            </div>
            {discountAmount > 0 && (
              <p className="discount-amount">Discount: - Rs. {discountAmount.toFixed(2)}</p>
            )}
          </div>

          <div className="final-amount">
            <h3>Final Amount: Rs. {finalAmount.toFixed(2)}</h3>
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

        {/* Cash Payment Section */}
        {paymentMethod === 'Cash' && (
          <div className="cash-payment-section">
            <h4>Cash Payment</h4>
            <div className="form-group">
              <label>Customer Paid Amount</label>
              <input
                type="number"
                min={finalAmount}
                step="0.01"
                value={localPaidAmount}
                onChange={(e) => setLocalPaidAmount(e.target.value)}
                placeholder="Enter amount received"
                className="payment-input"
              />
            </div>
            {localPaidAmount > 0 && (
              <div className="balance-display">
                <p className={balance >= 0 ? 'balance-positive' : 'balance-negative'}>
                  Balance: Rs. {balance.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        <button onClick={handleLocalPaymentConfirm} className="confirm-payment-btn">
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

  const DiscountModal = () => {
    const [orderTotal, setOrderTotal] = useState(0);
    const [localDiscountType, setLocalDiscountType] = useState('fixed');
    const [localDiscountValue, setLocalDiscountValue] = useState(0);
    const hasLoadedRef = useRef(false);

    // Fetch order total and discount only once when modal opens
    useEffect(() => {
      if (!showDiscountModal) {
        hasLoadedRef.current = false;
        return;
      }

      if (hasLoadedRef.current) return;

      const fetchOrderTotal = async () => {
        hasLoadedRef.current = true;
        if (discountModalOrderId) {
          try {
            const response = await api.getOrderDetails(discountModalOrderId);
            if (response.success && response.data.order) {
              setOrderTotal(parseFloat(response.data.order.total_amount) || 0);
              // Load saved discount if exists
              if (response.data.order.discount_type) {
                setLocalDiscountType(response.data.order.discount_type);
                setLocalDiscountValue(response.data.order.discount_value || 0);
              } else {
                setLocalDiscountType('fixed');
                setLocalDiscountValue(0);
              }
            }
          } catch (error) {
            console.error('Error fetching order total:', error);
            // Fallback to cart total
            setOrderTotal(getTotalAmount());
            setLocalDiscountType('fixed');
            setLocalDiscountValue(0);
          }
        } else {
          setOrderTotal(getTotalAmount());
          setLocalDiscountType('fixed');
          setLocalDiscountValue(0);
        }
      };

      fetchOrderTotal();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showDiscountModal, discountModalOrderId]);

    // Calculate discount amount
    const discountAmount = localDiscountType === 'percentage'
      ? (orderTotal * localDiscountValue) / 100
      : parseFloat(localDiscountValue) || 0;

    // Calculate final amount after discount
    const finalAmount = orderTotal - discountAmount;

    return (
      <Modal
        isOpen={showDiscountModal}
        onClose={() => {
          setShowDiscountModal(false);
          setDiscountModalOrderId(null);
        }}
        title="Apply Discount & Print Invoice"
      >
        <div className="payment-modal">
          <div className="order-total">
            <h3>Subtotal: Rs. {orderTotal.toFixed(2)}</h3>
          </div>

          {/* Discount Section */}
          <div className="discount-section">
            <h4>Discount (Optional)</h4>
            <div className="discount-controls">
              <select
                value={localDiscountType}
                onChange={(e) => setLocalDiscountType(e.target.value)}
                className="discount-type-select"
              >
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={localDiscountValue}
                onChange={(e) => setLocalDiscountValue(e.target.value)}
                placeholder="0"
                className="discount-input"
              />
              {localDiscountType === 'percentage' && <span className="discount-symbol">%</span>}
            </div>
            {discountAmount > 0 && (
              <p className="discount-amount">Discount: - Rs. {discountAmount.toFixed(2)}</p>
            )}
          </div>

          <div className="final-amount">
            <h3>Final Amount: Rs. {finalAmount.toFixed(2)}</h3>
          </div>

          <button onClick={() => handleDiscountConfirmAndPrint(localDiscountType, localDiscountValue)} className="confirm-payment-btn">
            Print Invoice
          </button>
        </div>
      </Modal>
    );
  };

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
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />

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
                          <img src={`${API_BASE_PATH}/${item.image_path}`} alt={item.name} />
                        ) : (
                          <div className="placeholder-image">📸</div>
                        )}
                      </div>
                      <h3>{item.name}</h3>
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
                  {orderDetails?.customerName && orderDetails?.customerMobile && (
                    <p style={{
                      color: customerVisitCount === 0 ? 'var(--color-success-600)' : 'var(--color-primary-600)',
                      fontWeight: 'var(--font-weight-semibold)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)'
                    }}>
                      {customerVisitCount === 0 ? (
                        <>
                          <span className="material-icons icon-sm" style={{ color: 'var(--color-success-600)' }}>new_releases</span>
                          <strong>New Customer!</strong>
                        </>
                      ) : (
                        <>
                          <span className="material-icons icon-sm" style={{ color: 'var(--color-primary-600)' }}>loyalty</span>
                          <strong>Visit #{customerVisitCount + 1}</strong> ({customerVisitCount} previous {customerVisitCount === 1 ? 'order' : 'orders'})
                        </>
                      )}
                    </p>
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
                          <div className="item-details-full">
                            <div className="item-header">
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
                            <div className="item-notes">
                              <input
                                type="text"
                                placeholder="Add notes (e.g., no onion, extra spicy)"
                                value={item.notes || ''}
                                onChange={(e) => updateCartItemNotes(item.id, e.target.value)}
                                className="notes-input"
                              />
                            </div>
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
                  {cart.length > 0 && (
                    <button onClick={() => handlePrintInvoice()} className="print-invoice-order-btn">
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
          {/* Search Field */}
          <div className="order-search-container">
            <div style={{position: 'relative', maxWidth: '400px'}}>
              <span className="material-icons" style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-tertiary)',
                fontSize: '20px'
              }}>search</span>
              <input
                type="text"
                placeholder="Search orders by ID, customer, mobile, or type..."
                value={orderSearchTerm}
                onChange={(e) => {
                  setOrderSearchTerm(e.target.value);
                  setHoldOrdersPage(1);
                  setCompletedOrdersPage(1);
                }}
                className="order-search-input"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 42px',
                  border: '2px solid var(--color-border-primary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  transition: 'all var(--transition-fast)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              />
            </div>
            {orderSearchTerm && (
              <button
                onClick={() => setOrderSearchTerm('')}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'var(--color-error-500)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span className="material-icons" style={{fontSize: '18px'}}>clear</span>
                Clear
              </button>
            )}
          </div>

          {/* Held Orders Section */}
          <div className="orders-section">
            <div className="section-header">
              <h2>Held Orders</h2>
              <span className="order-count">{getDisplayedHoldOrders().totalCount} orders</span>
            </div>
            <div className="orders-list">
              {getDisplayedHoldOrders().orders.map(order => (
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

            {/* Pagination for Held Orders */}
            {getDisplayedHoldOrders().totalPages > 1 && (
              <div className="pagination-controls-simple">
                <button
                  onClick={() => setHoldOrdersPage(holdOrdersPage - 1)}
                  disabled={holdOrdersPage === 1}
                  className="pagination-btn"
                >
                  <span className="material-icons">chevron_left</span>
                </button>
                <span className="pagination-info">
                  Page {holdOrdersPage} of {getDisplayedHoldOrders().totalPages}
                </span>
                <button
                  onClick={() => setHoldOrdersPage(holdOrdersPage + 1)}
                  disabled={holdOrdersPage === getDisplayedHoldOrders().totalPages}
                  className="pagination-btn"
                >
                  <span className="material-icons">chevron_right</span>
                </button>
              </div>
            )}
          </div>

          {/* Completed Orders Section */}
          <div className="orders-section">
            <div className="section-header">
              <h2>Completed Orders</h2>
              <span className="order-count">{getDisplayedCompletedOrders().totalCount} orders</span>
            </div>
            <div className="orders-list">
              {getDisplayedCompletedOrders().orders.map(order => (
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

            {/* Pagination for Completed Orders */}
            {getDisplayedCompletedOrders().totalPages > 1 && (
              <div className="pagination-controls-simple">
                <button
                  onClick={() => setCompletedOrdersPage(completedOrdersPage - 1)}
                  disabled={completedOrdersPage === 1}
                  className="pagination-btn"
                >
                  <span className="material-icons">chevron_left</span>
                </button>
                <span className="pagination-info">
                  Page {completedOrdersPage} of {getDisplayedCompletedOrders().totalPages}
                </span>
                <button
                  onClick={() => setCompletedOrdersPage(completedOrdersPage + 1)}
                  disabled={completedOrdersPage === getDisplayedCompletedOrders().totalPages}
                  className="pagination-btn"
                >
                  <span className="material-icons">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <OrderTypeModal />
      {renderDetailsModal()}
      <PaymentModal />
      <OrderDetailsModal />
      <DiscountModal />
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
      />
      {loading && <Spinner overlay />}
    </div>
  );
};

export default Orders;