import moving from "@/config/verticals/moving";
import autobody from "@/config/verticals/autobody";
import locksmith from "@/config/verticals/locksmith";
import pestcontrol from "@/config/verticals/pestcontrol";

export const VERTICALS = [moving, autobody, locksmith, pestcontrol];

export const getVertical = (id) => VERTICALS.find((v) => v.id === id);

export default getVertical;
