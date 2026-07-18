import moving from "@/config/verticals/moving";
import autobody from "@/config/verticals/autobody";

export const VERTICALS = [moving, autobody];

export const getVertical = (id) => VERTICALS.find((v) => v.id === id);

export default getVertical;
