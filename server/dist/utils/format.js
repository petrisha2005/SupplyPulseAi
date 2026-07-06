export const round = (value, digits = 1) => Number(value.toFixed(digits));
export const idFromTime = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
export const compactRupee = (value) => {
    const abs = Math.abs(value);
    if (abs >= 10000000)
        return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (abs >= 100000)
        return `₹${(value / 100000).toFixed(1)}L`;
    if (abs >= 1000)
        return `₹${Math.round(value / 1000)}K`;
    return `₹${Math.round(value).toLocaleString("en-IN")}`;
};
