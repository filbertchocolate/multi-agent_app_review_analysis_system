
export interface Point {
  x: number;
  y: number;
}

export interface Stone {
  x: number;
  y: number;
  size: number;
  points: Point[];
  opacity: number;
  rotation: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  baseVx: number;
  baseVy: number;
  blink: number;
  blinkSpeed: number;
}

export interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  active: boolean;
}

export enum AnalysisType {
  INSIGHT = 'INSIGHT',
  PRD = 'PRD'
}
