import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The limiter keeps its window state in module scope, so each test re-imports
 * the module fresh to start from an empty budget. Upstash env vars are cleared
 * so isRateLimited exercises the in-memory path.
 */
async function freshGuards() {
  vi.resetModules();
  return import("./apiGuards");
}

describe("isRateLimited — per-IP budget", () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });
  afterEach(() => vi.useRealTimers());

  it("allows the first 6 requests from one IP, then 429s the 7th", async () => {
    const { isRateLimited } = await freshGuards();
    for (let i = 0; i < 6; i += 1) {
      expect(await isRateLimited("1.1.1.1")).toBe(false);
    }
    expect(await isRateLimited("1.1.1.1")).toBe(true);
  });

  it("frees an IP's budget after the 60s window elapses", async () => {
    vi.useFakeTimers();
    const { isRateLimited } = await freshGuards();
    for (let i = 0; i < 6; i += 1) {
      expect(await isRateLimited("2.2.2.2")).toBe(false);
    }
    expect(await isRateLimited("2.2.2.2")).toBe(true);

    vi.advanceTimersByTime(61_000);
    expect(await isRateLimited("2.2.2.2")).toBe(false);
  });
});

describe("isRateLimited — global budget bounds spoofed IPs", () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("allows only 30 requests total even across 100 distinct IPs", async () => {
    const { isRateLimited } = await freshGuards();
    let allowed = 0;
    for (let i = 0; i < 100; i += 1) {
      if (!(await isRateLimited(`10.0.0.${i}`))) {
        allowed += 1;
      }
    }
    // GLOBAL_RATE_LIMIT_MAX_REQUESTS — rotating the per-IP key can't exceed it,
    // which is also what caps how many entries the tracking map can accrue.
    expect(allowed).toBe(30);
  });
});

describe("accessCodeGate", () => {
  beforeEach(() => delete process.env.PORTAL_ACCESS_CODE);

  const post = (headers?: Record<string, string>) =>
    new Request("http://localhost/api/refactor-ui", { method: "POST", headers });

  it("is a no-op (allows) when PORTAL_ACCESS_CODE is unset", async () => {
    const { accessCodeGate } = await freshGuards();
    expect(accessCodeGate(post())).toBeNull();
  });

  it("401s when a code is required but none is sent", async () => {
    process.env.PORTAL_ACCESS_CODE = "s3cret";
    const { accessCodeGate } = await freshGuards();
    expect(accessCodeGate(post())?.status).toBe(401);
  });

  it("401s on a wrong code", async () => {
    process.env.PORTAL_ACCESS_CODE = "s3cret";
    const { accessCodeGate } = await freshGuards();
    expect(accessCodeGate(post({ "x-portal-access-code": "nope" }))?.status).toBe(401);
  });

  it("allows the matching code", async () => {
    process.env.PORTAL_ACCESS_CODE = "s3cret";
    const { accessCodeGate } = await freshGuards();
    expect(accessCodeGate(post({ "x-portal-access-code": "s3cret" }))).toBeNull();
  });
});

describe("readString", () => {
  it("returns a string field and undefined for missing / non-string", async () => {
    const { readString } = await freshGuards();
    expect(readString({ code: "hi" }, "code")).toBe("hi");
    expect(readString({ code: 42 }, "code")).toBeUndefined();
    expect(readString(null, "code")).toBeUndefined();
    expect(readString({}, "code")).toBeUndefined();
  });
});
