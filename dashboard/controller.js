const dashboardModel = require('./model');

const dashboardController = {
  // Dashboard overview
  async getDashboard(req, res) {
    try {
      const result = await dashboardModel.getDashboard();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getRecentOrders(req, res) {
    try {
      const result = await dashboardModel.getRecentOrders();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getTopProducts(req, res) {
    try {
      const result = await dashboardModel.getTopProducts();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Products CRUD
  async getProducts(req, res) {
    try {
      const result = await dashboardModel.getProducts();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async postProducts(req, res) {
    try {
      const result = await dashboardModel.postProducts(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async putProducts(req, res) {
    try {
      const result = await dashboardModel.putProducts(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async deleteProducts(req, res) {
    try {
      const result = await dashboardModel.deleteProducts(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Categories CRUD
  async getCategories(req, res) {
    try {
      const result = await dashboardModel.getCategories();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async postCategories(req, res) {
    try {
      const result = await dashboardModel.postCategories(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async putCategories(req, res) {
    try {
      const result = await dashboardModel.putCategories(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async deleteCategories(req, res) {
    try {
      const result = await dashboardModel.deleteCategories(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Users CRUD
  async getUsers(req, res) {
    try {
      const result = await dashboardModel.getUsers();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async postUsers(req, res) {
    try {
      const result = await dashboardModel.postUsers(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async putUsers(req, res) {
    try {
      const result = await dashboardModel.putUsers(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async deleteUsers(req, res) {
    try {
      const result = await dashboardModel.deleteUsers(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Orders CRUD
  async getOrders(req, res) {
    try {
      const result = await dashboardModel.getOrders();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async postOrders(req, res) {
    try {
      const result = await dashboardModel.postOrders(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async putOrders(req, res) {
    try {
      const result = await dashboardModel.putOrders(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async deleteOrders(req, res) {
    try {
      const result = await dashboardModel.deleteOrders(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Profile
  async getProfile(req, res) {
    try {
      const result = await dashboardModel.getProfile(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async putProfile(req, res) {
    try {
      const result = await dashboardModel.putProfile(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = dashboardController; 