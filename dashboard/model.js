const { Product } = require('../models/product.model');
const CategoryModel = require('../models/category.model');
const User = require('../models/user.model');
const OrderModel = require('../models/order.model');

const dashboardModel = {
  // Dashboard summary (example: count of each collection)
  async getDashboard() {
    const [products, categories, users, orders] = await Promise.all([
      Product.countDocuments(),
      CategoryModel.countDocuments(),
      User.countDocuments(),
      OrderModel.countDocuments()
    ]);
    return { 
      summary: { products, categories, users, orders },
      stats: {
        totalProducts: products,
        totalCategories: categories,
        totalUsers: users,
        totalOrders: orders
      }
    };
  },

  // Products CRUD
  async getProducts() {
    const products = await Product.find().populate('category');
    return { 
      products: products || [],
      size: products.length,
      total: products.length,
      count: products.length
    };
  },
  async postProducts(data) {
    const product = await Product.create(data);
    return { product, success: true };
  },
  async putProducts(id, data) {
    const product = await Product.findByIdAndUpdate(id, data, { new: true });
    return { product, success: true };
  },
  async deleteProducts(id) {
    const product = await Product.findByIdAndDelete(id);
    return { product, success: true };
  },

  // Categories CRUD
  async getCategories() {
    const categories = await CategoryModel.find();
    return { 
      categories: categories || [],
      size: categories.length,
      total: categories.length,
      count: categories.length
    };
  },
  async postCategories(data) {
    const category = await CategoryModel.create(data);
    return { category, success: true };
  },
  async putCategories(id, data) {
    const category = await CategoryModel.findByIdAndUpdate(id, data, { new: true });
    return { category, success: true };
  },
  async deleteCategories(id) {
    const category = await CategoryModel.findByIdAndDelete(id);
    return { category, success: true };
  },

  // Users CRUD
  async getUsers() {
    const users = await User.find().select('-password');
    return { 
      users: users || [],
      size: users.length,
      total: users.length,
      count: users.length
    };
  },
  async postUsers(data) {
    const user = await User.create(data);
    return { user, success: true };
  },
  async putUsers(id, data) {
    const user = await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
    return { user, success: true };
  },
  async deleteUsers(id) {
    const user = await User.findByIdAndDelete(id);
    return { user, success: true };
  },

  // Orders CRUD
  async getOrders() {
    const orders = await OrderModel.find().populate('user').populate('items.product');
    return { 
      orders: orders || [],
      size: orders.length,
      total: orders.length,
      count: orders.length
    };
  },
  async postOrders(data) {
    const order = await OrderModel.create(data);
    return { order, success: true };
  },
  async putOrders(id, data) {
    const order = await OrderModel.findByIdAndUpdate(id, data, { new: true });
    return { order, success: true };
  },
  async deleteOrders(id) {
    const order = await OrderModel.findByIdAndDelete(id);
    return { order, success: true };
  },

  // Profile (using User for now)
  async getProfile(id) {
    const profile = await User.findById(id).select('-password');
    return { profile, success: true };
  },
  async putProfile(id, data) {
    const profile = await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
    return { profile, success: true };
  }
};

module.exports = dashboardModel; 