// Unit stats, copied from the "Units" sheet of Unit Table.xlsx in the MechAttack folder.
// null = not yet decided in the table (shown as a dash). icon = file in units/, or null
// when no artwork has been picked yet (a lettered badge is shown instead).

export const GROUPS = [
  { prefix: "L", name: "Land Attack" },
  { prefix: "A", name: "Air" },
  { prefix: "D", name: "Defences" },
  { prefix: "F", name: "Factories" },
  { prefix: "H", name: "Harvesters" },
  { prefix: "M", name: "Medics" },
  { prefix: "R", name: "Reconnaissance" },
];

export const STATS = [
  { key: "cost", label: "Cost" },
  { key: "move", label: "Move" },
  { key: "defence", label: "Defence" },
  { key: "attack", label: "Attack" },
  { key: "range", label: "Range" },
  { key: "storage", label: "Storage" },
  { key: "healing", label: "Healing" },
  { key: "sight", label: "Sight" },
];

const u = (code, name, type, size, cost, move, defence, attack, range, storage, healing,
           sight, abilities = "", icon = null) =>
  ({ code, name, type, size, cost, move, defence, attack, range, storage, healing, sight,
     abilities, icon });

export const UNITS = [
  u("L1", "Tank", "Offensive", "L", 90, 5, 25, 25, 3, 0, 0, 3, "", "tank.png"),
  u("L2", "Heavy Cannon", "Offensive", "H", 127, 3, 50, 45, 3, 0, 0, 3, "", "heavy-cannon.png"),
  u("L3", "Artillery", "Offensive", "L", 102, 3, 10, 50, 5, 0, 0, 3,
    "Takes 1 attack turn to set up for firing", "artillery.png"),
  u("L4", "Blast Cannon", "Offensive", "H", 87, 3, 10, 40, 4, 0, 0, 3,
    "Fires every other go - Cluster Bomb*"),
  u("L5", "Sonic Tank", "Offensive", "L", 81, 4, 20, 15, 5, 0, 0, 4, "Sonic Boom*"),
  u("A1", "Fighter", "Offensive", "L", 78, 7, null, 30, 4, null, null, null),
  u("A2", "Attack Helicopter", "Offensive", "L", 30, 5, null, null, 2, null, null, null),
  u("A3", "Transport", "Transport", "H", 20, 5, null, 0, 0, null, null, null),
  u("D1", "Fort", "Defence", "H", 18, 2, 10, 0, 0, 0, 0, 2),
  u("D1", "Fort (constructed)", "Defence", "H", 95, 0, 50, 20, 2, 0, 10, 3,
    "Fires first (once) on anything in range"),
  u("D2", "Turret", "Defence", "H", 18, 2, 10, 0, 0, 0, 0, 2),
  u("D2", "Turret (constructed)", "Defence", "H", 130, 0, 50, 50, 3, 0, 10, 3,
    "Healing range is 1"),
  u("F1", "Light Factory", "Factory", "H", 182, 3, 20, 0, 0, 150, 0, 2),
  u("F1", "Light Factory (constructed)", "Factory", "H", 220, 0, 40, 0, 0, 150, 25, 3),
  u("F2", "Factory", "Factory", "H", 655, 0, 100, 0, 0, 500, 50, 4),
  u("H1", "Light Harvester", "Harvester", "L", 49, 6, 10, 0, 0, 15, 0, 2, "",
    "light-harvester.png"),
  u("H2", "Heavy Harvester", "Harvester", "H", 92, 3, 30, 0, 1, 45, 0, 2),
  u("M1", "Light Medic", "Medic", "L", 62, 8, 10, 0, 1, 0, 10, 3, "", "light-medic.png"),
  u("M2", "Heavy Medic", "Medic", "H", 86, 4, 30, 0, 1, 0, 30, 3),
  u("R1", "Scout Bike", "Reconnaissance", "L", 68, 7, 10, 15, 1, 5, 0, 4, "", "scout-bike.png"),
  u("R2", "Spotter Drone", "Reconnaissance", "L", 30, 5, 5, 0, 0, 0, 0, 5, "Flies",
    "spotter-drone-green.svg"),
];

export const NOTES = [
  "<b>*Sonic Boom:</b> hits all hexes in a direct line up to range (always hits range " +
    "number of hexes). Can be fired into the air to hit drones.",
  "<b>*Cluster Bomb:</b> full attack value on the target hex and half the attack value on " +
    "the surrounding hexes.",
  "Multiple units can attack one unit - add their scores.",
  "Units with range up to 3 return fire on anything attacking from an adjacent hex.",
  "A Light Factory can only make light units.",
  "A Medic can heal a wound for a unit whose defence is less than or equal to its Healing " +
    "value.",
  "Fort, Turret and Factory units must be constructed before they become operational, " +
    "and can't be moved again.",
];
