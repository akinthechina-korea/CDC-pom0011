// Blueprint reference: javascript_database
import type { 
  Report, InsertReport,
  Cargo, InsertCargo,
  Vehicle, InsertVehicle,
  FieldStaff, InsertFieldStaff,
  OfficeStaff, InsertOfficeStaff,
  AdminStaff, InsertAdminStaff,
} from "@shared/schema";
import { reports, cargo, vehicles, fieldStaff, officeStaff, adminStaff } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Reports
  getAllReports(): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  createReport(report: Omit<InsertReport, 'id'>): Promise<Report>;
  updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined>;
  
  // Cargo
  getAllCargo(): Promise<Cargo[]>;
  getCargo(id: string): Promise<Cargo | undefined>;
  createCargo(cargo: InsertCargo): Promise<Cargo>;
  upsertCargo(cargo: InsertCargo): Promise<Cargo>;
  replaceAllCargo(cargoList: InsertCargo[]): Promise<Cargo[]>;
  
  // Vehicles
  getAllVehicles(): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  getVehicleByNumber(vehicleNo: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  upsertVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  replaceAllVehicles(vehicleList: InsertVehicle[]): Promise<Vehicle[]>;
  
  // Field Staff
  getAllFieldStaff(): Promise<FieldStaff[]>;
  getFieldStaff(id: string): Promise<FieldStaff | undefined>;
  getFieldStaffByName(name: string): Promise<FieldStaff | undefined>;
  createFieldStaff(staff: InsertFieldStaff): Promise<FieldStaff>;
  upsertFieldStaff(staff: InsertFieldStaff): Promise<FieldStaff>;
  replaceAllFieldStaff(staffList: InsertFieldStaff[]): Promise<FieldStaff[]>;
  
  // Office Staff
  getAllOfficeStaff(): Promise<OfficeStaff[]>;
  getOfficeStaff(id: string): Promise<OfficeStaff | undefined>;
  getOfficeStaffByName(name: string): Promise<OfficeStaff | undefined>;
  createOfficeStaff(staff: InsertOfficeStaff): Promise<OfficeStaff>;
  upsertOfficeStaff(staff: InsertOfficeStaff): Promise<OfficeStaff>;
  replaceAllOfficeStaff(staffList: InsertOfficeStaff[]): Promise<OfficeStaff[]>;
  
  // Admin Staff
  getAllAdminStaff(): Promise<AdminStaff[]>;
  getAdminStaff(id: string): Promise<AdminStaff | undefined>;
  getAdminStaffByName(name: string): Promise<AdminStaff | undefined>;
  createAdminStaff(staff: InsertAdminStaff): Promise<AdminStaff>;
  upsertAdminStaff(staff: InsertAdminStaff): Promise<AdminStaff>;
}

