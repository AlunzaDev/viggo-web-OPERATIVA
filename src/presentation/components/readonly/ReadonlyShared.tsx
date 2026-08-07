import { useEffect, useState, type ReactNode } from "react";
import { CrudActionsIsland } from "../shared/CrudActionsIsland";
import { CopyableId } from "../shared/CopyableId";
import { UniqueModalBase } from "../shared/modals/UniqueModalBase";
import { TableBase } from "../shared/tables/TableBase";
import { usePageTitle } from "../../context/page-title/usePageTitle";

export type DetailField = { label: string; value: ReactNode; icon?: ReactNode };

const PAGE_SIZE_OPTIONS = [5, 10, 20];

export function ReadonlyDetailModal({
  open,
  title,
  entityName,
  icon,
  itemId,
  fields,
  onClose,
}: {
  open: boolean;
  title: string;
  entityName: string;
  icon: ReactNode;
  itemId?: string;
  fields: DetailField[];
  onClose: () => void;
}) {
  return (
    <UniqueModalBase
      open={open}
      title={title}
      entityName={entityName}
      className="admin-crud-detail-modal"
      onClose={onClose}
      showEditAction={false}
    >
      <section className="modal-form-section">
        <div className="modal-section-header">
          {icon}
          <h3 className="modal-section-title">Informacion</h3>
        </div>
        <div className="admin-crud-detail-hero">
          <div className="admin-crud-detail-hero__icon">{icon}</div>
          <div>
            <h4>{entityName}</h4>
            {itemId ? <CopyableId value={itemId} copyLabel={`Copiar ID de ${entityName}`} /> : null}
          </div>
        </div>
        <div className="modal-section-grid">
          {fields.map((field) => (
            <article className="form-group admin-crud-detail-item" key={field.label}>
              <label>
                {field.icon} {field.label}
              </label>
              <p>{field.value}</p>
            </article>
          ))}
        </div>
      </section>
    </UniqueModalBase>
  );
}

export function ReadonlyTablePage<T extends { id: string }>({
  title,
  searchPlaceholder,
  rows,
  loading,
  error,
  columns,
  renderRow,
  getSearchText,
  selected,
  detailTitle,
  detailIcon,
  getDetailName,
  getDetailFields,
  onSelect,
  onCloseDetail,
  showFilter = false,
  isFilterOpen = false,
  activeFiltersCount = 0,
  onToggleFilter,
  onClearFilters,
  middleActions,
  searchValue,
  onSearchValueChange,
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: {
  title: string;
  searchPlaceholder: string;
  rows: T[];
  loading: boolean;
  error: string | null;
  columns: ReactNode;
  renderRow: (item: T) => ReactNode;
  getSearchText: (item: T) => string;
  selected: T | null;
  detailTitle: string;
  detailIcon: ReactNode;
  getDetailName: (item: T) => string;
  getDetailFields: (item: T) => DetailField[];
  onSelect: (item: T) => void;
  onCloseDetail: () => void;
  showFilter?: boolean;
  isFilterOpen?: boolean;
  activeFiltersCount?: number;
  onToggleFilter?: () => void;
  onClearFilters?: () => void;
  middleActions?: ReactNode;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  usePageTitle(title);
  const [internalSearch, setInternalSearch] = useState("");
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(10);
  const effectiveSearch = searchValue ?? internalSearch;
  const effectivePage = page ?? internalPage;
  const effectivePageSize = pageSize ?? internalPageSize;
  const isControlledPagination =
    page !== undefined &&
    pageSize !== undefined &&
    totalItems !== undefined &&
    totalPages !== undefined &&
    onPageChange !== undefined &&
    onPageSizeChange !== undefined;
  const filtered = rows.filter((item) => {
    const q = effectiveSearch.trim().toLowerCase();
    return !q || getSearchText(item).toLowerCase().includes(q);
  });
  const derivedTotalPages = Math.max(1, Math.ceil(filtered.length / effectivePageSize));
  const visible = isControlledPagination
    ? rows
    : filtered.slice((effectivePage - 1) * effectivePageSize, effectivePage * effectivePageSize);
  const effectiveTotalItems = isControlledPagination ? totalItems : filtered.length;
  const effectiveTotalPages = isControlledPagination ? totalPages : derivedTotalPages;

  useEffect(() => {
    if (!isControlledPagination && internalPage > derivedTotalPages) {
      setInternalPage(derivedTotalPages);
    }
  }, [derivedTotalPages, internalPage, isControlledPagination]);

  return (
    <main className="admin-crud-page">
      <CrudActionsIsland
        searchValue={effectiveSearch}
        onSearchChange={(event) => {
          const nextValue = event.target.value;
          if (onSearchValueChange) onSearchValueChange(nextValue);
          else setInternalSearch(nextValue);
          if (onPageChange) onPageChange(1);
          else setInternalPage(1);
        }}
        onSearchClear={() => {
          if (onSearchValueChange) onSearchValueChange("");
          else setInternalSearch("");
          if (onPageChange) onPageChange(1);
          else setInternalPage(1);
        }}
        searchPlaceholder={searchPlaceholder}
        isBusy={loading}
        showFilter={showFilter}
        isFilterOpen={isFilterOpen}
        activeFiltersCount={activeFiltersCount}
        onToggleFilter={onToggleFilter}
        onClearFilters={onClearFilters}
        middleActions={middleActions}
      />
      {error ? <p className="admin-crud-error">{error}</p> : null}
      <TableBase
        withCard={false}
        isLoading={loading}
        isEmpty={visible.length === 0}
        emptyMessage="No hay registros."
        page={effectivePage}
        pageSize={effectivePageSize}
        totalItems={effectiveTotalItems ?? 0}
        totalPages={effectiveTotalPages ?? 1}
        onPageChange={(nextPage) => {
          if (onPageChange) onPageChange(nextPage);
          else setInternalPage(nextPage);
        }}
        onPageSizeChange={(size) => {
          if (onPageSizeChange) onPageSizeChange(size);
          else {
            setInternalPageSize(size);
            setInternalPage(1);
          }
        }}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        columns={columns}
      >
        {visible.map((item) => (
          <tr
            key={item.id}
            className="base-table__row"
            tabIndex={0}
            onClick={() => onSelect(item)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(item);
              }
            }}
          >
            {renderRow(item)}
          </tr>
        ))}
      </TableBase>
      <ReadonlyDetailModal
        open={Boolean(selected)}
        title={detailTitle}
        entityName={selected ? getDetailName(selected) : ""}
        icon={detailIcon}
        itemId={selected?.id}
        fields={selected ? getDetailFields(selected) : []}
        onClose={onCloseDetail}
      />
    </main>
  );
}
