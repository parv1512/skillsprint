import {describe,expect,it,vi} from "vitest";
import {readAIBudgetLimits} from "../src/lib/server/ai-budget";
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
  it("keeps an invalid daily cap at the built-in ceiling",()=>{
    expect(readAIBudgetLimits({AI_STUDENT_DAILY_LIMIT:"0",AI_GLOBAL_DAILY_LIMIT:"nope"})).toEqual({student:15,global:45});
    expect(readAIBudgetLimits({AI_STUDENT_DAILY_LIMIT:"8",AI_GLOBAL_DAILY_LIMIT:"20"})).toEqual({student:8,global:20});
  });
  it("refuses a shared or account daily cap before calling the provider",async()=>{
    const work=vi.fn();
    const site={acquire:vi.fn().mockResolvedValue({ok:false,reason:"site"}),release:vi.fn()};
    await expect(withSharedAIQuota("student",work,site)).rejects.toThrow("shared limit of 45");
    const account={acquire:vi.fn().mockResolvedValue({ok:false,reason:"account"}),release:vi.fn()};
    await expect(withSharedAIQuota("student",work,account)).rejects.toThrow("limit of 15");
    expect(work).not.toHaveBeenCalled();
  });
});
