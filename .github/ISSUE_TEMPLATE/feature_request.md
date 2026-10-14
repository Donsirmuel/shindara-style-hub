name: Feature request
description: A vendor need the template should cover
labels: [enhancement]
body:
  - type: textarea
    id: need
    attributes:
      label: Vendor need (not solution)
      placeholder: e.g. "My delivery guy needs a daily packing list he can print"
    validations:
      required: true
  - type: dropdown
    id: volume
    attributes:
      label: Order volume this is for
      options: ["Under 10/day", "10-50/day", "50-150/day", "150+/day"]
