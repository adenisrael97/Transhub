/**
 * Extends Zod with .openapi() — must be imported before any schema file
 * that uses .openapi(). app.ts imports this as its first statement so it
 * runs before any module router (and their schema files) are evaluated.
 */
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);
