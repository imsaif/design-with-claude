# Who this is for

Attribution: names and emails removed (role, source type, date). Decided 2026-11-12.

## Assumptions in the code
- [flow: signup] This code assumes every new user has a VAT number to give at signup · `app/signup/page.tsx:28` · contradicted
  Designer's answer: "most of our users are sole traders under the VAT threshold" · recalled
  Evidence: 3 of 5 interviewees invoice as sole traders without VAT (interviews, 2026-10) · reported
- [flow: signup] This code assumes everyone will give a mobile number at signup · `app/signup/page.tsx:26` · untested
  Designer's answer: "users want to be reachable" · assumed

## The job
When a client pays late, they want to know at once and nudge without awkwardness, so they can get paid without losing the relationship.
Evidence: "it's the chasing that eats my week" (freelance illustrator, interview, 2026-10-14)

## Needs
- [flow: signup] Know when an invoice goes overdue · reported · recurring
  "I found out a client was a month late only when I checked my bank." (role unknown, support email, 2026-10-09) · 3 people

## Odd ones out
- One freelance copywriter takes a 50 percent deposit and never chases (interview, 2026-10-21)

## Riskiest assumptions
1. Everyone has a mobile number they're willing to give at signup.
   Cheapest test: ask the next five sign-ups whether they'd skip the field.

## Gap to build for
Knowing a client is late without checking the bank.

## Who this is not for
- Agencies with a finance team, because someone already chases for them.

## Their words
- "chasing" ("it's the chasing that eats my week", freelance illustrator, interview, 2026-10-14)
- "wait and hope" (freelance product designer, interview, 2026-10-17)

Last updated: 2026-11-12 · Next question for a real person: "The last time a client paid late, how did you find out?"
