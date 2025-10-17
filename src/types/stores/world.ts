interface Device {
    depth: number;
    deviceOption: any;
    existsBeforeReconnect: boolean;
    hooks: any;
    id: string;
    isPreview: boolean;
    layerId: string;
    name: any;
    options: any;
    props: any;
    x: number;
    y: number;
}

interface Devices {
    codeGrids: Map<string, any>;
    devices: Map<string, Device>;
    states: Map<string, any>;
}

interface Tile {
    collides: boolean;
    depth: number;
    terrain: string;
    x: number;
    y: number;
}

interface Terrain {
    currentTerrainUpdateId: number;
    modifiedHealth: Map<any, any>;
    queuedTiles: Map<any, any>;
    teamColorTiles: Map<any, any>;
    tiles: Map<string, Tile>;
}

export default interface World {
    customAssets: { customAssets: Map<any, any>; };
    devices: Devices;
    height: number;
    width: number;
    mapOptionsJSON: string;
    terrain: Terrain;
    wires: { wires: Map<any, any>; };
}
