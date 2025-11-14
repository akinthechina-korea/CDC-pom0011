// 데이터베이스 초기화 스크립트
// 테이블 생성 및 초기 데이터 추가

import "dotenv/config";
import { db, pool } from "../server/db.js";
import { fieldStaff, officeStaff, adminStaff } from "../shared/schema.js";
import { sql } from "drizzle-orm";

async function initDb() {
  try {
    console.log("데이터베이스 초기화 시작...\n");

    // 테이블이 존재하는지 확인 (PostgreSQL) - pool을 직접 사용
    const checkTable = async (tableName: string) => {
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
        console.error(`테이블 확인 중 오류 (${tableName}):`, error);
        return false;
      }
    };

    // 필수 테이블 확인
    const tables = ['field_staff', 'office_staff', 'admin_staff', 'vehicles', 'cargo', 'reports'];
    const missingTables = [];

    for (const table of tables) {
      const exists = await checkTable(table);
      if (!exists) {
        missingTables.push(table);
        console.log(`⚠️ 테이블 '${table}'이(가) 없습니다.`);
      } else {
        console.log(`✅ 테이블 '${table}'이(가) 존재합니다.`);
      }
    }

    if (missingTables.length > 0) {
      console.log("\n⚠️ 일부 테이블이 없습니다. db:push를 먼저 실행해주세요.");
      console.log("실행 명령: npm run db:push\n");
      process.exit(1);
    }

    console.log("\n사용자 데이터 추가 중...\n");

    // Field Staff 추가
    const fieldStaffData = [
      { name: "테스트담당자", phone: "010-1234-5678" },
    ];

    for (const staff of fieldStaffData) {
      try {
        await db.insert(fieldStaff).values(staff).onConflictDoNothing();
        console.log(`✅ Field Staff 추가: ${staff.name} (${staff.phone})`);
      } catch (error: any) {
        console.log(`⚠️ Field Staff 추가 실패: ${staff.name} - ${error.message}`);
      }
    }

    // Office Staff 추가
    const officeStaffData = [
      { name: "테스트담당자", phone: "010-1234-5678" },
    ];

    for (const staff of officeStaffData) {
      try {
        await db.insert(officeStaff).values(staff).onConflictDoNothing();
        console.log(`✅ Office Staff 추가: ${staff.name} (${staff.phone})`);
      } catch (error: any) {
        console.log(`⚠️ Office Staff 추가 실패: ${staff.name} - ${error.message}`);
      }
    }

    // Admin Staff 추가
    const adminStaffData = [
      { name: "관리자", phone: "010-1234-5678" },
    ];

    for (const staff of adminStaffData) {
      try {
        await db.insert(adminStaff).values(staff).onConflictDoNothing();
        console.log(`✅ Admin Staff 추가: ${staff.name} (${staff.phone})`);
      } catch (error: any) {
        console.log(`⚠️ Admin Staff 추가 실패: ${staff.name} - ${error.message}`);
      }
    }

    console.log("\n✅ 데이터베이스 초기화 완료!");
    console.log("\n📋 로그인 정보:");
    console.log("Field Staff: 이름='테스트담당자', 비밀번호='01012345678', 보안코드='93848869'");
    console.log("Office Staff: 이름='테스트담당자', 비밀번호='01012345678', 보안코드='23485759'");
    console.log("Admin: 이름='관리자', 비밀번호='01012345678', 보안코드='13848966'");

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ 오류 발생:", error);
    if (error.message?.includes('does not exist')) {
      console.error("\n💡 해결 방법: npm run db:push를 먼저 실행하여 테이블을 생성하세요.");
    }
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

initDb();

