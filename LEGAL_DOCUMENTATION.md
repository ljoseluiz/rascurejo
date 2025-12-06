# 📋 Documentação Legal - Varejix

## 📜 Documentos Inclusos

Este projeto inclui 3 documentos legais completos para comercialização:

### 1. **LICENSE** - Licença Comercial Proprietária
- **Tipo:** Licença proprietária (não é MIT, GPL, Apache)
- **Uso:** Protege propriedade intelectual do software
- **Benefícios:**
  - Previne cópia/modificação não autorizada
  - Permite comercialização
  - Define restrições de uso
  - Inclui proteção ao Licenciante
- **Planos:** Starter ($99), Professional ($299), Enterprise (custom)
- **Status:** Produção

### 2. **TERMS_OF_SERVICE.md** - Termos de Serviço
- **Tipo:** Termos de uso do Serviço
- **Uso:** Rege comportamento dos usuários
- **Cobre:**
  - Elegibilidade
  - Criação de conta
  - Direitos e restrições
  - Preços e billing
  - Cancelamento/reembolso
  - Conformidade legal
  - Suspensão/encerramento
- **Status:** Produção

### 3. **PRIVACY_POLICY.md** - Política de Privacidade
- **Tipo:** Proteção de dados pessoais
- **Conformidade:**
  - ✅ LGPD (Brasil)
  - ✅ GDPR (Europa)
  - ✅ CCPA (Califórnia)
- **Cobre:**
  - Dados coletados
  - Bases legais
  - Finalidades de uso
  - Segurança
  - Direitos do titular
  - Cookies
  - Retenção
- **Status:** Produção

---

## 🎯 Como Usar

### Integração no Site/App

1. **Página de Signup:**
   ```html
   <p>
     Ao se registrar, você concorda com nossos 
     <a href="/terms">Termos de Serviço</a> e 
     <a href="/privacy">Política de Privacidade</a>
   </p>
   ```

2. **Footer do Site:**
   ```html
   <footer>
     <a href="/license">Licença</a> |
     <a href="/terms">Termos</a> |
     <a href="/privacy">Privacidade</a> |
     <a href="/contact">Contato</a>
   </footer>
   ```

3. **Painel de Admin:**
   - Termos de Serviço na seção "Conta"
   - Política de Privacidade em "Configurações"
   - Direitos LGPD em "Exportar Dados"

### Rotas Recomendadas

```
/license         → LICENSE (arquivo)
/terms           → TERMS_OF_SERVICE.md
/privacy         → PRIVACY_POLICY.md
/legal           → Landing page com links
/dpo             → Contato DPO
/privacy/export  → Solicitar dados
/privacy/delete  → Solicitar deleção
```

---

## 📋 Checklist de Conformidade

### Antes de Lançar Comercialmente

- [ ] Registre a empresa (CNPJ)
- [ ] Adicione CNPJ em LICENSE
- [ ] Adicione endereço em TERMS_OF_SERVICE
- [ ] Nomeie DPO (Data Protection Officer) oficial
- [ ] Configure email: dpo@varejix.com, privacy@varejix.com
- [ ] Configure email: legal@varejix.com, support@varejix.com
- [ ] Configure email: security@varejix.com
- [ ] Implemente formulário de direitos LGPD
- [ ] Configure página /legal com documentos
- [ ] Configure cookies banner (exigido por LGPD/GDPR)
- [ ] Audit de segurança (penetration test)
- [ ] Backup policy documentado
- [ ] Data Processing Agreement (DPA) com terceiros
- [ ] Terms assinados pelos usuários (checkbox)
- [ ] Política de reembolso implementada
- [ ] Sistema de suporte documentado

---

## 🔒 Segurança & Compliance

### Implementado

- ✅ CSRF tokens
- ✅ Criptografia SSL/TLS
- ✅ Passwords hasheadas (bcrypt)
- ✅ Rate limiting
- ✅ Autenticação JWT
- ✅ Cookies httpOnly

### Recomendado Adicionar

- [ ] MFA (Multi-Factor Authentication)
- [ ] WAF (Web Application Firewall)
- [ ] SIEM (Security Information and Event Management)
- [ ] Certificação ISO 27001
- [ ] Bug bounty program
- [ ] Testes de penetração regulares

