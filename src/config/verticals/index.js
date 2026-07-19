import moving from "@/config/verticals/moving";
import autobody from "@/config/verticals/autobody";
import locksmith from "@/config/verticals/locksmith";
import pestcontrol from "@/config/verticals/pestcontrol";

// Locksmith first: the flagship vertical leads everywhere verticals are listed.
export const VERTICALS = [locksmith, moving, autobody, pestcontrol];

export const getVertical = (id) => VERTICALS.find((v) => v.id === id);

export default getVertical;
