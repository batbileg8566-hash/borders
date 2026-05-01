import { Good, BorderCrossing, PortGoodsMatrix } from "./types";

export const GOODS: Good[] = [
  { id: 'plant', icon: '🌱', name: 'Ургамал', sources: { import: 'ЗГ-ын 2003.07.15 №173 тогтоол (Нэг хэсэг — импорт)', export: 'ЗГ-ын 2003.07.15 №173 тогтоол (Гурав, Зургаа хэсэг — экспорт)' }, detail: 'Ургамлын үр, үрслэг, суулгац импорт/экспорт. Нэмэлт өөрчлөлт: 2010 №22, 2014 №190, 2015 №194.' },
  { id: 'animal', icon: '🐄', name: 'Мал, амьтан', sources: { import: 'ЗГ-ын 2003.07.15 №173 тогтоол (Хоёр хэсэг — импорт)', export: 'ЗГ-ын 2003.07.15 №173 тогтоол (Гурав, Зургаа хэсэг — экспорт)' }, detail: 'Мал, амьтан болон үржлийн мал импорт/экспорт. Бичигт боомтоор зөвхөн үржлийн адуу нэвтрүүлнэ. Нэмэлт: 2015 №461.' },
  { id: 'meat', icon: '🥩', name: 'Түүхий мах', sources: { import: 'ЗГ-ын 2003.07.15 №173 тогтоол (Тав хэсэг — импорт)', export: 'ЗГ-ын 2003.07.15 №173 тогтоол (Дөрөв хэсэг — экспорт)' }, detail: 'Түүхий мах болон дайвар бүтээгдэхүүн. Импорт: 8 үндсэн боомт. Экспорт: 20 боомт (хамгийн өргөн).' },
  { id: 'gmo', icon: '🧪', name: 'ГМО', sources: { import: 'ЗГ-ын 2010 №158 тогтоол', export: 'ЗГ-ын 2010 №158 тогтоол' }, detail: 'Хувиргасан амьд организмыг зөвхөн "Чингис хаан ОУНБ"-ээр оруулна. Тусгай тээвэрлэлт шаардсан, түргэн муудах онцлогтой.' },
  { id: 'medicine', icon: '💊', name: 'Эм', sources: { import: 'ЗГ-ын 2011 №73 тогтоол', export: 'ЗГ-ын 2011 №73 тогтоол' }, detail: 'Эм, эмнэлгийн хэрэгсэл импорт/экспорт. Үндсэн 6 боомт. Нэмэлт өөрчлөлт: 2021 №239, 2021 №342.' },
  { id: 'chemical', icon: '☣️', name: 'Хорт бодис', sources: { import: 'ЗГ-ын 2006 №296 тогтоол', export: 'ЗГ-ын 2006 №296 тогтоол' }, detail: 'Химийн хорт ба аюултай бодис нэвтрүүлэх 7 боомт. Нэмэлт: 2010 №203 (Гашуунсухайтыг нэмсэн). Бичигт нэрлэгдсэн ч "нөхцөл бүрдээгүй".' },
  { id: 'pesticide', icon: '🌾', name: 'Хортон бодис', sources: { import: 'ЗГ-ын 2011 №146 тогтоол', export: 'ЗГ-ын 2011 №146 тогтоол' }, detail: 'Ургамал хамгаалах бодис, бордоо нэвтрүүлэх. Жилд 1 удаа (5 сарын 1-нээс 6 сарын 1) хүртэл хугацаанд нэвтрүүлнэ.' },
  { id: 'explosive', icon: '💥', name: 'Тэсрэх бодис', sources: { import: 'ЗГ-ын 2006.06.28 №149 тогтоол', export: 'ЗГ-ын 2006.06.28 №149 тогтоол' }, detail: 'Тэсэрч дэлбэрэх бодис ба пиротехникийн хэрэгсэл — 6 боомт. Нэмэлт: 2007 №66, 2010 №80. Замын-Үүд, Алтанбулагт зориулалтын агуулах баригдсан.' },
  { id: 'alcohol', icon: '🍺', name: 'Согтууруулах', sources: { import: 'ЗГ-ын 2023.04.19 №146 тогтоол (импорт)', export: 'ЗГ-ын 2023.04.19 №146 тогтоол (экспорт)' }, detail: 'Импорт: 4 боомт (Сүхбаатар, Алтанбулаг, Замын-Үүд, Чингис хаан). Шар айраг: + Цагааннуур, Эрээнцав. Экспорт: бүх боомтоор.' },
  { id: 'oil', icon: '⛽', name: 'Нефт', sources: { import: 'Онцгой албан татварын тухай хууль, 6.2 заалт', export: 'Онцгой албан татварын тухай хууль, 6.2 заалт' }, detail: 'Автобензин, дизелийн түлш импортлох боомтуудыг 4 бүлэгт ангилж татварын ялгавартай хэмжээ ногдуулна (Бүлэг 1: 215-221 мян₮ → Бүлэг 3: 750-850 мян₮ /тонн).' },
];

