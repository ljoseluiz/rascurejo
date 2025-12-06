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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Badge,
  HStack,
  Text,
  Progress,
  VStack,
  Divider,
} from '@chakra-ui/react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function CashFlow() {
  const auth = useAuth()
  const toast = useToast()

  const [cashFlow, setCashFlow] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCashFlow()
  }, [auth.csrfToken])

  const loadCashFlow = async () => {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get('/financial/cash-flow', opts)
      setCashFlow(data)
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao carregar fluxo de caixa',
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
        <Heading>Carregando...</Heading>
      </Box>
    )
  }

  if (!cashFlow) {
    return (
      <Box p={6}>
        <Heading>Erro ao carregar dados</Heading>
      </Box>
    )
  }

  const periods = cashFlow.cash_flow || []

  // Preparar dados para gráficos
  const chartData = periods.map((period) => ({
    periodo: period.period,
    entradas: period.expected_inflow || 0,
    saidas: period.expected_outflow || 0,
    saldo: period.balance || 0,
  }))

  // Dados acumulados para gráfico de área
  let saldoAcumulado = cashFlow.total_balance || 0
  const areaChartData = periods.map((period) => {
    saldoAcumulado += (period.expected_inflow || 0) - (period.expected_outflow || 0)
    return {
      periodo: period.period,
      saldoAcumulado: saldoAcumulado,
    }
  })

  // Formatador de moeda para tooltips
  const formatCurrency = (value) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  return (
    <Box p={6}>
      <Stack spacing={6}>
        {/* Header */}
        <Heading size="lg">Fluxo de Caixa</Heading>

        {/* Summary Cards */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Card bg="blue.50">
            <CardBody>
              <Stat>
                <StatLabel>Saldo Atual</StatLabel>
                <StatNumber color="blue.600">
                  {(cashFlow.total_balance || 0).toLocaleString('pt-BR', {
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
                  {(cashFlow.pending_receivables || 0).toLocaleString('pt-BR', {
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
                <StatLabel>A Pagar</StatLabel>
                <StatNumber color="red.600">
                  {(cashFlow.pending_payables || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cashFlow.net_flow >= 0 ? 'green.50' : 'red.50'}>
            <CardBody>
              <Stat>
                <StatLabel>Fluxo Líquido</StatLabel>
                <StatNumber color={cashFlow.net_flow >= 0 ? 'green.600' : 'red.600'}>
                  {(cashFlow.net_flow || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Gráficos de Fluxo de Caixa */}
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>
              Projeção de Saldo por Período
            </Heading>
            <Divider mb={4} />
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={areaChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="saldoAcumulado"
                  name="Saldo Acumulado"
                  stroke="#3182CE"
                  fill="#63B3ED"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {/* Gráfico de Entradas vs Saídas */}
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>
                Entradas vs Saídas
              </Heading>
              <Divider mb={4} />
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="entradas" name="Entradas" fill="#48BB78" />
                  <Bar dataKey="saidas" name="Saídas" fill="#F56565" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Gráfico de Linha - Saldo por Período */}
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>
                Evolução do Saldo
              </Heading>
              <Divider mb={4} />
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    name="Saldo Previsto"
                    stroke="#805AD5"
                    strokeWidth={3}
                    dot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Forecast Tabs */}
        <Tabs variant="soft-rounded">
          <TabList>
            <Tab>D+0 (Hoje)</Tab>
            <Tab>D+30 (30 dias)</Tab>
            <Tab>D+60 (60 dias)</Tab>
          </TabList>

          <TabPanels>
            {periods.map((period, index) => (
              <TabPanel key={index}>
                <Stack spacing={6}>
                  {/* Period Cards */}
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Entradas Previstas</StatLabel>
                          <StatNumber color="green.600">
                            {(period.expected_inflow || 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Saídas Previstas</StatLabel>
                          <StatNumber color="red.600">
                            {(period.expected_outflow || 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>

                    <Card bg={period.balance >= 0 ? 'green.50' : 'red.50'}>
                      <CardBody>
                        <Stat>
                          <StatLabel>Saldo Previsto</StatLabel>
                          <StatNumber color={period.balance >= 0 ? 'green.600' : 'red.600'}>
                            {(period.balance || 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>
                  </SimpleGrid>

                  {/* Progress Bar */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="bold">Cobertura de Despesas</Text>
                      <Text>
                        {(
                          ((period.expected_inflow || 0) /
                            (period.expected_outflow || 1)) *
                          100
                        ).toFixed(0)}%
                      </Text>
                    </HStack>
                    <Progress
                      value={Math.min(
                        ((period.expected_inflow || 0) /
                          (period.expected_outflow || 1)) *
                          100,
                        100
                      )}
                      colorScheme={
                        (period.expected_inflow || 0) >=
                        (period.expected_outflow || 0)
                          ? 'green'
                          : 'red'
                      }
                    />
                  </Box>

                  {/* Details */}
                  <Box>
                    <Heading size="sm" mb={4}>
                      Análise do Período
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box p={4} bg="gray.50" rounded="md">
                        <Text fontWeight="bold" mb={2}>
                          Inflows (Entradas)
                        </Text>
                        <VStack align="start" spacing={2} fontSize="sm">
                          <HStack justify="space-between" w="100%">
                            <Text>Contas a Receber</Text>
                            <Badge colorScheme="green">
                              {(period.expected_inflow || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Badge>
                          </HStack>
                        </VStack>
                      </Box>

                      <Box p={4} bg="gray.50" rounded="md">
                        <Text fontWeight="bold" mb={2}>
                          Outflows (Saídas)
                        </Text>
                        <VStack align="start" spacing={2} fontSize="sm">
                          <HStack justify="space-between" w="100%">
                            <Text>Contas a Pagar</Text>
                            <Badge colorScheme="red">
                              {(period.expected_outflow || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Badge>
                          </HStack>
                        </VStack>
                      </Box>
                    </SimpleGrid>
                  </Box>
                </Stack>
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>

        {/* Scenario Analysis */}
        <Box>
          <Heading size="sm" mb={4}>
            Análise de Cenários
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Card borderLeft="4px" borderColor="green.400">
              <CardBody>
                <Text fontWeight="bold" mb={2}>
                  Cenário Otimista
                </Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Se todos os recebimentos vierem até D+30
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="green.600">
                  {(
                    (cashFlow.total_balance || 0) +
                    (cashFlow.pending_receivables || 0)
                  ).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </Text>
              </CardBody>
            </Card>

            <Card borderLeft="4px" borderColor="orange.400">
              <CardBody>
                <Text fontWeight="bold" mb={2}>
                  Cenário Normal
                </Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Recebimentos até D+60 conforme prazo
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="orange.600">
                  {(cashFlow.net_flow || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </Text>
              </CardBody>
            </Card>

            <Card borderLeft="4px" borderColor="red.400">
              <CardBody>
                <Text fontWeight="bold" mb={2}>
                  Cenário Pessimista
                </Text>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Pagamentos em atraso, recebimentos lentos
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="red.600">
                  {(
                    (cashFlow.total_balance || 0) -
                    (cashFlow.pending_payables || 0)
                  ).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </Text>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>
      </Stack>
    </Box>
  )
}
