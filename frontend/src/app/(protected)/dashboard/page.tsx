"use client";

import { AlertTriangle, Clock, Pill } from "lucide-react";
import StatCard from "@/components/cards/StatCard";

// TODO(API): số liệu thật lấy từ GET /api/v1/interactions khi backend sẵn sàng.
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-foreground">Tổng quan</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Thông tin tham khảo — không thay thế quyết định của bác sĩ.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Thuốc đang theo dõi" value="—" icon={<Pill className="h-4 w-4" />} />
        <StatCard
          label="Cảnh báo phát hiện"
          value="—"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          label="Chờ xác nhận chuyên môn"
          value="—"
          hint="Vẫn hiển thị đầy đủ cho người dùng"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}
