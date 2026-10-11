import {describe,expect,it,vi} from "vitest";
import {withSharedAIQuota} from "../src/lib/server/ai-quota";

describe("shared AI lease orchestration",()=>{
  it("never invokes Gemini when the shared store refuses a lease",async()=>{
    const leases={acquire:vi.fn().mockResolvedValue(null),release:vi.fn()},work=vi.fn();
    await expect(withSharedAIQuota("student",work,leases)).rejects.toMatchObject({status:429});
    expect(work).not.toHaveBeenCalled();expect(leases.release).not.toHaveBeenCalled();
  });
  it("releases the exact acquired token after a provider failure",async()=>{
    const leases={acquire:vi.fn().mockResolvedValue("lease-a"),release:vi.fn().mockResolvedValue(undefined)};
    await expect(withSharedAIQuota("student",async()=>{throw new Error("provider failure");},leases)).rejects.toThrow("provider failure");
    expect(leases.release).toHaveBeenCalledWith("student","lease-a");
  });
  it("keeps a valid response if releasing a bounded lease fails",async()=>{
    const leases={acquire:vi.fn().mockResolvedValue("lease-a"),release:vi.fn().mockRejectedValue(new Error("private DB detail"))};
    const log=vi.spyOn(console,"error").mockImplementation(()=>{});
    try {
      expect(await withSharedAIQuota("student",async()=>"valid response",leases)).toBe("valid response");
      expect(log).toHaveBeenCalledWith("An AI request lease could not be released; it will expire.");
    } finally {log.mockRestore();}
  });
  it("fails closed before calling the provider when storage is unavailable",async()=>{
    const work=vi.fn(),leases={acquire:vi.fn().mockRejectedValue(new Error("unavailable")),release:vi.fn()};
    await expect(withSharedAIQuota("student",work,leases)).rejects.toThrow("unavailable");
    expect(work).not.toHaveBeenCalled();
  });
});
