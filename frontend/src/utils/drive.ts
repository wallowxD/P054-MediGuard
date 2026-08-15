/**
 * Chuyển link Google Drive trong `dataset/drug_list_bv_gtvt.csv` thành link nhúng được.
 *
 * Link gốc dạng `/file/d/<id>/view` trả về trang Drive kèm `X-Frame-Options`, nên đặt
 * thẳng vào <iframe> sẽ ra khung trắng. Chỉ endpoint `/file/d/<id>/preview` mới cho nhúng.
 */

const DRIVE_HOSTS = new Set(["drive.google.com", "www.drive.google.com", "docs.google.com"]);

/** Bắt `<id>` trong `/file/d/<id>/...` hoặc `/d/<id>/...` */
const DRIVE_PATH_ID = /\/(?:file\/)?d\/([a-zA-Z0-9_-]+)/;

/** Lấy file id của một link Google Drive; trả `null` nếu không phải link Drive. */
export function getDriveFileId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!DRIVE_HOSTS.has(parsed.hostname)) return null;

  // Dạng `?id=<id>`: /open, /uc, /thumbnail
  const queryId = parsed.searchParams.get("id");
  if (queryId) return queryId;

  return DRIVE_PATH_ID.exec(parsed.pathname)?.[1] ?? null;
}

/**
 * Link `/preview` để nhúng vào <iframe>. Trả `null` khi không phải link Drive —
 * tầng gọi phải fallback về link "mở tài liệu gốc" thay vì nhúng đại một URL lạ.
 */
export function toDrivePreviewUrl(url: string): string | null {
  const fileId = getDriveFileId(url);
  return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;
}
