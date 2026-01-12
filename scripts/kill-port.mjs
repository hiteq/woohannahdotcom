#!/usr/bin/env node
import { execSync } from 'child_process';

const port = process.argv[2] || '4321';

try {
  // 포트를 사용하는 프로세스 찾기 및 종료
  const output = execSync(`lsof -ti:${port}`, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  if (output) {
    const pids = output.split('\n').filter(Boolean);
    console.log(`포트 ${port}를 사용하는 프로세스(PID: ${pids.join(', ')}) 종료 중...`);
    for (const pid of pids) {
      try {
        execSync(`kill -9 ${pid}`, { stdio: 'pipe' });
      } catch (e) {
        // 프로세스가 이미 종료되었을 수 있음
      }
    }
    // 프로세스 종료 대기
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`포트 ${port} 해제 완료`);
  }
} catch (error) {
  // 포트를 사용하는 프로세스가 없으면 에러가 발생하지만 정상 동작
  // console.log(`포트 ${port}를 사용하는 프로세스 없음`);
}
