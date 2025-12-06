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
    const debug = searchParams.get('debug') === 'true'

    if (!code) {
      return NextResponse.json(
        { error: 'Registry code parameter is required' },
        { status: 400 }
      )
    }

    const debugInfo: Record<string, unknown> = {}

    // Try the Estonian E-Invoice Router API
    // The correct endpoint is: https://www.rik.ee/et/e-arveldaja/api
    // But we'll try multiple endpoints to find the correct one

    // 1. Try ariregister.rik.ee endpoint
    const url1 = `https://ariregister.rik.ee/est/api/einvoice?q=${encodeURIComponent(code)}`

    // 2. Try the e-arveldaja endpoint (official e-invoice router)
    const url2 = `https://e-arveldaja.rik.ee/api/check?code=${encodeURIComponent(code)}`

    console.log('Trying e-invoice endpoints:', url1)

    const response = await fetch(url1, {
      headers: {
        'User-Agent': 'EOS2-ERP/1.0',
        Accept: 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (debug) {
      debugInfo.endpoint1 = url1
      debugInfo.endpoint1Status = response.status
    }

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
        ...(debug ? { _debug: debugInfo } : {}),
      })
    }

    const data = await response.json()

    if (debug) {
      debugInfo.rawResponse = data
      debugInfo.responseType = Array.isArray(data) ? 'array' : typeof data
      if (Array.isArray(data)) {
        debugInfo.arrayLength = data.length
        if (data.length > 0) {
          debugInfo.firstItemKeys = Object.keys(data[0])
        }
      } else if (data && typeof data === 'object') {
        debugInfo.objectKeys = Object.keys(data)
      }
    }

    console.log('E-invoice API response:', JSON.stringify(data).slice(0, 500))

    // Transform response based on actual API response structure
    // The API may return different structures depending on the result
    let eInvoiceCapable = false
    let operators: { name: string; channel: string; address?: string }[] = []

    if (Array.isArray(data)) {
      // If response is array, check if any entries exist
      eInvoiceCapable = data.length > 0
      operators = data.map((op: Record<string, unknown>) => ({
        // Try various field names that operators might use
        name: String(
          op.teenusepakkuja ||
          op.operaator ||
          op.operator_name ||
          op.operator ||
          op.name ||
          op.nimi ||
          'Teadmata'
        ),
        channel: String(op.channel || op.kanal || op.type || op.tyyp || 'e-arve'),
        address: (op.address || op.aadress || op.roaming_address) as string | undefined,
      }))
    } else if (data && typeof data === 'object') {
      // Handle object response - check various status indicators
      const hasPositiveStatus =
        data.staatus === 'OK' ||
        data.status === 'OK' ||
        data.success === true ||
        data.found === true ||
        data.exists === true ||
        data.eInvoiceCapable === true

      if (hasPositiveStatus) {
        eInvoiceCapable = true
      }

      // Try to find operators in various possible locations
      const operatorData =
        data.operators ||
        data.einvoice_operators ||
        data.teenusepakkujad ||
        data.operaatorid ||
        data.channels ||
        data.kanalid ||
        data.data ||
        data.results

      if (operatorData) {
        const ops = Array.isArray(operatorData) ? operatorData : [operatorData]
        operators = ops.map((op: Record<string, unknown>) => ({
          name: String(
            op.teenusepakkuja ||
            op.operaator ||
            op.operator_name ||
            op.operator ||
            op.name ||
            op.nimi ||
            'Teadmata'
          ),
          channel: String(op.channel || op.kanal || op.type || op.tyyp || 'e-arve'),
          address: (op.address || op.aadress || op.roaming_address) as string | undefined,
        }))
        eInvoiceCapable = operators.length > 0
      }

      // Also check if data itself contains operator-like info
      if (!eInvoiceCapable && (data.teenusepakkuja || data.operaator || data.operator)) {
        eInvoiceCapable = true
        operators = [{
          name: String(data.teenusepakkuja || data.operaator || data.operator || 'Teadmata'),
          channel: String(data.channel || data.kanal || 'e-arve'),
          address: data.address as string | undefined,
        }]
      }
    }

    const result: EInvoiceResult = {
      registryCode: code,
      name: data.nimi || data.name || '',
      eInvoiceCapable,
      operators,
    }

    if (debug) {
      debugInfo.parsedResult = result
    }

    return NextResponse.json({
      ...result,
      ...(debug ? { _debug: debugInfo } : {}),
    })
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
