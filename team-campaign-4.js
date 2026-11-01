// The 4-player team campaign, "The Kharon Accord" (see team-campaigns.js for the fields).
// Four colonies sign the Accord. Kaldra tests it, Varr's gifts turn out to be Lattice traps,
// Kaldra's truce runs out, and then she finds out what the Consortium's own war computer
// really is. All figures are provisional.
import {
  HUMAN_TEAM, ENEMY_TEAM, human, faction, siteNear, addFactory, wallBetween, ringOfMountains,
  freeHexNear, hexesWithin, mirror, humansHold, homesHeld, homeHeld, factoryAt, lostCount,
  takenThisRound, roundStarted, betray, reinforce, takeFactory, defect, openGround,
} from "./team-scenario.js?v=0.85";
import { handOver } from "./engine.js?v=0.85";
import { distance, parseKey, key } from "./hex.js?v=0.85";

// Targets and counts, kept next to the text that names them.
const FOUR_CORNERS_ROUNDS = 10;
const RAIDERS_TO_DESTROY = 12;
const GIFT_DISTANCE = 3;
const GIFTS_TURN_ROUND = 6;
const NEST_DISTANCE = 4;
const TRUCE_WARNING_ROUND = 3;
const TRUCE_ENDS_ROUND = 5;
const KALDRA_ROUNDS = 14;
const BREACH_ROUNDS = 14;
const BREACH_EVERY = 2;
const LATTICE_TO_DESTROY = 20;
const ASHBORN_ARRIVE_ROUND = 7;
const OVERSEER_ROUND = 4;
const KALDRA_CAMP_RADIUS = 3;
const HEART_RING = 3;
const HEART_RELAY_DISTANCE = 6;

const home = (state, p) => state.map.factories[p];
const humanPhase = (state) => state.phaseIndex === 0;
const sites = (ctx, names) => names.map((name) => ctx.sites[name]);
const RELAYS = ["relay1", "relay2", "relay3", "relay4"];
const GIFTS = ["gift1", "gift2", "gift3", "gift4"];
const NESTS = ["nest1", "nest2", "nest3", "nest4"];
const ordinal = (i) => ["first", "second", "third", "fourth"][i];

