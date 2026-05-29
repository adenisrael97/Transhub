import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Only *.spec.ts are vitest units. The *.test.ts harness
    // (seat-concurrency) drives a live server and is run separately via
    // `npm run test:concurrency`, not in the default unit run.
    include: ["src/**/*.spec.ts"],
  },
});
