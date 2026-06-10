import type { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../../infra/db/client";
import { toSkipTake, type PaginationQuery, type Page } from "../../shared/pagination";
import { toDateRange } from "../../shared/list-query";
import type { CreateWaybillInput } from "./waybills.schema";

/** Waybill list filters (see listWaybillsQuerySchema). */
export interface WaybillListFilter {
  status?:             string;
  tripId?:             string;
  assignedOperatorId?: string;
  userId?:             string;
  dateFrom?:           string;
  dateTo?:             string;
  search?:             string;
}

function buildWaybillWhere(filter: WaybillListFilter): Prisma.WaybillWhereInput {
  const and: Prisma.WaybillWhereInput[] = [];
  if (filter.status)             and.push({ status: filter.status });
  if (filter.tripId)             and.push({ tripId: filter.tripId });
  if (filter.assignedOperatorId) and.push({ assignedOperatorId: filter.assignedOperatorId });
  if (filter.userId)             and.push({ userId: filter.userId });
  const created = toDateRange(filter.dateFrom, filter.dateTo);
  if (created) and.push({ createdAt: created });
  if (filter.search) {
    const s = filter.search;
    and.push({
      OR: [
        { waybillNo:     { contains: s, mode: "insensitive" } },
        { senderName:    { contains: s, mode: "insensitive" } },
        { senderPhone:   { contains: s, mode: "insensitive" } },
        { recipientName: { contains: s, mode: "insensitive" } },
        { recipientPhone:{ contains: s, mode: "insensitive" } },
        { fromLocation:  { contains: s, mode: "insensitive" } },
        { toLocation:    { contains: s, mode: "insensitive" } },
        { description:   { contains: s, mode: "insensitive" } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

export interface WaybillEventDTO {
  id:        string;
  status:    string;
  location:  string | null;
  note:      string | null;
  createdAt: Date;
}

export interface WaybillDTO {
  id:                 string;
  waybillNo:          string;
  userId:             string;
  tripId:             string | null;
  assignedOperatorId: string | null;
  assignedOperator:   { id: string; companyName: string } | null;
  senderName:         string;
  senderPhone:        string;
  recipientName:      string;
  recipientPhone:     string;
  fromLocation:       string;
  toLocation:         string;
  description:        string;
  weightKg:           Decimal | null;
  declaredValue:      Decimal | null;
  fee:                Decimal;
  quoteNote:          string | null;
  status:             string;
  paymentRef:         string | null;
  paidAt:             Date | null;
  quoteSentAt:        Date | null;
  droppedOffAt:       Date | null;
  pickedUpAt:         Date | null;
  inTransitAt:        Date | null;
  arrivedAt:          Date | null;
  completedAt:        Date | null;
  createdAt:          Date;
  updatedAt:          Date;
  events:             WaybillEventDTO[];
}

const INCLUDE_EVENTS = {
  events:           { orderBy: { createdAt: "asc" as const } },
  assignedOperator: { select: { id: true, companyName: true } },
} as const;

export const waybillsRepository = {
  async create(
    data: CreateWaybillInput & { waybillNo: string; userId: string }
  ): Promise<WaybillDTO> {
    return prisma.waybill.create({
      data: {
        waybillNo:      data.waybillNo,
        userId:         data.userId,
        tripId:         data.tripId ?? null,
        senderName:     data.senderName,
        senderPhone:    data.senderPhone,
        recipientName:  data.recipientName,
        recipientPhone: data.recipientPhone,
        fromLocation:   data.fromLocation,
        toLocation:     data.toLocation,
        description:    data.description,
        weightKg:       data.weightKg ?? null,
        declaredValue:  data.declaredValue ?? null,
        fee:            0, // set by admin when quoting
        events: {
          create: { status: "pending", note: "Waybill request submitted" },
        },
      },
      include: INCLUDE_EVENTS,
    }) as unknown as WaybillDTO;
  },

  async findByNo(waybillNo: string): Promise<WaybillDTO | null> {
    return prisma.waybill.findUnique({
      where:   { waybillNo },
      include: INCLUDE_EVENTS,
    }) as unknown as WaybillDTO | null;
  },

  async findById(id: string): Promise<WaybillDTO | null> {
    return prisma.waybill.findUnique({
      where:   { id },
      include: INCLUDE_EVENTS,
    }) as unknown as WaybillDTO | null;
  },

  /**
   * Look up a waybill by its Paystack reference (verify-callback path). paymentRef
   * is not unique at the DB level, so guard against the (unexpected) multi-row
   * case by taking the most recent — findFirst keeps this single-row and safe.
   */
  async findByPaymentRef(paymentRef: string): Promise<WaybillDTO | null> {
    return prisma.waybill.findFirst({
      where:   { paymentRef },
      include: INCLUDE_EVENTS,
      orderBy: { createdAt: "desc" },
    }) as unknown as WaybillDTO | null;
  },

  /** A page of waybills matching the filter, newest first. */
  async findAll(filter: WaybillListFilter, pagination: PaginationQuery): Promise<Page<WaybillDTO>> {
    const where = buildWaybillWhere(filter);
    const [items, total] = await prisma.$transaction([
      prisma.waybill.findMany({
        where,
        include: INCLUDE_EVENTS,
        orderBy: { createdAt: "desc" },
        ...toSkipTake(pagination),
      }),
      prisma.waybill.count({ where }),
    ]);
    return { items: items as unknown as WaybillDTO[], total };
  },

  async deleteById(id: string): Promise<void> {
    await prisma.waybill.delete({ where: { id } });
  },

  /** Admin: set quote, assign operator — transitions to quote_sent. */
  async sendQuote(
    id: string,
    fee: Decimal,
    assignedOperatorId: string,
    quoteNote: string | undefined
  ): Promise<WaybillDTO> {
    const [_updated] = await prisma.$transaction([
      prisma.waybill.update({
        where: { id },
        data:  {
          fee,
          assignedOperatorId,
          quoteNote: quoteNote ?? null,
          status:      "quote_sent",
          quoteSentAt: new Date(),
        },
        include: INCLUDE_EVENTS,
      }),
      prisma.waybillEvent.create({
        data: { waybillId: id, status: "quote_sent", note: quoteNote ?? "Quote sent by admin" },
      }),
    ]);
    void _updated;
    return prisma.waybill.findUniqueOrThrow({
      where:   { id },
      include: INCLUDE_EVENTS,
    }) as unknown as WaybillDTO;
  },

  async setPaymentRef(id: string, paymentRef: string): Promise<void> {
    await prisma.waybill.update({ where: { id }, data: { paymentRef } });
  },

  /**
   * Atomically confirm payment: flip quote_sent → paid (+ paidAt) and append a
   * 'paid' event, but ONLY if the waybill is still awaiting payment. The
   * conditional `updateMany` is the idempotency guard — a duplicate webhook
   * delivery finds paidAt already set / status already advanced and changes 0
   * rows. Returns true only for the delivery that actually performed the flip.
   */
  async confirmPayment(id: string, paidAt: Date): Promise<boolean> {
    const result = await prisma.waybill.updateMany({
      where: { id, paidAt: null, status: "quote_sent" },
      data:  { status: "paid", paidAt },
    });
    if (result.count === 0) return false;

    await prisma.waybillEvent.create({
      data: { waybillId: id, status: "paid", note: "Payment confirmed" },
    });
    return true;
  },

  /** Update status + append a WaybillEvent in a single transaction. */
  async updateStatus(
    id: string,
    status: string,
    location?: string,
    note?: string
  ): Promise<WaybillDTO> {
    // Stage-timestamp mapping
    const stageField: Record<string, string> = {
      dropped_off:   "droppedOffAt",
      picked_up:     "pickedUpAt",
      in_transit:    "inTransitAt",
      arrived_at_hub: "arrivedAt",
      completed:     "completedAt",
    };
    const tsField = stageField[status];

    await prisma.$transaction([
      prisma.waybill.update({
        where: { id },
        data:  {
          status,
          ...(tsField && { [tsField]: new Date() }),
        },
      }),
      prisma.waybillEvent.create({
        data: { waybillId: id, status, location: location ?? null, note: note ?? null },
      }),
    ]);

    return prisma.waybill.findUniqueOrThrow({
      where:   { id },
      include: INCLUDE_EVENTS,
    }) as unknown as WaybillDTO;
  },
};
