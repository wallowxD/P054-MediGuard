import SearchHistoryItem from "./SearchHistoryItem";

interface SearchHistoryListProps {
  items: IInteractionCheckSummaryItem[];
}

/** Danh sách lượt tra cứu ở `/history` — component chỉ nhận props typed, không tự fetch. */
export default function SearchHistoryList({ items }: SearchHistoryListProps) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <SearchHistoryItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
