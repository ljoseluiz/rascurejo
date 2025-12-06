import { useState, useEffect } from 'react'
import {
  Box,
  Button,
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
  HStack,
  Text,
  Divider,
  VStack,
} from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function FinancialReports() {
  const auth = useAuth()
  const toast = useToast()

  const [reports, setReports] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [auth.csrfToken])

  const loadReports = async () => {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const dre = await api.get('/financial/reports/dre', opts)
      const dashboard = await api.get('/financial/dashboard', opts)
      
      setReports({
        dre,
        dashboard,
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao carregar relatórios',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = () => {
    toast({
      title: 'Info',
      description: 'Exportação de PDF será implementada em breve',
      status: 'info',
    })
  }

  if (loading) {
    return (
      <Box p={6}>
        <Heading>Carregando relatórios...</Heading>
      </Box>
    )
  }

  const { dre = {}, dashboard = {} } = reports
  const summary = dashboard.summary || {}

  return (
    <Box p={6}>
      <Stack spacing={6}>
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="lg">Relatórios Financeiros</Heading>
          <HStack>
            <Button colorScheme="blue" size="md">
              📥 Importar
            </Button>
            <Button colorScheme="green" size="md" onClick={handleExportPDF}>
              📊 Exportar PDF
            </Button>
          </HStack>
        </HStack>

        {/* Main Tabs */}
        <Tabs variant="soft-rounded">
          <TabList>
            <Tab>DRE</Tab>
            <Tab>Posição Financeira</Tab>
            <Tab>Análise de Fluxo</Tab>
            <Tab>Indicadores</Tab>
          </TabList>

          <TabPanels>
            {/* DRE Tab */}
            <TabPanel>
              <Stack spacing={6}>
                <Heading size="md">Demonstrativo de Resultados do Exercício</Heading>

                <SimpleGrid columns={1} spacing={4}>
                  <Card>
                    <CardBody>
                      <VStack align="start" spacing={4}>
                        <Box w="100%">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">RECEITA BRUTA</Text>
                            <Text fontWeight="bold" color="green.600">
                              {(dre.revenue || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Text>
                          </HStack>
                          <Divider my={2} />
                        </Box>

                        <Box w="100%">
                          <HStack justify="space-between" pl={4}>
                            <Text>Contas a Receber (Recebidas)</Text>
                            <Text>
                              {(dre.revenue || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Text>
                          </HStack>
                        </Box>

                        <Box w="100%">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">(-) CUSTOS E DESPESAS</Text>
                            <Text fontWeight="bold" color="red.600">
                              {(dre.costs || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Text>
                          </HStack>
                          <Divider my={2} />
                        </Box>

                        <Box w="100%">
                          <HStack justify="space-between" pl={4}>
                            <Text>Contas a Pagar (Pagas)</Text>
                            <Text>
                              {(dre.costs || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Text>
                          </HStack>
                        </Box>

                        <Box w="100%" bg="blue.50" p={4} rounded="md">
                          <HStack justify="space-between">
                            <Text fontWeight="bold" fontSize="lg">
                              LUCRO LÍQUIDO
                            </Text>
                            <Text
                              fontWeight="bold"
                              fontSize="lg"
                              color={dre.profit >= 0 ? 'green.600' : 'red.600'}
                            >
                              {(dre.profit || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Text>
                          </HStack>
                        </Box>

                        <Box w="100%">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">MARGEM DE LUCRO</Text>
                            <Text
                              fontWeight="bold"
                              fontSize="lg"
                              color={dre.margin >= 0 ? 'green.600' : 'red.600'}
                            >
                              {(dre.margin || 0).toFixed(2)}%
                            </Text>
                          </HStack>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </Stack>
            </TabPanel>

            {/* Financial Position Tab */}
            <TabPanel>
              <Stack spacing={6}>
                <Heading size="md">Posição Financeira</Heading>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {/* Assets */}
                  <Card>
                    <CardBody>
                      <VStack align="start" spacing={4}>
                        <Heading size="sm">ATIVO</Heading>
                        <Divider />

                        <Box w="100%">
                          <HStack justify="space-between">
                            <Text>Caixa e Equivalentes</Text>
                            <Text fontWeight="bold">
                              {(summary.total_balance || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Text>
                          </HStack>
                        </Box>

                        <Box w="100%">
                          <HStack justify="space-between">
                            <Text>Contas a Receber</Text>
                            <Text fontWeight="bold">
                              {(summary.total_receivable || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Text>
                          </HStack>
                        </Box>

                        <Box w="100%" bg="green.50" p={3} rounded="md">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">TOTAL ATIVO</Text>
                            <Text fontWeight="bold" color="green.600">
                              {(
                                (summary.total_balance || 0) +
                                (summary.total_receivable || 0)
                              ).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Text>
                          </HStack>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Liabilities */}
                  <Card>
                    <CardBody>
                      <VStack align="start" spacing={4}>
                        <Heading size="sm">PASSIVO</Heading>
                        <Divider />

                        <Box w="100%">
                          <HStack justify="space-between">
                            <Text>Contas a Pagar</Text>
                            <Text fontWeight="bold">
                              {(summary.total_payable || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Text>
                          </HStack>
                        </Box>

                        <Box w="100%" bg="red.50" p={3} rounded="md">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">TOTAL PASSIVO</Text>
                            <Text fontWeight="bold" color="red.600">
                              {(summary.total_payable || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Text>
                          </HStack>
                        </Box>

                        <Box w="100%">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">Patrimônio Líquido</Text>
                            <Text fontWeight="bold">
                              {(
                                (summary.total_balance || 0) +
                                (summary.total_receivable || 0) -
                                (summary.total_payable || 0)
                              ).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Text>
                          </HStack>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </Stack>
            </TabPanel>

            {/* Cash Flow Analysis Tab */}
            <TabPanel>
              <Stack spacing={6}>
                <Heading size="md">Análise de Fluxo de Caixa</Heading>

                <SimpleGrid columns={1} spacing={4}>
                  <Card>
                    <CardBody>
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Período</Th>
                            <Th>Entradas</Th>
                            <Th>Saídas</Th>
                            <Th>Líquido</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          <Tr>
                            <Td>Hoje</Td>
                            <Td color="green.600">
                              {(summary.daily_entries || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Td>
                            <Td color="red.600">
                              {(summary.daily_exits || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Td>
                            <Td fontWeight="bold">
                              {(
                                (summary.daily_entries || 0) -
                                (summary.daily_exits || 0)
                              ).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </Stack>
            </TabPanel>

            {/* Indicators Tab */}
            <TabPanel>
              <Stack spacing={6}>
                <Heading size="md">Indicadores Financeiros</Heading>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Índice de Liquidez</StatLabel>
                        <StatNumber>
                          {(
                            (summary.total_balance || 0) /
                            Math.max(summary.total_payable || 1, 1)
                          ).toFixed(2)}x
                        </StatNumber>
                        <Text fontSize="sm" color="gray.600" mt={2}>
                          Capacidade de pagar dívidas curto prazo
                        </Text>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Índice de Endividamento</StatLabel>
                        <StatNumber>
                          {(
                            ((summary.total_payable || 0) /
                              ((summary.total_balance || 0) +
                                (summary.total_receivable || 0))) *
                            100
                          ).toFixed(1)}%
                        </StatNumber>
                        <Text fontSize="sm" color="gray.600" mt={2}>
                          Proporção de dívida sobre ativos
                        </Text>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Margem de Lucro</StatLabel>
                        <StatNumber color={dre.margin >= 0 ? 'green.600' : 'red.600'}>
                          {(dre.margin || 0).toFixed(2)}%
                        </StatNumber>
                        <Text fontSize="sm" color="gray.600" mt={2}>
                          Lucro em relação à receita
                        </Text>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>ROA (Retorno sobre Ativo)</StatLabel>
                        <StatNumber>
                          {(
                            ((dre.profit || 0) /
                              Math.max(
                                (summary.total_balance || 0) +
                                  (summary.total_receivable || 0),
                                1
                              )) *
                            100
                          ).toFixed(2)}%
                        </StatNumber>
                        <Text fontSize="sm" color="gray.600" mt={2}>
                          Rentabilidade dos ativos
                        </Text>
                      </Stat>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </Stack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>
    </Box>
  )
}
