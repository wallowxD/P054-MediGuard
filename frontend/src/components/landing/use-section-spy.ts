"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Chiều cao card header nổi (h-16) cộng khoảng cách sticky (top-3/top-4) và một
 * chút thở. Dùng để bù offset khi cuộn tới section, nếu không tiêu đề section sẽ
 * nằm ngay dưới header.
 */
const HEADER_OFFSET = 88;

/**
 * Vạch đọc: chỉ section đang chiếm khoảng giữa viewport mới được coi là hiện hành.
 * Cắt 45% trên và 50% dưới để còn lại một dải mỏng quanh giữa màn hình.
 */
const READING_LINE = "-45% 0px -50% 0px";

/**
 * Vạch riêng cho section cuối: chỉ tính 70% trên của viewport.
 *
 * Trang cuộn hết cỡ vẫn có thể không đưa được section cuối lên tới vạch đọc ở giữa —
 * trên màn hình cao (viewport ~1200px+) footer chỉ chiếm phần dưới màn hình, nên nếu
 * chỉ dựa vào READING_LINE thì mục "Liên hệ" không bao giờ sáng dù người dùng đã ở
 * đáy trang. Observer thứ hai này xử lý đúng trường hợp đó, vẫn không cần nghe scroll.
 */
const TAIL_LINE = "0px 0px -35% 0px";

/** Hết thời gian này thì bỏ khoá sau khi bấm nav, phòng khi section đích không bao giờ cắt vạch đọc */
const SCROLL_LOCK_MS = 1200;

interface ISectionSpy {
  /** `id` của section đang hiển thị — dùng để tô nav link đang active */
  activeId: string;
  /** Cuộn mượt tới section và chuyển active state ngay, không đợi observer */
  scrollToSection: (id: string) => void;
}

/**
 * Dò section hiện hành theo vị trí cuộn bằng `IntersectionObserver`.
 *
 * Không dùng listener `scroll` để tính toán liên tục: observer chỉ gọi lại khi một
 * section đi vào/ra khỏi vạch đọc, rẻ hơn nhiều và không cần throttle.
 *
 * `sectionIds` phải là hằng số ở module scope — mảng tạo mới mỗi lần render sẽ
 * dựng lại observer sau mỗi render.
 */
export function useSectionSpy(sectionIds: readonly string[]): ISectionSpy {
  const [activeId, setActiveId] = useState(sectionIds[0]);
  // Bấm nav xong, cuộn mượt sẽ kéo nhiều section đi qua vạch đọc; nếu để observer
  // cập nhật tự do thì underline nhảy qua từng mục trung gian. Khoá lại cho tới khi
  // tới đúng section đích.
  const pendingIdRef = useRef<string | null>(null);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (sections.length === 0) return;

    const lastSection = sections[sections.length - 1];
    const visibleIds = new Set<string>();
    let tailReached = false;

    const resolveActive = () => {
      // Section cuối luôn thắng khi đã chạm vạch tail — lúc đó người dùng ở đáy trang.
      let nextId: string | undefined = tailReached ? lastSection.id : undefined;
      if (!nextId) {
        // Hai section có thể cùng cắt vạch đọc ở ranh giới; lấy section nằm sau
        // theo thứ tự tài liệu để nav tiến theo chiều cuộn xuống.
        for (const id of sectionIds) {
          if (visibleIds.has(id)) nextId = id;
        }
      }
      // Không section nào cắt vạch đọc (khoảng chuyển tiếp) → giữ nguyên mục cũ.
      if (!nextId) return;

      if (pendingIdRef.current) {
        if (pendingIdRef.current !== nextId) return;
        pendingIdRef.current = null;
      }
      setActiveId(nextId);
    };

    const readingObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibleIds.add(entry.target.id);
          else visibleIds.delete(entry.target.id);
        }
        resolveActive();
      },
      { rootMargin: READING_LINE, threshold: 0 }
    );
    sections.forEach((section) => readingObserver.observe(section));

    const tailObserver = new IntersectionObserver(
      ([entry]) => {
        tailReached = entry.isIntersecting;
        resolveActive();
      },
      { rootMargin: TAIL_LINE, threshold: 0 }
    );
    tailObserver.observe(lastSection);

    return () => {
      readingObserver.disconnect();
      tailObserver.disconnect();
    };
  }, [sectionIds]);

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    };
  }, []);

  const scrollToSection = useCallback(
    (id: string) => {
      const target = document.getElementById(id);
      if (!target) return;

      pendingIdRef.current = id;
      setActiveId(id);
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = setTimeout(() => {
        pendingIdRef.current = null;
      }, SCROLL_LOCK_MS);

      // Section đầu tiên nằm ngay dưới header nên cuộn hẳn về đỉnh trang, tránh
      // để lại một dải trống bằng đúng HEADER_OFFSET phía trên hero.
      const isFirstSection = id === sectionIds[0];
      const top = isFirstSection
        ? 0
        : target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;

      window.scrollTo({
        top,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });

      // Giữ URL chia sẻ được mà không để trình duyệt tự nhảy tới neo (nhảy sẽ phá
      // hiệu ứng cuộn mượt vừa gọi ở trên).
      window.history.replaceState(
        null,
        "",
        isFirstSection ? window.location.pathname : `#${id}`
      );
    },
    [sectionIds]
  );

  return { activeId, scrollToSection };
}
