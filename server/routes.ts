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
  insertOfficeStaffSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

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
      const { vehicleNo, password } = req.body;

      if (!vehicleNo || !password) {
        return res.status(400).json({ error: "차량번호와 비밀번호를 입력해주세요" });
      }

      const vehicle = await storage.getVehicleByNumber(vehicleNo);
      
      if (!vehicle) {
        return res.status(401).json({ error: "차량번호를 찾을 수 없습니다" });
      }

      const correctPassword = vehicle.driverPhone.replace(/-/g, '');
      
      if (password !== correctPassword) {
        return res.status(401).json({ error: "비밀번호가 일치하지 않습니다" });
      }

      res.json({
        success: true,
        vehicleNo: vehicle.vehicleNo,
        driverName: vehicle.driverName,
        driverPhone: vehicle.driverPhone,
      });
    } catch (error) {
      res.status(500).json({ error: "로그인 처리 중 오류가 발생했습니다" });
    }
  });

  // Field staff login
  app.post("/api/auth/field-login", async (req, res) => {
    try {
      const { staffId, password } = req.body;

      if (!staffId || !password) {
        return res.status(400).json({ error: "담당자와 비밀번호를 입력해주세요" });
      }

      const staff = await storage.getFieldStaff(staffId);
      
      if (!staff) {
        return res.status(401).json({ error: "담당자를 찾을 수 없습니다" });
      }

      const correctPassword = staff.phone.replace(/-/g, '');
      
      if (password !== correctPassword) {
        return res.status(401).json({ error: "비밀번호가 일치하지 않습니다" });
      }

      res.json({
        success: true,
        staffId: staff.id,
        staffName: staff.name,
        staffPhone: staff.phone,
      });
    } catch (error) {
      res.status(500).json({ error: "로그인 처리 중 오류가 발생했습니다" });
    }
  });

  // Office staff login
  app.post("/api/auth/office-login", async (req, res) => {
    try {
      const { staffId, password } = req.body;

      if (!staffId || !password) {
        return res.status(400).json({ error: "담당자와 비밀번호를 입력해주세요" });
      }

      const staff = await storage.getOfficeStaff(staffId);
      
      if (!staff) {
        return res.status(401).json({ error: "담당자를 찾을 수 없습니다" });
      }

      const correctPassword = staff.phone.replace(/-/g, '');
      
      if (password !== correctPassword) {
        return res.status(401).json({ error: "비밀번호가 일치하지 않습니다" });
      }

      res.json({
        success: true,
        staffId: staff.id,
        staffName: staff.name,
        staffPhone: staff.phone,
      });
    } catch (error) {
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

      // Update with submission timestamp
      const updatedReport = await storage.updateReport(report.id, {
        driverSubmittedAt: new Date(),
        status: 'driver_submitted',
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

      const updateData: any = {
        driverDamage,
        driverSignature,
        status: 'driver_submitted',
        driverSubmittedAt: new Date(),
        rejectionReason: null,
        rejectedAt: null,
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

      if (action === 'reject') {
        if (!rejectionReason) {
          return res.status(400).json({ error: "반려 사유를 입력해주세요" });
        }

        const updatedReport = await storage.updateReport(req.params.id, {
          status: 'rejected',
          rejectionReason,
          rejectedAt: new Date(),
        });

        return res.json(updatedReport);
      }

      if (action === 'approve') {
        const validatedData = fieldReviewSchema.parse({ 
          ...reviewData, 
          reportId: req.params.id, 
          action 
        });

        const updatedReport = await storage.updateReport(req.params.id, {
          fieldStaff: validatedData.fieldStaff,
          fieldPhone: validatedData.fieldPhone,
          fieldDamage: validatedData.fieldDamage,
          fieldSignature: validatedData.fieldSignature,
          status: 'field_submitted',
          fieldSubmittedAt: new Date(),
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

      const updatedReport = await storage.updateReport(req.params.id, {
        officeStaff: validatedData.officeStaff,
        officePhone: validatedData.officePhone,
        officeDamage: validatedData.officeDamage,
        officeSignature: validatedData.officeSignature,
        status: 'completed',
        completedAt: new Date(),
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

      const { rejectionReason } = req.body;
      
      if (!rejectionReason) {
        return res.status(400).json({ error: "반려 사유를 입력해주세요" });
      }

      const updatedReport = await storage.updateReport(req.params.id, {
        status: 'driver_submitted',
        rejectionReason,
        rejectedAt: new Date(),
      });

      res.json(updatedReport);
    } catch (error) {
      res.status(500).json({ error: "반려 처리 실패" });
    }
  });

  // Download report as text file
  app.get("/api/reports/:id/download", async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "보고서를 찾을 수 없습니다" });
      }

      if (report.status !== 'completed') {
        return res.status(400).json({ error: "완료된 보고서만 다운로드할 수 있습니다" });
      }

      const dateStr = report.completedAt 
        ? new Date(report.completedAt).toLocaleString('ko-KR')
        : new Date().toLocaleString('ko-KR');

      const content = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

수 입 에 서 통 관 하 여 배 송 까 지 천 일 국 제 물 류 에 서 책 임 집 니 다

(株)天 一 國 際 物 流
경기도 평택시 포승읍 평택항로 95
TEL: 031-683-7040, FAX: 031-683-7044

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

발 신: ${report.officeStaff}
제 목: 컨테이너 DAMAGE의 건

Container No.: ${report.containerNo}
B/L No.: ${report.blNo}
차량 번호: ${report.vehicleNo}
운송 기사: ${report.driverName}

파손 유형:

1. 상기 컨테이너는 천일에 입고하여 컨테이너 문을 개장하였는데, 일부 파손된 것을 컨테이너 운송 기사님과 확인하였습니다.

2. 당사에서는 작업 간에 이상이 없었으니 확인 부탁 드립니다.

3. 상기와 같이 확인 합니다.

[운송기사] ${report.driverDamage}
[현장책임] ${report.fieldDamage}
[사무실] ${report.officeDamage}

현장책임자: ${report.fieldStaff}  서명: ${report.fieldSignature}
사무실 책임자: ${report.officeStaff}  서명: ${report.officeSignature}
작성일시: ${dateStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="DAMAGE_${report.containerNo}.txt"`);
      res.send(content);
    } catch (error) {
      res.status(500).json({ error: "파일 다운로드 실패" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
