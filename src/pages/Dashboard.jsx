import React, { useEffect, useState } from 'react'
import { Box, Grid, Heading, Spinner, Text, SimpleGrid, useToast, Badge, HStack, VStack } from '@chakra-ui/react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const COLORS = ['#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#f56565', '#38b2ac']

export default function Dashboard() {
  const auth = useAuth()
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const opts = api.injectCsrf({}, auth.csrfToken)
        const data = await api.get('/stats', opts)
        setStats(data)
      } catch (err) {
        toast({ title: 'Erro', description: err.message, status: 'error', duration: 3000, isClosable: true })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [auth.csrfToken, toast])

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" h="400px"><Spinner size="xl" /></Box>

  const salesGrowth = stats?.salesGrowth || 0
  const revenueGrowth = stats?.revenueGrowth || 0

  return (
    <Box p={6}>
      <Heading mb={6}>Dashboard</Heading>

      {/* Key metrics - 6 cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 6 }} spacing={4} mb={8}>
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm" borderLeft="4px" borderColor="blue.500">
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Total de Produtos</Text>
          <Heading size="lg" color="blue.600">{stats?.totalProducts || 0}</Heading>
        </Box>
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm" borderLeft="4px" borderColor="green.500">
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Receita Total</Text>
          <Heading size="lg" color="green.600">R$ {(stats?.totalSales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Heading>
          <Badge colorScheme={revenueGrowth >= 0 ? 'green' : 'red'} mt={1}>
            {revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueGrowth).toFixed(1)}%
          </Badge>
        </Box>
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm" borderLeft="4px" borderColor="purple.500">
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Clientes Ativos</Text>
          <Heading size="lg" color="purple.600">{stats?.totalCustomers || 0}</Heading>
        </Box>
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm" borderLeft="4px" borderColor="orange.500">
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Vendas (mês)</Text>
          <Heading size="lg" color="orange.600">{stats?.monthlySales || 0}</Heading>
          <Badge colorScheme={salesGrowth >= 0 ? 'green' : 'red'} mt={1}>
            {salesGrowth >= 0 ? '↑' : '↓'} {Math.abs(salesGrowth).toFixed(1)}%
          </Badge>
        </Box>
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm" borderLeft="4px" borderColor="teal.500">
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Ticket Médio</Text>
          <Heading size="lg" color="teal.600">R$ {(stats?.averageTicket || 0).toFixed(2)}</Heading>
        </Box>
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm" borderLeft="4px" borderColor="red.500">
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">Estoque Baixo</Text>
          <Heading size="lg" color="red.600">{stats?.lowStockItems || 0}</Heading>
        </Box>
      </SimpleGrid>

      {/* Charts Grid */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6} mb={6}>
        {/* Sales Trend - Area Chart */}
        {stats?.recentSales && (
          <Box bg="white" p={6} borderRadius="md" boxShadow="md">
            <Heading size="md" mb={4}>Evolução de Vendas (7 dias)</Heading>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats.recentSales}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4299e1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4299e1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#718096" />
                <YAxis stroke="#718096" />
                <Tooltip />
                <Area type="monotone" dataKey="amount" stroke="#4299e1" fillOpacity={1} fill="url(#colorAmount)" name="Vendas (R$)" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}

        {/* Top Products - Bar Chart */}
        {stats?.topProducts && (
          <Box bg="white" p={6} borderRadius="md" boxShadow="md">
            <Heading size="md" mb={4}>Top 5 Produtos</Heading>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#718096" />
                <YAxis dataKey="name" type="category" stroke="#718096" width={120} />
                <Tooltip />
                <Bar dataKey="sales" fill="#48bb78" name="Vendas" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Grid>

      {/* Second Row Charts */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        {/* Sales by Category - Pie Chart */}
        {stats?.salesByCategory && (
          <Box bg="white" p={6} borderRadius="md" boxShadow="md">
            <Heading size="md" mb={4}>Vendas por Categoria</Heading>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.salesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.salesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        )}

        {/* Sales Status */}
        {stats?.salesByStatus && (
          <Box bg="white" p={6} borderRadius="md" boxShadow="md">
            <Heading size="md" mb={4}>Status das Vendas</Heading>
            <VStack align="stretch" spacing={4} mt={4}>
              {stats.salesByStatus.map((item, idx) => (
                <HStack key={idx} justify="space-between">
                  <HStack>
                    <Box w={3} h={3} borderRadius="full" bg={COLORS[idx]} />
                    <Text fontWeight="medium">{item.status}</Text>
                  </HStack>
                  <HStack>
                    <Text fontSize="lg" fontWeight="bold">{item.count}</Text>
                    <Text color="gray.500">({item.percentage}%)</Text>
                  </HStack>
                </HStack>
              ))}
            </VStack>
            <ResponsiveContainer width="100%" height={180} style={{ marginTop: '20px' }}>
              <BarChart data={stats.salesByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="status" stroke="#718096" />
                <YAxis stroke="#718096" />
                <Tooltip />
                <Bar dataKey="count" fill="#9f7aea" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Grid>
    </Box>
  )
}

