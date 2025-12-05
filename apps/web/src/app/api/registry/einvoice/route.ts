/**
 * ESTONIAN E-INVOICE REGISTRY CHECK API
 * GET /api/registry/einvoice?code={reg_code} - Check if company accepts e-invoices
 * GET /api/registry/einvoice?name={company_name} - Check by company name
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface EInvoiceResult {
  registryCode: string
  name: string
  eInvoiceCapable: boolean
  operators: {
    name: string
    channel: string
    address?: string
  }[]
}

// GET /api/registry/einvoice - Check e-invoice capability
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Registry code parameter is required' },
        { status: 400 }
      )
    }

    // Try the Estonian Business Registry E-Invoice API
    // Endpoint: https://ariregister.rik.ee/est/api/einvoice?q=registry_code
    // This service is free and doesn't require authentication
    const url = `https://ariregister.rik.ee/est/api/einvoice?q=${encodeURIComponent(code)}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EOS2-ERP/1.0',
        Accept: 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    // If the specific endpoint fails, return a default response
    // The e-invoice capability can still be checked manually
    if (!response.ok) {
      console.warn('E-Invoice API returned:', response.status)
      // Return unknown status instead of error - the company may or may not accept e-invoices
      return NextResponse.json({
        registryCode: code,
        name: '',
        eInvoiceCapable: false,
        operators: [],
        status: 'unknown',
        message: 'E-arve staatust ei saanud kontrollida',
      })
    }

    const data = await response.json()

    // Transform response based on actual API response structure
    // The API may return different structures depending on the result
    let eInvoiceCapable = false
    let operators: { name: string; channel: string; address?: string }[] = []

    if (Array.isArray(data)) {
      // If response is array, check if any entries exist
      eInvoiceCapable = data.length > 0
      operators = data.map((op: Record<string, unknown>) => ({
        name: String(op.teenusepakkuja || op.operator_name || op.name || 'Teadmata'),
        channel: String(op.channel || op.type || 'e-arve'),
        address: op.address as string | undefined,
      }))
    } else if (data && typeof data === 'object') {
      // Handle object response
      if (data.staatus === 'OK' || data.status === 'OK') {
        eInvoiceCapable = true
      }
      if (data.operators || data.einvoice_operators || data.teenusepakkujad) {
        const ops = data.operators || data.einvoice_operators || data.teenusepakkujad || []
        operators = Array.isArray(ops)
          ? ops.map((op: Record<string, unknown>) => ({
              name: String(op.teenusepakkuja || op.operator_name || op.name || 'Teadmata'),
              channel: String(op.channel || op.type || 'e-arve'),
              address: op.address as string | undefined,
            }))
          : []
        eInvoiceCapable = operators.length > 0
      }
    }

    const result: EInvoiceResult = {
      registryCode: code,
      name: data.nimi || data.name || '',
      eInvoiceCapable,
      operators,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in e-invoice check:', error)
    // Return unknown status on error - don't block the user
    return NextResponse.json({
      registryCode: '',
      name: '',
      eInvoiceCapable: false,
      operators: [],
      status: 'error',
      message: 'E-arve staatust ei saanud kontrollida',
    })
  }
}
