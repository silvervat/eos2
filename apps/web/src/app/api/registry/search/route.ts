/**
 * ESTONIAN BUSINESS REGISTRY SEARCH API
 * GET /api/registry/search?q={query} - Search companies by name using ariregister.rik.ee autocomplete
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface AutocompleteResult {
  companyId?: number
  name: string
  registryCode: string
  historicalNames?: string[]
  status?: string
  legalAddress?: string
  zipCode?: string
  url?: string
}

// GET /api/registry/search - Search Estonian business registry
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query too short (min 2 characters)' }, { status: 400 })
    }

    // Use Estonian Business Registry Autocomplete API (free, no auth required)
    // Fields returned: company_id, reg_code, name, historical_names, status, legal_address, zip_code, url
    const url = `https://ariregxmlv6.rik.ee/autocomplete?query=${encodeURIComponent(query)}&format=json`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EOS2-ERP/1.0',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Registry API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Äriregistri päring ebaõnnestus' },
        { status: 502 }
      )
    }

    const data = await response.json()

    // Transform response - the autocomplete API returns max 10 results
    // Actual field names: company_id, reg_code, name, historical_names, status, legal_address, zip_code, url
    const results: AutocompleteResult[] = Array.isArray(data)
      ? data.map((item: Record<string, unknown>) => ({
          companyId: item.company_id as number | undefined,
          name: (item.name as string) || '',
          registryCode: String(item.reg_code || ''),
          historicalNames: item.historical_names as string[] | undefined,
          status: (item.status as string) || 'R', // R = registered
          legalAddress: (item.legal_address as string) || undefined,
          zipCode: (item.zip_code as string) || undefined,
          url: (item.url as string) || undefined,
        }))
      : []

    return NextResponse.json({
      results,
      total: results.length,
    })
  } catch (error) {
    console.error('Error in registry search:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
