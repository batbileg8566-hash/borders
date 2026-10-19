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
  /**
   * Боомтын нэрээр нэрлэгдсэн газар бол түүний үндсэн нэгж. Бүртгэлийн
   * тоног төхөөрөмж автоматаар энэ нэгжид хамаарна. Аймгийн нэрээр
   * нэрлэгдсэн газарт байхгүй: тоног төхөөрөмж аймгийн түвшинд үлдэж,
   * админ боомт тус бүрт нөхөж оруулна.
   */
  primaryUnit?: string;
}

export const CUSTOMS_OFFICES: CustomsOffice[] = [
  { code: "ЗҮГГ", name: "Замын-Үүд дэх гаалийн газар", units: ["zamiin-uud"], primaryUnit: "zamiin-uud" },
  { code: "ЧХОУНБГГ", name: "Чингис хаан олон улсын нисэх буудал дахь гаалийн газар", units: ["chinggis-khaan"], primaryUnit: "chinggis-khaan" },
  { code: "ШХГГ", name: "Шивээхүрэн дэх гаалийн газар", units: ["shiveehuren"], primaryUnit: "shiveehuren" },
  { code: "ГСГГ", name: "Гашуунсухайт дахь гаалийн газар", units: ["gashuunsuhayt"], primaryUnit: "gashuunsuhayt" },
  { code: "ХАГГ", name: "Ханги дахь гаалийн газар", units: ["hangi"], primaryUnit: "hangi" },
  { code: "БИГГ", name: "Сүхбаатар аймгийн Бичигт дэх гаалийн газар", units: ["bichigt"], primaryUnit: "bichigt" },
  { code: "СЭГГ", name: "Сэлэнгэ аймаг дахь гаалийн газар", units: ["altanbulag", "sukhbaatar"] },
  { code: "УВГГ", name: "Увс аймаг дахь гаалийн газар", units: ["borshoo", "tes"] },
  { code: "ДОГГ", name: "Дорнод аймаг дахь гаалийн газар", units: ["bayanhoshuu", "tsumber", "ulhan", "ereentsav", "choibalsan-airport"] },
  { code: "БӨГГ", name: "Баян-Өлгий аймаг дахь гаалийн газар", units: ["tsagaannuur", "yarant"] },
  { code: "ӨГГ", name: "Өмнөговь аймаг дахь гаалийн газар", units: ["tsagaandel"] },
  { code: "ХОГГ", name: "Ховд аймгийн Булган дахь гаалийн газар", units: ["bulgan"], primaryUnit: "bulgan" },
  { code: "ГАГХ", name: "Говь-Алтай аймгийн Бургастай дахь гаалийн хороо", units: ["burgastay"], primaryUnit: "burgastay" },
  { code: "ЗАГХ", name: "Завхан аймгийн Арцсуурь дахь гаалийн хороо", units: ["artssuuri"], primaryUnit: "artssuuri" },
  { code: "ХАГХ", name: "Хөвсгөл аймгийн Ханх дахь гаалийн хороо", units: ["hanh", "murun-airport"], primaryUnit: "hanh" },
  { code: "УБГГ", name: "Улаанбаатар хот дахь гаалийн газар", units: ["ub-customs"], primaryUnit: "ub-customs" },
  { code: "УХШИГГ", name: "Улс хоорондын шуудан илгээмжийн гаалийн газар", units: ["mail-postal-customs"], primaryUnit: "mail-postal-customs" },
  { code: "ДАГГ", name: "Дархан-Уул аймаг дахь гаалийн газар", units: ["darkhan-customs"], primaryUnit: "darkhan-customs" },
  { code: "ОГГ", name: "Орхон аймаг дахь гаалийн газар", units: ["orkhon-customs"], primaryUnit: "orkhon-customs" },
  { code: "СШГГ", name: "Сайншанд дахь гаалийн газар", units: ["sainshand-customs"], primaryUnit: "sainshand-customs" },
  { code: "ГЕГ", name: "Гаалийн ерөнхий газар (улсын хэмжээнд)", units: [] },
];

export const officeByCode = (code: string | null | undefined) => CUSTOMS_OFFICES.find((o) => o.code === code);

/** Нэгжийг харьяалах гаалийн газар (байхгүй бол undefined). */
/** Тухайн газарт бүртгэлийн мөр хамаарах анхдагч боомт. */
export const defaultPortFor = (code: string) => officeByCode(code)?.primaryUnit ?? null;

export const officeForUnit = (unitId: string) => CUSTOMS_OFFICES.find((o) => o.units.includes(unitId));
