const fs = require('fs');
const content = fs.readFileSync('src/services/enterprisePlatformService.ts', 'utf8');
const searchStr = `      return { id: docRef.id, ...invoice } as FinanceInvoice;\n    } catch (error) {\n      console.error("Invoice Generation Error", error);\n      throw error;\n    }\n  },`;

const replaceStr = searchStr + `

  async getFinanceInvoices(limitCount = 10): Promise<FinanceInvoice[]> {
    try {
      const snap = await getDocs(query(collection(db, 'finance_invoices'), limit(limitCount)));
      const invoices: FinanceInvoice[] = [];
      snap.forEach(doc => invoices.push({ id: doc.id, ...doc.data() } as FinanceInvoice));
      return invoices;
    } catch (error) {
      console.error("Failed to fetch finance invoices", error);
      return [];
    }
  },`;

if(content.includes(searchStr)) {
  fs.writeFileSync('src/services/enterprisePlatformService.ts', content.replace(searchStr, replaceStr));
  console.log("Success");
} else {
  console.log("Failed to find string");
}
