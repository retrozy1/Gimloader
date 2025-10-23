import type { Vector } from "@dimforge/rapier2d-compat";
import type Scene from "../scene";
import type { TickInput } from "../character/physics";
import type { GameObjects, Input } from "phaser";
import type { XY } from '$types/shared';

interface AimCursor extends XY {
    aimCursor: GameObjects.Sprite;
    aimCursorWorldPos: Vector;
    centerShiftX: number;
    centerShiftY: number;
    scene: Scene;
    update(): void;
}

interface Cursor {
    scene: Scene;
    createStateListeners(): void;
    updateCursor(): void;
}

interface PressedKeys {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
}

interface KeyboardState {
    isHoldingDown: boolean;
    isHoldingLeft: boolean;
    isHoldingRight: boolean;
    isHoldingUp: boolean;
    isHoldingSpace: boolean;
}

interface Keyboard {
    heldKeys: Set<string>;
    scene: Scene;
    state: KeyboardState;
    createListeners(): void;
    isKeyDown(key: number): boolean;
}

interface MovementPointer extends XY {
    id: string;
    downX: number;
    downY: number;
}

interface Mouse extends XY {
    clickListeners: Map<string, (pointer: Input.Pointer) => void>;
    downX: number;
    downY: number;
    isHoldingDown: boolean;
    movementPointer?: MovementPointer;
    scene: Scene;
    stopRunningClickHandlers: boolean;
    worldX: number;
    worldY: number;
    addClickListener(options: { callback: (pointer: Input.Pointer) => void}): () => void;
    pointerUpdate(pointer: Input.Pointer): void;
    removeClickListener(id: string): void;
    shouldBecomeMovementPointer(pointer: Input.Pointer): boolean;
}

export default interface InputManager {
    aimCursor: AimCursor;
    currentInput: TickInput;
    cursor: Cursor;
    isListeningForInput: boolean;
    jumpedSinceLastPhysicsFetch: boolean;
    keyboard: Keyboard;
    mouse: Mouse;
    physicsInputHandledBetweenUpdates: boolean;
    scene: Scene;
    getAimingDirection(): Vector;
    getInputAngle(): number | null;
    getKeys(): PressedKeys;
    getMouseWorldXY(): Vector;
    getPhysicsInput(): TickInput;
    refreshInput(): void;
    update(): void;
}