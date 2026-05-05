export type OperationalStatus = "Олон улсын" | "Хоёр талын" | "Түр ажиллагаатай";
export type TrafficStatus = "Хэвийн" | "Ачаалалтай" | "Квот тулсан";
export type PortTransportType = "Автозам" | "Төмөр зам" | "AGV" | "Агаар";
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

export interface DevelopmentProject {
  projectName: string;
  progress: number; // 0 to 100
  budget: string;
  contractor?: string;
  description: string;
  imageUrl?: string;
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
  aimagLat?: number;
  aimagLng?: number;
  neighborPortName?: string;
  operationalStatus: OperationalStatus;
  trafficStatus: TrafficStatus;
  transportTypes: PortTransportType[];
  capacity: number;
  areaSize?: number; // Зам талбай (м.кв)
  staffGUAB?: number; // ГУАБ тоо
  staffGUB?: number; // ГУБ тоо
  labCapacity?: string; // Лабораторын хүчин чадал
  warehousesCount?: number; // Агуулахын тоо
  controlZonesCount?: number; // Хяналтын бүсийн тоо
  imageUrl?: string; // Боомтын зураг
  description?: string; // Дэлгэрэнгүй тайлбар
  infrastructure?: Infrastructure;
  hasLaboratory?: boolean;
  labCapabilities?: string[];
  development?: DevelopmentProject;
  legalImports: LegalGoodEntry[];
  legalExports: LegalGoodEntry[];
  proposedAdditions?: ProposedAddition[];
}

export type PortGoodsMatrix = Record<string, Record<string, { import?: GoodStatus; export?: GoodStatus }>>;

export interface LegalGoodEntry {
  goodId: string;            // matches GOODS[].id (e.g., 'plant', 'medicine')
  text: string;              // verbatim text from regulation
  resolutions: string[];     // e.g., ["ЗГ №173", "№194 нэмэлт"]
  conditions?: string;       // e.g., "зөвхөн үржлийн адуу", "жилд 1 удаа"
}

export interface ProposedAddition {
  goodId: string;
  text: string;
  targetResolution: string;  // e.g., "ЗГ №73-д нэмэх"
  proposalNote?: string;     // infrastructure note
}

export interface RegulationRef {
  number: string;
  fullName: string;
  date: string;
  amendments?: string[];
  legalUrl?: string;
  legalBasis?: string;
}
