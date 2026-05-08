import { BorderCrossing } from "../types";

export const BONDED_ZONES: BorderCrossing[] = [
  {
    id: 'bonded-warehouse-1',
    name: 'УБ-1 - Баталгаат агуулах',
    region: 'Улаанбаатар',
    direction: 'Дотоод',
    category: 'Баталгаат бүс',
    subCategory: 'Гаалийн баталгаат агуулах',
    lat: 47.95,
    lng: 106.80,
    ubDistance: 10,
    aimagDistance: 0,
    operationalStatus: 'Олон улсын',
    trafficStatus: 'Хэвийн',
    transportTypes: ['Автозам'],
    capacity: 1000,
    legalImports: [],
    legalExports: []
  },
  {
    id: 'duty-free-1',
    name: 'Чингис Хаан - Татваргүй барааны дэлгүүр',
    region: 'Улаанбаатар',
    direction: 'Агаар',
    category: 'Баталгаат бүс',
    subCategory: 'Татваргүй барааны дэлгүүр',
    lat: 47.64,
    lng: 106.76,
    ubDistance: 50,
    aimagDistance: 0,
    operationalStatus: 'Олон улсын',
    trafficStatus: 'Хэвийн',
    transportTypes: ['Агаар'],
    capacity: 100,
    legalImports: [],
    legalExports: []
  },
];
