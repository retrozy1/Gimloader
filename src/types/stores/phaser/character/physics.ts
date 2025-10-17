import type Scene from '../scene';
import type Character from './character';
import type { Collider, ColliderDesc, RigidBody, RigidBodyDesc, Vector } from "@dimforge/rapier2d-compat";

interface Jump {
    actuallyJumped: boolean;
    isJumping: boolean;
    jumpCounter: number;
    jumpTicks: number;
    jumpsLeft: number;
    xVelocityAtJumpStart: number;
}

interface MovementState {
    accelerationTicks: number;
    direction: string;
    xVelocity: number;
}

interface PhysicsState {
    forces: any[];
    gravity: number;
    grounded: boolean;
    groundedTicks: number;
    jump: Jump;
    lastGroundedAngle: number;
    movement: MovementState;
    velocity: Vector;
}

interface Input {
    _jumpKeyPressed: boolean;
    activeClassDeviceId: string;
    angle: null | number;
    ignoredStaticBodies: Set<any>;
    ignoredTileBodies: Set<any>;
    jump: boolean;
    projectileHitForcesQueue: Set<any>;
}

interface Bodies {
    character: Character;
    collider: Collider;
    colliderDesc: ColliderDesc;
    rigidBody: RigidBody;
    rigidBodyDesc: RigidBodyDesc;
}

export default interface Physics {
    character: Character;
    currentPacketId: number;
    destroy: () => void;
    frameInputsHistory: Map<number, Input>;
    getBody: () => Bodies;
    justAppliedProjectileHitForces: Set<any>;
    lastClassDeviceActivationId: number;
    lastPacketSent: number[];
    lastSentClassDeviceActivationId: number;
    lastSentTerrainUpdateId: number;
    lastTerrainUpdateId: number;
    newlyAddedTileBodies: Set<any>;
    phase: boolean;
    physicsBodyId: string;
    postUpdate: any;
    preUpdate: any;
    prevState: PhysicsState;
    projectileHitForcesHistory: Map<any, any>;
    projectileHitForcesQueue: Set<any>;
    scene: Scene;
    sendToServer: any;
    setServerPosition: any;
    setupBody: any;
    state: PhysicsState;
    tickInput: Input;
    updateDebugGraphics: any;
}