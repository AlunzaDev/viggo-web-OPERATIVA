import { describe, expect, it, vi } from "vitest";
import type { AuthRepository } from "../../../domain/repositories/auth.repository";
import { ChangePasswordUseCase } from "./change-password.usecase";

describe("ChangePasswordUseCase", () => {
  it("delegates the password change to the auth repository", async () => {
    const changePassword = vi.fn().mockResolvedValue("La contraseña se actualizó correctamente.");
    const repository = {
      changePassword,
    } as unknown as AuthRepository;
    const useCase = new ChangePasswordUseCase(repository);

    const result = await useCase.execute({
      currentPassword: "OldPassword1",
      newPassword: "NewPassword1",
    });

    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: "OldPassword1",
      newPassword: "NewPassword1",
    });
    expect(result).toBe("La contraseña se actualizó correctamente.");
  });
});
