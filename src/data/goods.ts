import { Good } from "../types";

export const GOODS: Good[] = [
  { id: 'plant', icon: '🌱', name: 'Ургамлын үр, үрслэг, суулгац', sources: { import: 'ЗГ №173', export: 'ЗГ №190' }, detail: 'Ургамлын үр, үрслэг, суулгац нэвтрүүлэх.' },
  { id: 'animal', icon: '🐄', name: 'Мал, амьтан', sources: { import: 'ЗГ №173', export: 'ЗГ №173' }, detail: 'Мал, амьтан нэвтрүүлэх (цугт нь).' },
  { id: 'breeding_animal', icon: '🐎', name: 'Үржлийн мал', sources: { import: 'ЗГ №173', export: 'ЗГ №173' }, detail: 'Үржлийн мал импортлох, экспортлох.' },
  { id: 'embryo', icon: '🧬', name: 'Мал амьтны үр, хөврөл үр', sources: { import: 'ЗГ №173', export: 'ЗГ №173' }, detail: 'Мал амьтны үр, хөврөл үр, бичил биетний өсгөвөр, эмгэгт материал.' },
  { id: 'meat', icon: '🥩', name: 'Түүхий мах, дайвар бүтээгдэхүүн', sources: { import: 'ЗГ №173', export: 'ЗГ №173' }, detail: 'Түүхий мах болон дайвар бүтээгдэхүүн.' },
  { id: 'medicine', icon: '💊', name: 'Эм, эмнэлгийн хэрэгсэл', sources: { import: 'ЗГ №73', export: 'ЗГ №73' }, detail: 'Эм, эмнэлгийн хэрэгсэл.' },
  { id: 'chemical', icon: '☣️', name: 'Химийн хорт болон аюултай бодис', sources: { import: 'ЗГ №296', export: 'ЗГ №296' }, detail: 'Химийн хорт ба аюултай бодис.' },
  { id: 'explosive', icon: '💥', name: 'Тэсэрч дэлбэрэх бодис', sources: { import: 'ЗГ №215', export: 'ЗГ №215' }, detail: 'Тэсэрч дэлбэрэх бодис ба тэсэлгээний хэрэгсэл.' },
  { id: 'alcohol', icon: '🍺', name: 'Согтууруулах ундаа', sources: { import: 'ЗГ №146/2023', export: 'ЗГ №146/2023' }, detail: 'Бүх төрлийн согтууруулах ундаа.' },
  { id: 'pesticide', icon: '🌾', name: 'Ургамал хамгааллын бодис, бордоо', sources: { import: 'ЗГ №146/2011', export: 'ЗГ №146/2011' }, detail: 'Ургамал хамгааллын бодис, бордоо.' },
  { id: 'gmo', icon: '🧪', name: 'Хувиргасан амьд организм', sources: { import: 'ЗГ №158', export: 'ЗГ №158' }, detail: 'Хувиргасан амьд организм (ГМО).' },
  { id: 'oil', icon: '⛽', name: 'Газрын тос Parsons', sources: { import: 'Онцгой албан татвар', export: 'Онцгой албан татвар' }, detail: 'Автобензин, дизелийн түлш.' },
];
