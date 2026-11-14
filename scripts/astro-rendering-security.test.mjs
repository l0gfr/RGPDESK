import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createContext, Script } from "node:vm";
import test from "node:test";
import { readBoundedRegularFile } from "./shared/bounded-file-read.mjs";

const webRequire = createRequire(new URL("../apps/web/package.json", import.meta.url));
const astroManifest = webRequire.resolve("astro/package.json");
const astroRequire = createRequire(astroManifest);
const astroRoot = dirname(astroManifest);
const { renderJSX } = await import(pathToFileURL(join(astroRoot, "dist/runtime/server/jsx.js")).href);
const { renderComponentToString } = await import(pathToFileURL(join(astroRoot, "dist/runtime/server/render/component.js")).href);
const { jsx } = await import(webRequire.resolve("astro/jsx-runtime"));
const { isParentDirectory } = await import(pathToFileURL(astroRequire.resolve("@astrojs/internal-helpers/path")).href);
const svelteRenderer = (await import(pathToFileURL(webRequire.resolve("@astrojs/svelte/server.js")).href)).default;

for (const mode of ["JSX", "component"]) {
  const render = (tag) => mode === "JSX"
    ? renderJSX({ renderers: [], clientDirectives: new Map() }, jsx(tag, { title: "local" })).then(String)
    : renderComponentToString({ renderers: [], clientDirectives: new Map() }, "synthetic", tag, { title: "local" });

  test(`Astro ${mode} keeps dynamic element names inside their boundary`, async () => {
    for (const suffix of ["/", "=", "\t", " "]) {
      assert.equal(await render(`local-card${suffix}marker`), '<local-card title="local"></local-card>');
    }
    await assert.rejects(render("!"), /Invalid element name/);
  });

  test(`Astro ${mode} preserves ordinary and custom element names`, async () => {
    for (const name of ["section", "local-card", "svg:path", "local-élement"]) {
      assert.equal(await render(name), `<${name} title="local"></${name}>`);
    }
  });
}

test("Astro image dependency preserves exact POSIX directory boundaries", () => {
  for (const child of ["/synthetic/DIST/client/file.png", "/synthetic/dist-extra/file.png", "/synthetic/dist", "/synthetic/dist/"]) {
    assert.equal(isParentDirectory("/synthetic/dist", child), false);
  }
  assert.equal(isParentDirectory("/synthetic/dist", "/synthetic/dist/client/file.png"), true);
});

test("Astro image dependency preserves Windows drive path behavior", () => {
  assert.equal(isParentDirectory("C:\\synthetic\\DIST", "c:\\SYNTHETIC\\dist\\client\\file.png"), true);
  assert.equal(isParentDirectory("C:\\synthetic\\dist", "C:\\synthetic\\dist-extra\\file.png"), false);
  assert.equal(isParentDirectory("C:\\synthetic\\dist", "D:\\synthetic\\dist\\file.png"), false);
  assert.equal(isParentDirectory("\\\\local\\share\\dist", "\\\\local\\share\\dist\\client\\file.png"), false);
});

test("Astro image dependency keeps literal POSIX backslashes out of separator normalization", () => {
  const sibling = fileURLToPath(new URL("file:///synthetic/dist%5Cclient/file.png"), { windows: false });
  assert.equal(isParentDirectory("/synthetic/dist", sibling), false);
  assert.equal(isParentDirectory("/synthetic/dist", "/synthetic/dist/client\\name.png"), true);
  assert.equal(isParentDirectory("/synthetic/dis\\t", "/synthetic/dis\\t/file.png"), true);
  assert.equal(isParentDirectory("/synthetic/dis\\t", "/synthetic/dis/t/file.png"), false);
  const outside = fileURLToPath(new URL("file:///synthetic/dist/../outside/file.png"), { windows: false });
  assert.equal(isParentDirectory("/synthetic/dist", outside), false);
});

const slotName = 'label"<&>';
const escapedSlotName = "label&quot;&lt;&amp;&gt;";
for (const legacy of [true, false]) {
  for (const hydrate of [true, false]) {
    test(`Svelte escapes ${legacy ? "legacy" : "snippet"} names in ${hydrate ? "hydrated" : "static"} slots`, async () => {
      function Component($$renderer, props) {
        (legacy ? props.$$slots[slotName] : props[slotName])($$renderer);
      }
      const { html } = await svelteRenderer.renderToStaticMarkup(Component, {}, { [slotName]: "local fixture" }, { astroStaticSlot: true, hydrate });
      const tag = hydrate ? "astro-slot" : "astro-static-slot";
      assert.ok(html.includes(`<${tag} name="${escapedSlotName}">local fixture</${tag}>`));
      assert.ok(!html.includes(slotName));
    });
  }
}

test("Svelte preserves ordinary named and default slots", async () => {
  function Component($$renderer, props) {
    props.children($$renderer);
    props.label($$renderer);
  }
  const { html } = await svelteRenderer.renderToStaticMarkup(Component, {}, { default: "body", label: "heading" }, { astroStaticSlot: true });
  assert.ok(html.includes("<astro-static-slot>body</astro-static-slot>"));
  assert.ok(html.includes('<astro-static-slot name="label">heading</astro-static-slot>'));
});

// Execute the installed client slot plumbing with inert lifecycle stubs only.
// No DOM, browser, network, editor, filesystem hook or application content.
const clientPath = webRequire.resolve("@astrojs/svelte/client.js");
const escapePath = join(dirname(clientPath), "escape.js");
const escapeSlotName = existsSync(escapePath)
  ? (await import(pathToFileURL(escapePath).href)).escapeSlotName
  : undefined;
const originalClient = readBoundedRegularFile(clientPath, 100_000).toString("utf8");
const imports = originalClient.match(/^import .*;$/gm) ?? [];
assert.ok(imports.length >= 1 && imports.every((line) => /from "(?:svelte|\.\/escape\.js)";$/.test(line)));
const clientSource = originalClient.replace(/^import .*;\n/gm, "")
  .replace(/^export default /m, "globalThis.clientRenderer = ")
  .replace(/export \{\s*client_svelte_default as default\s*\};?\s*$/, "globalThis.clientRenderer = client_svelte_default;");
assert.ok(clientSource.includes("globalThis.clientRenderer ="));

for (const client of ["load", "only"]) {
  test(`Svelte client ${client} preserves escaped slots on initial render and prop refresh`, async () => {
    const mounted = [];
    const bootstrap = (_component, options) => { mounted.push(options.props); return {}; };
    const context = createContext({
      createRawSnippet: (factory) => factory(),
      hydrate: bootstrap, mount: bootstrap, unmount: () => {},
      $state: (props) => props, escapeSlotName,
    }, { codeGeneration: { strings: false, wasm: false } });
    new Script(clientSource).runInContext(context, { timeout: 100 });
    const element = { hasAttribute: () => true, addEventListener: () => {}, innerHTML: "" };
    const render = context.clientRenderer(element);
    for (const value of ["first", "second"]) {
      await render(() => {}, {}, { [slotName]: value, default: "body" }, { client });
      assert.equal(mounted.length, 1);
      const props = mounted[0];
      const expected = `<astro-slot name="${escapedSlotName}">${value}</astro-slot>`;
      assert.equal(props[slotName].render(), expected);
      assert.equal(props.$$slots[slotName].render(), expected);
      assert.equal(props.children.render(), "<astro-slot>body</astro-slot>");
    }
  });
}