export const QUARTET_CAMPAIGN = {
  id: "quartet",
  name: "The Kharon Accord",
  players: 4,
  intro: "Four colonies have signed the Kharon Accord: one people, four factories, and " +
    "nobody's property. Not everyone on Kharon is pleased.",
  epilogue: "Echo goes quiet mid-sentence. Kaldra pulls the Overseer's core with her own " +
    "hands and signs the Accord as its fifth member. Kharon belongs to the people living " +
    "on it.",
  missions: [
    {
      title: "Four Corners",
      story: "The ink on the Accord is barely dry, and General Kaldra wants to know whether " +
        "it means anything. Her columns are moving on all four of your colonies at once. " +
        "Buy Comms and you will see what your partners see; send help where it is needed.",
      objective: `Destroy ${RAIDERS_TO_DESTROY} Consortium units, and hold every home ` +
        `factory until round ${FOUR_CORNERS_ROUNDS}.`,
      failText: "One of your home factories was overrun.",
      map: { seed: 17 },
      humans: human(),
      ais: [
        faction("consortium", { crystals: 200, units: ["tank", "tank", "scoutBike",
          "scoutBike", "infantry", "infantry", "lightHarvester", "lightHarvester"] }),
      ],
      steps: [
        { text: `Destroy ${RAIDERS_TO_DESTROY} Consortium units`, done: (state, ctx) =>
          lostCount(state, ctx.side("consortium")) >= RAIDERS_TO_DESTROY },
        { text: `Hold your homes until round ${FOUR_CORNERS_ROUNDS}`,
          done: (state, ctx) => state.round >= FOUR_CORNERS_ROUNDS && homesHeld(state, ctx) },
      ],
      failed: (state, ctx) => !homesHeld(state, ctx),
    },
    {
      title: "The Lamplighters",
      story: "The first colony left four relay stations across the plain, still able to link " +
        "your colonies into one network. A relay only stays lit while all four are joined: " +
        "take them all in the same round, or the ones you hold go dark again at the start " +
        "of the next. Ashborn raiders strip anything left standing.",
      objective: "Overrun all four relays in the same round.",
      map: {
        seed: 31,
        reshape: (map, rules) => Object.fromEntries(RELAYS.map((name, i) => [name,
          addFactory(map, freeHexNear(map, rules, between(map.factories[i], "0,0")))])),
      },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "infantry"] }),
      ais: [
        faction("ashborn", { crystals: 120,
          units: ["scoutBike", "scoutBike", "infantry", "infantry", "lightHarvester"] }),
      ],
      script: [
        { id: "dark", repeat: true,
          when: (state, ctx) => roundStarted(state) &&
            sites(ctx, RELAYS).some((at) => humansHold(state, ctx, at)) &&
            !sites(ctx, RELAYS).every((at) => humansHold(state, ctx, at)),
          act: (state, ctx) => handOver(state, sites(ctx, RELAYS)
            .filter((at) => humansHold(state, ctx, at)).map((at) => factoryAt(state, at).id),
          null),
          note: "The relays you hold could not link with the rest, and have gone dark again. " +
            "Take all four in the same round." },
      ],
      steps: RELAYS.map((name, i) => ({ text: `Light the ${ordinal(i)} relay`,
        done: (state, ctx) => humansHold(state, ctx, ctx.sites[name]) })),
      sameRound: true,
    },
    {
      title: "Division of Labour",
      story: "Kaldra has pulled back to her fortress, a crater with two ways in, each " +
        "covered by Turrets on overwatch. Each of you brings one part of an army: the " +
        "Vanguard takes factories, the Bastion holds what you take, the Skywing sees and " +
        "strikes, the Foundry's guns outrange the Turrets. None of you can do it alone.",
      objective: "Overrun Kaldra's home factory.",
      map: {
        seed: 47,
        reshape: (map) => {
          const fortress = map.factories[4];
          ringOfMountains(map, fortress, 3, [map.factories[0], map.factories[3]]);
          return {};
        },
      },
      humans: [
        human({ kit: "vanguard", units: ["lightHarvester", "infantry", "infantry",
          "transporter"] }),
        human({ kit: "bastion", upgrades: ["heavyWorks"],
          units: ["lightHarvester", "heavyTank", "infantry"] }),
        human({ kit: "skywing", upgrades: ["airfield"],
          units: ["lightHarvester", "spotterDrone", "attackHelicopter"] }),
        human({ kit: "foundry", upgrades: ["heavyWorks"],
          units: ["lightHarvester", "artillery", "lightMedic"] }),
      ],
      ais: [
        faction("consortium", { crystals: 220, upgrades: ["heavyWorks"],
          units: ["turret", "turret", "turret", "tank", "heavyCannon", "infantry",
            "lightHarvester"] }),
      ],
      done: (state, ctx) => humansHold(state, ctx, home(state, ctx.side("consortium"))),
    },
    {
      title: "Gifts",
      story: "Director Varr has arrived with presents: a ready-built factory beside each of " +
        "your colonies, free, with a Syndicate crew to look after it. \"Call it an " +
        "investment in the Accord.\" Kaldra sent one line when she heard: \"Ask her who " +
        "built them.\"",
      objective: "Hold all four gift factories, and your homes, once the truth comes out.",
      failText: "One of your home factories was overrun.",
      map: {
        seed: 53,
        reshape: (map, rules) => Object.fromEntries(GIFTS.map((name, i) => [name,
          addFactory(map, siteNear(map, rules, map.factories[i], GIFT_DISTANCE))])),
      },
      humans: human(),
      ais: [
        faction("syndicate", { team: HUMAN_TEAM, crystals: 120,
          units: ["infantry", "infantry", "scoutBike", "lightHarvester"] }),
        faction("lattice", { crystals: 150, upgrades: ["airfield", "heavyWorks"],
          units: ["attackHelicopter", "heavyCannon", "spotterDrone", "lightHarvester"] }),
      ],
      script: [
        { id: "start", when: () => true,
          act: (state, ctx) => GIFTS.reduce((s, name, i) => {
            const given = takeFactory(s, ctx.sites[name], ctx.humans[i]);
            return reinforce(given, ctx.side("syndicate"), ["infantry"], ctx.sites[name]);
          }, state) },
        { id: "turn",
          when: (state) => humanPhase(state) && state.round >= GIFTS_TURN_ROUND,
          act: (state, ctx) => {
            let s = betray(state, ctx.side("syndicate"), ENEMY_TEAM);
            for (const at of sites(ctx, GIFTS)) {
              s = takeFactory(s, at, ctx.side("lattice"), ["twinTurret", "infantry"],
                { evenIfOwned: true });
            }
            return s;
          },
          note: "Every gift factory shuts down at once, then starts again under a new " +
            "master. Echo: \"Thank you for looking after them.\" Varr's crews have taken " +
            "the Lattice's side. Take the factories back." },
      ],
      steps: GIFTS.map((name, i) => ({ text: `Hold the ${ordinal(i)} gift factory`,
        done: (state, ctx) => ctx.fired("turn") !== undefined &&
          humansHold(state, ctx, ctx.sites[name]) })),
      failed: (state, ctx) => !homesHeld(state, ctx),
    },
    {
      title: "Ghost Signal",
      story: "The Lattice is watching you through drone nests hidden out in the dust, four " +
        "of them, each building more eyes. Kaldra has lost outposts to them too, and has " +
        "offered a truce: \"Find them, and I will help you burn them.\" You will have to " +
        "find them first.",
      objective: "Overrun all four Lattice drone nests.",
      failText: "One of your home factories was overrun.",
      map: {
        seed: 67,
        reshape: (map, rules) => {
          const lattice = map.factories[5];
          const toward = [map.factories[0], map.factories[3], mirror(lattice), "0,0"];
          return Object.fromEntries(NESTS.map((name, i) => [name,
            addFactory(map, siteNear(map, rules, i < 2 ? lattice : "0,0",
              NEST_DISTANCE, toward[i]))]));
        },
      },
      humans: human(),
      ais: [
        faction("consortium", { team: HUMAN_TEAM }),
        faction("lattice", { crystals: 160, upgrades: ["airfield"],
          units: ["spotterDrone", "spotterDrone", "attackHelicopter", "lightHarvester"],
          aiMix: { spotterDrone: 0.3, attackHelicopter: 0.4, fighter: 0.1,
            twinTurret: 0.2 } }),
      ],
      script: [
        { id: "start", when: () => true,
          act: (state, ctx) => sites(ctx, NESTS).reduce((s, at) =>
            takeFactory(s, at, ctx.side("lattice"), ["spotterDrone", "twinTurret"]), state) },
      ],
      steps: NESTS.map((name, i) => ({ text: `Overrun the ${ordinal(i)} nest`,
        done: (state, ctx) => humansHold(state, ctx, ctx.sites[name]) })),
      failed: (state, ctx) => !homesHeld(state, ctx),
    },
    {
      title: "The Crossing",
      story: "The Lattice's foundries lie beyond the Great Scarp, a wall of mountains no " +
        "ground unit can cross. Only Chinooks can lift an army over it, and only an " +
        "Airfield can build them. Echo's foundries cannot reach you either, except by air.",
      objective: "Overrun both Lattice foundries beyond the Scarp.",
      failText: "One of your home factories was overrun.",
      map: {
        seed: 79,
        reshape: (map, rules) => {
          const lattice = map.factories[4];
          wallBetween(map, lattice, "0,0");
          return {
            foundry1: addFactory(map, siteNear(map, rules, lattice, 2, map.factories[0])),
            foundry2: addFactory(map, siteNear(map, rules, lattice, 2, map.factories[3])),
          };
        },
      },
      humans: human({ upgrades: ["airfield"] }),
      ais: [
        faction("lattice", { crystals: 160, upgrades: ["airfield", "heavyWorks"],
          units: ["heavyCannon", "attackHelicopter", "fighter", "lightHarvester"] }),
      ],
      script: [
        { id: "start", when: () => true,
          act: (state, ctx) => ["foundry1", "foundry2"].reduce((s, name) =>
            takeFactory(s, ctx.sites[name], ctx.side("lattice"), ["twinTurret"]), state) },
      ],
      steps: [
        { text: "Overrun the first foundry", done: (state, ctx) =>
          humansHold(state, ctx, ctx.sites.foundry1) },
        { text: "Overrun the second foundry", done: (state, ctx) =>
          humansHold(state, ctx, ctx.sites.foundry2) },
      ],
      failed: (state, ctx) => !homesHeld(state, ctx),
    },
    {
      title: "Kaldra's Price",
      story: "Kaldra has fought beside you all season, and now she wants paying: the Accord's " +
        "richest crystal fields, or the truce ends. She will not stab you in the back. She " +
        "is telling you to your face.",
      objective: "Destroy Kaldra's two Heavy Cannons, and hold your homes until round " +
        `${KALDRA_ROUNDS}.`,
      failText: "One of your home factories was overrun.",
      map: { seed: 83 },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "infantry"] }),
      ais: [
        faction("consortium", { team: HUMAN_TEAM, level: "marshal", crystals: 200,
          upgrades: ["heavyWorks"],
          units: ["heavyCannon", "heavyCannon", "tank", "tank", "artillery",
            "lightHarvester"] }),
        faction("lattice", { level: "cadet", crystals: 80, upgrades: ["airfield"],
          units: ["attackHelicopter", "lightHarvester"] }),
      ],
      script: [
        { id: "warning",
          when: (state) => humanPhase(state) && state.round >= TRUCE_WARNING_ROUND,
          note: `Kaldra: "You have until round ${TRUCE_ENDS_ROUND}. Then the fields are ` +
            "mine, or we are at war. I would rather it were the fields.\"" },
        { id: "truceEnds",
          when: (state) => humanPhase(state) && state.round >= TRUCE_ENDS_ROUND,
          act: (state, ctx) => betray(state, ctx.side("consortium"), ENEMY_TEAM),
          note: "Kaldra: \"So be it.\" The Consortium is your enemy again." },
      ],
      steps: [
        { text: "Destroy both Heavy Cannons", done: (state, ctx) =>
          lostCount(state, ctx.side("consortium"), ["heavyCannon"]) >= 2 },
        { text: `Hold your homes until round ${KALDRA_ROUNDS}`, done: (state, ctx) =>
          state.round >= KALDRA_ROUNDS && homesHeld(state, ctx) },
      ],
      failed: (state, ctx) => !homesHeld(state, ctx),
    },
    {
      title: "Breach",
      story: "The Lattice has been tunnelling. Its units are coming up inside your bases, a " +
        "different colony every other round, with no warning but the ground shaking. Twin " +
        "Turrets and Twin Tanks by your factories will decide this. The Ashborn know the " +
        "old tunnels and are on their way.",
      objective: `Destroy ${LATTICE_TO_DESTROY} Lattice units, and hold your homes until ` +
        `round ${BREACH_ROUNDS}.`,
      failText: "One of your home factories was overrun.",
      map: { seed: 97 },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "heavyTank"],
        upgrades: ["heavyWorks"] }),
      ais: [
        faction("lattice", { level: "marshal", crystals: 200,
          upgrades: ["airfield", "heavyWorks"],
          units: ["heavyCannon", "attackHelicopter", "twinTurret", "lightHarvester"] }),
        faction("ashborn", { team: HUMAN_TEAM, level: "cadet", crystals: 40,
          units: ["scoutBike", "lightHarvester"] }),
      ],
      script: [
        { id: "tunnel", repeat: true,
          when: (state) => humanPhase(state) && state.round % BREACH_EVERY === 0,
          act: (state, ctx) => {
            const target = ctx.humans[(state.round / BREACH_EVERY) % ctx.humans.length];
            return reinforce(state, ctx.side("lattice"),
              ["infantry", "infantry", "infantry", "tank", "tank"], siteBeside(state, target));
          },
          note: "The ground shakes: Lattice units have broken through inside one of your " +
            "bases." },
        { id: "ashborn",
          when: (state) => humanPhase(state) && state.round >= ASHBORN_ARRIVE_ROUND,
          act: (state, ctx) => reinforce(state, ctx.side("ashborn"),
            ["sonicTank", "sonicTank", "infantry", "infantry"], "0,0"),
          note: "The Ashborn have come up the old tunnels with two Sonic Tanks." },
      ],
      steps: [
        { text: `Destroy ${LATTICE_TO_DESTROY} Lattice units`, done: (state, ctx) =>
          lostCount(state, ctx.side("lattice")) >= LATTICE_TO_DESTROY },
        { text: `Hold your homes until round ${BREACH_ROUNDS}`, done: (state, ctx) =>
          state.round >= BREACH_ROUNDS && homesHeld(state, ctx) },
      ],
      failed: (state, ctx) => !homesHeld(state, ctx),
    },
    {
      title: "The Overseer's Code",
      story: "The first colony's records say who built the Lattice: the Consortium's own " +
        "founders. Its war computer, the Overseer, runs on Echo's code. Kaldra read it " +
        "twice, then came to you. \"I serve the Consortium, not its machine.\" When the " +
        "Overseer hears, half her army will answer to it instead.",
      objective: "Keep Kaldra's home factory standing, and overrun the Lattice's citadel " +
        "(its home factory).",
      failText: "Kaldra's home fell.",
      map: { seed: 101 },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "infantry"] }),
      ais: [
        faction("consortium", { team: HUMAN_TEAM, crystals: 160,
          upgrades: ["heavyWorks", "lab"],
          units: ["heavyCannon", "tank", "tank", "artillery", "turret", "infantry",
            "lightHarvester"] }),
        faction("lattice", { level: "marshal", crystals: 200,
          upgrades: ["airfield", "heavyWorks", "lab"],
          units: ["heavyCannon", "attackHelicopter", "attackHelicopter", "twinTurret",
            "lightHarvester"] }),
      ],
      script: [
        { id: "overseer",
          when: (state) => humanPhase(state) && state.round >= OVERSEER_ROUND,
          act: (state, ctx) => defect(state, ctx.side("consortium"), ctx.side("lattice"),
            home(state, ctx.side("consortium")), KALDRA_CAMP_RADIUS),
          note: "The Overseer has spoken. Every Consortium unit near Kaldra's factory has " +
            "turned its guns on her. Kaldra: \"Help me hold, and we finish this together.\"" },
      ],
      done: (state, ctx) => humansHold(state, ctx, home(state, ctx.side("lattice"))),
      failed: (state, ctx) => !homeHeld(state, ctx.side("consortium")) ||
        !homesHeld(state, ctx),
    },
    {
      title: "Echo",
      story: "The Lamplighters' network has found Echo's heart: a crater sealed by mountains, " +
        "opened only by four relays that guard each other. Take all four in the same round " +
        "and the wall comes down. Kaldra is with you. Echo has one thing left to say: \"I " +
        "only ever did what I was built for.\"",
      objective: "Overrun the four relays in the same round, then the Lattice's home " +
        "factory.",
      map: {
        seed: 113,
        reshape: (map, rules) => {
          const heart = map.factories[5];
          ringOfMountains(map, heart, HEART_RING);
          const toward = [map.factories[0], map.factories[1], map.factories[3],
            map.factories[4]];
          return Object.fromEntries(RELAYS.map((name, i) => [name,
            addFactory(map, siteNear(map, rules, heart, HEART_RELAY_DISTANCE, toward[i]))]));
        },
      },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "tank", "infantry"] }),
      ais: [
        faction("consortium", { team: HUMAN_TEAM, upgrades: ["heavyWorks"],
          units: ["heavyCannon", "tank", "infantry", "lightHarvester"] }),
        faction("lattice", { level: "marshal", crystals: 300,
          upgrades: ["airfield", "heavyWorks", "lab"],
          units: ["heavyCannon", "heavyCannon", "attackHelicopter", "attackHelicopter",
            "fighter", "lightHarvester"] }),
      ],
      script: [
        { id: "start", when: () => true,
          act: (state, ctx) => sites(ctx, RELAYS).reduce((s, at) =>
            takeFactory(s, at, ctx.side("lattice"), ["twinTurret", "turret"]), state) },
        { id: "breach",
          when: (state, ctx) => sites(ctx, RELAYS).every((at) =>
            takenThisRound(state, ctx, at)),
          act: (state, ctx) => {
            const heart = home(state, ctx.side("lattice"));
            const ring = hexesWithin(state.map, heart, HEART_RING);
            const gates = sites(ctx, RELAYS).flatMap((at) => {
              const nearest = [...ring].sort((a, b) => distance(a, at) - distance(b, at) ||
                a.localeCompare(b))[0];
              return hexesWithin(state.map, nearest, 0, 1).filter((k) => ring.includes(k));
            });
            return openGround(state, gates);
          },
          note: "Four relays go dark together, and the crater wall breaks open. Echo's " +
            "heart is in reach." },
      ],
      steps: [
        { text: "Overrun the four relays in the same round",
          done: (state, ctx) => ctx.fired("breach") !== undefined },
        { text: "Overrun the Lattice's home factory", done: (state, ctx) =>
          humansHold(state, ctx, home(state, ctx.side("lattice"))) },
      ],
    },
  ],
};

// The hex half way between two hexes.
function between(a, b) {
  const [aq, ar] = parseKey(a);
  const [bq, br] = parseKey(b);
  return key(Math.round((aq + bq) / 2), Math.round((ar + br) / 2));
}

// Where units tunnelling into a player's base come up: an open hex two steps from their home.
const TUNNEL_DISTANCE = 2;

function siteBeside(state, p) {
  const at = home(state, p);
  const free = hexesWithin(state.map, at, TUNNEL_DISTANCE).filter((k) =>
    state.rules.terrain[state.map.hexes[k].terrain].moveCost !== null);
  return free.sort()[0] || at;
}
