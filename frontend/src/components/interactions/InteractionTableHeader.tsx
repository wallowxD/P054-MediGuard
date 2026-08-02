export default function InteractionTableHeader() {
  return (
    <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-muted">
      <tr>
        <th scope="col" className="px-3 py-2 font-medium">
          Cặp tương tác
        </th>
        <th scope="col" className="px-3 py-2 font-medium">
          Loại
        </th>
        <th scope="col" className="px-3 py-2 font-medium">
          Mức độ
        </th>
        <th scope="col" className="px-3 py-2 font-medium">
          Trạng thái duyệt
        </th>
        <th scope="col" className="px-3 py-2 font-medium">
          Nguồn
        </th>
      </tr>
    </thead>
  );
}
