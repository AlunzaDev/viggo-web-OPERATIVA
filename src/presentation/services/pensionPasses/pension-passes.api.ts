import { api } from "../../../infrastructure/http/axios.instance";
import {
  buildPensionPassPayload,
  normalizePensionPassCollection,
  type PensionPassForm,
} from "./pension-passes.contract";

export const loadPensionPasses = async () => {
  const response = await api.get("/api/pension-pass");
  return normalizePensionPassCollection(response.data);
};

export const savePensionPass = async (
  form: PensionPassForm,
  editingId?: string | null,
) => {
  const payload = buildPensionPassPayload(form);

  if (editingId) {
    await api.patch(`/api/pension-pass/${editingId}`, payload);
    return;
  }

  await api.post("/api/pension-pass", payload);
};

export const updatePensionPassStatus = async (
  pensionPassId: string,
  form: PensionPassForm,
) => {
  await api.patch(`/api/pension-pass/${pensionPassId}`, buildPensionPassPayload(form));
};

