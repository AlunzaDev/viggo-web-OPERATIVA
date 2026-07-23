import type { ReactNode } from "react";
import { useMemo } from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { usePageLoadingSignal } from "../loading/usePageLoading";
import { ScreenLoader } from "../loading/ScreenLoader";
import "./TableBase.css";

export type TableBaseProps = {
  columns: ReactNode;
  children: ReactNode;
  withCard?: boolean;
  className?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: ReactNode | string;
  loadingMessage?: string;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  paginationWindow?: number;
};

export function TableBase({
  columns,
  children,
  withCard = true,
  className = "",
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No se encontraron resultados.",
  loadingMessage = "Cargando datos...",
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  paginationWindow = 1,
}: TableBaseProps) {
  const loadingLabel =
    loadingMessage.replace(/^Cargando\s+/i, "").replace(/\.\.\.$/, "") || "datos";
  const hasGlobalPageLoader = usePageLoadingSignal(isLoading, loadingLabel);
  const paginationItems = useMemo(() => {
    const items: Array<number | "dots-left" | "dots-right"> = [];
    if (totalPages <= 1) return [1];

    const start = Math.max(1, page - paginationWindow);
    const end = Math.min(totalPages, page + paginationWindow);

    items.push(1);

    if (start > 2) {
      items.push("dots-left");
    }

    for (let current = Math.max(2, start); current <= Math.min(totalPages - 1, end); current++) {
      items.push(current);
    }

    if (end < totalPages - 1) {
      items.push("dots-right");
    }

    if (totalPages > 1) {
      items.push(totalPages);
    }

    return items;
  }, [page, totalPages, paginationWindow]);

  const pageStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems);
  const rootClassName = ["base-table-card", withCard ? "page-card" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={rootClassName}>
      <div className="base-table-wrap" role="region" aria-label="Data table">
        <table className="base-table">
          <thead>{columns}</thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={100}
                  className={`base-table__empty ${
                    hasGlobalPageLoader ? "base-table__loading-placeholder" : ""
                  }`.trim()}
                  aria-hidden={hasGlobalPageLoader || undefined}
                >
                  {hasGlobalPageLoader ? null : (
                    <ScreenLoader label={loadingLabel} fullscreen={false} />
                  )}
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td colSpan={100} className="base-table__empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>

      <div className="base-pagination">
        <p className="base-pagination__summary">
          Mostrando {pageStart}-{pageEnd} de {totalItems} registros
        </p>

        <div className="base-pagination__controls">
          <div className="base-pagination__size">
            <label htmlFor="base-page-size">Filas</label>
            <select
              id="base-page-size"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="base-pagination__nav-group">
            <button
              type="button"
              className="base-pagination__nav"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isLoading}
              aria-label="Página anterior"
            >
              <FaAngleLeft />
            </button>

            <div className="base-pagination__pages" aria-label="Páginas">
              {paginationItems.map((item, index) =>
                typeof item === "number" ? (
                  <button
                    key={`${item}-${index}`}
                    type="button"
                    className={`base-pagination__page ${item === page ? "is-active" : ""}`}
                    onClick={() => onPageChange(item)}
                    disabled={isLoading}
                    aria-current={item === page ? "page" : undefined}
                  >
                    {item}
                  </button>
                ) : (
                  <span key={`${item}-${index}`} className="base-pagination__dots" aria-hidden="true">
                    ...
                  </span>
                )
              )}
            </div>

            <button
              type="button"
              className="base-pagination__nav"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
              aria-label="Página siguiente"
            >
              <FaAngleRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

