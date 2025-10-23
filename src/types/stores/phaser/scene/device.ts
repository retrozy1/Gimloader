import type { Vector } from "@dimforge/rapier2d-compat";
import type { DeviceOption } from "../../world";
import type Character from "../character";
import type Scene from "../scene";
import type { Types, Tweens } from "phaser";
import type { Rect, Circle, RectShort, CircleShort, Ellipse, RotatedRect, RotatedCircle } from "../../shapes";
import type { XY } from '$types/shared';

interface AppearanceVariation {
    device: Device;
    resetAppearance(): void;
    setPreviewAppearance(): void;
    setRemovalAppearance(): void;
}

interface BoundingBox {
    cachedBoundingBox: Rect;
    device: Device;
    hardcodedBoundingBox?: Rect;
    clearCached(): void;
    clearHardcoded(): void;
    getBoundingBox(): Rect;
    isHardcoded(): boolean;
    isInsideBoundingBox(x: number, y: number): boolean;
    setHardcoded(rect: Rect): void;
}

type DeviceCollider = RectShort | CircleShort | Ellipse;

type ColliderOptions = {
    device: Device;
    scene: Scene;
    angle: number;
} & DeviceCollider;

interface ColliderEntry {
    bodyId: string;
    options: ColliderOptions;
    device: Device;
    scene: Scene;
}

interface Colliders {
    add: {
        box(collider: RectShort): void;
        circle(collider: CircleShort): void;
        ellipse(collider: Ellipse): void;
    }
    device: Device;
    list: ColliderEntry[];
    createOptions(collider: DeviceCollider): ColliderOptions;
    destroy(): void;
    forEach(callback: (collider: DeviceCollider) => void): void;
    hideDebug(): void;
    showDebug(): void;
}

interface UpdateCullOptions {
    mainCharacter: Character;
    isPhase: boolean;
    insideView: boolean;
}

interface Cull {
    device: Device;
    ignoresCull: boolean;
    isInsideView: boolean;
    margin: number;
    wasInsideView: boolean;
    getMargin(): number;
    ignoreCulling(): void;
    setMargin(margin: number): void;
    setOnEnterViewCallback(callback: () => void): void;
    setOnLeaveViewCallback(callback: () => void): void;
    onEnterViewCallback?(): void;
    onLeaveViewCallback?(): void;
    updateCull(options: UpdateCullOptions): void;
}

interface DeviceUI {
    device: Device;
    close(): void;
    open(options: Record<string, any>): void;
    update(options: Record<string, any>): void;
}

interface DeviceInput {
    device: Device;
    enabled: boolean;
    hasKeyListeners: boolean;
    isCurrentlyUnderMouse: boolean;
    addDeviceToCursorUnderList(): void;
    createKeyListeners(): void;
    cutCopyHandler(action: string): void;
    disable(): void;
    dispose(): void;
    disposeKeyListeners(): void;
    enable(): void;
    partIsNoLongerUnderMouse(): void;
    partIsUnderMouse(): void;
    removeDeviceFromCursorUnderList(): void;
}

interface InteractiveZones {
    add: {
        circle(zone: CircleShort): void;
        rect(zone: Rect): void;
    }
    canInteractThroughColliders: boolean;
    device: Device;
    forceDisabled: boolean;
    zones: (CircleShort | Rect)[];
    contains(x: number, y: number): boolean;
    destroy(): void;
    getCanInteractThroughColliders(): boolean;
    getInfo(): any;
    getMaxDistance(x: number, y: number): number;
    isInteractive(): boolean;
    onPlayerCanInteract(): void;
    onPlayerCantInteractAnyMore(): void;
    setCanInteractThroughColliders(canInteract: boolean): void;
    setForceDisabled(forceDisabled: boolean): void;
    setInfo(info: any): void;
}

interface VisualEditingBox {
    width: number;
    height: number;
    angle: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    keepRatio: boolean;
    rotable: boolean;
    onChange(value: RotatedRect): void;
}

interface VisualEditingCircle {
    angle: number;
    rotable: boolean;
    radius: number;
    minRadius: number;
    maxRadius: number;
    onChange(value: RotatedCircle): void;
}

interface VisualEditing {
    add: {
        box(options: VisualEditingBox): void;
        circle(options: VisualEditingCircle): void;
    }
    device: Device;
    isActive: boolean;
    shapes: (VisualEditingBox | VisualEditingCircle)[];
    clear(): void;
}

interface ShadowOptions extends XY {
    r1: number;
    r2: number;
    alphaMultip: number;
    depth: number;
}

interface Shadows {
    device: Device;
    list: ShadowOptions[];
    add(options: ShadowOptions): void;
    destroy(): void;
    forEach(callback: (shadow: ShadowOptions) => void): void;
    hide(): void;
    show(): void;
}

interface Layers {
    depth: number;
    device: Device;
    layer: string;
    options: any;
}

interface WirePoints {
    device: Device;
    end: Vector;
    start: Vector;
    onPointChange(): void;
    setBoth(x: number, y: number): void;
}

interface DeviceTweens {
    list: Tweens.Tween[];
    device: Device;
    add(config: Types.Tweens.TweenBuilderConfig): Tweens.Tween;
    destroy(): void;
}

interface DeviceProjectiles {
    device: Device;
    addToDynamicDevices(): void;
    collidesWithProjectile(object: Circle): boolean;
    onClientPredictedHit(position: Vector): void;
    removeFromDynamicDevices(): void;
    setDynamic(dynamic: boolean): void;
}

interface BaseDevice extends XY {
    isPreview: boolean;
    placedByClient: boolean;
    isDestroyed: boolean;
    forceUseMyState: boolean;
    options: Record<string, any>;
    state: Record<string, any>;
    prevState: Record<string, any>;
    name: string;
    id: string;
    scene: Scene;
    deviceOption: DeviceOption;
    visualEditing: VisualEditing;
    shadows: Shadows;
    input: DeviceInput;
    parts: any;
    cull: Cull;
    boundingBox: BoundingBox;
    appearanceVariation: AppearanceVariation;
    colliders: Colliders;
    interactiveZones: InteractiveZones;
    deviceUI: DeviceUI;
    layers: Layers;
    wirePoints: WirePoints;
    tweens: DeviceTweens;
    projectiles: DeviceProjectiles;
    sensors: any;
    onHide: (() => void) | null;
    onShow: (() => void) | null;
    onUpdate: (() => void) | null;
    initialStateProcessing(state: Record<string, any>): Record<string, any>;
    getMaxDepth(): number;
    onStateUpdateFromServer(key: string, value: any): void;
    getRealKey(key: string): string;
    onPostUpdate(): void;
    onInit(): void;
    onMessage(message: { key: string, data: any }): void;
    onStateChange(key: string): void;
    onDestroy(options: { isBeingReplaced: boolean }): void;
    sendToServerDevice(key: string, data: any): void;
    openDeviceUI(): void;
    checkIfCollidersEnabled(): boolean;
    destroy(options: { isBeingReplaced: boolean }): void;
}

export type Device = BaseDevice & { [key: string]: any };