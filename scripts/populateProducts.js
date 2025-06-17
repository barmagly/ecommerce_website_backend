const mongoose = require('mongoose');
const { Product } = require('../models/product.model');
const CategoryModel = require('../models/category.model');

// Database connection
const MONGODB_URI = 'mongodb+srv://barmaglyy:Wr4sTf0EjgvwvEGn@ecommerc.orhrblw.mongodb.net/?retryWrites=true&w=majority&appName=Ecommerc';

// منتجات مصرية متنوعة مع تقييمات
const productsData = [
  // سوبر ماركت
  {
    name: "أرز بسمتي هندي",
    description: "أرز بسمتي هندي أصيل عالي الجودة، حبيبات طويلة ورائحة مميزة. مثالي للأرز باللبن والكبسة والمندي.",
    brand: "بسمتي",
    price: 45.99,
    supplierName: "شركة الأرز المصرية",
    supplierPrice: 32.99,
    stock: 500,
    sku: "RICE-BASMATI-5KG",
    imageCover: "https://m.media-amazon.com/images/I/71QKQ9mwVPL._AC_SL1500_.jpg",
    images: [
      {
        url: "https://m.media-amazon.com/images/I/71QKQ9mwVPL._AC_SL1500_.jpg",
        alt: "أرز بسمتي هندي حقيقي من أمازون",
        isPrimary: true
      }
    ],
    features: [
      { name: "الوزن", value: "5 كيلو" },
      { name: "النوع", value: "بسمتي هندي" },
      { name: "المنشأ", value: "الهند" }
    ]
  },
  {
    name: "زيت زيتون بكر ممتاز",
    description: "زيت زيتون بكر ممتاز من أجود أنواع الزيتون المصري، طبيعي 100% بدون إضافات. مثالي للسلطات والطبخ.",
    brand: "زيتون مصر",
    price: 89.99,
    supplierName: "مزارع الزيتون المصرية",
    supplierPrice: 65.99,
    stock: 200,
    sku: "OIL-OLIVE-1L",
    imageCover: "https://m.media-amazon.com/images/I/61Q5p1qjKGL._AC_SL1500_.jpg",
    images: [
      {
        url: "https://m.media-amazon.com/images/I/61Q5p1qjKGL._AC_SL1500_.jpg",
        alt: "زيت زيتون بكر ممتاز حقيقي من أمازون",
        isPrimary: true
      }
    ],
    features: [
      { name: "الحجم", value: "1 لتر" },
      { name: "النوع", value: "بكر ممتاز" },
      { name: "المنشأ", value: "مصر" }
    ]
  },
  {
    name: "شاي أحمد",
    description: "شاي أحمد الشهير، مزيج فريد من أجود أنواع الشاي الأسود. طعم غني ورائحة مميزة، مثالي للإفطار والعشاء.",
    brand: "أحمد",
    price: 12.99,
    supplierName: "شركة أحمد للشاي",
    supplierPrice: 8.99,
    stock: 1000,
    sku: "TEA-AHMED-100BAGS",
    imageCover: "https://m.media-amazon.com/images/I/81Qw1kQG8GL._AC_SL1500_.jpg",
    images: [
      {
        url: "https://m.media-amazon.com/images/I/81Qw1kQG8GL._AC_SL1500_.jpg",
        alt: "شاي أحمد حقيقي من أمازون",
        isPrimary: true
      }
    ],
    features: [
      { name: "الكمية", value: "100 كيس" },
      { name: "النوع", value: "شاي أسود" },
      { name: "الوزن", value: "200 جرام" }
    ]
  },
  // أجهزة كهربائية
  {
    name: "غسالة توشيبا أوتوماتيك",
    description: "غسالة توشيبا أوتوماتيك 10 كيلو، تحميل أمامي مع تكنولوجيا متقدمة لتوفير الماء والكهرباء. هادئة وفعالة.",
    brand: "توشيبا",
    price: 8999,
    supplierName: "توشيبا مصر",
    supplierPrice: 7200,
    stock: 50,
    sku: "WASHER-TOSHIBA-10KG",
    imageCover: "https://m.media-amazon.com/images/I/71Qw1kQG8GL._AC_SL1500_.jpg",
    images: [
      {
        url: "https://m.media-amazon.com/images/I/71Qw1kQG8GL._AC_SL1500_.jpg",
        alt: "غسالة توشيبا أوتوماتيك حقيقية من أمازون",
        isPrimary: true
      }
    ],
    features: [
      { name: "السعة", value: "10 كيلو" },
      { name: "النوع", value: "تحميل أمامي" },
      { name: "اللون", value: "أبيض" }
    ]
  },
  {
    name: "ثلاجة شارب نوفروست",
    description: "ثلاجة شارب نوفروست 400 لتر، نظام تبريد متقدم بدون ثلج. أرفف قابلة للتعديل ودرج خضروات كبير.",
    brand: "شارب",
    price: 12999,
    supplierName: "شارب مصر",
    supplierPrice: 10400,
    stock: 30,
    sku: "FRIDGE-SHARP-400L",
    imageCover: "https://m.media-amazon.com/images/I/71w2Qw1kQGL._AC_SL1500_.jpg",
    images: [
      {
        url: "https://m.media-amazon.com/images/I/71w2Qw1kQGL._AC_SL1500_.jpg",
        alt: "ثلاجة شارب نوفروست حقيقية من أمازون",
        isPrimary: true
      }
    ],
    features: [
      { name: "السعة", value: "400 لتر" },
      { name: "النظام", value: "نوفروست" },
      { name: "اللون", value: "فضي" }
    ]
  },
  // موبايلات وتابلت
  {
    name: "آيفون 15 برو ماكس",
    description: "آيفون 15 برو ماكس بمعالج A17 Pro وكاميرا 48 ميجابكسل وتصميم من التيتانيوم. أحدث تقنيات آبل في الهواتف الذكية.",
    brand: "آبل",
    price: 89999,
    supplierName: "آبل مصر",
    supplierPrice: 72000,
    stock: 25,
    sku: "IPHONE-15-PRO-MAX",
    imageCover: "https://m.media-amazon.com/images/I/81fxjeu8fdL._AC_SL1500_.jpg",
    images: [
      {
        url: "https://m.media-amazon.com/images/I/81fxjeu8fdL._AC_SL1500_.jpg",
        alt: "آيفون 15 برو ماكس حقيقي من أمازون",
        isPrimary: true
      }
    ],
    features: [
      { name: "السعة", value: "256 جيجابايت" },
      { name: "اللون", value: "تيتانيوم طبيعي" },
      { name: "الشاشة", value: "6.7 بوصة" }
    ]
  },
  {
    name: "سامسونج جالاكسي S24 ألترا",
    description: "سامسونج جالاكسي S24 ألترا مع قلم S وكاميرا 200 ميجابكسل وميزات الذكاء الاصطناعي. إطار من التيتانيوم.",
    brand: "سامسونج",
    price: 79999,
    supplierName: "سامسونج مصر",
    supplierPrice: 64000,
    stock: 20,
    sku: "SAMSUNG-S24-ULTRA",
    imageCover: "https://m.media-amazon.com/images/I/71qZyM4jRGL._AC_SL1500_.jpg",
    images: [
      {
        url: "https://m.media-amazon.com/images/I/71qZyM4jRGL._AC_SL1500_.jpg",
        alt: "سامسونج جالاكسي S24 ألترا حقيقي من أمازون",
        isPrimary: true
      }
    ],
    features: [
      { name: "السعة", value: "512 جيجابايت" },
      { name: "اللون", value: "رمادي تيتانيوم" },
      { name: "قلم S", value: "مرفق" }
    ]
  },
  // ملابس رجالي
  {
    name: "جونلة رجالي كلاسيكية",
    description: "جونلة رجالي كلاسيكية من القطن عالي الجودة، قصة مريحة ومناسبة للعمل والمناسبات الرسمية.",
    brand: "فاشن هاوس",
    price: 299.99,
    supplierName: "مصنع الملابس المصرية",
    supplierPrice: 180,
    stock: 150,
    sku: "SUIT-MEN-CLASSIC",
    imageCover: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800&h=600&fit=crop",
    images: [
      {
        url: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800&h=600&fit=crop",
        alt: "جونلة رجالي كلاسيكية",
        isPrimary: true
      }
    ],
    features: [
      { name: "الخامة", value: "قطن 100%" },
      { name: "القصة", value: "كلاسيكية" },
      { name: "اللون", value: "أزرق داكن" }
    ]
  },
  {
    name: "تيشيرت رجالي قطني",
    description: "تيشيرت رجالي قطني ناعم ومريح، مناسب للاستخدام اليومي. قصة كلاسيكية وألوان متعددة.",
    brand: "كوتون لاين",
    price: 89.99,
    supplierName: "مصنع النسيج المصري",
    supplierPrice: 55,
    stock: 300,
    sku: "TSHIRT-MEN-COTTON",
    imageCover: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=600&fit=crop",
    images: [
      {
        url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=600&fit=crop",
        alt: "تيشيرت رجالي قطني",
        isPrimary: true
      }
    ],
    features: [
      { name: "الخامة", value: "قطن 100%" },
      { name: "القصة", value: "كلاسيكية" },
      { name: "الألوان", value: "متعددة" }
    ]
  },
  // ملابس حريمي
  {
    name: "عباية أنيقة",
    description: "عباية أنيقة بتصميم عصري وأنيق، مناسبة للمناسبات والاستخدام اليومي. خامة عالية الجودة.",
    brand: "مودا",
    price: 599.99,
    supplierName: "دار الأزياء المصرية",
    supplierPrice: 360,
    stock: 80,
    sku: "ABAYA-ELEGANT",
    imageCover: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
    images: [
      {
        url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
        alt: "عباية أنيقة",
        isPrimary: true
      }
    ],
    features: [
      { name: "الخامة", value: "كريب عالي الجودة" },
      { name: "التصميم", value: "عصري" },
      { name: "اللون", value: "أسود" }
    ]
  },
  {
    name: "فستان سهرة",
    description: "فستان سهرة أنيق بتصميم عصري، مناسب للحفلات والمناسبات الخاصة. خامة فاخرة وتفاصيل دقيقة.",
    brand: "إليجانس",
    price: 899.99,
    supplierName: "دار الأزياء المصرية",
    supplierPrice: 540,
    stock: 45,
    sku: "DRESS-EVENING",
    imageCover: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=600&fit=crop",
    images: [
      {
        url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=600&fit=crop",
        alt: "فستان سهرة",
        isPrimary: true
      }
    ],
    features: [
      { name: "الخامة", value: "ساتان فاخر" },
      { name: "التصميم", value: "أنيق" },
      { name: "اللون", value: "أحمر" }
    ]
  },
  // أحذية وشنط
  {
    name: "حذاء رجالي كلاسيكي",
    description: "حذاء رجالي كلاسيكي من الجلد الطبيعي، مريح وأنيق. مناسب للعمل والمناسبات الرسمية.",
    brand: "ليذر كرافت",
    price: 399.99,
    supplierName: "مصنع الأحذية المصرية",
    supplierPrice: 240,
    stock: 100,
    sku: "SHOES-MEN-CLASSIC",
    imageCover: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop",
    images: [
      {
        url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop",
        alt: "حذاء رجالي كلاسيكي",
        isPrimary: true
      }
    ],
    features: [
      { name: "الخامة", value: "جلد طبيعي" },
      { name: "النوع", value: "كلاسيكي" },
      { name: "اللون", value: "بني" }
    ]
  },
  {
    name: "شنطة نسائية أنيقة",
    description: "شنطة نسائية أنيقة بتصميم عصري، مناسبة للعمل والمناسبات. جيوب متعددة وتنظيم ممتاز.",
    brand: "إليجانس",
    price: 299.99,
    supplierName: "مصنع الشنط المصرية",
    supplierPrice: 180,
    stock: 120,
    sku: "BAG-WOMEN-ELEGANT",
    imageCover: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=600&fit=crop",
    images: [
      {
        url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=600&fit=crop",
        alt: "شنطة نسائية أنيقة",
        isPrimary: true
      }
    ],
    features: [
      { name: "الخامة", value: "جلد صناعي" },
      { name: "الحجم", value: "متوسط" },
      { name: "اللون", value: "أسود" }
    ]
  },
  // مستحضرات تجميل
  {
    name: "كريم ترطيب للوجه",
    description: "كريم ترطيب للوجه من أجود المكونات الطبيعية، يرطب البشرة ويحميها من الجفاف. مناسب لجميع أنواع البشرة.",
    brand: "ناتشورال",
    price: 149.99,
    supplierName: "شركة التجميل المصرية",
    supplierPrice: 90,
    stock: 200,
    sku: "CREAM-MOISTURIZER",
    imageCover: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=600&fit=crop",
    images: [
      {
        url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=600&fit=crop",
        alt: "كريم ترطيب للوجه",
        isPrimary: true
      }
    ],
    features: [
      { name: "الحجم", value: "50 مل" },
      { name: "النوع", value: "طبيعي" },
      { name: "الاستخدام", value: "يومي" }
    ]
  },
  {
    name: "أحمر شفاه طويل المفعول",
    description: "أحمر شفاه طويل المفعول بألوان متعددة، لا يزول بسهولة ويحمي الشفاه من الجفاف. ملمس ناعم.",
    brand: "كوزمتيكس",
    price: 89.99,
    supplierName: "شركة التجميل المصرية",
    supplierPrice: 54,
    stock: 150,
    sku: "LIPSTICK-LONG-LASTING",
    imageCover: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&h=600&fit=crop",
    images: [
      {
        url: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&h=600&fit=crop",
        alt: "أحمر شفاه طويل المفعول",
        isPrimary: true
      }
    ],
    features: [
      { name: "الوزن", value: "3.5 جرام" },
      { name: "المفعول", value: "طويل" },
      { name: "الألوان", value: "متعددة" }
    ]
  },
  // ألعاب أطفال
  {
    name: "لعبة ليغو تعليمية",
    description: "لعبة ليغو تعليمية للأطفال، تساعد في تطوير المهارات الحركية والإبداعية. قطع آمنة ومناسبة للأطفال.",
    brand: "ليغو",
    price: 299.99,
    supplierName: "شركة الألعاب المصرية",
    supplierPrice: 180,
    stock: 80,
    sku: "TOY-LEGO-EDUCATIONAL",
    imageCover: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
    images: [
      {
        url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
        alt: "لعبة ليغو تعليمية",
        isPrimary: true
      }
    ],
    features: [
      { name: "العمر", value: "6+ سنوات" },
      { name: "النوع", value: "تعليمية" },
      { name: "القطع", value: "150 قطعة" }
    ]
  },
  {
    name: "دمية باربي",
    description: "دمية باربي كلاسيكية مع ملابس متعددة، شعر طويل وألوان متعددة. لعبة محبوبة للأطفال.",
    brand: "باربي",
    price: 199.99,
    supplierName: "شركة الألعاب المصرية",
    supplierPrice: 120,
    stock: 100,
    sku: "DOLL-BARBIE-CLASSIC",
    imageCover: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=600&fit=crop",
    images: [
      {
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=600&fit=crop",
        alt: "دمية باربي",
        isPrimary: true
      }
    ],
    features: [
      { name: "العمر", value: "3+ سنوات" },
      { name: "النوع", value: "دمية" },
      { name: "الملابس", value: "متعددة" }
    ]
  },
  // كتب
  {
    name: "كتاب العادات الذرية",
    description: "كتاب العادات الذرية لجيمس كلير، يشرح كيفية بناء عادات جيدة وكسر العادات السيئة. ترجمة عربية.",
    brand: "دار المعرفة",
    price: 89.99,
    supplierName: "دار النشر المصرية",
    supplierPrice: 54,
    stock: 200,
    sku: "BOOK-ATOMIC-HABITS",
    imageCover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&h=600&fit=crop",
    images: [
      {
        url: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&h=600&fit=crop",
        alt: "كتاب العادات الذرية",
        isPrimary: true
      }
    ],
    features: [
      { name: "الصفحات", value: "320" },
      { name: "اللغة", value: "العربية" },
      { name: "الغلاف", value: "عادي" }
    ]
  },
  {
    name: "كتاب سيكولوجية المال",
    description: "كتاب سيكولوجية المال لمورغان هاوسل، يشرح العلاقة النفسية بين الإنسان والمال. ترجمة عربية.",
    brand: "دار المعرفة",
    price: 79.99,
    supplierName: "دار النشر المصرية",
    supplierPrice: 48,
    stock: 150,
    sku: "BOOK-PSYCHOLOGY-MONEY",
    imageCover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop",
    images: [
      {
        url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop",
        alt: "كتاب سيكولوجية المال",
        isPrimary: true
      }
    ],
    features: [
      { name: "الصفحات", value: "256" },
      { name: "اللغة", value: "العربية" },
      { name: "الغلاف", value: "مقوى" }
    ]
  },
  // أدوات منزلية
  {
    name: "طقم أواني طبخ",
    description: "طقم أواني طبخ من الستانلس ستيل عالي الجودة، 10 قطع مع مقابض مقاومة للحرارة. مناسب لجميع أنواع الطبخ.",
    brand: "كيتشن برو",
    price: 899.99,
    supplierName: "مصنع الأواني المصرية",
    supplierPrice: 540,
    stock: 60,
    sku: "POTS-PANS-SET",
    imageCover: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&h=600&fit=crop",
    images: [
      {
        url: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&h=600&fit=crop",
        alt: "طقم أواني طبخ",
        isPrimary: true
      }
    ],
    features: [
      { name: "القطع", value: "10 قطع" },
      { name: "الخامة", value: "ستانلس ستيل" },
      { name: "اللون", value: "فضي" }
    ]
  },
  {
    name: "خلاط كهربائي",
    description: "خلاط كهربائي قوي مع كوب زجاجي، مناسب للعصائر والكوكتيلات والطحن. محرك قوي وضمان سنة.",
    brand: "كيتشن إيد",
    price: 299.99,
    supplierName: "مصنع الأجهزة المصرية",
    supplierPrice: 180,
    stock: 100,
    sku: "BLENDER-ELECTRIC",
    imageCover: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    images: [
      {
        url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
        alt: "خلاط كهربائي",
        isPrimary: true
      }
    ],
    features: [
      { name: "القوة", value: "500 واط" },
      { name: "الكوب", value: "1.5 لتر" },
      { name: "اللون", value: "أحمر" }
    ]
  }
];

