/**
 * Drivers data access — the ONLY place that touches the `drivers` table.
 * Table-ownership rule: this module owns drivers; no other module writes here.
 *
 * findByPhone is also used by auth (via driversService) for login verification.
 * It returns the raw Driver (with password hash) intentionally — the service
 * layer strips the hash before returning data to callers.
 */
import type { Driver, Prisma } from "@prisma/client";
import { prisma } from "../../infra/db/client";
import { toSkipTake, type PaginationQuery, type Page } from "../../shared/pagination";
import type { UpdateDriverInput } from "./drivers.schema";

export type DriverDTO = Omit<Driver, "password">;

/** Driver row enriched with its operator's company name — for the admin directory. */
export type AdminDriverDTO = DriverDTO & { operatorName: string };

/** Driver list filters (see listDriversQuerySchema). operatorId scopes to one fleet. */
export interface DriverListFilter {
  operatorId?: string;
  isActive?:   boolean;
  search?:     string;
}

function omitPassword(driver: Driver): DriverDTO {
  const { password: _password, ...safe } = driver;
  return safe;
}

function buildDriverWhere(filter: DriverListFilter): Prisma.DriverWhereInput {
  const and: Prisma.DriverWhereInput[] = [];
  if (filter.operatorId) and.push({ operatorId: filter.operatorId });
  if (filter.isActive !== undefined) and.push({ isActive: filter.isActive });
  if (filter.search) {
    const s = filter.search;
    and.push({
      OR: [
        { fullName:  { contains: s, mode: "insensitive" } },
        { phone:     { contains: s, mode: "insensitive" } },
        { licenseNo: { contains: s, mode: "insensitive" } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

export const driversRepository = {
  async create(data: {
    operatorId:   string;
    fullName:     string;
    phone:        string;
    passwordHash: string;
    licenseNo?:   string;
  }): Promise<DriverDTO> {
    const driver = await prisma.driver.create({
      data: {
        operatorId: data.operatorId,
        fullName:   data.fullName,
        phone:      data.phone,
        password:   data.passwordHash,
        licenseNo:  data.licenseNo,
      },
    });
    return omitPassword(driver);
  },

  async findAll(operatorId: string): Promise<DriverDTO[]> {
    const drivers = await prisma.driver.findMany({
      where:   { operatorId },
      orderBy: { createdAt: "desc" },
    });
    return drivers.map(omitPassword);
  },

  /**
   * A page of drivers matching the filter, newest first, each with the operator's
   * company name. The operator name comes from a single relation `select` (one
   * query, no N+1). Used by both the operator fleet view (scoped by operatorId)
   * and the admin driver directory (all operators).
   */
  async findPaginated(filter: DriverListFilter, pagination: PaginationQuery): Promise<Page<AdminDriverDTO>> {
    const where = buildDriverWhere(filter);
    const [rows, total] = await prisma.$transaction([
      prisma.driver.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...toSkipTake(pagination),
        include: { operator: { select: { companyName: true } } },
      }),
      prisma.driver.count({ where }),
    ]);
    const items: AdminDriverDTO[] = rows.map((d) => {
      const { password: _pw, operator, ...safe } = d;
      return { ...safe, operatorName: operator.companyName };
    });
    return { items, total };
  },

  /** Find by id, optionally scoped to an operator (returns null if not owned). */
  async findById(id: string, operatorId?: string): Promise<DriverDTO | null> {
    const driver = await prisma.driver.findFirst({
      where: { id, ...(operatorId ? { operatorId } : {}) },
    });
    return driver ? omitPassword(driver) : null;
  },

  /** Used by auth layer for login — returns full row including password hash. */
  findByPhone(phone: string): Promise<Driver | null> {
    return prisma.driver.findUnique({ where: { phone } });
  },

  async findByPhoneScoped(phone: string, operatorId: string): Promise<DriverDTO | null> {
    const driver = await prisma.driver.findFirst({ where: { phone, operatorId } });
    return driver ? omitPassword(driver) : null;
  },

  /**
   * Update mutable fields for a driver owned by the given operator.
   * Uses updateMany with operatorId in WHERE so a rogue request for another
   * operator's driver silently returns null (not a 403 that leaks existence).
   */
  async update(id: string, operatorId: string, data: UpdateDriverInput): Promise<DriverDTO | null> {
    const patch: Partial<Pick<Driver, "fullName" | "licenseNo" | "isActive">> = {};
    if (data.fullName  !== undefined) patch.fullName  = data.fullName;
    if (data.licenseNo !== undefined) patch.licenseNo = data.licenseNo;
    if (data.isActive  !== undefined) patch.isActive  = data.isActive;

    const result = await prisma.driver.updateMany({
      where: { id, operatorId },
      data:  patch,
    });
    if (result.count === 0) return null;
    const driver = await prisma.driver.findUnique({ where: { id } });
    return driver ? omitPassword(driver) : null;
  },

  /** Soft-delete: set isActive=false. Trips already assigned keep the FK. */
  async deactivate(id: string, operatorId: string): Promise<boolean> {
    const result = await prisma.driver.updateMany({
      where: { id, operatorId },
      data:  { isActive: false },
    });
    return result.count > 0;
  },
};
