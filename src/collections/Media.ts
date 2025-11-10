import type { CollectionConfig } from 'payload'

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
      label: 'Description',
    },
  ],
  upload: {
    mimeTypes: [
      'audio/3gpp',
      'video/3gpp',
      'audio/amr',
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/m4a',
      'audio/aac',
      'audio/x-m4a',
      'audio/ogg',
      'audio/wav',
      'audio/webm',
    ],
  },
}
