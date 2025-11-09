import type { CollectionConfig } from 'payload'

import { isR2Configured } from '../util/r2'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    disableLocalStorage: isR2Configured(),
  },
}
