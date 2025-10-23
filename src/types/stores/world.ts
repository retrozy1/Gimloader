import type { XY } from '$types/shared';

export interface Shapes {
    circles: number[][];
    lines: number[][];
    paths: number[][];
    rects: number[][];
}

interface CustomAsset {
    data: { shapes: Shapes };
    icon: string;
    id: string;
    name: string;
    optionId: string;
}

interface WorldCustomAssets {
    customAssets: Map<string, CustomAsset>;
    isUIOpen: boolean;
    updateCounter: number;
}

export interface CodeGridSchema {
    allowChannelGrids: boolean;
    customBlocks: any[];
    triggers: any[]
}

export interface DeviceOption {
    codeGridSchema: CodeGridSchema;
    defaultState: any;
    id: string;
    optionSchema: { options: any[]; };
    wireConfig: any;
}

interface DeviceData extends XY {
    depth: number;
    deviceOption: DeviceOption;
    existsBeforeReconnect: boolean;
    hooks: any;
    id: string;
    isPreview: boolean;
    layerId: string;
    name: any;
    options: Record<string, any>;
    props: any;
}

interface CodeGridItem {
    createdAt: number;
    existsBeforeReconnect: boolean;
    json: string;
    triggerType: string;
    owner?: string;
    triggerValue?: string;
    visitors: string[];
}

interface CodeGrid {
    existsBeforeReconnect: boolean;
    items: Map<string, CodeGridItem>;
}

interface DeviceState {
    deviceId: string;
    properties: Map<string, any>;
}

interface WorldDevices {
    codeGrids: Map<string, CodeGrid>;
    devices: Map<string, DeviceData>;
    states: Map<string, DeviceState>;
}

interface Tile extends XY {
    collides: boolean;
    depth: number;
    terrain: string;
}

interface QueuedTile {
    timestamp: number;
    removedBodyIds: string[];
}

interface Terrain {
    currentTerrainUpdateId: number;
    modifiedHealth: Map<string, number>;
    queuedTiles: Map<number, QueuedTile>;
    teamColorTiles: Map<string, string>;
    tiles: Map<string, Tile>;
}

export default interface World {
    customAssets: WorldCustomAssets;
    devices: WorldDevices;
    height: number;
    width: number;
    mapOptionsJSON: string;
    terrain: Terrain;
    wires: { wires: Map<any, any>; };
}