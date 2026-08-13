"use client";

import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import PaginationControls from "@/components/PaginationControls";
import { CATALOG_PAGE_SIZE } from "@/constants/catalog";
import { useDrugLetters, useDrugList, useDrugSearch } from "@/queries/interactions";
import DrugCatalogList from "./DrugCatalogList";
import DrugCatalogSearchBar from "./DrugCatalogSearchBar";
import DrugLetterFilter from "./DrugLetterFilter";

const DEBOUNCE_MS = 400;
/** Trần của `limit` ở `GET /api/v1/drugs/search`, xem `backend/src/medsafe/api/v1/drugs.py`. */
const SEARCH_LIMIT = 20;

/**
 * Phần tương tác của trang "Tra cứu thuốc". Có ĐÚNG HAI chế độ loại trừ nhau:
 *
 * - **Duyệt** (ô tìm kiếm rỗng): `GET /drugs` — lọc theo chữ cái, phân trang đầy đủ.
 * - **Tìm kiếm** (có từ khoá): `GET /drugs/search` — xếp hạng theo tên biệt dược.
 *
 * Hai endpoint chứ không phải một, vì `q` của `/drugs` là khớp chuỗi con thô: gõ "H" sẽ
 * trả về mọi thuốc có chữ "h" ở bất kỳ đâu. `/drugs/search` xếp tiền tố tên biệt dược lên
 * đầu nên gõ "H" ra đúng thuốc vần H — đúng thứ người dùng chờ đợi ở một ô tìm tên thuốc.
 *
 * Đổi lại, kết quả tìm kiếm bị chặn ở 20 dòng và không phân trang; component nói rõ điều
 * đó ra màn hình thay vì im lặng cắt bớt.
 */
