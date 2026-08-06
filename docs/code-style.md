# Quy ước code thống nhất cho toàn team

Tài liệu này quy định thư viện dùng cho từng mục đích và cách đặt tên để diff không thể hiện
người viết. Đây là convention hiện hành, không phải đề xuất mới. Lý do quyết định nằm trong
[ADR 0009](../adrs/0009-coding-conventions.md); cấu trúc backend/frontend nằm trong ADR 0001
và ADR 0007.

## Đặt tên

| Đối tượng | Convention | Ví dụ |
|---|---|---|
| Thư mục | `kebab-case` | `components/interactions/` |
| React component | `PascalCase.tsx` | `InteractionCard.tsx` |
| Header/provider | `dot.case.tsx` | `app.header.tsx`, `query.provider.tsx` |
| Config/util file | `kebab-case.ts` | `seo-config.ts` |
| Service function | `<verb><Noun>Request` | `checkInteractionsRequest` |
| Query hook | `use<Noun>` hoặc `use<Verb><Noun>` | `useInteractions` |
| Query key factory | `<domain>Keys` | `interactionKeys` |
| TypeScript interface | prefix `I` | `IInteractionItem` |
| Union type alias | prefix `T` | `TSeverity` |
| Constant | `SCREAMING_SNAKE_CASE` | `API_ENDPOINTS` |
| Python module | `snake_case.py` | `vector_store.py` |
| Python class | `PascalCase` | `VectorStore` |

Mỗi loại chỉ dùng một convention trên toàn repository.

## Frontend: công cụ cho từng trách nhiệm

| Nhu cầu | Dùng | Không dùng |
|---|---|---|
| API/server data | React Query hook trong `queries/*` | `useEffect` + `fetch`, hoặc component gọi service |
| HTTP call | `services/<domain>/index.ts` → `utils/request.ts` | Import `axios`/`fetch` nơi khác |
| Shared client state | Redux Toolkit slice trong `store/` | React Query hoặc prop drilling sâu |
| Local component state | `useState` | Redux slice |
| Form/validation | `react-hook-form` | Một `useState` cho từng field |
| Feedback sau action | `react-toastify` | `alert()` hoặc banner tự chế |
| Icon | `lucide-react` | Inline SVG hoặc icon pack khác |
| Style | Tailwind v4 utility + theme token | Inline style, CSS module, hardcoded hex |
| Màu | Theme token | `#0d9488`, `bg-teal-600` |

### Component luôn đi qua React Query

```ts
// ❌ Không gọi service trực tiếp trong component
import { getInteractionsRequest } from "@/services/interactions";
const data = await getInteractionsRequest(params);

// ✅ Dùng query hook
import { useInteractions } from "@/queries/interactions";
const { data, isLoading } = useInteractions(params);
```

React Query sở hữu server state; Redux chỉ sở hữu client state. Không copy API response vào
slice. Nếu nhiều nơi cần cùng dữ liệu, gọi cùng hook; React Query tự deduplicate.

### Query key có phân cấp

```ts
export const interactionKeys = {
  all: ["interactions"] as const,
  lists: () => [...interactionKeys.all, "list"] as const,
  list: (params) => [...interactionKeys.lists(), params] as const,
  details: () => [...interactionKeys.all, "detail"] as const,
  detail: (id) => [...interactionKeys.details(), id] as const,
};
```

Không viết raw query-key array inline; cấu trúc phân cấp cho phép invalidation đúng scope.

### Quy tắc frontend khác

- `components/<domain>/index.ts` re-export public component; import từ barrel.
- Page dài hơn khoảng 250 dòng phải tách child component hợp lý.
- Mock data đặt trong `*.mock.ts` cùng `// TODO: connect the API`, không inline array dài.
- Mặc định dùng Server Component; chỉ thêm `"use client"` khi cần hook/state/event.
- Trong Next.js 16, `params` là Promise: `const { id } = await params;`.
- Generated type `src/lib/api/types.gen.ts` không được sửa bằng tay.

## Backend: lớp cho từng trách nhiệm

| Nhu cầu | Đặt tại | Không được làm |
|---|---|---|
| Endpoint | `api/v1/` thin route | Business logic hoặc query trong route |
| Pure logic | `domain/` | Import FastAPI, SQLAlchemy hoặc provider SDK |
| Database access | `db/repositories/` | Query ở lớp khác |
| Prompt | `prompts/prompt_templates.py` | Inline f-string prompt trong node |
| Model/OCR call | `llm/llm_client.py` | Import provider SDK nơi khác |
| Tham số điều chỉnh | `config.yaml` | Magic number trong code |
| Request/response | `schemas/` dùng Pydantic v2 | Trả raw `dict` từ route |

### Quy tắc backend khác

- Public function bắt buộc có type hint.
- Không dùng bare `except:`; bắt exception cụ thể hoặc dùng central error handler.
- Mọi I/O trên request path là async.
- Dùng absolute import: `from medsafe.domain.severity import ...`.
- Pydantic v2 dùng `model_config`, không dùng `class Config`.
- ruff line length 120, rule `E,F,I,N,W,UP`; chạy `make check` trước khi push.

## Kiểm thử

- `backend/tests/unit/domain/` chạy không LLM, database hoặc network.
- Mock model/OCR qua fixture trong `conftest.py`; không gọi live provider trong test.
- `@pytest.mark.skip` phải có `reason=` cụ thể.
- Mọi thay đổi warning path cần regression test, đặc biệt wrong-pair case tại ADR 0012.

## Git và tài liệu

- Commit message bằng tiếng Anh theo Conventional Commits: `feat:`, `fix:`, `docs:`,
  `refactor:`, `chore:`.
- Một branch cho một Jira ticket, ví dụ `VMEC-16`.
- Thay đổi product behavior phải cập nhật `specs/` trong cùng pull request.
- Không commit `.env`; không dùng `git push --no-verify`.
- Tài liệu team sở hữu viết bằng tiếng Việt chuyên nghiệp; giữ identifier, command,
  library/API name bằng tiếng Anh.

## Chưa có quyết định

Không tự tạo convention cho các mục dưới đây. Tạo/link Jira decision ticket, để team thống
nhất rồi ghi ADR mới nếu quyết định khó đảo ngược.

| Chủ đề | Trạng thái |
|---|---|
| Frontend testing framework | Chưa cài framework, chưa có frontend test |
| Backend logging | Có `backend/logs/` nhưng chưa chốt logger hoặc format |
