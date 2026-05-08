import { BorderCrossing } from "../types";
import { PORTS } from "./ports";
import { DEEP_CUSTOMS } from "./deepCustoms";
import { CONTROL_ZONES } from "./controlZones";
import { BONDED_ZONES } from "./bondedZones";
import { FREE_ZONES } from "./freeZones";

export * from "./goods";
export * from "./regulations";
export * from "./ports";
export * from "./deepCustoms";
export * from "./controlZones";
export * from "./bondedZones";
export * from "./freeZones";

export const borderCrossings: BorderCrossing[] = [
  ...PORTS,
  ...DEEP_CUSTOMS,
  ...CONTROL_ZONES,
  ...BONDED_ZONES,
  ...FREE_ZONES
];
