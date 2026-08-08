/**
 * Nạp biến môi trường của frontend từ `.env` ở REPO ROOT vào `process.env`.
 *
 * Vì sao cần file này: Next.js chỉ đọc file env nằm trong thư mục project của nó
 * (`frontend/.env*`) và KHÔNG BAO GIỜ nhìn lên repo root. Nhưng dự án chủ ý dùng
 * một file `.env` duy nhất ở root (xem `.env.example`), nên phải có cầu nối.
 *
 * Chỉ chạy khi build/dev TRỰC TIẾP trên máy (`make dev`, `make web`, `make web-build`).
 * Trong Docker, build context là `./frontend` nên không có `../.env`; giá trị đi vào
 * qua `build.args` của docker-compose. Thiếu file thì hàm này im lặng bỏ qua.
 *
 * Hai quy tắc an toàn:
 *   1. CHỈ nạp key có tiền tố trong ALLOWED_PREFIXES. Secret backend (OPENAI_API_KEY,
 *      DATABASE_URL, JWT_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY...) nằm cùng file
 *      nhưng không bao giờ lọt vào process của Next.
 *   2. KHÔNG ghi đè biến đã có sẵn trong process.env. Biến truyền từ shell hoặc từ
 *      Docker ARG luôn thắng file.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Tiền tố được phép nạp.
 * - `NEXT_PUBLIC_`: nhúng cứng vào bundle, browser đọc được — không được là secret.
 * - `NEXTAUTH_`: secret phía server của next-auth, chỉ tồn tại trong Node process.
 */
const ALLOWED_PREFIXES = ["NEXT_PUBLIC_", "NEXTAUTH_"] as const;

/** File chỉ có ở repo root, dùng để nhận diện đã đi lên đúng thư mục. */
const ROOT_MARKER = "pyproject.toml";

/** Số cấp tối đa đi ngược lên tìm root. `frontend/` chỉ cách root 1 cấp. */
const MAX_DEPTH = 3;

/** Tìm repo root bằng cách đi ngược từ cwd cho tới khi thấy ROOT_MARKER. */
function findRepoRoot(): string | null {
  let dir = process.cwd();
  for (let i = 0; i <= MAX_DEPTH; i++) {
    if (existsSync(join(dir, ROOT_MARKER))) return dir;
    const parent = resolve(dir, "..");
    if (parent === dir) break; // đã tới "/"
    dir = parent;
  }
  return null;
}

/**
 * Parse cú pháp dotenv ở mức tối thiểu mà file `.env` của dự án đang dùng.
 * Cố tình không hỗ trợ nội suy `${VAR}` hay giá trị nhiều dòng — không có nhu cầu,
 * và một parser nhỏ dễ kiểm chứng hơn là thêm một dependency.
 */
function parseEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    // Tách ở dấu `=` ĐẦU TIÊN. NEXTAUTH_SECRET là base64 nên bản thân giá trị
    // có thể chứa `=` ở cuối; split("=") sẽ cắt cụt nó.
    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).replace(/^export\s+/, "").trim();
    let value = line.slice(eq + 1).trim();

    // Bỏ cặp nháy bao ngoài nếu có.
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }

    if (key) out[key] = value;
  }

  return out;
}

export function loadRootEnv(): void {
  // Next.js đã tự đọc `frontend/.env*` TRƯỚC khi next.config.ts chạy. Nếu file đó
  // tồn tại, giá trị của nó đã nằm trong process.env và quy tắc "không ghi đè" bên
  // dưới sẽ giữ nguyên nó — tức root .env bị vô hiệu hoá một cách âm thầm.
  // Cảnh báo to để không ai mất buổi chiều đi tìm.
  for (const stray of [".env", ".env.local", ".env.development.local", ".env.production.local"]) {
    if (existsSync(join(process.cwd(), stray))) {
      console.warn(
        `⚠️  Tồn tại frontend/${stray}. Dự án dùng .env DUY NHẤT ở repo root — ` +
          `file này sẽ ghi đè và làm root .env vô tác dụng. Hãy xoá nó.`,
      );
    }
  }

  const root = findRepoRoot();
  if (!root) return; // build trong Docker: không có repo root, giá trị đến từ ARG

  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;

  const parsed = parseEnv(readFileSync(envPath, "utf-8"));

  for (const [key, value] of Object.entries(parsed)) {
    if (!ALLOWED_PREFIXES.some((p) => key.startsWith(p))) continue;
    if (process.env[key] !== undefined) continue; // shell/Docker ARG thắng
    process.env[key] = value;
  }
}

loadRootEnv();
