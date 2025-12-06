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
} from '@chakra-ui/react'
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

// VStack component imported but not available, need to add it
function VStack({ children, ...props }) {
  const { spacing = 0, align = 'stretch', ...rest } = props
  return (
    <Box display="flex" flexDirection="column" gap={spacing} {...rest}>
      {children}
    </Box>
  )
}
