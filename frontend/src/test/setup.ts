import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// @testing-library/react's automatic cleanup only self-registers when it
// detects Jest-style globals; without `globals: true` in the Vitest config,
// each render() leaks into the next test's DOM unless we do this explicitly.
afterEach(() => {
  cleanup();
});
