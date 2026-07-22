import { describe, expect, it } from "vitest";
import { getQueryToken, getSafeReturnTo } from "./auth-route-utils";

describe("auth route query helpers", () => {
  it("returns account path when returnTo is missing", () => {
    expect(getSafeReturnTo(null)).toBe("/account");
  });

  it("returns account path for external redirect targets", () => {
    expect(getSafeReturnTo("https://example.com")).toBe("/account");
    expect(getSafeReturnTo("//example.com")).toBe("/account");
  });

  it("allows internal returnTo paths", () => {
    expect(getSafeReturnTo("/account/sessions")).toBe("/account/sessions");
  });

  it("normalizes missing token to empty string", () => {
    expect(getQueryToken(null)).toBe("");
  });

  it("returns token when provided", () => {
    expect(getQueryToken("verify-token")).toBe("verify-token");
  });
});
