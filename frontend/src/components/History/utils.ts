import { format } from "date-fns";

export const safeFormatDate = (dateString: string | undefined, formatStr: string) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";
        return format(date, formatStr);
    } catch (e) {
        return "Error";
    }
};
