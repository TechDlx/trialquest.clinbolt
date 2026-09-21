/**
 * Real-world figures quoted in more than one place. Change them here only; every copy string
 * that cites them is a template over these values. Sources: docs/CONTENT_REVIEW.md rows 50–52.
 */
export const figures = {
  /** Likelihood of approval from Phase I: 7.9 % (BIO/Informa/QLS 2011–2020), 6.7 % (Citeline 2024). */
  approval: {
    short: 'fewer than 1 in 10',
    /** The same figure at the start of a sentence. */
    shortStart: 'Fewer than 1 in 10',
    detail: '7 to 8 in 100 in the latest decade-long analyses',
    failShort: 'more than 9 in 10',
  },
} as const;
