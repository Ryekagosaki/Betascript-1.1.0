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
export declare class TemplateEngine {
    parseHTML(source: string): HTMLTemplate;
    private parseAttributes;
    parseCSS(source: string): CSSTemplate;
    interpolateHTML(template: HTMLTemplate, data: Record<string, any>): string;
    private renderElement;
    private renderNode;
    private resolveExpression;
    interpolateCSS(template: CSSTemplate, data: Record<string, any>): string;
}
//# sourceMappingURL=TemplateEngine.d.ts.map