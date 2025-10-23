import type { 
  Report, InsertReport,
  Cargo, InsertCargo,
  Vehicle, InsertVehicle,
  FieldStaff, InsertFieldStaff,
  OfficeStaff, InsertOfficeStaff,
} from "@shared/schema";
import { randomUUID } from "crypto";

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
  
  // Vehicles
  getAllVehicles(): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  getVehicleByNumber(vehicleNo: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  
  // Field Staff
  getAllFieldStaff(): Promise<FieldStaff[]>;
  getFieldStaff(id: string): Promise<FieldStaff | undefined>;
  createFieldStaff(staff: InsertFieldStaff): Promise<FieldStaff>;
  
  // Office Staff
  getAllOfficeStaff(): Promise<OfficeStaff[]>;
  getOfficeStaff(id: string): Promise<OfficeStaff | undefined>;
  createOfficeStaff(staff: InsertOfficeStaff): Promise<OfficeStaff>;
}

export class MemStorage implements IStorage {
  private reports: Map<string, Report>;
  private cargo: Map<string, Cargo>;
  private vehicles: Map<string, Vehicle>;
  private fieldStaff: Map<string, FieldStaff>;
  private officeStaff: Map<string, OfficeStaff>;

  constructor() {
    this.reports = new Map();
    this.cargo = new Map();
    this.vehicles = new Map();
    this.fieldStaff = new Map();
    this.officeStaff = new Map();
    
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample Cargo
    const sampleCargo: InsertCargo[] = [
      { containerNo: 'TCLU8239466', blNo: 'CHL20251001' },
      { containerNo: 'MSKU4598321', blNo: 'CHL20251002' },
      { containerNo: 'TEMU6198324', blNo: 'CHL20251003' },
    ];

    sampleCargo.forEach(cargo => {
      const id = randomUUID();
      this.cargo.set(id, { id, ...cargo });
    });

    // Sample Vehicles
    const sampleVehicles: InsertVehicle[] = [
      { vehicleNo: '89하1234', driverName: '박영호', driverPhone: '010-9942-1118' },
      { vehicleNo: '81머5532', driverName: '최민재', driverPhone: '010-7102-9983' },
      { vehicleNo: '83기9224', driverName: '오세민', driverPhone: '010-2994-8821' },
    ];

    sampleVehicles.forEach(vehicle => {
      const id = randomUUID();
      this.vehicles.set(id, { id, ...vehicle });
    });

    // Sample Field Staff
    const sampleFieldStaff: InsertFieldStaff[] = [
      { name: '김도훈', phone: '010-2384-1156' },
      { name: '장지윤', phone: '010-5529-6681' },
      { name: '정현준', phone: '010-7132-2248' },
    ];

    sampleFieldStaff.forEach(staff => {
      const id = randomUUID();
      this.fieldStaff.set(id, { id, ...staff });
    });

    // Sample Office Staff
    const sampleOfficeStaff: InsertOfficeStaff[] = [
      { name: '이수진', phone: '010-4941-7742' },
      { name: '박지연', phone: '010-9321-4482' },
      { name: '김민하', phone: '010-844-9931' },
    ];

    sampleOfficeStaff.forEach(staff => {
      const id = randomUUID();
      this.officeStaff.set(id, { id, ...staff });
    });
  }

  // Reports
  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async createReport(insertReport: Omit<InsertReport, 'id'>): Promise<Report> {
    const id = randomUUID();
    const now = new Date();
    const report: Report = {
      id,
      ...insertReport,
      createdAt: now,
      driverSubmittedAt: null,
      fieldSubmittedAt: null,
      completedAt: null,
      rejectedAt: null,
      fieldStaff: null,
      fieldPhone: null,
      fieldDamage: null,
      fieldSignature: null,
      officeStaff: null,
      officePhone: null,
      officeDamage: null,
      officeSignature: null,
      rejectionReason: null,
    };
    this.reports.set(id, report);
    return report;
  }

  async updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;

    const updatedReport = { ...report, ...updates };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  // Cargo
  async getAllCargo(): Promise<Cargo[]> {
    return Array.from(this.cargo.values());
  }

  async getCargo(id: string): Promise<Cargo | undefined> {
    return this.cargo.get(id);
  }

  async createCargo(insertCargo: InsertCargo): Promise<Cargo> {
    const id = randomUUID();
    const cargo: Cargo = { id, ...insertCargo };
    this.cargo.set(id, cargo);
    return cargo;
  }

  // Vehicles
  async getAllVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async getVehicleByNumber(vehicleNo: string): Promise<Vehicle | undefined> {
    return Array.from(this.vehicles.values()).find(v => v.vehicleNo === vehicleNo);
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = randomUUID();
    const vehicle: Vehicle = { id, ...insertVehicle };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  // Field Staff
  async getAllFieldStaff(): Promise<FieldStaff[]> {
    return Array.from(this.fieldStaff.values());
  }

  async getFieldStaff(id: string): Promise<FieldStaff | undefined> {
    return this.fieldStaff.get(id);
  }

  async createFieldStaff(insertStaff: InsertFieldStaff): Promise<FieldStaff> {
    const id = randomUUID();
    const staff: FieldStaff = { id, ...insertStaff };
    this.fieldStaff.set(id, staff);
    return staff;
  }

  // Office Staff
  async getAllOfficeStaff(): Promise<OfficeStaff[]> {
    return Array.from(this.officeStaff.values());
  }

  async getOfficeStaff(id: string): Promise<OfficeStaff | undefined> {
    return this.officeStaff.get(id);
  }

  async createOfficeStaff(insertStaff: InsertOfficeStaff): Promise<OfficeStaff> {
    const id = randomUUID();
    const staff: OfficeStaff = { id, ...insertStaff };
    this.officeStaff.set(id, staff);
    return staff;
  }
}

export const storage = new MemStorage();
