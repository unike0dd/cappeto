# Security Policy

## Reporting a vulnerability

Please use GitHub private vulnerability reporting for this repository instead of opening a public issue.

Do not include passwords, payment data, customer information, access tokens, or exploitation details in public discussions.

## Supported code

Security updates target the default branch and the currently active cloud-migration pull request. Static prototypes are demonstrations and must not be treated as production authentication or payment systems.

## Payment handling

Cappeto must not collect, store, process, or transmit raw card details. Payment entry must remain on an approved payment-provider surface. PCI DSS scope and the applicable merchant validation method must be confirmed with the acquiring bank or a qualified assessor before production payments.
