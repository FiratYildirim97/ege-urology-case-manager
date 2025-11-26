export const normalizeStr = (str: string | undefined | null): string => {
    if (!str) return "";
    let s = String(str).trim().toLocaleLowerCase('tr-TR');
    s = s.replace(/nx/g, "nefrektomi").replace(/bx/g, "biyopsi");
    return s;
};

export const formatDateForInput = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
};

export const formatDateShort = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
};