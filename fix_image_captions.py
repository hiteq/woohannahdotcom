#!/usr/bin/env python3
import os
import re
from pathlib import Path

def fix_image_captions(file_path):
    """이미지 바로 아래의 일반 텍스트를 *로 감싸서 이탤릭 처리 (더 정확한 버전)"""
    print(f"수정 중: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    processed_lines = []
    i = 0

    while i < len(lines):
        line = lines[i]
        processed_lines.append(line)

        # 이미지 링크를 찾았을 때
        if re.match(r'^!\[\[.*\]\]$', line.strip()):
            # 바로 다음 줄이 비어있지 않고, 일반 텍스트이고, 이미 *로 감싸져 있지 않으면
            if (i + 1 < len(lines) and
                lines[i + 1].strip() and
                not lines[i + 1].strip().startswith('*') and
                not lines[i + 1].strip().startswith('!') and
                not lines[i + 1].strip().startswith('[') and
                not lines[i + 1].strip().startswith('#') and
                not lines[i + 1].strip().startswith('**') and
                len(lines[i + 1].strip()) > 10):  # 최소 길이 체크

                caption_line = lines[i + 1].strip()

                # 기존 줄을 *로 감싸서 추가
                processed_lines.append(f"*{caption_line}*")

                # 원본 줄은 건너뛰기
                i += 1

        i += 1

    # 파일 쓰기
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(processed_lines))

    print(f"완료: {file_path}")

def find_and_fix_files():
    """content 폴더에서 이미지 파일이 있는 .md 파일들을 찾아서 수정"""
    content_dir = Path('content')

    if not content_dir.exists():
        print("content 폴더를 찾을 수 없습니다.")
        return

    md_files = list(content_dir.rglob('*.md'))
    print(f"총 {len(md_files)}개의 .md 파일을 찾았습니다.")

    fixed_count = 0

    for md_file in md_files:
        try:
            # 파일 내용 확인
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # 이미지 링크가 있는지 확인
            if '! [[' in content or '![[' in content:
                print(f"\n이미지 파일 발견: {md_file}")

                # 백업 생성
                backup_file = str(md_file) + '.backup'
                if not os.path.exists(backup_file):
                    with open(backup_file, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"백업 생성: {backup_file}")

                fix_image_captions(md_file)
                fixed_count += 1

        except Exception as e:
            print(f"오류 발생 ({md_file}): {e}")

    print(f"\n총 {fixed_count}개의 파일을 수정했습니다.")

if __name__ == "__main__":
    find_and_fix_files()
