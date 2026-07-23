import { useCallback, useEffect, useState } from "react";
import { PermissionProfileEntity } from "../../../domain/entities/permission-profile.entity";
import { api } from "../../../infrastructure/http/axios.instance";

type PermissionProfilePayload = {
  nombre: string;
  descripcion?: string;
  estado?: boolean;
  modules: string[];
};

const extractProfiles = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data;
  if (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as { profiles?: unknown[] }).profiles)
  ) {
    return (data as { profiles?: unknown[] }).profiles ?? [];
  }
  return [];
};

const extractProfile = (data: unknown): Record<string, unknown> => {
  if (
    typeof data === "object" &&
    data !== null &&
    typeof (data as { profile?: unknown }).profile === "object" &&
    (data as { profile?: unknown }).profile !== null
  ) {
    return (data as { profile: Record<string, unknown> }).profile;
  }

  if (typeof data === "object" && data !== null) {
    return data as Record<string, unknown>;
  }

  throw new Error("Respuesta invalida del perfil");
};

export function usePermissionProfiles() {
  const [profiles, setProfiles] = useState<PermissionProfileEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (errorValue: unknown, fallback: string): string => {
    if (
      typeof errorValue === "object" &&
      errorValue !== null &&
      typeof (errorValue as { response?: { data?: { error?: string; message?: string } } }).response
        === "object"
    ) {
      const response = (
        errorValue as { response?: { data?: { error?: string; message?: string } } }
      ).response;
      return response?.data?.message ?? response?.data?.error ?? fallback;
    }

    return errorValue instanceof Error ? errorValue.message : fallback;
  };

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/api/permission-profiles");
      setProfiles(
        extractProfiles(data).map((item) =>
          PermissionProfileEntity.fromObject(
            typeof item === "object" && item !== null
              ? (item as Record<string, unknown>)
              : {},
          ),
        ),
      );
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar los perfiles"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfiles();
  }, [fetchProfiles]);

  const createProfile = useCallback(async (payload: PermissionProfilePayload) => {
    setIsSaving(true);
    setError(null);
    try {
      const { data } = await api.post("/api/permission-profiles", payload);
      const created = PermissionProfileEntity.fromObject(extractProfile(data));
      setProfiles((prev) => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
      return created;
    } catch (err) {
      const message = getErrorMessage(err, "No se pudo crear el perfil");
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateProfile = useCallback(async (id: string, payload: Partial<PermissionProfilePayload>) => {
    setIsUpdating(true);
    setError(null);
    try {
      const { data } = await api.patch(`/api/permission-profiles/${id}`, payload);
      const updated = PermissionProfileEntity.fromObject(extractProfile(data));
      setProfiles((prev) =>
        prev
          .map((profile) => (profile.id === id ? updated : profile))
          .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
      );
      return updated;
    } catch (err) {
      const message = getErrorMessage(err, "No se pudo actualizar el perfil");
      setError(message);
      throw new Error(message);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteProfile = useCallback(async (id: string) => {
    setIsDeleting(true);
    setError(null);
    try {
      await api.delete(`/api/permission-profiles/${id}`);
      setProfiles((prev) => prev.filter((profile) => profile.id !== id));
    } catch (err) {
      const message = getErrorMessage(err, "No se pudo eliminar el perfil");
      setError(message);
      throw new Error(message);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    profiles,
    isLoading,
    isSaving,
    isUpdating,
    isDeleting,
    error,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
  };
}
