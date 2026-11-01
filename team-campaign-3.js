// The 3-player team campaign, "Ashfall" (see team-campaigns.js for the fields). Three
// colonies settle beside the ruins of the first colony. The Ashborn go from raiders to
// allies; Sable's son Corran sells them to the Lattice and then learns what Echo really
// wants; General Kaldra becomes an ally of necessity. All figures are provisional.
import { RULES } from "./rules-config.js?v=0.86";
import {
  HUMAN_TEAM, ENEMY_TEAM, THIRD_TEAM, human, faction, siteNear, addFactory, spreadRuins,
  ringOfMountains, freeHexNear, hexesWithin, mirror, humansHold, homesHeld, homeHeld,
  lostCount, teamCrystals, ruinsSearchedBy, unitAlive, takenThisRound, roundStarted, betray,
  reinforce, giftEach, takeFactory, openGround, warning,
} from "./team-scenario.js?v=0.86";
import { distance } from "./hex.js?v=0.86";

// Targets and counts, kept next to the text that names them.
const RUINS_TO_SEARCH = 5;
const RUINS_ON_MAP = 8;
const RUIN_SPREAD = 4;
const RAIDERS_TO_DESTROY = 10;
const WATER_RIGHTS_ROUNDS = 12;
const HARVEST_SHARE_ROUND = 6;
const HARVEST_SHARE = 30;
const GATE_DISTANCE = 4;
const REDWATER_ROUNDS = 12;
const CORRAN_TURNS_ROUND = 5;
const SEEDERS_TO_DESTROY = 3;
const BANK_TARGET = 300;
const AIRCRAFT_TO_DESTROY = 12;
const AIR_WAVE_EVERY = 3;
const ECHO_STRIKES_ROUND = 4;
const CORRAN_JOINS_ROUND = 6;
const RELAY_DISTANCE = 6;
const HEART_RING = 3;
const AIRCRAFT = ["attackHelicopter", "fighter", "spotterDrone", "chinook"];

const home = (state, p) => state.map.factories[p];
const humanPhase = (state) => state.phaseIndex === 0;
const sites = (ctx, names) => names.map((name) => ctx.sites[name]);
const GATES = ["gate1", "gate2", "gate3"];
const POSTS = ["post1", "post2", "post3"];
const RELAYS = ["relay1", "relay2", "relay3"];

// Mother Sable, the VIP of "Sable's March": Commander Jeanne's stats under her name.
const SABLE_RULES = { units: { ...RULES.units, vip: { ...RULES.units.vip,
  name: "Mother Sable" } } };

