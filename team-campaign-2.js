// The 2-player team campaign, "The Varr Contract" (see team-campaigns.js for the fields).
// Director Varr stakes the two colonies, moves in beside them and sells them out; the
// Ashborn and then General Kaldra come over to their side; the Lattice wakes underneath it
// all. All figures are provisional.
import {
  HUMAN_TEAM, ENEMY_TEAM, THIRD_TEAM, human, faction, siteNear, addFactory, wallBetween,
  ringOfMountains, freeHexNear, humansHold, homesHeld, homeHeld, ownerAt, isOut,
  lostCount, hasUnit, roundStarted, betray, reinforce, giftEach, takeFactory, teamHolds,
  warning,
} from "./team-scenario.js?v=0.86";

// Targets and counts, kept next to the text that names them.
const CONVOY_CRYSTALS = 15;
const RAIDERS_TO_DESTROY = 8;
const GUESTS_TURN_ROUND = 6;
const SABLE_TRUCE_ROUND = 7;
// How far the siege camps stand from Kaldra's garrison.
const SIEGE_DISTANCE = 4;
const OLD_FACTORIES_TO_HOLD = 3;
const WAKE_ROUNDS = [3, 5, 7, 9];
const DEADLINE_ROUND = 11;
const LONG_NIGHT_ROUNDS = 15;
const WAVE_EVERY = 3;
const ASHBORN_ARRIVE_ROUND = 8;

const home = (state, p) => state.map.factories[p];
const humanPhase = (state) => state.phaseIndex === 0;
const sites = (ctx, names) => names.map((name) => ctx.sites[name]);

