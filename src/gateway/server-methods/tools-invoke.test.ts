import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  invokeGatewayTool: vi.fn(async () => ({
    ok: true as const,
    status: 200 as const,
    toolName: "gateway",
    source: "core" as const,
    result: { ok: true },
  })),
}));

vi.mock("../tools-invoke-shared.js", () => ({ invokeGatewayTool: mocks.invokeGatewayTool }));

import { toolsInvokeHandlers } from "./tools-invoke.js";

function createBaseParams(scopes: string[] = []) {
  return {
    params: { name: "gateway", args: {} },
    respond: vi.fn(),
    context: { getRuntimeConfig: () => ({}) },
    client: { connect: { scopes } },
    req: { type: "req", method: "tools.invoke", id: "1" },
    isWebchatConnect: () => false,
  } as const;
}

describe("tools.invoke sender ownership", () => {
  it("passes senderIsOwner=true for admin-scoped rpc callers", async () => {
    await toolsInvokeHandlers["tools.invoke"](createBaseParams(["operator.write", "operator.admin"]) as never);
    expect(mocks.invokeGatewayTool).toHaveBeenCalledWith(
      expect.objectContaining({ senderIsOwner: true }),
    );
  });

  it("does not pass senderIsOwner for non-admin rpc callers", async () => {
    await toolsInvokeHandlers["tools.invoke"](createBaseParams(["operator.write"]) as never);
    expect(mocks.invokeGatewayTool).toHaveBeenCalledWith(
      expect.objectContaining({ senderIsOwner: undefined }),
    );
  });
});
