name: Bug report
description: Something broken in the storefront or admin
labels: [bug]
body:
  - type: input
    id: page
    attributes:
      label: Where?
      description: e.g. /checkout, /admin products tab, order SH-123456
    validations:
      required: true
  - type: textarea
    id: what
    attributes:
      label: What happened vs what you expected?
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
      placeholder: 1. Added 12x Ankara dress… 2. Went to checkout…