export const borderCrossings: BorderCrossing[] = [
  { 
    id: 'zamiin-uud', 
    name: 'Замын-Үүд', 
    region: 'Дорноговь', 
    direction: 'Зүүн (Хятад)', 
    lat: 43.7083, 
    lng: 111.9028, 
    ubDistance: 650, 
    aimagDistance: 210, 
    aimagLat: 44.8876,
    aimagLng: 110.1345, // Sainshand (Dornogovi)
    operationalStatus: "Олон улсын", 
    trafficStatus: "Ачаалалтай",
    transportTypes: ["Автозам", "Төмөр зам"],
    capacity: 1500,
    infrastructure: {
      totalArea: "18.6 га",
      details: ["Шалган нэвтрүүлэх цогцолбор шинэчлэгдсэн", "Ухаалаг гарц системтэй", "Хүчин чадал 5 дахин нэмэгдсэн"]
    }
  },
  { 
    id: 'altanbulag', 
    name: 'Алтанбулаг', 
    region: 'Сэлэнгэ', 
    direction: 'Хойд (Орос)', 
    lat: 50.3167, 
    lng: 106.5167, 
    ubDistance: 350, 
    aimagDistance: 23, 
    aimagLat: 50.2333,
    aimagLng: 106.2000, // Sukhbaatar (Selenge)
    operationalStatus: "Олон улсын", 
    trafficStatus: "Хэвийн",
    transportTypes: ["Автозам"],
    capacity: 800,
    infrastructure: {
      totalArea: "7.13 га",
      passengerZone: "3.37 га",
      cargoZone: "3.43 га",
      details: ["Дэд бүтцийн хэсэг: 0.33 га", "Олон улсын жишигт нийцсэн шинэ цогцолбор", "Зорчигч тээвэрлэх хүчин чадал: 2.22 га талбайтай"]
    }
  },
  { 
    id: 'bichigt', 
    name: 'Бичигт', 
    region: 'Сүхбаатар', 
    direction: 'Зүүн (Хятад)', 
    lat: 45.8, 
    lng: 116.1, 
    ubDistance: 850, 
    aimagDistance: 295, 
    operationalStatus: "Олон улсын", 
    trafficStatus: "Хэвийн",
    transportTypes: ["Автозам"],
    capacity: 500,
    infrastructure: {
      totalArea: "14 га",
      passengerZone: "4.97 га",
      cargoZone: "5.12 га",
      details: ["Хил хамгаалалтын бүс: 1.5 га", "Инженер хангамжийн бүс: 0.95 га", "Ачаа тээврийн цогцолбор: 5.12 га"]
    }
  },
  { 
    id: 'borshoo', 
    name: 'Боршоо', 
    region: 'Увс', 
    direction: 'Хойд (Орос)', 
    lat: 50.3, 
    lng: 92.4, 
    ubDistance: 1600, 
    aimagDistance: 124, 
    operationalStatus: "Олон улсын", 
    trafficStatus: "Хэвийн",
    transportTypes: ["Автозам"],
    capacity: 500,
    infrastructure: {
      totalArea: "10 га",
      passengerZone: "3232.0 м2 (Танхим)",
      details: ["Ерөнхий төлөвлөгөөний дагуу шинэчлэгдсэн", "Ачаа тээвэрлэх тусгай бүстэй"]
    }
  },
  { id: 'sukhbaatar', name: 'Сүхбаатар', region: 'Сэлэнгэ', direction: 'Хойд (Орос)', lat: 50.2333, lng: 106.2167, ubDistance: 310, aimagDistance: 0, operationalStatus: "Олон улсын", trafficStatus: "Хэвийн", transportTypes: ["Төмөр зам"], capacity: 1200 },
  { id: 'chinggis', name: 'Чингис хаан ОУНБ', region: 'Улаанбаатар', direction: 'Агаар', lat: 47.8431, lng: 106.7644, ubDistance: 0, aimagDistance: 0, operationalStatus: "Олон улсын", trafficStatus: "Хэвийн", transportTypes: ["Агаар"], capacity: 5000 },
  { id: 'tsagaannuur', name: 'Цагааннуур', region: 'Баян-Өлгий', direction: 'Баруун (Орос)', lat: 49.5, lng: 89.4, ubDistance: 1900, aimagDistance: 100, operationalStatus: "Олон улсын", trafficStatus: "Хэвийн", transportTypes: ["Автозам"], capacity: 600 },
  { id: 'ereentsav', name: 'Эрээнцав', region: 'Дорнод', direction: 'Зүүн (Орос)', lat: 49.6, lng: 115.1, ubDistance: 943, aimagDistance: 245, operationalStatus: "Олон улсын", trafficStatus: "Хэвийн", transportTypes: ["Төмөр зам"], capacity: 400 },
  { id: 'bulgan-hovd', name: 'Булган (Ховд)', region: 'Ховд', direction: 'Баруун (Хятад)', lat: 46.1, lng: 91.1, ubDistance: 1556, aimagDistance: 400, operationalStatus: "Олон улсын", trafficStatus: "Ачаалалтай", transportTypes: ["Автозам"], capacity: 700 },
  { id: 'gashuunsuhayt', name: 'Гашуунсухайт', region: 'Өмнөговь', direction: 'Урд (Хятад)', lat: 42.5833, lng: 107.5833, ubDistance: 800, aimagDistance: 342, operationalStatus: "Олон улсын", trafficStatus: "Ачаалалтай", transportTypes: ["Автозам", "AGV"], capacity: 2500 },
  { id: 'hangi', name: 'Ханги', region: 'Дорноговь', direction: 'Урд (Хятад)', lat: 42.9, lng: 110.1, ubDistance: 770, aimagDistance: 320, operationalStatus: "Хоёр талын", trafficStatus: "Ачаалалтай", transportTypes: ["Автозам"], capacity: 900 },
  { id: 'havirga', name: 'Хавирга', region: 'Дорнод', direction: 'Зүүн (Хятад)', lat: 47.5, lng: 115.1, ubDistance: 795, aimagDistance: 135, operationalStatus: "Хоёр талын", trafficStatus: "Хэвийн", transportTypes: ["Автозам"], capacity: 400 },
  { id: 'shiveehuren', name: 'Шивээхүрэн', region: 'Өмнөговь', direction: 'Урд (Хятад)', lat: 42.7, lng: 101.4, ubDistance: 955, aimagDistance: 350, operationalStatus: "Олон улсын", trafficStatus: "Квот тулсан", transportTypes: ["Автозам", "AGV"], capacity: 1100 },
  { id: 'ulhan', name: 'Ульхан', region: 'Дорнод', direction: 'Зүүн', lat: 49.2, lng: 112.5, ubDistance: 740, aimagDistance: 270, operationalStatus: "Хоёр талын", trafficStatus: "Хэвийн", transportTypes: ["Автозам"], capacity: 200 },
  { id: 'bayanhoshuu', name: 'Баянхошуу', region: 'Дорнод', direction: 'Зүүн (Хятад)', lat: 47.2, lng: 118.8, ubDistance: 1000, aimagDistance: 340, operationalStatus: "Хоёр талын", trafficStatus: "Хэвийн", transportTypes: ["Автозам"], capacity: 300 },
  { id: 'tes', name: 'Тэс', region: 'Увс', direction: 'Хойд', lat: 50.5, lng: 93.5, ubDistance: 1660, aimagDistance: 220, operationalStatus: "Хоёр талын", trafficStatus: "Хэвийн", transportTypes: ["Автозам"], capacity: 150 },
  { id: 'artssuuri', name: 'Арцсуурь', region: 'Завхан', direction: 'Хойд', lat: 50.3, lng: 95.8, ubDistance: 1185, aimagDistance: 385, operationalStatus: "Хоёр талын", trafficStatus: "Хэвийн", transportTypes: ["Автозам"], capacity: 200 },
  { id: 'burgastay', name: 'Бургастай', region: 'Говь-Алтай', direction: 'Урд', lat: 44.8, lng: 93.9, ubDistance: 1320, aimagDistance: 320, operationalStatus: "Хоёр талын", trafficStatus: "Хэвийн", transportTypes: ["Автозам"], capacity: 250 },
  { id: 'hanh', name: 'Ханх', region: 'Хөвсгөл', direction: 'Хойд', lat: 51.5, lng: 100.6, ubDistance: 1100, aimagDistance: 303, operationalStatus: "Түр ажиллагаатай", trafficStatus: "Хэвийн", transportTypes: ["Автозам"], capacity: 100 },
  { id: 'yarant', name: 'Ярант (Даян)', region: 'Ховд', direction: 'Баруун', lat: 46.7, lng: 90.9, ubDistance: 1890, aimagDistance: 212, operationalStatus: "Түр ажиллагаатай", trafficStatus: "Хэвийн", transportTypes: ["Автозам"], capacity: 200 },
  { id: 'baytag', name: 'Байтаг', region: 'Ховд', direction: 'Баруун', lat: 45.1, lng: 91.0, ubDistance: 1600, aimagDistance: 550, operationalStatus: "Түр ажиллагаатай", trafficStatus: "Хэвийн", transportTypes: ["Автозам"], capacity: 150 },
  { id: 'tsumber', name: 'Сүмбэр', region: 'Дорнод', direction: 'Зүүн', lat: 47.6, lng: 118.6, ubDistance: 1135, aimagDistance: 425, operationalStatus: "Олон улсын", trafficStatus: "Хэвийн", transportTypes: ["Автозам"], capacity: 100 },
  { id: 'tsagaandel', name: 'Цагаандэл-Уул', region: 'Өмнөговь', direction: 'Урд', lat: 41.583, lng: 105.0, ubDistance: 770, aimagDistance: 195, operationalStatus: "Түр ажиллагаатай", trafficStatus: "Хэвийн", transportTypes: ["Автозам"], capacity: 200 },
];

