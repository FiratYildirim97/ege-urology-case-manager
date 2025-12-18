import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, Timestamp, enableIndexedDbPersistence, setDoc } from "firebase/firestore";
import { Surgery, ProfessorDay } from "../types";

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

try {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('Persistence failed: Multiple tabs open');
        } else if (err.code == 'unimplemented') {
            console.log('Persistence failed: Browser not supported');
        }
    });
} catch (e) {
    console.log("Persistence initialization error:", e);
}

const surgeryCollection = collection(db, "surgeries");
const professorDaysCollection = collection(db, "professorDays");

export const subscribeToSurgeries = (callback: (surgeries: Surgery[]) => void) => {
    const q = query(surgeryCollection);
    return onSnapshot(q, (snapshot) => {
        const data: Surgery[] = [];
        snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() } as Surgery);
        });
        callback(data);
    });
};

export const subscribeToProfessorDays = (callback: (profDays: ProfessorDay[]) => void) => {
    const q = query(professorDaysCollection);
    return onSnapshot(q, (snapshot) => {
        const data: ProfessorDay[] = [];
        snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() } as ProfessorDay);
        });
        callback(data);
    });
};

export const setProfessorDay = async (date: string, professorName: string) => {
    // We use date as document ID to make it unique per day
    const ref = doc(db, "professorDays", date);
    if (!professorName.trim()) {
        await deleteDoc(ref);
    } else {
        await setDoc(ref, {
            date,
            professorName: professorName.trim(),
            updatedAt: Timestamp.now()
        });
    }
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