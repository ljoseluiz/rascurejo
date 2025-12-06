import React, { useEffect, useState } from 'react'
import { Box, Grid, Heading, Spinner, Text, SimpleGrid, useToast, Badge, HStack, VStack, Card, CardBody, Stat, StatLabel, StatNumber, StatHelpText, Icon, Button } from '@chakra-ui/react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { FiShoppingCart, FiDollarSign, FiUsers, FiTrendingUp, FiPackage, FiAlertCircle, FiArrowRight } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const COLORS = ['#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#f56565', '#38b2ac']

export default function Dashboard() {
  const auth = useAuth()
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [salesStats, setSalesStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const opts = api.injectCsrf({}, auth.csrfToken)
        const [generalData, salesData] = await Promise.all([
          api.get('/stats', opts),
          api.get('/sales/stats', opts).catch(() => null),
        ])
        setStats(generalData)
        setSalesStats(salesData)
      } catch (err) {
        toast({ title: 'Erro', description: err.message, status: 'error', duration: 3000, isClosable: true })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [auth.csrfToken, toast])

  const formatCurrency = (value) => {
    return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="400px">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Box>
    )
  }

  const salesGrowth = stats?.salesGrowth || 0
  const revenueGrowth = stats?.revenueGrowth || 0

  return (
    <Box p={6} w="full" bg="gray.50" minH="100vh">
      <HStack justify="space-between" mb={6}>
        <Box>
          <Heading size="xl" color="gray.800">Dashboard</Heading>
          <Text color="gray.600" mt={1}>Visão geral do sistema</Text>
        </Box>
        <HStack spacing={3}>
          <Button as={RouterLink} to="/sales/pos" colorScheme="blue" leftIcon={<FiShoppingCart />}>
            Nova Venda
          </Button>
          <Button as={RouterLink} to="/products/new" variant="outline" colorScheme="blue">
            Novo Produto
          </Button>
        </HStack>
      </HStack>

      {/* Key Metrics Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 6 }} spacing={4} mb={8}>
        <Card bg="white" boxShadow="md" _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }} transition="all 0.2s">
          <CardBody>
            <HStack justify="space-between" mb={2}>
              <Icon as={FiShoppingCart} boxSize={6} color="blue.500" />
              <Badge colorScheme="blue" fontSize="xs">VENDAS</Badge>
            </HStack>
            <Stat>
              <StatLabel color="gray.600">Vendas Hoje</StatLabel>
              <StatNumber fontSize="3xl" color="blue.600">
                {salesStats?.today_sales || 0}
              </StatNumber>
              <StatHelpText color="gray.500">
                {formatCurrency(salesStats?.today_revenue || 0)}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="white" boxShadow="md" _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }} transition="all 0.2s">
          <CardBody>
            <HStack justify="space-between" mb={2}>
              <Icon as={FiDollarSign} boxSize={6} color="green.500" />
              <Badge colorScheme="green" fontSize="xs">RECEITA</Badge>
            </HStack>
            <Stat>
              <StatLabel color="gray.600">Receita Total</StatLabel>
              <StatNumber fontSize="2xl" color="green.600">
                {formatCurrency(salesStats?.total_revenue || stats?.totalSales || 0)}
              </StatNumber>
              <StatHelpText>
                <Badge colorScheme={revenueGrowth >= 0 ? 'green' : 'red'}>
                  {revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueGrowth).toFixed(1)}%
                </Badge>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="white" boxShadow="md" _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }} transition="all 0.2s">
          <CardBody>
            <HStack justify="space-between" mb={2}>
              <Icon as={FiTrendingUp} boxSize={6} color="purple.500" />
              <Badge colorScheme="purple" fontSize="xs">TICKET</Badge>
            </HStack>
            <Stat>
              <StatLabel color="gray.600">Ticket Médio</StatLabel>
              <StatNumber fontSize="2xl" color="purple.600">
                {formatCurrency(salesStats?.avg_ticket || stats?.averageTicket || 0)}
              </StatNumber>
              <StatHelpText color="gray.500">
                Por venda
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="white" boxShadow="md" _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }} transition="all 0.2s">
          <CardBody>
            <HStack justify="space-between" mb={2}>
              <Icon as={FiPackage} boxSize={6} color="orange.500" />
              <Badge colorScheme="orange" fontSize="xs">PRODUTOS</Badge>
            </HStack>
            <Stat>
              <StatLabel color="gray.600">Total Produtos</StatLabel>
              <StatNumber fontSize="3xl" color="orange.600">
                {stats?.totalProducts || 0}
              </StatNumber>
              <StatHelpText color="gray.500">
                Cadastrados
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="white" boxShadow="md" _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }} transition="all 0.2s">
          <CardBody>
            <HStack justify="space-between" mb={2}>
              <Icon as={FiUsers} boxSize={6} color="teal.500" />
              <Badge colorScheme="teal" fontSize="xs">CLIENTES</Badge>
            </HStack>
            <Stat>
              <StatLabel color="gray.600">Clientes Ativos</StatLabel>
              <StatNumber fontSize="3xl" color="teal.600">
                {stats?.totalCustomers || 0}
              </StatNumber>
              <StatHelpText color="gray.500">
                Total
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="white" boxShadow="md" _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }} transition="all 0.2s">
          <CardBody>
            <HStack justify="space-between" mb={2}>
              <Icon as={FiAlertCircle} boxSize={6} color="red.500" />
              <Badge colorScheme="red" fontSize="xs">ALERTA</Badge>
            </HStack>
            <Stat>
              <StatLabel color="gray.600">Estoque Baixo</StatLabel>
              <StatNumber fontSize="3xl" color="red.600">
                {stats?.lowStockItems || 0}
              </StatNumber>
              <StatHelpText>
                <Button as={RouterLink} to="/stock/levels" size="xs" variant="link" colorScheme="red" rightIcon={<FiArrowRight />}>
                  Ver detalhes
                </Button>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Top Sellers Card */}
      {salesStats?.top_sellers && salesStats.top_sellers.length > 0 && (
        <Card bg="white" boxShadow="md" mb={6}>
          <CardBody>
            <Heading size="md" mb={4} color="gray.700">🏆 Top Vendedores</Heading>
            <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} spacing={4}>
              {salesStats.top_sellers.map((seller, idx) => (
                <Box
                  key={seller.seller_id}
                  p={4}
                  bg={idx === 0 ? 'blue.50' : 'gray.50'}
                  borderRadius="md"
                  borderLeft="4px"
                  borderColor={idx === 0 ? 'blue.500' : 'gray.300'}
                >
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="bold" fontSize="lg" color="gray.700">
                      {seller.seller_name}
                    </Text>
                    {idx === 0 && <Badge colorScheme="yellow">1º</Badge>}
                  </HStack>
                  <Text fontSize="sm" color="gray.600">{seller.total_sales} vendas</Text>
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    {formatCurrency(seller.total_revenue)}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>
      )}

      {/* Charts Grid */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6} mb={6}>
        {/* Sales Trend - Area Chart */}
        {stats?.recentSales && (
          <Card bg="white" boxShadow="md">
            <CardBody>
              <Heading size="md" mb={4} color="gray.700">📈 Evolução de Vendas (7 dias)</Heading>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.recentSales}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4299e1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4299e1" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#718096" fontSize={12} />
                  <YAxis stroke="#718096" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#4299e1" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                    name="Vendas" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}

        {/* Top Products - Bar Chart */}
        {stats?.topProducts && (
          <Card bg="white" boxShadow="md">
            <CardBody>
              <Heading size="md" mb={4} color="gray.700">🔥 Top 5 Produtos</Heading>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#718096" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#718096" width={140} fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                  <Bar dataKey="sales" fill="#48bb78" name="Vendas" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}
      </Grid>

      {/* Second Row Charts */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        {/* Sales by Category - Pie Chart */}
        {stats?.salesByCategory && (
          <Card bg="white" boxShadow="md">
            <CardBody>
              <Heading size="md" mb={4} color="gray.700">📦 Vendas por Categoria</Heading>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.salesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.salesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}

        {/* Sales Status */}
        {stats?.salesByStatus && (
          <Card bg="white" boxShadow="md">
            <CardBody>
              <Heading size="md" mb={4} color="gray.700">📊 Status das Vendas</Heading>
              <VStack align="stretch" spacing={4} mt={4}>
                {stats.salesByStatus.map((item, idx) => (
                  <HStack key={idx} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                    <HStack>
                      <Box w={4} h={4} borderRadius="full" bg={COLORS[idx]} />
                      <Text fontWeight="medium" fontSize="md">{item.status}</Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Text fontSize="xl" fontWeight="bold" color="gray.700">{item.count}</Text>
                      <Badge colorScheme="gray">{item.percentage}%</Badge>
                    </HStack>
                  </HStack>
                ))}
              </VStack>
              <Box mt={6}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={stats.salesByStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="status" stroke="#718096" fontSize={12} />
                    <YAxis stroke="#718096" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#9f7aea" name="Quantidade" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>
        )}
      </Grid>
    </Box>
  )
}
