// 사용자 데이터 추가 스크립트
// 실행: npm run add-users

import "dotenv/config";
import { db } from "../server/db.js";
import { fieldStaff, officeStaff, adminStaff } from "../shared/schema.js";
import { sql } from "drizzle-orm";

async function addUsers() {
  try {
    console.log("사용자 데이터 추가 시작...\n");

    // 데이터베이스 연결 확인
    try {
      await db.execute(sql`SELECT 1`);
      console.log("✅ 데이터베이스 연결 성공\n");
    } catch (error: any) {
      console.error("❌ 데이터베이스 연결 실패:", error.message);
      if (error.message?.includes('does not exist')) {
        console.error("\n💡 해결 방법: npm run db:push를 먼저 실행하여 테이블을 생성하세요.");
      }
      process.exit(1);
    }

    // Field Staff 추가
    const fieldStaffData = [
      { name: "테스트담당자", phone: "010-1234-5678" },
      // 추가할 Field Staff를 여기에 추가하세요
    ];

    for (const staff of fieldStaffData) {
      try {
        await db.insert(fieldStaff).values(staff).onConflictDoNothing();
        console.log(`✅ Field Staff 추가: ${staff.name} (${staff.phone})`);
      } catch (error: any) {
        if (error.message?.includes('does not exist')) {
          console.error(`❌ 테이블이 없습니다. db:push를 먼저 실행하세요.`);
          process.exit(1);
        }
        console.log(`⚠️ Field Staff 추가 실패: ${staff.name} - ${error.message}`);
      }
    }

    // Office Staff 추가
    const officeStaffData = [
      { name: "테스트담당자", phone: "010-1234-5678" },
      // 추가할 Office Staff를 여기에 추가하세요
    ];

    for (const staff of officeStaffData) {
      try {
        await db.insert(officeStaff).values(staff).onConflictDoNothing();
        console.log(`✅ Office Staff 추가: ${staff.name} (${staff.phone})`);
      } catch (error: any) {
        if (error.message?.includes('does not exist')) {
          console.error(`❌ 테이블이 없습니다. db:push를 먼저 실행하세요.`);
          process.exit(1);
        }
        console.log(`⚠️ Office Staff 추가 실패: ${staff.name} - ${error.message}`);
      }
    }

    // Admin Staff 추가
    const adminStaffData = [
      { name: "관리자", phone: "010-1234-5678" },
      // 추가할 Admin Staff를 여기에 추가하세요
    ];

    for (const staff of adminStaffData) {
      try {
        await db.insert(adminStaff).values(staff).onConflictDoNothing();
        console.log(`✅ Admin Staff 추가: ${staff.name} (${staff.phone})`);
      } catch (error: any) {
        if (error.message?.includes('does not exist')) {
          console.error(`❌ 테이블이 없습니다. db:push를 먼저 실행하세요.`);
          process.exit(1);
        }
        console.log(`⚠️ Admin Staff 추가 실패: ${staff.name} - ${error.message}`);
      }
    }

    console.log("\n✅ 사용자 데이터 추가 완료!");
    console.log("\n📋 로그인 정보:");
    console.log("Field Staff: 이름='테스트담당자', 비밀번호='01012345678', 보안코드='93848869'");
    console.log("Office Staff: 이름='테스트담당자', 비밀번호='01012345678', 보안코드='23485759'");
    console.log("Admin: 이름='관리자', 비밀번호='01012345678', 보안코드='13848966'");
    console.log("\n⚠️ 실제 사용할 이름과 전화번호로 변경하세요!");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ 오류 발생:", error);
    if (error.message?.includes('does not exist')) {
      console.error("\n💡 해결 방법: npm run db:push를 먼저 실행하여 테이블을 생성하세요.");
    }
    process.exit(1);
  }
}

addUsers();

