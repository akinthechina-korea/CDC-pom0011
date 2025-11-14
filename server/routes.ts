import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertReportSchema, 
  fieldReviewSchema, 
  officeApprovalSchema,
  insertCargoSchema,
  insertVehicleSchema,
  insertFieldStaffSchema,
  insertOfficeStaffSchema,
  driverLoginSchema,
  fieldLoginSchema,
  officeLoginSchema,
  adminLoginSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import archiver from "archiver";

// WebSocket broadcast helper
let wss: WebSocketServer;

function broadcastNotification(event: {
  type: 'report_submitted' | 'report_approved' | 'report_rejected' | 'report_completed';
  reportId: number;
  containerNo: string;
  status: string;
  targetRole?: 'driver' | 'field' | 'office';
}) {
  if (!wss) return;
  
  const message = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Configure multer for file upload
const uploadDir = path.join(process.cwd(), "attached_assets", "damage_photos");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다 (JPG, PNG, WEBP)'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoint
  
  // Driver login
  app.post("/api/auth/driver-login", async (req, res) => {
    try {
      const validatedData = driverLoginSchema.parse(req.body);

      // Normalize password (remove all non-digit characters)
      const normalizedPassword = validatedData.password.replace(/[^0-9]/g, '');
      
      let vehicle = await storage.getVehicleByNumber(validatedData.vehicleNo);
      
      if (!vehicle) {
        // 자동 회원가입: 새 차량/기사 등록 (전화번호는 숫자만 저장)
        const newVehicle = await storage.createVehicle({
          vehicleNo: validatedData.vehicleNo,
          driverName: validatedData.driverName,
          driverPhone: normalizedPassword,
        });
        
        return res.json({
          success: true,
          vehicleNo: newVehicle.vehicleNo,
          driverName: newVehicle.driverName,
        });
      }

      // 기존 차량/기사 로그인 (저장된 전화번호도 숫자만 비교)
      const storedPassword = vehicle.driverPhone.replace(/[^0-9]/g, '');
      
      if (normalizedPassword !== storedPassword) {
        return res.status(401).json({ error: "비밀번호(연락처)가 일치하지 않습니다" });
      }

      res.json({
        success: true,
        vehicleNo: vehicle.vehicleNo,
        driverName: vehicle.driverName,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "입력 데이터 오류", 
          details: error.errors 
        });
      }
      console.error("Driver login error:", error);
      res.status(500).json({ 
        error: "로그인 처리 중 오류가 발생했습니다",
        details: error?.message || String(error)
      });
    }
  });

  // Field staff login
  app.post("/api/auth/field-login", async (req, res) => {
    try {
      const validatedData = fieldLoginSchema.parse(req.body);

      // Validate security code
      const FIELD_SECURITY_CODE = "93848869";
      if (validatedData.securityCode !== FIELD_SECURITY_CODE) {
        return res.status(401).json({ error: "보안 코드가 일치하지 않습니다" });
      }

      const staff = await storage.getFieldStaffByName(validatedData.staffName);
      
      if (!staff) {
        return res.status(401).json({ error: "담당자를 찾을 수 없습니다" });
      }

      const correctPassword = staff.phone.replace(/-/g, '');
      
      if (validatedData.password !== correctPassword) {
        return res.status(401).json({ error: "비밀번호가 일치하지 않습니다" });
      }

      res.json({
        success: true,
        staffId: staff.id,
        staffName: staff.name,
        staffPhone: staff.phone,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "입력 데이터 오류", 
          details: error.errors 
        });
      }
      console.error("Field staff login error:", error);
      res.status(500).json({ 
        error: "로그인 처리 중 오류가 발생했습니다",
        details: error?.message || String(error)
      });
    }
  });

  // Office staff login
  app.post("/api/auth/office-login", async (req, res) => {
    try {
      const validatedData = officeLoginSchema.parse(req.body);

      // Validate security code
      const OFFICE_SECURITY_CODE = "23485759";
      if (validatedData.securityCode !== OFFICE_SECURITY_CODE) {
        return res.status(401).json({ error: "보안 코드가 일치하지 않습니다" });
      }

      const staff = await storage.getOfficeStaffByName(validatedData.staffName);
      
      if (!staff) {
        return res.status(401).json({ error: "담당자를 찾을 수 없습니다" });
      }

      const correctPassword = staff.phone.replace(/-/g, '');
      
      if (validatedData.password !== correctPassword) {
        return res.status(401).json({ error: "비밀번호가 일치하지 않습니다" });
      }

      res.json({
        success: true,
        staffId: staff.id,
        staffName: staff.name,
        staffPhone: staff.phone,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "입력 데이터 오류", 
          details: error.errors 
        });
      }
      console.error("Office staff login error:", error);
      res.status(500).json({ 
        error: "로그인 처리 중 오류가 발생했습니다",
        details: error?.message || String(error)
      });
    }
  });

  // Admin login
  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const validatedData = adminLoginSchema.parse(req.body);

      // Validate security code
      const ADMIN_SECURITY_CODE = "13848966";
      if (validatedData.securityCode !== ADMIN_SECURITY_CODE) {
        return res.status(401).json({ error: "보안 코드가 일치하지 않습니다" });
      }

      const staff = await storage.getAdminStaffByName(validatedData.adminName);
      
      if (!staff) {
        return res.status(401).json({ error: "관리자를 찾을 수 없습니다" });
      }

      const correctPassword = staff.phone.replace(/-/g, '');
      
      if (validatedData.password !== correctPassword) {
        return res.status(401).json({ error: "비밀번호가 일치하지 않습니다" });
      }

      res.json({
        success: true,
        staffId: staff.id,
        staffName: staff.name,
        staffPhone: staff.phone,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "입력 데이터 오류", 
          details: error.errors 
        });
      }
      console.error("Admin login error:", error);
      res.status(500).json({ 
        error: "로그인 처리 중 오류가 발생했습니다",
        details: error?.message || String(error)
      });
    }
  });

  // Master data endpoints
  
  // Get all cargo
  app.get("/api/data/cargo", async (req, res) => {
    try {
      const cargo = await storage.getAllCargo();
      res.json(cargo);
    } catch (error) {
      res.status(500).json({ error: "화물 데이터 조회 실패" });
    }
  });

  // Get all vehicles
  app.get("/api/data/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ error: "차량 데이터 조회 실패" });
    }
  });

  // Get all field staff
  app.get("/api/data/field-staff", async (req, res) => {
    try {
      const staff = await storage.getAllFieldStaff();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: "현장 담당자 데이터 조회 실패" });
    }
  });

  // Get all office staff
  app.get("/api/data/office-staff", async (req, res) => {
    try {
      const staff = await storage.getAllOfficeStaff();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: "사무실 담당자 데이터 조회 실패" });
    }
  });

  // Get all admin staff
  app.get("/api/data/admin-staff", async (req, res) => {
    try {
      const staff = await storage.getAllAdminStaff();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: "관리자 데이터 조회 실패" });
    }
  });

  // Bulk upload endpoints for admin
  
  // Bulk upload cargo
  app.post("/api/data/cargo/bulk", async (req, res) => {
    try {
      const items = z.array(insertCargoSchema).parse(req.body);
      const created = [];
      
      for (const item of items) {
        const cargo = await storage.upsertCargo(item);
        created.push(cargo);
      }
      
      res.status(201).json({ 
        success: true, 
        count: created.length,
        items: created 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "데이터 검증 실패", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "화물 데이터 업로드 실패" });
    }
  });

  // Bulk upload vehicles
  app.post("/api/data/vehicles/bulk", async (req, res) => {
    try {
      const items = z.array(insertVehicleSchema).parse(req.body);
      const created = [];
      
      for (const item of items) {
        const vehicle = await storage.upsertVehicle(item);
        created.push(vehicle);
      }
      
      res.status(201).json({ 
        success: true, 
        count: created.length,
        items: created 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "데이터 검증 실패", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "차량 데이터 업로드 실패" });
    }
  });

  // Bulk upload field staff
  app.post("/api/data/field-staff/bulk", async (req, res) => {
    try {
      const items = z.array(insertFieldStaffSchema).parse(req.body);
      const created = [];
      
      for (const item of items) {
        const staff = await storage.upsertFieldStaff(item);
        created.push(staff);
      }
      
      res.status(201).json({ 
        success: true, 
        count: created.length,
        items: created 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "데이터 검증 실패", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "현장 담당자 데이터 업로드 실패" });
    }
  });

  // Bulk upload office staff
  app.post("/api/data/office-staff/bulk", async (req, res) => {
    try {
      const items = z.array(insertOfficeStaffSchema).parse(req.body);
      const created = [];
      
      for (const item of items) {
        const staff = await storage.upsertOfficeStaff(item);
        created.push(staff);
      }
      
      res.status(201).json({ 
        success: true, 
        count: created.length,
        items: created 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "데이터 검증 실패", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "사무실 담당자 데이터 업로드 실패" });
    }
  });

  // Replace all endpoints for inline editing (deletes existing data and inserts new)
  
  // Replace all cargo
  app.post("/api/data/cargo/replace", async (req, res) => {
    try {
      const items = z.array(insertCargoSchema).parse(req.body);
      const replaced = await storage.replaceAllCargo(items);
      
      res.status(200).json({ 
        success: true, 
        count: replaced.length,
        items: replaced 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "데이터 검증 실패", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "화물 데이터 교체 실패" });
    }
  });

  // Replace all vehicles
  app.post("/api/data/vehicles/replace", async (req, res) => {
    try {
      const items = z.array(insertVehicleSchema).parse(req.body);
      const replaced = await storage.replaceAllVehicles(items);
      
      res.status(200).json({ 
        success: true, 
        count: replaced.length,
        items: replaced 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "데이터 검증 실패", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "차량 데이터 교체 실패" });
    }
  });

  // Replace all field staff
  app.post("/api/data/field-staff/replace", async (req, res) => {
    try {
      const items = z.array(insertFieldStaffSchema).parse(req.body);
      const replaced = await storage.replaceAllFieldStaff(items);
      
      res.status(200).json({ 
        success: true, 
        count: replaced.length,
        items: replaced 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "데이터 검증 실패", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "현장 담당자 데이터 교체 실패" });
    }
  });

  // Replace all office staff
  app.post("/api/data/office-staff/replace", async (req, res) => {
    try {
      const items = z.array(insertOfficeStaffSchema).parse(req.body);
      const replaced = await storage.replaceAllOfficeStaff(items);
      
      res.status(200).json({ 
        success: true, 
        count: replaced.length,
        items: replaced 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "데이터 검증 실패", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "사무실 담당자 데이터 교체 실패" });
    }
  });

  // Photo upload endpoint
  app.post("/api/upload/damage-photo", upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "사진 파일이 없습니다" });
      }
      
      // Return the relative path from the attached_assets directory
      const photoUrl = `/assets/damage_photos/${req.file.filename}`;
      res.json({ url: photoUrl });
    } catch (error: any) {
      if (error.message) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "사진 업로드 실패" });
    }
  });

  // Report endpoints

  // Get all reports
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "보고서 조회 실패" });
    }
  });

  // Get single report
  app.get("/api/reports/:id", async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "보고서를 찾을 수 없습니다" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "보고서 조회 실패" });
    }
  });

  // Create new report (driver submission)
  app.post("/api/reports", async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      
      const report = await storage.createReport({
        ...validatedData,
        status: 'driver_submitted',
      });

      // Update with submission timestamp and action history
      const historyItem = {
        actionType: 'submit' as const,
        actor: validatedData.driverName,
        actorRole: 'driver' as const,
        timestamp: new Date().toISOString(),
        content: validatedData.driverDamage,
        signature: validatedData.driverSignature,
      };

      const updatedReport = await storage.updateReport(report.id, {
        driverSubmittedAt: new Date(),
        status: 'driver_submitted',
        actionHistory: [historyItem],
      });

      // Broadcast notification to field staff
      if (updatedReport) {
        broadcastNotification({
          type: 'report_submitted',
          reportId: Number(updatedReport.id),
          containerNo: updatedReport.containerNo,
          status: 'driver_submitted',
          targetRole: 'field',
        });
      }

      res.status(201).json(updatedReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "입력 데이터 오류", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "보고서 생성 실패" });
    }
  });

  // Resubmit report (driver updates rejected report)
  app.put("/api/reports/:id/resubmit", async (req, res) => {
    try {
      const { driverDamage, driverSignature, damagePhotos } = req.body;

      if (!driverDamage || !driverSignature) {
        return res.status(400).json({ error: "필수 항목을 입력해주세요" });
      }

      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "보고서를 찾을 수 없습니다" });
      }

      if (report.status !== 'rejected') {
        return res.status(400).json({ error: "반려된 보고서만 재제출할 수 있습니다" });
      }

      // Add to history
      const historyItem = {
        actionType: 'resubmit' as const,
        actor: report.driverName,
        actorRole: 'driver' as const,
        timestamp: new Date().toISOString(),
        content: driverDamage,
        signature: driverSignature,
      };

      const currentHistory = report.actionHistory || [];

      const updateData: any = {
        driverDamage,
        driverSignature,
        status: 'driver_submitted',
        driverSubmittedAt: new Date(),
        rejectionReason: null,
        rejectedAt: null,
        actionHistory: [...currentHistory, historyItem],
      };

      if (damagePhotos !== undefined) {
        updateData.damagePhotos = damagePhotos;
      }

      const updatedReport = await storage.updateReport(req.params.id, updateData);

      // Broadcast notification to field staff
      if (updatedReport) {
        broadcastNotification({
          type: 'report_submitted',
          reportId: Number(updatedReport.id),
          containerNo: updatedReport.containerNo,
          status: 'driver_submitted',
          targetRole: 'field',
        });
      }

      res.json(updatedReport);
    } catch (error) {
      res.status(500).json({ error: "보고서 재제출 실패" });
    }
  });

  // Field review (approve or reject)
  app.put("/api/reports/:id/field-review", async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "보고서를 찾을 수 없습니다" });
      }

      if (report.status !== 'driver_submitted') {
        return res.status(400).json({ error: "기사 제출 상태의 보고서만 검토할 수 있습니다" });
      }

      const { action, rejectionReason, ...reviewData } = req.body;
      const currentHistory = report.actionHistory || [];

      if (action === 'reject') {
        if (!rejectionReason) {
          return res.status(400).json({ error: "반려 사유를 입력해주세요" });
        }

        // Add rejection to history
        const historyItem = {
          actionType: 'reject' as const,
          actor: reviewData.fieldStaff || '현장 담당자',
          actorRole: 'field' as const,
          timestamp: new Date().toISOString(),
          reason: rejectionReason,
        };

        const updatedReport = await storage.updateReport(req.params.id, {
          status: 'rejected',
          rejectionReason,
          rejectedAt: new Date(),
          actionHistory: [...currentHistory, historyItem],
        });

        // Broadcast notification to driver
        if (updatedReport) {
          broadcastNotification({
            type: 'report_rejected',
            reportId: Number(updatedReport.id),
            containerNo: updatedReport.containerNo,
            status: 'rejected',
            targetRole: 'driver',
          });
        }

        return res.json(updatedReport);
      }

      if (action === 'approve') {
        const validatedData = fieldReviewSchema.parse({ 
          ...reviewData, 
          reportId: req.params.id, 
          action 
        });

        // Add approval to history
        const historyItem = {
          actionType: 'approve' as const,
          actor: validatedData.fieldStaff,
          actorRole: 'field' as const,
          timestamp: new Date().toISOString(),
          content: validatedData.fieldDamage,
          signature: validatedData.fieldSignature,
        };

        const updatedReport = await storage.updateReport(req.params.id, {
          fieldStaff: validatedData.fieldStaff,
          fieldPhone: validatedData.fieldPhone,
          fieldDamage: validatedData.fieldDamage,
          fieldSignature: validatedData.fieldSignature,
          status: 'field_submitted',
          fieldSubmittedAt: new Date(),
          actionHistory: [...currentHistory, historyItem],
        });

        // Broadcast notification to office staff
        if (updatedReport) {
          broadcastNotification({
            type: 'report_approved',
            reportId: Number(updatedReport.id),
            containerNo: updatedReport.containerNo,
            status: 'field_submitted',
            targetRole: 'office',
          });
        }

        return res.json(updatedReport);
      }

      res.status(400).json({ error: "유효하지 않은 액션입니다" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "입력 데이터 오류", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "현장 검토 실패" });
    }
  });

  // Office approval
  app.put("/api/reports/:id/office-approve", async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "보고서를 찾을 수 없습니다" });
      }

      if (report.status !== 'field_submitted') {
        return res.status(400).json({ error: "현장 승인 상태의 보고서만 최종 승인할 수 있습니다" });
      }

      const validatedData = officeApprovalSchema.parse({
        ...req.body,
        reportId: req.params.id,
      });

      // Add to history
      const currentHistory = report.actionHistory || [];
      const historyItem = {
        actionType: 'office_approve' as const,
        actor: validatedData.officeStaff,
        actorRole: 'office' as const,
        timestamp: new Date().toISOString(),
        content: validatedData.officeDamage,
        signature: validatedData.officeSignature,
      };

      const updatedReport = await storage.updateReport(req.params.id, {
        officeStaff: validatedData.officeStaff,
        officePhone: validatedData.officePhone,
        officeDamage: validatedData.officeDamage,
        officeSignature: validatedData.officeSignature,
        status: 'completed',
        completedAt: new Date(),
        actionHistory: [...currentHistory, historyItem],
      });

      // Broadcast notification - report completed
      if (updatedReport) {
        broadcastNotification({
          type: 'report_completed',
          reportId: Number(updatedReport.id),
          containerNo: updatedReport.containerNo,
          status: 'completed',
        });
      }

      res.json(updatedReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "입력 데이터 오류", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "최종 승인 실패" });
    }
  });

  // Office reject
  app.put("/api/reports/:id/office-reject", async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "보고서를 찾을 수 없습니다" });
      }

      if (report.status !== 'field_submitted') {
        return res.status(400).json({ error: "현장 승인 상태의 보고서만 반려할 수 있습니다" });
      }

      const { rejectionReason, officeStaff } = req.body;
      
      if (!rejectionReason) {
        return res.status(400).json({ error: "반려 사유를 입력해주세요" });
      }

      // Add to history
      const currentHistory = report.actionHistory || [];
      const historyItem = {
        actionType: 'office_reject' as const,
        actor: officeStaff || '사무실 담당자',
        actorRole: 'office' as const,
        timestamp: new Date().toISOString(),
        reason: rejectionReason,
      };

      const updatedReport = await storage.updateReport(req.params.id, {
        status: 'driver_submitted',
        rejectionReason,
        rejectedAt: new Date(),
        actionHistory: [...currentHistory, historyItem],
      });

      // Broadcast notification to field staff (office rejected, back to field)
      if (updatedReport) {
        broadcastNotification({
          type: 'report_rejected',
          reportId: Number(updatedReport.id),
          containerNo: updatedReport.containerNo,
          status: 'driver_submitted',
          targetRole: 'field',
        });
      }

      res.json(updatedReport);
    } catch (error) {
      res.status(500).json({ error: "반려 처리 실패" });
    }
  });

  // Download report as PDF file using PDFKit with absolute positioning
  app.get("/api/reports/:id/download", async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "보고서를 찾을 수 없습니다" });
      }

      if (report.status !== 'completed') {
        return res.status(400).json({ error: "완료된 보고서만 다운로드할 수 있습니다" });
      }

      // PDF 생성 시점의 날짜/시간 (한국 시간 = UTC + 9시간)
      const now = new Date();
      const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const year = kstTime.getFullYear();
      const month = String(kstTime.getMonth() + 1).padStart(2, '0');
      const day = String(kstTime.getDate()).padStart(2, '0');
      const hour = String(kstTime.getHours()).padStart(2, '0');
      const minute = String(kstTime.getMinutes()).padStart(2, '0');
      const dateStr = `${year}. ${month}. ${day}. ${hour}:${minute}`;

      // Get last signatures from actionHistory
      const actionHistory = report.actionHistory || [];
      const lastDriverSig = actionHistory.filter(a => a.actorRole === 'driver' && a.signature).pop()?.signature;
      const lastFieldSig = actionHistory.filter(a => a.actorRole === 'field' && a.signature).pop()?.signature;
      const lastOfficeSig = actionHistory.filter(a => a.actorRole === 'office' && a.signature).pop()?.signature;

      // Create PDF document with NO auto first page
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        autoFirstPage: false
      });

      // Register CJK fonts
      const fontPath = path.join(process.cwd(), 'attached_assets', 'fonts', 'NotoSansCJK-Regular.otf');
      const fontBoldPath = path.join(process.cwd(), 'attached_assets', 'fonts', 'NotoSansCJK-Bold.otf');
      doc.registerFont('NotoSansCJK', fontPath);
      doc.registerFont('NotoSansCJK-Bold', fontBoldPath);

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="DAMAGE_${report.containerNo}.pdf"`);

      // Pipe to response
      doc.pipe(res);

      // Add single page
      doc.addPage();

      // Constants
      const pageWidth = 595; // A4 width in points
      const pageHeight = 842; // A4 height in points
      let y = 40;

      // Header
      doc.fontSize(20).font('NotoSansCJK-Bold');
      doc.text('(株)天 一 國 際 物 流', 0, y, { align: 'center', width: pageWidth });
      y += 30;

      doc.fontSize(10).font('NotoSansCJK');
      doc.text('수입에서 통관하여 배송까지 천일국제물류에서 책임집니다', 0, y, { align: 'center', width: pageWidth });
      y += 18;

      doc.fontSize(9);
      doc.text('경기도 평택시 포승읍 평택항로 95', 0, y, { align: 'center', width: pageWidth });
      y += 14;
      doc.text('TEL: 031-683-7040 | FAX: 031-683-7044', 0, y, { align: 'center', width: pageWidth });
      y += 14;
      doc.fillColor('#0066cc');
      doc.text('www.chunilkor.co.kr', 0, y, { align: 'center', width: pageWidth });
      doc.fillColor('#000');
      y += 20;

      // Header divider
      doc.moveTo(50, y).lineTo(pageWidth - 50, y).stroke();
      y += 30;

      // Title
      doc.fontSize(18).font('NotoSansCJK-Bold');
      doc.text('컨테이너 DAMEGE 확인서', 0, y, { align: 'center', width: pageWidth });
      y += 50;

      // Document info section
      doc.fontSize(11).font('NotoSansCJK-Bold');
      doc.text('발 신: ', 50, y, { continued: true });
      doc.font('NotoSansCJK').text(report.officeStaff || '김유진');
      y += 20;

      doc.font('NotoSansCJK-Bold').text('제 목: ', 50, y, { continued: true });
      doc.font('NotoSansCJK').text('컨테이너 DAMEGE의 건');
      y += 25;

      // Container details
      doc.fontSize(11).font('NotoSansCJK-Bold');
      doc.text('Container No.: ', 50, y, { continued: true });
      doc.font('NotoSansCJK').text(report.containerNo || '');
      y += 16;

      doc.font('NotoSansCJK-Bold').text('B/L No.: ', 50, y, { continued: true });
      doc.font('NotoSansCJK').text(report.blNo || '');
      y += 16;

      doc.font('NotoSansCJK-Bold').text('차량 번호: ', 50, y, { continued: true });
      doc.font('NotoSansCJK').text(report.vehicleNo || '');
      y += 16;

      doc.font('NotoSansCJK-Bold').text('운송 기사: ', 50, y, { continued: true });
      doc.font('NotoSansCJK').text(report.driverName || '');
      y += 16;

      doc.font('NotoSansCJK-Bold').text('운송 기사 연락처: ', 50, y, { continued: true });
      doc.font('NotoSansCJK').text(report.driverPhone || '');
      y += 16;

      doc.font('NotoSansCJK-Bold').text('입고 일자: ', 50, y, { continued: true });
      doc.font('NotoSansCJK').text(report.reportDate || '');
      y += 25;

      // Content sections
      doc.fontSize(11).font('NotoSansCJK-Bold');
      doc.text('[운송기사]', 50, y);
      y += 15;
      doc.font('NotoSansCJK').fontSize(10);
      const driverText = report.driverDamage || '컨테이너 내부 우측 벽면이 안으로 휘어진것을 확인했습니다.';
      doc.text(driverText, 50, y, { width: 495 });
      y += Math.min(doc.heightOfString(driverText, { width: 495 }), 60) + 10;

      doc.fontSize(11).font('NotoSansCJK-Bold');
      doc.text('[현장 책임자]', 50, y);
      y += 15;
      doc.font('NotoSansCJK').fontSize(10);
      const fieldText = report.fieldDamage || '본 컨테이너는 천일 입고 전 개봉한 적이 없고 과장한 내부에 대부분 일부 손실한 상태라 확인하였습니다. 해당 사항은 운송 기사님의 함께 책임있으며, 작업 중 일부한 피손은 아니 기존 피손으로 판단됩니다.';
      doc.text(fieldText, 50, y, { width: 495 });
      y += Math.min(doc.heightOfString(fieldText, { width: 495 }), 60) + 10;

      doc.fontSize(11).font('NotoSansCJK-Bold');
      doc.text('[사무실 책임자]', 50, y);
      y += 15;
      doc.font('NotoSansCJK').fontSize(10);
      const officeText = report.officeDamage || '당사 작업 중 이상은 없음을 알려드리며, 이상 내용 확인 부탁드립니다.';
      doc.text(officeText, 50, y, { width: 495 });
      y += Math.min(doc.heightOfString(officeText, { width: 495 }), 60) + 15;

      // Signature section - 2 columns
      const leftX = 50;
      const rightX = 320;
      
      // Left column: Driver signature
      doc.fontSize(11).font('NotoSansCJK-Bold');
      doc.text('운송기사: ', leftX, y, { continued: true });
      doc.font('NotoSansCJK').text(report.driverName || '');
      if (lastDriverSig) {
        try {
          const driverSigBuffer = Buffer.from(lastDriverSig.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(driverSigBuffer, leftX, y + 15, { width: 100, height: 25 });
        } catch (err) {
          doc.fontSize(9).text('서명 이미지', leftX, y + 15);
        }
      } else {
        doc.fontSize(9).text('서명 이미지', leftX, y + 15);
      }

      // Right column: Field signature
      doc.fontSize(11).font('NotoSansCJK-Bold');
      doc.text('현장 책임자: ', rightX, y, { continued: true });
      doc.font('NotoSansCJK').text(report.fieldStaff || '');
      if (lastFieldSig) {
        try {
          const fieldSigBuffer = Buffer.from(lastFieldSig.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(fieldSigBuffer, rightX, y + 15, { width: 100, height: 25 });
        } catch (err) {
          doc.fontSize(9).text('서명 이미지', rightX, y + 15);
        }
      } else {
        doc.fontSize(9).text('서명 이미지', rightX, y + 15);
      }

      y += 55;

      // Second row: Office signature and date
      doc.fontSize(11).font('NotoSansCJK-Bold');
      doc.text('사무실 책임자: ', leftX, y, { continued: true });
      doc.font('NotoSansCJK').text(report.officeStaff || '');
      if (lastOfficeSig) {
        try {
          const officeSigBuffer = Buffer.from(lastOfficeSig.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(officeSigBuffer, leftX, y + 15, { width: 100, height: 25 });
        } catch (err) {
          doc.fontSize(9).text('서명 이미지', leftX, y + 15);
        }
      } else {
        doc.fontSize(9).text('서명 이미지', leftX, y + 15);
      }

      doc.fontSize(11).font('NotoSansCJK-Bold');
      doc.text('출력일시:', rightX, y);
      doc.font('NotoSansCJK').text(dateStr, rightX, y + 15);

      // Footer at bottom
      const footerY = pageHeight - 50;
      doc.moveTo(50, footerY).lineTo(pageWidth - 50, footerY).stroke();
      doc.fontSize(8).font('NotoSansCJK');
      doc.text('본 확인서는 당사 천일국제물류에서 발행한 비 공식 문서이며, 단지 확인용으로 사용합니다.', 
               0, footerY + 10, { align: 'center', width: pageWidth });

      // Finalize
      doc.end();

    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ error: "파일 다운로드 실패" });
    }
  });

  // ZIP download endpoint (PDF + all photos) - for office staff only
  app.get("/api/reports/:id/download-with-photos", async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "보고서를 찾을 수 없습니다" });
      }

      if (report.status !== 'completed') {
        return res.status(400).json({ error: "완료된 보고서만 다운로드할 수 있습니다" });
      }

      // Create ZIP archive
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="DAMAGE_${report.containerNo}.zip"`);

      // Pipe archive to response
      archive.pipe(res);

      // Generate PDF in memory
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        
        // PDF generation logic (same as first download endpoint)
        const now = new Date();
        const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const year = kstTime.getFullYear();
        const month = String(kstTime.getMonth() + 1).padStart(2, '0');
        const day = String(kstTime.getDate()).padStart(2, '0');
        const hour = String(kstTime.getHours()).padStart(2, '0');
        const minute = String(kstTime.getMinutes()).padStart(2, '0');
        const dateStr = `${year}. ${month}. ${day}. ${hour}:${minute}`;

        const actionHistory = report.actionHistory || [];
        const lastDriverSig = actionHistory.filter(a => a.actorRole === 'driver' && a.signature).pop()?.signature;
        const lastFieldSig = actionHistory.filter(a => a.actorRole === 'field' && a.signature).pop()?.signature;
        const lastOfficeSig = actionHistory.filter(a => a.actorRole === 'office' && a.signature).pop()?.signature;

        const doc = new PDFDocument({
          size: 'A4',
          margin: 0,
          autoFirstPage: false
        });

        const fontPath = path.join(process.cwd(), 'attached_assets', 'fonts', 'NotoSansCJK-Regular.otf');
        const fontBoldPath = path.join(process.cwd(), 'attached_assets', 'fonts', 'NotoSansCJK-Bold.otf');
        doc.registerFont('NotoSansCJK', fontPath);
        doc.registerFont('NotoSansCJK-Bold', fontBoldPath);

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.addPage();

        const pageWidth = 595;
        const pageHeight = 842;
        let y = 40;

        // Header
        doc.fontSize(20).font('NotoSansCJK-Bold');
        doc.text('(株)天 一 國 際 物 流', 0, y, { align: 'center', width: pageWidth });
        y += 30;

        doc.fontSize(10).font('NotoSansCJK');
        doc.text('수입에서 통관하여 배송까지 천일국제물류에서 책임집니다', 0, y, { align: 'center', width: pageWidth });
        y += 18;

        doc.fontSize(9);
        doc.text('경기도 평택시 포승읍 평택항로 95', 0, y, { align: 'center', width: pageWidth });
        y += 14;
        doc.text('TEL: 031-683-7040 | FAX: 031-683-7044', 0, y, { align: 'center', width: pageWidth });
        y += 14;
        doc.fillColor('#0066cc');
        doc.text('www.chunilkor.co.kr', 0, y, { align: 'center', width: pageWidth });
        doc.fillColor('#000');
        y += 20;

        // Header divider
        doc.moveTo(50, y).lineTo(pageWidth - 50, y).stroke();
        y += 30;

        // Title
        doc.fontSize(18).font('NotoSansCJK-Bold');
        doc.text('컨테이너 DAMEGE 확인서', 0, y, { align: 'center', width: pageWidth });
        y += 50;

        // Document info section
        doc.fontSize(11).font('NotoSansCJK-Bold');
        doc.text('발 신: ', 50, y, { continued: true });
        doc.font('NotoSansCJK').text(report.officeStaff || '김유진');
        y += 20;

        doc.font('NotoSansCJK-Bold').text('제 목: ', 50, y, { continued: true });
        doc.font('NotoSansCJK').text('컨테이너 DAMEGE의 건');
        y += 25;

        // Container details
        doc.fontSize(11).font('NotoSansCJK-Bold');
        doc.text('Container No.: ', 50, y, { continued: true });
        doc.font('NotoSansCJK').text(report.containerNo || '');
        y += 16;

        doc.font('NotoSansCJK-Bold').text('B/L No.: ', 50, y, { continued: true });
        doc.font('NotoSansCJK').text(report.blNo || '');
        y += 16;

        doc.font('NotoSansCJK-Bold').text('차량 번호: ', 50, y, { continued: true });
        doc.font('NotoSansCJK').text(report.vehicleNo || '');
        y += 16;

        doc.font('NotoSansCJK-Bold').text('운송 기사: ', 50, y, { continued: true });
        doc.font('NotoSansCJK').text(report.driverName || '');
        y += 16;

        doc.font('NotoSansCJK-Bold').text('운송 기사 연락처: ', 50, y, { continued: true });
        doc.font('NotoSansCJK').text(report.driverPhone || '');
        y += 16;

        doc.font('NotoSansCJK-Bold').text('입고 일자: ', 50, y, { continued: true });
        doc.font('NotoSansCJK').text(report.reportDate || '');
        y += 25;

        // Content sections
        doc.fontSize(11).font('NotoSansCJK-Bold');
        doc.text('[운송기사]', 50, y);
        y += 15;
        doc.font('NotoSansCJK').fontSize(10);
        const driverText = report.driverDamage || '컨테이너 내부 우측 벽면이 안으로 휘어진것을 확인했습니다.';
        doc.text(driverText, 50, y, { width: 495 });
        y += Math.min(doc.heightOfString(driverText, { width: 495 }), 60) + 10;

        doc.fontSize(11).font('NotoSansCJK-Bold');
        doc.text('[현장 책임자]', 50, y);
        y += 15;
        doc.font('NotoSansCJK').fontSize(10);
        const fieldText = report.fieldDamage || '본 컨테이너는 천일 입고 전 개봉한 적이 없고 과장한 내부에 대부분 일부 손실한 상태라 확인하였습니다. 해당 사항은 운송 기사님의 함께 책임있으며, 작업 중 일부한 피손은 아니 기존 피손으로 판단됩니다.';
        doc.text(fieldText, 50, y, { width: 495 });
        y += Math.min(doc.heightOfString(fieldText, { width: 495 }), 60) + 10;

        doc.fontSize(11).font('NotoSansCJK-Bold');
        doc.text('[사무실 책임자]', 50, y);
        y += 15;
        doc.font('NotoSansCJK').fontSize(10);
        const officeText = report.officeDamage || '당사 작업 중 이상은 없음을 알려드리며, 이상 내용 확인 부탁드립니다.';
        doc.text(officeText, 50, y, { width: 495 });
        y += Math.min(doc.heightOfString(officeText, { width: 495 }), 60) + 15;

        // Signature section - 2 columns
        const leftX = 50;
        const rightX = 320;
        
        // Left column: Driver signature
        doc.fontSize(11).font('NotoSansCJK-Bold');
        doc.text('운송기사: ', leftX, y, { continued: true });
        doc.font('NotoSansCJK').text(report.driverName || '');
        if (lastDriverSig) {
          try {
            const driverSigBuffer = Buffer.from(lastDriverSig.replace(/^data:image\/\w+;base64,/, ''), 'base64');
            doc.image(driverSigBuffer, leftX, y + 15, { width: 100, height: 25 });
          } catch (err) {
            doc.fontSize(9).text('서명 이미지', leftX, y + 15);
          }
        } else {
          doc.fontSize(9).text('서명 이미지', leftX, y + 15);
        }

        // Right column: Field signature
        doc.fontSize(11).font('NotoSansCJK-Bold');
        doc.text('현장 책임자: ', rightX, y, { continued: true });
        doc.font('NotoSansCJK').text(report.fieldStaff || '');
        if (lastFieldSig) {
          try {
            const fieldSigBuffer = Buffer.from(lastFieldSig.replace(/^data:image\/\w+;base64,/, ''), 'base64');
            doc.image(fieldSigBuffer, rightX, y + 15, { width: 100, height: 25 });
          } catch (err) {
            doc.fontSize(9).text('서명 이미지', rightX, y + 15);
          }
        } else {
          doc.fontSize(9).text('서명 이미지', rightX, y + 15);
        }

        y += 55;

        // Second row: Office signature and date
        doc.fontSize(11).font('NotoSansCJK-Bold');
        doc.text('사무실 책임자: ', leftX, y, { continued: true });
        doc.font('NotoSansCJK').text(report.officeStaff || '');
        if (lastOfficeSig) {
          try {
            const officeSigBuffer = Buffer.from(lastOfficeSig.replace(/^data:image\/\w+;base64,/, ''), 'base64');
            doc.image(officeSigBuffer, leftX, y + 15, { width: 100, height: 25 });
          } catch (err) {
            doc.fontSize(9).text('서명 이미지', leftX, y + 15);
          }
        } else {
          doc.fontSize(9).text('서명 이미지', leftX, y + 15);
        }

        doc.fontSize(11).font('NotoSansCJK-Bold');
        doc.text('출력일시:', rightX, y);
        doc.font('NotoSansCJK').text(dateStr, rightX, y + 15);

        // Footer
        const footerY = pageHeight - 50;
        doc.moveTo(50, footerY).lineTo(pageWidth - 50, footerY).stroke();
        doc.fontSize(8).font('NotoSansCJK');
        doc.text('본 확인서는 당사 천일국제물류에서 발행한 비 공식 문서이며, 단지 확인용으로 사용합니다.', 
                 0, footerY + 10, { align: 'center', width: pageWidth });

        doc.end();
      });

      // Add PDF to archive
      archive.append(pdfBuffer, { name: `DAMAGE_${report.containerNo}.pdf` });

      // Add damage photos if they exist
      if (report.damagePhotos && report.damagePhotos.length > 0) {
        for (let i = 0; i < report.damagePhotos.length; i++) {
          const photoPath = report.damagePhotos[i];
          // Convert /assets/ to attached_assets/
          const relativePath = photoPath.replace(/^\/assets\//, 'attached_assets/');
          const fullPath = path.join(process.cwd(), relativePath);
          
          if (fs.existsSync(fullPath)) {
            const ext = path.extname(photoPath);
            archive.file(fullPath, { name: `사진_${i + 1}${ext}` });
          } else {
            console.log(`Photo not found: ${fullPath}`);
          }
        }
      }

      // Finalize archive
      await archive.finalize();

    } catch (error) {
      console.error('ZIP download error:', error);
      res.status(500).json({ error: "파일 다운로드 실패" });
    }
  });

  const httpServer = createServer(app);

  // Initialize WebSocket server with noServer option to avoid conflicts with Vite HMR
  wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    // Only handle WebSocket connections on /ws path
    if (request.url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