export default function DrugCatalogBrowser() {
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [letter, setLetter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  // Chỉ có ý nghĩa khi đang tìm kiếm: người dùng đã bấm "Hiện" để lấy lại thanh chữ cái.
  const [alphabetRevealed, setAlphabetRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(inputValue.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const isSearching = searchTerm.length > 0;
  const isTyping = inputValue.trim() !== searchTerm;
  const showAlphabet = !isSearching || alphabetRevealed;

  const lettersQuery = useDrugLetters();
  const listQuery = useDrugList(
    { letter: letter ?? undefined, page, pageSize: CATALOG_PAGE_SIZE },
    !isSearching
  );
  const searchQuery = useDrugSearch(searchTerm, isSearching, SEARCH_LIMIT);

  const changeInput = (value: string) => {
    setInputValue(value);
    // Gõ tìm kiếm thì bỏ vần đang chọn: hai bộ lọc cùng lúc sẽ khiến người dùng không
    // biết danh sách đang theo cái nào.
    setLetter(null);
    setPage(1);
    setAlphabetRevealed(false);
  };

  const clearSearch = () => {
    setInputValue("");
    // Xoá luôn `searchTerm` thay vì chờ debounce: nếu chờ, thanh chữ cái còn ẩn thêm
    // 400ms sau khi ô nhập đã trống, nhìn như bị treo.
    setSearchTerm("");
    setPage(1);
    setAlphabetRevealed(false);
  };

  /** Bấm một chữ cái LUÔN thắng ô tìm kiếm — xoá từ khoá rồi lọc theo vần. */
  const selectLetter = (next: string | null) => {
    setInputValue("");
    setSearchTerm("");
    setLetter(next);
    setPage(1);
    setAlphabetRevealed(false);
  };

  const list = listQuery.data;
  const rows: IDrugCatalogRow[] = isSearching
    ? (searchQuery.data?.candidates ?? []).map((candidate) => ({
        id: candidate.drugId,
        brandName: candidate.brandName,
        ingredient: candidate.ingredient,
      }))
    : (list?.items ?? []);

  const activeQuery = isSearching ? searchQuery : listQuery;
  const isLoading = activeQuery.isLoading || (isSearching && isTyping);
  const total = isSearching ? rows.length : (list?.total ?? 0);
  const isCapped = isSearching && rows.length === SEARCH_LIMIT;

  const errorMessage = activeQuery.isError
    ? activeQuery.error instanceof Error
      ? activeQuery.error.message
      : "Không thể tải danh mục thuốc."
    : null;

  const resultLabel = () => {
    if (isLoading) return "Đang tải…";
    if (isSearching) {
      return isCapped
        ? `Hiển thị ${SEARCH_LIMIT} kết quả phù hợp nhất cho “${searchTerm}”`
        : `${total} kết quả cho “${searchTerm}”`;
    }
    const suffix = list && list.totalPages > 1 ? ` · trang ${list.page}/${list.totalPages}` : "";
    return `${total.toLocaleString("vi-VN")} kết quả${suffix}`;
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <DrugCatalogSearchBar
          value={inputValue}
          onChange={changeInput}
          onClear={clearSearch}
          status={
            isSearching
              ? "Đang lọc danh sách bên dưới theo từ khoá này."
              : "Gõ từ một ký tự để tìm theo tên biệt dược hoặc hoạt chất."
          }
        />
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Danh sách thuốc</h2>
          <p className="text-sm text-foreground-secondary">
            {lettersQuery.data
              ? `${lettersQuery.data.total.toLocaleString("vi-VN")} thuốc trong danh mục bệnh viện.`
              : "Đang tải danh mục bệnh viện…"}
          </p>
        </div>

        {/* Nút bật/tắt chỉ xuất hiện khi đang tìm kiếm — lúc duyệt bình thường thanh chữ
            cái là cách điều hướng chính nên không cho phép giấu nó đi. */}
        {isSearching ? (
          <button
            type="button"
            onClick={() => setAlphabetRevealed((shown) => !shown)}
            aria-expanded={showAlphabet}
            aria-controls="danh-sach-chu-cai"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground-secondary transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showAlphabet ? (
              <>
                Ẩn <ChevronUp className="h-4 w-4" aria-hidden />
              </>
            ) : (
              <>
                Hiện <ChevronDown className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
        ) : null}

        <div id="danh-sach-chu-cai" hidden={!showAlphabet}>
          {lettersQuery.isError ? (
            <p role="alert" className="flex items-center gap-2 text-sm text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              {lettersQuery.error instanceof Error
                ? lettersQuery.error.message
                : "Không thể tải chỉ mục chữ cái."}
            </p>
          ) : (
            <DrugLetterFilter
              letters={lettersQuery.data?.letters ?? []}
              // Đang tìm kiếm thì không nút nào sáng — danh sách do ô tìm kiếm điều khiển.
              selected={isSearching ? undefined : letter}
              onSelect={selectLetter}
              isLoading={lettersQuery.isLoading}
            />
          )}
        </div>

        {errorMessage ? (
          <p role="alert" className="flex items-center gap-2 text-sm text-error">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            {errorMessage}
          </p>
        ) : (
          <>
            <p className="text-sm text-foreground-secondary" role="status" aria-live="polite">
              {resultLabel()}
            </p>

            <DrugCatalogList
              items={rows}
              isLoading={isLoading}
              isFetching={activeQuery.isFetching}
              emptyTitle={isSearching ? "Không tìm thấy thuốc nào" : "Không có thuốc nào khớp"}
              emptyDescription={
                isSearching
                  ? `Danh mục bệnh viện không có thuốc nào khớp “${searchTerm}”. Kiểm tra lại chính tả — hệ thống không suy đoán thuốc gần giống.`
                  : "Vần này chưa có thuốc nào trong danh mục bệnh viện."
              }
            />

            {isSearching ? (
              isCapped ? (
                <p className="text-xs text-foreground-muted">
                  Còn thuốc khác khớp từ khoá này. Gõ thêm ký tự để thu hẹp kết quả.
                </p>
              ) : null
            ) : (
              <PaginationControls
                page={list?.page ?? 1}
                totalPages={list?.totalPages ?? 0}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}
