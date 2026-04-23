# Test Data

Seed scripts are deterministic and intended only for local, test and demo environments. Never reuse these passwords in staging or production.

## Accounts

| Email | Password | Role | Usage |
| --- | --- | --- | --- |
| admin@giftshop.test | AdminPass123! | admin | Admin-only product, category and order management |
| user1@giftshop.test | UserPass123! | user | Cart and own-order happy paths |
| user2@giftshop.test | UserPass123! | user | Cross-user order authorization checks |

## Product Edge Cases

| Product | Stock Setup | Scenario |
| --- | --- | --- |
| QA Out Of Stock Camera | stock=0 | Add-to-cart stock validation |
| QA Out Of Stock Doll | stock=0 | Negative stock edge case |
| QA Last Item Lamp | stock=1 | Last-item purchase |
| QA Last Item Book | stock=1 | Concurrency/race-condition tests |
| QA Fully Reserved Console | reservedQuantity=stock | Reserved inventory cannot be ordered |
| QA Fully Reserved Toy Car | reservedQuantity=stock | Cart overflow validation |
| QA Free Sticker | price=0 | Zero-price edge case |
| QA One Cent Bookmark | price=0.01 | Minimal currency edge case |

## Order Statuses

| Status | Seed Owner | Scenario |
| --- | --- | --- |
| pending | user1@giftshop.test | Admin confirm flow |
| confirmed | user2@giftshop.test | Admin ship/cancel flow |
| shipped | user1@giftshop.test | Admin deliver flow |
| delivered | user2@giftshop.test | Paid/completed order reporting |
| cancelled | user1@giftshop.test | Cancelled order visibility |

The Mongo model represents payment state separately through `paymentStatus`; the paid example is the delivered order with `paymentStatus=paid`.

## Commands

```bash
npm run seed
npm run seed:test
npm run seed:demo
```

Use `node scripts/seed.js --env=dev --reset` when you need an explicit environment flag.
