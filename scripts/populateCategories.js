const mongoose = require('mongoose');
const CategoryModel = require('../models/category.model');

// Database connection
const MONGODB_URI = 'mongodb+srv://barmaglyy:Wr4sTf0EjgvwvEGn@ecommerc.orhrblw.mongodb.net/?retryWrites=true&w=majority&appName=Ecommerc';

// أقسام مصرية واقعية مع صور مطابقة للأسماء
const categoriesData = [
  { 
    name: "سوبر ماركت", 
    slug: "سوبر-ماركت", 
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop" 
  },
  { 
    name: "أجهزة كهربائية", 
    slug: "اجهزة-كهربائية", 
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop" 
  },
  { 
    name: "موبايلات وتابلت", 
    slug: "موبايلات-تابلت", 
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop" 
  },
  { 
    name: "ملابس رجالي", 
    slug: "ملابس-رجالي", 
    image: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800&h=600&fit=crop" 
  },
  { 
    name: "ملابس حريمي", 
    slug: "ملابس-حريمي", 
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=600&fit=crop" 
  },
  { 
    name: "أحذية وشنط", 
    slug: "احذية-شنط", 
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop" 
  },
  { 
    name: "مستحضرات تجميل", 
    slug: "مستحضرات-تجميل", 
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=600&fit=crop" 
  },
  { 
    name: "ألعاب أطفال", 
    slug: "العاب-اطفال", 
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop" 
  },
  { 
    name: "كتب", 
    slug: "كتب", 
    image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&h=600&fit=crop" 
  },
  { 
    name: "أدوات منزلية", 
    slug: "ادوات-منزلية", 
    image: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&h=600&fit=crop" 
  }
];

async function populateCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // حذف جميع الفئات القديمة
    await CategoryModel.deleteMany({});
    console.log('تم حذف جميع الفئات القديمة.');

    // إضافة الفئات الجديدة
    const createdCategories = [];
    for (const categoryData of categoriesData) {
      const category = new CategoryModel(categoryData);
      const savedCategory = await category.save();
      createdCategories.push(savedCategory);
      console.log(`تمت إضافة القسم: ${savedCategory.name}`);
    }

    console.log(`\nتمت إضافة ${createdCategories.length} قسم جديد!`);
    const allCategories = await CategoryModel.find({});
    console.log('\nجميع الأقسام:');
    allCategories.forEach(category => {
      console.log(`- ${category.name} (${category.slug})`);
    });

  } catch (error) {
    console.error('Error populating categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
populateCategories(); 