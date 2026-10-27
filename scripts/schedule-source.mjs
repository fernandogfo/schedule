// Days follow JavaScript getDay(): 0 = Sunday, 1 = Monday, ... 6 = Saturday.
// Times are UTC, matching the schedule data model used by the app.
export const scheduleEntries = [
  // 00:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Hasla 2 Rifts', startHour: 0, startMinute: 0, endHour: 0, endMinute: 30 },
  { daysOfWeek: [3], title: 'Black Dragon', startHour: 0, startMinute: 0, endHour: 1, endMinute: 0 },
  { daysOfWeek: [6], title: 'Siege Raid Apply', startHour: 0, startMinute: 0, endHour: 1, endMinute: 0 },
  { daysOfWeek: [1, 2, 4, 6], title: 'Red Dragon', startHour: 0, startMinute: 0, endHour: 1, endMinute: 0 },
  { daysOfWeek: [1, 3, 5, 0], title: 'Kadum', startHour: 0, startMinute: 0, endHour: 1, endMinute: 0 },
  { daysOfWeek: [2, 4, 6], title: 'Leviathan', startHour: 0, startMinute: 5, endHour: 1, endMinute: 5 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'CR', startHour: 0, startMinute: 20, endHour: 1, endMinute: 20 },
  { daysOfWeek: [3, 5, 0], title: 'Abyss Attack', startHour: 0, startMinute: 30, endHour: 1, endMinute: 30 },
  { daysOfWeek: [0, 1], title: 'Dimensional Raid', startHour: 0, startMinute: 30, endHour: 0, endMinute: 45 },

  // 01:00
  { daysOfWeek: [1, 4], title: 'DGS West Spawn', startHour: 1, startMinute: 0, endHour: 2, endMinute: 0 },
  { daysOfWeek: [2, 6], title: 'DGS East Spawn', startHour: 1, startMinute: 0, endHour: 2, endMinute: 0 },
  { daysOfWeek: [6], title: 'Castle Siege', startHour: 1, startMinute: 0, endHour: 2, endMinute: 0 },
  { daysOfWeek: [1, 3], title: 'Guardian Scramble', startHour: 1, startMinute: 0, endHour: 2, endMinute: 0 },
  { daysOfWeek: [4, 0], title: 'Garden Anthalon', startHour: 1, startMinute: 0, endHour: 2, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Garden War', startHour: 1, startMinute: 0, endHour: 2, endMinute: 50 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Lusca', startHour: 1, startMinute: 0, endHour: 2, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Wonderland Miraculous Races', startHour: 1, startMinute: 0, endHour: 1, endMinute: 15 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Exile Language Tutor', startHour: 1, startMinute: 10, endHour: 1, endMinute: 15 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'SGCR', startHour: 1, startMinute: 20, endHour: 2, endMinute: 20 },
  { daysOfWeek: [1, 6], title: 'Aragog', startHour: 1, startMinute: 30, endHour: 2, endMinute: 30 },
  { daysOfWeek: [1, 5], title: 'Charybdis', startHour: 1, startMinute: 30, endHour: 2, endMinute: 30 },
  { daysOfWeek: [2, 0], title: 'Akasch Quests', startHour: 1, startMinute: 36, endHour: 1, endMinute: 51 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Hiram Rift', startHour: 1, startMinute: 50, endHour: 3, endMinute: 50 },
  { daysOfWeek: [2, 0], title: 'Akasch Mobs', startHour: 1, startMinute: 51, endHour: 2, endMinute: 11 },

  // 02:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Hallowtide Festival', startHour: 2, startMinute: 0, endHour: 2, endMinute: 30 },
  { daysOfWeek: [2, 3, 4, 5, 6], title: 'Halcy', startHour: 2, startMinute: 0, endHour: 3, endMinute: 0 },
  { daysOfWeek: [0, 1], title: 'Dimensional Raid', startHour: 2, startMinute: 30, endHour: 2, endMinute: 45 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Evenbard', startHour: 2, startMinute: 0, endHour: 3, endMinute: 40 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'GR', startHour: 2, startMinute: 20, endHour: 3, endMinute: 30 },
  { daysOfWeek: [0, 1], title: 'Halcy', startHour: 2, startMinute: 30, endHour: 3, endMinute: 30 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Wonderland Boss', startHour: 2, startMinute: 30, endHour: 3, endMinute: 0 },
  { daysOfWeek: [4, 0], title: 'Sea Spirit General', startHour: 2, startMinute: 30, endHour: 3, endMinute: 30 },
  { daysOfWeek: [2, 6], title: 'Harbinger in Peace', startHour: 2, startMinute: 30, endHour: 3, endMinute: 30 },

  // 03:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'JMG', startHour: 3, startMinute: 20, endHour: 4, endMinute: 20 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Noryette Arena', startHour: 3, startMinute: 30, endHour: 4, endMinute: 30 },

  // 04:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Gweonid Lantern Festival', startHour: 4, startMinute: 0, endHour: 4, endMinute: 30 },
  { daysOfWeek: [1, 2, 3, 4, 5, 6], title: 'Daily Reset', startHour: 4, startMinute: 0, endHour: 4, endMinute: 5 },
  { daysOfWeek: [0], title: 'Weekly Reset', startHour: 4, startMinute: 0, endHour: 4, endMinute: 5 },
  { daysOfWeek: [0], title: 'Faction Activity Reset', startHour: 4, startMinute: 0, endHour: 4, endMinute: 20 },
  { daysOfWeek: [0], title: 'Hero Nui Reset', startHour: 4, startMinute: 0, endHour: 4, endMinute: 5 },
  { daysOfWeek: [6], title: 'MERCHANTS DAY(Land Packs)', startHour: 4, startMinute: 0, endHour: 28, endMinute: 0 },
  { daysOfWeek: [6, 2], title: 'FISHING DAY', startHour: 4, startMinute: 0, endHour: 28, endMinute: 0 },
  { daysOfWeek: [3], title: 'TREASURES HUNTER DAY', startHour: 4, startMinute: 0, endHour: 28, endMinute: 0 },
  { daysOfWeek: [3], title: 'Castle Transport', startHour: 4, startMinute: 0, endHour: 24, endMinute: 0 },
  { daysOfWeek: [1], title: 'MERCHANTS DAY(Onyx Packs)', startHour: 4, startMinute: 0, endHour: 28, endMinute: 0 },
  { daysOfWeek: [5], title: 'MERCHANTS DAY(Drag Ess Packs)', startHour: 4, startMinute: 0, endHour: 28, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'DS Ocleera Rift', startHour: 4, startMinute: 0, endHour: 4, endMinute: 35 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'CR', startHour: 4, startMinute: 20, endHour: 5, endMinute: 20 },

  // 05:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Garden War', startHour: 5, startMinute: 0, endHour: 6, endMinute: 50 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'DS War', startHour: 5, startMinute: 0, endHour: 7, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Exile Language Tutor', startHour: 5, startMinute: 10, endHour: 5, endMinute: 15 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'SGCR', startHour: 5, startMinute: 20, endHour: 6, endMinute: 20 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Hiram Rift', startHour: 5, startMinute: 50, endHour: 7, endMinute: 50 },

  // 06:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Hallowtide Festival', startHour: 6, startMinute: 0, endHour: 6, endMinute: 30 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Evenbard', startHour: 6, startMinute: 0, endHour: 7, endMinute: 40 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'GR', startHour: 6, startMinute: 20, endHour: 7, endMinute: 30 },

  // 07:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Wonderland Miraculous Races', startHour: 7, startMinute: 0, endHour: 7, endMinute: 15 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'JMG', startHour: 7, startMinute: 20, endHour: 8, endMinute: 20 },

  // 08:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'CR', startHour: 8, startMinute: 20, endHour: 9, endMinute: 20 },

  // 09:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Garden War', startHour: 9, startMinute: 0, endHour: 10, endMinute: 50 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Exile Language Tutor', startHour: 9, startMinute: 10, endHour: 9, endMinute: 15 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'SGCR', startHour: 9, startMinute: 20, endHour: 10, endMinute: 20 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Hiram Rift', startHour: 9, startMinute: 50, endHour: 11, endMinute: 50 },

  // 10:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Evenbard', startHour: 10, startMinute: 0, endHour: 11, endMinute: 40 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'GR', startHour: 10, startMinute: 20, endHour: 11, endMinute: 30 },
  { daysOfWeek: [6, 0], title: 'Dimensional Raid', startHour: 10, startMinute: 30, endHour: 10, endMinute: 45 },

  // 11:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'DS War', startHour: 11, startMinute: 0, endHour: 13, endMinute: 0 },
  { daysOfWeek: [2], title: 'Server Maintenance', startHour: 11, startMinute: 0, endHour: 12, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'JMG', startHour: 11, startMinute: 20, endHour: 12, endMinute: 20 },
  { daysOfWeek: [0, 1, 3, 5], title: 'Red Dragon', startHour: 11, startMinute: 30, endHour: 12, endMinute: 30 },
  { daysOfWeek: [0, 2, 4, 6], title: 'Kadum', startHour: 11, startMinute: 30, endHour: 12, endMinute: 30 },

  // 12:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Halcy', startHour: 12, startMinute: 0, endHour: 12, endMinute: 30 },
  { daysOfWeek: [5], title: 'Fall of Hiram', startHour: 12, startMinute: 0, endHour: 14, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'CR', startHour: 12, startMinute: 20, endHour: 13, endMinute: 20 },
  { daysOfWeek: [1, 6], title: 'Akasch Quests', startHour: 12, startMinute: 36, endHour: 12, endMinute: 51 },
  { daysOfWeek: [1, 6], title: 'Akasch Mobs', startHour: 12, startMinute: 51, endHour: 13, endMinute: 11 },

  // 13:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Garden War', startHour: 13, startMinute: 0, endHour: 14, endMinute: 50 },
  { daysOfWeek: [0, 2], title: 'Guardian Scramble', startHour: 13, startMinute: 0, endHour: 14, endMinute: 0 },
  { daysOfWeek: [0], title: 'Black Dragon', startHour: 13, startMinute: 0, endHour: 14, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Wonderland Miraculous Races', startHour: 13, startMinute: 0, endHour: 13, endMinute: 15 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Exile Language Tutor', startHour: 13, startMinute: 10, endHour: 13, endMinute: 15 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'SGCR', startHour: 13, startMinute: 20, endHour: 14, endMinute: 20 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Hiram Rift', startHour: 13, startMinute: 50, endHour: 15, endMinute: 50 },

  // 14:00
  { daysOfWeek: [6], title: 'GM Hide & Seek MAYBE', startHour: 14, startMinute: 0, endHour: 14, endMinute: 30 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Evenbard', startHour: 14, startMinute: 0, endHour: 15, endMinute: 40 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'GR', startHour: 14, startMinute: 20, endHour: 15, endMinute: 30 },
  { daysOfWeek: [0], title: 'Kraken', startHour: 14, startMinute: 30, endHour: 15, endMinute: 30 },

  // 15:00
  { daysOfWeek: [0, 1, 3, 5], title: 'Red Dragon', startHour: 15, startMinute: 0, endHour: 16, endMinute: 0 },
  { daysOfWeek: [0, 2, 4, 6], title: 'Kadum', startHour: 15, startMinute: 0, endHour: 16, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'JMG', startHour: 15, startMinute: 20, endHour: 16, endMinute: 20 },
  { daysOfWeek: [0, 5], title: 'Aragog', startHour: 15, startMinute: 30, endHour: 16, endMinute: 30 },

  // 16:00
  { daysOfWeek: [5], title: 'Siege Commander Apply', startHour: 16, startMinute: 0, endHour: 24, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Ayanad Merchant', startHour: 16, startMinute: 0, endHour: 22, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'DS Ocleera Rift', startHour: 16, startMinute: 0, endHour: 16, endMinute: 35 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'CR', startHour: 16, startMinute: 20, endHour: 17, endMinute: 20 },
  { daysOfWeek: [0, 6], title: 'Halcy', startHour: 16, startMinute: 30, endHour: 17, endMinute: 30 },

  // 17:00
  { daysOfWeek: [0], title: 'Garden Anthalon', startHour: 17, startMinute: 0, endHour: 18, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Garden War', startHour: 17, startMinute: 0, endHour: 18, endMinute: 50 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Hasla 1 Rift', startHour: 17, startMinute: 0, endHour: 17, endMinute: 30 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'DS War', startHour: 17, startMinute: 0, endHour: 19, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Exile Language Tutor', startHour: 17, startMinute: 10, endHour: 17, endMinute: 15 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'SGCR', startHour: 17, startMinute: 20, endHour: 18, endMinute: 20 },
  { daysOfWeek: [3, 6], title: 'Sea Spirit General', startHour: 17, startMinute: 30, endHour: 18, endMinute: 30 },
  { daysOfWeek: [1, 5], title: 'Harbinger in War', startHour: 17, startMinute: 30, endHour: 18, endMinute: 30 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Hiram Rift', startHour: 17, startMinute: 50, endHour: 19, endMinute: 50 },

  // 18:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Hallowtide Festival', startHour: 18, startMinute: 0, endHour: 18, endMinute: 30 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Gweonid Lantern Festival', startHour: 18, startMinute: 0, endHour: 18, endMinute: 30 },
  { daysOfWeek: [0], title: 'GM Raging Tank MAYBE', startHour: 18, startMinute: 0, endHour: 18, endMinute: 30 },
  { daysOfWeek: [6], title: 'GM Dragon MAYBE', startHour: 18, startMinute: 0, endHour: 18, endMinute: 30 },
  { daysOfWeek: [1, 2, 3, 4, 5], title: 'Halcy', startHour: 18, startMinute: 0, endHour: 19, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Evenbard', startHour: 18, startMinute: 0, endHour: 19, endMinute: 40 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'GR', startHour: 18, startMinute: 20, endHour: 19, endMinute: 30 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Wonderland Boss', startHour: 18, startMinute: 30, endHour: 19, endMinute: 0 },
  { daysOfWeek: [2, 4, 6], title: 'Kraken Cultist', startHour: 18, startMinute: 30, endHour: 19, endMinute: 0 },

  // 19:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Wonderland Miraculous Races', startHour: 19, startMinute: 0, endHour: 19, endMinute: 15 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'JMG', startHour: 19, startMinute: 20, endHour: 20, endMinute: 20 },
  { daysOfWeek: [6, 0], title: 'Dimensional Raid', startHour: 19, startMinute: 30, endHour: 19, endMinute: 45 },

  // 20:00
  { daysOfWeek: [2, 4, 6], title: 'Abyss Attack', startHour: 20, startMinute: 0, endHour: 21, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'CR', startHour: 20, startMinute: 20, endHour: 21, endMinute: 20 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Lusca', startHour: 20, startMinute: 30, endHour: 21, endMinute: 30 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Noryette Arena', startHour: 20, startMinute: 30, endHour: 23, endMinute: 30 },
  { daysOfWeek: [1, 6], title: 'Akasch Quests', startHour: 20, startMinute: 36, endHour: 20, endMinute: 51 },
  { daysOfWeek: [1, 6], title: 'Akasch Mobs', startHour: 20, startMinute: 51, endHour: 21, endMinute: 11 },

  // 21:00
  { daysOfWeek: [3], title: 'Wonderland Treasure', startHour: 21, startMinute: 0, endHour: 21, endMinute: 30 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Garden War', startHour: 21, startMinute: 0, endHour: 22, endMinute: 50 },
  { daysOfWeek: [6], title: 'Black Dragon', startHour: 21, startMinute: 0, endHour: 22, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Exile Language Tutor', startHour: 21, startMinute: 10, endHour: 21, endMinute: 15 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'SGCR', startHour: 21, startMinute: 20, endHour: 22, endMinute: 20 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Hiram Rift', startHour: 21, startMinute: 50, endHour: 23, endMinute: 50 },

  // 22:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Hallowtide Festival', startHour: 22, startMinute: 0, endHour: 22, endMinute: 30 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Ayanad Merchant', startHour: 22, startMinute: 0, endHour: 28, endMinute: 0 },
  { daysOfWeek: [0], title: 'Fall of Hiram', startHour: 22, startMinute: 0, endHour: 24, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Evenbard', startHour: 22, startMinute: 0, endHour: 23, endMinute: 40 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'GR', startHour: 22, startMinute: 20, endHour: 23, endMinute: 30 },
  { daysOfWeek: [2, 6], title: 'Kraken', startHour: 22, startMinute: 30, endHour: 23, endMinute: 30 },
  { daysOfWeek: [6, 0], title: 'Dimensional Raid', startHour: 22, startMinute: 30, endHour: 22, endMinute: 45 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Noryette Arena', startHour: 22, startMinute: 30, endHour: 23, endMinute: 30 },

  // 23:00
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Gweonid Lantern Festival', startHour: 23, startMinute: 0, endHour: 23, endMinute: 30 },
  { daysOfWeek: [1], title: 'GM Wonderland Races MAYBE', startHour: 23, startMinute: 0, endHour: 23, endMinute: 30 },
  { daysOfWeek: [2, 4, 6], title: 'Kraken Cultist', startHour: 23, startMinute: 0, endHour: 23, endMinute: 30 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'Jadegale Hasla Rift', startHour: 23, startMinute: 0, endHour: 23, endMinute: 30 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'DS War', startHour: 23, startMinute: 0, endHour: 25, endMinute: 0 },
  { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], title: 'JMG', startHour: 23, startMinute: 20, endHour: 24, endMinute: 20 },
  { daysOfWeek: [6], title: 'Wonderland Treasure', startHour: 23, startMinute: 30, endHour: 24, endMinute: 0 },
];

// Reuse the existing event identity (name, category and icon) for entries that
// are titled differently in the new schedule. Only their timers are replaced.
export const legacyEventAliases = {
  'Black Dragon': 'Black Dragon',
  'Siege Raid Apply': 'Castle',
  'Red Dragon': "Red Dragon's Keep",
  Kadum: 'Kadum',
  Leviathan: 'Leviathan',
  CR: 'Crimson Rift',
  'Abyss Attack': 'Abyssal Attack',
  'DGS West Spawn': 'Delphinad Ghost Ships',
  'DGS East Spawn': 'Delphinad Ghost Ships',
  'Castle Siege': 'Castle',
  'Garden Anthalon': 'Anthalon (Garden)',
  'Garden War': 'Garden of the Gods',
  Lusca: 'Lusca Awakening',
  SGCR: 'Crimson Rift (Auroria)',
  Aragog: 'Aragog',
  Charybdis: 'Charybdis',
  'Akasch Quests': 'Akasch Invasion',
  'Akasch Mobs': 'Akasch Invasion',
  'Hallowtide Festival': 'Troubled Spirits',
  Halcy: 'Halcyona Skirmish',
  GR: 'Grimghast Rift',
  'Sea Spirit General': 'Sea Spirit General',
  'Harbinger in Peace': 'Harbinger',
  'Harbinger in War': 'Harbinger',
  JMG: 'Jola, Meina, & Glenn',
  'Gweonid Lantern Festival': 'The Yata Lantern',
  'Daily Reset': 'Daily Reset',
  'Weekly Reset': 'Weekly Reset',
  'MERCHANTS DAY(Land Packs)': 'The Merchants Day!',
  'MERCHANTS DAY(Onyx Packs)': 'The Merchants Day!',
  'MERCHANTS DAY(Drag Ess Packs)': 'The Merchants Day!',
  'FISHING DAY': 'The Fishers Day!',
  'TREASURES HUNTER DAY': 'Treasures Hunter Day!',
  'Castle Transport': 'Castle',
  'DS War': 'Diamond Shores',
  'Fall of Hiram': 'The Fall of Hiram City',
  Kraken: 'Kraken',
  'Siege Commander Apply': 'Castle',
};

// Events that keep their own identity but should reuse a related legacy
// event's guide link and description.
export const legacyDetailAliases = {
  'Hasla 2 Rifts': 'Hasla Zombie Apocalypse',
  'Hasla 1 Rift': 'Hasla Zombie Apocalypse',
  'Jadegale Hasla Rift': 'Hasla Zombie Apocalypse',
};

export const eventMetadata = {
  'Hasla 2 Rifts': { categoryId: 'rifts', icon: 'crimson_rift_zombie' },
  'Black Dragon': { categoryId: 'world-bosses', icon: 'dragon_black' },
  'Siege Raid Apply': { categoryId: 'pvp-events', icon: 'castle_siege' },
  'Red Dragon': { categoryId: 'world-bosses', icon: 'dragon_red' },
  Kadum: { categoryId: 'world-bosses', icon: 'kadum' },
  Leviathan: { categoryId: 'world-bosses', icon: 'leviathan' },
  CR: { categoryId: 'rifts', icon: 'crimson_rift' },
  'Abyss Attack': { categoryId: 'pvp-events', icon: 'abyssal_attack' },
  'Dimensional Raid': { categoryId: 'pvp-events', icon: 'mistmerrow' },
  'DGS West Spawn': { categoryId: 'instances', icon: 'delphinad_ghost_ships' },
  'DGS East Spawn': { categoryId: 'instances', icon: 'delphinad_ghost_ships' },
  'Castle Siege': { categoryId: 'pvp-events', icon: 'castle_siege' },
  'Guardian Scramble': { categoryId: 'instances', icon: 'goldplain' },
  'Garden Anthalon': { categoryId: 'world-bosses', icon: 'anthalon' },
  'Garden War': { categoryId: 'zone-war', icon: 'archeage_green' },
  Lusca: { categoryId: 'world-bosses', icon: 'lusca_awakening' },
  'Wonderland Miraculous Races': { categoryId: 'custom-events', icon: 'cart' },
  'Exile Language Tutor': { categoryId: 'other-events', icon: 'event' },
  SGCR: { categoryId: 'rifts', icon: 'crimson_rift' },
  Aragog: { categoryId: 'custom-boss', icon: 'boss_monster' },
  Charybdis: { categoryId: 'world-bosses', icon: 'charybdis' },
  'Akasch Quests': { categoryId: 'world-bosses', icon: 'ipyna' },
  'Hiram Rift': { categoryId: 'rifts', icon: 'crimson_rift' },
  'Akasch Mobs': { categoryId: 'world-bosses', icon: 'ipyna' },
  'Hallowtide Festival': { categoryId: 'custom-events', icon: 'event' },
  Halcy: { categoryId: 'pvp-events', icon: 'camp3' },
  Evenbard: { categoryId: 'world-bosses', icon: 'boss_monster' },
  GR: { categoryId: 'rifts', icon: 'grimghast_rift' },
  'Wonderland Boss': { categoryId: 'world-bosses', icon: 'boss_monster' },
  'Sea Spirit General': { categoryId: 'custom-boss', icon: 'boss_monster' },
  'Harbinger in Peace': { categoryId: 'custom-boss', icon: 'boss_monster' },
  JMG: { categoryId: 'rifts', icon: 'mistmerrow' },
  'Noryette Arena': { categoryId: 'instances', icon: 'goldplain' },
  'Gweonid Lantern Festival': { categoryId: 'custom-events', icon: 'event' },
  'Daily Reset': { categoryId: 'other-events', icon: 'daily_reset' },
  'Weekly Reset': { categoryId: 'other-events', icon: 'archepass_reset' },
  'Faction Activity Reset': { categoryId: 'other-events', icon: 'daily_reset' },
  'Hero Nui Reset': { categoryId: 'other-events', icon: 'daily_reset' },
  'MERCHANTS DAY(Land Packs)': { categoryId: 'other-events', icon: 'pack' },
  'FISHING DAY': { categoryId: 'other-events', icon: 'fish_fest' },
  'TREASURES HUNTER DAY': { categoryId: 'other-events', icon: 'pouch' },
  'Castle Transport': { categoryId: 'other-events', icon: 'cart' },
  'MERCHANTS DAY(Onyx Packs)': { categoryId: 'other-events', icon: 'pack' },
  'MERCHANTS DAY(Drag Ess Packs)': { categoryId: 'other-events', icon: 'pack' },
  'DS Ocleera Rift': { categoryId: 'rifts', icon: 'ocleera' },
  'DS War': { categoryId: 'zone-war', icon: 'sea_battlefield' },
  'Server Maintenance': { categoryId: 'other-events', icon: 'daily_reset' },
  'Fall of Hiram': { categoryId: 'instances', icon: 'fall_of_hiram' },
  'GM Hide & Seek MAYBE': { categoryId: 'custom-events', icon: 'event' },
  'Siege Commander Apply': { categoryId: 'pvp-events', icon: 'castle_siege' },
  'Ayanad Merchant': { categoryId: 'other-events', icon: 'ayanad_merchant' },
  'Harbinger in War': { categoryId: 'custom-boss', icon: 'boss_monster' },
  Kraken: { categoryId: 'world-bosses', icon: 'kraken' },
  'GM Raging Tank MAYBE': { categoryId: 'custom-events', icon: 'event' },
  'GM Dragon MAYBE': { categoryId: 'custom-events', icon: 'event' },
  'Wonderland Treasure': { categoryId: 'other-events', icon: 'pouch' },
  'Kraken Cultist': { categoryId: 'custom-boss', icon: 'kraken' },
  'Jadegale Hasla Rift': { categoryId: 'rifts', icon: 'crimson_rift_zombie' },
  'GM Wonderland Races MAYBE': { categoryId: 'custom-events', icon: 'event' },
  'Hasla 1 Rift': { categoryId: 'rifts', icon: 'crimson_rift_zombie' },
};
