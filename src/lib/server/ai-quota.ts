import {WorkspaceError} from "./errors";
export type AILeaseStore={acquire:(subject:string)=>Promise<string|null>;release:(subject:string,token:string)=>Promise<void>};
export async function withSharedAIQuota<T>(subject:string,work:()=>Promise<T>,leases:AILeaseStore):Promise<T> {
  const token=await leases.acquire(subject);
  if(!token)throw new WorkspaceError("Please wait before requesting more AI help.",429);
  try {return await work();}
  finally {
    // A failed release must not discard a valid answer. Its bounded lease expires.
    try {await leases.release(subject,token);} catch {console.error("An AI request lease could not be released; it will expire.");}
  }
}