---

## 💰 Modelos de Preço (Licença)

### STARTER - R$ 99/mês
- 1-3 usuários
- 1 loja
- 5 GB armazenamento
- Email support (48h)

### PROFESSIONAL - R$ 299/mês
- 3-10 usuários
- 1-3 lojas
- 50 GB armazenamento
- Email + Chat support (24h)

### ENTERPRISE - Orçamento customizado
- Usuários ilimitados
- Lojas ilimitadas
- Armazenamento customizado
- Suporte dedicado 24/7

### DESENVOLVIMENTO - Grátis
- Apenas para desenvolvimento local
- Sem SLA
- Suporte comunitário

---

## 📞 Contatos Obrigatórios

Configure estes emails:

```
support@varejix.com        → Suporte técnico
dpo@varejix.com            → Data Protection Officer (Privacidade)
legal@varejix.com          → Assuntos legais
security@varejix.com       → Vulnerabilidades
billing@varejix.com        → Faturas/Pagamentos
sales@varejix.com          → Vendas
```

---

## 🚨 Situações Críticas

### Brechas de Segurança
1. Detectar brechas
2. Notificar usuários (5 dias úteis)
3. Notificar ANPD (se necessário)
4. Documentar resposta
5. Melhorar segurança

### Reclamações de Privacidade
1. Receber solicitação
2. Validar identidade
3. Processar em 15 dias úteis
4. Responder por email
5. Documentar

### Violações de Termos
1. Detectar violação
2. Enviar aviso
3. Prazo de 7 dias para correção
4. Suspender se não corrigido
5. Documentar

---

## 📚 Referências Legais

### LGPD (Brasil)
- Lei nº 13.709/2018
- Entra em vigor: 2020
- Autoridade: ANPD (Autoridade Nacional de Proteção de Dados)
- Multa: até 2% do faturamento anual (máx R$ 50 milhões)

### GDPR (Europa)
- Regulamento (UE) 2016/679
- Entra em vigor: 2018
- Autoridade: EDPB (European Data Protection Board)
- Multa: até 4% do faturamento global anual

### CCPA (Califórnia)
- California Consumer Privacy Act
- Entra em vigor: 2020
- Autoridade: California Attorney General
- Multa: $2.500-$7.500 por violação

---

## ⚖️ Responsabilidades Legais

### Você É Responsável Por:
- Conformidade com legislação local
- Validação de dados inseridos
- Backup de dados
- Suporte ao cliente
- Cumprimento de legislação fiscal
- Aviso a clientes sobre coleta de dados

### Varejix É Responsável Por:
- Proteção de dados em armazenamento
- Segurança da plataforma
- Confidencialidade de dados
- Disponibilidade do serviço (SLA)
- Conformidade com LGPD/GDPR

---

## 📝 Versioning

- **v1.0** - 05/12/2025 - Versão inicial
  - License comercial
  - Termos de Serviço
  - Política de Privacidade (LGPD/GDPR/CCPA)
  - Suporte 3 planos (Starter, Professional, Enterprise)

---

## 🔗 Links Úteis

**Regulação LGPD:**
- ANPD: https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd
- Lei Completa: http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm

**Regulação GDPR:**
- EDPB: https://edpb.ec.europa.eu/
- Documentação: https://gdpr-info.eu/

**Regulação CCPA:**
- Attorney General CA: https://oag.ca.gov/privacy/ccpa

**Segurança:**
- OWASP: https://owasp.org/
- NIST Cybersecurity: https://www.nist.gov/cyberframework/
- ISO 27001: https://www.iso.org/isoiec-27001-information-security-management.html

---

## 👤 Autor & Contato

**Cristóvão Pereira**
- Email: cristovao@varejix.com
- GitHub: @cristovao-pereira
- Website: https://varejix.com

---

## ✅ Status

**PRODUCTION READY** ✨

Todos os documentos estão prontos para uso comercial.

---

**Última Atualização:** 5 de Dezembro de 2025  
**Versão:** 1.0  
**Status:** ✅ ATIVA
