import React, { useState, useEffect } from 'react'
import { Box, Heading, SimpleGrid, Text, Badge, Input, HStack, Button, Spinner, Table, Thead, Tbody, Tr, Th, Td, TableContainer, useToast, Select } from '@chakra-ui/react'
import api from '../services/api'

export default function Sales() {
  const toast = useToast()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  useEffect(() => {
    loadSales()
  }, [page, status])

  async function loadSales() {
    setLoading(true)
    try {
      const params = `startDate=${startDate}&endDate=${endDate}&status=${status}&page=${page}&limit=${limit}`
      const response = await api.get(`/sales?${params}`)
      setSales(response.items || [])
    } catch (err) {
      toast({ title: 'Erro', description: err.message, status: 'error', duration: 3000, isClosable: true })
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status) {
    const map = {
      completed: { color: 'green', label: 'Concluída' },
      pending: { color: 'yellow', label: 'Pendente' },
      cancelled: { color: 'red', label: 'Cancelada' }
    }
    return map[status] || { color: 'gray', label: status }
  }

  const totalSales = sales.reduce((sum, s) => sum + s.total, 0)
  const totalItems = sales.reduce((sum, s) => sum + s.quantity, 0)
  const avgTicket = sales.length > 0 ? totalSales / sales.length : 0

  return (
    <Box p={6}>
      <Heading mb={6}>Vendas</Heading>

      {/* KPIs */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Text fontSize="sm" color="gray.600">Total de Vendas</Text>
          <Text fontSize="2xl" fontWeight="bold">R$ {totalSales.toFixed(2)}</Text>
        </Box>
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Text fontSize="sm" color="gray.600">Itens Vendidos</Text>
          <Text fontSize="2xl" fontWeight="bold">{totalItems}</Text>
        </Box>
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Text fontSize="sm" color="gray.600">Ticket Médio</Text>
          <Text fontSize="2xl" fontWeight="bold">R$ {avgTicket.toFixed(2)}</Text>
        </Box>
      </SimpleGrid>

      {/* Filtros */}
      <Box bg="white" p={4} borderRadius="md" boxShadow="sm" mb={4}>
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
          <Box>
            <Text fontSize="sm" mb={1}>Data Início</Text>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Box>
          <Box>
            <Text fontSize="sm" mb={1}>Data Fim</Text>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Box>
          <Box>
            <Text fontSize="sm" mb={1}>Status</Text>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Todos</option>
              <option value="completed">Concluídas</option>
              <option value="pending">Pendentes</option>
              <option value="cancelled">Canceladas</option>
            </Select>
          </Box>
          <Box display="flex" alignItems="flex-end">
            <Button onClick={loadSales} colorScheme="blue" width="full">Filtrar</Button>
          </Box>
        </SimpleGrid>
      </Box>

      {/* Tabela de Vendas */}
      {loading ? (
        <Spinner />
      ) : (
        <TableContainer bg="white" borderRadius="md" boxShadow="sm">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Data</Th>
                <Th>Cliente</Th>
                <Th>Produto</Th>
                <Th isNumeric>Qtd</Th>
                <Th isNumeric>Valor Unit.</Th>
                <Th isNumeric>Total</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sales.map((sale) => {
                const statusInfo = getStatusBadge(sale.status)
                return (
                  <Tr key={sale.id}>
                    <Td>{sale.id}</Td>
                    <Td>{new Date(sale.date).toLocaleDateString('pt-BR')}</Td>
                    <Td>{sale.customer}</Td>
                    <Td>{sale.product}</Td>
                    <Td isNumeric>{sale.quantity}</Td>
                    <Td isNumeric>R$ {sale.unitPrice.toFixed(2)}</Td>
                    <Td isNumeric fontWeight="bold">R$ {sale.total.toFixed(2)}</Td>
                    <Td>
                      <Badge colorScheme={statusInfo.color}>{statusInfo.label}</Badge>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      {/* Paginação */}
      <HStack justify="space-between" mt={4}>
        <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          Anterior
        </Button>
        <Text>Página {page}</Text>
        <Button onClick={() => setPage(p => p + 1)} disabled={sales.length < limit}>
          Próxima
        </Button>
      </HStack>
    </Box>
  )
}
