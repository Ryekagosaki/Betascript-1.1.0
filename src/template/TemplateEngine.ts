export interface HTMLTemplate {
  raw: string;
  ast: HTMLElement[];
}

export interface HTMLElement {
  type: "element" | "text" | "comment" | "expression";
  tag?: string;
  attributes: Map<string, string>;
  children: HTMLElement[];
  value?: string;
}

export interface CSSTemplate {
  rules: CSSRule[];
  raw: string;
}

export interface CSSRule {
  selector: string;
  properties: Map<string, string>;
}

export class TemplateEngine {
  parseHTML(source: string): HTMLTemplate {
    const ast: HTMLElement[] = [];
    let pos = 0;
    
    while (pos < source.length) {
      if (source[pos] === "<" && source[pos + 1] === "?") {
        const end = source.indexOf("?>", pos + 2);
        if (end !== -1) {
          const expr = source.slice(pos + 2, end).trim();
          ast.push({
            type: "expression",
            attributes: new Map(),
            children: [],
            value: expr,
          });
          pos = end + 2;
          continue;
        }
      }
      
      if (source[pos] === "<") {
        const tagEnd = source.indexOf(">", pos);
        if (tagEnd !== -1) {
          const tagStr = source.slice(pos + 1, tagEnd);
          const tagName = tagStr.split(/\s/)[0];
          const closeTag = `</${tagName}>`;
          const closeIdx = source.indexOf(closeTag, tagEnd + 1);
          
          if (closeIdx !== -1) {
            const inner = source.slice(tagEnd + 1, closeIdx);
            const attrs = this.parseAttributes(tagStr);
            ast.push({
              type: "element",
              tag: tagName,
              attributes: attrs,
              children: this.parseHTML(inner).ast,
            });
            pos = closeIdx + closeTag.length;
          } else {
            const selfClosing = source.slice(tagEnd - 1, tagEnd) === "/";
            const attrs = this.parseAttributes(tagStr);
            ast.push({
              type: "element",
              tag: tagName,
              attributes: attrs,
              children: [],
            });
            pos = tagEnd + 1;
          }
          continue;
        }
      }
      
      if (source[pos] === "<" && source[pos + 1] === "/") {
        const closeEnd = source.indexOf(">", pos);
        pos = closeEnd + 1;
        continue;
      }
      
      if (source[pos] === "<" && source[pos + 1] === "!") {
        const end = source.indexOf(">", pos);
        ast.push({
          type: "comment",
          attributes: new Map(),
          children: [],
          value: source.slice(pos + 4, end - 2),
        });
        pos = end + 1;
        continue;
      }
      
      let textEnd = source.length;
      const nextTag = source.indexOf("<", pos + 1);
      if (nextTag !== -1) textEnd = nextTag;
      const text = source.slice(pos, textEnd).trim();
      if (text) {
        ast.push({
          type: "text",
          attributes: new Map(),
          children: [],
          value: text,
        });
      }
      pos = textEnd;
    }
    
    return { ast, raw: source };
  }

  private parseAttributes(tagStr: string): Map<string, string> {
    const attrs = new Map<string, string>();
    const regex = /(\w+)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
    let match;
    const parts = tagStr.trim().split(/\s+/);
    if (parts.length > 1) {
      const attrPart = parts.slice(1).join(" ");
      while ((match = regex.exec(attrPart)) !== null) {
        const name = match[1];
        let val = match[2] ?? match[3] ?? match[4] ?? "";
        if (val.startsWith("${") && val.endsWith("}")) {
          val = `<?= ${val.slice(2, -1)} ?>`;
        }
        attrs.set(name, val);
      }
    }
    return attrs;
  }

  parseCSS(source: string): CSSTemplate {
    const rules: CSSRule[] = [];
    const normalized = source.replace(/\/\*[\s\S]*?\*\//g, "");
    const ruleRegex = /([^{]+)\{([^}]*)\}/g;
    let match;
    while ((match = ruleRegex.exec(normalized)) !== null) {
      const selector = match[1].trim();
      const props = new Map<string, string>();
      const declarations = match[2].split(";").filter(s => s.trim());
      for (const decl of declarations) {
        const [prop, val] = decl.split(":").map(s => s.trim());
        if (prop && val) props.set(prop, val);
      }
      rules.push({ selector, properties: props });
    }
    return { rules, raw: source };
  }

  interpolateHTML(template: HTMLTemplate, data: Record<string, any>): string {
    return this.renderElement(template.ast, data);
  }

  private renderElement(elements: HTMLElement[], data: Record<string, any>): string {
    return elements.map(el => this.renderNode(el, data)).join("");
  }

  private renderNode(node: HTMLElement, data: Record<string, any>): string {
    if (node.type === "text") return node.value ?? "";
    if (node.type === "comment") return `<!-- ${node.value} -->`;
    if (node.type === "expression") return this.resolveExpression(node.value ?? "", data);
    
    if (node.type === "element") {
      const attrs = Array.from(node.attributes.entries())
        .map(([k, v]) => {
          const resolved = this.resolveExpression(v, data);
          if (resolved === v) return k;
          return `${k}="${resolved}"`;
        })
        .join(" ");
      const children = this.renderElement(node.children, data);
      if (node.tag === "img" || node.tag === "br" || node.tag === "hr" || node.tag === "input") {
        return `<${node.tag}${attrs ? " " + attrs : ""}>`;
      }
      return `<${node.tag}${attrs ? " " + attrs : ""}>${children}</${node.tag}>`;
    }
    return "";
  }

  private resolveExpression(expr: string, data: Record<string, any>): string {
    if (!expr.startsWith("<?= ") || !expr.endsWith(" ?>")) return expr;
    const key = expr.slice(4, -3).trim();
    const parts = key.split(".");
    let value: any = data;
    for (const part of parts) {
      value = value?.[part];
    }
    return String(value ?? "");
  }

  interpolateCSS(template: CSSTemplate, data: Record<string, any>): string {
    return template.rules.map(rule => {
      const props = Array.from(rule.properties.entries())
        .map(([k, v]) => {
          const resolved = this.resolveExpression(v, data);
          return `${k}: ${resolved};`;
        })
        .join("\n    ");
      return `${rule.selector} {\n    ${props}\n  }`;
    }).join("\n\n");
  }
}
