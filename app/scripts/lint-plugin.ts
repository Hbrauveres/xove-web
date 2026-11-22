// The project's own lint rules, loaded by oxlint as a JS plugin (.oxlintrc.json, "jsPlugins"):
// - regexp-from-data: a RegExp whose pattern isn't fixed text. A pattern built from data can be made
//   to run for a very long time, and Semgrep (the commit checks' SAST) fails it; caught here first.
// oxlint reads a plugin from its module's default export, as ESLint does.

/** The few parts of oxlint's syntax tree the rules read. */
type AstNode = {
  type: string;
  name?: string;
  value?: unknown;
  callee?: AstNode;
  arguments?: AstNode[];
  expressions?: AstNode[];
};
type Context = { report: (diagnostic: { node: AstNode; message: string }) => void };

/** Fixed text: a plain string, or a template with nothing put into it. */
const isFixedText = (node: AstNode | undefined) =>
  (node?.type === "Literal" && typeof node.value === "string") ||
  (node?.type === "TemplateLiteral" && node.expressions?.length === 0);

const isRegExpCall = (node: AstNode) => node.callee?.type === "Identifier" && node.callee.name === "RegExp";

const regexpFromData = {
  meta: { type: "problem", docs: { description: "a RegExp whose pattern isn't fixed text" } },
  create(context: Context) {
    const check = (node: AstNode) => {
      if (isRegExpCall(node) && node.arguments?.length && !isFixedText(node.arguments[0]))
        context.report({ node, message: "A RegExp built from data: write the pattern as fixed text." });
    };
    return { NewExpression: check, CallExpression: check };
  },
};

export default {
  meta: { name: "xove" },
  rules: { "regexp-from-data": regexpFromData },
};