export const TRIO_CAMPAIGN = {
  id: "trio",
  name: "Ashfall",
  players: 3,
  intro: "Three colonies settle beside the ruins of Kharon's first colony, lost a century " +
    "ago. Its children, the Ashborn, did not ask for neighbours.",
  epilogue: "The crater falls silent. Sable and Corran walk into the heart together and come " +
    "out with the first colony's records: names, every one of them. The Ashborn have their " +
    "history back, and three new neighbours.",
  missions: [
    {
      title: "Strangers in the Ruins",
      story: "Your three colonies have landed beside the ruins of the first colony. The old " +
        "factories are rubble, but the ruins still hold crystals, machines and records. " +
        "The Ashborn, who live among them, think you are grave robbers, and they ride fast.",
      objective: `Search ${RUINS_TO_SEARCH} ruins between you, without losing a home factory.`,
      failText: "One of your home factories was overrun.",
      map: {
        seed: 13,
        reshape: (map, rules) => {
          spreadRuins(map, rules, RUINS_ON_MAP, RUIN_SPREAD);
          return {};
        },
      },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "infantry"] }),
      ais: [
        faction("ashborn", { level: "cadet", crystals: 80,
          units: ["scoutBike", "scoutBike", "scoutBike", "infantry", "infantry"] }),
      ],
      script: [
        { id: "records",
          when: (state, ctx) => ruinsSearchedBy(state, ctx.humans) >= 2,
          note: "In the rubble, a terminal flickers into life for a moment: ECHO ONLINE. " +
            "LISTENING. Then it goes dark." },
      ],
      steps: [
        { text: `Search ${RUINS_TO_SEARCH} ruins`, done: (state, ctx) =>
          ruinsSearchedBy(state, ctx.humans) >= RUINS_TO_SEARCH },
      ],
      failed: (state, ctx) => !homesHeld(state, ctx),
    },
    {
      title: "Water Rights",
      story: "Mother Sable has sent word. The Consortium is coming for the Ashborn crystal " +
        "gardens, where their Crystal Seeders plant new piles every season. \"Keep Kaldra " +
        "off our gardens until the season turns, and we will share the harvest.\"",
      objective: `Destroy ${RAIDERS_TO_DESTROY} Consortium units, and keep the Ashborn home ` +
        `standing until round ${WATER_RIGHTS_ROUNDS}.`,
      failText: "The Ashborn home fell.",
      map: { seed: 29 },
      humans: human(),
      ais: [
        faction("ashborn", { team: HUMAN_TEAM, level: "cadet", crystals: 80,
          upgrades: ["lab"], units: ["crystalSeeder", "crystalSeeder", "lightHarvester",
            "infantry", "scoutBike", "twinTurret"] }),
        faction("consortium", { crystals: 140,
          units: ["tank", "tank", "artillery", "infantry", "lightHarvester"] }),
      ],
      script: [
        { id: "share",
          when: (state, ctx) => humanPhase(state) && state.round >= HARVEST_SHARE_ROUND &&
            homeHeld(state, ctx.side("ashborn")),
          act: (state, ctx) => giftEach(state, ctx, HARVEST_SHARE),
          note: `Sable keeps her word: ${HARVEST_SHARE} crystals each from the gardens.` },
      ],
      steps: [
        { text: `Destroy ${RAIDERS_TO_DESTROY} Consortium units`, done: (state, ctx) =>
          lostCount(state, ctx.side("consortium")) >= RAIDERS_TO_DESTROY },
        { text: `The Ashborn home stands at round ${WATER_RIGHTS_ROUNDS}`,
          done: (state, ctx) => state.round >= WATER_RIGHTS_ROUNDS &&
            homeHeld(state, ctx.side("ashborn")) },
      ],
      failed: (state, ctx) => !homeHeld(state, ctx.side("ashborn")) ||
        !homesHeld(state, ctx),
    },
    {
      title: "Three Gates",
      story: "Kaldra has dug in. Her valley has three gates, each a factory with a Turret on " +
        "overwatch, and each can call the others. Take one and the other two fill with " +
        "Tanks. There are three of you and three gates: take them all in the same round.",
      objective: "Overrun all three Consortium gates in the same round.",
      map: {
        seed: 43,
        reshape: (map, rules) => Object.fromEntries(GATES.map((name, i) => [name,
          addFactory(map, siteNear(map, rules, map.factories[3], GATE_DISTANCE,
            map.factories[i]))])),
      },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "infantry"] }),
      ais: [
        faction("consortium", { crystals: 150, upgrades: ["heavyWorks"] }),
      ],
      script: [
        { id: "start", when: () => true,
          act: (state, ctx) => sites(ctx, GATES).reduce((s, at) =>
            takeFactory(s, at, ctx.side("consortium"), ["turret"]), state) },
        { id: "alarm",
          when: (state, ctx) => roundStarted(state) &&
            sites(ctx, GATES).some((at) => humansHold(state, ctx, at)) &&
            !sites(ctx, GATES).every((at) => humansHold(state, ctx, at)),
          act: (state, ctx) => sites(ctx, GATES).filter((at) => !humansHold(state, ctx, at))
            .reduce((s, at) => reinforce(s, ctx.side("consortium"), ["tank"], at), state),
          note: "The alarm is out: Consortium Tanks have rolled up to the gates you have not " +
            "taken. Take every gate in the same round." },
      ],
      steps: GATES.map((name, i) => ({ text: `Overrun gate ${i + 1}`,
        done: (state, ctx) => humansHold(state, ctx, ctx.sites[name]) })),
      sameRound: true,
    },
    {
      title: "Redwater",
      story: "Redwater, the Ashborn's only town, is under siege by Kaldra's army, and Varr " +
        "is selling her Transporters full of Infantry. Each of you brings what your colony " +
        "does best: the Vanguard to hit back, the Bastion to fortify, the Skywing to see " +
        "and strike. An empty factory stands beside Redwater: whoever takes it can build " +
        "there.",
      objective: `Keep Redwater (the Ashborn home) and your own homes standing until round ` +
        `${REDWATER_ROUNDS}.`,
      failText: "Redwater fell.",
      map: {
        seed: 59,
        reshape: (map, rules) => ({
          works: addFactory(map, siteNear(map, rules, map.factories[3], 2)),
        }),
      },
      humans: [
        human({ kit: "vanguard", units: ["lightHarvester", "infantry", "infantry",
          "transporter"] }),
        human({ kit: "bastion", upgrades: ["heavyWorks"],
          units: ["lightHarvester", "heavyTank", "infantry"] }),
        human({ kit: "skywing", upgrades: ["airfield"],
          units: ["lightHarvester", "spotterDrone", "attackHelicopter"] }),
      ],
      ais: [
        faction("ashborn", { team: HUMAN_TEAM, level: "cadet", crystals: 80,
          upgrades: ["lab"], units: ["scoutBike", "infantry", "infantry", "twinTurret",
            "lightHarvester"] }),
        faction("consortium", { crystals: 220, upgrades: ["heavyWorks"],
          units: ["tank", "tank", "artillery", "artillery", "infantry", "infantry",
            "lightHarvester"] }),
        faction("syndicate", { level: "cadet", crystals: 100,
          units: ["infantry", "infantry", "transporter", "scoutBike", "lightHarvester"] }),
      ],
      done: (state, ctx) => state.round > REDWATER_ROUNDS && homesHeld(state, ctx) &&
        homeHeld(state, ctx.side("ashborn")),
      failed: (state, ctx) => !homeHeld(state, ctx.side("ashborn")) ||
        !homesHeld(state, ctx),
    },
    {
      title: "Corran's Choice",
      story: "Sable's son Corran has led your scouts all season, and his people now man a " +
        "post beside each of your bases. Lately he has been asking about the old terminals, " +
        "and the voice that answers them. Sable is worried. So are you: his posts face your " +
        "factories, not the desert.",
      objective: "Overrun all three of Corran's posts and keep your home factories.",
      failText: "One of your home factories was overrun.",
      map: {
        seed: 61,
        reshape: (map, rules) => Object.fromEntries(POSTS.map((name, i) => [name,
          addFactory(map, siteNear(map, rules, map.factories[i], 3))])),
      },
      humans: human(),
      ais: [
        faction("ashborn", { team: HUMAN_TEAM, crystals: 60, upgrades: ["heavyWorks"],
          units: ["scoutBike", "infantry", "sonicTank", "lightHarvester"] }),
        faction("splinter", { team: HUMAN_TEAM, crystals: 80,
          units: ["scoutBike", "lightHarvester"] }),
        faction("lattice", { level: "cadet", crystals: 80, upgrades: ["airfield"],
          units: ["spotterDrone", "attackHelicopter", "lightHarvester"] }),
      ],
      script: [
        { id: "start", when: () => true,
          act: (state, ctx) => sites(ctx, POSTS).reduce((s, at) =>
            takeFactory(s, at, ctx.side("splinter"), ["twinTurret", "infantry",
              "infantry"]), state) },
        warning("turnWarning", CORRAN_TURNS_ROUND, "Sable: \"Corran has stopped " +
          "answering me. His people are loading their guns and pointing them at your " +
          "factories. Whatever he is planning, it will be soon.\""),
        { id: "turn",
          when: (state) => humanPhase(state) && state.round >= CORRAN_TURNS_ROUND,
          act: (state, ctx) => sites(ctx, POSTS).reduce((s, at) =>
            reinforce(s, ctx.side("splinter"), ["infantry", "scoutBike"], at),
          betray(state, ctx.side("splinter"), ENEMY_TEAM)),
          note: "Corran, on every channel: \"Echo has promised to wake the first colony: " +
            "our ancestors, every one of them. Mother would never understand.\" His posts " +
            "open fire. The Lattice is his ally now." },
      ],
      steps: POSTS.map((name, i) => ({ text: `Overrun Corran's post ${i + 1}`,
        done: (state, ctx) => humansHold(state, ctx, ctx.sites[name]) })),
      failed: (state, ctx) => !homesHeld(state, ctx),
    },
    {
      title: "Sable's March",
      story: "Corran's people have taken Sable's town. She escaped with a few guards and has " +
        "reached Blue's lines, but there is no factory for her there. The first colony's " +
        "archive, across the plain, still has one, and its records are the only proof of " +
        "what Echo really is. Blue escorts her; the others clear the way.",
      objective: "Get Mother Sable into the archive's factory. If she falls, the mission " +
        "fails.",
      failText: "Mother Sable has fallen.",
      map: {
        seed: 71,
        reshape: (map, rules) => ({
          archive: addFactory(map, freeHexNear(map, rules, mirror(map.factories[0]))),
        }),
      },
      humans: [
        human({ noHome: true, crystals: 0, units: ["vip", "tank", "lightMedic", "infantry"] }),
        human(),
        human(),
      ],
      ais: [
        faction("splinter", { crystals: 120, upgrades: ["heavyWorks"],
          units: ["sonicTank", "infantry", "infantry", "scoutBike", "lightHarvester"] }),
        faction("lattice", { level: "cadet", crystals: 60, upgrades: ["airfield"],
          units: ["attackHelicopter", "spotterDrone", "lightHarvester"] }),
      ],
      rules: SABLE_RULES,
      done: (state, ctx) => humansHold(state, ctx, ctx.sites.archive),
      failed: (state) => !unitAlive(state, "vip"),
    },
    {
      title: "The Broker",
      story: "General Kaldra has come to talk. \"Corran's friends are my enemies too. A " +
        "truce, until this is done.\" Meanwhile Varr's Syndicate is planting Crystal " +
        "Seeders on every field it can reach and selling the harvest to anyone, Corran " +
        "included. Starve Corran and Varr both.",
      objective: `Destroy ${SEEDERS_TO_DESTROY} Syndicate Crystal Seeders, and bank ` +
        `${BANK_TARGET} crystals between you.`,
      map: { seed: 89 },
      humans: human(),
      ais: [
        faction("consortium", { team: HUMAN_TEAM }),
        faction("syndicate", { team: THIRD_TEAM, crystals: 200,
          units: ["crystalSeeder", "crystalSeeder", "crystalSeeder", "turret", "infantry",
            "scoutBike", "lightHarvester"] }),
        faction("splinter", { crystals: 120 }),
      ],
      steps: [
        { text: `Destroy ${SEEDERS_TO_DESTROY} Crystal Seeders`, done: (state, ctx) =>
          lostCount(state, ctx.side("syndicate"), ["crystalSeeder"]) >= SEEDERS_TO_DESTROY },
        { text: `Bank ${BANK_TARGET} crystals between you`, done: (state, ctx) =>
          teamCrystals(state, ctx) >= BANK_TARGET },
      ],
      failed: (state, ctx) => !homesHeld(state, ctx),
    },
    {
      title: "Sky Burial",
      story: "Echo has emptied its hangars. Wave after wave of Lattice aircraft is crossing " +
        "the desert. The Skywing must win the air, the Bastion must keep the factories " +
        "standing, and the Foundry must pay for it all. Kaldra's column is with you.",
      objective: `Shoot down ${AIRCRAFT_TO_DESTROY} Lattice aircraft, without losing a ` +
        "home factory.",
      failText: "One of your home factories was overrun.",
      map: { seed: 103 },
      humans: [
        human({ kit: "skywing", upgrades: ["airfield"],
          units: ["lightHarvester", "fighter", "spotterDrone"] }),
        human({ kit: "bastion", upgrades: ["heavyWorks"],
          units: ["lightHarvester", "antiAircraftJeep", "twinTurret"] }),
        human({ kit: "foundry", upgrades: ["lab"],
          units: ["lightHarvester", "artillery", "crystalSeeder"] }),
      ],
      ais: [
        faction("consortium", { team: HUMAN_TEAM }),
        faction("lattice", { level: "marshal", crystals: 220,
          upgrades: ["airfield", "heavyWorks", "lab"],
          units: ["attackHelicopter", "attackHelicopter", "attackHelicopter", "fighter",
            "spotterDrone", "lightHarvester"],
          aiMix: { attackHelicopter: 0.45, fighter: 0.25, spotterDrone: 0.1,
            heavyCannon: 0.2 } }),
      ],
      script: [
        { id: "wave", repeat: true,
          when: (state) => humanPhase(state) && state.round % AIR_WAVE_EVERY === 0,
          act: (state, ctx) => reinforce(state, ctx.side("lattice"),
            ["attackHelicopter", "attackHelicopter"], home(state, ctx.side("lattice"))),
          note: "More Lattice aircraft are rising from the desert." },
      ],
      steps: [
        { text: `Shoot down ${AIRCRAFT_TO_DESTROY} aircraft`, done: (state, ctx) =>
          lostCount(state, ctx.side("lattice"), AIRCRAFT) >= AIRCRAFT_TO_DESTROY },
      ],
      failed: (state, ctx) => !homesHeld(state, ctx),
    },
    {
      title: "Embers",
      story: "Corran has dug in at his camp, and two Lattice relays feed Echo's army beyond " +
        "it. Kaldra's spies say Echo is about to turn on Corran: it has no more use for " +
        "him. If his camp is still standing when that happens, he may remember whose son " +
        "he is.",
      objective: "Overrun both Lattice relays.",
      failText: "One of your home factories was overrun.",
      map: {
        seed: 107,
        reshape: (map, rules) => ({
          relay1: addFactory(map, siteNear(map, rules, map.factories[4], 4,
            map.factories[3])),
          relay2: addFactory(map, siteNear(map, rules, map.factories[4], 4, "0,0")),
        }),
      },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "infantry"] }),
      ais: [
        faction("splinter", { crystals: 100, upgrades: ["heavyWorks"],
          units: ["sonicTank", "infantry", "infantry", "scoutBike", "lightHarvester"] }),
        faction("lattice", { level: "marshal", crystals: 180,
          upgrades: ["airfield", "heavyWorks"],
          units: ["heavyCannon", "attackHelicopter", "attackHelicopter", "twinTurret",
            "lightHarvester"] }),
        faction("ashborn", { team: HUMAN_TEAM, level: "cadet", crystals: 40,
          units: ["scoutBike", "infantry"] }),
      ],
      script: [
        { id: "start", when: () => true,
          act: (state, ctx) => ["relay1", "relay2"].reduce((s, name) =>
            takeFactory(s, ctx.sites[name], ctx.side("lattice"), ["twinTurret"]), state) },
        warning("strikeWarning", ECHO_STRIKES_ROUND, "Kaldra's spies: Lattice aircraft are " +
          "massing over Corran's camp. Echo will turn on him in two rounds."),
        { id: "echoStrikes",
          when: (state) => humanPhase(state) && state.round >= ECHO_STRIKES_ROUND,
          act: (state, ctx) => {
            const split = betray(state, ctx.side("splinter"), THIRD_TEAM);
            return reinforce(split, ctx.side("lattice"),
              ["attackHelicopter", "attackHelicopter", "infantry", "infantry"],
              home(split, ctx.side("splinter")));
          },
          note: "Echo: \"Your usefulness is over, Corran.\" Lattice aircraft are diving on " +
            "Corran's camp." },
        { id: "corranJoins",
          when: (state, ctx) => humanPhase(state) && state.round >= CORRAN_JOINS_ROUND &&
            homeHeld(state, ctx.side("splinter")),
          act: (state, ctx) => betray(state, ctx.side("splinter"), HUMAN_TEAM),
          note: "Corran: \"Echo lied. It never meant to bring anyone back. Help me finish it, " +
            "and I will answer to my mother after.\" Corran's Ashborn are your allies." },
      ],
      steps: [
        { text: "Overrun the first relay", done: (state, ctx) =>
          humansHold(state, ctx, ctx.sites.relay1) },
        { text: "Overrun the second relay", done: (state, ctx) =>
          humansHold(state, ctx, ctx.sites.relay2) },
      ],
      failed: (state, ctx) => !homesHeld(state, ctx),
    },
    {
      title: "Ashfall",
      story: "Echo's heart lies in a crater sealed by a wall of mountains, opened only by " +
        "three relays that guard each other. Take all three in the same round and the wall " +
        "comes down. Sable and Corran ride together for the first time in years.",
      objective: "Overrun the three relays in the same round, then the Lattice's home " +
        "factory.",
      map: {
        seed: 109,
        slots: [0, 1, 2, 3, 4, 5],
        reshape: (map, rules) => {
          const heart = map.factories[5];
          ringOfMountains(map, heart, HEART_RING);
          // Towards Blue, the middle of the map and Corran: spread round the crater.
          const toward = [map.factories[0], "0,0", map.factories[4]];
          return Object.fromEntries(RELAYS.map((name, i) => [name,
            addFactory(map, siteNear(map, rules, heart, RELAY_DISTANCE, toward[i]))]));
        },
      },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "tank", "infantry"] }),
      ais: [
        faction("ashborn", { team: HUMAN_TEAM, upgrades: ["heavyWorks"],
          units: ["scoutBike", "sonicTank", "infantry", "lightHarvester"] }),
        faction("splinter", { team: HUMAN_TEAM,
          units: ["scoutBike", "infantry", "infantry", "lightHarvester"] }),
        faction("lattice", { level: "marshal", crystals: 260,
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
          note: "The three relays go dark together, and the crater wall cracks open in three " +
            "places. The heart is open." },
      ],
      steps: [
        { text: "Overrun the three relays in the same round",
          done: (state, ctx) => ctx.fired("breach") !== undefined },
        { text: "Overrun the Lattice's home factory", done: (state, ctx) =>
          humansHold(state, ctx, home(state, ctx.side("lattice"))) },
      ],
    },
  ],
};
