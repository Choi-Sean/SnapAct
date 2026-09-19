// Ranking/ — candidate generation, Bayesian scoring, exploration (step 10).
//
// Two stages, deliberately separated. Candidate generation is deterministic
// rules — preconditions, tier filtering, permission fallbacks — because
// whether an action is even possible is not something to learn. Ranking then
// scores what survived.
//
// Ranking only reorders; it never removes a candidate, so a wrong inference
// costs position, not availability.
//
// Exploration is mandatory, not a refinement: showing only the top 3 means
// ranks 4+ never accumulate evidence and the ordering is frozen at whatever
// the priors happened to be.
