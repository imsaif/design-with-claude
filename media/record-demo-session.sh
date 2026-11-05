#!/bin/zsh
cd /Users/Shared/acme-web
# A recording isn't real usage, so it sends no ping.
export DWIC_TELEMETRY=off
printf '\033[1;36m$\033[0m '
cmd="npx dwic-audit"
for (( i=1; i<=${#cmd}; i++ )); do printf "%s" "${cmd:$((i-1)):1}"; sleep 0.06; done
sleep 0.5; printf "\n"
npx -y --prefer-online dwic-audit
sleep 4
