const fetchOrders = async () => {
  try {
    setLoading(true);
    const response = await orderService.getAll();
    // Fix: Use response.data.orders instead of response.data
    setOrders(response.data.orders || []);
  } catch (error) {
    console.error('Error fetching orders:', error);
    setOrders([]);
    toast.error('حدث خطأ أثناء تحميل الطلبات');
  } finally {
    setLoading(false);
  }
}; 