import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Container/Cargo master data
export const cargo = pgTable("cargo", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  containerNo: text("container_no").notNull().unique(),
  blNo: text("bl_no").notNull(),
});

export const insertCargoSchema = createInsertSchema(cargo).omit({ id: true });
export type InsertCargo = z.infer<typeof insertCargoSchema>;
export type Cargo = typeof cargo.$inferSelect;

// Vehicle master data
export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleNo: text("vehicle_no").notNull().unique(),
  driverName: text("driver_name").notNull(),
  driverPhone: text("driver_phone").notNull(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

// Field staff master data
export const fieldStaff = pgTable("field_staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
});

export const insertFieldStaffSchema = createInsertSchema(fieldStaff).omit({ id: true });
export type InsertFieldStaff = z.infer<typeof insertFieldStaffSchema>;
export type FieldStaff = typeof fieldStaff.$inferSelect;

// Office staff master data
export const officeStaff = pgTable("office_staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
});

export const insertOfficeStaffSchema = createInsertSchema(officeStaff).omit({ id: true });
export type InsertOfficeStaff = z.infer<typeof insertOfficeStaffSchema>;
export type OfficeStaff = typeof officeStaff.$inferSelect;

// Damage reports
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  containerNo: text("container_no").notNull(),
  blNo: text("bl_no").notNull(),
  vehicleNo: text("vehicle_no").notNull(),
  driverName: text("driver_name").notNull(),
  driverPhone: text("driver_phone").notNull(),
  driverDamage: text("driver_damage").notNull(),
  driverSignature: text("driver_signature").notNull(),
  driverSubmittedAt: timestamp("driver_submitted_at"),
  
  fieldStaff: text("field_staff"),
  fieldPhone: text("field_phone"),
  fieldDamage: text("field_damage"),
  fieldSignature: text("field_signature"),
  fieldSubmittedAt: timestamp("field_submitted_at"),
  
  officeStaff: text("office_staff"),
  officePhone: text("office_phone"),
  officeDamage: text("office_damage"),
  officeSignature: text("office_signature"),
  completedAt: timestamp("completed_at"),
  
  status: text("status").notNull().default('draft'),
  rejectionReason: text("rejection_reason"),
  rejectedAt: timestamp("rejected_at"),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertReportSchema = createInsertSchema(reports).omit({ 
  id: true,
  createdAt: true,
  driverSubmittedAt: true,
  fieldSubmittedAt: true,
  completedAt: true,
  rejectedAt: true,
}).extend({
  containerNo: z.string().min(1, "컨테이너 번호를 입력하세요"),
  blNo: z.string().min(1, "B/L 번호를 입력하세요"),
  driverDamage: z.string().min(1, "파손 내용을 입력하세요"),
  driverSignature: z.string().min(1, "서명을 입력하세요"),
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// Driver login schema
export const driverLoginSchema = z.object({
  vehicleNo: z.string().min(1, "차량번호를 선택하세요"),
  password: z.string().min(1, "비밀번호를 입력하세요"),
});

export type DriverLogin = z.infer<typeof driverLoginSchema>;

// Field review schema
export const fieldReviewSchema = z.object({
  reportId: z.string(),
  fieldStaff: z.string().min(1, "현장 담당자를 선택하세요"),
  fieldPhone: z.string().min(1),
  fieldDamage: z.string().min(1, "현장 확인 내용을 입력하세요"),
  fieldSignature: z.string().min(1, "서명을 입력하세요"),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
});

export type FieldReview = z.infer<typeof fieldReviewSchema>;

// Office approval schema
export const officeApprovalSchema = z.object({
  reportId: z.string(),
  officeStaff: z.string().min(1, "사무실 담당자를 선택하세요"),
  officePhone: z.string().min(1),
  officeDamage: z.string().min(1, "사무실 확인 내용을 입력하세요"),
  officeSignature: z.string().min(1, "서명을 입력하세요"),
});

export type OfficeApproval = z.infer<typeof officeApprovalSchema>;

// Report status type
export type ReportStatus = 'draft' | 'driver_submitted' | 'field_submitted' | 'rejected' | 'completed';
