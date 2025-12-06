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
    // Correct endpoint: https://ariregister.rik.ee/est/api/autocomplete?q=...
    // Returns max 10 results with: registry_code, name
    const url = `https://ariregister.rik.ee/est/api/autocomplete?q=${encodeURIComponent(query)}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EOS2-ERP/1.0',
        Accept: 'application/json',
      },
      // Add cache control for better performance
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      console.error('Registry API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Äriregistri päring ebaõnnestus' },
        { status: 502 }
      )
    }

    const data = await response.json()

    // Debug: log what we received from the API
    console.log('Registry API response:', JSON.stringify(data).slice(0, 500))

    // The autocomplete API returns array of objects with: registry_code, name
    // Build URL to company page in e-Äriregister
    let results: AutocompleteResult[] = []

    if (Array.isArray(data)) {
      results = data.map((item: Record<string, unknown>) => ({
        name: (item.name as string) || '',
        registryCode: String(item.registry_code || item.reg_code || ''),
        // Build URL to company page in e-Äriregister
        url: item.registry_code || item.reg_code
          ? `https://ariregister.rik.ee/est/company/${item.registry_code || item.reg_code}`
          : undefined,
      }))
    } else if (data && typeof data === 'object') {
      // Handle if response is an object with results array
      const items = data.results || data.data || data.companies || []
      if (Array.isArray(items)) {
        results = items.map((item: Record<string, unknown>) => ({
          name: (item.name as string) || (item.nimi as string) || '',
          registryCode: String(item.registry_code || item.reg_code || item.registrikood || ''),
          url: (item.registry_code || item.reg_code)
            ? `https://ariregister.rik.ee/est/company/${item.registry_code || item.reg_code}`
            : undefined,
        }))
      }
    }

    console.log('Parsed results count:', results.length)

    return NextResponse.json({
      results,
      total: results.length,
    })
  } catch (error) {
    console.error('Error in registry search:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
