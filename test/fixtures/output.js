'use strict';

module.exports = [
  {
    fields: [
      {
        field: 'about-radio',
        label: 'About Radio',
        step: '/about',
        value: 'Wrong Certificate Received'
      },
      {
        field: 'type-radio',
        label: 'Type Radio',
        step: '/type',
        value: 'Birth Certificate'
      },
      {
        field: 'details-text',
        label: 'Details Text',
        step: '/details',
        value: 'Some further details'
      },
      {
        field: 'existing-radio',
        label: 'Existing Radio',
        step: '/details',
        value: 'No'
      },
      {
        field: 'previous-radio',
        label: 'Previous Radio',
        step: '/details',
        value: 'No'
      },
      {
        field: 'person-text',
        label: 'Person Text',
        step: '/person',
        value: 'Some text to find from within the email'
      },
      {
        field: 'person-one',
        label: 'Person One',
        step: '/people',
        value: 'A name'
      },
      {
        field: 'person-two',
        label: 'Person Two',
        step: '/people',
        value: 'Another name'
      },
      {
        field: 'additional-names',
        label: 'Additional Names',
        step: '/additional',
        value: 'Additional Names'
      },
      {
        field: 'additional-text',
        label: 'Additional Text',
        step: '/additional',
        value: 'Some additional text'
      },
      {
        field: 'additional-radio',
        label: 'Additional Radio',
        step: '/additional',
        value: 'Yes'
      }
    ],
    section: 'Enquiry Details'
  },
  {
    fields: [
      {
        field: 'how-radio',
        label: 'How Radio',
        step: '/how',
        value: 'By Post'
      },
      {
        field: 'online-toggle-text',
        label: 'Online Toggle Text',
        step: '/how',
        value: '12345'
      },
      {
        field: 'telephone-toggle-text',
        label: 'Telephone Toggle Text',
        step: '/how',
        value: 'abcde'
      },
      {
        field: 'telephone-toggle-text-2',
        label: 'Telephone Toggle Text 2',
        step: '/how',
        value: 'abc123'
      },
      {
        field: 'which-radio',
        label: 'Which Radio',
        step: '/which',
        value: 'Recorded Delivery'
      },
      {
        field: 'when-date',
        label: 'When Date',
        step: '/when',
        value: '01/01/2001'
      }
    ],
    section: 'Order Details'
  },
  {
    fields: [
      {
        field: 'name-text',
        label: 'Name Text',
        step: '/name',
        value: 'Sterling Archer'
      },
      {
        field: 'email-text',
        label: 'Email Text',
        step: '/email-address',
        value: 'sterling@archer.com'
      },
      {
        field: 'country-select',
        label: 'Country Select',
        step: '/country',
        value: 'United Kingdom'
      },
      {
        field: 'postcode-code',
        label: 'Postcode Code',
        step: '/postcode',
        value: 'CR0 1ND'
      },
      {
        field: 'address-textarea',
        label: 'Address Textarea',
        step: '/address',
        value: '123 Example Street, Croydon'
      }
    ],
    section: 'Contact Details'
  }
];
