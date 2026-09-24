import { describe,it,expect } from 'vitest';
import { createDemoWorkspace } from './demo';
import { requestItems,requestText } from './request-brief';
const w=()=>createDemoWorkspace(()=>crypto.randomUUID(),'2026-09-24T10:00:00.000Z');
describe('reviewed request projection',()=>{
 it('excludes document paths, citations and internal notes and avoids duplicate tracked findings',()=>{const m=w();m.activities[0]!.internalNotes='INTERNAL_CANARY';m.documents[0]!.internalRef='PATH_CANARY';m.documents[0]!.title='TITLE_CANARY';const items=requestItems(m,'2026-09-24');expect(new Set(items.map(i=>i.key)).size).toBe(items.length);const text=requestText('Interlocuteur fictif',items.slice(0,4));expect(text).not.toMatch(/CANARY/);expect(text).not.toContain(m.id);expect(text).toContain(items[0]!.question);});
 it('reuses interview questions but exports only the selected subset',()=>{const m=w();m.activities[0]!.interviewQuestions=['QUESTION_SELECTIONNEE','QUESTION_EXCLUE'];const items=requestItems(m,'2026-09-24');const text=requestText('RH',[items.find(i=>i.question==='QUESTION_SELECTIONNEE')!]);expect(text).toContain('QUESTION_SELECTIONNEE');expect(text).not.toContain('QUESTION_EXCLUE');});
 it('bounds the request and requires an explicit recipient and selection',()=>{expect(()=>requestText('',[])).toThrow();expect(()=>requestText('RH',[])).toThrow();const item=requestItems(w(),'2026-09-24')[0]!;expect(()=>requestText('RH',Array(31).fill(item))).toThrow();});
});
