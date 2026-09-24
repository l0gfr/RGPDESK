import {
  piaReportBody,
  type PiaPublication,
  type PiaReportNode,
} from "@rgpdesk/privacy-core";
// Never parse HTML or accept a supplied tree: only the controlled presentation
// built from the selected publication. Values become text nodes, including SVG.
export function piaPreviewBody(publication: PiaPublication): HTMLElement {
  function create(node: PiaReportNode): Node {
    if (typeof node === "string") return document.createTextNode(node);
    const element =
      node.tag === "svg" || node.tag === "path"
        ? document.createElementNS("http://www.w3.org/2000/svg", node.tag)
        : document.createElement(node.tag);
    for (const [name, value] of Object.entries(node.attrs))
      element.setAttribute(name, value);
    element.append(...node.children.map(create));
    return element;
  }
  return create(piaReportBody(publication)) as HTMLElement;
}
