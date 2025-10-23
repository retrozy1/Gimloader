import type Scene from "../scene";
import type { TerrainOption } from "../../worldOptions";
import type { XY } from '$types/shared';

interface BackgroundLayersManager {
    layerManager: LayerManager;
    scene: Scene;
    createLayer(options: { layerId: string, depth: number }): void;
    fill(terrain: TerrainOption): void;
    fillForPlatformer(): void;
    fillForTopDown(terrain: TerrainOption): void;
    removeLayer(options: { layerId: string }): void;
}

interface LayerManager {
    backgroundLayersManager: BackgroundLayersManager;
    colliders: Map<string, Map<string, string>>;
    layers: Map<string, any>;
    scene: Scene;
    createInitialLayers(): void;
    createLayer(id: string): void;
    fillBottomLayer(terrain: TerrainOption): void;
    getActualLayerDepth(id: string): number;
    moveLayersAboveCharacters(): void;
    onWorldSizeChange(): void;
}

interface TileKey extends XY {
    depth: number;
}

export default interface TileManager {
    cumulTime: number;
    scene: Scene;
    layerManager: LayerManager;
    damageTileAtXY(x: number, y: number, depth: number, damage: number, healthPercent: number): void;
    destroyTileByTileKey(tileKey: TileKey): void;
    onMapStyleSet(): void;
    regenerateTileAtXY(x: number, y: number, depth: number, healthPercent: number): void;
    update(dt: number): void;
    updateTeamColorTileAtXY(x: number, y: number, depth: number, team?: string, playerId?: string): void;
}