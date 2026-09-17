# PURGE — ready for deletion

This directory is deliberately disconnected from the Cappeto application. Nothing here is imported, linked, served, executed, triggered, or referenced by the repository’s runtime.

Confirmed obsolete material isolated here:

- Five legacy product images superseded by the numbered 20-product catalog.
- One unused financial-workspace JavaScript calculation.
- Obsolete CSS selectors from retired inventory-summary layouts.
- Obsolete English and Spanish translation keys from retired summary layouts.

The entire `PURGE` directory can be deleted without changing the application’s current behavior.

## Removed JavaScript

```js
const customerCollectedCents = summary.salesCents + summary.taxCents;
```

## Removed CSS selectors

```css
.inventory-summary-heading
.inventory-summary-labels
.inventory-title /* only where nested under .inventory-summary-heading */
.finance-workspace
.tax-summary-row td
.profit-summary-row td
.anchor-target
.auth-copy
.consent-only
.demo-note
.inventory-metrics
.security-note
```

## Removed translation keys

```text
browse
returns
summaryGrossEarnings
summaryNetEarnings
taxFormula
grossCollected
grossFormula
provisionalNetSales
netFormula
procurementCostShort
taxesPaidToGovernment
summaryExplanation
summarySection
summaryConnection
summaryAmount
inventorySummaryConnection
salesSummaryConnection
taxSummaryConnection
customerTotalCollected
customerTotalConnection
cogsSummaryConnection
grossSummaryConnection
damagedSummaryConnection
netSummaryConnection
summaryProductsAvailable
summaryMoneyFromSales
summaryTaxesCollected
summaryCustomerPaid
summarySoldProductsCost
summaryMoneyBeforeDamage
summaryDamagedCost
summaryMoneyLeft
tenDaySummary
damageAndTotals
```
