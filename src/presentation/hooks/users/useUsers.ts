import { useState, useCallback, useEffect } from "react";
import { UserEntity } from "../../../domain/entities/user.entity";
import { UserDataSourceImpl } from "../../../infrastructure/datasources/user.datasource.impl";
import { UserRepositoryImpl } from "../../../infrastructure/repositories/user.repository.impl";
import { CreateUserUseCase } from "../../../application/use-cases/users/create-user.usecase";
import { GetUsersUseCase } from "../../../application/use-cases/users/get-users.usecase";
import { CreateUserDto } from "../../../infrastructure/dtos/user/create-user.dto";
import { UpdateUserUseCase } from "../../../application/use-cases/users/update-user.usecase";
import { UpdateUserDto, type UpdateUserPayload } from "../../../infrastructure/dtos/user/update-user.dto";
import type { AppModuleAccess } from "../../../domain/entities/module-access";

// Factoría para inicializar los UseCases limpios
// En proyectos más grandes, podrías inyectar esto usando un Context, un ServiceLocator o contenedores IoC
const datasource = new UserDataSourceImpl();
const repository = new UserRepositoryImpl(datasource);
const createUserUseCase = new CreateUserUseCase(repository);
const getUsersUseCase = new GetUsersUseCase(repository);
const updateUserUseCase = new UpdateUserUseCase(repository);
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const API_PAGE_SIZE = 200;
let usersCache: UserEntity[] = [];
let hasUsersCache = false;

type CreateUserPayload = {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  password: string;
  rol: string;
  coordinates?: number[];
  nacimiento?: number;
  img?: string;
  estado?: boolean;
  google?: boolean;
  emailValidated?: boolean;
  parkings?: string[];
  permissionProfileId?: string;
  modules?: AppModuleAccess[];
};

export const useUsers = () => {
  const [users, setUsers] = useState<UserEntity[]>(() => (hasUsersCache ? usersCache : []));
  const [isLoading, setIsLoading] = useState<boolean>(() => !hasUsersCache);
  const [isSavingUser, setIsSavingUser] = useState<boolean>(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState<boolean>(false);
  const [page, setPage] = useState<number>(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [totalUsers, setTotalUsers] = useState<number>(() => (hasUsersCache ? usersCache.length : 0));
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (errorValue: unknown, fallback: string): string =>
    errorValue instanceof Error ? errorValue.message : fallback;

  const fetchUsers = useCallback(async (options?: { silent?: boolean }) => {
    const shouldShowLoading = !options?.silent;
    if (shouldShowLoading) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const collectedUsers: UserEntity[] = [];
      let nextPage = DEFAULT_PAGE;
      let expectedTotal = Number.POSITIVE_INFINITY;

      while (collectedUsers.length < expectedTotal) {
        const result = await getUsersUseCase.execute({
          page: nextPage,
          limit: API_PAGE_SIZE,
        });

        if (nextPage === DEFAULT_PAGE) {
          expectedTotal = Math.max(result.total, result.users.length);
        }

        if (result.users.length === 0) {
          break;
        }

        collectedUsers.push(...result.users);

        if (result.users.length < API_PAGE_SIZE) {
          break;
        }

        nextPage += 1;
      }

      usersCache = collectedUsers;
      hasUsersCache = true;
      setUsers(collectedUsers);
      setTotalUsers(collectedUsers.length);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error inesperado al cargar la lista de accesos"));
    } finally {
      if (shouldShowLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  const goToPage = useCallback((nextPage: number) => {
    setPage(Math.max(1, Number(nextPage) || 1));
  }, []);

  const changePageSize = useCallback((nextPageSize: number) => {
    const sanitizedPageSize = Math.min(Math.max(1, Number(nextPageSize) || DEFAULT_PAGE_SIZE), 200);
    setPageSize(sanitizedPageSize);
    setPage(DEFAULT_PAGE);
  }, []);

  const createUser = useCallback(async (payload: CreateUserPayload) => {
    setIsSavingUser(true);
    setError(null);
    try {
      const [dtoError, createUserDto] = CreateUserDto.create(payload);
      if (dtoError || !createUserDto) {
        throw new Error(dtoError || "Payload inválido");
      }

      const newUser = await createUserUseCase.execute(createUserDto);
      setPage(DEFAULT_PAGE);
      await fetchUsers();

      return newUser;
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Error al crear el acceso");
      setError(message);
      throw new Error(message);
    } finally {
      setIsSavingUser(false);
    }
  }, [fetchUsers]);

  const updateUser = useCallback(async (userId: string, payload: UpdateUserPayload) => {
    setIsUpdatingUser(true);
    setError(null);
    try {
      const [dtoError, updateUserDto] = UpdateUserDto.create(payload);
      if (dtoError || !updateUserDto) {
        throw new Error(dtoError || "Payload invalido");
      }

      const updatedUser = await updateUserUseCase.execute(userId, updateUserDto);
      setUsers((prev) => prev.map((user) => (user.id === userId ? updatedUser : user)));

      await fetchUsers({ silent: true });
      const refreshedUser = usersCache.find((user) => user.id === userId);
      return refreshedUser ?? updatedUser;
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Error al actualizar el acceso");
      setError(message);
      throw new Error(message);
    } finally {
      setIsUpdatingUser(false);
    }
  }, [fetchUsers]);

  const toggleUserState = useCallback(
    async (userId: string, nextState: boolean) => {
      return updateUser(userId, { estado: nextState });
    },
    [updateUser]
  );

  useEffect(() => {
    if (hasUsersCache) {
      setUsers(usersCache);
      setTotalUsers(usersCache.length);
      fetchUsers({ silent: true });
      return;
    }

    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return {
    users,
    isLoading,
    isSavingUser,
    isUpdatingUser,
    page,
    pageSize,
    totalUsers,
    totalPages,
    error,
    goToPage,
    changePageSize,
    createUser,
    updateUser,
    toggleUserState,
    fetchUsers,
  };
};
