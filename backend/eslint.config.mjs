// Flat ESLint config. The point of this file (per CLAUDE.md) is to make the
// modular-monolith architecture rules FAIL CI, not just live in a doc:
//   #1 public-interface — import another module only through its index.ts
//   #3 layer-direction  — shared/config/infra never depend on modules
// Enforced with eslint-plugin-boundaries. A light TypeScript ruleset rides
// along, but boundaries violations are the hard gate.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "prisma/**", "eslint.config.mjs"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["src/**/*.ts"],
    plugins: { boundaries },
    settings: {
      // boundaries needs a resolver to map extensionless TS imports
      // (e.g. "../../shared/errors" → src/shared/errors/index.ts) onto elements;
      // without it every dependency resolves as "unknown" and no rule fires.
      "import/resolver": { typescript: { project: "tsconfig.json" } },
      "boundaries/include": ["src/**/*.ts"],
      // Each architectural layer is an "element". Modules capture their name so
      // boundaries can tell one module from another.
      // mode:"folder" treats the matched folder as the element (all files within
      // belong to it); mode:"file" matches individual files. Flat folders
      // (middleware, config, types) need file mode or top-level files won't match.
      "boundaries/elements": [
        { type: "config",     pattern: "src/config/*",     mode: "file" },
        { type: "infra",      pattern: "src/infra/*",      mode: "folder", capture: ["infra"] },
        { type: "middleware", pattern: "src/middleware/*", mode: "file" },
        { type: "shared",     pattern: "src/shared/**/*",  mode: "file" },
        { type: "types",      pattern: "src/types/*",      mode: "file" },
        { type: "module",     pattern: "src/modules/*",    mode: "folder", capture: ["module"] },
        { type: "app",        pattern: "src/*.ts",         mode: "file" },
      ],
    },
    rules: {
      // v6 unified rule. Last matching rule wins, so order matters.
      "boundaries/dependencies": ["error", {
        default: "allow",
        rules: [
          // Rule #1 public-interface: a module is a black box. Disallow importing
          // ANY module, then re-allow only its index.ts. Same-module (self) imports
          // are not cross-element, so boundaries does not flag them.
          {
            from: { type: ["module", "middleware", "app", "infra", "shared", "config"] },
            disallow: { to: { type: "module" } },
            message: "Import a module only through its index.ts (public-interface rule #1).",
          },
          {
            from: { type: ["module", "middleware", "app", "infra", "shared", "config"] },
            allow: { to: { type: "module", internalPath: "index.ts" } },
          },
          // Carve-out: *.openapi.ts files contain only documentation side-effects
          // (no business logic, no exports used by other modules). The app-layer
          // openapi.ts imports them explicitly for spec generation. This is a
          // principled exception — only the app layer may use it.
          {
            from: { type: "app" },
            allow: { to: { type: "module", internalPath: "*.openapi.ts" } },
          },

          // Rule #3 (macro): foundational layers must not reach up into modules.
          {
            from: { type: ["shared", "config"] },
            disallow: { to: { type: ["module", "middleware", "app", "infra"] } },
            message: "${from.type} must stay dependency-light — it may not import ${to.type}.",
          },
          {
            from: { type: "infra" },
            disallow: { to: { type: ["module", "middleware", "app"] } },
            message: "infra is plumbing — modules depend on infra, never the reverse.",
          },
        ],
      }],

      // Keep the gate about architecture, not style: ignore intentional _-prefixed
      // unused (Express signatures), and don't block on pre-existing `any`.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // The hand-rolled integration test and ambient type decls aren't module code.
  {
    files: ["src/tests/**/*.ts", "src/types/**/*.ts"],
    rules: {
      "boundaries/dependencies": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
