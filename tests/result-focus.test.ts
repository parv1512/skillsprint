import {afterEach, describe, expect, it, vi} from "vitest";
import {revealResult} from "../src/components/result-focus";

class ElementStub {
  isContentEditable=false;
  isConnected=true;
  disabled=false;
  editing=false;
  hidden=false;
  matches(selector:string){return selector===":disabled"?this.disabled:this.editing;}
  closest(){return this.hidden?this:null;}
  scrollIntoView=vi.fn();
  focus=vi.fn();
}
function setup(active:ElementStub=new ElementStub()) {
  vi.stubGlobal("HTMLElement",ElementStub);
  vi.stubGlobal("document",{activeElement:active});
  return new ElementStub();
}
afterEach(()=>vi.unstubAllGlobals());
describe("action result focus",()=>{
  it("scrolls to a rendered result and focuses without a second scroll",()=>{
    const result=setup();revealResult(result as unknown as HTMLElement);
    expect(result.scrollIntoView).toHaveBeenCalledWith({block:"start"});
    expect(result.focus).toHaveBeenCalledWith({preventScroll:true});
  });
  it.each(["editing","isContentEditable"] as const)("preserves an active %s field",field=>{
    const active=new ElementStub();active[field]=true;
    const result=setup(active);revealResult(result as unknown as HTMLElement);
    expect(result.scrollIntoView).not.toHaveBeenCalled();
    expect(result.focus).not.toHaveBeenCalled();
  });
  it("does not focus a result in a closed panel or a removed component",()=>{
    const result=setup();result.hidden=true;revealResult(result as unknown as HTMLElement);
    result.hidden=false;result.isConnected=false;revealResult(result as unknown as HTMLElement);
    expect(result.focus).not.toHaveBeenCalled();
  });
});
