import { useState, useEffect } from 'react'
import {
  Box,
  Heading,
  Stack,
  useToast,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Badge,
  HStack,
  Text,
  Button,
} from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function FinancialDashboard() {
  const auth = useAuth()
  const toast = useToast()

  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [auth.csrfToken])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const response = await api.get('/financial/dashboard', opts)
      setData(response)
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao carregar dashboard financeiro',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box p={6}>
        <Heading>Carregando dashboard...</Heading>
      </Box>
    )
  }

  const summary = data.summary || {}
  const pendingPayables = data.pending_payables || []
  const pendingReceivables = data.pending_receivables || []

  const statusColors = {
    pending: 'yellow',
    overdue: 'red',
    paid: 'green',
    received: 'green',
  }

  const statusLabels = {
    pending: 'Pendente',
    overdue: 'Vencido',
    paid: 'Pago',
    received: 'Recebido',
  }

  return (
    <Box p={6}>
      <Stack spacing={6}>
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="lg">Dashboard Financeiro</Heading>
          <Button colorScheme="blue" size="sm" onClick={loadDashboard}>
            🔄 Atualizar
          </Button>
        </HStack>

        {/* KPI Cards */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Saldo em Caixa</StatLabel>
                <StatNumber color="blue.600">
                  {(summary.total_balance || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="yellow.50">
            <CardBody>
              <Stat>
                <StatLabel>A Pagar</StatLabel>
                <StatNumber color="orange.600">
                  {(summary.total_payable || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="red.50">
            <CardBody>
              <Stat>
                <StatLabel>Vencidos</StatLabel>
                <StatNumber color="red.600">
                  {(summary.overdue_payables || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="green.50">
            <CardBody>
              <Stat>
                <StatLabel>A Receber</StatLabel>
                <StatNumber color="green.600">
                  {(summary.total_receivable || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Daily Summary */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={4}>
              Movimentação de Hoje
            </Heading>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Box>
                <Text fontSize="sm" color="gray.600">
                  Entradas
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {(summary.daily_entries || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">
                  Saídas
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="red.600">
                  {(summary.daily_exits || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">
                  Líquido
                </Text>
                <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  color={
                    (summary.daily_entries || 0) - (summary.daily_exits || 0) >=
                    0
                      ? 'green.600'
                      : 'red.600'
                  }
                >
                  {(
                    (summary.daily_entries || 0) - (summary.daily_exits || 0)
                  ).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">
                  Saldo Final
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {(summary.total_balance || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Two Column Layout for Pending Items */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {/* Pending Payables */}
          <Card>
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading size="sm">Contas a Pagar Vencidas</Heading>
                <Button
                  colorScheme="blue"
                  size="sm"
                  variant="ghost"
                >
                  Ver Todas
                </Button>
              </HStack>

              <Box overflowX="auto">
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Fornecedor</Th>
                      <Th>Valor</Th>
                      <Th isNumeric>Vencimento</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {pendingPayables.length === 0 ? (
                      <Tr>
                        <Td colSpan={3} textAlign="center" fontSize="sm">
                          Nenhuma conta vencida
                        </Td>
                      </Tr>
                    ) : (
                      pendingPayables.slice(0, 5).map((payable) => (
                        <Tr key={payable.id}>
                          <Td fontSize="sm">{payable.supplier_name}</Td>
                          <Td fontWeight="bold">
                            {payable.amount.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </Td>
                          <Td isNumeric>
                            <Badge colorScheme={statusColors[payable.status]}>
                              {statusLabels[payable.status]}
                            </Badge>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>

          {/* Pending Receivables */}
          <Card>
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading size="sm">Contas a Receber Vencidas</Heading>
                <Button
                  colorScheme="blue"
                  size="sm"
                  variant="ghost"
                >
                  Ver Todas
                </Button>
              </HStack>

              <Box overflowX="auto">
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Cliente</Th>
                      <Th>Valor</Th>
                      <Th isNumeric>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {pendingReceivables.length === 0 ? (
                      <Tr>
                        <Td colSpan={3} textAlign="center" fontSize="sm">
                          Nenhuma cobrança vencida
                        </Td>
                      </Tr>
                    ) : (
                      pendingReceivables.slice(0, 5).map((receivable) => (
                        <Tr key={receivable.id}>
                          <Td fontSize="sm">{receivable.customer_name}</Td>
                          <Td fontWeight="bold">
                            {receivable.amount.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </Td>
                          <Td isNumeric>
                            <Badge colorScheme={statusColors[receivable.status]}>
                              {statusLabels[receivable.status]}
                            </Badge>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Financial Health Cards */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Card borderLeft="4px" borderColor="blue.400">
            <CardBody>
              <Text fontWeight="bold" mb={2}>
                Razão Corrente
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                {(
                  (summary.total_balance || 0) /
                  Math.max(summary.total_payable || 1, 1)
                ).toFixed(2)}
              </Text>
              <Text fontSize="xs" color="gray.600" mt={2}>
                Quanto você tem em caixa para cada real de dívida
              </Text>
            </CardBody>
          </Card>

          <Card borderLeft="4px" borderColor="purple.400">
            <CardBody>
              <Text fontWeight="bold" mb={2}>
                Equilíbrio Financeiro
              </Text>
              <Text
                fontSize="2xl"
                fontWeight="bold"
                color={
                  (summary.total_receivable || 0) >=
                  (summary.total_payable || 0)
                    ? 'green.600'
                    : 'red.600'
                }
              >
                {(summary.total_receivable || 0) >=
                (summary.total_payable || 0)
                  ? '✓ Positivo'
                  : '✗ Negativo'}
              </Text>
              <HStack spacing={2} mt={2} fontSize="xs">
                <Text>
                  Faturamento:{' '}
                  <Text as="span" fontWeight="bold">
                    {(summary.total_receivable || 0).toLocaleString(
                      'pt-BR',
                      {
                        style: 'currency',
                        currency: 'BRL',
                      }
                    )}
                  </Text>
                </Text>
              </HStack>
              <HStack spacing={2} fontSize="xs" color="gray.600">
                <Text>
                  Despesas:{' '}
                  <Text as="span" fontWeight="bold">
                    {(summary.total_payable || 0).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </Text>
                </Text>
              </HStack>
              <Text fontSize="xs" color="gray.600" mt={2}>
                Faturamento × Despesas
              </Text>
            </CardBody>
          </Card>

          <Card borderLeft="4px" borderColor="green.400">
            <CardBody>
              <Text fontWeight="bold" mb={2}>
                Pendências (Total)
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                {(
                  pendingPayables.length +
                  pendingReceivables.length
                )}
              </Text>
              <Text fontSize="xs" color="gray.600" mt={2}>
                Documentos em aberto que precisam atenção
              </Text>
            </CardBody>
          </Card>

          <Card borderLeft="4px" borderColor="red.400">
            <CardBody>
              <Text fontWeight="bold" mb={2}>
                Saldo Líquido
              </Text>
              <Text
                fontSize="2xl"
                fontWeight="bold"
                color={
                  (summary.total_balance || 0) -
                    (summary.total_payable || 0) >=
                  0
                    ? 'green.600'
                    : 'red.600'
                }
              >
                {(
                  (summary.total_balance || 0) -
                  (summary.total_payable || 0)
                ).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </Text>
              <Text fontSize="xs" color="gray.600" mt={2}>
                Se todas as contas fossem pagas agora
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Stack>
    </Box>
  )
}
