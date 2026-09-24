import type { PiaPublication, SharedRegister } from "@rgpdesk/privacy-core";
export type PdfReport = ({kind: "register"; register: SharedRegister} | {kind: "pia"; publication: PiaPublication}) & {workspaceId: string; revision: number};
