export interface Surgery {
    id?: string;
    date: string;
    patientName: string;
    protocol?: string;
    phone?: string;
    operation: string;
    professor?: string;
    resident?: string;
    urine?: string;
    anesthesia?: string;
    age?: string;
    note?: string;
    isSecondRoom: boolean;
    isRemaining: boolean;
    isMDP: boolean;
    isKG: boolean;
    createdAt?: any;
    updatedAt?: any;
}

export type TabType = 'calendar' | 'add' | 'list';

export interface FilterState {
    professor: string;
    operation: string;
    resident: string;
    secondRoom: string; // "second", "first", ""
    remaining: string; // "onlyRemaining", "onlyNotRemaining", ""
    mdp: string; // "yes", "no", ""
    kg: string; // "yes", "no", ""
    search: string;
}