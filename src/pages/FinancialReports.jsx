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
  Badge,
  Progress,
} from '@chakra-ui/react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const COLORS = ['#48BB78', '#4299E1', '#9F7AEA', '#ED8936', '#F56565', '#38B2AC', '#667EEA', '#F687B3']

export default function FinancialReports() {
  const auth = useAuth()
  const toast = useToast()

  const [reports, setReports] = useState({})
  const [categoryData, setCategoryData] = useState([])
  const [productData, setProductData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [auth.csrfToken])

  const loadReports = async () => {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const [dre, dashboard, byCategory, byProduct] = await Promise.all([
        api.get('/financial/reports/dre', opts),
        api.get('/financial/dashboard', opts),
        api.get('/financial/reports/by-category', opts),
        api.get('/financial/reports/by-product', opts),
      ])
      
      setReports({ dre, dashboard })
      setCategoryData(byCategory.items || [])
      setProductData(byProduct.items || [])
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

  const formatCurrency = (value) => {
    return (value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
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
  
  // Calcular equilíbrio financeiro
  const totalRevenue = dre.revenue || 0
  const totalExpenses = dre.costs || 0
  const balance = totalRevenue - totalExpenses
  const balancePercentage = totalRevenue > 0 ? (balance / totalRevenue) * 100 : 0

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
            <Tab>DRE Simplificado</Tab>
            <Tab>Margem & Lucratividade</Tab>
            <Tab>Equilíbrio Financeiro</Tab>
            <Tab>Posição Financeira</Tab>
            <Tab>Indicadores</Tab>
          </TabList>

          <TabPanels>
            {/* DRE Tab */}
            <TabPanel>
              <Stack spacing={6}>
                <Heading size="md">Demonstrativo de Resultados do Exercício (DRE)</Heading>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {/* DRE Table */}
                  <Card>
                    <CardBody>
                      <VStack align="start" spacing={4}>
                        <Box w="100%">
                          <HStack justify="space-between">
                            <Text fontWeight="bold" fontSize="lg">RECEITA BRUTA</Text>
                            <Text fontWeight="bold" fontSize="lg" color="green.600">
                              {formatCurrency(dre.revenue)}
                            </Text>
                          </HStack>
                          <Divider my={2} />
                        </Box>

                        <Box w="100%">
                          <HStack justify="space-between" pl={4}>
                            <Text color="gray.600">Contas a Receber (Recebidas)</Text>
                            <Text>{formatCurrency(dre.revenue)}</Text>
                          </HStack>
                        </Box>

                        <Box w="100%">
                          <HStack justify="space-between">
                            <Text fontWeight="bold" fontSize="lg">(-) CUSTOS E DESPESAS</Text>
                            <Text fontWeight="bold" fontSize="lg" color="red.600">
                              {formatCurrency(dre.costs)}
                            </Text>
                          </HStack>
                          <Divider my={2} />
                        </Box>

                        <Box w="100%">
                          <HStack justify="space-between" pl={4}>
                            <Text color="gray.600">Contas a Pagar (Pagas)</Text>
                            <Text>{formatCurrency(dre.costs)}</Text>
                          </HStack>
                        </Box>

                        <Box w="100%" bg="blue.50" p={4} rounded="md">
                          <HStack justify="space-between">
                            <Text fontWeight="bold" fontSize="xl">
                              LUCRO LÍQUIDO
                            </Text>
                            <Text
                              fontWeight="bold"
                              fontSize="xl"
                              color={dre.profit >= 0 ? 'green.600' : 'red.600'}
                            >
                              {formatCurrency(dre.profit)}
                            </Text>
                          </HStack>
                        </Box>

                        <Box w="100%">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">MARGEM DE LUCRO</Text>
                            <Badge
                              fontSize="lg"
                              colorScheme={dre.margin >= 0 ? 'green' : 'red'}
                              px={3}
                              py={1}
                            >
                              {(dre.margin || 0).toFixed(2)}%
                            </Badge>
                          </HStack>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* DRE Chart */}
                  <Card>
                    <CardBody>
                      <Heading size="sm" mb={4}>Composição do Resultado</Heading>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Receita', value: dre.revenue || 0 },
                              { name: 'Custos', value: dre.costs || 0 },
                              { name: 'Lucro', value: Math.max(0, dre.profit || 0) },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[0, 1, 2].map((index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </Stack>
            </TabPanel>

            {/* Margin & Profitability Tab */}
            <TabPanel>
              <Stack spacing={6}>
                <Heading size="md">Margem Geral & Lucratividade</Heading>

                {/* Summary Cards */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Card borderLeft="4px" borderColor="green.400">
                    <CardBody>
                      <Stat>
                        <StatLabel>Margem Geral da Empresa</StatLabel>
                        <StatNumber color="green.600" fontSize="3xl">
                          {(dre.margin || 0).toFixed(2)}%
                        </StatNumber>
                        <Text fontSize="sm" color="gray.600" mt={2}>
                          Lucro líquido sobre receita total
                        </Text>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card borderLeft="4px" borderColor="blue.400">
                    <CardBody>
                      <Stat>
                        <StatLabel>Lucratividade Total</StatLabel>
                        <StatNumber color={dre.profit >= 0 ? 'green.600' : 'red.600'} fontSize="2xl">
                          {formatCurrency(dre.profit)}
                        </StatNumber>
                        <Text fontSize="sm" color="gray.600" mt={2}>
                          Resultado líquido do período
                        </Text>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card borderLeft="4px" borderColor="purple.400">
                    <CardBody>
                      <Stat>
                        <StatLabel>Eficiência Operacional</StatLabel>
                        <StatNumber color="purple.600" fontSize="2xl">
                          {totalRevenue > 0 ? ((1 - totalExpenses / totalRevenue) * 100).toFixed(1) : 0}%
                        </StatNumber>
                        <Text fontSize="sm" color="gray.600" mt={2}>
                          Percentual de receita retida
                        </Text>
                      </Stat>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Profitability by Category */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4}>Lucratividade por Categoria</Heading>
                    <Box overflowX="auto">
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Categoria</Th>
                            <Th isNumeric>Produtos</Th>
                            <Th isNumeric>Estoque</Th>
                            <Th isNumeric>Valor Total</Th>
                            <Th isNumeric>Preço Médio</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {categoryData.map((cat, idx) => (
                            <Tr key={idx}>
                              <Td fontWeight="bold">{cat.category}</Td>
                              <Td isNumeric>{cat.totalProducts}</Td>
                              <Td isNumeric>{cat.totalStock}</Td>
                              <Td isNumeric fontWeight="bold" color="green.600">
                                {formatCurrency(cat.totalValue)}
                              </Td>
                              <Td isNumeric>{formatCurrency(cat.avgPrice)}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </CardBody>
                </Card>

                {/* Category Chart */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4}>Distribuição de Valor por Categoria</Heading>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                        <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="totalValue" name="Valor Total" fill="#48BB78" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>

                {/* Top Products */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4}>Top 10 Produtos por Valor em Estoque</Heading>
                    <Box overflowX="auto">
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Produto</Th>
                            <Th>SKU</Th>
                            <Th>Categoria</Th>
                            <Th isNumeric>Estoque</Th>
                            <Th isNumeric>Preço Unit.</Th>
                            <Th isNumeric>Valor Total</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {productData.slice(0, 10).map((prod) => (
                            <Tr key={prod.id}>
                              <Td fontWeight="bold">{prod.name}</Td>
                              <Td fontSize="xs">{prod.sku}</Td>
                              <Td fontSize="sm">{prod.category}</Td>
                              <Td isNumeric>{prod.stock}</Td>
                              <Td isNumeric>{formatCurrency(prod.price)}</Td>
                              <Td isNumeric fontWeight="bold" color="green.600">
                                {formatCurrency(prod.totalValue)}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </CardBody>
                </Card>
              </Stack>
            </TabPanel>

            {/* Financial Balance Tab */}
            <TabPanel>
              <Stack spacing={6}>
                <Heading size="md">Equilíbrio Financeiro (Faturamento × Despesas)</Heading>

                {/* Balance Cards */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Card bg="green.50">
                    <CardBody>
                      <Stat>
                        <StatLabel>Faturamento Total</StatLabel>
                        <StatNumber color="green.600" fontSize="2xl">
                          {formatCurrency(totalRevenue)}
                        </StatNumber>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Receitas do período
                        </Text>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card bg="red.50">
                    <CardBody>
                      <Stat>
                        <StatLabel>Despesas Totais</StatLabel>
                        <StatNumber color="red.600" fontSize="2xl">
                          {formatCurrency(totalExpenses)}
                        </StatNumber>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Custos e despesas
                        </Text>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card bg={balance >= 0 ? 'blue.50' : 'orange.50'}>
                    <CardBody>
                      <Stat>
                        <StatLabel>Saldo Líquido</StatLabel>
                        <StatNumber color={balance >= 0 ? 'blue.600' : 'orange.600'} fontSize="2xl">
                          {formatCurrency(balance)}
                        </StatNumber>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          {balance >= 0 ? 'Superávit' : 'Déficit'}
                        </Text>
                      </Stat>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Balance Visualization */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4}>Análise de Equilíbrio</Heading>
                    <VStack spacing={4} align="stretch">
                      <Box>
                        <HStack justify="space-between" mb={2}>
                          <Text fontWeight="bold">Proporção Faturamento vs Despesas</Text>
                          <Badge colorScheme={balance >= 0 ? 'green' : 'red'} fontSize="md">
                            {balancePercentage.toFixed(1)}% de margem
                          </Badge>
                        </HStack>
                        <Progress
                          value={totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0}
                          colorScheme={balance >= 0 ? 'green' : 'red'}
                          size="lg"
                          rounded="md"
                        />
                        <HStack justify="space-between" mt={2} fontSize="sm">
                          <Text>0%</Text>
                          <Text fontWeight="bold">
                            {totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : 0}% de despesas
                          </Text>
                          <Text>100%</Text>
                        </HStack>
                      </Box>

                      <Divider />

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <Box p={4} bg="gray.50" rounded="md">
                          <Text fontWeight="bold" mb={2}>🟢 Faturamento</Text>
                          <Text fontSize="2xl" fontWeight="bold" color="green.600">
                            {formatCurrency(totalRevenue)}
                          </Text>
                          <Text fontSize="sm" color="gray.600" mt={1}>
                            100% da receita
                          </Text>
                        </Box>

                        <Box p={4} bg="gray.50" rounded="md">
                          <Text fontWeight="bold" mb={2}>🔴 Despesas</Text>
                          <Text fontSize="2xl" fontWeight="bold" color="red.600">
                            {formatCurrency(totalExpenses)}
                          </Text>
                          <Text fontSize="sm" color="gray.600" mt={1}>
                            {totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : 0}% da receita
                          </Text>
                        </Box>
                      </SimpleGrid>

                      <Box p={4} bg={balance >= 0 ? 'green.50' : 'red.50'} rounded="md">
                        <HStack justify="space-between">
                          <Box>
                            <Text fontWeight="bold" mb={1}>
                              {balance >= 0 ? '✅ Situação Positiva' : '⚠️ Situação Crítica'}
                            </Text>
                            <Text fontSize="sm">
                              {balance >= 0
                                ? 'Suas receitas superam as despesas.'
                                : 'Suas despesas superam as receitas.'}
                            </Text>
                          </Box>
                          <Text fontSize="3xl" fontWeight="bold" color={balance >= 0 ? 'green.600' : 'red.600'}>
                            {balance >= 0 ? '+' : ''}{balancePercentage.toFixed(1)}%
                          </Text>
                        </HStack>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Balance Chart */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4}>Comparativo Faturamento × Despesas</Heading>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          { name: 'Faturamento', valor: totalRevenue },
                          { name: 'Despesas', valor: totalExpenses },
                          { name: 'Saldo', valor: Math.abs(balance) },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="valor" name="Valor" fill="#4299E1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>
              </Stack>
            </TabPanel>

            {/* Financial Position Tab */}
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
                        <Heading size="sm" color="green.600">ATIVO</Heading>
                        <Divider />

                        <Box w="100%">
                          <HStack justify="space-between">
                            <Text>Caixa e Equivalentes</Text>
                            <Text fontWeight="bold">
                              {formatCurrency(summary.total_balance)}
                            </Text>
                          </HStack>
                        </Box>

                        <Box w="100%">
                          <HStack justify="space-between">
                            <Text>Contas a Receber</Text>
                            <Text fontWeight="bold">
                              {formatCurrency(summary.total_receivable)}
                            </Text>
                          </HStack>
                        </Box>

                        <Box w="100%" bg="green.50" p={3} rounded="md">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">TOTAL ATIVO</Text>
                            <Text fontWeight="bold" fontSize="lg" color="green.600">
                              {formatCurrency(
                                (summary.total_balance || 0) +
                                (summary.total_receivable || 0)
                              )}
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
                        <Heading size="sm" color="red.600">PASSIVO</Heading>
                        <Divider />

                        <Box w="100%">
                          <HStack justify="space-between">
                            <Text>Contas a Pagar</Text>
                            <Text fontWeight="bold">
                              {formatCurrency(summary.total_payable)}
                            </Text>
                          </HStack>
                        </Box>

                        <Box w="100%" bg="red.50" p={3} rounded="md">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">TOTAL PASSIVO</Text>
                            <Text fontWeight="bold" fontSize="lg" color="red.600">
                              {formatCurrency(summary.total_payable)}
                            </Text>
                          </HStack>
                        </Box>

                        <Box w="100%" bg="blue.50" p={3} rounded="md">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">PATRIMÔNIO LÍQUIDO</Text>
                            <Text fontWeight="bold" fontSize="lg" color="blue.600">
                              {formatCurrency(
                                (summary.total_balance || 0) +
                                (summary.total_receivable || 0) -
                                (summary.total_payable || 0)
                              )}
                            </Text>
                          </HStack>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </Stack>
            </TabPanel>

            {/* Indicators Tab */}
            <TabPanel>
              <Stack spacing={6}>
                <Heading size="md">Indicadores Financeiros</Heading>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Índice de Liquidez</StatLabel>
                        <StatNumber fontSize="3xl" color="blue.600">
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
                        <StatNumber fontSize="3xl" color="purple.600">
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
                        <StatNumber fontSize="3xl" color={dre.margin >= 0 ? 'green.600' : 'red.600'}>
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
                        <StatNumber fontSize="3xl" color="orange.600">
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

                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Razão Corrente</StatLabel>
                        <StatNumber fontSize="3xl" color="teal.600">
                          {(
                            ((summary.total_balance || 0) + (summary.total_receivable || 0)) /
                            Math.max(summary.total_payable || 1, 1)
                          ).toFixed(2)}x
                        </StatNumber>
                        <Text fontSize="sm" color="gray.600" mt={2}>
                          Ativo circulante / Passivo circulante
                        </Text>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Eficiência Operacional</StatLabel>
                        <StatNumber fontSize="3xl" color="green.600">
                          {totalRevenue > 0 ? ((1 - totalExpenses / totalRevenue) * 100).toFixed(1) : 0}%
                        </StatNumber>
                        <Text fontSize="sm" color="gray.600" mt={2}>
                          Percentual de receita retida
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
