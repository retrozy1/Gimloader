interface ExistingDevice {
    action: string;
    id: string;
    shiftX: number;
    shiftY: number;
    use: boolean;
}

interface AddingDevices {
    currentlySelectedProp: string;
    existingDevice: ExistingDevice;
    selectedDeviceType: string;
}

interface AddingTerrain {
    brushSize: number;
    buildTerrainAsWall: boolean;
    currentlySelectedTerrain: string;
    currentlySelectedTerrainDepth: number;
}

interface AddingWires {
    hoveringOverSupportedDevice: boolean;
    pointUnderMouseDeviceId: any;
    startDeviceSelected: boolean;
}

interface Adding {
    devices: AddingDevices;
    terrain: AddingTerrain;
    wires: AddingWires;
    mode: string;
}

interface CinematicMode {
    charactersVisible: boolean;
    enabled: boolean;
    followingMainCharacter: boolean;
    hidingGUI: boolean;
    mainCharacterVisible: boolean;
    nameTagsVisible: boolean;
}

interface ClassDesigner {
    activeClassDeviceId: string;
    lastActivatedClassDeviceId: string;
    lastClassDeviceActivationId: number;
}

interface Context {
    cursorIsOverCharacterId: string;
    __devicesUnderCursor: any[];
    __wiresUnderCursor: Set<any>;
}

interface CustomAssets {
    currentData: any;
    currentIcon: any;
    currentId: any;
    currentName: any;
    currentOptionId: any;
    isUIOpen: boolean;
    openOptionId: any;
    pendingDeleteId: any;
    showDeleteConfirm: boolean;
}

interface DeviceUI {
    current: { deviceId: string; props: any };
    desiredOpenDeviceId: any;
    serverVersionOpenDeviceId: string;
}

interface EditingDevice {
    currentlyEditedDevice: any;
    currentlyEditedGridId: string;
    currentlySortedDeviceId: string;
    screen: string;
    sortingState: any[];
    usingMultiselect: boolean;
    visualEditing: any;
}

interface EditingPreferences {
    cameraZoom: number;
    movementSpeed: any;
    phase: any;
    showGrid: any;
    topDownControlsActive: boolean;
}

interface Editing {
    device: EditingDevice;
    preferences: EditingPreferences;
    wire: { currentlyEditedWireId: string };
}

interface Health {
    fragility: number;
    health: number;
    lives: number;
    maxHealth: number;
    maxShield: number;
    shield: number;
}

interface Interactives {
    deviceId: string;
    info: any;
}

interface InteractiveSlot {
    clipSize: number;
    count: number;
    currentClip: number;
    durability: number;
    itemId: string;
    waiting: boolean;
    waitingEndTime: number;
    waitingStartTime: number;
}

interface Inventory {
    activeInteractiveSlot: number;
    alertFeed: any;
    alertsFeed: any[];
    currentWaitingEndTime: number;
    infiniteAmmo: boolean;
    interactiveSlotErrorMessageTimeouts: Map<any, any>;
    interactiveSlotErrorMessages: Map<any, any>;
    interactiveSlots: Map<string, InteractiveSlot>;
    interactiveSlotsOrder: number[];
    isCurrentWaitingSoundForItem: boolean;
    lastShotsTimestamps: Map<any, any>;
    maxSlots: number;
    slots: Map<any, any>;
}

interface MobileControls {
    left: boolean;
    right: boolean;
    up: boolean;
}

interface Mood {
    activeDeviceId: string;
    vignetteActive: boolean;
    vignetteStrength: number;
}

interface NonDismissMessage {
    description: string;
    title: string;
}

interface Removing {
    deviceIdToRemove: any;
    removingMode:string;
    removingTilesEraserSize: number;
    removingTilesLayer: number;
    removingTilesMode: string;
    tilesToRemove: any[];
    wireIdToRemove: any;
}

interface Spectating {
    id: string;
    name: string;
    shuffle: boolean;
}

interface Xp {
    additionTimeouts: Map<any, any>;
    additions: any[];
    showingLevelUp: boolean;
}

interface ZoneDropOverrides {
    allowItemDrop: boolean;
    allowResourceDrop: boolean;
    allowWeaponDrop: boolean;
}

