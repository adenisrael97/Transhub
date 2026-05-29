/**
 * Operator onboarding business logic: register (public), list/approve/decline (admin).
 *
 * The approve flow is the most critical path here. It does TWO writes that must
 * succeed or fail together:
 *   1. Create a User account (role=operator) with a temporary password.
 *   2. Mark the Operator as approved + stamp reviewedAt.
 *
 * These run inside a single Prisma transaction so a mid-flight failure can never
 * leave an orphaned User with no linked Operator (or vice-versa).
 *
 * Dependency chain: operators → users (public interface only). No cycle.
 */
import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import type { Operator } from "@prisma/client";
import { prisma } from "../../infra/db/client";
import { ConflictError, NotFoundError } from "../../shared/errors";
import { ARGON2_OPTIONS } from "../../shared/security";
import { pageMeta, type PaginationQuery, type PageMeta } from "../../shared/pagination";
import { eventBus } from "../../infra/events";
import { usersService } from "../users";
import { operatorsRepository } from "./operators.repository";
import type { ListOperatorsQuery, RegisterOperatorInput } from "./operators.schema";

export interface ApproveResult {
  operator: Operator;
}

export const operatorsService = {
  /** Submit a new operator application. No auth required. */
  async register(input: RegisterOperatorInput): Promise<Operator> {
    const existing = await operatorsRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("An application with this email already exists");
    }
    return operatorsRepository.create(input);
  },

  /** List operator applications (paginated), optionally filtered by status. Admin only. */
  async list(
    filter: { status?: ListOperatorsQuery["status"] },
    pagination: PaginationQuery
  ): Promise<{ operators: Operator[]; pagination: PageMeta }> {
    const { items, total } = await operatorsRepository.findAll(filter, pagination);
    return { operators: items, pagination: pageMeta(total, pagination) };
  },

  /**
   * Approve a pending application.
   *
   * Creates the operator's User account and marks the Operator approved in a
   * single transaction. Returns the updated Operator. The one-time temp password
   * is delivered only by email (operator.approved event) — never in the API
   * response, so it can't leak via logs or to anyone but the operator's inbox.
   */
  async approve(id: string): Promise<ApproveResult> {
    const op = await operatorsRepository.findById(id);
    if (!op) throw new NotFoundError("Operator not found");
    if (op.status !== "pending") {
      throw new ConflictError(`Application is already ${op.status}`);
    }

    // Guard against the edge case where a passenger already registered with
    // the same email before applying as an operator.
    const existingUser = await usersService.findByEmail(op.email);
    if (existingUser) {
      throw new ConflictError(
        "A user account already exists for this email — contact support to link the accounts"
      );
    }

    // Generate a cryptographically random temporary password.
    // base64url gives ~16 printable chars with high entropy; no ambiguous chars.
    const tempPassword = randomBytes(12).toString("base64url");
    const passwordHash = await argon2.hash(tempPassword, ARGON2_OPTIONS);

    // Atomic: both writes succeed together or both roll back.
    await prisma.$transaction(async (tx) => {
      // Atomic guard FIRST: flip pending→approved conditionally. If a concurrent
      // reviewer already transitioned this application, count is 0 and we abort
      // before creating any User — no orphaned login for a non-pending operator.
      const { count } = await operatorsRepository.markReviewedIfPending(id, "approved", tx);
      if (count === 0) {
        throw new ConflictError("Application is no longer pending");
      }

      // Create the login account and link it to the operator record.
      // Prisma's UserCreateInput uses the nested connect syntax for relations;
      // the scalar operatorId FK is set indirectly through `operator.connect`.
      // A unique-constraint failure here rolls back the status flip above too.
      await usersService.create(
        {
          fullName:  op.contactName,
          email:     op.email,
          phone:     op.phone,
          password:  passwordHash,
          role:      "operator",
          operator:  { connect: { id: op.id } },
        },
        tx
      );
    });

    // Re-fetch outside the transaction for a clean, fully-updated snapshot.
    const updated = await operatorsRepository.findById(id);

    // Fire-and-forget: email the credentials via the notification queue.
    // Never await or catch here — email failure must not affect the approval response.
    eventBus.emit("operator.approved", {
      email:        op.email,
      contactName:  op.contactName,
      companyName:  op.companyName,
      tempPassword,
    });

    return { operator: updated! };
  },

  /** Decline a pending application. No User account is created. Admin only. */
  async decline(id: string): Promise<Operator> {
    const op = await operatorsRepository.findById(id);
    if (!op) throw new NotFoundError("Operator not found");
    if (op.status !== "pending") {
      throw new ConflictError(`Application is already ${op.status}`);
    }

    // Conditional update closes the read-then-write race: if a concurrent
    // reviewer transitioned the row after our pre-check, count is 0 and we 409
    // instead of silently re-stamping a row that's no longer pending.
    const { count } = await operatorsRepository.markReviewedIfPending(id, "declined");
    if (count === 0) {
      throw new ConflictError("Application is no longer pending");
    }

    const updated = await operatorsRepository.findById(id);
    return updated!;
  },
};
