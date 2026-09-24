import { PrivacyError } from "@rgpdesk/privacy-core";
import { recoveryKey, recoveryContent, type RecoveryDraft, type RecoveryForm, type RecoveryReceipt } from "./recovery";
import { checkSession, type VaultSession, type PrivacyVault } from "./vault";
type Store=Pick<PrivacyVault,'saveDraft'|'discardDraft'>;
/** Serialized writes, one owned copy per editing session, no overwrite of another tab's copy. */
export class RecoveryWriter {
  private receipt:RecoveryReceipt|null=null;
  private key='';private content='';private queue:Promise<void>=Promise.resolve();private disposed=false;
  constructor(private store:Store,private workspaceId:string,private phrase:string,private session:VaultSession){}
  private check(){if(this.disposed)throw new PrivacyError('LOCKED');checkSession(this.session);}
  private enqueue(action:()=>Promise<void>){const p=this.queue.then(()=>{this.check();return action();});this.queue=p.catch(()=>{});return p;}
  async settle(){await this.queue;this.check();return this.receipt?{...this.receipt}:undefined;}
  reset(){this.receipt=null;this.key=this.content='';}
  dispose(){this.disposed=true;this.phrase='';this.reset();}
  discard(){return this.enqueue(async()=>{if(this.receipt)await this.store.discardDraft(this.workspaceId,this.receipt,this.session);this.check();this.reset();});}
  adopt(d:RecoveryDraft){return this.enqueue(async()=>{
    if(d.workspaceId!==this.workspaceId)throw new PrivacyError('INVALID');
    const next={...d,sequence:d.sequence+1,updatedAt:new Date().toISOString()};
    await this.store.saveDraft(next,this.phrase,d.sequence,this.session);this.check();
    this.receipt={id:d.id,sequence:next.sequence};this.key=recoveryKey(d.form);this.content=recoveryContent(d.form);
  });}
  update(form:RecoveryForm|null,revision:number){
    // Copy before any asynchronous boundary; input mutations cannot change this write.
    const frozen=form?structuredClone(form):null;
    return this.enqueue(async()=>{
      if(!frozen){if(this.receipt)await this.store.discardDraft(this.workspaceId,this.receipt,this.session);this.check();this.reset();return;}
      const key=recoveryKey(frozen),content=recoveryContent(frozen);
      if(this.receipt&&key!==this.key){await this.store.discardDraft(this.workspaceId,this.receipt,this.session);this.check();this.reset();}
      if(this.receipt&&content===this.content)return;
      const id=this.receipt?.id??crypto.randomUUID(),sequence=(this.receipt?.sequence??0)+1;
      const value:RecoveryDraft={format:'rgpd-draft-v2',workspaceId:this.workspaceId,revision,id,sequence,updatedAt:new Date().toISOString(),form:frozen};
      await this.store.saveDraft(value,this.phrase,this.receipt?.sequence??null,this.session);this.check();
      this.receipt={id,sequence};this.key=key;this.content=content;
    });
  }
}
