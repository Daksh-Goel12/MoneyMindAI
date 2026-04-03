import { randomUUID } from 'crypto';
import { countDocumentsByType, insertDocument, insertSection, runInTransaction } from '../db.js';
import type { SeedDocument } from '../types.js';

import personalFinanceGuide from './personal-finance-guide.json' with { type: 'json' };
import loanCreditHandbook from './loan-credit-handbook.json' with { type: 'json' };
import investmentBasicsGuide from './investment-basics-guide.json' with { type: 'json' };
import businessFinanceEssentials from './business-finance-essentials.json' with { type: 'json' };

const seedDocuments: SeedDocument[] = [
  personalFinanceGuide,
  loanCreditHandbook,
  investmentBasicsGuide,
  businessFinanceEssentials,
];

export function seedKnowledgeBase(): void {
  const curatedCount = countDocumentsByType('curated');
  if (curatedCount > 0) {
    return;
  }

  runInTransaction(() => {
    for (const doc of seedDocuments) {
      const docId = randomUUID();
      insertDocument(docId, doc.name, 'curated');

      doc.sections.forEach((section, index) => {
        const sectionId = randomUUID();
        insertSection(sectionId, docId, section.title, section.content, index);
      });
    }
  });
}
