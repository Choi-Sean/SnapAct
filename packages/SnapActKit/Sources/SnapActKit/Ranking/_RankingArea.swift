// Ranking/ — candidate generation and Bayesian ranking (step 7).
//
// Two stages, deliberately separated: candidate generation is deterministic
// (rules, preconditions, tier filtering) and ranking is scored. Ranking only
// reorders — it never removes a candidate, so a wrong inference costs
// position, not availability.
