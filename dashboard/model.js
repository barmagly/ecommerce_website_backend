const { Product } = require('../models/product.model');
const CategoryModel = require('../models/category.model');
const User = require('../models/user.model');
const OrderModel = require('../models/order.model');
const ReviewModel = require('../models/review.model');
const CouponModel = require('../models/coupon.model');
const CartModel = require('../models/cart.model');
const mongoose = require('mongoose');

const dashboardModel = {
  // Dashboard summary (example: count of each collection)
  async getDashboard() {
    try {
      // Check if collections exist
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);

      // Initialize counts with 0
      let products = 0, categories = 0, users = 0, orders = 0, reviews = 0, coupons = 0, carts = 0, totalSales = 0;

      // Only query collections that exist
      const promises = [];
      
      if (collectionNames.includes('products')) {
        promises.push(Product.countDocuments().then(count => products = count));
      }
      if (collectionNames.includes('categories')) {
        promises.push(CategoryModel.countDocuments().then(count => categories = count));
      }
      if (collectionNames.includes('users')) {
        promises.push(User.countDocuments().then(count => users = count));
      }
      if (collectionNames.includes('orders')) {
        promises.push(
          Promise.all([
            OrderModel.countDocuments().then(count => orders = count),
            OrderModel.aggregate([
              { $group: { _id: null, totalSales: { $sum: '$total' } } }
            ]).then(result => totalSales = result.length > 0 ? result[0].totalSales : 0)
          ])
        );
      }
      if (collectionNames.includes('reviews')) {
        promises.push(ReviewModel.countDocuments().then(count => reviews = count));
      }
      if (collectionNames.includes('coupons')) {
        promises.push(CouponModel.countDocuments().then(count => coupons = count));
      }
      if (collectionNames.includes('carts')) {
        promises.push(CartModel.countDocuments().then(count => carts = count));
      }

      await Promise.all(promises);

      const recentOrders = await this.getRecentOrders();
      const topProducts = await this.getTopProducts();

      return {
        overview: {
          totalProducts: products,
          totalCategories: categories,
          totalUsers: users,
          totalOrders: orders,
          totalReviews: reviews,
          totalCoupons: coupons,
          totalCarts: carts,
          totalSales: totalSales,
        },
        stats: {
          salesData: [],
          categoryData: [],
          recentOrders: recentOrders.recentOrders,
          topProducts: topProducts.topProducts,
          performanceMetrics: [],
        }
      };
    } catch (error) {
      console.error('Error in getDashboard:', error);
      throw new Error('Failed to fetch dashboard data: ' + error.message);
    }
  },

  async getRecentOrders() {
    const orders = await OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(5) // Get the 5 most recent orders
      .populate('user', 'name email')
      .populate('cartItems.product', 'name image');
    return { recentOrders: orders };
  },

  async getTopProducts() {
    const topProducts = await OrderModel.aggregate([
      { $unwind: '$cartItems' },
      { $group: {
          _id: '$cartItems.product',
          totalSold: { $sum: '$cartItems.quantity' },
          totalSales: { $sum: { $multiply: ['$cartItems.quantity', '$cartItems.price'] } },
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 5 }, // Get the top 5 products
      { $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
      }},
      { $unwind: '$productDetails' },
      { $lookup: {
          from: 'categories',
          localField: 'productDetails.category',
          foreignField: '_id',
          as: 'categoryDetails'
      }},
      { $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true } },
      { $project: {
          _id: '$productDetails._id',
          name: '$productDetails.name',
          imageCover: '$productDetails.image',
          category: '$categoryDetails',
          totalSold: 1,
          totalSales: 1,
      }},
    ]);
    return { topProducts: topProducts };
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