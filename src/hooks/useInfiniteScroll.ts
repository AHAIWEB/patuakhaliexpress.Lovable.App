import { useEffect, useRef } from "react";

export function useInfiniteScroll(
  onLoadMore: () => void,
  { hasMore, loading }: { hasMore: boolean; loading: boolean }
) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const cbRef = useRef(onLoadMore);
  cbRef.current = onLoadMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          cbRef.current();
        }
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  return sentinelRef;
}
