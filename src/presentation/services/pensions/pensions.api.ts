import { api } from "../../../infrastructure/http/axios.instance";
import {
  buildPensionPayload,
  normalizePensionsPage,
  type PensionForm,
} from "./pensions.contract";

export const loadPensionsPage = async (
  page: number,
  pageSize: number,
  search: string,
) => {
  const response = await api.get("/api/pensiones", {
    params: {
      page,
      limit: pageSize,
      search: search.trim() || undefined,
    },
  });

  return normalizePensionsPage(response.data, page, pageSize);
};

export const savePension = async (
  form: PensionForm,
  editingId?: string | null,
) => {
  const payload = buildPensionPayload(form);

  if (editingId) {
    await api.patch(`/api/pensiones/${editingId}`, payload);
    return;
  }

  await api.post("/api/pensiones", payload);
};

export const updatePensionStatus = async (
  pensionId: string,
  form: PensionForm,
) => {
  await api.patch(`/api/pensiones/${pensionId}`, buildPensionPayload(form));
};

