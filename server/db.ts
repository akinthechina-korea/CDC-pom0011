import "dotenv/config";
import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL 환경 변수가 설정되지 않았습니다!");
  console.error("Render 대시보드에서 다음을 확인하세요:");
  console.error("1. PostgreSQL 데이터베이스 서비스가 생성되어 있는지");
  console.error("2. Web 서비스에 DATABASE_URL 환경 변수가 연결되어 있는지");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// DATABASE_URL 파싱 및 로깅 (보안을 위해 일부만)
const dbUrlParts = process.env.DATABASE_URL.split('@');
if (dbUrlParts.length === 2) {
  const hostPart = dbUrlParts[1].split('/')[0];
  console.log(`📊 데이터베이스 연결 정보: ...@${hostPart}`);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 연결 테스트
pool.on('connect', () => {
  console.log('✅ PostgreSQL 데이터베이스 연결 성공');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 연결 오류:', err.message);
});
export const db = drizzle(pool, { schema });
