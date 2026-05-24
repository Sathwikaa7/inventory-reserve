import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  console.log("Creating warehouses...");
  
  // Create only 2 warehouses
  const mumbaiWarehouse = await prisma.warehouse.create({
    data: { name: "Mumbai Warehouse" },
  });

  const delhiWarehouse = await prisma.warehouse.create({
    data: { name: "Delhi Warehouse" },
  });

  console.log("Creating products...");

  // Create only 3 products
  const iphone15 = await prisma.product.create({
    data: { name: "iPhone 15" },
  });

  const playstation5 = await prisma.product.create({
    data: { name: "PlayStation 5" },
  });

  const airpods = await prisma.product.create({
    data: { name: "AirPods Pro" },
  });

  console.log("Creating inventory records...");

  // Create minimal inventory - only 6 records total
  const inventoryData = [
    // iPhone 15
    { productId: iphone15.id, warehouseId: mumbaiWarehouse.id, totalUnits: 10 },
    { productId: iphone15.id, warehouseId: delhiWarehouse.id, totalUnits: 5 },
    
    // PlayStation 5
    { productId: playstation5.id, warehouseId: mumbaiWarehouse.id, totalUnits: 7 },
    { productId: playstation5.id, warehouseId: delhiWarehouse.id, totalUnits: 3 },
    
    // AirPods Pro
    { productId: airpods.id, warehouseId: mumbaiWarehouse.id, totalUnits: 15 },
    { productId: airpods.id, warehouseId: delhiWarehouse.id, totalUnits: 12 },
  ];

  await prisma.inventory.createMany({
    data: inventoryData,
  });

  console.log("✅ Database seeded successfully!");
  console.log(`📦 Created ${inventoryData.length} inventory records`);
  console.log("🏢 Created 2 warehouses");
  console.log("📱 Created 3 products");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });