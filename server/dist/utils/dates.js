export const DEMO_TODAY = "2026-07-01";
export const addDays = (dateString, days) => {
    const date = new Date(`${dateString}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
};
export const daysBetween = (from, to) => {
    const start = new Date(`${from}T00:00:00.000Z`).getTime();
    const end = new Date(`${to}T00:00:00.000Z`).getTime();
    return Math.round((end - start) / 86400000);
};
export const nowIso = () => new Date().toISOString();
