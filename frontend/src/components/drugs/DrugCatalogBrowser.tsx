"use client";

import { AlertTriangle, ChevronDown, ChevronUp, Pill, Search } from "lucide-react";
import { useEffect, useState } from "react";
import PaginationControls from "@/components/PaginationControls";
import { CATALOG_PAGE_SIZE } from "@/constants/catalog";
import { useDrugLetters, useDrugList, useDrugSearch } from "@/queries/interactions";
import DrugCatalogList from "./DrugCatalogList";
import DrugCatalogSearchBar from "./DrugCatalogSearchBar";
import DrugLetterFilter from "./DrugLetterFilter";

const DEBOUNCE_MS = 350;
const SEARCH_LIMIT = 20;

export default function DrugCatalogBrowser() {
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [letter, setLetter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
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
    setLetter(null);
    setPage(1);
    setAlphabetRevealed(false);
  };

  const clearInput = () => {
    setInputValue("");
    setSearchTerm("");
    setPage(1);
    setAlphabetRevealed(false);
  };

  const selectLetter = (nextLetter: string | null) => {
    setLetter(nextLetter);
    setPage(1);
    setInputValue("");
    setSearchTerm("");
    setAlphabetRevealed(false);
  };

  const activeQuery = isSearching ? searchQuery : listQuery;
  const rawItems = isSearching
    ? searchQuery.data?.candidates.map((c) => ({
        id: c.drugId,
        brandName: c.brandName,
        ingredient: c.ingredient,
        atcCode: null,
        registrationNumber: null,
      })) ?? []
    : listQuery.data?.items ?? [];

  const total = isSearching
    ? searchQuery.data?.candidates.length ?? 0
    : listQuery.data?.total ?? 0;

  const totalPages = isSearching ? 1 : Math.ceil(total / CATALOG_PAGE_SIZE);
  const resultHeading = isSearching
    ? "Kết quả tìm kiếm"
    : letter
      ? `Thuốc bắt đầu bằng ${letter}`
      : "Danh mục thuốc";

  return (
    <div className="space-y-5">
      <section
        className="overflow-hidden rounded-2xl border border-border/80 bg-background-elevated shadow-[0_16px_42px_rgba(30,64,110,0.07)] dark:shadow-[0_18px_44px_rgba(0,0,0,0.24)]"
        aria-labelledby="drug-catalog-search-title"
      >
        <header className="flex items-start gap-3 border-b border-border/70 px-5 pb-4 pt-5 sm:px-6 sm:pb-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Search className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden />
          </span>
          <div>
            <h2 id="drug-catalog-search-title" className="text-lg font-semibold text-foreground">
              Tìm thuốc trong danh mục
            </h2>
            <p className="mt-1 text-sm leading-6 text-foreground-secondary">
              Nhập tên thuốc, hoạt chất hoặc chọn chữ cái đầu để duyệt danh mục.
            </p>
          </div>
        </header>

        <div className="space-y-5 px-5 py-5 sm:px-6 sm:pb-6">
          <DrugCatalogSearchBar
            value={inputValue}
            onChange={changeInput}
            onClear={clearInput}
            status={
              isTyping
                ? "Đang cập nhật kết quả…"
                : isSearching
                  ? `Tìm thấy ${total} thuốc khớp “${searchTerm}”.`
                  : undefined
            }
          />

          {showAlphabet ? (
            <div className="space-y-3 border-t border-border/70 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Lọc theo bảng chữ cái</h3>
                  <p className="mt-0.5 text-xs text-foreground-muted">Chọn chữ cái đầu của tên biệt dược.</p>
                </div>
                {isSearching ? (
                  <button
                    type="button"
                    onClick={() => setAlphabetRevealed(false)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span>Thu gọn A–Z</span>
                    <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
                  </button>
                ) : null}
              </div>
              <DrugLetterFilter
                letters={lettersQuery.data?.letters ?? []}
                selected={isSearching ? undefined : letter}
                onSelect={selectLetter}
                isLoading={lettersQuery.isLoading}
              />
            </div>
          ) : isSearching ? (
            <div className="border-t border-border/70 pt-4">
              <button
                type="button"
                onClick={() => setAlphabetRevealed(true)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronDown className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                <span>Hiện bảng chữ cái A–Z</span>
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section
        className="overflow-hidden rounded-2xl border border-border/80 bg-background-elevated shadow-[0_14px_38px_rgba(30,64,110,0.055)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.2)]"
        aria-labelledby="drug-catalog-results-title"
      >
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface/60 text-primary">
              <Pill className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            </span>
            <div>
              <h2 id="drug-catalog-results-title" className="font-heading text-base font-semibold text-foreground">
                {resultHeading}
              </h2>
              <p className="mt-0.5 text-xs text-foreground-muted">
                Chọn một thuốc để xem thông tin chi tiết và tài liệu gốc.
              </p>
            </div>
          </div>
          <span className="rounded-lg bg-surface/60 px-2.5 py-1.5 text-xs font-semibold tabular-nums text-foreground-secondary">
            {total.toLocaleString("vi-VN")} thuốc
          </span>
        </header>

        <div className="p-5 sm:p-6">
          {activeQuery.isError ? (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-error/25 bg-error/5 p-4 text-xs text-foreground-secondary">
              <AlertTriangle className="h-5 w-5 shrink-0 text-error" strokeWidth={1.8} aria-hidden />
              <div>
                <p className="font-semibold text-foreground">Không thể tải danh mục thuốc</p>
                <p className="mt-0.5">
                  {activeQuery.error instanceof Error ? activeQuery.error.message : "Vui lòng thử lại."}
                </p>
              </div>
            </div>
          ) : (
            <DrugCatalogList
              items={rawItems}
              isLoading={activeQuery.isLoading || isTyping}
              emptyDescription={
                isSearching
                  ? `Không tìm thấy thuốc nào khớp “${searchTerm}”.`
                  : "Không có thuốc nào trong mục này."
              }
            />
          )}

          {!isSearching && totalPages > 1 ? (
            <div className="mt-5 flex justify-center border-t border-border/70 pt-5">
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
