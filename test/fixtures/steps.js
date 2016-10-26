'use strict';

module.exports = {
  '/': {
    next: '/about'
  },
  '/about': {
    fields: ['about-radio'],
    locals: {
      section: 'enquiry-details'
    }
  },
  '/type': {
    fields: ['type-radio'],
    locals: {
      section: 'enquiry-details'
    }
  },
  '/details': {
    fields: [
      'details-text',
      'existing-radio',
      'previous-radio'
    ],
    locals: {
      section: 'enquiry-details'
    }
  },
  '/person': {
    fields: ['person-text'],
    locals: {
      section: 'enquiry-details'
    }
  },
  '/people': {
    fields: [
      'person-one',
      'person-two'
    ],
    locals: {
      section: 'enquiry-details'
    }
  },
  '/additional': {
    fields: [
      'additional-names',
      'additional-text',
      'additional-radio'
    ],
    locals: {
      section: 'enquiry-details'
    }
  },
  '/how': {
    fields: [
      'how-radio',
      'online-toggle-text',
      'telephone-toggle-text',
      'telephone-toggle-text-2'
    ],
    locals: {
      section: 'order-details'
    }
  },
  '/which': {
    fields: [
      'which-radio'
    ],
    locals: {
      section: 'order-details'
    }
  },
  '/when': {
    fields: [
      'when-date',
      'when-date-day',
      'when-date-month',
      'when-date-year'
    ],
    locals: {
      section: 'order-details'
    }
  },
  '/name': {
    fields: ['name-text'],
    locals: {
      section: 'contact-details'
    }
  },
  '/email-address': {
    fields: ['email-text'],
    locals: {
      section: 'contact-details'
    }
  },
  '/country': {
    fields: [
      'country-select'
    ],
    locals: {
      section: 'contact-details',
      subsection: 'address'
    }
  },
  '/postcode': {
    fields: [
      'postcode-code'
    ],
    locals: {
      section: 'contact-details',
      subsection: 'address'
    }
  },
  '/address-lookup': {
    fields: [
      'address-lookup'
    ],
    locals: {
      section: 'contact-details',
      subsection: 'address'
    }
  },
  '/address': {
    fields: [
      'address-textarea'
    ],
    locals: {
      section: 'contact-details',
      subsection: 'address'
    }
  },
  '/confirm': {
    locals: {
      section: 'confirm'
    }
  },
  '/confirmation': {
    locals: {
      section: 'confirmation'
    }
  }
};
