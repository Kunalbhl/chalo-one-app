const fs = require('fs');
let code = fs.readFileSync('src/services/firestoreService.ts', 'utf8');
code = code.replace("import { updateDoc, doc, getDoc, getDocs, setDoc, deleteDoc, collection, query, serverTimestamp, QueryConstraint, onSnapshot, DocumentData } from 'firebase/firestore';", "import { updateDoc, doc, getDoc, getDocs, setDoc as originalSetDoc, deleteDoc, collection, query, serverTimestamp, QueryConstraint, onSnapshot, DocumentData } from 'firebase/firestore';\nconst setDoc = (...args) => { console.trace('setDoc called!'); return originalSetDoc(...args); };");
fs.writeFileSync('src/services/firestoreService.ts', code);
