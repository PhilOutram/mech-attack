#!/bin/sh
# Balance experiments: evolves AI personalities under each rule variant of an experiment, two
# seeds each, in parallel, so the best strategy under each variant can be compared. Results
# go to docs/balance/<experiment>/<variant>-s<seed>.{md,json}; tools/balance-summary.mjs
# tabulates them.
# Usage (from the project folder): sh tools/balance.sh upgrades|economy
EXPERIMENT=${1:-economy}
OUT="docs/balance/$EXPERIMENT"
SETTINGS="--generations 20 --population 16 --games 8 --benchmark 60 --keep 3"
mkdir -p "$OUT"

run() {
  name=$1
  shift
  for seed in 1 2; do
    node evolve.js $SETTINGS --seed $seed "$@" \
      --out "$OUT/$name-s$seed.js" --report "$OUT/$name-s$seed.md" \
      --json "$OUT/$name-s$seed.json" > "$OUT/$name-s$seed.log" 2>&1 &
  done
}

if [ "$EXPERIMENT" = "upgrades" ]; then
  # Do cheaper upgrades, stronger heavy units or harder-to-undo capture make upgrading and
  # capturing worth it?
  CHEAP="--set factoryUpgrades.heavyWorks.cost=50 --set factoryUpgrades.airfield.cost=50"
  STRONG="--set units.heavyCannon.attack=50 --set units.heavyCannon.defence=50"
  STRONG="$STRONG --set units.blastCannon.attack=50 --set units.blastCannon.defence=15"
  STRONG="$STRONG --set units.sonicTank.attack=20 --set units.sonicTank.defence=25"
  SLOW="--set capture.mustStartNextTo=true"
  run baseline
  run cheap-upgrades $CHEAP
  run strong-heavy $STRONG
  run slow-capture $SLOW
  run guarded-capture --set capture.guarded=true
  run combined $CHEAP $STRONG $SLOW
else
  # Is the Scout Bike and Light Medic core too efficient, is income too low, and does income
  # from captured factories make capturing worth fighting over?
  DEAR_SCOUT="--set units.scoutBike.cost=45"
  DEAR_MEDIC="--set units.lightMedic.cost=60"
  INCOME="--set capture.incomePerTurn=10"
  run baseline
  run dear-scout $DEAR_SCOUT
  run weak-scout --set units.scoutBike.attack=10
  run dear-medic $DEAR_MEDIC
  run more-income --set start.crystals=100 --set crystals.spawnChoices=[1] \
    --set crystals.spawnAmount=20
  run capture-income $INCOME
  run combined $DEAR_SCOUT $DEAR_MEDIC $INCOME
fi
wait
echo "All variants done"
