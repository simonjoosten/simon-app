#!/bin/zsh
cd "$(dirname "$0")"
B=~/Applications/Blender.app/Contents/MacOS/Blender
for r in "s201 s210" "s211 s220" "s221 s230" "s231 s240" "s241 s250" "s251 s260" "s261 s270" "s271 s280" "s281 s290" "s291 s300"; do
  $B -b --python shorts_c_run.py -- ${=r} 2>&1 | grep -E "^(DONE|TIME)|Traceback|Error" 
done
echo ALLDONE
