import { cloudStorage } from '@payloadcms/plugin-cloud-storage'
import { s3Adapter } from '@payloadcms/plugin-cloud-storage/s3'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig, type CollectionConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { getMissingR2Env } from './util/r2'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
    },
    {
      name: 'word_english',
      type: 'text',
      required: true,
      label: 'English Translation',
    },
    {
      name: 'word_turkish',
      type: 'text',
      label: 'Turkish Translation',
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
  plugins: (() => {
    const plugins = []
    const missingEnv = getMissingR2Env()

    if (missingEnv.length > 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Skipping Cloudflare R2 storage adapter configuration because the following environment variables are missing: ${missingEnv.join(', ')}`,
        )
      }

      return plugins
    }

    const adapter = s3Adapter({
      bucket: process.env.R2_BUCKET as string,
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
        },
        endpoint: process.env.R2_ENDPOINT as string,
        forcePathStyle: true,
        region: 'auto',
      },
    })

    plugins.push(
      cloudStorage({
        collections: {
          [Media.slug]: {
            adapter,
          },
        },
      }),
    )

    return plugins
  })(),
})
