from .models import Category

# Tier 0: free for everyone, guest or signed in — either genuinely sensitive
# (medication/prescriptions) or low-extraction-value (document, unrecognized),
# so there's no real reason to gate them.
# Tier 1: the rich structured-save categories (a full contact, a calendar
# event, an itemized receipt) — the actual paid product, requires an account
# and token balance.
TIER0_CATEGORIES: frozenset[Category] = frozenset({"medication", "document", "other"})
TIER1_TOKEN_COST = 10

STARTER_TOKENS = 50

# Sample pricing — placeholders to be tuned once real usage data exists.
TOKEN_PACKAGES = [
    {"id": "small", "tokens": 100, "price_usd": 2.99},
    {"id": "medium", "tokens": 500, "price_usd": 9.99},
    {"id": "large", "tokens": 1500, "price_usd": 19.99},
]


def is_tier0(category: Category) -> bool:
    return category in TIER0_CATEGORIES
