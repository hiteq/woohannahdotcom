#!/usr/bin/env python3
import os
import re
from pathlib import Path

def process_image_captions(file_path):
    """이미지 바로 아래의 일반 텍스트 캡션을 *로 감싸서 이탤릭 처리"""
    print(f"처리 중: {file_path}")

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
            # 다음 줄들을 확인
            j = i + 1
            found_caption = False

            while j < len(lines):
                next_line = lines[j].strip()

                # 빈 줄이면 계속 진행
                if next_line == '':
                    j += 1
                    continue

                # 다음 이미지 링크를 만나면 중단
                if re.match(r'^!\[\[.*\]\]$', next_line):
                    break

                # 일반 텍스트이고, 이미 *로 감싸져 있지 않으면
                if next_line and not next_line.startswith('*') and not next_line.startswith('!') and not next_line.startswith('[') and not next_line.startswith('#'):
                    # 이미 처리된 줄들을 추가
                    for k in range(i + 1, j):
                        processed_lines.append(lines[k])

                    # 캡션 줄을 *로 감싸기
                    processed_lines.append(f"*{next_line}*")
                    found_caption = True

                    # 다음 빈 줄들도 추가
                    j += 1
                    while j < len(lines) and lines[j].strip() == '':
                        processed_lines.append(lines[j])
                        j += 1

                    break
                else:
                    break

            if found_caption:
                i = j - 1  # 다음 처리할 줄로 이동
            else:
                i += 1
        else:
            i += 1

    # 파일 쓰기
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(processed_lines))

    print(f"완료: {file_path}")

def find_and_process_files():
    """content 폴더에서 모든 .md 파일을 찾아서 처리"""
    content_dir = Path('content')

    if not content_dir.exists():
        print("content 폴더를 찾을 수 없습니다.")
        return

    md_files = list(content_dir.rglob('*.md'))
    print(f"총 {len(md_files)}개의 .md 파일을 찾았습니다.")

    processed_count = 0

    for md_file in md_files:
        try:
            # 파일 내용 확인
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # 이미지 링크가 있는지 확인
            if '! [[' in content or '![[' in content:
                print(f"\n이미지 파일 발견: {md_file}")
                process_image_captions(md_file)
                processed_count += 1

        except Exception as e:
            print(f"오류 발생 ({md_file}): {e}")

    print(f"\n총 {processed_count}개의 파일을 처리했습니다.")

if __name__ == "__main__":
    find_and_process_files()
