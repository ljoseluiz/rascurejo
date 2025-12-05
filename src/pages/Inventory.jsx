import React, { useState, useEffect } from 'react'
import { Box, Heading, SimpleGrid, Text, Badge, Input, HStack, Button, Spinner, Table, Thead, Tbody, Tr, Th, Td, TableContainer, useToast } from '@chakra-ui/react'
import api from '../services/api'

export default function Inventory() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  useEffect(() => {
    loadInventory()
  }, [page, search])

  async function loadInventory() {
    setLoading(true)
    try {
      const response = await api.get(`/inventory?q=${encodeURIComponent(search)}&page=${page}&limit=${limit}`)
      setItems(response.items || [])
    } catch (err) {
      toast({ title: 'Erro', description: err.message, status: 'error', duration: 3000, isClosable: true })
    } finally {
      setLoading(false)
    }
  }

  function getStockStatus(stock) {
    if (stock === 0) return { color: 'red', label: 'Esgotado' }
    if (stock < 10) return { color: 'orange', label: 'Baixo' }
    if (stock < 50) return { color: 'yellow', label: 'Médio' }
    return { color: 'green', label: 'OK' }
  }

  const totalItems = items.length
  const totalValue = items.reduce((sum, item) => sum + (item.stock * (item.price || 0)), 0)
  const lowStock = items.filter(item => item.stock < 10).length

  return (
    <Box p={6}>
      <Heading mb={6}>Gestão de Estoque</Heading>

      {/* KPIs */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Text fontSize="sm" color="gray.600">Total de Itens</Text>
          <Text fontSize="2xl" fontWeight="bold">{totalItems}</Text>
        </Box>
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Text fontSize="sm" color="gray.600">Valor em Estoque</Text>
          <Text fontSize="2xl" fontWeight="bold">R$ {totalValue.toFixed(2)}</Text>
        </Box>
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Text fontSize="sm" color="gray.600">Estoque Baixo</Text>
          <Text fontSize="2xl" fontWeight="bold" color="orange.500">{lowStock}</Text>
        </Box>
      </SimpleGrid>

      {/* Busca */}
      <HStack spacing={3} mb={4}>
        <Input
          placeholder="Buscar por SKU ou produto..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        <Button onClick={loadInventory} colorScheme="blue">Buscar</Button>
      </HStack>

      {/* Tabela de Estoque */}
      {loading ? (
        <Spinner />
      ) : (
        <TableContainer bg="white" borderRadius="md" boxShadow="sm">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>SKU</Th>
                <Th>Produto</Th>
                <Th isNumeric>Estoque</Th>
                <Th isNumeric>Preço Unit.</Th>
                <Th isNumeric>Valor Total</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((item) => {
                const status = getStockStatus(item.stock)
                const totalValue = item.stock * (item.price || 0)
                return (
                  <Tr key={item.id}>
                    <Td>{item.id}</Td>
                    <Td><Badge>{item.sku}</Badge></Td>
                    <Td>{item.name || 'N/A'}</Td>
                    <Td isNumeric fontWeight="bold">{item.stock}</Td>
                    <Td isNumeric>R$ {(item.price || 0).toFixed(2)}</Td>
                    <Td isNumeric>R$ {totalValue.toFixed(2)}</Td>
                    <Td>
                      <Badge colorScheme={status.color}>{status.label}</Badge>
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
        <Button onClick={() => setPage(p => p + 1)} disabled={items.length < limit}>
          Próxima
        </Button>
      </HStack>
    </Box>
  )
}
