export type ModuleType = "ENTRADA" | "SALIDA" | "POS";
export type ModuleSubmoduleType =
    | "QR_SCANNER"
    | "PRINTER"
    | "BARRIER"
    | "CAMERA"
    | "CASH_DRAWER"
    | "CASH_ACCEPTOR"
    | "DISPLAY"
    | "KEYPAD"
    | "OTHER";

export interface ModuleSubmodule {
    submoduloId: string;
    nombre: string;
    tipo: ModuleSubmoduleType;
    identificador?: string;
    ip?: string;
    mac?: string;
    descripcion?: string;
    estado: boolean;
}

export interface ModuleDeviceBinding {
    fingerprint: string;
    cpuSerial?: string;
    machineId?: string;
    primaryMac?: string;
    boundAt: Date;
    lastSeenAt: Date;
}

export type ModuleDeviceRuntimeConnectionStatus =
    | "CONNECTED"
    | "DISCONNECTED"
    | "PENDING"
    | "REJECTED"
    | "MISMATCH";

export type ModuleDeviceBindingRequestStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED";

export interface ModuleDeviceBindingRequest {
    fingerprint: string;
    cpuSerial?: string;
    machineId?: string;
    primaryMac?: string;
    ipAddress?: string;
    locationLabel?: string;
    status: ModuleDeviceBindingRequestStatus;
    requestedAt: Date;
    resolvedAt?: Date;
    notes?: string;
}

export type ModuleDeviceConnectionAuditStatus =
    | "APPROVED"
    | "PENDING"
    | "REJECTED";

export interface ModuleDeviceConnectionAudit {
    fingerprint?: string;
    cpuSerial?: string;
    machineId?: string;
    primaryMac?: string;
    ipAddress?: string;
    locationLabel?: string;
    socketId?: string;
    status: ModuleDeviceConnectionAuditStatus;
    reason?: string;
    attemptedAt: Date;
}

export interface ModuleDeviceRuntime {
    fingerprint?: string;
    socketId?: string;
    ipAddress?: string;
    locationLabel?: string;
    connectionStatus: ModuleDeviceRuntimeConnectionStatus;
    isConnected: boolean;
    isAuthorized: boolean;
    connectedAt?: Date;
    lastHeartbeatAt?: Date;
    lastDisconnectAt?: Date;
    message?: string;
}

export class ModuleEntity {
    readonly id: string;
    readonly nombre: string;
    readonly proyecto: string;
    readonly tipo: ModuleType;
    readonly identificador: string;
    readonly estado: boolean;
    readonly descripcion: string;
    readonly deviceBinding: ModuleDeviceBinding | null;
    readonly deviceBindingRequests: ModuleDeviceBindingRequest[];
    readonly deviceConnectionAudit: ModuleDeviceConnectionAudit | null;
    readonly deviceRuntime: ModuleDeviceRuntime | null;
    readonly submodulos: ModuleSubmodule[];

    constructor(options: {
        id: string;
        nombre: string;
        proyecto: string;
        tipo: ModuleType;
        identificador: string;
        estado?: boolean;
        descripcion?: string;
        deviceBinding?: ModuleDeviceBinding | null;
        deviceBindingRequests?: ModuleDeviceBindingRequest[];
        deviceConnectionAudit?: ModuleDeviceConnectionAudit | null;
        deviceRuntime?: ModuleDeviceRuntime | null;
        submodulos?: ModuleSubmodule[];
    }) {
        this.id = options.id;
        this.nombre = options.nombre;
        this.proyecto = options.proyecto;
        this.tipo = options.tipo;
        this.identificador = options.identificador;
        this.estado = options.estado ?? true;
        this.descripcion = options.descripcion ?? "";
        this.deviceBinding = options.deviceBinding ?? null;
        this.deviceBindingRequests = options.deviceBindingRequests ?? [];
        this.deviceConnectionAudit = options.deviceConnectionAudit ?? null;
        this.deviceRuntime = options.deviceRuntime ?? null;
        this.submodulos = options.submodulos ?? [];
    }

    get name() {
        return this.nombre;
    }

    get projectId() {
        return this.proyecto;
    }

    get type() {
        return this.tipo;
    }

    get active() {
        return this.estado;
    }

    get latestPendingBindingRequest() {
        return this.deviceBindingRequests.find((request) => request.status === "PENDING") ?? null;
    }

    get bindingStatus(): "BOUND" | "PENDING" | "FREE" {
        if (this.deviceBinding) {
            return "BOUND";
        }

        if (this.latestPendingBindingRequest) {
            return "PENDING";
        }

        return "FREE";
    }

