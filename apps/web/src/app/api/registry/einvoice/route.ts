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
    const name = searchParams.get('name')

    if (!code && !name) {
      return NextResponse.json(
        { error: 'Either code or name parameter is required' },
        { status: 400 }
      )
    }

    // Build URL for Estonian Business Registry E-Invoice API
    let url: string
    if (code) {
      url = `https://ariregxmlv6.rik.ee/einvoice?reg_code=${encodeURIComponent(code)}&format=json`
    } else {
      url = `https://ariregxmlv6.rik.ee/einvoice?companyName=${encodeURIComponent(name!)}&format=json`
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EOS2-ERP/1.0',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      console.error('E-Invoice API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'E-arve registri päring ebaõnnestus' },
        { status: 502 }
      )
    }

    const data = await response.json()

    // Transform response
    // The API returns company e-invoice info
    // Typical fields: reg_code, name, einvoice_operators (array of operators)
    const result: EInvoiceResult = {
      registryCode: data.reg_code || code || '',
      name: data.name || name || '',
      eInvoiceCapable: !!(data.einvoice_operators && data.einvoice_operators.length > 0),
      operators: Array.isArray(data.einvoice_operators)
        ? data.einvoice_operators.map((op: Record<string, unknown>) => ({
            name: op.operator_name || op.name || '',
            channel: op.channel || op.type || '',
            address: op.address || op.einvoice_address || undefined,
          }))
        : [],
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in e-invoice check:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
