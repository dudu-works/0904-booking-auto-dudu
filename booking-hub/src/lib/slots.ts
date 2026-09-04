export type SlotType = '오전' | '오후-1' | '오후-2';

export const SLOTS: SlotType[] = ['오전', '오후-1', '오후-2'];

export const NEED: { [key: string]: number } = {
  '서울': 1,
  '내부': 1,
  '경기': 2,
  '지방': 3,
};

export function requiredSlots(kind: string, wanted: SlotType[]): SlotType[] {
  if (!kind || wanted.length === 0) return [];

  const needCount = NEED[kind] || 1;

  if (needCount === 1) {
    return wanted;
  }

  if (needCount === 2) {
    const required = new Set<SlotType>();
    wanted.forEach((slot) => {
      required.add(slot);
      if (slot === '오전') {
        required.add('오후-1');
      } else if (slot === '오후-1') {
        required.add('오전');
        required.add('오후-2');
      } else if (slot === '오후-2') {
        required.add('오후-1');
      }
    });
    return Array.from(required);
  }

  if (needCount === 3) {
    return [...SLOTS];
  }

  return wanted;
}

export function occupied(date: string, bookings: any[]): Set<SlotType> {
  const occupiedSlots = new Set<SlotType>();

  bookings.forEach((booking) => {
    if (booking.date === date && booking.slot_assigned) {
      const slots = booking.slot_assigned.split(',') as SlotType[];
      slots.forEach((slot) => {
        if (SLOTS.includes(slot)) {
          occupiedSlots.add(slot);
        }
      });
    }
  });

  return occupiedSlots;
}