    static fromObject(object: Record<string, unknown>): ModuleEntity {
        const id = String(object.id ?? object._id ?? "").trim();
        const nombre = String(object.nombre ?? object.name ?? "").trim();
        const proyecto = parseProjectId(object.proyecto ?? object.projectId);
        const tipo = parseModuleType(object.tipo ?? object.type);
        const identificador = String(object.identificador ?? "").trim();
        const descripcion = String(object.descripcion ?? object.description ?? "").trim();
        const estado = parseEstado(object.estado ?? object.active ?? object.state);
        const deviceBinding = parseDeviceBinding(object.deviceBinding);
        const deviceBindingRequests = parseDeviceBindingRequests(object.deviceBindingRequests);
        const deviceConnectionAudit = parseDeviceConnectionAudit(object.deviceConnectionAudit);
        const deviceRuntime = parseDeviceRuntime(object.deviceRuntime);
        const submodulos = parseSubmodulos(object.submodulos);

        if (!id) throw new Error("El modulo no incluyo id");
        if (!nombre) throw new Error("El modulo no incluyo nombre");
        if (!proyecto) throw new Error("El modulo no incluyo proyecto");
        if (!identificador) throw new Error("El modulo no incluyo identificador");

        return new ModuleEntity({
            id,
            nombre,
            proyecto,
            tipo,
            identificador,
            descripcion,
            estado,
            deviceBinding,
            deviceBindingRequests,
            deviceConnectionAudit,
            deviceRuntime,
            submodulos,
        });
    }

    static withActive(module: ModuleEntity, estado: boolean): ModuleEntity {
        return new ModuleEntity({
            id: module.id,
            nombre: module.nombre,
            proyecto: module.proyecto,
            tipo: module.tipo,
            identificador: module.identificador,
            descripcion: module.descripcion,
            estado,
            deviceBinding: module.deviceBinding,
            deviceBindingRequests: module.deviceBindingRequests,
            deviceConnectionAudit: module.deviceConnectionAudit,
            deviceRuntime: module.deviceRuntime,
            submodulos: module.submodulos,
        });
    }
}

function parseSubmodulos(value: unknown): ModuleSubmodule[] {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => parseSubmodulo(item))
        .filter((item): item is ModuleSubmodule => Boolean(item));
}

function parseSubmodulo(value: unknown): ModuleSubmodule | null {
    if (!value || typeof value !== "object") return null;

    const source = value as Record<string, unknown>;
    const submoduloId = String(source.submoduloId ?? source.id ?? source._id ?? "").trim();
    const nombre = String(source.nombre ?? source.name ?? "").trim();
    const tipo = parseSubmoduleType(source.tipo ?? source.type);

    if (!submoduloId || !nombre) return null;

    return {
        submoduloId,
        nombre,
        tipo,
        identificador: normalizeOptionalText(source.identificador),
        ip: normalizeOptionalText(source.ip),
        mac: normalizeOptionalText(source.mac),
        descripcion: normalizeOptionalText(source.descripcion),
        estado: parseEstado(source.estado ?? source.active ?? source.state),
    };
}

function parseSubmoduleType(value: unknown): ModuleSubmoduleType {
    const normalized = String(value ?? "OTHER").trim().toUpperCase();
    if (
        normalized === "QR_SCANNER" ||
        normalized === "PRINTER" ||
        normalized === "BARRIER" ||
        normalized === "CAMERA" ||
        normalized === "CASH_DRAWER" ||
        normalized === "CASH_ACCEPTOR" ||
        normalized === "DISPLAY" ||
        normalized === "KEYPAD"
    ) {
        return normalized;
    }
    return "OTHER";
}

function parseProjectId(value: unknown): string {
    if (typeof value === "string") {
        return value.trim();
    }

    if (typeof value === "object" && value !== null) {
        const record = value as Record<string, unknown>;
        return String(record.id ?? record._id ?? "").trim();
    }

    return "";
}

function parseModuleType(value: unknown): ModuleType {
    const normalized = String(value ?? "ENTRADA").trim().toUpperCase();
    if (
        normalized === "SALIDA" ||
        normalized === "POS"
    ) {
        return normalized;
    }
    return "ENTRADA";
}

function parseEstado(value: unknown): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["false", "inactive", "inactivo", "disabled", "0"].includes(normalized)) return false;
        if (["true", "active", "activo", "enabled", "1"].includes(normalized)) return true;
    }
    return true;
}

