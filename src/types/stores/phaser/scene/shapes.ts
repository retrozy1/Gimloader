export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Circle {
    x: number;
    y: number;
    radius: number;
}

export interface BoxCollider {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface CircleCollider {
    x: number;
    y: number;
    r: number;
}

export interface EllipseCollider {
    x: number;
    y: number;
    r1: number;
    r2: number;
}

export type Collider = BoxCollider | CircleCollider | EllipseCollider;