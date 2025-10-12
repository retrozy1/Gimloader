import type Character from './character/character';
import type { Scene as BaseScene } from "phaser";

interface Overlay {
    hide: any;
    scene: Scene;
    show: any;
    showing: boolean;
    showingDimensions: any;
    showingPosition: any;
}

interface DepthSort {
    overlay: Overlay;
    scene: Scene;
    update: any;
}

interface SelectedDevicesOverlay {
    // complex
    graphics: any;
    hide: any;
    scene: Scene;
    show: any;
    showing: boolean;
}

interface MultiSelect {
    addDeviceToSelection: any;
    boundingBoxAroundEverything: any;
    currentlySelectedDevices: any[];
    currentlySelectedDevicesIds: string[];
    endSelectionRect: any;
    findSelectedDevices: any;
    hasSomeSelection: any;
    hideSelection: any;
    hidingSelectionForDevices: boolean;
    isSelecting: boolean;
    modifierKeyDown: boolean;
    mouseShifts: any[];
    movedOrCopiedDevices: any[];
    multiselectDeleteKeyHandler: any;
    multiselectKeyHandler: any;
    onDeviceAdded: any;
    onDeviceRemoved: any;
    overlay: Overlay;
    scene: Scene;
    selectedDevices: any[];
    selectedDevicesIds: string[];
    selectedDevicesOverlay: SelectedDevicesOverlay;
    selection: any;
    setShiftParams: any;
    startSelectionRect: any;
    unselectAll: any;
    update: any;
    updateSelectedDevicesOverlay: any;
    updateSelectionRect: any;
}

interface PlatformerEditing {
    setTopDownControlsActive: any;
}

interface Removal {
    checkForItem: any;
    createStateListeners: any;
    overlay: Overlay;
    prevMouseWasDown: boolean;
    removeSelectedItems: any;
    scene: Scene;
    update: any;
}

interface ActionManager {
    depthSort: DepthSort;
    multiSelect: MultiSelect;
    platformerEditing: PlatformerEditing;
    removal: Removal;
    update: any;
}

interface Spectating {
    findNewCharacter: any;
    onBeginSpectating: any;
    onEndSpectating: any;
    setShuffle: any;
}

interface CharacterManager {
    addCharacter: any;
    // complex
    characterContainer: any;
    characters: Map<string, Character>;
    cullCharacters: any;
    removeCharacter: any;
    scene: Scene;
    spectating: Spectating;
    update: any;
}

export default interface Scene extends BaseScene {
    actionManager: ActionManager;
    cameraHelper: any;
    characterManager: CharacterManager;
    create: any;
    dt: number;
    inputManager: any;
    resizeManager: any;
    shadowsManager: any;
    spine: any;
    tileManager: any;
    uiManager: any;
    worldManager: any;
}