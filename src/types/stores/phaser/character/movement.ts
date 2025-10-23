import type { XY } from '$types/shared';
import type Character from '../character';

interface Point {
    endTime: number;
    endX: number;
    endY: number;
    startTime: number;
    startX: number;
    startY: number;
    teleported: boolean;
    usedTeleported: boolean;
}

interface EndInfo extends XY {
    end: number;
    start: number;
}

export default interface Movement {
    character: Character;
    currentPoint: Point;
    currentTime: number;
    nonMainCharacterGrounded: boolean;
    pointMap: Point[];
    targetIsDirty: boolean;
    targetNonMainCharacterGrounded: boolean;
    targetX: number;
    targetY: number;
    teleportCount: number;
    teleported: boolean;
    getCurrentEndInfo(): EndInfo;
    moveToTargetPosition(): void;
    onMainCharacterTeleport(): void;
    postPhysicsUpdate(dt: number): void;
    setNonMainCharacterTargetGrounded(grounded: boolean): void;
    setTargetX(x: number): void;
    setTargetY(y: number): void;
    setTeleportCount(teleportCount: number): void;
    update(dt: number): void;
}