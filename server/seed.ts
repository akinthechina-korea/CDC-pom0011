// Seed script for initial master data
import { db } from "./db";
import { cargo, vehicles, fieldStaff, officeStaff } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Check if data already exists
    const existingCargo = await db.select().from(cargo);
    if (existingCargo.length > 0) {
      console.log("✓ Database already seeded, skipping...");
      return;
    }

    // Seed Cargo
    await db.insert(cargo).values([
      { containerNo: 'TCLU8239466', blNo: 'CHL20251001', date: '2025-10-01' },
      { containerNo: 'MSKU4598321', blNo: 'CHL20251002', date: '2025-10-02' },
      { containerNo: 'TEMU6198324', blNo: 'CHL20251003', date: '2025-10-03' },
    ]);
    console.log("✓ Seeded cargo data");

    // Seed Vehicles
    await db.insert(vehicles).values([
      { vehicleNo: '89하1234', driverName: '박영호', driverPhone: '010-9942-1118' },
      { vehicleNo: '81머5532', driverName: '최민재', driverPhone: '010-7102-9983' },
      { vehicleNo: '83기9224', driverName: '오세민', driverPhone: '010-2994-8821' },
    ]);
    console.log("✓ Seeded vehicles data");

    // Seed Field Staff
    await db.insert(fieldStaff).values([
      { name: '김도훈', phone: '010-2384-1156' },
      { name: '장지윤', phone: '010-5529-6681' },
      { name: '정현준', phone: '010-7132-2248' },
    ]);
    console.log("✓ Seeded field staff data");

    // Seed Office Staff
    await db.insert(officeStaff).values([
      { name: '이수진', phone: '010-4941-7742' },
      { name: '박지연', phone: '010-9321-4482' },
      { name: '김민하', phone: '010-844-9931' },
    ]);
    console.log("✓ Seeded office staff data");

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
