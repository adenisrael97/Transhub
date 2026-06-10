import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../../infra/db/client";
import { toSkipTake, type PaginationQuery, type Page } from "../../shared/pagination";
import { toDateRange } from "../../shared/list-query";
import type { CreateCharterInput, SendQuoteInput, ConfirmBookingInput } from "./charters.schema";

/** Charter list filters (see listChartersQuerySchema). passengerId scopes to one owner. */
export interface CharterListFilter {
  status?:      string;
  passengerId?: string;
  dateFrom?:    string;
  dateTo?:      string;
  search?:      string;
}

function buildCharterWhere(filter: CharterListFilter): Prisma.CharterWhereInput {
  const and: Prisma.CharterWhereInput[] = [];
  if (filter.status)      and.push({ status: filter.status });
  if (filter.passengerId) and.push({ passengerId: filter.passengerId });
  const created = toDateRange(filter.dateFrom, filter.dateTo);
  if (created) and.push({ createdAt: created });
  if (filter.search) {
    const s = filter.search;
    and.push({
      OR: [
        { referenceNo:  { contains: s, mode: "insensitive" } },
        { fromLocation: { contains: s, mode: "insensitive" } },
        { toLocation:   { contains: s, mode: "insensitive" } },
        { contactName:  { contains: s, mode: "insensitive" } },
        { contactPhone: { contains: s, mode: "insensitive" } },
        { passenger: { fullName: { contains: s, mode: "insensitive" } } },
        { passenger: { email:    { contains: s, mode: "insensitive" } } },
        { passenger: { phone:    { contains: s, mode: "insensitive" } } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

export interface CharterDTO {
  id:               string;
  referenceNo:      string | null;
  passengerId:      string;
  vehicleType:      string;
  fromLocation:     string;
  toLocation:       string;
  departureAt:      Date;
  returnAt:         Date | null;
  passengerCount:   number;
  notes:            string | null;
  contactName:      string | null;
  contactPhone:     string | null;
  contactEmail:     string | null;
  status:           string;
  // Quote fields
  quotedPrice:      Decimal | null;
  operatorName:     string | null;
  operatorCost:     Decimal | null;
  serviceFee:       Decimal | null;
  adminNotes:       string | null;
  // Payment
  paymentRef:       string | null;
  paidAt:           Date | null;
  paidAmount:       Decimal | null;
  // Post-payment confirmation
  assignedOperator: string | null;
  pickupInfo:       string | null;
  travelInfo:       string | null;
  // Completion
  completedAt:      Date | null;
  createdAt:        Date;
  updatedAt:        Date;
  passenger: {
    fullName: string;
    email:    string;
    phone:    string;
  };
}

const INCLUDE_PASSENGER = {
  passenger: { select: { fullName: true, email: true, phone: true } },
} as const;

function generateReferenceNo(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix  = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `CHR-${dateStr}-${suffix}`;
}

export const chartersRepository = {
  async create(passengerId: string, data: CreateCharterInput): Promise<CharterDTO> {
    return prisma.charter.create({
      data: {
        referenceNo:    generateReferenceNo(),
        passengerId,
        vehicleType:    data.vehicleType,
        fromLocation:   data.fromLocation,
        toLocation:     data.toLocation,
        departureAt:    new Date(data.departureAt),
        returnAt:       data.returnAt ? new Date(data.returnAt) : null,
        passengerCount: data.passengerCount,
        notes:          data.notes ?? null,
        contactName:    data.contactName ?? null,
        contactPhone:   data.contactPhone ?? null,
        contactEmail:   data.contactEmail ?? null,
      },
      include: INCLUDE_PASSENGER,
    });
  },

  async findById(id: string): Promise<CharterDTO | null> {
    return prisma.charter.findUnique({ where: { id }, include: INCLUDE_PASSENGER });
  },

  async findByPaymentRef(paymentRef: string): Promise<CharterDTO | null> {
    return prisma.charter.findUnique({ where: { paymentRef }, include: INCLUDE_PASSENGER });
  },

  /** A page of charters (admin all / passenger own), filtered + searched, newest first. */
  async findAll(filter: CharterListFilter, pagination: PaginationQuery): Promise<Page<CharterDTO>> {
    const where = buildCharterWhere(filter);
    const [items, total] = await prisma.$transaction([
      prisma.charter.findMany({
        where,
        include: INCLUDE_PASSENGER,
        orderBy: { createdAt: "desc" },
        ...toSkipTake(pagination),
      }),
      prisma.charter.count({ where }),
    ]);
    return { items, total };
  },

  async updateStatus(id: string, status: string): Promise<CharterDTO> {
    return prisma.charter.update({ where: { id }, data: { status }, include: INCLUDE_PASSENGER });
  },

  async sendQuote(id: string, data: SendQuoteInput): Promise<CharterDTO> {
    return prisma.charter.update({
      where:   { id },
      data:    {
        status:       "quote_sent",
        quotedPrice:  new Decimal(data.quotedPrice),
        operatorName: data.operatorName,
        operatorCost: new Decimal(data.operatorCost),
        serviceFee:   new Decimal(data.serviceFee),
        adminNotes:   data.adminNotes ?? null,
      },
      include: INCLUDE_PASSENGER,
    });
  },

  async acceptQuote(id: string): Promise<CharterDTO> {
    return prisma.charter.update({
      where:   { id },
      data:    { status: "awaiting_payment" },
      include: INCLUDE_PASSENGER,
    });
  },

  async setPaymentRef(id: string, paymentRef: string): Promise<CharterDTO> {
    return prisma.charter.update({
      where:   { id },
      data:    { paymentRef },
      include: INCLUDE_PASSENGER,
    });
  },

  /**
   * Atomically confirm payment: awaiting_payment → confirmed, but ONLY while the
   * charter is still awaiting payment and unpaid. The conditional `updateMany` is
   * the idempotency guard — a duplicate webhook delivery (or webhook racing the
   * verify-callback fallback) changes 0 rows. Returns true only for the delivery
   * that actually performed the flip, so the confirmation event fires exactly once.
   */
  async confirmPayment(id: string, paidAt: Date, paidAmount: Decimal): Promise<boolean> {
    const result = await prisma.charter.updateMany({
      where: { id, paidAt: null, status: "awaiting_payment" },
      data:  { paidAt, paidAmount, status: "confirmed" },
    });
    return result.count > 0;
  },

  async adminConfirmBooking(id: string, data: ConfirmBookingInput): Promise<CharterDTO> {
    return prisma.charter.update({
      where:   { id },
      data:    {
        assignedOperator: data.assignedOperator,
        pickupInfo:       data.pickupInfo,
        travelInfo:       data.travelInfo,
      },
      include: INCLUDE_PASSENGER,
    });
  },

  async complete(id: string): Promise<CharterDTO> {
    return prisma.charter.update({
      where:   { id },
      data:    { status: "completed", completedAt: new Date() },
      include: INCLUDE_PASSENGER,
    });
  },
};
