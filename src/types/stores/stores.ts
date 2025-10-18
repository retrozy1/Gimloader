import type Me from './me';
import type Session from './session';
import type GUI from './gui';
import type World from './world';
import type Characters from './characters';
import type MemorySystem from './memorySystem';
import type Phaser from './phaser/phaser';
import type WorldOptions from './worldOptions';

// Single-interface stores properties are in this file, everything else is in its own file

interface ActivityFeed {
    feedItems: {
        id: string;
        message: string;
    }[];
}

interface Assignment {
    hasSavedProgress: boolean;
    objective: string;
    percentageComplete: number;
}

interface EditingStore {
    accessPoints: Map<any, any>;
    gridSnap: number;
    showMemoryBarAtAllTimes: boolean;
}

interface Hooks {
    hookJSON: string;
}

interface Loading {
    completedInitialLoad: boolean;
    loadedInitialDevices: boolean;
    loadedInitialTerrain: boolean;
    percentageAssetsLoaded: number;
}

interface Matchmaker {
    gameCode: string;
}

interface NetworkStore {
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

interface SceneStore {
    currentScene: string;
    gpuTier: number;
    isCursorOverCanvas: boolean;
}

interface Team {
    characters: Map<number, string>;
    id: string;
    name: string;
    score: number;
}

interface Teams {
    teams: Map<string, Team>;
    updateCounter: number;
}

/** The stores type is incomplete and is not guaranteed to be accurate */
export interface Stores {
    activityFeed: ActivityFeed;
    assignment: Assignment;
    characters: Characters;
    editing: EditingStore;
    gui: GUI;
    hooks: Hooks;
    loading: Loading;
    matchmaker: Matchmaker;
    me: Me;
    memorySystem: MemorySystem;
    network: NetworkStore;
    phaser: Phaser;
    scene: SceneStore;
    session: Session;
    teams: Teams;
    world: World;
    worldOptions: WorldOptions;
}