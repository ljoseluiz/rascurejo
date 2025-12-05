import React, { useEffect, useState } from 'react'
import { Box, Grid, Heading, Spinner, Text, SimpleGrid, useToast } from '@chakra-ui/react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

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

  if (loading) return <Spinner />

  return (
    <Box>
      <Heading mb={6}>Dashboard</Heading>

      {/* Key metrics */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={8}>
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Text fontSize="sm" color="gray.500">Total de Produtos</Text>
          <Heading size="lg">{stats?.totalProducts || 0}</Heading>
        </Box>
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Text fontSize="sm" color="gray.500">Vendas Totais</Text>
          <Heading size="lg">R$ {(stats?.totalSales || 0).toLocaleString('pt-BR')}</Heading>
        </Box>
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Text fontSize="sm" color="gray.500">Clientes</Text>
          <Heading size="lg">{stats?.totalCustomers || 0}</Heading>
        </Box>
      </SimpleGrid>

      {/* Sales chart */}
      {stats?.recentSales && (
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm" mb={8}>
          <Heading size="md" mb={4}>Vendas dos últimos 7 dias</Heading>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.recentSales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#4299e1" name="Vendas (R$)" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  )
}