export const PORT_GOODS: PortGoodsMatrix = {
  'zamiin-uud': { plant: { import: 'ok', export: 'ok' }, animal: { import: 'ok', export: 'ok' }, meat: { import: 'ok', export: 'ok' }, medicine: { import: 'ok', export: 'ok' }, chemical: { import: 'ok', export: 'ok' }, explosive: { import: 'ok', export: 'ok' }, alcohol: { import: 'ok', export: 'ok' }, oil: { import: 'ok', export: 'ok' } },
  'altanbulag': { plant: { import: 'ok', export: 'ok' }, animal: { import: 'ok', export: 'ok' }, meat: { import: 'ok', export: 'ok' }, medicine: { import: 'ok', export: 'ok' }, chemical: { import: 'ok', export: 'ok' }, explosive: { import: 'ok', export: 'ok' }, alcohol: { import: 'ok', export: 'ok' }, oil: { import: 'ok', export: 'ok' } },
  'sukhbaatar': { plant: { import: 'ok', export: 'ok' }, animal: { import: 'ok', export: 'ok' }, meat: { import: 'ok', export: 'ok' }, medicine: { import: 'ok', export: 'ok' }, chemical: { import: 'ok', export: 'ok' }, explosive: { import: 'ok', export: 'ok' }, alcohol: { import: 'ok', export: 'ok' }, oil: { import: 'ok', export: 'ok' } },
  'chinggis': { plant: { import: 'ok', export: 'ok' }, animal: { import: 'ok', export: 'ok' }, meat: { import: 'ok', export: 'ok' }, gmo: { import: 'ok', export: 'ok' }, medicine: { import: 'ok', export: 'ok' }, chemical: { import: 'ok', export: 'ok' }, alcohol: { import: 'ok', export: 'ok' } },
  'tsagaannuur': { plant: { import: 'ok', export: 'warn' }, animal: { import: 'ok', export: 'warn' }, meat: { import: 'ok', export: 'ok' }, medicine: { import: 'warn', export: 'warn' }, chemical: { import: 'warn', export: 'warn' }, pesticide: { import: 'ok', export: 'ok' }, alcohol: { import: 'ok', export: 'ok' }, oil: { import: 'ok', export: 'ok' } },
  'ereentsav': { plant: { import: 'ok', export: 'warn' }, animal: { import: 'ok', export: 'warn' }, meat: { import: 'ok', export: 'ok' }, medicine: { import: 'warn', export: 'warn' }, alcohol: { import: 'ok', export: 'ok' }, oil: { import: 'ok', export: 'ok' } },
  'borshoo': { plant: { import: 'ok', export: 'ok' }, animal: { import: 'ok', export: 'ok' }, meat: { import: 'warn', export: 'ok' }, medicine: { import: 'warn', export: 'warn' }, pesticide: { import: 'ok', export: 'ok' }, oil: { import: 'ok', export: 'ok' } },
  'bulgan-hovd': { plant: { import: 'ok', export: 'warn' }, animal: { import: 'ok', export: 'warn' }, meat: { import: 'warn', export: 'ok' }, medicine: { import: 'warn', export: 'warn' }, chemical: { import: 'warn', export: 'warn' }, pesticide: { import: 'ok', export: 'ok' }, oil: { import: 'crit', export: 'crit' } },
  'gashuunsuhayt': { plant: { import: 'warn', export: 'warn' }, animal: { import: 'warn', export: 'warn' }, meat: { import: 'warn', export: 'ok' }, medicine: { import: 'ok', export: 'ok' }, chemical: { import: 'ok', export: 'ok' }, explosive: { import: 'ok', export: 'ok' }, oil: { import: 'ok', export: 'ok' } },
  'hangi': { plant: { import: 'warn', export: 'warn' }, animal: { import: 'warn', export: 'warn' }, meat: { import: 'warn', export: 'ok' }, medicine: { import: 'ok', export: 'ok' }, oil: { import: 'crit', export: 'crit' } },
  'bichigt': { plant: { import: 'warn', export: 'ok' }, animal: { import: 'ok', export: 'ok' }, meat: { import: 'ok', export: 'ok' }, chemical: { import: 'ok', export: 'ok' }, explosive: { import: 'ok', export: 'ok' }, oil: { import: 'ok', export: 'ok' } },
  'havirga': { plant: { import: 'warn', export: 'ok' }, animal: { import: 'ok', export: 'ok' }, meat: { import: 'warn', export: 'ok' }, medicine: { import: 'warn', export: 'warn' }, chemical: { import: 'warn', export: 'warn' }, explosive: { import: 'warn', export: 'warn' }, pesticide: { import: 'ok', export: 'ok' }, oil: { import: 'ok', export: 'ok' } },
  'shiveehuren': { plant: { import: 'warn', export: 'warn' }, animal: { import: 'warn', export: 'warn' }, meat: { import: 'warn', export: 'ok' }, medicine: { import: 'warn', export: 'warn' }, chemical: { import: 'warn', export: 'warn' }, oil: { import: 'ok', export: 'ok' } },
  'ulhan': { plant: { import: 'warn', export: 'warn' }, animal: { import: 'warn', export: 'warn' }, meat: { export: 'ok' }, oil: { import: 'ok', export: 'ok' } },
  'bayanhoshuu': { plant: { import: 'ok', export: 'ok' }, animal: { import: 'warn', export: 'warn' }, meat: { import: 'warn', export: 'ok' }, oil: { import: 'ok', export: 'ok' } },
  'tes': { plant: { import: 'ok', export: 'ok' }, animal: { import: 'ok', export: 'ok' }, meat: { export: 'ok' }, oil: { import: 'ok', export: 'ok' } },
  'artssuuri': { plant: { import: 'ok', export: 'ok' }, animal: { import: 'ok', export: 'ok' }, meat: { export: 'ok' }, oil: { import: 'ok', export: 'ok' } },
  'burgastay': { plant: { import: 'warn', export: 'warn' }, animal: { import: 'warn', export: 'warn' }, meat: { import: 'warn', export: 'ok' }, oil: { import: 'ok', export: 'ok' } },
  'hanh': { meat: { export: 'ok' }, oil: { import: 'ok', export: 'ok' } },
  'yarant': { meat: { export: 'ok' }, oil: { import: 'crit', export: 'crit' } },
  'baytag': { meat: { export: 'ok' }, oil: { import: 'crit', export: 'crit' } },
  'tsumber': { meat: { export: 'ok' } },
  'tsagaandel': { meat: { export: 'ok' }, oil: { import: 'crit', export: 'crit' } },
};
