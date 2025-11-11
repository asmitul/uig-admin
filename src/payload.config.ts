import { s3Storage } from '@payloadcms/storage-s3'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig, type CollectionConfig, type Plugin } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const storagePlugins: Plugin[] = []
const isR2Configured = Boolean(
  process.env.R2_BUCKET &&
    (process.env.R2_ENDPOINT || process.env.R2_ACCOUNT_ID) &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY,
)

if (isR2Configured) {
  const stripTrailingSlash = (value: string) => value.replace(/\/$/, '')
  const r2Bucket = process.env.R2_BUCKET as string
  const r2Endpoint =
    process.env.R2_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : '')
  const normalizedEndpoint = stripTrailingSlash(r2Endpoint)
  const publicBaseURL = stripTrailingSlash(
    process.env.R2_PUBLIC_BASE_URL || `${normalizedEndpoint}/${r2Bucket}`,
  )

  storagePlugins.push(
    s3Storage({
      bucket: r2Bucket,
      collections: {
        media: {
          prefix: 'audio',
          generateFileURL: ({ filename: generatedFilename, prefix }) => {
            const objectKey = path.posix.join(prefix ?? '', generatedFilename)

            return `${publicBaseURL}/${objectKey}`
          },
        },
      },
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
        },
        endpoint: normalizedEndpoint,
        forcePathStyle: true,
        region: process.env.R2_REGION || 'auto',
      },
    }),
  )
}

const Words: CollectionConfig = {
  slug: 'words',
  admin: {
    useAsTitle: 'word_uyghur',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'word_uyghur',
      type: 'text',
      required: true,
      label: 'Uyghur Word',
      index: true,
    },
    {
      name: 'word_english',
      type: 'text',
      required: true,
      label: 'English Translation',
      index: true,
    },
    {
      name: 'word_turkish',
      type: 'text',
      label: 'Turkish Translation',
      index: true,
    },
    {
      name: 'pronunciation',
      type: 'upload',
      relationTo: 'media',
      label: 'Pronunciation Audio',
      admin: {
        description: 'Upload or select the pronunciation audio stored on R2.',
      },
    },
  ],
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Words, Users, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: storagePlugins,
})