const productsDataWithCover = productsData.map(product => {
  if (product.images && product.images.length > 0) {
    product.imageCover = product.images[0].url;
    // (اختياري) تأكد أن alt متطابق مع alt الصورة الأولى
    if (product.images[0].alt) {
      product.alt = product.images[0].alt;
    }
  }
  return product;
});

// ربط المنتجات بالفئات
const categoryMapping = {
  "أرز بسمتي هندي": "سوبر ماركت",
  "زيت زيتون بكر ممتاز": "سوبر ماركت",
  "شاي أحمد": "سوبر ماركت",
  "غسالة توشيبا أوتوماتيك": "أجهزة كهربائية",
  "ثلاجة شارب نوفروست": "أجهزة كهربائية",
  "آيفون 15 برو ماكس": "موبايلات وتابلت",
  "سامسونج جالاكسي S24 ألترا": "موبايلات وتابلت",
  "جونلة رجالي كلاسيكية": "ملابس رجالي",
  "تيشيرت رجالي قطني": "ملابس رجالي",
  "عباية أنيقة": "ملابس حريمي",
  "فستان سهرة": "ملابس حريمي",
  "حذاء رجالي كلاسيكي": "أحذية وشنط",
  "شنطة نسائية أنيقة": "أحذية وشنط",
  "كريم ترطيب للوجه": "مستحضرات تجميل",
  "أحمر شفاه طويل المفعول": "مستحضرات تجميل",
  "لعبة ليغو تعليمية": "ألعاب أطفال",
  "دمية باربي": "ألعاب أطفال",
  "كتاب العادات الذرية": "كتب",
  "كتاب سيكولوجية المال": "كتب",
  "طقم أواني طبخ": "أدوات منزلية",
  "خلاط كهربائي": "أدوات منزلية"
};

