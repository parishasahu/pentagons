import schemes from "../data/schemes.json" with { type: "json" };
import docVault from "../data/docVault.json" with { type: "json" };
export function buildDocBundle(schemeIds, studentId) {
    const selectedSchemes = schemes.filter((s) => schemeIds.includes(s.id));
    const vault = docVault.find((v) => v.studentId === studentId);
    const availableDocs = new Set(vault?.documents.map((d) => d.name) ?? []);
    // Collect all unique required documents across selected schemes
    const docMap = new Map();
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
            if (!docMap.has(doc))
                docMap.set(doc, []);
            docMap.get(doc).push(scheme.name);
        }
    }
    const documents = [...docMap.entries()].map(([name, forSchemes]) => ({
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
function getRequiredDocsForScheme(scheme) {
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
//# sourceMappingURL=executor.js.map