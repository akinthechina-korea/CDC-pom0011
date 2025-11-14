// 런타임에 데이터베이스 초기화
import { pool } from "./db.js";
import { db } from "./db.js";
import { fieldStaff, officeStaff, adminStaff } from "@shared/schema.js";

let initPromise: Promise<void> | null = null;

export async function ensureDatabaseInitialized(): Promise<void> {
  // 이미 초기화 중이면 기다림
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      console.log("데이터베이스 초기화 확인 중...");

      // 테이블 존재 확인
      const checkTable = async (tableName: string): Promise<boolean> => {
        try {
          const result = await pool.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            );`,
            [tableName]
          );
          return result.rows[0]?.exists === true;
        } catch (error) {
          return false;
        }
      };

      const requiredTables = ['field_staff', 'office_staff', 'admin_staff', 'vehicles', 'cargo', 'reports'];
      
      // 모든 테이블 확인
      const tableChecks = await Promise.all(
        requiredTables.map(table => checkTable(table))
      );

      const missingTables = requiredTables.filter((_, idx) => !tableChecks[idx]);

      if (missingTables.length > 0) {
        console.log(`⚠️ 누락된 테이블 감지: ${missingTables.join(', ')}`);
        console.log("테이블 자동 생성 시도 중...");
        
        try {
          // 테이블 자동 생성
          await pool.query(`
            CREATE TABLE IF NOT EXISTS cargo (
              id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
              container_no TEXT NOT NULL UNIQUE,
              bl_no TEXT NOT NULL,
              date TEXT NOT NULL
            );
          `);

          await pool.query(`
            CREATE TABLE IF NOT EXISTS vehicles (
              id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
              vehicle_no TEXT NOT NULL UNIQUE,
              driver_name TEXT NOT NULL,
              driver_phone TEXT NOT NULL
            );
          `);

          await pool.query(`
            CREATE TABLE IF NOT EXISTS field_staff (
              id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
              name TEXT NOT NULL,
              phone TEXT NOT NULL UNIQUE
            );
          `);

          await pool.query(`
            CREATE TABLE IF NOT EXISTS office_staff (
              id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
              name TEXT NOT NULL,
              phone TEXT NOT NULL UNIQUE
            );
          `);

          await pool.query(`
            CREATE TABLE IF NOT EXISTS admin_staff (
              id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
              name TEXT NOT NULL,
              phone TEXT NOT NULL UNIQUE
            );
          `);

          await pool.query(`
            CREATE TABLE IF NOT EXISTS reports (
              id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
              report_date TEXT NOT NULL,
              container_no TEXT NOT NULL,
              bl_no TEXT NOT NULL,
              vehicle_no TEXT NOT NULL,
              driver_name TEXT NOT NULL,
              driver_phone TEXT NOT NULL,
              driver_damage TEXT NOT NULL,
              driver_signature TEXT NOT NULL,
              driver_submitted_at TIMESTAMP,
              damage_photos TEXT[] DEFAULT '{}',
              field_staff TEXT,
              field_phone TEXT,
              field_damage TEXT,
              field_signature TEXT,
              field_submitted_at TIMESTAMP,
              office_staff TEXT,
              office_phone TEXT,
              office_damage TEXT,
              office_signature TEXT,
              completed_at TIMESTAMP,
              status TEXT NOT NULL DEFAULT 'draft',
              rejection_reason TEXT,
              rejected_at TIMESTAMP,
              action_history JSONB DEFAULT '[]',
              created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
          `);

          console.log("✅ 모든 테이블이 생성되었습니다.");
        } catch (error: any) {
          console.error("❌ 테이블 생성 실패:", error.message);
          console.error("수동으로 실행: npm run db:push");
          throw error;
        }
      }

      console.log("✅ 모든 테이블이 존재합니다.");

      // 초기 사용자 데이터 확인 및 추가 (seed.ts의 실제 데이터 사용)
      const hasFieldStaff = (await db.select().from(fieldStaff).limit(1)).length > 0;
      const hasOfficeStaff = (await db.select().from(officeStaff).limit(1)).length > 0;
      const hasAdminStaff = (await db.select().from(adminStaff).limit(1)).length > 0;

      if (!hasFieldStaff || !hasOfficeStaff || !hasAdminStaff) {
        console.log("초기 사용자 데이터 추가 중...");

        // Field Staff 추가 (seed.ts의 실제 데이터)
        if (!hasFieldStaff) {
          try {
            await db.insert(fieldStaff).values([
              { name: '김도훈', phone: '010-2384-1156' },
              { name: '장지윤', phone: '010-5529-6681' },
              { name: '정현준', phone: '010-7132-2248' },
            ]).onConflictDoNothing();
            console.log("✅ Field Staff 추가됨: 김도훈, 장지윤, 정현준");
          } catch (error: any) {
            console.error("⚠️ Field Staff 추가 실패:", error.message);
          }
        }

        // Office Staff 추가 (seed.ts의 실제 데이터)
        if (!hasOfficeStaff) {
          try {
            await db.insert(officeStaff).values([
              { name: '이수진', phone: '010-4941-7742' },
              { name: '박지연', phone: '010-9321-4482' },
              { name: '김민하', phone: '010-844-9931' },
            ]).onConflictDoNothing();
            console.log("✅ Office Staff 추가됨: 이수진, 박지연, 김민하");
          } catch (error: any) {
            console.error("⚠️ Office Staff 추가 실패:", error.message);
          }
        }

        // Admin Staff 추가 (seed.ts의 실제 데이터)
        if (!hasAdminStaff) {
          try {
            await db.insert(adminStaff).values([
              { name: '천일요비', phone: '010-1111-1111' },
            ]).onConflictDoNothing();
            console.log("✅ Admin Staff 추가됨: 천일요비");
          } catch (error: any) {
            console.error("⚠️ Admin Staff 추가 실패:", error.message);
          }
        }
      } else {
        console.log("✅ 초기 사용자 데이터가 이미 존재합니다.");
      }

      console.log("✅ 데이터베이스 초기화 완료");
    } catch (error: any) {
      console.error("❌ 데이터베이스 초기화 중 오류:", error.message);
      // 초기화 실패해도 애플리케이션은 시작되도록 함
    }
  })();

  return initPromise;
}