// دالة لتوليد تقييمات عشوائية واقعية
function generateRandomRatings() {
  const average = (Math.random() * 2 + 3).toFixed(1); // تقييم بين 3-5
  const count = Math.floor(Math.random() * 200) + 50; // عدد تقييمات بين 50-250
  
  // توزيع التقييمات
  const distribution = {
    '1': Math.floor(Math.random() * 10),
    '2': Math.floor(Math.random() * 20),
    '3': Math.floor(Math.random() * 40),
    '4': Math.floor(Math.random() * 80),
    '5': Math.floor(Math.random() * 100)
  };
  
  return { average: parseFloat(average), count, distribution };
}

async function populateProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // حذف جميع المنتجات القديمة
    await Product.deleteMany({});
    console.log('تم حذف جميع المنتجات القديمة.');

    // الحصول على الفئات
    const categories = await CategoryModel.find({});
    console.log('الفئات المتاحة:', categories.map(c => c.name));

    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    // إضافة المنتجات الجديدة
    const createdProducts = [];
    
    for (const productData of productsDataWithCover) {
      const categoryName = categoryMapping[productData.name];
      const categoryId = categoryMap[categoryName];
      
      if (!categoryId) {
        console.log(`فئة غير موجودة للمنتج: ${productData.name}`);
        continue;
      }

      const product = new Product({
        ...productData,
        category: categoryId,
        hasVariants: false,
        ratings: generateRandomRatings()
      });

      const savedProduct = await product.save();
      createdProducts.push(savedProduct);
      console.log(`تم إنشاء المنتج: ${savedProduct.name}`);
    }

    console.log(`\nتم إنشاء ${createdProducts.length} منتج بنجاح!`);
    
    // عرض ملخص المنتجات
    console.log('\nملخص المنتجات:');
    createdProducts.forEach(product => {
      console.log(`- ${product.name} (${product.brand}) - ${product.price} جنيه`);
    });

  } catch (error) {
    console.error('خطأ في إضافة المنتجات:', error);
  } finally {
    await mongoose.disconnect();
    console.log('تم قطع الاتصال بقاعدة البيانات');
  }
}

populateProducts(); 