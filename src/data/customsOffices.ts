/**
 * Гаалийн газар, хороод ба тэдгээрийн харьяа нэгж (боомт, гүний гааль).
 * Байгууллагын бүтцийн нийтэд нээлттэй мэдээлэл. Тоног төхөөрөмжийн
 * бүртгэл өөрөө энд биш, Supabase-д зөвхөн эрхтэй хэрэглэгчид хадгалагдана.
 *
 * `units` — тухайн газрын харьяалах нэгжийн id (ports.ts, deepCustoms.ts).
 * Нэгж нэгээс олон байвал тоног төхөөрөмжийг боомт тус бүрт хуваарилах
 * хүртэл газрын түвшинд харуулна.
 */
export interface CustomsOffice {
  code: string;
  name: string;
  units: string[];
}

export const CUSTOMS_OFFICES: CustomsOffice[] = [
  { code: "ЗҮГГ", name: "Замын-Үүд дэх гаалийн газар", units: ["zamiin-uud"] },
  { code: "ЧХОУНБГГ", name: "Чингис хаан олон улсын нисэх буудал дахь гаалийн газар", units: ["chinggis-khaan"] },
  { code: "ШХГГ", name: "Шивээхүрэн дэх гаалийн газар", units: ["shiveehuren"] },
  { code: "ГСГГ", name: "Гашуунсухайт дахь гаалийн газар", units: ["gashuunsuhayt"] },
  { code: "ХАГГ", name: "Ханги дахь гаалийн газар", units: ["hangi"] },
  { code: "БИГГ", name: "Сүхбаатар аймгийн Бичигт дэх гаалийн газар", units: ["bichigt"] },
  { code: "СЭГГ", name: "Сэлэнгэ аймаг дахь гаалийн газар", units: ["altanbulag", "sukhbaatar"] },
  { code: "УВГГ", name: "Увс аймаг дахь гаалийн газар", units: ["borshoo", "tes"] },
  { code: "ДОГГ", name: "Дорнод аймаг дахь гаалийн газар", units: ["bayanhoshuu", "tsumber", "ulhan", "ereentsav", "choibalsan-airport"] },
  { code: "БӨГГ", name: "Баян-Өлгий аймаг дахь гаалийн газар", units: ["tsagaannuur", "yarant"] },
  { code: "ХОГГ", name: "Ховд аймгийн Булган дахь гаалийн газар", units: ["bulgan"] },
  { code: "ГАГХ", name: "Говь-Алтай аймгийн Бургастай дахь гаалийн хороо", units: ["burgastay"] },
  { code: "ЗАГХ", name: "Завхан аймгийн Арцсуурь дахь гаалийн хороо", units: ["artssuuri"] },
  { code: "ХАГХ", name: "Хөвсгөл аймгийн Ханх дахь гаалийн хороо", units: ["hanh"] },
  { code: "УБГГ", name: "Улаанбаатар хот дахь гаалийн газар", units: ["ub-customs"] },
  { code: "УХШИГГ", name: "Улс хоорондын шуудан илгээмжийн гаалийн газар", units: ["mail-postal-customs"] },
  { code: "ДАГГ", name: "Дархан-Уул аймаг дахь гаалийн газар", units: ["darkhan-customs"] },
  { code: "ОГГ", name: "Орхон аймаг дахь гаалийн газар", units: ["orkhon-customs"] },
  { code: "СШГГ", name: "Сайншанд дахь гаалийн газар", units: ["sainshand-customs"] },
  { code: "ГЕГ", name: "Гаалийн ерөнхий газар (улсын хэмжээнд)", units: [] },
];

export const officeByCode = (code: string | null | undefined) => CUSTOMS_OFFICES.find((o) => o.code === code);

/** Нэгжийг харьяалах гаалийн газар (байхгүй бол undefined). */
export const officeForUnit = (unitId: string) => CUSTOMS_OFFICES.find((o) => o.units.includes(unitId));
