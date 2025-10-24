import type { Express } from "express";
import { createServer, type Server } from "http";
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

      const vehicle = await storage.getVehicleByNumber(validatedData.vehicleNo);
      
      if (!vehicle) {
        return res.status(401).json({ error: "차량번호를 찾을 수 없습니다" });
      }

      const correctPassword = vehicle.driverPhone.replace(/-/g, '');
      
      if (validatedData.password !== correctPassword) {
        return res.status(401).json({ error: "비밀번호가 일치하지 않습니다" });
      }

      res.json({
        success: true,
        vehicleNo: vehicle.vehicleNo,
        driverName: vehicle.driverName,
        driverPhone: vehicle.driverPhone,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "입력 데이터 오류", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "로그인 처리 중 오류가 발생했습니다" });
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "입력 데이터 오류", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "로그인 처리 중 오류가 발생했습니다" });
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "입력 데이터 오류", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "로그인 처리 중 오류가 발생했습니다" });
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "입력 데이터 오류", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "로그인 처리 중 오류가 발생했습니다" });
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

      res.json(updatedReport);
    } catch (error) {
      res.status(500).json({ error: "반려 처리 실패" });
    }
  });

  // Download report as PDF file
  app.get("/api/reports/:id/download", async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "보고서를 찾을 수 없습니다" });
      }

      if (report.status !== 'completed') {
        return res.status(400).json({ error: "완료된 보고서만 다운로드할 수 있습니다" });
      }

      // PDF 생성 시점의 날짜/시간
      const now = new Date();
      const dateStr = now.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      // Create PDF document with margins for header/footer
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 140,  // Space for header
          bottom: 60, // Space for footer
          left: 50,
          right: 50
        },
        bufferPages: true  // Buffer all pages to add header/footer at the end
      });

      // Register CJK fonts (supports Korean + Chinese characters)
      const fontPath = path.join(process.cwd(), 'attached_assets', 'fonts', 'NotoSansCJK-Regular.otf');
      const fontBoldPath = path.join(process.cwd(), 'attached_assets', 'fonts', 'NotoSansCJK-Bold.otf');
      doc.registerFont('NotoSansCJK', fontPath);
      doc.registerFont('NotoSansCJK-Bold', fontBoldPath);

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="DAMAGE_${report.containerNo}.pdf"`);

      // Pipe PDF to response
      doc.pipe(res);

      // Document Title
      doc.fontSize(16)
         .font('NotoSansCJK-Bold')
         .text('컨테이너 DAMAGE 확인서', { align: 'center' });
      
      doc.moveDown(1.5);

      // Document Info
      doc.fontSize(11)
         .font('NotoSansCJK-Bold')
         .text('발 신: ', { continued: true })
         .font('NotoSansCJK')
         .text(report.officeStaff || '');
      
      doc.moveDown(0.4);
      
      doc.font('NotoSansCJK-Bold')
         .text('제 목: ', { continued: true })
         .font('NotoSansCJK')
         .text('컨테이너 DAMAGE의 건');
      
      doc.moveDown(1.2);

      // Container Information
      doc.fontSize(11)
         .font('NotoSansCJK-Bold')
         .text('Container No.: ', { continued: true })
         .font('NotoSansCJK')
         .text(report.containerNo);
      
      doc.moveDown(0.3);
      
      doc.font('NotoSansCJK-Bold')
         .text('B/L No.: ', { continued: true })
         .font('NotoSansCJK')
         .text(report.blNo);
      
      doc.moveDown(0.3);
      
      doc.font('NotoSansCJK-Bold')
         .text('차량 번호: ', { continued: true })
         .font('NotoSansCJK')
         .text(report.vehicleNo);
      
      doc.moveDown(0.3);
      
      doc.font('NotoSansCJK-Bold')
         .text('운송 기사: ', { continued: true })
         .font('NotoSansCJK')
         .text(report.driverName);
      
      doc.moveDown(0.3);
      
      doc.font('NotoSansCJK-Bold')
         .text('운송기사 연락처: ', { continued: true })
         .font('NotoSansCJK')
         .text(report.driverPhone || '');
      
      doc.moveDown(0.3);
      
      doc.font('NotoSansCJK-Bold')
         .text('화물 일자: ', { continued: true })
         .font('NotoSansCJK')
         .text(report.reportDate || '');
      
      doc.moveDown(1.8);

      // Content Section Header
      doc.fontSize(13)
         .font('NotoSansCJK-Bold')
         .text('내 용');
      
      doc.moveDown(1);

      doc.fontSize(11)
         .font('NotoSansCJK-Bold')
         .text('파손 유형:');
      
      doc.moveDown(1);

      // Driver Section
      doc.font('NotoSansCJK-Bold')
         .text('[운송기사]', { continued: false });
      doc.moveDown(0.5);
      doc.font('NotoSansCJK')
         .text(report.driverDamage || '', { indent: 20, width: 475 });
      
      doc.moveDown(1);

      // Field Staff Section
      doc.font('NotoSansCJK-Bold')
         .text('[현장 책임자]', { continued: false });
      doc.moveDown(0.5);
      doc.font('NotoSansCJK')
         .text(report.fieldDamage || '', { indent: 20, width: 475 });
      
      doc.moveDown(1);

      // Office Staff Section
      doc.font('NotoSansCJK-Bold')
         .text('[사무실 책임자]', { continued: false });
      doc.moveDown(0.5);
      doc.font('NotoSansCJK')
         .text(report.officeDamage || '', { indent: 20, width: 475 });
      
      doc.moveDown(1.8);

      // Signature Section
      doc.fontSize(13)
         .font('NotoSansCJK-Bold')
         .text('서 명');
      
      doc.moveDown(1);

      // Get last signatures from actionHistory
      const actionHistory = report.actionHistory || [];
      const lastDriverSig = actionHistory.filter(a => a.actorRole === 'driver' && a.signature).pop()?.signature;
      const lastFieldSig = actionHistory.filter(a => a.actorRole === 'field' && a.signature).pop()?.signature;
      const lastOfficeSig = actionHistory.filter(a => a.actorRole === 'office' && a.signature).pop()?.signature;

      // Driver signature
      doc.fontSize(11)
         .font('NotoSansCJK-Bold')
         .text('운송기사: ', { continued: true })
         .font('NotoSansCJK')
         .text(report.driverName);
      doc.moveDown(0.5);
      if (lastDriverSig) {
        try {
          const driverSigBuffer = Buffer.from(lastDriverSig.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(driverSigBuffer, 70, doc.y, { width: 150, height: 40 });
          doc.moveDown(3);
        } catch (error) {
          console.error('Failed to embed driver signature image:', error);
          doc.font('NotoSansCJK')
             .text('[서명 이미지]', { indent: 20 });
          doc.moveDown(0.5);
        }
      } else if (report.driverSignature) {
        doc.font('NotoSansCJK')
           .text('[서명 완료]', { indent: 20 });
        doc.moveDown(0.5);
      }
      
      doc.moveDown(1);

      // Field signature
      doc.font('NotoSansCJK-Bold')
         .text('현장책임자: ', { continued: true })
         .font('NotoSansCJK')
         .text(report.fieldStaff || '');
      doc.moveDown(0.5);
      if (lastFieldSig) {
        try {
          const fieldSigBuffer = Buffer.from(lastFieldSig.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(fieldSigBuffer, 70, doc.y, { width: 150, height: 40 });
          doc.moveDown(3);
        } catch (error) {
          console.error('Failed to embed field signature image:', error);
          doc.font('NotoSansCJK')
             .text('[서명 이미지]', { indent: 20 });
          doc.moveDown(0.5);
        }
      } else if (report.fieldSignature) {
        doc.font('NotoSansCJK')
           .text('[서명 완료]', { indent: 20 });
        doc.moveDown(0.5);
      }
      
      doc.moveDown(1);

      // Office signature
      doc.font('NotoSansCJK-Bold')
         .text('사무실 책임자: ', { continued: true })
         .font('NotoSansCJK')
         .text(report.officeStaff || '');
      doc.moveDown(0.5);
      if (lastOfficeSig) {
        try {
          const officeSigBuffer = Buffer.from(lastOfficeSig.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(officeSigBuffer, 70, doc.y, { width: 150, height: 40 });
          doc.moveDown(3);
        } catch (error) {
          console.error('Failed to embed office signature image:', error);
          doc.font('NotoSansCJK')
             .text('[서명 이미지]', { indent: 20 });
          doc.moveDown(0.5);
        }
      } else if (report.officeSignature) {
        doc.font('NotoSansCJK')
           .text('[서명 완료]', { indent: 20 });
        doc.moveDown(0.5);
      }
      
      doc.moveDown(1.8);

      // Date
      doc.fontSize(11)
         .font('NotoSansCJK-Bold')
         .text('출력일시: ', { continued: true })
         .font('NotoSansCJK')
         .text(dateStr);

      // Add header and footer to all pages
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        
        const pageHeight = doc.page.height;
        const pageWidth = doc.page.width;
        
        // Draw header at top
        doc.fontSize(20)
           .font('NotoSansCJK-Bold')
           .text('(株)天 一 國 際 物 流', 50, 30, { align: 'center', width: pageWidth - 100, lineBreak: false });
        
        doc.fontSize(11)
           .font('NotoSansCJK')
           .text('수입에서 통관하여 배송까지 천일국제물류에서 책임집니다', 50, 58, { align: 'center', width: pageWidth - 100, lineBreak: false });
        
        doc.fontSize(10)
           .text('경기도 평택시 포승읍 평택항로 95', 50, 78, { align: 'center', width: pageWidth - 100, lineBreak: false });
        doc.text('TEL: 031-683-7040  |  FAX: 031-683-7044', 50, 92, { align: 'center', width: pageWidth - 100, lineBreak: false });
        doc.text('www.chunilkor.co.kr', 50, 106, { align: 'center', width: pageWidth - 100, lineBreak: false });
        
        // Header divider line
        doc.moveTo(50, 128)
           .lineTo(pageWidth - 50, 128)
           .stroke();
        
        // Draw footer at bottom
        const footerY = pageHeight - 55;
        doc.moveTo(50, footerY)
           .lineTo(pageWidth - 50, footerY)
           .stroke();
        
        // Footer text
        doc.fontSize(8)
           .font('NotoSansCJK')
           .text('본 확인서는 당사 천일국제물류에서 발행한 비 공식 문서이며, 단지 확인용으로 사용합니다.', 
                 50, footerY + 10, { align: 'center', width: pageWidth - 100, lineBreak: false });
      }

      // Finalize PDF
      doc.end();
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ error: "파일 다운로드 실패" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
