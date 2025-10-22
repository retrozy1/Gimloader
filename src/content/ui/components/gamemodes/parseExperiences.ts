import net from "$core/net/net";
import type { Experiences, Gamemode } from "$types/fetch";

export interface MappedMode {
    name: string;
    id: string;
    image: string;
}

const gamemodesMap = (gamemode: Gamemode): MappedMode => ({
    name: gamemode.name,
    id: net.gamemodeFromUrl(gamemode.imageUrl),
    image: gamemode.imageUrl
});

export default function parseExperiences(experiences: Experiences, header: string[]) {
    let allModes = experiences.flatMap(exp => exp.items);
    let mappedModes = allModes.map(gamemodesMap);
    let gamemodes1d = allModes.filter(gm => gm.source !== "map").map(gamemodesMap);
    let gamemodes2d = allModes.filter(gm => gm.source === "map").map(gamemodesMap);
    
    // Get all the gamemode ids from the groups + explicit ids + "creative"
    let allGamemodes = new Set<string>();
    for(let mode of header.map(id => id.toLowerCase())) {
        switch(mode) {
            case "*": {
                mappedModes.forEach(gm => allGamemodes.add(gm.id));
                allGamemodes.add("creative");
                break;
            }
            case "2d": {
                gamemodes2d.forEach(gm => allGamemodes.add(gm.id));
                allGamemodes.add("creative");
                break;
            }
            case "1d": {
                gamemodes1d.forEach(gm => allGamemodes.add(gm.id));
                break;
            }
            case "official": {
                mappedModes.forEach(gm => allGamemodes.add(gm.id));
                break;
            }
            case "official-2d": {
                gamemodes2d.forEach(gm => allGamemodes.add(gm.id));
                break;
            }
            case "creative": break;
            default: {
                allGamemodes.add(mode);
            }
        }
    }

    return {
        mappedModes,
        gamemodes1d,
        gamemodes2d,
        allGamemodes
    };
}