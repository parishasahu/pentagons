import schemes from "../data/schemes.json" with { type: "json" };
import docVault from "../data/docVault.json" with { type: "json" };
import type { Scheme } from "./discover.js";

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

interface VaultEntry {
  studentId: string;
  documents: { name: string; url: string }[];
}

export function buildDocBundle(schemeIds: string[], studentId: string): DocBundle {
  const selectedSchemes = (schemes as Scheme[]).filter((s) => schemeIds.includes(s.id));
  const vault = (docVault as VaultEntry[]).find((v) => v.studentId === studentId);
  const availableDocs = new Set(vault?.documents.map((d) => d.name) ?? []);

  // Collect all unique required documents across selected schemes
  const docMap = new Map<string, string[]>();
  const requiredDocs = [
    "Aadhaar Card",
    "Income Certificate",
    "Community / Caste Certificate",
    "Marksheet (Last Exam)",
    "Bank Passbook",
    "Domicile Certificate",
    "Disability Certificate",
    "Passport Photo",
  ];

  for (const scheme of selectedSchemes) {
    const docs = getRequiredDocsForScheme(scheme);
    for (const doc of docs) {
      if (!docMap.has(doc)) docMap.set(doc, []);
      docMap.get(doc)!.push(scheme.name);
    }
  }

  const documents: DocItem[] = [...docMap.entries()].map(([name, forSchemes]) => ({
    name,
    forSchemes,
    available: availableDocs.has(name),
    mockUrl: vault?.documents.find((d) => d.name === name)?.url ?? "#",
  }));

  return {
    studentId,
    schemes: selectedSchemes.map((s) => s.name),
    documents,
  };
}

function getRequiredDocsForScheme(scheme: Scheme): string[] {
  const base = ["Aadhaar Card", "Income Certificate", "Marksheet (Last Exam)", "Bank Passbook", "Passport Photo"];
  if (scheme.rules.categories?.some((c) => ["SC", "ST", "OBC"].includes(c))) {
    base.push("Community / Caste Certificate");
  }
  if (scheme.rules.states?.length) {
    base.push("Domicile Certificate");
  }
  if (scheme.rules.pwdOnly) {
    base.push("Disability Certificate");
  }
  return [...new Set(base)];
}