export class DatabaseStorage implements IStorage {
  // Reports
  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async createReport(insertReport: Omit<InsertReport, 'id'>): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values(insertReport as InsertReport)
      .returning();
    return report;
  }

  async updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined> {
    // Filter out undefined values to prevent NULL being written to non-nullable columns
    const definedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    const [report] = await db
      .update(reports)
      .set(definedUpdates)
      .where(eq(reports.id, id))
      .returning();
    return report || undefined;
  }

  // Cargo
  async getAllCargo(): Promise<Cargo[]> {
    return await db.select().from(cargo);
  }

  async getCargo(id: string): Promise<Cargo | undefined> {
    const [item] = await db.select().from(cargo).where(eq(cargo.id, id));
    return item || undefined;
  }

  async createCargo(insertCargo: InsertCargo): Promise<Cargo> {
    const [item] = await db
      .insert(cargo)
      .values(insertCargo)
      .returning();
    return item;
  }

  async upsertCargo(insertCargo: InsertCargo): Promise<Cargo> {
    const [item] = await db
      .insert(cargo)
      .values(insertCargo)
      .onConflictDoUpdate({
        target: cargo.containerNo,
        set: { blNo: insertCargo.blNo }
      })
      .returning();
    return item;
  }

  // Vehicles
  async getAllVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async getVehicleByNumber(vehicleNo: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.vehicleNo, vehicleNo));
    return vehicle || undefined;
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db
      .insert(vehicles)
      .values(insertVehicle)
      .returning();
    return vehicle;
  }

  async upsertVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db
      .insert(vehicles)
      .values(insertVehicle)
      .onConflictDoUpdate({
        target: vehicles.vehicleNo,
        set: { 
          driverName: insertVehicle.driverName,
          driverPhone: insertVehicle.driverPhone
        }
      })
      .returning();
    return vehicle;
  }

  // Field Staff
  async getAllFieldStaff(): Promise<FieldStaff[]> {
    return await db.select().from(fieldStaff);
  }

  async getFieldStaff(id: string): Promise<FieldStaff | undefined> {
    const [staff] = await db.select().from(fieldStaff).where(eq(fieldStaff.id, id));
    return staff || undefined;
  }

  async getFieldStaffByName(name: string): Promise<FieldStaff | undefined> {
    const [staff] = await db.select().from(fieldStaff).where(eq(fieldStaff.name, name));
    return staff || undefined;
  }

  async createFieldStaff(insertStaff: InsertFieldStaff): Promise<FieldStaff> {
    const [staff] = await db
      .insert(fieldStaff)
      .values(insertStaff)
      .returning();
    return staff;
  }

  async upsertFieldStaff(insertStaff: InsertFieldStaff): Promise<FieldStaff> {
    const [staff] = await db
      .insert(fieldStaff)
      .values(insertStaff)
      .onConflictDoUpdate({
        target: fieldStaff.phone,
        set: { name: insertStaff.name }
      })
      .returning();
    return staff;
  }

  // Office Staff
  async getAllOfficeStaff(): Promise<OfficeStaff[]> {
    return await db.select().from(officeStaff);
  }

  async getOfficeStaff(id: string): Promise<OfficeStaff | undefined> {
    const [staff] = await db.select().from(officeStaff).where(eq(officeStaff.id, id));
    return staff || undefined;
  }

  async getOfficeStaffByName(name: string): Promise<OfficeStaff | undefined> {
    const [staff] = await db.select().from(officeStaff).where(eq(officeStaff.name, name));
    return staff || undefined;
  }

  async createOfficeStaff(insertStaff: InsertOfficeStaff): Promise<OfficeStaff> {
    const [staff] = await db
      .insert(officeStaff)
      .values(insertStaff)
      .returning();
    return staff;
  }

  async upsertOfficeStaff(insertStaff: InsertOfficeStaff): Promise<OfficeStaff> {
    const [staff] = await db
      .insert(officeStaff)
      .values(insertStaff)
      .onConflictDoUpdate({
        target: officeStaff.phone,
        set: { name: insertStaff.name }
      })
      .returning();
    return staff;
  }

  // Admin Staff
  async getAllAdminStaff(): Promise<AdminStaff[]> {
    return await db.select().from(adminStaff);
  }

  async getAdminStaff(id: string): Promise<AdminStaff | undefined> {
    const [staff] = await db.select().from(adminStaff).where(eq(adminStaff.id, id));
    return staff || undefined;
  }

  async getAdminStaffByName(name: string): Promise<AdminStaff | undefined> {
    const [staff] = await db.select().from(adminStaff).where(eq(adminStaff.name, name));
    return staff || undefined;
  }

  async createAdminStaff(insertStaff: InsertAdminStaff): Promise<AdminStaff> {
    const [staff] = await db
      .insert(adminStaff)
      .values(insertStaff)
      .returning();
    return staff;
  }

  async upsertAdminStaff(insertStaff: InsertAdminStaff): Promise<AdminStaff> {
    const [staff] = await db
      .insert(adminStaff)
      .values(insertStaff)
      .onConflictDoUpdate({
        target: adminStaff.phone,
        set: { name: insertStaff.name }
      })
      .returning();
    return staff;
  }

  // Replace All Methods (for inline editing)
  async replaceAllCargo(cargoList: InsertCargo[]): Promise<Cargo[]> {
    return await db.transaction(async (tx) => {
      await tx.delete(cargo);
      if (cargoList.length === 0) return [];
      return await tx.insert(cargo).values(cargoList).returning();
    });
  }

  async replaceAllVehicles(vehicleList: InsertVehicle[]): Promise<Vehicle[]> {
    return await db.transaction(async (tx) => {
      await tx.delete(vehicles);
      if (vehicleList.length === 0) return [];
      return await tx.insert(vehicles).values(vehicleList).returning();
    });
  }

  async replaceAllFieldStaff(staffList: InsertFieldStaff[]): Promise<FieldStaff[]> {
    return await db.transaction(async (tx) => {
      await tx.delete(fieldStaff);
      if (staffList.length === 0) return [];
      return await tx.insert(fieldStaff).values(staffList).returning();
    });
  }

  async replaceAllOfficeStaff(staffList: InsertOfficeStaff[]): Promise<OfficeStaff[]> {
    return await db.transaction(async (tx) => {
      await tx.delete(officeStaff);
      if (staffList.length === 0) return [];
      return await tx.insert(officeStaff).values(staffList).returning();
    });
  }
}

export const storage = new DatabaseStorage();
