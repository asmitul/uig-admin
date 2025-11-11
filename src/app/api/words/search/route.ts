import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 20
const SEARCHABLE_FIELDS = ['word_uyghur', 'word_english', 'word_turkish'] as const
const MAX_QUERY_LENGTH = 64

type SearchableField = (typeof SEARCHABLE_FIELDS)[number]

const BASE_SELECT: Record<SearchableField, true> = {
  word_uyghur: true,
  word_english: true,
  word_turkish: true,
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const buildPrefixRegex = (rawQuery: string) => `^${escapeRegex(rawQuery)}`

const buildWhereClause = (rawQuery: string) => {
  if (!rawQuery) {
    return undefined
  }

  const prefix = buildPrefixRegex(rawQuery)

  return {
    or: SEARCHABLE_FIELDS.map((field) => ({
      [field]: {
        like: prefix,
      },
    })),
  }
}

const coercePositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  const normalized = Math.floor(parsed)

  return normalized > 0 ? normalized : fallback
}

const buildErrorResponse = (message: string) =>
  NextResponse.json(
    { error: message },
    {
      status: 400,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )

export const GET = async (request: Request) => {
  const url = new URL(request.url)
  const rawQuery = (url.searchParams.get('q') || '').trim().slice(0, MAX_QUERY_LENGTH)
  const page = coercePositiveInt(url.searchParams.get('page'), 1)
  const limit = coercePositiveInt(url.searchParams.get('limit'), DEFAULT_LIMIT)

  if (limit > MAX_LIMIT) {
    return buildErrorResponse(`limit must be <= ${MAX_LIMIT}`)
  }

  const payload = await getPayload({
    config: configPromise,
  })

  try {
    const results = await payload.find({
      collection: 'words',
      page,
      limit,
      depth: 0,
      sort: 'word_uyghur',
      where: buildWhereClause(rawQuery),
      select: {
        id: true,
        ...BASE_SELECT,
        pronunciation: true,
      },
    })

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to fetch words' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  }
}
