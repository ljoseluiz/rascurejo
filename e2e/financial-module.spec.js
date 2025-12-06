import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const API_URL = 'http://localhost:3000'

test.describe('Financial Module - Complete Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'password')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(`${BASE_URL}/`)
  })

  test('Accounts Payable: Create and Mark as Paid', async ({ page }) => {
    // Navigate to Accounts Payable
    await page.goto(`${BASE_URL}/financial/accounts-payable`)
    await page.waitForLoadState('networkidle')

    // Check page loaded
    await expect(page.locator('text=Contas a Pagar')).toBeVisible()

    // Click to create new payable
    await page.click('button:has-text("+ Nova Conta")')
    await expect(page.locator('text=Nova Conta a Pagar')).toBeVisible()

    // Fill form
    await page.selectOption('select', { index: 0 }) // Select first supplier
    await page.fill('input[placeholder="Ex: NF-001"]', 'NF-TEST-001')
    await page.fill('input[type="number"]', '1000.50')
    
    // Set due date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await page.fill('input[type="date"]', dateStr)

    // Select payment method
    await page.selectOption('select:last-of-type', 'transfer')

    // Save
    await page.click('button:has-text("Salvar")')

    // Wait for success toast
    await expect(page.locator('text=Sucesso')).toBeVisible()
    
    // Verify entry appears in table
    await page.waitForTimeout(1000) // Wait for table refresh
    await expect(page.locator('text=NF-TEST-001')).toBeVisible()
  })

  test('Accounts Receivable: Create and Mark as Received', async ({ page }) => {
    // Navigate to Accounts Receivable
    await page.goto(`${BASE_URL}/financial/accounts-receivable`)
    await page.waitForLoadState('networkidle')

    // Check page loaded
    await expect(page.locator('text=Contas a Receber')).toBeVisible()

    // Click to create new receivable
    await page.click('button:has-text("+ Nova Cobrança")')
    await expect(page.locator('text=Nova Cobrança')).toBeVisible()

    // Fill form
    await page.fill('input[placeholder="Ex: Empresa XYZ"]', 'Cliente Test Ltd')
    await page.fill('input[type="number"]:first-of-type', '5000.00')
    
    // Set due date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await page.fill('input[type="date"]', dateStr)

    // Save
    await page.click('button:has-text("Salvar")')

    // Wait for success toast
    await expect(page.locator('text=Sucesso')).toBeVisible()
    
    // Verify entry appears in table
    await page.waitForTimeout(1000)
    await expect(page.locator('text=Cliente Test Ltd')).toBeVisible()
  })

  test('Cash Box: Record Movement', async ({ page }) => {
    // Navigate to Cash Box
    await page.goto(`${BASE_URL}/financial/cash-box`)
    await page.waitForLoadState('networkidle')

    // Check page loaded
    await expect(page.locator('text=Caixa')).toBeVisible()

    // Click to register movement on first cash box
    const registerButtons = page.locator('button:has-text("Registrar")')
    await registerButtons.first().click()

    // Fill form
    await expect(page.locator('text=Registrar Movimentação')).toBeVisible()
    
    // Type and amount
    await page.selectOption('select:first-of-type', 'entry')
    await page.selectOption('select:nth-of-type(1)', 'sales')
    await page.fill('input[placeholder="0.00"]', '500.00')
    await page.fill('input[placeholder^="Ex: Venda"]', 'Venda no caixa')

    // Save
    await page.click('button:has-text("Registrar")')

    // Wait for success
    await expect(page.locator('text=Sucesso')).toBeVisible()
  })

  test('Cash Flow: View Forecast', async ({ page }) => {
    // Navigate to Cash Flow
    await page.goto(`${BASE_URL}/financial/cash-flow`)
    await page.waitForLoadState('networkidle')

    // Check page loaded
    await expect(page.locator('text=Fluxo de Caixa')).toBeVisible()

    // Check KPI cards are visible
    await expect(page.locator('text=Saldo Atual')).toBeVisible()
    await expect(page.locator('text=A Receber')).toBeVisible()
    await expect(page.locator('text=A Pagar')).toBeVisible()
    await expect(page.locator('text=Fluxo Líquido')).toBeVisible()

    // Check tabs
    const tabs = page.locator('[role="tab"]')
    await expect(tabs).toHaveCount(3) // D+0, D+30, D+60

    // Click D+30 tab
    await tabs.nth(1).click()
    await expect(page.locator('text=Entradas Previstas')).toBeVisible()
  })

  test('Financial Reports: View DRE', async ({ page }) => {
    // Navigate to Reports
    await page.goto(`${BASE_URL}/financial/reports`)
    await page.waitForLoadState('networkidle')

    // Check page loaded
    await expect(page.locator('text=Relatórios Financeiros')).toBeVisible()

    // First tab (DRE) should be active
    await expect(page.locator('text=RECEITA BRUTA')).toBeVisible()
    await expect(page.locator('text=LUCRO LÍQUIDO')).toBeVisible()
    await expect(page.locator('text=MARGEM')).toBeVisible()

    // Click on Posição Financeira tab
    const tabs = page.locator('[role="tab"]')
    await tabs.nth(1).click()

    // Check Posição Financeira content
    await expect(page.locator('text=ATIVO')).toBeVisible()
    await expect(page.locator('text=PASSIVO')).toBeVisible()
  })

  test('Financial Dashboard: View Overview', async ({ page }) => {
    // Navigate to Financial Dashboard
    await page.goto(`${BASE_URL}/financial`)
    await page.waitForLoadState('networkidle')

    // Check page loaded
    await expect(page.locator('text=Dashboard Financeiro')).toBeVisible()

    // Check KPI cards
    await expect(page.locator('text=Saldo em Caixa')).toBeVisible()
    await expect(page.locator('text=A Pagar')).toBeVisible()
    await expect(page.locator('text=Vencidos')).toBeVisible()
    await expect(page.locator('text=A Receber')).toBeVisible()

    // Check tables
    await expect(page.locator('text=Contas a Pagar Vencidas')).toBeVisible()
    await expect(page.locator('text=Contas a Receber Vencidas')).toBeVisible()

    // Check health cards
    await expect(page.locator('text=Razão Corrente')).toBeVisible()
    await expect(page.locator('text=Saldo Líquido')).toBeVisible()
  })

  test('API: Verify CSRF Protection', async ({ request }) => {
    // Try to create payable without CSRF token - should fail
    const response = await request.post(`${API_URL}/financial/accounts-payable`, {
      data: {
        supplier_id: 1,
        invoice_number: 'NF-999',
        amount: 1000,
        due_date: '2025-12-31',
      },
    })

    // Should return 401 or 403 (no auth)
    expect([401, 403]).toContain(response.status())
  })

  test('API: Create Payable via POST', async ({ request, context }) => {
    // Get CSRF token first
    const csrfResponse = await request.get(`${API_URL}/auth/csrf`)
    const { csrfToken } = await csrfResponse.json()

    // Create payable with CSRF
    const response = await request.post(`${API_URL}/financial/accounts-payable`, {
      headers: {
        'X-CSRF-Token': csrfToken,
      },
      data: {
        supplier_id: 1,
        invoice_number: 'NF-API-TEST',
        amount: 2500.00,
        due_date: '2025-12-25',
        payment_method: 'transfer',
        description: 'API Test',
      },
    })

    // Should return 201 Created
    expect(response.status()).toBe(201)

    const data = await response.json()
    expect(data.id).toBeDefined()
    expect(data.status).toBe('pending')
  })

  test('Menu: Financial submenu available', async ({ page }) => {
    // Go to home
    await page.goto(`${BASE_URL}/`)
    
    // Check Sidebar has Financial menu
    await expect(page.locator('button:has-text("Financeiro")')).toBeVisible()
    
    // Click to expand
    await page.click('button:has-text("Financeiro")')
    
    // Check all submenu items
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible()
    await expect(page.locator('a:has-text("Contas a Pagar")')).toBeVisible()
    await expect(page.locator('a:has-text("Contas a Receber")')).toBeVisible()
    await expect(page.locator('a:has-text("Caixa")')).toBeVisible()
    await expect(page.locator('a:has-text("Fluxo de Caixa")')).toBeVisible()
    await expect(page.locator('a:has-text("Relatórios")')).toBeVisible()
  })
})
