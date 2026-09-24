import { reviseWorkspace } from "./commands";
import { knowledge, RESPONSE_FIELDS, type CollectionRequest, type CollectionReply, type Knowledge, type ResponseField, type Workspace } from "./model";
import { canonicalJson } from "./share-format.js";
import { assertWorkspace, PrivacyError } from "./validation";
const equal = (a: unknown, b: unknown) => canonicalJson(a) === canonicalJson(b);
function invalid(): never { throw new PrivacyError("INVALID"); }
/** Replies are declared observations. Applying one never validates a legal position. */
export function assertCollections(w: Workspace, registerId: (id: string) => void): void {
  for (const r of w.collections ?? []) {
    registerId(r.id);
    if (r.workspaceId !== w.id || r.createdAt < w.createdAt || r.createdAt > w.updatedAt || r.createdRevision > w.revision) invalid();
    if (r.closed && (r.closed.at < r.createdAt || r.closed.at > w.updatedAt)) invalid();
    for (const item of r.items) {
      registerId(item.id);
      if (item.activityId !== null && !w.activities.some(a => a.id === item.activityId)) invalid();
      let previous = r.createdAt;
      for (const reply of item.replies) {
        registerId(reply.id);
        if (reply.receivedAt < previous || reply.receivedAt > w.updatedAt || r.closed && reply.receivedAt > r.closed.at
          || reply.documentIds.some(id => !w.documents.some(d => d.id === id))) invalid();
        previous = reply.receivedAt;
        const a = reply.application;
        if (a && (!item.activityId || a.at < reply.receivedAt || a.at > w.updatedAt || a.revision < r.createdRevision || a.revision > w.revision
          || a.after.state !== "documented" || a.after.value !== reply.text || r.closed && a.at > r.closed.at)) invalid();
      }
    }
  }
}
/** Original questions and recorded answers cannot be rewritten or silently removed. */
export function assertCollectionHistory(before: CollectionRequest[], after: CollectionRequest[]): void {
  for (const [i, r] of before.entries()) {
    const n = after[i];
    if (!n || !equal({...r, items: [], closed: null}, {...n, items: [], closed: null}) || r.items.length !== n.items.length
      || r.closed && !equal(r, n)) invalid();
    for (const [j, item] of r.items.entries()) {
      const next = n.items[j];
      if (!next || !equal({...item, replies: []}, {...next, replies: []})) invalid();
      for (const [k, reply] of item.replies.entries()) {
        const replacement = next.replies[k];
        if (!replacement || !equal({...reply, application: null}, {...replacement, application: null})
          || reply.application && !equal(reply, replacement)) invalid();
      }
    }
  }
}
export function createCollection(w: Workspace, input: Pick<CollectionRequest, "id" | "recipient" | "due"> & {items: Omit<CollectionRequest["items"][number], "replies">[]}, revision: number, at: string): Workspace {
  const r: CollectionRequest = {...input, workspaceId:w.id, createdAt:at, createdRevision:revision+1, closed:null, items:input.items.map(i=>({...i,replies:[]}))};
  return reviseWorkspace(w,revision,at,{collections:[...(w.collections ?? []),r]});
}
function editable(w: Workspace, requestId: string, itemId?: string) {
  const next = structuredClone(w.collections ?? []), request = next.find(r=>r.id===requestId);
  if (!request || request.closed) throw new PrivacyError("CONFLICT");
  const item = request.items.find(i=>i.id===itemId);
  if (itemId && !item) throw new PrivacyError("INVALID");
  return {next,request,item};
}
export function addCollectionReply(w: Workspace, requestId: string, itemId: string, input: Pick<CollectionReply,"id"|"author"|"text"|"documentIds">, revision: number, at: string): Workspace {
  const {next,item} = editable(w,requestId,itemId);
  item!.replies.push({...input, receivedAt:at, application:null});
  return reviseWorkspace(w,revision,at,{collections:next});
}
export function applyCollectionReply(w: Workspace, requestId: string, itemId: string, replyId: string, field: ResponseField, before: Knowledge, reviewer: string, revision: number, at: string): Workspace {
  assertWorkspace(w);
  if (!RESPONSE_FIELDS.includes(field)) throw new PrivacyError("INVALID");
  const {next,item} = editable(w,requestId,itemId), reply = item!.replies.find(r=>r.id===replyId);
  const activity = w.activities.find(a=>a.id===item!.activityId);
  if (!reply || reply.application || !activity || !equal(activity[field],before)) throw new PrivacyError("CONFLICT");
  const after = knowledge(reply.text);
  reply.application = {field,before:structuredClone(before),after,reviewer,revision:revision+1,at};
  return reviseWorkspace(w,revision,at,{collections:next,activities:w.activities.map(a=>a.id===activity.id?{...a,[field]:after}:a)});
}
export function closeCollection(w: Workspace, id: string, author: string, reason: string, revision: number, at: string): Workspace {
  const {next,request} = editable(w,id); request.closed={author,reason,at};
  return reviseWorkspace(w,revision,at,{collections:next});
}
