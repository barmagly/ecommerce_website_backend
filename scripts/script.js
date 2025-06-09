const mongoose = require('mongoose');
const {Product} = require('../models/product.model'); // Adjust path to your model

async function insertProduct() {
  try {
    const product = new Product({
      name: "هاتف سامسونج جالاكسي S24 ألترا",
      description: "هاتف سامسونج جالاكسي S24 ألترا يأتي بشاشة 6.8 بوصة AMOLED عالية الدقة، أداء فائق وكاميرات احترافية تلتقط أدق التفاصيل.",
      brand: "سامسونج",
      category: new mongoose.Types.ObjectId("665f782dd28b0f69fc163c92"), // استبدلها بـ ID حقيقي من قاعدة البيانات
      price: 42999,
      hasVariants: false,
      stock: 120,
      sku: "SAMS24U-128GB-BLK",
      ratings: {
        average: 4.8,
        count: 200,
        distribution: {
          1: 1,
          2: 3,
          3: 10,
          4: 50,
          5: 136
        }
      },
      images: [
        {
          url: "https://example.com/images/s24-front-ar.jpg",
          alt: "صورة أمامية لهاتف سامسونج S24 ألترا",
          isPrimary: true
        },
        {
          url: "https://example.com/images/s24-back-ar.jpg",
          alt: "صورة خلفية لهاتف سامسونج S24 ألترا",
          isPrimary: false
        }
      ],
      imageCover: "https://example.com/images/s24-cover-ar.jpg",
      features: [
        { name: "الشاشة", value: "6.8 بوصة AMOLED بدقة QHD+" },
        { name: "المعالج", value: "Snapdragon 8 Gen 3" },
        { name: "البطارية", value: "5000 مللي أمبير مع شحن سريع" }
      ],
      specifications: [
        {
          group: "الكاميرا",
          items: [
            { name: "الخلفية", value: "200 ميجابكسل + 12 + 10 + 10" },
            { name: "الأمامية", value: "40 ميجابكسل" }
          ]
        },
        {
          group: "الاتصال",
          items: [
            { name: "الجيل الخامس", value: "مدعوم" },
            { name: "Wi-Fi", value: "Wi-Fi 6E" },
            { name: "Bluetooth", value: "الإصدار 5.3" }
          ]
        }
      ],
      attributes: [
        {
          name: "اللون",
          value: "أسود فانتوم"
        },
        {
          name: "السعة التخزينية",
          value: "128 جيجابايت"
        }
      ]
    });

    const savedProduct = await product.save();
    console.log('Product inserted successfully:', savedProduct);
  } catch (error) {
    console.error('Error inserting product:', error.message);
  }
}

// insertProduct();
mongoose.connect("mongodb+srv://barmaglyy:Wr4sTf0EjgvwvEGn@ecommerc.orhrblw.mongodb.net/?retryWrites=true&w=majority&appName=Ecommerc")
    .then(async () => {
        await insertProduct();
        console.log("Categories imported successfully");
        process.exit();
    })
    .catch(error => {
        console.error("Error importing categories", error);
        process.exit(1);
    });