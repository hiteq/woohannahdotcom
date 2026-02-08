/**
 * 빌드 타임에 외부 URL의 OG(Open Graph) 이미지를 가져오는 유틸리티
 */

/** YouTube URL에서 비디오 ID 추출 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

/** HTML 문자열에서 og:image 메타 태그의 content 값 추출 */
function extractOgImageFromHtml(html: string): string | null {
  // <meta property="og:image" content="..."> 패턴 (속성 순서 무관)
  const match =
    html.match(
      /<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    ) ||
    html.match(
      /<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    )
  return match?.[1] ?? null
}

/**
 * URL에서 OG 이미지 URL을 가져옴 (빌드 타임 전용)
 * - YouTube: 썸네일 URL을 직접 생성
 * - 기타: 페이지를 fetch 해서 og:image 메타 태그 파싱
 */
export async function fetchOgImage(url: string): Promise<string | null> {
  // YouTube 특별 처리 — 별도 fetch 불필요
  const ytId = extractYouTubeId(url)
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      console.log(`[og-image] HTTP ${res.status} for ${url}`)
      return null
    }

    const html = await res.text()
    const ogImage = extractOgImageFromHtml(html)

    if (!ogImage) {
      console.log(`[og-image] No og:image found for ${url}`)
      return null
    }

    // 상대 경로인 경우 절대 경로로 변환
    if (ogImage.startsWith("//")) return `https:${ogImage}`
    if (ogImage.startsWith("/")) {
      const base = new URL(url)
      return `${base.origin}${ogImage}`
    }

    return ogImage
  } catch (e) {
    console.log(`[og-image] Failed to fetch ${url}:`, e)
    return null
  }
}

/** HTML 콘텐츠에서 첫 번째 <a href="..."> URL 추출 */
export function extractFirstLink(html: string): string | null {
  const match = html.match(/href="(https?:\/\/[^"]+)"/)
  return match?.[1] ?? null
}
