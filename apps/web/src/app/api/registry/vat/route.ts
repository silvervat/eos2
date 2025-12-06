/**
 * EU VIES VAT NUMBER VALIDATION API
 * GET /api/registry/vat?country={EE}&number={12345678} - Validate VAT number
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface VATValidationResult {
  valid: boolean
  countryCode: string
  vatNumber: string
  name?: string
  address?: string
  requestDate?: string
}

// GET /api/registry/vat - Validate EU VAT number
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country') || 'EE'
    const number = searchParams.get('number')

    if (!number) {
      return NextResponse.json({ error: 'VAT number is required' }, { status: 400 })
    }

    // Clean the VAT number - remove country prefix if present
    let cleanNumber = number.replace(/\s/g, '').toUpperCase()
    if (cleanNumber.startsWith(country.toUpperCase())) {
      cleanNumber = cleanNumber.substring(2)
    }

    // Use EU VIES REST API (free, no auth required)
    const url = `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${country}/vat/${cleanNumber}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EOS2-ERP/1.0',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      // Try POST method as fallback
      const postUrl = 'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number'
      const postResponse = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'EOS2-ERP/1.0',
        },
        body: JSON.stringify({
          countryCode: country,
          vatNumber: cleanNumber,
        }),
      })

      if (!postResponse.ok) {
        return NextResponse.json(
          { error: 'KMKR numbri kontroll ebaõnnestus', valid: false },
          { status: 502 }
        )
      }

      const postData = await postResponse.json()
      return NextResponse.json({
        valid: postData.valid || false,
        countryCode: postData.countryCode || country,
        vatNumber: postData.vatNumber || cleanNumber,
        name: postData.name || null,
        address: postData.address || null,
        requestDate: postData.requestDate || new Date().toISOString(),
      } as VATValidationResult)
    }

    const data = await response.json()

    return NextResponse.json({
      valid: data.isValid || data.valid || false,
      countryCode: data.countryCode || country,
      vatNumber: data.vatNumber || cleanNumber,
      name: data.name || null,
      address: data.address || null,
      requestDate: data.requestDate || new Date().toISOString(),
    } as VATValidationResult)
  } catch (error) {
    console.error('Error in VAT validation:', error)
    return NextResponse.json({ error: 'Internal Server Error', valid: false }, { status: 500 })
  }
}
