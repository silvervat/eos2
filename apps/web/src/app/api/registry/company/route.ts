/**
 * ESTONIAN BUSINESS REGISTRY COMPANY DETAILS API
 * GET /api/registry/company?code={reg_code} - Get detailed company information
 *
 * Fetches extended company data from Estonian Business Registry (Äriregister)
 * including VAT number, address, contacts, and status.
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface CompanyDetails {
  registryCode: string
  name: string
  status: string
  statusText?: string
  vatNumber?: string
  legalAddress?: string
  postalAddress?: string
  email?: string
  phone?: string
  website?: string
  legalForm?: string
  registeredAt?: string
  capital?: string
  mainActivity?: string
  mainActivityCode?: string
  url?: string
}

// GET /api/registry/company - Get detailed company information
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

    // Clean the registry code
    const cleanCode = code.replace(/\D/g, '')
    if (cleanCode.length < 8) {
      return NextResponse.json(
        { error: 'Invalid registry code format' },
        { status: 400 }
      )
    }

    // Try multiple API endpoints to get company data
    const debugInfo: Record<string, unknown> = {}

    // 1. Try the company detail API
    const detailUrl = `https://ariregister.rik.ee/est/api/company/${cleanCode}`
    console.log('Fetching company details from:', detailUrl)

    const response = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'EOS2-ERP/1.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (debug) {
      debugInfo.detailApiStatus = response.status
      debugInfo.detailApiStatusText = response.statusText
    }

    if (!response.ok) {
      console.error('Company API error:', response.status, response.statusText)

      // Try alternative approach - get basic info from search
      const searchUrl = `https://ariregister.rik.ee/est/api/autocomplete?q=${cleanCode}`
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'EOS2-ERP/1.0',
          'Accept': 'application/json',
        },
      })

      if (debug) {
        debugInfo.searchApiStatus = searchResponse.status
      }

      // Also try VAT check from VIES
      let vatNumber: string | undefined
      try {
        vatNumber = await checkVatNumber(cleanCode)
        if (debug) {
          debugInfo.vatCheckResult = vatNumber || 'not found'
        }
      } catch (e) {
        if (debug) {
          debugInfo.vatCheckError = String(e)
        }
      }

      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        if (debug) {
          debugInfo.searchData = searchData
        }
        if (Array.isArray(searchData) && searchData.length > 0) {
          const company = searchData.find((c: Record<string, unknown>) =>
            String(c.registry_code || c.reg_code) === cleanCode
          )
          if (company) {
            const result = {
              registryCode: cleanCode,
              name: company.name || '',
              status: 'active',
              vatNumber: vatNumber,
              url: `https://ariregister.rik.ee/est/company/${cleanCode}`,
              ...(debug ? { _debug: debugInfo } : {}),
            }
            return NextResponse.json(result)
          }
        }
      }

      // If search by code failed, we still have basic info - return what we have
      // This is better than returning 404 when we know the code exists
      if (vatNumber) {
        return NextResponse.json({
          registryCode: cleanCode,
          name: '',
          status: 'unknown',
          vatNumber: vatNumber,
          url: `https://ariregister.rik.ee/est/company/${cleanCode}`,
          ...(debug ? { _debug: debugInfo } : {}),
        })
      }

      return NextResponse.json(
        { error: 'Ettevõtet ei leitud', ...(debug ? { _debug: debugInfo } : {}) },
        { status: 404 }
      )
    }

    const data = await response.json()
    console.log('Company API response:', JSON.stringify(data).slice(0, 2000))

    // Parse the response - structure may vary
    // Debug: log all available keys
    const availableKeys = Object.keys(data)
    console.log('Available keys in response:', availableKeys)

    const result: CompanyDetails = {
      registryCode: cleanCode,
      name: extractField(data, ['nimi', 'name', 'arinimi', 'business_name']) || '',
      status: extractField(data, ['staatus', 'status', 'state']) || 'active',
      statusText: extractField(data, ['staatus_tekst', 'status_text', 'state_text']),
      vatNumber: extractVatNumber(data),
      legalAddress: extractField(data, ['aadress', 'address', 'asukoht', 'legal_address', 'asukoha_aadress']),
      postalAddress: extractField(data, ['postiaadress', 'postal_address', 'posti_aadress']),
      email: extractField(data, ['email', 'e_post', 'epost', 'e-post', 'contact_email']),
      phone: extractField(data, ['telefon', 'phone', 'tel', 'contact_phone']),
      website: extractField(data, ['veebileht', 'website', 'web', 'koduleht', 'www']),
      legalForm: extractField(data, ['oigusvorm', 'legal_form', 'ettevotte_liik']),
      registeredAt: extractField(data, ['registreerimise_kp', 'registered_at', 'registered_date', 'asutamise_kp']),
      capital: extractCapital(data),
      mainActivity: extractField(data, ['pohitegevusala', 'main_activity', 'tegevusala', 'emtak_tekst']),
      mainActivityCode: extractField(data, ['emtak', 'emtak_kood', 'activity_code']),
      url: `https://ariregister.rik.ee/est/company/${cleanCode}`,
    }

    // Include raw data keys for debugging (only in development)
    console.log('Parsed result:', JSON.stringify(result))

    // Also try to get VAT number from EMTA if not found in main data
    if (!result.vatNumber) {
      const vatNumber = await checkVatNumber(cleanCode)
      if (vatNumber) {
        result.vatNumber = vatNumber
      }
      if (debug) {
        debugInfo.vatCheckResult = vatNumber || 'not found'
      }
    }

    if (debug) {
      debugInfo.rawDataKeys = Object.keys(data)
      debugInfo.rawData = data
    }

    return NextResponse.json({
      ...result,
      ...(debug ? { _debug: debugInfo } : {}),
    })
  } catch (error) {
    console.error('Error in company lookup:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Helper to extract field from various possible keys
function extractField(data: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    // Check direct property
    if (data[key] && typeof data[key] === 'string') {
      return data[key] as string
    }
    // Check nested in common structures
    const nested = data.data || data.company || data.ettevote || data.result
    if (nested && typeof nested === 'object' && (nested as Record<string, unknown>)[key]) {
      const val = (nested as Record<string, unknown>)[key]
      if (typeof val === 'string') return val
    }
  }
  return undefined
}

// Extract VAT number from various possible structures
function extractVatNumber(data: Record<string, unknown>): string | undefined {
  const keys = ['kmkr', 'kmkr_nr', 'vat_number', 'vat', 'kaibemaksukohustuslase_nr', 'vat_id']
  const vatNumber = extractField(data, keys)
  if (vatNumber) return vatNumber

  // Check if there's a VAT section
  const vatSection = data.kmkr || data.vat || data.kaibemaks
  if (vatSection && typeof vatSection === 'object') {
    const vatObj = vatSection as Record<string, unknown>
    return vatObj.number as string || vatObj.nr as string || vatObj.kmkr_nr as string
  }

  return undefined
}

// Extract capital amount
function extractCapital(data: Record<string, unknown>): string | undefined {
  const keys = ['kapital', 'capital', 'osakapital', 'share_capital', 'aktsiakapital']
  const capital = extractField(data, keys)
  if (capital) return capital

  // Check nested
  const capitalSection = data.kapital || data.capital
  if (capitalSection && typeof capitalSection === 'object') {
    const capObj = capitalSection as Record<string, unknown>
    const amount = capObj.summa || capObj.amount || capObj.value
    if (amount) {
      return `${amount} €`
    }
  }

  return undefined
}

// Check VAT number registration with Estonian Tax Board
async function checkVatNumber(registryCode: string): Promise<string | undefined> {
  try {
    // Estonian VAT numbers are typically EE + 9 digits
    // The registry code can sometimes be derived to VAT number
    // First, try to check if the company is VAT registered via VIES

    // Estonian companies' VAT numbers often follow pattern EE + registry_code
    // But this is not always the case, so we should verify
    const possibleVat = `EE${registryCode}`

    const viesUrl = `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/EE/vat/${registryCode}`
    const response = await fetch(viesUrl, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.isValid) {
        return `EE${data.vatNumber || registryCode}`
      }
    }
  } catch (error) {
    console.log('VAT check failed:', error)
  }
  return undefined
}