interface Me {
    adding: Adding;
    cinematicMode: CinematicMode;
    classDesigner: ClassDesigner;
    completedInitialPlacement: boolean;
    context: Context;
    currentAction: string;
    customAssets: CustomAssets;
    deviceUI: DeviceUI;
    editing: Editing;
    gotKicked: boolean;
    health: Health;
    interactives: Interactives;
    inventory: Inventory;
    isRespawning: boolean;
    mobileControls: MobileControls;
    mood: Mood;
    movementSpeed: number;
    myTeam: string;
    nonDismissMessage: NonDismissMessage;
    phase: boolean;
    preferences: { startGameWithMode: string };
    properties: Map<string, any>;
    removing: Removing;
    roleLevel: number;
    spawnPosition: { x: number; y: number };
    spectating: Spectating;
    teleportCount: number;
    unredeemeedXP: number;
    xp: Xp;
    zoneDropOverrides: ZoneDropOverrides;
}

interface Widget {
    id: string;
    placement: string;
    statName: string;
    statValue: number;
    type: string;
    y: number;
}

interface GameSession {
    callToAction: any;
    countdownEnd: number;
    phase: string;
    resultsEnd: number;
    widgets: { widgets: Widget[] };
}

interface Session {
    allowGoogleTranslate: boolean;
    amIGameOwner: boolean;
    canAddGameTime: boolean;
    cosmosBlocked: boolean;
    customTeams: { characterToTeamMap: Map<any, any> };
    duringTransition: boolean;
    gameClockDuration: string;
    gameOwnerId: string;
    gameSession: GameSession;
    gameTime: number;
    gameTimeLastUpdateAt: number;
    globalPermissions: Permissions;
    loadingPhase: boolean;
    mapCreatorRoleLevel: number;
    mapStyle: string;
    modeType: string;
    ownerRole: string;
    phase: string;
    phaseChangedAt: number;
    version: string;
}

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

interface World {
    customAssets: { customAssets: Map<any, any> };
    devices: Devices;
    height: number;
    width: number;
    mapOptionsJSON: string;
    terrain: Terrain;
    wires: { wires: Map<any, any> };
}

interface Loading {
    completedInitialLoad: boolean;
    loadedInitialDevices: boolean;
    loadedInitialTerrain: boolean;
    percentageAssetsLoaded: number;
}

interface ActivityFeed {
    feedItems: any[];
}

interface Assignment {
    hasSavedProgress: boolean;
    objective: string;
    percentageComplete: number;
}

interface Editing {
    accessPoints: Map<any, any>;
    gridSnap: number;
    showMemoryBarAtAllTimes: boolean;
}

interface Hooks {
    hookJSON: string;
}

interface Matchmaker {
    gameCode: string;
}

interface Network {
    attemptingToConnect: boolean;
    attemptingToReconnect: boolean;
    authId: string;
    client: any;
    clientConnectionString: string;
    error: any;
    errorFindingServerForGame: boolean;
    errorJoiningRoom: boolean;
    failedToReconnect: boolean;
    findingServerForGame: boolean;
    hasJoinedRoom: boolean;
    isOffline: boolean;
    isUpToDateWithPingPong: boolean;
    joinedRoom: boolean;
    phaseBeforeReconnect: any;
    ping: number;
    room: any;
    roomIntentErrorMessage: string;
    syncingAfterReconnection: boolean;
}

interface Scene {
    currentScene: string;
    gpuTier: number;
    isCursorOverCanvas: boolean;
}

export interface StoresType {
    activityFeed: ActivityFeed;
    assignment: Assignment;
    characters: any;
    editing: Editing;
    gui: any;
    hooks: Hooks;
    loading: Loading;
    matchmaker: Matchmaker;
    me: Me;
    memorySystem: any;
    network: Network;
    phaser: any;
    scene: Scene;
    session: Session;
    teams: any;
    world: World;
    worldOptions: any;
}

type Suggestion<T> = { [K in keyof T]: T[K] extends object ? Suggestion<T[K]> : T[K] } & { [key: string | number | symbol]: any };

/** The stores type is very incomplete and is not guaranteed to be accurate */
export type Stores = Suggestion<StoresType>;