#!/bin/sh
# Balance experiment: evolves AI personalities under each rule variant, two seeds each, in
# parallel, so the best strategy under each variant can be compared. Results go to
# docs/balance/<variant>-s<seed>.{md,json}; tools/balance-summary.mjs tabulates them.
# Usage (from the project folder): sh tools/balance.sh
SETTINGS="--generations 20 --population 16 --games 8 --benchmark 60 --keep 3"
CHEAP="--set factoryUpgrades.heavyWorks.cost=50 --set factoryUpgrades.airfield.cost=50"
STRONG="--set units.heavyCannon.attack=50 --set units.heavyCannon.defence=50"
STRONG="$STRONG --set units.blastCannon.attack=50 --set units.blastCannon.defence=15"
STRONG="$STRONG --set units.sonicTank.attack=20 --set units.sonicTank.defence=25"
SLOW="--set capture.mustStartNextTo=true"
GUARDED="--set capture.guarded=true"

run() {
  name=$1
  shift
  for seed in 1 2; do
    node evolve.js $SETTINGS --seed $seed "$@" \
      --out "docs/balance/$name-s$seed.js" --report "docs/balance/$name-s$seed.md" \
      --json "docs/balance/$name-s$seed.json" > "docs/balance/$name-s$seed.log" 2>&1 &
  done
}

run baseline
run cheap-upgrades $CHEAP
run strong-heavy $STRONG
run slow-capture $SLOW
run guarded-capture $GUARDED
run combined $CHEAP $STRONG $SLOW
wait
echo "All variants done"
