#!/usr/bin/env powershell
# 🚀 INICIAR MÓDULO DE ESTOQUE - GUIA RÁPIDO (WINDOWS POWERSHELL)

Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   VAREJIX - MÓDULO DE GESTÃO DE ESTOQUE       ║" -ForegroundColor Cyan
Write-Host "║   Status: ✅ PRONTO PARA INICIAR              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 ARQUIVOS IMPLEMENTADOS:" -ForegroundColor Yellow
Write-Host "  ✅ 3 Páginas principais (Movements, Levels, Reports)" -ForegroundColor Green
Write-Host "  ✅ 3 Componentes reutilizáveis (Form, Table, Badge)" -ForegroundColor Green
Write-Host "  ✅ 25+ Endpoints backend" -ForegroundColor Green
Write-Host "  ✅ 6 Relatórios avançados" -ForegroundColor Green
Write-Host "  ✅ Sistema de alertas automáticos" -ForegroundColor Green
Write-Host "  ✅ 4 Documentações completas" -ForegroundColor Green
Write-Host ""

Write-Host "🗂️  ESTRUTURA DE DADOS:" -ForegroundColor Yellow
Write-Host "  • stock_locations    → Depósitos e lojas" -ForegroundColor White
Write-Host "  • stock_movements    → Histórico de movimentações" -ForegroundColor White
Write-Host "  • stock_levels       → Estoque atual por local" -ForegroundColor White
Write-Host "  • stock_batches      → Lotes com validade" -ForegroundColor White
Write-Host "  • stock_alerts       → Alertas automáticos" -ForegroundColor White
Write-Host ""

Write-Host "🎯 COMO INICIAR:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  TERMINAL 1 - Backend Express (porta 3000):" -ForegroundColor Cyan
Write-Host "   npm run mock:express:watch" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  TERMINAL 2 - Frontend Vite (porta 5173):" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  LOGIN:" -ForegroundColor Cyan
Write-Host "   Usuário: admin" -ForegroundColor White
Write-Host "   Senha: password" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣  ACESSAR ESTOQUE:" -ForegroundColor Cyan
Write-Host "   Menu Lateral → Estoque" -ForegroundColor White
Write-Host "   • Movimentações       (/stock/movements)" -ForegroundColor White
Write-Host "   • Níveis de Estoque   (/stock/levels)" -ForegroundColor White
Write-Host "   • Relatórios          (/stock/reports)" -ForegroundColor White
Write-Host ""

Write-Host "📚 DOCUMENTAÇÃO:" -ForegroundColor Yellow
Write-Host "  📖 Guia Completo:    docs/MODULO_ESTOQUE.md" -ForegroundColor White
Write-Host "  ⚡ Quick Reference:  docs/ESTOQUE_GUIA_RAPIDO.md" -ForegroundColor White
Write-Host "  🏗️  Arquitetura:      docs/ESTOQUE_ARQUITETURA.md" -ForegroundColor White
Write-Host "  📖 Casos de Uso:     docs/ESTOQUE_CASOS_USO.md" -ForegroundColor White
Write-Host "  📋 Resumo Final:     ESTOQUE_RESUMO_FINAL.md" -ForegroundColor White
Write-Host ""

Write-Host "✨ FUNCIONALIDADES PRINCIPAIS:" -ForegroundColor Yellow
Write-Host "  📦 Registrar entradas (compra, devolução, ajuste)" -ForegroundColor White
Write-Host "  📤 Registrar saídas (venda, perda, transferência)" -ForegroundColor White
Write-Host "  ⚠️  Alertas automáticos (ruptura, baixo, alto)" -ForegroundColor White
Write-Host "  📊 6 Relatórios com CSV export" -ForegroundColor White
Write-Host "  🔐 CSRF protection em todas operações" -ForegroundColor White
Write-Host "  👤 Autenticação e auditoria completa" -ForegroundColor White
Write-Host ""

Write-Host "🧪 DADOS DE TESTE:" -ForegroundColor Yellow
Write-Host "  • 10 produtos cadastrados" -ForegroundColor White
Write-Host "  • 4 locais de estoque" -ForegroundColor White
Write-Host "  • 5 movimentações de exemplo" -ForegroundColor White
Write-Host "  • 12 níveis com alertas" -ForegroundColor White
Write-Host ""

Write-Host "🎨 RECURSOS VISUAIS:" -ForegroundColor Yellow
Write-Host "  🔴 RUPTURA       (vermelho)" -ForegroundColor Red
Write-Host "  🟠 Estoque Baixo  (laranja)" -ForegroundColor Yellow
Write-Host "  🔵 Estoque Alto   (azul)" -ForegroundColor Blue
Write-Host "  🟢 OK             (verde)" -ForegroundColor Green
Write-Host ""

Write-Host "✅ Tudo pronto! Acesse http://localhost:5173" -ForegroundColor Green
Write-Host ""

# Opcional: Oferecer para iniciar automaticamente
Write-Host "Deseja iniciar o servidor agora? (S/N)" -ForegroundColor Cyan
$response = Read-Host

if ($response -eq 'S' -or $response -eq 's' -or $response -eq 'Y' -or $response -eq 'y') {
    Write-Host "Abrindo terminal para backend..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run mock:express:watch"
    
    Write-Host "Aguardando 3 segundos..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    Write-Host "Abrindo terminal para frontend..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    
    Write-Host "Servidores iniciando em novas janelas..." -ForegroundColor Green
} else {
    Write-Host "Certo! Execute manualmente quando desejar." -ForegroundColor Yellow
}
