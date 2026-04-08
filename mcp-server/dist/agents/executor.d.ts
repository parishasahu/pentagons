export interface DocItem {
    name: string;
    forSchemes: string[];
    available: boolean;
    mockUrl: string;
}
export interface DocBundle {
    studentId: string;
    schemes: string[];
    documents: DocItem[];
}
export declare function buildDocBundle(schemeIds: string[], studentId: string): DocBundle;
