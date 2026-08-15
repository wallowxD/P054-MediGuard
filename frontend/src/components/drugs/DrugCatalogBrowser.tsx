"use client";

import { AlertTriangle, ChevronDown, ChevronUp, Pill, Sparkles } from "lucide-react";
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

  return (
    <div className="space-y-6">
      {/* Search & Letter Filter Container */}
      <section className="rounded-3xl liquid-glass p-5 sm:p-7 shadow-lg space-y-6">
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

        {/* Alphabet Filter Bar */}
        {showAlphabet ? (
          <div className="space-y-2 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
                Lọc theo bảng chữ cái A–Z
              </span>
              {isSearching ? (
                <button
                  type="button"
                  onClick={() => setAlphabetRevealed(false)}
                  className="flex items-center gap-1 text-xs text-primary hover:opacity-80"
                >
                  <span>Thu gọn bảng chữ cái</span>
                  <ChevronUp className="h-3.5 w-3.5" />
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
          <div className="border-t border-border/60 pt-3">
            <button
              type="button"
              onClick={() => setAlphabetRevealed(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80"
            >
              <ChevronDown className="h-4 w-4" />
              <span>Hiện bảng chữ cái A–Z</span>
            </button>
          </div>
        ) : null}
      </section>

      {/* Catalog List View */}
      <section className="rounded-3xl liquid-glass p-5 sm:p-7 shadow-lg space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Pill className="h-4.5 w-4.5 text-primary" />
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
              {isSearching
                ? `Kết quả tìm kiếm (${total})`
                : letter
                  ? `Danh mục thuốc vần ${letter} (${total})`
                  : `Tất cả thuốc (${total})`}
            </h2>
          </div>
        </div>

        {activeQuery.isError ? (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-error/30 bg-error/5 p-4 text-xs text-foreground-secondary">
            <AlertTriangle className="h-5 w-5 shrink-0 text-error" />
            <div>
              <p className="font-bold text-foreground">Không thể tải danh mục thuốc</p>
              <p className="mt-0.5">{activeQuery.error instanceof Error ? activeQuery.error.message : "Vui lòng thử lại."}</p>
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
          <div className="pt-4 border-t border-border/60 flex justify-center">
            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
