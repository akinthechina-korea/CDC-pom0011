import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { 
  reports, 
  vehicles, 
  cargo, 
  fieldStaff, 
  officeStaff,
  adminStaff,
  insertReportSchema,
  insertCargoSchema,
  insertVehicleSchema,
  insertFieldStaffSchema,
  insertOfficeStaffSchema,
  type Report
} from "../shared/schema";
import { eq, desc } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import Papa from "papaparse";

// Multer storage configuration for damage photos
const damagePhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'attached_assets', 'damage_photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `damage_${uniqueSuffix}${ext}`);
  }
});

const uploadDamagePhoto = multer({
  storage: damagePhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('허용되지 않는 파일 형식입니다. JPG, PNG, WEBP만 업로드 가능합니다.'));
    }
  }
});

function log_request(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse).substring(0, 100)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
}

export async function registerRoutes(app: express.Application): Promise<Server> {
  app.use(log_request);

  // ================ MASTER DATA ROUTES ================
  
  // Get cargo data
  app.get("/api/data/cargo", async (req, res) => {
    const cargoData = await db.select().from(cargo).orderBy(desc(cargo.id));
    res.json(cargoData);
  });

  // Get vehicle/driver data
  app.get("/api/data/vehicles", async (req, res) => {
    const vehicleData = await db.select().from(vehicles).orderBy(desc(vehicles.id));
    res.json(vehicleData);
  });

  // Get field staff data
  app.get("/api/data/field-staff", async (req, res) => {
    const staffData = await db.select().from(fieldStaff).orderBy(desc(fieldStaff.id));
    res.json(staffData);
  });

  // Get office staff data
  app.get("/api/data/office-staff", async (req, res) => {
    const staffData = await db.select().from(officeStaff).orderBy(desc(officeStaff.id));
    res.json(staffData);
  });

  // Get admin staff data
  app.get("/api/data/admin-staff", async (req, res) => {
    const staffData = await db.select().from(adminStaff).orderBy(desc(adminStaff.id));
    res.json(staffData);
  });

  // Bulk upload cargo data via CSV (adds to existing data)
  app.post("/api/data/cargo/bulk", async (req, res) => {
    try {
      const csvData = req.body.data;
      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ error: "CSV 데이터가 올바르지 않습니다" });
      }

      const records = csvData.map((row: any) => {
        const parsed = insertCargoSchema.safeParse({
          containerNo: row.containerNo?.trim(),
          blNo: row.blNo?.trim()
        });
        
        if (!parsed.success) {
          throw new Error(`잘못된 데이터: ${JSON.stringify(row)}`);
        }
        
        return parsed.data;
      });

      await db.insert(cargo).values(records);
      res.json({ message: `${records.length}개의 화물 데이터를 추가했습니다` });
    } catch (error) {
      console.error('Cargo bulk upload error:', error);
      res.status(500).json({ error: "화물 데이터 업로드 실패" });
    }
  });

  // Bulk upload vehicle data via CSV (adds to existing data)
  app.post("/api/data/vehicles/bulk", async (req, res) => {
    try {
      const csvData = req.body.data;
      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ error: "CSV 데이터가 올바르지 않습니다" });
      }

      const records = csvData.map((row: any) => {
        const parsed = insertVehicleSchema.safeParse({
          vehicleNo: row.vehicleNo?.trim(),
          driverName: row.driverName?.trim(),
          phone: row.phone?.trim()
        });
        
        if (!parsed.success) {
          throw new Error(`잘못된 데이터: ${JSON.stringify(row)}`);
        }
        
        return parsed.data;
      });

      await db.insert(vehicles).values(records);
      res.json({ message: `${records.length}개의 차량 데이터를 추가했습니다` });
    } catch (error) {
      console.error('Vehicle bulk upload error:', error);
      res.status(500).json({ error: "차량 데이터 업로드 실패" });
    }
  });

  // Bulk upload field staff data via CSV (adds to existing data)
  app.post("/api/data/field-staff/bulk", async (req, res) => {
    try {
      const csvData = req.body.data;
      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ error: "CSV 데이터가 올바르지 않습니다" });
      }

      const records = csvData.map((row: any) => {
        const parsed = insertFieldStaffSchema.safeParse({
          name: row.name?.trim(),
          phone: row.phone?.trim()
        });
        
        if (!parsed.success) {
          throw new Error(`잘못된 데이터: ${JSON.stringify(row)}`);
        }
        
        return parsed.data;
      });

      await db.insert(fieldStaff).values(records);
      res.json({ message: `${records.length}개의 현장 담당자 데이터를 추가했습니다` });
    } catch (error) {
      console.error('Field staff bulk upload error:', error);
      res.status(500).json({ error: "현장 담당자 데이터 업로드 실패" });
    }
  });

  // Bulk upload office staff data via CSV (adds to existing data)
  app.post("/api/data/office-staff/bulk", async (req, res) => {
    try {
      const csvData = req.body.data;
      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ error: "CSV 데이터가 올바르지 않습니다" });
      }

      const records = csvData.map((row: any) => {
        const parsed = insertOfficeStaffSchema.safeParse({
          name: row.name?.trim(),
          phone: row.phone?.trim()
        });
        
        if (!parsed.success) {
          throw new Error(`잘못된 데이터: ${JSON.stringify(row)}`);
        }
        
        return parsed.data;
      });

      await db.insert(officeStaff).values(records);
      res.json({ message: `${records.length}개의 사무실 담당자 데이터를 추가했습니다` });
    } catch (error) {
      console.error('Office staff bulk upload error:', error);
      res.status(500).json({ error: "사무실 담당자 데이터 업로드 실패" });
    }
  });

  // Replace cargo data (used by direct edit feature)
  app.post("/api/data/cargo/replace", async (req, res) => {
    try {
      const data = req.body.data;
      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ error: "데이터가 올바르지 않습니다" });
      }

      // Validate all records first
      const records = data.map((row: any, index: number) => {
        const parsed = insertCargoSchema.safeParse({
          containerNo: row.containerNo?.trim(),
          blNo: row.blNo?.trim()
        });
        
        if (!parsed.success) {
          const errorMsg = `${index + 1}번째 행에 오류가 있습니다: ${parsed.error.errors.map((e: any) => `${e.path.join('.')} - ${e.message}`).join(', ')}`;
          throw new Error(errorMsg);
        }
        
        return parsed.data;
      });

      // Use transaction to replace all data
      await db.transaction(async (tx) => {
        await tx.delete(cargo);
        if (records.length > 0) {
          await tx.insert(cargo).values(records);
        }
      });

      res.json({ message: `${records.length}개의 화물 데이터로 교체했습니다` });
    } catch (error: any) {
      console.error('Cargo replace error:', error);
      res.status(400).json({ error: error.message || "화물 데이터 교체 실패" });
    }
  });

  // Replace vehicle data (used by direct edit feature)
  app.post("/api/data/vehicles/replace", async (req, res) => {
    try {
      const data = req.body.data;
      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ error: "데이터가 올바르지 않습니다" });
      }

      // Validate all records first
      const records = data.map((row: any, index: number) => {
        const parsed = insertVehicleSchema.safeParse({
          vehicleNo: row.vehicleNo?.trim(),
          driverName: row.driverName?.trim(),
          phone: row.phone?.trim()
        });
        
        if (!parsed.success) {
          const errorMsg = `${index + 1}번째 행에 오류가 있습니다: ${parsed.error.errors.map((e: any) => `${e.path.join('.')} - ${e.message}`).join(', ')}`;
          throw new Error(errorMsg);
        }
        
        return parsed.data;
      });

      // Use transaction to replace all data
      await db.transaction(async (tx) => {
        await tx.delete(vehicles);
        if (records.length > 0) {
          await tx.insert(vehicles).values(records);
        }
      });

      res.json({ message: `${records.length}개의 차량 데이터로 교체했습니다` });
    } catch (error: any) {
      console.error('Vehicle replace error:', error);
      res.status(400).json({ error: error.message || "차량 데이터 교체 실패" });
    }
  });

  // Replace field staff data (used by direct edit feature)
  app.post("/api/data/field-staff/replace", async (req, res) => {
    try {
      const data = req.body.data;
      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ error: "데이터가 올바르지 않습니다" });
      }

      // Validate all records first
      const records = data.map((row: any, index: number) => {
        const parsed = insertFieldStaffSchema.safeParse({
          name: row.name?.trim(),
          phone: row.phone?.trim()
        });
        
        if (!parsed.success) {
          const errorMsg = `${index + 1}번째 행에 오류가 있습니다: ${parsed.error.errors.map((e: any) => `${e.path.join('.')} - ${e.message}`).join(', ')}`;
          throw new Error(errorMsg);
        }
        
        return parsed.data;
      });

      // Use transaction to replace all data
      await db.transaction(async (tx) => {
        await tx.delete(fieldStaff);
        if (records.length > 0) {
          await tx.insert(fieldStaff).values(records);
        }
      });

      res.json({ message: `${records.length}개의 현장 담당자 데이터로 교체했습니다` });
    } catch (error: any) {
      console.error('Field staff replace error:', error);
      res.status(400).json({ error: error.message || "현장 담당자 데이터 교체 실패" });
    }
  });

  // Replace office staff data (used by direct edit feature)
  app.post("/api/data/office-staff/replace", async (req, res) => {
    try {
      const data = req.body.data;
      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ error: "데이터가 올바르지 않습니다" });
      }

      // Validate all records first
      const records = data.map((row: any, index: number) => {
        const parsed = insertOfficeStaffSchema.safeParse({
          name: row.name?.trim(),
          phone: row.phone?.trim()
        });
        
        if (!parsed.success) {
          const errorMsg = `${index + 1}번째 행에 오류가 있습니다: ${parsed.error.errors.map((e: any) => `${e.path.join('.')} - ${e.message}`).join(', ')}`;
          throw new Error(errorMsg);
        }
        
        return parsed.data;
      });

      // Use transaction to replace all data
      await db.transaction(async (tx) => {
        await tx.delete(officeStaff);
        if (records.length > 0) {
          await tx.insert(officeStaff).values(records);
        }
      });

      res.json({ message: `${records.length}개의 사무실 담당자 데이터로 교체했습니다` });
    } catch (error: any) {
      console.error('Office staff replace error:', error);
      res.status(400).json({ error: error.message || "사무실 담당자 데이터 교체 실패" });
    }
  });

  // ================ FILE UPLOAD ROUTES ================
  
  // Upload damage photo
  app.post("/api/upload/damage-photo", uploadDamagePhoto.single('photo'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "파일이 업로드되지 않았습니다" });
    }
    
    const photoUrl = `/attached_assets/damage_photos/${req.file.filename}`;
    res.json({ url: photoUrl });
  });

  // ================ REPORT ROUTES ================
  
  // Get all reports
  app.get("/api/reports", async (req, res) => {
    const allReports = await db.select().from(reports).orderBy(desc(reports.createdAt));
    res.json(allReports);
  });

  // Create new report (driver)
  app.post("/api/reports", async (req, res) => {
    try {
      const reportData = insertReportSchema.parse(req.body);
      const [newReport] = await db.insert(reports).values(reportData).returning();
      res.json(newReport);
    } catch (error) {
      console.error('Report creation error:', error);
      res.status(400).json({ error: "보고서 작성 실패" });
    }
  });

  // Resubmit report (driver)
  app.put("/api/reports/:id/resubmit", async (req, res) => {
    try {
      const { id } = req.params;
      const { driverDamage, damagePhotos, signature, actorName, actorRole } = req.body;

      const [existingReport] = await db.select().from(reports).where(eq(reports.id, id));
      if (!existingReport) {
        return res.status(404).json({ error: "보고서를 찾을 수 없습니다" });
      }

      if (existingReport.status !== 'rejected') {
        return res.status(400).json({ error: "반려된 보고서만 재제출할 수 있습니다" });
      }

      // Add action to history
      const actionHistory = existingReport.actionHistory || [];
      actionHistory.push({
        action: 'resubmit',
        timestamp: new Date().toISOString(),
        actorName: actorName || existingReport.driverName,
        actorRole: actorRole || 'driver',
        signature: signature || null,
        reason: null
      });

      const [updated] = await db.update(reports)
        .set({
          status: 'driver_submitted',
          driverDamage,
          damagePhotos,
          driverSignature: signature,
          driverSubmittedAt: new Date().toISOString(),
          actionHistory
        })
        .where(eq(reports.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error('Report resubmit error:', error);
      res.status(500).json({ error: "재제출 실패" });
    }
  });

  // Field review (approve/reject)
  app.put("/api/reports/:id/field-review", async (req, res) => {
    try {
      const { id } = req.params;
      const { approved, fieldDamage, reason, signature, actorName, actorRole } = req.body;

      const [existingReport] = await db.select().from(reports).where(eq(reports.id, id));
      if (!existingReport) {
        return res.status(404).json({ error: "보고서를 찾을 수 없습니다" });
      }

      if (existingReport.status !== 'driver_submitted') {
        return res.status(400).json({ error: "현장 검토 대기 중인 보고서가 아닙니다" });
      }

      // Add action to history
      const actionHistory = existingReport.actionHistory || [];
      actionHistory.push({
        action: approved ? 'field_approve' : 'field_reject',
        timestamp: new Date().toISOString(),
        actorName: actorName || existingReport.fieldStaff || '',
        actorRole: actorRole || 'field',
        signature: approved ? (signature || null) : null,
        reason: approved ? null : (reason || null)
      });

      const [updated] = await db.update(reports)
        .set({
          status: approved ? 'field_submitted' : 'rejected',
          fieldDamage: approved ? fieldDamage : existingReport.fieldDamage,
          fieldSignature: approved ? signature : null,
          fieldReviewedAt: new Date().toISOString(),
          actionHistory
        })
        .where(eq(reports.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error('Field review error:', error);
      res.status(500).json({ error: "현장 검토 실패" });
    }
  });

  // Office final approval (approve/reject)
  app.put("/api/reports/:id/office-approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { approved, officeDamage, reason, signature, actorName, actorRole } = req.body;

      const [existingReport] = await db.select().from(reports).where(eq(reports.id, id));
      if (!existingReport) {
        return res.status(404).json({ error: "보고서를 찾을 수 없습니다" });
      }

      if (existingReport.status !== 'field_submitted') {
        return res.status(400).json({ error: "사무실 승인 대기 중인 보고서가 아닙니다" });
      }

      // Add action to history
      const actionHistory = existingReport.actionHistory || [];
      actionHistory.push({
        action: approved ? 'office_approve' : 'office_reject',
        timestamp: new Date().toISOString(),
        actorName: actorName || existingReport.officeStaff || '',
        actorRole: actorRole || 'office',
        signature: approved ? (signature || null) : null,
        reason: approved ? null : (reason || null)
      });

      const [updated] = await db.update(reports)
        .set({
          status: approved ? 'completed' : 'driver_submitted',
          officeDamage: approved ? officeDamage : existingReport.officeDamage,
          officeSignature: approved ? signature : null,
          officeApprovedAt: approved ? new Date().toISOString() : null,
          actionHistory
        })
        .where(eq(reports.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error('Office approval error:', error);
      res.status(500).json({ error: "반려 처리 실패" });
    }
  });

  // Download report as PDF file
  app.get("/api/reports/:id/download", async (req, res) => {
    try {
      const report = await db.select().from(reports).where(eq(reports.id, req.params.id)).then(rows => rows[0]);
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
      }).replace(/\. /g, '. ');

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 140,
          bottom: 70,
          left: 70,
          right: 70
        },
        bufferPages: true
      });

      // Register CJK fonts
      const fontPath = path.join(process.cwd(), 'attached_assets', 'fonts', 'NotoSansCJK-Regular.otf');
      const fontBoldPath = path.join(process.cwd(), 'attached_assets', 'fonts', 'NotoSansCJK-Bold.otf');
      doc.registerFont('NotoSansCJK', fontPath);
      doc.registerFont('NotoSansCJK-Bold', fontBoldPath);

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="DAMAGE_${report.containerNo}.pdf"`);
      doc.pipe(res);

      const pageWidth = 595.28; // A4 width in points
      const contentWidth = pageWidth - 140; // 70px margins on each side

      // === DOCUMENT TITLE ===
      doc.fontSize(16)
         .font('NotoSansCJK-Bold')
         .text('컨테이너 DAMEGE 확인서', 70, 140, { align: 'center', width: contentWidth });
      
      doc.moveDown(2);

      // === METADATA SECTION ===
      const startY = doc.y;
      
      doc.fontSize(11)
         .font('NotoSansCJK-Bold')
         .text('발 신: ', 70, startY, { continued: true })
         .font('NotoSansCJK')
         .text(report.officeStaff || '');
      
      doc.moveDown(0.5);
      
      doc.font('NotoSansCJK-Bold')
         .text('제 목: ', 70, doc.y, { continued: true })
         .font('NotoSansCJK')
         .text('컨테이너 DAMAGE의 건');
      
      doc.moveDown(1.5);

      // === CONTAINER INFO ===
      doc.fontSize(11)
         .font('NotoSansCJK-Bold')
         .text('Container No.: ', 70, doc.y, { continued: true })
         .font('NotoSansCJK')
         .text(report.containerNo);
      
      doc.moveDown(0.4);
      
      doc.font('NotoSansCJK-Bold')
         .text('B/L No.: ', 70, doc.y, { continued: true })
         .font('NotoSansCJK')
         .text(report.blNo);
      
      doc.moveDown(0.4);
      
      doc.font('NotoSansCJK-Bold')
         .text('차량 번호: ', 70, doc.y, { continued: true })
         .font('NotoSansCJK')
         .text(report.vehicleNo);
      
      doc.moveDown(0.4);
      
      doc.font('NotoSansCJK-Bold')
         .text('운송 기사: ', 70, doc.y, { continued: true })
         .font('NotoSansCJK')
         .text(report.driverName);
      
      doc.moveDown(0.4);
      
      doc.font('NotoSansCJK-Bold')
         .text('운송기사 연락처: ', 70, doc.y, { continued: true })
         .font('NotoSansCJK')
         .text(report.driverPhone || '');
      
      doc.moveDown(0.4);
      
      doc.font('NotoSansCJK-Bold')
         .text('화물 일자: ', 70, doc.y, { continued: true })
         .font('NotoSansCJK')
         .text(report.reportDate || '');
      
      doc.moveDown(2);

      // === CONTENT SECTIONS ===
      doc.fontSize(11)
         .font('NotoSansCJK-Bold')
         .text('[운송기사]', 70, doc.y);
      doc.moveDown(0.5);
      doc.font('NotoSansCJK')
         .text(report.driverDamage || '', 70, doc.y, { width: contentWidth });
      
      doc.moveDown(1.5);

      doc.font('NotoSansCJK-Bold')
         .text('[현장 책임자]', 70, doc.y);
      doc.moveDown(0.5);
      doc.font('NotoSansCJK')
         .text(report.fieldDamage || '', 70, doc.y, { width: contentWidth });
      
      doc.moveDown(1.5);

      doc.font('NotoSansCJK-Bold')
         .text('[사무실 책임자]', 70, doc.y);
      doc.moveDown(0.5);
      doc.font('NotoSansCJK')
         .text(report.officeDamage || '', 70, doc.y, { width: contentWidth });
      
      doc.moveDown(2.5);

      // === SIGNATURE SECTION (2-COLUMN LAYOUT) ===
      const actionHistory = report.actionHistory || [];
      const lastDriverSig = actionHistory.filter((a: any) => a.actorRole === 'driver' && a.signature).pop()?.signature;
      const lastFieldSig = actionHistory.filter((a: any) => a.actorRole === 'field' && a.signature).pop()?.signature;
      const lastOfficeSig = actionHistory.filter((a: any) => a.actorRole === 'office' && a.signature).pop()?.signature;

      const sigStartY = doc.y;
      const leftColumn = 70;
      const rightColumn = 70 + contentWidth / 2 + 20;

      // LEFT COLUMN: 운송기사
      doc.fontSize(11)
         .font('NotoSansCJK-Bold')
         .text('운송기사: ', leftColumn, sigStartY, { continued: true })
         .font('NotoSansCJK')
         .text(report.driverName);
      
      let leftY = sigStartY + 20;
      if (lastDriverSig) {
        try {
          const driverSigBuffer = Buffer.from(lastDriverSig.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(driverSigBuffer, leftColumn, leftY, { width: 100, height: 40 });
          leftY += 45;
        } catch (error) {
          doc.fontSize(9).font('NotoSansCJK').text('서명 이미지', leftColumn, leftY);
          leftY += 20;
        }
      } else {
        doc.fontSize(9).font('NotoSansCJK').text('서명 이미지', leftColumn, leftY);
        leftY += 20;
      }

      // RIGHT COLUMN: 현장 책임자
      doc.fontSize(11)
         .font('NotoSansCJK-Bold')
         .text('현장 책임자: ', rightColumn, sigStartY, { continued: true })
         .font('NotoSansCJK')
         .text(report.fieldStaff || '');
      
      let rightY = sigStartY + 20;
      if (lastFieldSig) {
        try {
          const fieldSigBuffer = Buffer.from(lastFieldSig.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(fieldSigBuffer, rightColumn, rightY, { width: 100, height: 40 });
          rightY += 45;
        } catch (error) {
          doc.fontSize(9).font('NotoSansCJK').text('서명 이미지', rightColumn, rightY);
          rightY += 20;
        }
      } else {
        doc.fontSize(9).font('NotoSansCJK').text('서명 이미지', rightColumn, rightY);
        rightY += 20;
      }

      // Move down to next row
      const nextRowY = Math.max(leftY, rightY) + 20;
      doc.y = nextRowY;

      // SECOND ROW: 사무실 책임자 (LEFT) and 출력일시 (RIGHT)
      doc.fontSize(11)
         .font('NotoSansCJK-Bold')
         .text('사무실 책임자: ', leftColumn, doc.y, { continued: true })
         .font('NotoSansCJK')
         .text(report.officeStaff || '');
      
      const officeY = doc.y;
      
      doc.fontSize(11)
         .font('NotoSansCJK-Bold')
         .text('출력일시:', rightColumn, officeY);
      doc.fontSize(10)
         .font('NotoSansCJK')
         .text(dateStr, rightColumn, officeY + 15);

      leftY = officeY + 20;
      if (lastOfficeSig) {
        try {
          const officeSigBuffer = Buffer.from(lastOfficeSig.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(officeSigBuffer, leftColumn, leftY, { width: 100, height: 40 });
        } catch (error) {
          doc.fontSize(9).font('NotoSansCJK').text('서명 이미지', leftColumn, leftY);
        }
      } else {
        doc.fontSize(9).font('NotoSansCJK').text('서명 이미지', leftColumn, leftY);
      }

      // === ADD HEADER/FOOTER TO ALL PAGES ===
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        
        const pageHeight = doc.page.height;
        const pageWidth = doc.page.width;
        
        // HEADER
        doc.fontSize(16)
           .font('NotoSansCJK-Bold')
           .text('(株)天 一 國 際 物 流', 0, 30, { align: 'center', width: pageWidth });
        
        doc.fontSize(10)
           .font('NotoSansCJK')
           .text('수입에서 통관하여 배송까지 천일국제물류에서 책임집니다', 0, 55, { align: 'center', width: pageWidth });
        
        doc.fontSize(9)
           .text('경기도 평택시 포승읍 평택항로 95', 0, 72, { align: 'center', width: pageWidth });
        
        doc.fontSize(9)
           .text('TEL: 031-683-7040 | FAX: 031-683-7044', 0, 86, { align: 'center', width: pageWidth });
        
        doc.fontSize(9)
           .fillColor('#0000FF')
           .text('www.chunilkor.co.kr', 0, 100, { 
             align: 'center', 
             width: pageWidth, 
             link: 'http://www.chunilkor.co.kr',
             underline: true
           })
           .fillColor('#000000');
        
        // Header line
        doc.moveTo(50, 120)
           .lineTo(pageWidth - 50, 120)
           .stroke();
        
        // FOOTER
        const footerY = pageHeight - 60;
        doc.moveTo(50, footerY)
           .lineTo(pageWidth - 50, footerY)
           .stroke();
        
        doc.fontSize(8)
           .font('NotoSansCJK')
           .text('본 확인서는 당사 천일국제물류에서 발행한 비 공식 문서이며, 단지 확인용으로 사용합니다.', 
                 0, footerY + 10, { align: 'center', width: pageWidth });
      }

      // Finalize PDF
      doc.end();
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ error: "파일 다운로드 실패" });
    }
  });

  // ================ AUTH ROUTES ================
  
  // Driver login
  app.post("/api/auth/driver-login", async (req, res) => {
    try {
      const { vehicleNo, password } = req.body;
      
      const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.vehicleNo, vehicleNo));
      
      if (!vehicle) {
        return res.status(401).json({ error: "차량을 찾을 수 없습니다" });
      }
      
      const passwordWithoutHyphen = vehicle.phone.replace(/-/g, '');
      if (password !== passwordWithoutHyphen) {
        return res.status(401).json({ error: "비밀번호가 일치하지 않습니다" });
      }
      
      res.json({
        role: 'driver',
        vehicleNo: vehicle.vehicleNo,
        driverName: vehicle.driverName,
        phone: vehicle.phone
      });
    } catch (error) {
      console.error('Driver login error:', error);
      res.status(500).json({ error: "로그인 실패" });
    }
  });

  // Field staff login
  app.post("/api/auth/field-login", async (req, res) => {
    try {
      const { name, password } = req.body;
      
      const [staff] = await db.select().from(fieldStaff).where(eq(fieldStaff.name, name));
      
      if (!staff) {
        return res.status(401).json({ error: "담당자를 찾을 수 없습니다" });
      }
      
      const passwordWithoutHyphen = staff.phone.replace(/-/g, '');
      if (password !== passwordWithoutHyphen) {
        return res.status(401).json({ error: "비밀번호가 일치하지 않습니다" });
      }
      
      res.json({
        role: 'field',
        name: staff.name,
        phone: staff.phone
      });
    } catch (error) {
      console.error('Field login error:', error);
      res.status(500).json({ error: "로그인 실패" });
    }
  });

  // Office staff login
  app.post("/api/auth/office-login", async (req, res) => {
    try {
      const { name, password } = req.body;
      
      const [staff] = await db.select().from(officeStaff).where(eq(officeStaff.name, name));
      
      if (!staff) {
        return res.status(401).json({ error: "담당자를 찾을 수 없습니다" });
      }
      
      const passwordWithoutHyphen = staff.phone.replace(/-/g, '');
      if (password !== passwordWithoutHyphen) {
        return res.status(401).json({ error: "비밀번호가 일치하지 않습니다" });
      }
      
      res.json({
        role: 'office',
        name: staff.name,
        phone: staff.phone
      });
    } catch (error) {
      console.error('Office login error:', error);
      res.status(500).json({ error: "로그인 실패" });
    }
  });

  // Admin staff login
  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const { name, password } = req.body;
      
      const [staff] = await db.select().from(adminStaff).where(eq(adminStaff.name, name));
      
      if (!staff) {
        return res.status(401).json({ error: "관리자를 찾을 수 없습니다" });
      }
      
      const passwordWithoutHyphen = staff.phone.replace(/-/g, '');
      if (password !== passwordWithoutHyphen) {
        return res.status(401).json({ error: "비밀번호가 일치하지 않습니다" });
      }
      
      res.json({
        role: 'admin',
        name: staff.name,
        phone: staff.phone
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: "로그인 실패" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
