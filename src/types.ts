export type BorderStatus = "Хэвийн" | "Ачаалалтай" | "Квот тулсан";
export type GoodStatus = "ok" | "warn" | "crit";
export type Direction = "import" | "export";

export interface Infrastructure {
  totalArea?: string;
  passengerZone?: string;
  cargoZone?: string;
  details: string[];
}

export interface Good {
  id: string;
  icon: string;
  name: string;
  sources: {
    import: string;
    export: string;
  };
  detail: string;
}

export interface BorderCrossing {
  id: string;
  name: string;
  region: string;
  direction: string;
  lat: number;
  lng: number;
  ubDistance: number;
  aimagDistance: number;
  status: BorderStatus;
  capacity: number;
  infrastructure?: Infrastructure;
}

export type PortGoodsMatrix = Record<string, Record<string, { import?: GoodStatus; export?: GoodStatus }>>;
