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
    return { summary: { products, categories, users, orders } };
  },

  // Products CRUD
  async getProducts() {
    const products = await Product.find();
    return { products };
  },
  async postProducts(data) {
    const product = await Product.create(data);
    return { product };
  },
  async putProducts(id, data) {
    const product = await Product.findByIdAndUpdate(id, data, { new: true });
    return { product };
  },
  async deleteProducts(id) {
    const product = await Product.findByIdAndDelete(id);
    return { product };
  },

  // Categories CRUD
  async getCategories() {
    const categories = await CategoryModel.find();
    return { categories };
  },
  async postCategories(data) {
    const category = await CategoryModel.create(data);
    return { category };
  },
  async putCategories(id, data) {
    const category = await CategoryModel.findByIdAndUpdate(id, data, { new: true });
    return { category };
  },
  async deleteCategories(id) {
    const category = await CategoryModel.findByIdAndDelete(id);
    return { category };
  },

  // Users CRUD
  async getUsers() {
    const users = await User.find();
    return { users };
  },
  async postUsers(data) {
    const user = await User.create(data);
    return { user };
  },
  async putUsers(id, data) {
    const user = await User.findByIdAndUpdate(id, data, { new: true });
    return { user };
  },
  async deleteUsers(id) {
    const user = await User.findByIdAndDelete(id);
    return { user };
  },

  // Orders CRUD
  async getOrders() {
    const orders = await OrderModel.find();
    return { orders };
  },
  async postOrders(data) {
    const order = await OrderModel.create(data);
    return { order };
  },
  async putOrders(id, data) {
    const order = await OrderModel.findByIdAndUpdate(id, data, { new: true });
    return { order };
  },
  async deleteOrders(id) {
    const order = await OrderModel.findByIdAndDelete(id);
    return { order };
  },

  // Profile (using User for now)
  async getProfile(id) {
    const profile = await User.findById(id);
    return { profile };
  },
  async putProfile(id, data) {
    const profile = await User.findByIdAndUpdate(id, data, { new: true });
    return { profile };
  }
};

module.exports = dashboardModel; 