// lib/pagination.ts
type PaginationFilter = { page: number; page_size: number };

export function getMeta(filter: PaginationFilter, total_count: number) {
  return {
    total_count,
    page: filter.page,
    page_size: filter.page_size,
    page_count: Math.ceil(total_count / filter.page_size),
  };
}