function parseDeviceBinding(value: unknown): ModuleDeviceBinding | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const binding = value as Record<string, unknown>;
    const fingerprint = String(binding.fingerprint ?? "").trim();

    if (!fingerprint) {
        return null;
    }

    return {
        fingerprint,
        cpuSerial: normalizeOptionalText(binding.cpuSerial),
        machineId: normalizeOptionalText(binding.machineId),
        primaryMac: normalizeOptionalText(binding.primaryMac),
        boundAt: parseDate(binding.boundAt),
        lastSeenAt: parseDate(binding.lastSeenAt),
    };
}

function parseDeviceBindingRequests(value: unknown): ModuleDeviceBindingRequest[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((request) => parseDeviceBindingRequest(request))
        .filter((request): request is ModuleDeviceBindingRequest => request !== null);
}

function parseDeviceBindingRequest(value: unknown): ModuleDeviceBindingRequest | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const request = value as Record<string, unknown>;
    const fingerprint = String(request.fingerprint ?? "").trim();
    const status = String(request.status ?? "").trim().toUpperCase();

    if (!fingerprint || !isValidRequestStatus(status)) {
        return null;
    }

    return {
        fingerprint,
        cpuSerial: normalizeOptionalText(request.cpuSerial),
        machineId: normalizeOptionalText(request.machineId),
        primaryMac: normalizeOptionalText(request.primaryMac),
        ipAddress: normalizeOptionalText(request.ipAddress),
        locationLabel: normalizeOptionalText(request.locationLabel),
        status,
        requestedAt: parseDate(request.requestedAt),
        resolvedAt: request.resolvedAt ? parseDate(request.resolvedAt) : undefined,
        notes: normalizeOptionalText(request.notes),
    };
}

function normalizeOptionalText(value: unknown): string | undefined {
    const normalized = String(value ?? "").trim();
    return normalized || undefined;
}

function parseDate(value: unknown): Date {
    const parsed =
        value instanceof Date
            ? value
            : typeof value === "number"
              ? new Date(value)
              : new Date(String(value ?? ""));

    if (Number.isNaN(parsed.getTime())) {
        return new Date(0);
    }

    return parsed;
}

function isValidRequestStatus(value: string): value is ModuleDeviceBindingRequestStatus {
    return value === "PENDING" || value === "APPROVED" || value === "REJECTED";
}

function parseDeviceConnectionAudit(value: unknown): ModuleDeviceConnectionAudit | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const audit = value as Record<string, unknown>;
    const status = String(audit.status ?? "").trim().toUpperCase();

    if (!isValidConnectionAuditStatus(status)) {
        return null;
    }

    return {
        fingerprint: normalizeOptionalText(audit.fingerprint),
        cpuSerial: normalizeOptionalText(audit.cpuSerial),
        machineId: normalizeOptionalText(audit.machineId),
        primaryMac: normalizeOptionalText(audit.primaryMac),
        ipAddress: normalizeOptionalText(audit.ipAddress),
        locationLabel: normalizeOptionalText(audit.locationLabel),
        socketId: normalizeOptionalText(audit.socketId),
        status,
        reason: normalizeOptionalText(audit.reason),
        attemptedAt: parseDate(audit.attemptedAt),
    };
}

function isValidConnectionAuditStatus(
    value: string,
): value is ModuleDeviceConnectionAuditStatus {
    return value === "APPROVED" || value === "PENDING" || value === "REJECTED";
}

function parseDeviceRuntime(value: unknown): ModuleDeviceRuntime | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const runtime = value as Record<string, unknown>;
    const connectionStatus = String(runtime.connectionStatus ?? "").trim().toUpperCase();

    if (!isValidRuntimeConnectionStatus(connectionStatus)) {
        return null;
    }

    return {
        fingerprint: normalizeOptionalText(runtime.fingerprint),
        socketId: normalizeOptionalText(runtime.socketId),
        ipAddress: normalizeOptionalText(runtime.ipAddress),
        locationLabel: normalizeOptionalText(runtime.locationLabel),
        connectionStatus,
        isConnected: Boolean(runtime.isConnected),
        isAuthorized: Boolean(runtime.isAuthorized),
        connectedAt: runtime.connectedAt ? parseDate(runtime.connectedAt) : undefined,
        lastHeartbeatAt: runtime.lastHeartbeatAt ? parseDate(runtime.lastHeartbeatAt) : undefined,
        lastDisconnectAt: runtime.lastDisconnectAt ? parseDate(runtime.lastDisconnectAt) : undefined,
        message: normalizeOptionalText(runtime.message),
    };
}

function isValidRuntimeConnectionStatus(
    value: string,
): value is ModuleDeviceRuntimeConnectionStatus {
    return (
        value === "CONNECTED" ||
        value === "DISCONNECTED" ||
        value === "PENDING" ||
        value === "REJECTED" ||
        value === "MISMATCH"
    );
}
