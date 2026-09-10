#!/bin/zsh
cd /Users/Shared/acme-web
rm -rf .dwic

type_cmd() {
  printf '\033[1;36m$\033[0m '
  local cmd="$1"
  for (( i=1; i<=${#cmd}; i++ )); do printf "%s" "${cmd:$((i-1)):1}"; sleep 0.07; done
  sleep 0.6; printf "\n"
}

# Beat 1 - cold open
sleep 2.5

# Beats 2-5 - the one command, the verdict, the totals, and the real exit code
# printed by the same command line the viewer just watched being typed.
type_cmd 'npx dwic-audit; echo "exit code: $?"'
npx -y dwic-audit; echo "exit code: $?"
sleep 10

# Beat 6 - it left a real report behind
type_cmd 'head -16 .dwic/audit-*.md'
head -16 .dwic/audit-*.md
sleep 6.5
