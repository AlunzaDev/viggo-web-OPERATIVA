import { useMemo, useState } from "react";
import { FaBuilding, FaCheck, FaSearch, FaTimes } from "react-icons/fa";
import "./ProjectPicker.css";

export type ParkingOption = {
  id: string;
  name: string;
};

type ProjectPickerProps = {
  options: ParkingOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  disabled?: boolean;
  required?: boolean;
};

export function ProjectPicker({
  options,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearSelection,
  disabled = false,
  required = false,
}: ProjectPickerProps) {
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, search]);

  const selectedCount = selectedIds.length;
  const allSelected = options.length > 0 && selectedCount >= options.length;

  return (
    <div className="form-group modal-field-full">
      <label>
        Proyectos
        {selectedCount > 0 && (
          <span className="project-picker__badge">{selectedCount}</span>
        )}
        <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 4 }}>
          {required ? "(Requerido)" : "(Opcional)"}
        </span>
      </label>

      <div className="project-picker">
        {options.length > 0 && (onSelectAll || onClearSelection) ? (
          <div className="project-picker__quick-actions">
            {onSelectAll ? (
              <button
                type="button"
                className="project-picker__quick-action"
                onClick={onSelectAll}
                disabled={disabled || allSelected}
              >
                Seleccionar todos
              </button>
            ) : null}
            {onClearSelection ? (
              <button
                type="button"
                className="project-picker__quick-action"
                onClick={onClearSelection}
                disabled={disabled || selectedCount === 0}
              >
                Limpiar
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Buscador */}
        {options.length > 3 && (
          <div className="project-picker__search-wrap">
            <FaSearch className="project-picker__search-icon" />
            <input
              type="text"
              className="project-picker__search"
              placeholder="Buscar proyecto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={disabled}
            />
            {search.length > 0 && (
              <button
                type="button"
                className="project-picker__search-clear"
                onClick={() => setSearch("")}
                aria-label="Limpiar búsqueda"
              >
                <FaTimes />
              </button>
            )}
          </div>
        )}

        {/* Lista de proyectos */}
        <div className="project-picker__list">
          {options.length === 0 ? (
            <div className="project-picker__empty">
              <FaBuilding />
              <span>No hay proyectos disponibles</span>
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="project-picker__empty">
              <FaSearch />
              <span>Sin resultados para "{search}"</span>
            </div>
          ) : (
            filteredOptions.map((parking) => {
              const isSelected = selectedIds.includes(parking.id);
              return (
                <button
                  key={parking.id}
                  type="button"
                  className={`project-picker__card${isSelected ? " is-selected" : ""}`}
                  onClick={() => onToggle(parking.id)}
                  disabled={disabled}
                  title={parking.name}
                  aria-label={parking.name}
                >
                  <span className="project-picker__card-icon">
                    <FaBuilding />
                  </span>
                  <span className="project-picker__card-name">{parking.name}</span>
                  <span className="project-picker__card-check">
                    {isSelected && <FaCheck />}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
