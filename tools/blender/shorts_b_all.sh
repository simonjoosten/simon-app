#!/bin/zsh
# Rendert alle 100 shorts van batch b in groepjes van 10 (één Blender per groep).
cd "$(dirname "$0")"; B=~/Applications/Blender.app/Contents/MacOS/Blender
for start in $(seq 101 10 191); do
  ids=(); for i in $(seq $start $((start+9))); do ids+=("s$i"); done
  $B -b --python shorts_b_run.py -- 0 $ids 2>&1 | grep -E "KLAAR|FOUT|Traceback|Error" >> /tmp/shorts_b.log
done
echo ALLES-KLAAR >> /tmp/shorts_b.log
