import { borderCrossings, GOODS, REGULATIONS } from "../data";

export interface ValidationError {
  type: 'missing_field' | 'duplicate_id' | 'swapped_coords' | 'other';
  message: string;
  item: string;
}

export function validateData(): ValidationError[] {
  const errors: ValidationError[] = [];
  const ids = new Set<string>();

  borderCrossings.forEach(port => {
    // Check duplicates
    if (ids.has(port.id)) {
      errors.push({ type: 'duplicate_id', item: port.name, message: `ID давхардсан: ${port.id}` });
    }
    ids.add(port.id);

    // Check missing critical fields
    if (!port.lat || !port.lng) {
      errors.push({ type: 'missing_field', item: port.name, message: 'Координат дутуу' });
    }

    // Check swapped coords (Lat should be ~41-52, Lng should be ~87-120)
    if (port.lat > 80 || port.lng < 60) {
      errors.push({ type: 'swapped_coords', item: port.name, message: `Координат солигдсон байж болзошгүй: Lat=${port.lat}, Lng=${port.lng}` });
    }

    // Check subCategory for Гүний гааль etc.
    const category = port.category || 'Боомт';
    if (category !== 'Боомт' && !port.subCategory) {
      errors.push({ type: 'missing_field', item: port.name, message: 'Дэд ангилал (subCategory) дутуу' });
    }
  });

  return errors;
}
