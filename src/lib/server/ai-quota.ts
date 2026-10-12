import {quotaRefusalMessage, type QuotaRefusalReason} from "./ai-budget";
import {WorkspaceError} from "./errors";
export type AILeaseResult = string | {ok: false; reason: QuotaRefusalReason} | null;
export type AILeaseStore={acquire:(subject:string)=>Promise<AILeaseResult>;release:(subject:string,token:string)=>Promise<void>};
export async function withSharedAIQuota<T>(subject:string,work:()=>Promise<T>,leases:AILeaseStore):Promise<T> {
  const lease=await leases.acquire(subject);
  const token=typeof lease==="string"?lease:null;
  if(!token)throw new WorkspaceError(quotaRefusalMessage(lease && typeof lease==="object"?lease.reason:"busy"),429);
  try {return await work();}
  finally {
    // A failed release must not discard a valid answer. Its bounded lease expires.
    try {await leases.release(subject,token);} catch {console.error("An AI request lease could not be released; it will expire.");}
  }
}
