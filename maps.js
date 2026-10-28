// Map definitions. A map is a list of seven-hex clusters, as on the printed map pages, plus
// the factory sites, starting hexes and crystal deposits. buildMap turns a definition into the
// plain-data map the engine stores in the game state.
import { key, clusterCentre, clusterHexes, DIRECTION_NAMES } from "./hex.js?v=0.02";

// Fixed map 1: 12 clusters, 84 hexes, about 11 hexes wide and 11 tall.
// Paired clusters (point-reflected through the middle of the map) have the same number of
// mountains but in different places, so one side cannot be read off from the other. The
// middle pair differs: the chasm cluster blocks three hexes and its partner two.
// Cluster fields: at = [i, j] cluster lattice position, centre = terrain of the centre hex,
// ring = terrain of ring hexes by direction (anything not listed is plain).
export const FIXED_MAP_1 = {
  id: "fixed-1",
  name: "Fixed map 1",
  clusters: [
    // Green home (top right) and blue home (bottom left).
    { id: "A", at: [1, -2], centre: "plain", ring: { NE: "mountain", SE: "mountain" } },
    { id: "L", at: [0, 2], centre: "plain", ring: { S: "mountain", SW: "mountain" } },
    { id: "B", at: [0, -1], centre: "rocky",
      ring: { N: "mountain", NW: "mountain", SW: "mountain" } },
    { id: "K", at: [1, 1], centre: "rocky",
      ring: { S: "mountain", SE: "mountain", SW: "mountain" } },
    { id: "C", at: [-1, 0], centre: "rocky", ring: { NW: "mountain", SW: "mountain" } },
    { id: "J", at: [2, 0], centre: "rocky", ring: { SE: "mountain", S: "mountain" } },
    { id: "D", at: [1, -1], centre: "rocky", ring: { SE: "mountain" } },
    { id: "I", at: [0, 1], centre: "rocky", ring: { N: "mountain" } },
    { id: "F", at: [-1, 1], centre: "rocky",
      ring: { NW: "mountain", SW: "mountain", S: "mountain" } },
    { id: "G", at: [2, -1], centre: "rocky",
      ring: { NE: "mountain", SE: "mountain", S: "mountain" } },
    // Middle pair: the chasm cluster from the tile sheet (crack through N, centre and SW),
    // and a rocky cluster with a mountain and the single-hex chasm.
    { id: "E", at: [0, 0], centre: "chasm", ring: { N: "chasm", SW: "chasm" } },
    { id: "H", at: [1, 0], centre: "rocky", ring: { N: "mountain", SE: "chasm" } },
  ],
  // Player 0 (blue) and player 1 (green): factory on the centre of the home cluster.
  factories: ["L", "A"],
  // Starting hexes in the order of RULES.start.units.
  starts: [
    ["-2,5", "-1,5", "-1,6"],
    ["4,-4", "3,-4", "3,-5"],
  ],
  // Deposits block movement, so distances are path costs with all of them in place. Paired
  // deposits match from their own and the enemy factory: Crystals 3 from home and 8 from the
  // enemy, Crystal Base 4 and 7. The Crystal Cave is on the only open hex 6 from both.
  deposits: [
    { at: "1,3", kind: "crystals" },
    { at: "1,-2", kind: "crystals" },
    { at: "0,2", kind: "crystalBase" },
    { at: "2,-1", kind: "crystalBase" },
    { at: "0,1", kind: "crystalCave" },
  ],
};

export function buildMap(def) {
  const hexes = {};
  const centres = {};
  for (const cluster of def.clusters) {
    const centre = clusterCentre(...cluster.at);
    centres[cluster.id] = key(...centre);
    clusterHexes(centre).forEach(([q, r], index) => {
      const terrain =
        index === 0 ? cluster.centre : cluster.ring[DIRECTION_NAMES[index - 1]] || "plain";
      hexes[key(q, r)] = { terrain, cluster: cluster.id };
    });
  }
  return {
    id: def.id,
    name: def.name,
    hexes,
    factories: def.factories.map((clusterId) => centres[clusterId]),
    starts: def.starts,
    deposits: def.deposits,
  };
}