export const DUO_CAMPAIGN = {
  id: "duo",
  name: "The Varr Contract",
  players: 2,
  intro: "Two new colonies in the Tessaly Basin, the first to land since the Crystal War. " +
    "Director Ilse Varr has crystals to lend and a smile for everyone.",
  epilogue: "The heart goes dark, and the basin is quiet for the first time in a century. " +
    "Kaldra salutes and takes her column home. Somewhere off-world, Director Varr is " +
    "already selling the story.",
  missions: [
    {
      title: "Dry Landing",
      story: "Your ships came down in the Tessaly Basin with empty holds: a harvester, a Scout " +
        "Bike and a squad of Infantry each, and not a crystal between you. Director Varr's " +
        "Syndicate already works the basin, and she has offered to stake you: a convoy of " +
        `crystals every round while her factory stands. Consortium raiders want the basin ` +
        "for themselves, and they are already on their way.",
      objective: `Destroy ${RAIDERS_TO_DESTROY} Consortium units, and have a Tank each at ` +
        "the same time, without losing a home factory.",
      failText: "One of your home factories was overrun.",
      map: { seed: 11 },
      humans: human({ units: ["lightHarvester", "scoutBike", "infantry"], crystals: 0 }),
      ais: [
        faction("syndicate", { team: HUMAN_TEAM, level: "cadet", crystals: 150,
          units: ["tank", "turret", "lightHarvester", "lightHarvester"] }),
        faction("consortium", { level: "cadet", crystals: 60,
          units: ["scoutBike", "scoutBike", "scoutBike", "lightHarvester"],
          aiMix: { scoutBike: 0.5, infantry: 0.3, tank: 0.2 } }),
      ],
      script: [
        { id: "convoy", repeat: true,
          when: (state, ctx) => humanPhase(state) && state.round >= 2 &&
            homeHeld(state, ctx.side("syndicate")),
          act: (state, ctx) => giftEach(state, ctx, CONVOY_CRYSTALS),
          note: (state, ctx) => (ctx.fired("convoy") === state.round && state.round === 2
            ? `Varr's convoy is in: ${CONVOY_CRYSTALS} crystals each. "Pay me back when ` +
              "you can, darlings.\" It comes every round while her factory stands." : null) },
      ],
      steps: [
        { text: `Destroy ${RAIDERS_TO_DESTROY} Consortium units`,
          done: (state, ctx) => lostCount(state, ctx.side("consortium")) >=
            RAIDERS_TO_DESTROY },
        { text: "Each of you has a Tank",
          done: (state, ctx) => ctx.humans.every((p) => hasUnit(state, p, "tank")) },
      ],
      failed: (state, ctx) => !homesHeld(state, ctx),
    },
    {
      title: "Two Beacons",
      story: "Varr wants a favour in return. Two Consortium beacons watch the basin, each " +
        "guarded by a Turret that fires on anything that comes into range. Take one and the " +
        "other calls Kaldra's Tanks down on you. Take both in the same round and nobody hears " +
        "a thing. Varr's Infantry will join the attack.",
      objective: "Overrun both Consortium beacons in the same round.",
      map: {
        seed: 23,
        reshape: (map, rules) => {
          const enemy = map.factories[3];
          return {
            west: addFactory(map, siteNear(map, rules, enemy, 4, map.factories[0])),
            east: addFactory(map, siteNear(map, rules, enemy, 4, map.factories[2])),
          };
        },
      },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "infantry"] }),
      ais: [
        faction("syndicate", { team: HUMAN_TEAM, crystals: 80,
          units: ["infantry", "infantry", "scoutBike", "lightHarvester"] }),
        faction("consortium", { crystals: 110 }),
      ],
      script: [
        { id: "start", when: () => true,
          act: (state, ctx) => sites(ctx, ["west", "east"]).reduce((s, at) =>
            takeFactory(s, at, ctx.side("consortium"), ["turret"]), state) },
        { id: "alarm",
          when: (state, ctx) => roundStarted(state) &&
            sites(ctx, ["west", "east"]).filter((at) => humansHold(state, ctx, at)).length === 1,
          act: (state, ctx) => {
            const left = sites(ctx, ["west", "east"]).find((at) => !humansHold(state, ctx, at));
            return reinforce(state, ctx.side("consortium"), ["tank", "tank"], left);
          },
          note: "The other beacon got the warning out: two Consortium Tanks have arrived to " +
            "guard it. Take it back in the same round as the first." },
      ],
      steps: [
        { text: "Overrun the west beacon", done: (state, ctx) =>
          humansHold(state, ctx, ctx.sites.west) },
        { text: "Overrun the east beacon", done: (state, ctx) =>
          humansHold(state, ctx, ctx.sites.east) },
      ],
      sameRound: true,
    },
    {
      title: "Guests",
      story: "Varr has built a forward post beside each of your bases, with a Turret and a " +
        "squad of her Infantry, \"to keep the Consortium off you\". The Consortium is " +
        "probing your lines again. Kaldra's last signal before the beacons fell said only " +
        "this: \"Ask the Director who pays her more.\" Varr's Turrets do seem to point at " +
        "your factories.",
      objective: "Overrun both of Varr's forward posts and keep your home factories.",
      failText: "One of your home factories was overrun.",
      map: {
        seed: 37,
        reshape: (map, rules) => ({
          postBlue: addFactory(map, siteNear(map, rules, map.factories[0], 3)),
          postGreen: addFactory(map, siteNear(map, rules, map.factories[1], 3)),
        }),
      },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "heavyTank"] }),
      ais: [
        faction("syndicate", { team: HUMAN_TEAM, crystals: 120,
          units: ["heavyTank", "scoutBike", "lightHarvester"] }),
        faction("consortium", { level: "cadet" }),
      ],
      script: [
        { id: "start", when: () => true,
          act: (state, ctx) => sites(ctx, ["postBlue", "postGreen"]).reduce((s, at) =>
            takeFactory(s, at, ctx.side("syndicate"), ["turret", "infantry", "infantry"]),
          state) },
        warning("turnWarning", GUESTS_TURN_ROUND, "Kaldra, on an open channel: \"Varr " +
          "has been talking to my quartermaster about your factories. I would not turn your " +
          "backs on her posts.\" Something is coming within two rounds."),
        { id: "turn",
          when: (state) => humanPhase(state) && state.round >= GUESTS_TURN_ROUND,
          act: (state, ctx) => betray(state, ctx.side("syndicate"), ENEMY_TEAM),
          note: "Varr's Turrets swing round to face your factories. \"Nothing personal, " +
            "darlings. Kaldra pays better.\" The Syndicate is with the Consortium now, and " +
            "its Infantry are next to your factories." },
      ],
      steps: [
        { text: "Overrun Varr's post by Blue's base", done: (state, ctx) =>
          humansHold(state, ctx, ctx.sites.postBlue) },
        { text: "Overrun Varr's post by Green's base", done: (state, ctx) =>
          humansHold(state, ctx, ctx.sites.postGreen) },
      ],
      failed: (state, ctx) => !homesHeld(state, ctx),
    },
    {
      title: "Sable's Valley",
      story: "Varr's army has gone north into the ruins of the first colony, where the " +
        "Ashborn live. She is burning them out to strip their crystals. The Ashborn fire on " +
        "anyone who comes near, you included, and Mother Sable trusts nobody. But if Varr " +
        "takes their home, nobody will ever find the way north.",
      objective: "Overrun Varr's home factory. The Ashborn home must not fall, to Varr or to " +
        "you.",
      failText: "The Ashborn home fell. Without Sable's guides there is no way north.",
      map: { seed: 41, slots: [0, 1, 2, 3] },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "infantry"] }),
      ais: [
        faction("ashborn", { team: THIRD_TEAM, level: "cadet", crystals: 60,
          units: ["scoutBike", "scoutBike", "infantry", "infantry"] }),
        faction("syndicate", { crystals: 160, upgrades: ["heavyWorks"],
          units: ["infantry", "infantry", "tank", "blastCannon", "lightHarvester"] }),
      ],
      script: [
        { id: "truce",
          when: (state, ctx) => humanPhase(state) && state.round >= SABLE_TRUCE_ROUND &&
            homeHeld(state, ctx.side("ashborn")),
          act: (state, ctx) => betray(state, ctx.side("ashborn"), HUMAN_TEAM),
          note: "Mother Sable: \"You could have let Varr burn us. You did not. My people " +
            "will fight beside you, for now.\" The Ashborn are your allies." },
      ],
      done: (state, ctx) => humansHold(state, ctx, home(state, ctx.side("syndicate"))),
      failed: (state, ctx) => isOut(state, ctx.side("ashborn")) ||
        !homeHeld(state, ctx.side("ashborn")) || !homesHeld(state, ctx),
    },
    {
      title: "High Road",
      story: "Varr has fled over the Spine, a wall of mountains with one pass, and her Heavy " +
        "Cannons and Turrets hold it. Sable's guides know the high ground. Blue takes the " +
        "air wing, Green the foundry and its siege guns: neither of you can do the other's " +
        "job. The Ashborn will follow you through.",
      objective: "Destroy both of Varr's Heavy Cannons and every Syndicate Turret.",
      map: {
        seed: 53,
        reshape: (map) => ({
          pass: wallBetween(map, map.factories[3], "0,0", 1),
        }),
      },
      humans: [
        human({ kit: "skywing", upgrades: ["airfield"],
          units: ["lightHarvester", "spotterDrone", "attackHelicopter"] }),
        human({ kit: "foundry", upgrades: ["heavyWorks"],
          units: ["lightHarvester", "artillery", "lightMedic"] }),
      ],
      ais: [
        faction("ashborn", { team: HUMAN_TEAM, crystals: 60,
          units: ["scoutBike", "infantry", "infantry", "sonicTank"], upgrades: ["heavyWorks"] }),
        faction("syndicate", { crystals: 140, upgrades: ["heavyWorks"],
          units: ["antiAircraftJeep", "antiAircraftJeep", "lightHarvester", "infantry"] }),
      ],
      script: [
        { id: "start", when: () => true,
          act: (state, ctx) => reinforce(state, ctx.side("syndicate"),
            ["heavyCannon", "heavyCannon", "turret", "turret"], ctx.sites.pass) },
      ],
      steps: [
        { text: "Destroy both Heavy Cannons", done: (state, ctx) =>
          lostCount(state, ctx.side("syndicate"), ["heavyCannon"]) >= 2 },
        { text: "Destroy every Syndicate Turret", done: (state, ctx) =>
          lostCount(state, ctx.side("syndicate"), ["turret"]) > 0 &&
          !hasUnit(state, ctx.side("syndicate"), "turret") },
      ],
    },
    {
      title: "Kaldra's Word",
      story: "A message under a white flag, from General Kaldra. Varr cheated the Consortium " +
        "too: she paid in forged crystal rights, then brought her guns against Kaldra's " +
        "garrison. Two Syndicate siege camps are shelling it. Take one and the other turns " +
        "its Artillery on the garrison, so take both in the same round. \"Do this,\" says " +
        "Kaldra, \"and the Consortium owes you. I do not forget a debt.\"",
      objective: "Overrun both Syndicate siege camps in the same round. Kaldra's garrison " +
        "must hold.",
      failText: "Kaldra's garrison fell.",
      map: {
        seed: 67,
        reshape: (map, rules) => ({
          campNear: addFactory(map, siteNear(map, rules, map.factories[2], SIEGE_DISTANCE,
            map.factories[1])),
          campFar: addFactory(map, siteNear(map, rules, map.factories[2], SIEGE_DISTANCE,
            map.factories[3])),
        }),
      },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "infantry"] }),
      ais: [
        faction("consortium", { team: HUMAN_TEAM, crystals: 100,
          upgrades: ["heavyWorks", "lab"],
          units: ["heavyCannon", "tank", "tank", "infantry", "lightHarvester"] }),
        faction("syndicate", { crystals: 150, units: ["tank", "scoutBike", "lightHarvester",
          "infantry", "infantry"] }),
      ],
      script: [
        { id: "start", when: () => true,
          act: (state, ctx) => sites(ctx, ["campNear", "campFar"]).reduce((s, at) =>
            takeFactory(s, at, ctx.side("syndicate"), ["artillery", "turret"]), state) },
      ],
      steps: [
        { text: "Overrun the near siege camp", done: (state, ctx) =>
          humansHold(state, ctx, ctx.sites.campNear) },
        { text: "Overrun the far siege camp", done: (state, ctx) =>
          humansHold(state, ctx, ctx.sites.campFar) },
      ],
      sameRound: true,
      failed: (state, ctx) => !homeHeld(state, ctx.side("consortium")),
    },
    {
      title: "What Sleeps Below",
      story: "Varr's captured logs show what she was digging for: something under the basin. " +
        "The ground shakes. Old factories, dead for a century, light up one by one, and a " +
        "voice comes over every channel at once: \"Visitors. You have been very loud.\" It " +
        "calls itself Echo. Kaldra keeps her word and sends a column to help.",
      objective: `Hold ${OLD_FACTORIES_TO_HOLD} of the old factories at the start of round ` +
        `${DEADLINE_ROUND}. Overrun them before they wake.`,
      failText: "The old factories are the Lattice's now.",
      map: {
        seed: 79,
        reshape: (map, rules) => {
          const names = ["oldNorth", "oldEast", "oldSouth", "oldWest"];
          const marks = ["0,-6", "6,-3", "0,6", "-6,3"];
          return Object.fromEntries(names.map((name, i) =>
            [name, addFactory(map, freeHexNear(map, rules, marks[i]))]));
        },
      },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "infantry", "infantry"] }),
      ais: [
        faction("consortium", { team: HUMAN_TEAM }),
        faction("lattice", { crystals: 120, upgrades: ["airfield", "heavyWorks"],
          units: ["spotterDrone", "twinTurret", "heavyCannon", "lightHarvester"] }),
      ],
      script: WAKE_ROUNDS.map((round, i) => ({
        id: `wake${i}`,
        when: (state) => humanPhase(state) && state.round >= round,
        act: (state, ctx) => takeFactory(state,
          sites(ctx, ["oldNorth", "oldEast", "oldSouth", "oldWest"])[i],
          ctx.side("lattice"), ["attackHelicopter", "twinTurret"]),
        note: (state, ctx) => {
          const at = sites(ctx, ["oldNorth", "oldEast", "oldSouth", "oldWest"])[i];
          return ownerAt(state, at) === ctx.side("lattice")
            ? "Another old factory lights up and starts building for the Lattice."
            : "An old factory tried to wake, but it is yours: it stays dark to Echo.";
        },
      })),
      done: (state, ctx) => state.round >= DEADLINE_ROUND && homesHeld(state, ctx) &&
        sites(ctx, ["oldNorth", "oldEast", "oldSouth", "oldWest"])
          .filter((at) => humansHold(state, ctx, at)).length >= OLD_FACTORIES_TO_HOLD,
      failed: (state, ctx) => !homesHeld(state, ctx) || (state.round >= DEADLINE_ROUND &&
        sites(ctx, ["oldNorth", "oldEast", "oldSouth", "oldWest"])
          .filter((at) => humansHold(state, ctx, at)).length < OLD_FACTORIES_TO_HOLD),
    },
    {
      title: "The Director's Last Deal",
      story: "Varr has holed up in the Glass Canyon with every crystal she stole, right " +
        "beside the Lattice's node, and her guns fire on everyone. Kaldra is blunt: \"The " +
        "moment her factory or the node falls, she runs, and the crystals go with her.\" " +
        "Get Infantry ready by both, then take them in the same round.",
      objective: "Overrun the Lattice node (its home factory) and Varr's home factory in the " +
        "same round, before she can run.",
      failText: "Varr got away with the crystals.",
      map: { seed: 83, slots: [0, 1, 2, 4, 3] },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "infantry", "infantry"] }),
      ais: [
        faction("syndicate", { team: THIRD_TEAM, crystals: 120,
          units: ["turret", "turret", "infantry", "scoutBike", "lightHarvester"] }),
        faction("consortium", { team: HUMAN_TEAM }),
        faction("lattice", { level: "marshal", crystals: 160,
          upgrades: ["airfield", "heavyWorks"],
          units: ["heavyCannon", "twinTurret", "attackHelicopter", "attackHelicopter",
            "lightHarvester"] }),
      ],
      script: [
        { id: "flee",
          when: (state, ctx) => humanPhase(state) &&
            (ownerAt(state, home(state, ctx.side("lattice"))) !== ctx.side("lattice") ||
              ownerAt(state, home(state, ctx.side("syndicate"))) !== ctx.side("syndicate")),
          note: "Varr's Transporters are loading crystals. Take the other factory before this " +
            "round ends, or she is gone." },
      ],
      done: (state, ctx) => ["lattice", "syndicate"].every((side) =>
        teamHolds(state, home(state, ctx.side(side)))),
      failed: (state, ctx) => !homesHeld(state, ctx) ||
        (ctx.fired("flee") !== undefined && state.round > ctx.fired("flee")),
    },
    {
      title: "The Long Night",
      story: "Echo has stopped talking. Every factory the Lattice holds is building, and the " +
        "dust storms hide its aircraft until they are on you. Wave after wave is coming for " +
        "your factories and Kaldra's. Sable has promised her people, if you can hold until " +
        "they cross the dunes.",
      objective: `Hold your home factories, and Kaldra's, until round ${LONG_NIGHT_ROUNDS}.`,
      failText: "A home factory fell in the night.",
      map: { seed: 97, slots: [0, 1, 2, 3, 4] },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "turret"] }),
      ais: [
        faction("consortium", { team: HUMAN_TEAM, upgrades: ["heavyWorks", "lab"] }),
        faction("lattice", { level: "marshal", crystals: 200,
          upgrades: ["airfield", "heavyWorks", "lab"],
          units: ["heavyCannon", "attackHelicopter", "attackHelicopter", "twinTurret",
            "lightHarvester"] }),
        faction("ashborn", { team: HUMAN_TEAM, level: "cadet", crystals: 40,
          units: ["scoutBike", "lightHarvester"] }),
      ],
      script: [
        { id: "wave", repeat: true,
          when: (state) => humanPhase(state) && state.round % WAVE_EVERY === 0,
          act: (state, ctx) => reinforce(state, ctx.side("lattice"),
            ["attackHelicopter", "attackHelicopter", "infantry", "infantry"],
            home(state, ctx.side("lattice"))),
          note: "Another Lattice wave is on its way." },
        { id: "ashborn",
          when: (state) => humanPhase(state) && state.round >= ASHBORN_ARRIVE_ROUND,
          act: (state, ctx) => reinforce(state, ctx.side("ashborn"),
            ["sonicTank", "sonicTank", "infantry", "infantry"], home(state, ctx.humans[0])),
          note: "Sable's people have crossed the dunes: two Sonic Tanks and their Infantry " +
            "are at Blue's base." },
      ],
      done: (state, ctx) => state.round > LONG_NIGHT_ROUNDS && homesHeld(state, ctx) &&
        homeHeld(state, ctx.side("consortium")),
      failed: (state, ctx) => !homesHeld(state, ctx) ||
        !homeHeld(state, ctx.side("consortium")),
    },
    {
      title: "The Heart of Kharon",
      story: "The Lattice's heart is a factory older than any colony, in a crater ringed by " +
        "mountains, fed by three relay factories. Echo speaks one last time: \"I kept this " +
        "world for a hundred years. What will you keep?\" Kaldra's guns and Sable's people " +
        "are with you. Take the relays, then the heart.",
      objective: "Overrun all three Lattice relays, then the Lattice's home factory.",
      map: {
        seed: 101,
        slots: [0, 1, 2, 3, 4],
        reshape: (map, rules) => {
          const heart = map.factories[3];
          ringOfMountains(map, heart, 3, [map.factories[0], map.factories[2]]);
          return {
            relay1: addFactory(map, siteNear(map, rules, heart, 5, map.factories[0])),
            relay2: addFactory(map, siteNear(map, rules, heart, 5, map.factories[2])),
            relay3: addFactory(map, siteNear(map, rules, heart, 5, map.factories[4])),
          };
        },
      },
      humans: human({ units: ["lightHarvester", "scoutBike", "tank", "infantry"] }),
      ais: [
        faction("consortium", { team: HUMAN_TEAM, upgrades: ["heavyWorks"],
          units: ["tank", "heavyCannon", "lightHarvester", "infantry"] }),
        faction("lattice", { level: "marshal", crystals: 250,
          upgrades: ["airfield", "heavyWorks", "lab"],
          units: ["heavyCannon", "heavyCannon", "attackHelicopter", "fighter",
            "lightHarvester"] }),
        faction("ashborn", { team: HUMAN_TEAM, upgrades: ["heavyWorks"],
          units: ["scoutBike", "sonicTank", "infantry", "lightHarvester"] }),
      ],
      script: [
        { id: "start", when: () => true,
          act: (state, ctx) => sites(ctx, ["relay1", "relay2", "relay3"]).reduce((s, at) =>
            takeFactory(s, at, ctx.side("lattice"), ["twinTurret"]), state) },
      ],
      steps: [
        { text: "Overrun the three relays", done: (state, ctx) =>
          sites(ctx, ["relay1", "relay2", "relay3"]).every((at) => humansHold(state, ctx, at)) },
        { text: "Overrun the heart", done: (state, ctx) =>
          humansHold(state, ctx, home(state, ctx.side("lattice"))) },
      ],
    },
  ],
};
