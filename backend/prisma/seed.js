import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const img = (id, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

const productData = [
  {
    name: "Sundarban Raw Honey",
    nameBn: "সুন্দরবনের প্রাকৃতিক মধু",
    slug: "sundarban-raw-honey",
    sku: "HON-001",
    category: "honey",
    price: "950.00",
    salePrice: "850.00",
    unit: "500 gm",
    stock: 42,
    featured: true,
    description:
      "Unprocessed raw honey collected from the Sundarban mangrove forests. Naturally rich in antioxidants with a deep floral aroma.",
    descriptionBn:
      "সুন্দরবনের ম্যানগ্রোভ বন থেকে সংগ্রহ করা অপ্রক্রিয়াজাত খাঁটি মধু। প্রাকৃতিক অ্যান্টিঅক্সিডেন্টে ভরপুর এবং গভীর ফুলের সুবাসযুক্ত।",
    ingredients: "100% raw wild honey",
    ingredientsBn: "১০০% খাঁটি বন্য মধু",
    origin: "Sundarban, Khulna",
    originBn: "সুন্দরবন, খুলনা",
    storageInstructions: "Store in a cool, dry place away from direct sunlight. Do not refrigerate.",
    storageInstructionsBn: "সরাসরি রোদ থেকে দূরে শুকনো ও ঠান্ডা স্থানে রাখুন। ফ্রিজে রাখবেন না।",
    certification: "BSTI tested batch",
    certificationBn: "বিএসটিআই পরীক্ষিত ব্যাচ",
    images: [img("photo-1587049352846-4a222e784d38"), img("photo-1558642452-9d2a7deb7f62")],
  },
  {
    name: "Mustard Flower Honey",
    nameBn: "সরিষা ফুলের মধু",
    slug: "mustard-flower-honey",
    sku: "HON-002",
    category: "honey",
    price: "700.00",
    salePrice: null,
    unit: "500 gm",
    stock: 30,
    featured: false,
    description: "Light golden mustard flower honey harvested from the winter fields of Faridpur.",
    descriptionBn: "ফরিদপুরের শীতকালীন সরিষা ক্ষেত থেকে সংগ্রহ করা হালকা সোনালি রঙের মধু।",
    ingredients: "100% mustard flower honey",
    ingredientsBn: "১০০% সরিষা ফুলের মধু",
    origin: "Faridpur",
    originBn: "ফরিদপুর",
    storageInstructions: "Keep the jar tightly closed at room temperature.",
    storageInstructionsBn: "কক্ষ তাপমাত্রায় জারটি শক্তভাবে বন্ধ রাখুন।",
    certification: "Natural, no added sugar",
    certificationBn: "প্রাকৃতিক, অতিরিক্ত চিনি নেই",
    images: [img("photo-1587049352846-4a222e784d38")],
  },
  {
    name: "Pure Deshi Ghee",
    nameBn: "খাঁটি দেশি ঘি",
    slug: "pure-deshi-ghee",
    sku: "GHE-001",
    category: "ghee-oils",
    price: "1450.00",
    salePrice: "1350.00",
    unit: "500 gm",
    stock: 18,
    featured: true,
    description:
      "Slow-churned ghee made from the milk of grass-fed local cows. Rich, nutty aroma and traditional taste.",
    descriptionBn:
      "ঘাস খাওয়া দেশি গরুর দুধ থেকে ধীরে ধীরে তৈরি খাঁটি ঘি। ঘন, বাদামি সুবাস এবং ঐতিহ্যবাহী স্বাদ।",
    ingredients: "Cow milk butterfat",
    ingredientsBn: "গরুর দুধের মাখন",
    origin: "Pabna",
    originBn: "পাবনা",
    storageInstructions: "Store in an airtight glass jar. Use a dry spoon.",
    storageInstructionsBn: "বায়ুরোধী কাচের জারে রাখুন। শুকনো চামচ ব্যবহার করুন।",
    certification: "No preservatives",
    certificationBn: "কোনো সংরক্ষক নেই",
    images: [img("photo-1628088062854-d1870b4553da"), img("photo-1631452180519-c014fe946bc7")],
  },
  {
    name: "Cold-Pressed Mustard Oil",
    nameBn: "কোল্ড প্রেসড সরিষার তেল",
    slug: "cold-pressed-mustard-oil",
    sku: "OIL-001",
    category: "ghee-oils",
    price: "420.00",
    salePrice: "380.00",
    unit: "1 litre",
    stock: 55,
    featured: true,
    description: "Traditional cold-pressed mustard oil with a strong pungent aroma and natural nutrients.",
    descriptionBn: "ঐতিহ্যবাহী কোল্ড প্রেসড সরিষার তেল, তীব্র প্রাকৃতিক ঘ্রাণ ও পুষ্টিগুণে ভরপুর।",
    ingredients: "Mustard seeds",
    ingredientsBn: "সরিষার বীজ",
    origin: "Manikganj",
    originBn: "মানিকগঞ্জ",
    storageInstructions: "Keep away from sunlight in a cool place.",
    storageInstructionsBn: "সরাসরি রোদ থেকে দূরে ঠান্ডা স্থানে রাখুন।",
    certification: "Cold pressed",
    certificationBn: "কোল্ড প্রেসড",
    images: [img("photo-1474979266404-7eaacbcd87c5")],
  },
  {
    name: "Coconut Oil",
    nameBn: "নারকেল তেল",
    slug: "pure-coconut-oil",
    sku: "OIL-002",
    category: "ghee-oils",
    price: "520.00",
    salePrice: null,
    unit: "500 ml",
    stock: 26,
    featured: false,
    description: "Virgin coconut oil cold-pressed from fresh mature coconuts.",
    descriptionBn: "তাজা পাকা নারকেল থেকে কোল্ড প্রেস করা ভার্জিন নারকেল তেল।",
    ingredients: "Fresh coconut",
    ingredientsBn: "তাজা নারকেল",
    origin: "Barisal",
    originBn: "বরিশাল",
    storageInstructions: "Store below 25°C.",
    storageInstructionsBn: "২৫°C এর নিচে সংরক্ষণ করুন।",
    certification: "Virgin grade",
    certificationBn: "ভার্জিন গ্রেড",
    images: [img("photo-1474979266404-7eaacbcd87c5")],
  },
  {
    name: "Turmeric Powder",
    nameBn: "হলুদ গুঁড়া",
    slug: "pure-turmeric-powder",
    sku: "SPC-001",
    category: "spices",
    price: "260.00",
    salePrice: "230.00",
    unit: "250 gm",
    stock: 64,
    featured: true,
    description: "Stone-ground turmeric with high curcumin content and no artificial colour.",
    descriptionBn: "উচ্চ কারকিউমিনযুক্ত পাথরে ভাঙা হলুদ, কৃত্রিম রংমুক্ত।",
    ingredients: "Dried turmeric",
    ingredientsBn: "শুকনো হলুদ",
    origin: "Dinajpur",
    originBn: "দিনাজপুর",
    storageInstructions: "Keep in an airtight container.",
    storageInstructionsBn: "বায়ুরোধী পাত্রে রাখুন।",
    certification: "No artificial colour",
    certificationBn: "কৃত্রিম রং নেই",
    images: [img("photo-1615485500704-8e990f9900f7")],
  },
  {
    name: "Red Chilli Powder",
    nameBn: "লাল মরিচ গুঁড়া",
    slug: "red-chilli-powder",
    sku: "SPC-002",
    category: "spices",
    price: "280.00",
    salePrice: null,
    unit: "250 gm",
    stock: 48,
    featured: false,
    description: "Sun-dried red chillies ground without artificial colour or fillers.",
    descriptionBn: "রোদে শুকানো লাল মরিচ, কৃত্রিম রং বা ভেজাল ছাড়া ভাঙা।",
    ingredients: "Dried red chilli",
    ingredientsBn: "শুকনো লাল মরিচ",
    origin: "Bogura",
    originBn: "বগুড়া",
    storageInstructions: "Store in a cool, dry place.",
    storageInstructionsBn: "ঠান্ডা ও শুকনো স্থানে রাখুন।",
    certification: "No preservatives",
    certificationBn: "কোনো সংরক্ষক নেই",
    images: [img("photo-1615485500704-8e990f9900f7")],
  },
  {
    name: "Cinnamon Sticks",
    nameBn: "দারুচিনি",
    slug: "cinnamon-sticks",
    sku: "SPC-003",
    category: "spices",
    price: "340.00",
    salePrice: "310.00",
    unit: "200 gm",
    stock: 22,
    featured: false,
    description: "Aromatic cinnamon quills sourced from organic spice growers.",
    descriptionBn: "জৈব মসলা চাষীদের কাছ থেকে সংগ্রহ করা সুগন্ধি দারুচিনি।",
    ingredients: "Cinnamon",
    ingredientsBn: "দারুচিনি",
    origin: "Sylhet",
    originBn: "সিলেট",
    storageInstructions: "Keep in a dry container away from moisture.",
    storageInstructionsBn: "আর্দ্রতা থেকে দূরে শুকনো পাত্রে রাখুন।",
    certification: "Organic sourced",
    certificationBn: "জৈব উৎস",
    images: [img("photo-1599940824399-b87987ceb72a")],
  },
  {
    name: "Organic Amrapali Mango",
    nameBn: "জৈব আম্রপালি আম",
    slug: "organic-amrapali-mango",
    sku: "FRU-001",
    category: "fruits",
    price: "1200.00",
    salePrice: "1050.00",
    unit: "5 kg box",
    stock: 14,
    featured: true,
    description: "Sweet, fibreless Amrapali mangoes grown without synthetic pesticides.",
    descriptionBn: "কৃত্রিম কীটনাশক ছাড়া চাষ করা মিষ্টি, আঁশবিহীন আম্রপালি আম।",
    ingredients: "Fresh mangoes",
    ingredientsBn: "তাজা আম",
    origin: "Chapainawabganj",
    originBn: "চাঁপাইনবাবগঞ্জ",
    storageInstructions: "Keep at room temperature until ripe, then refrigerate.",
    storageInstructionsBn: "পাকার আগে কক্ষ তাপমাত্রায় রাখুন, পাকলে ফ্রিজে রাখুন।",
    certification: "Pesticide-free farm",
    certificationBn: "কীটনাশকমুক্ত খামার",
    images: [img("photo-1553279768-865429fa0078")],
  },
  {
    name: "Organic Papaya",
    nameBn: "জৈব পেঁপে",
    slug: "organic-papaya",
    sku: "FRU-002",
    category: "fruits",
    price: "120.00",
    salePrice: null,
    unit: "1 kg",
    stock: 35,
    featured: false,
    description: "Farm-fresh ripe papaya with naturally sweet flesh.",
    descriptionBn: "খামার থেকে তাজা পাকা পেঁপে, প্রাকৃতিকভাবে মিষ্টি।",
    ingredients: "Fresh papaya",
    ingredientsBn: "তাজা পেঁপে",
    origin: "Jashore",
    originBn: "যশোর",
    storageInstructions: "Refrigerate after ripening.",
    storageInstructionsBn: "পাকার পর ফ্রিজে রাখুন।",
    certification: "Pesticide-free farm",
    certificationBn: "কীটনাশকমুক্ত খামার",
    images: [img("photo-1517282009859-f000ec3b26fe")],
  },
  {
    name: "Organic Spinach",
    nameBn: "জৈব পালং শাক",
    slug: "organic-spinach",
    sku: "VEG-001",
    category: "vegetables",
    price: "60.00",
    salePrice: null,
    unit: "500 gm",
    stock: 40,
    featured: false,
    description: "Tender organic spinach leaves harvested the same morning.",
    descriptionBn: "সেদিন সকালে তোলা কচি জৈব পালং শাক।",
    ingredients: "Fresh spinach",
    ingredientsBn: "তাজা পালং শাক",
    origin: "Savar, Dhaka",
    originBn: "সাভার, ঢাকা",
    storageInstructions: "Refrigerate and wash before cooking.",
    storageInstructionsBn: "ফ্রিজে রাখুন, রান্নার আগে ধুয়ে নিন।",
    certification: "Pesticide-free farm",
    certificationBn: "কীটনাশকমুক্ত খামার",
    images: [img("photo-1576045057995-568f588f82fb")],
  },
  {
    name: "Organic Tomatoes",
    nameBn: "জৈব টমেটো",
    slug: "organic-tomatoes",
    sku: "VEG-002",
    category: "vegetables",
    price: "90.00",
    salePrice: "80.00",
    unit: "1 kg",
    stock: 8,
    featured: false,
    description: "Naturally ripened tomatoes with rich flavour, grown without chemical pesticides.",
    descriptionBn: "রাসায়নিক কীটনাশক ছাড়া চাষ করা প্রাকৃতিকভাবে পাকা স্বাদযুক্ত টমেটো।",
    ingredients: "Fresh tomatoes",
    ingredientsBn: "তাজা টমেটো",
    origin: "Gazipur",
    originBn: "গাজীপুর",
    storageInstructions: "Store at room temperature, refrigerate once cut.",
    storageInstructionsBn: "কক্ষ তাপমাত্রায় রাখুন, কাটার পর ফ্রিজে রাখুন।",
    certification: "Pesticide-free farm",
    certificationBn: "কীটনাশকমুক্ত খামার",
    images: [img("photo-1546094096-0df4bcaaa337")],
  },
  {
    name: "Organic Miniket Rice",
    nameBn: "জৈব মিনিকেট চাল",
    slug: "organic-miniket-rice",
    sku: "RIC-001",
    category: "rice-grains",
    price: "780.00",
    salePrice: "720.00",
    unit: "5 kg",
    stock: 50,
    featured: false,
    description: "Aromatic miniket rice milled from organic paddy without polishing additives.",
    descriptionBn: "জৈব ধান থেকে মাড়াই করা সুগন্ধি মিনিকেট চাল, পলিশিং সংযোজন ছাড়া।",
    ingredients: "Miniket rice",
    ingredientsBn: "মিনিকেট চাল",
    origin: "Naogaon",
    originBn: "নওগাঁ",
    storageInstructions: "Store in an airtight container away from moisture.",
    storageInstructionsBn: "আর্দ্রতা থেকে দূরে বায়ুরোধী পাত্রে রাখুন।",
    certification: "Organic paddy",
    certificationBn: "জৈব ধান",
    images: [img("photo-1586201375761-83865001e31c")],
  },
  {
    name: "Organic Red Lentil",
    nameBn: "জৈব মসুর ডাল",
    slug: "organic-red-lentil",
    sku: "RIC-002",
    category: "rice-grains",
    price: "320.00",
    salePrice: null,
    unit: "1 kg",
    stock: 39,
    featured: false,
    description: "Cleaned red lentils with no artificial colour or polish.",
    descriptionBn: "কৃত্রিম রং বা পলিশ ছাড়া পরিষ্কার লাল মসুর ডাল।",
    ingredients: "Red lentil",
    ingredientsBn: "মসুর ডাল",
    origin: "Faridpur",
    originBn: "ফরিদপুর",
    storageInstructions: "Keep dry and sealed.",
    storageInstructionsBn: "শুকনো ও বন্ধ পাত্রে রাখুন।",
    certification: "No artificial colour",
    certificationBn: "কৃত্রিম রং নেই",
    images: [img("photo-1586201375761-83865001e31c")],
  },
  {
    name: "Herbal Tulsi Tea",
    nameBn: "হারবাল তুলসী চা",
    slug: "herbal-tulsi-tea",
    sku: "HER-001",
    category: "herbal",
    price: "280.00",
    salePrice: "250.00",
    unit: "100 gm",
    stock: 28,
    featured: false,
    description: "Caffeine-free tulsi leaf tea blend for daily wellness.",
    descriptionBn: "দৈনন্দিন সুস্থতার জন্য ক্যাফেইনমুক্ত তুলসী পাতার চা।",
    ingredients: "Dried tulsi leaves, lemongrass",
    ingredientsBn: "শুকনো তুলসী পাতা, লেমনগ্রাস",
    origin: "Natore",
    originBn: "নাটোর",
    storageInstructions: "Keep in an airtight jar away from sunlight.",
    storageInstructionsBn: "সরাসরি রোদ থেকে দূরে বায়ুরোধী জারে রাখুন।",
    certification: "Herbal blend",
    certificationBn: "হারবাল ব্লেন্ড",
    images: [img("photo-1544787219-7f47ccb76574")],
  },
];

async function main() {
  const force = process.argv.includes("--force");
  const existing = await prisma.product.count();
  if (existing > 0 && !force) {
    console.log("Database already contains products. Use --force to reseed.");
    return;
  }

  if (force) {
    await prisma.notification.deleteMany();
    await prisma.orderRequest.deleteMany();
    await prisma.orderStatusHistory.deleteMany();
    await prisma.inventoryMovement.deleteMany();
    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.wishlistItem.deleteMany();
    await prisma.address.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.deliveryArea.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.banner.deleteMany();
    await prisma.storeSetting.deleteMany();
    await prisma.contactMessage.deleteMany();
    await prisma.user.deleteMany();
  }

  const admin = await prisma.user.create({
    data: {
      name: "Organic Shop Admin",
      email: "admin@organic.test",
      phone: "01700000001",
      passwordHash: await bcrypt.hash("Admin123!", 10),
      role: "ADMIN",
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: "Rahim Ahmed",
      email: "customer@organic.test",
      phone: "01700000002",
      passwordHash: await bcrypt.hash("Customer123!", 10),
      role: "CUSTOMER",
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "Nusrat Jahan",
      email: "nusrat@organic.test",
      phone: "01700000003",
      passwordHash: await bcrypt.hash("Customer123!", 10),
      role: "CUSTOMER",
    },
  });

  const categoryDefs = [
    { key: "honey", name: "Honey", nameBn: "মধু", sortOrder: 1 },
    { key: "ghee-oils", name: "Ghee & Oils", nameBn: "ঘি ও তেল", sortOrder: 2 },
    { key: "spices", name: "Spices", nameBn: "মসলা", sortOrder: 3 },
    { key: "fruits", name: "Fruits", nameBn: "ফলমূল", sortOrder: 4 },
    { key: "vegetables", name: "Vegetables", nameBn: "সবজি", sortOrder: 5 },
    { key: "rice-grains", name: "Rice & Grains", nameBn: "চাল ও ডাল", sortOrder: 6 },
    { key: "herbal", name: "Herbal & Wellness", nameBn: "হারবাল ও সুস্থতা", sortOrder: 7 },
  ];
  const categories = {};
  for (const category of categoryDefs) {
    categories[category.key] = await prisma.category.create({
      data: {
        name: category.name,
        nameBn: category.nameBn,
        slug: category.key,
        description: `Organic ${category.name.toLowerCase()} sourced from trusted Bangladeshi farms.`,
        descriptionBn: `বিশ্বস্ত বাংলাদেশি খামার থেকে সংগ্রহ করা জৈব ${category.nameBn}।`,
        sortOrder: category.sortOrder,
        imageUrl: img("photo-1542838132-92c53300491e", 600),
      },
    });
  }

  const products = {};
  for (const item of productData) {
    const product = await prisma.product.create({
      data: {
        name: item.name,
        nameBn: item.nameBn,
        slug: item.slug,
        sku: item.sku,
        description: item.description,
        descriptionBn: item.descriptionBn,
        ingredients: item.ingredients,
        ingredientsBn: item.ingredientsBn,
        origin: item.origin,
        originBn: item.originBn,
        storageInstructions: item.storageInstructions,
        storageInstructionsBn: item.storageInstructionsBn,
        certification: item.certification,
        certificationBn: item.certificationBn,
        categoryId: categories[item.category].id,
        price: item.price,
        salePrice: item.salePrice,
        unit: item.unit,
        stock: item.stock,
        lowStockThreshold: 10,
        images: item.images,
        published: true,
        featured: item.featured,
      },
    });
    products[item.slug] = product;
    await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        type: "RESTOCK",
        quantity: item.stock,
        referenceType: "seed",
        note: "Opening stock",
        createdBy: admin.id,
      },
    });
  }

  const dhaka = await prisma.deliveryArea.create({
    data: {
      name: "Dhaka City",
      nameBn: "ঢাকা সিটি",
      division: "Dhaka",
      district: "Dhaka",
      charge: "60.00",
      freeDeliveryThreshold: "1500.00",
      sortOrder: 1,
    },
  });
  const dhakaOutside = await prisma.deliveryArea.create({
    data: {
      name: "Dhaka Suburbs",
      nameBn: "ঢাকা শহরতলী",
      division: "Dhaka",
      district: "Gazipur",
      charge: "100.00",
      freeDeliveryThreshold: "2000.00",
      sortOrder: 2,
    },
  });
  await prisma.deliveryArea.create({
    data: {
      name: "Chattogram",
      nameBn: "চট্টগ্রাম",
      division: "Chattogram",
      district: "Chattogram",
      charge: "150.00",
      freeDeliveryThreshold: "2500.00",
      sortOrder: 3,
    },
  });
  await prisma.deliveryArea.create({
    data: {
      name: "Other Districts",
      nameBn: "অন্যান্য জেলা",
      division: "Bangladesh",
      district: "Other",
      charge: "180.00",
      freeDeliveryThreshold: "3000.00",
      sortOrder: 4,
    },
  });

  const coupon = await prisma.coupon.create({
    data: {
      code: "ORGANIC10",
      description: "10% off on orders over ৳1000",
      type: "PERCENTAGE",
      value: "10.00",
      minOrderAmount: "1000.00",
      maxDiscount: "300.00",
      usageLimit: 500,
      perCustomerLimit: 3,
      startsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.address.createMany({
    data: [
      {
        userId: customer.id,
        label: "Home",
        recipientName: "Rahim Ahmed",
        phone: "01700000002",
        division: "Dhaka",
        district: "Dhaka",
        area: "Dhanmondi",
        addressLine: "House 12, Road 5, Dhanmondi",
        postalCode: "1205",
        isDefault: true,
      },
      {
        userId: customer2.id,
        label: "Home",
        recipientName: "Nusrat Jahan",
        phone: "01700000003",
        division: "Dhaka",
        district: "Gazipur",
        area: "Tongi",
        addressLine: "Station Road, Tongi",
        postalCode: "1710",
        isDefault: true,
      },
    ],
  });

  await prisma.banner.createMany({
    data: [
      {
        title: "Pure food from trusted farms",
        titleBn: "বিশ্বস্ত খামার থেকে খাঁটি খাবার",
        subtitle: "Raw honey, deshi ghee, cold-pressed oils and more.",
        subtitleBn: "খাঁটি মধু, দেশি ঘি, কোল্ড প্রেসড তেল ও আরও অনেক কিছু।",
        imageUrl: img("photo-1542838132-92c53300491e", 1600),
        link: "/shop?featured=1",
        sortOrder: 1,
      },
      {
        title: "Free delivery over ৳1500",
        titleBn: "৳১৫০০ এর বেশি অর্ডারে ফ্রি ডেলিভারি",
        subtitle: "Inside Dhaka city. Freshness delivered to your door.",
        subtitleBn: "ঢাকা সিটির ভেতরে। আপনার দরজায় তাজা পণ্য পৌঁছে যাবে।",
        imageUrl: img("photo-1542838132-92c53300491e", 1600),
        link: "/shop",
        sortOrder: 2,
      },
    ],
  });

  const settings = {
    storeName: "Organic Shop",
    storeNameBn: "অর্গানিক শপ",
    storePhone: "+8801700000000",
    storeEmail: "hello@organic.test",
    storeAddress: "House 10, Road 2, Dhanmondi, Dhaka 1205",
    storeAddressBn: "বাড়ি ১০, রোড ২, ধানমন্ডি, ঢাকা ১২০৫",
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    whatsapp: "8801700000000",
    aboutUs:
      "We bring carefully sourced organic food from trusted Bangladeshi farms to your family. Every product is selected for purity, freshness and fair farming.",
    aboutUsBn:
      "আমরা বিশ্বস্ত বাংলাদেশি খামার থেকে যত্নে সংগ্রহ করা জৈব খাবার আপনার পরিবারের কাছে পৌঁছে দিই। প্রতিটি পণ্য বিশুদ্ধতা, সজীবতা ও ন্যায্য চাষের জন্য বাছাই করা।",
    deliveryInfo: "Inside Dhaka delivery within 24-48 hours. Outside Dhaka within 3-5 working days.",
    deliveryInfoBn: "ঢাকার ভেতরে ২৪-৪৮ ঘণ্টায় ডেলিভারি। ঢাকার বাইরে ৩-৫ কর্মদিবসে।",
    returnPolicy: "Report damaged or incorrect products within 24 hours of delivery for a replacement or refund.",
    returnPolicyBn: "ডেলিভারির ২৪ ঘণ্টার মধ্যে নষ্ট বা ভুল পণ্য জানালে বদল বা ফেরত দেওয়া হবে।",
    privacyPolicy:
      "We collect only the information needed to process orders and improve your shopping experience. We never sell customer data.",
    privacyPolicyBn:
      "আমরা অর্ডার প্রক্রিয়া ও আপনার কেনাকাটার অভিজ্ঞতা উন্নত করতে প্রয়োজনীয় তথ্য সংগ্রহ করি। আমরা কখনো গ্রাহকের তথ্য বিক্রি করি না।",
    terms:
      "Orders are subject to product availability. Prices and delivery charges are confirmed at checkout. Cash on delivery is currently available.",
    termsBn:
      "অর্ডার পণ্যের স্টকের উপর নির্ভরশীল। চেকআউটে দাম ও ডেলিভারি চার্জ নিশ্চিত করা হয়। বর্তমানে ক্যাশ অন ডেলিভারি চালু আছে।",
    faq: JSON.stringify([
      {
        q: "How do I know the products are organic?",
        a: "We source from farms we visit and verify. Certifications are shown on each product page where available.",
      },
      {
        q: "What payment methods do you accept?",
        a: "Cash on delivery is available now. Online payments will be added soon.",
      },
      {
        q: "Can I cancel an order?",
        a: "Orders can be cancelled from your account before they are shipped.",
      },
    ]),
    faqBn: JSON.stringify([
      { q: "পণ্যগুলো জৈব কি না কীভাবে বুঝব?", a: "আমরা নিজেরা পরিদর্শন করা খামার থেকে পণ্য সংগ্রহ করি। যেখানে প্রযোজ্য সেখানে সনদ দেখানো হয়।" },
      { q: "পেমেন্ট কীভাবে করব?", a: "বর্তমানে ক্যাশ অন ডেলিভারি চালু আছে। শীঘ্রই অনলাইন পেমেন্ট যোগ হবে।" },
      { q: "অর্ডার বাতিল করা যাবে?", a: "শিপিংয়ের আগে অ্যাকাউন্ট থেকে অর্ডার বাতিল করা যাবে।" },
    ]),
  };
  await prisma.storeSetting.createMany({
    data: Object.entries(settings).map(([key, value]) => ({ key, value })),
  });

  const orderSeeds = [
    {
      user: customer,
      area: dhaka,
      status: "DELIVERED",
      paymentStatus: "PAID",
      daysAgo: 12,
      items: [
        { slug: "sundarban-raw-honey", quantity: 2 },
        { slug: "pure-deshi-ghee", quantity: 1 },
        { slug: "pure-turmeric-powder", quantity: 2 },
      ],
      coupon,
      review: { slug: "sundarban-raw-honey", rating: 5, comment: "Excellent raw honey. The aroma and taste are authentic." },
    },
    {
      user: customer,
      area: dhaka,
      status: "SHIPPED",
      paymentStatus: "UNPAID",
      daysAgo: 3,
      items: [
        { slug: "cold-pressed-mustard-oil", quantity: 2 },
        { slug: "organic-red-lentil", quantity: 1 },
      ],
      coupon: null,
    },
    {
      user: customer2,
      area: dhakaOutside,
      status: "PENDING",
      paymentStatus: "UNPAID",
      daysAgo: 1,
      items: [
        { slug: "organic-amrapali-mango", quantity: 1 },
        { slug: "organic-papaya", quantity: 2 },
      ],
      coupon: null,
    },
  ];

  let sequence = 1;
  for (const seed of orderSeeds) {
    const createdAt = new Date(Date.now() - seed.daysAgo * 24 * 60 * 60 * 1000);
    const items = seed.items.map((line) => {
      const product = products[line.slug];
      const unitPrice = product.salePrice || product.price;
      return {
        product,
        quantity: line.quantity,
        unitPrice,
        lineTotal: Number(unitPrice) * line.quantity,
      };
    });
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    let discount = 0;
    if (seed.coupon && subtotal >= Number(seed.coupon.minOrderAmount)) {
      discount = Math.min(subtotal * 0.1, Number(seed.coupon.maxDiscount || 300));
    }
    const free = seed.area.freeDeliveryThreshold && subtotal - discount >= Number(seed.area.freeDeliveryThreshold);
    const deliveryFee = free ? 0 : Number(seed.area.charge);
    const total = subtotal - discount + deliveryFee;
    const orderNumber = `ORG-SEED-${String(sequence++).padStart(4, "0")}`;
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: seed.user.id,
        status: seed.status,
        paymentMethod: "COD",
        paymentStatus: seed.paymentStatus,
        subtotal: subtotal.toFixed(2),
        discount: discount.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total.toFixed(2),
        couponId: discount > 0 ? seed.coupon.id : null,
        couponCode: discount > 0 ? seed.coupon.code : null,
        shippingName: seed.user.name,
        shippingPhone: seed.user.phone,
        shippingDivision: seed.area.division,
        shippingDistrict: seed.area.district,
        shippingArea: seed.area.name,
        shippingAddress: "Seeded demo address",
        idempotencyKey: `seed-${orderNumber}`,
        createdAt,
        deliveredAt: seed.status === "DELIVERED" ? new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
        items: {
          create: items.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            productNameBn: item.product.nameBn,
            unit: item.product.unit,
            price: item.product.price,
            salePrice: item.product.salePrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal.toFixed(2),
            imageUrl: item.product.images[0],
          })),
        },
      },
    });

    const timeline = {
      PENDING: ["PENDING"],
      SHIPPED: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"],
      DELIVERED: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"],
    }[seed.status] || [seed.status];
    for (let index = 0; index < timeline.length; index++) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: timeline[index],
          note: index === 0 ? "Order placed" : `Status changed to ${timeline[index]}`,
          changedBy: index === 0 ? seed.user.id : admin.id,
          createdAt: new Date(createdAt.getTime() + index * 6 * 60 * 60 * 1000),
        },
      });
    }
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.product.id },
        data: { stock: { decrement: item.quantity } },
      });
      await prisma.inventoryMovement.create({
        data: {
          productId: item.product.id,
          type: "SALE",
          quantity: -item.quantity,
          referenceType: "order",
          referenceId: order.id,
          note: `Seed order ${orderNumber}`,
          createdBy: seed.user.id,
          createdAt,
        },
      });
    }
    if (discount > 0) {
      await prisma.coupon.update({ where: { id: seed.coupon.id }, data: { usedCount: { increment: 1 } } });
    }
    if (seed.review) {
      const product = products[seed.review.slug];
      await prisma.review.create({
        data: {
          productId: product.id,
          userId: seed.user.id,
          orderId: order.id,
          rating: seed.review.rating,
          comment: seed.review.comment,
        },
      });
    }
    await prisma.notification.create({
      data: {
        userId: seed.user.id,
        orderId: order.id,
        title: "Order update",
        message: `Your order ${orderNumber} is ${seed.status.toLowerCase()}.`,
        read: seed.status === "DELIVERED",
        createdAt,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Admin:    admin@organic.test / Admin123! (phone 01700000001)");
  console.log("Customer: customer@organic.test / Customer123! (phone 01700000002)");
  console.log("Customer: nusrat@organic.test / Customer123! (phone 01700000003)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
