import type { XY } from '$types/shared';

export interface Rect extends XY {
    width: number;
    height: number;
}

export interface RotatedRect extends Rect {
    angle: number;
}

export interface Circle extends XY {
    radius: number;
}

export interface RotatedCircle extends Circle {
    angle: number;
}

export interface Ellipse extends XY {
    r1: number;
    r2: number;
}

export interface RotatedEllipse extends Ellipse {
    angle: number;
}

export interface RectShort extends XY {
    w: number;
    h: number;
}

export interface RotatedRectShort extends RectShort {
    angle: number;
}

export interface CircleShort extends XY {
    r: number;
}