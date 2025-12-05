/**
 * ESTONIAN ADDRESS AUTOCOMPLETE API
 * GET /api/registry/address?q={query} - Search Estonian addresses using Maa-amet API
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface AddressResult {
  address: string
  apartment?: string
  taisaadress?: string // Full address
  ads_oid?: string
}

// GET /api/registry/address - Search Estonian addresses
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query too short (min 2 characters)' }, { status: 400 })
    }

    // Use Estonian Land Board (Maa-amet) Address API
    // Documentation: https://inaadress.maaamet.ee/inaadress/
    const url = `https://inaadress.maaamet.ee/inaadress/gazetteer?address=${encodeURIComponent(query)}&results=10&features=KATASTRIYKSUS,EHITISHOONE,TANAV`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EOS2-ERP/1.0',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Address API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Aadressi päring ebaõnnestus' },
        { status: 502 }
      )
    }

    const data = await response.json()

    // Transform response
    // The Maa-amet API returns addresses in 'addresses' array
    const results: AddressResult[] = []

    if (data.addresses && Array.isArray(data.addresses)) {
      for (const addr of data.addresses) {
        // Extract full address string
        const fullAddress = addr.taisaadress || addr.pikkaadress || addr.aadresstekst || ''
        if (fullAddress) {
          results.push({
            address: fullAddress,
            apartment: addr.kort_nr || undefined,
            taisaadress: addr.taisaadress,
            ads_oid: addr.ads_oid,
          })
        }
      }
    }

    return NextResponse.json({
      results,
      total: results.length,
    })
  } catch (error) {
    console.error('Error in address search:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
