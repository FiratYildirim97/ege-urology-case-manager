import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, Timestamp, enableIndexedDbPersistence } from "firebase/firestore";
import { Surgery } from "../types";

const firebaseConfig = {
    apiKey: "AIzaSyA5EAs64RaRLZKdaRuZaxG_Gjo8g_ie2aY",
    authDomain: "urology-case-list-ea0c1.firebaseapp.com",
    projectId: "urology-case-list-ea0c1",
    storageBucket: "urology-case-list-ea0c1.firebasestorage.app",
    messagingSenderId: "733847900230",
    appId: "1:733847900230:web:6c6aa1d906be8dffbb7a47"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable Offline Persistence to save data usage
// This allows the app to load from local cache first, reducing Firestore reads significantly.
try {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a a time.
            console.log('Persistence failed: Multiple tabs open');
        } else if (err.code == 'unimplemented') {
            // The current browser does not support all of the features required to enable persistence
            console.log('Persistence failed: Browser not supported');
        }
    });
} catch (e) {
    console.log("Persistence initialization error:", e);
}

const surgeryCollection = collection(db, "surgeries");

export const subscribeToSurgeries = (callback: (surgeries: Surgery[]) => void) => {
    // Basic query
    // Thanks to persistence, this won't re-download everything on every reload, 
    // only the changes (deltas) will be downloaded.
    const q = query(surgeryCollection);
    return onSnapshot(q, (snapshot) => {
        const data: Surgery[] = [];
        snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() } as Surgery);
        });
        callback(data);
    });
};

export const addSurgery = async (surgery: Surgery) => {
    const newDoc = {
        ...surgery,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    };
    await addDoc(surgeryCollection, newDoc);
};

export const updateSurgery = async (id: string, surgery: Partial<Surgery>) => {
    const ref = doc(db, "surgeries", id);
    await updateDoc(ref, {
        ...surgery,
        updatedAt: Timestamp.now()
    });
};

export const deleteSurgery = async (id: string) => {
    const ref = doc(db, "surgeries", id);
    await deleteDoc(ref);
};