import React, { useEffect, useState } from 'react'
import { Box, Button, Input, HStack, Heading, Table, Thead, Tbody, Tr, Th, Td, useToast, VStack, Text, SimpleGrid, Spinner, Grid } from '@chakra-ui/react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { generateReportPdf } from '../utils/reportPdf'

export default function Reports() {
  const auth = useAuth()
  const toast = useToast()
  const [sales, setSales] = useState([])
  const [inventory, setInventory] = useState([])
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingAll, setLoadingAll] = useState(true)
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    async function bootstrap() {
      setLoadingAll(true)
      await Promise.all([loadReport(), loadInventory(), loadProducts(), loadStats()])
      setLoadingAll(false)
    }
    bootstrap()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.csrfToken])

  async function loadReport() {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get(`/reports/sales?startDate=${startDate}&endDate=${endDate}`, opts)
      setSales(data.sales || [])
    } catch (err) {
      toast({ title: 'Erro', description: err.message, status: 'error', duration: 3000, isClosable: true })
    } finally {
      setLoading(false)
    }
  }

  async function loadInventory() {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get('/inventory?limit=100', opts)
      setInventory(data.items || [])
    } catch (err) {
      toast({ title: 'Erro ao carregar estoque', description: err.message, status: 'error', duration: 3000, isClosable: true })
    }
  }

  async function loadProducts() {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get('/products?limit=100', opts)
      setProducts(data.items || [])
    } catch (err) {
      toast({ title: 'Erro ao carregar produtos', description: err.message, status: 'error', duration: 3000, isClosable: true })
    }
  }

  async function loadStats() {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get('/stats', opts)
      setStats(data || {})
    } catch (err) {
      toast({ title: 'Erro ao carregar estatísticas', description: err.message, status: 'error', duration: 3000, isClosable: true })
    }
  }

  function exportCSV() {
    if (!sales.length) {
      toast({ title: 'Sem dados', description: 'Nenhuma venda para exportar', status: 'warning', duration: 3000, isClosable: true })
      return
    }

    const headers = ['ID', 'Data', 'Produto', 'Quantidade', 'Preço Unitário', 'Total']
    const rows = sales.map(s => [s.id, s.date, s.product, s.quantity, s.unitPrice, s.total])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_vendas_${startDate}_${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({ title: 'Exportado', description: 'Relatório exportado com sucesso', status: 'success', duration: 2000, isClosable: true })
  }

  function printPdf(type) {
    const dateRange = `${startDate} a ${endDate}`
    generateReportPdf({
      type,
      dateRange,
      sales,
      inventory,
      products,
      stats: stats || {}
    })
  }

  return (
    <Box p={6} w="full">
      <Heading mb={6}>Relatórios de Vendas</Heading>

      {/* Filter controls */}
      <Box bg="white" p={4} borderRadius="md" boxShadow="sm" mb={6}>
        <VStack spacing={3} align="stretch">
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr) auto auto' }} gap={3}>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="Data Inicial" />
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="Data Final" />
            <Button onClick={loadReport} colorScheme="blue" isLoading={loading} minW="120px">Gerar</Button>
            <Button onClick={exportCSV} colorScheme="green" minW="140px">Exportar CSV</Button>
          </Grid>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={3}>
            <Button colorScheme="blue" variant="outline" onClick={() => printPdf('sales')} isDisabled={!sales.length}>PDF Vendas</Button>
            <Button colorScheme="teal" variant="outline" onClick={() => printPdf('inventory')} isDisabled={!inventory.length}>PDF Estoque</Button>
            <Button colorScheme="purple" variant="outline" onClick={() => printPdf('products')} isDisabled={!products.length}>PDF Produtos</Button>
            <Button colorScheme="orange" variant="solid" onClick={() => printPdf('overview')} isDisabled={!stats}>PDF Executivo</Button>
          </SimpleGrid>
        </VStack>
      </Box>

      {/* Sales table */}
      {loadingAll ? (
        <HStack spacing={3}>
          <Spinner />
          <Text>Carregando dados...</Text>
        </HStack>
      ) : sales.length > 0 ? (
        <Box bg="white" borderRadius="md" boxShadow="sm" overflowX="auto">
          <Table>
            <Thead>
              <Tr bg="gray.50">
                <Th>ID</Th>
                <Th>Data</Th>
                <Th>Produto</Th>
                <Th isNumeric>Quantidade</Th>
                <Th isNumeric>Preço Unitário</Th>
                <Th isNumeric>Total</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sales.map(sale => (
                <Tr key={sale.id}>
                  <Td>{sale.id}</Td>
                  <Td>{sale.date}</Td>
                  <Td>{sale.product}</Td>
                  <Td isNumeric>{sale.quantity}</Td>
                  <Td isNumeric>R$ {sale.unitPrice.toFixed(2)}</Td>
                  <Td isNumeric>R$ {sale.total.toFixed(2)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      ) : (
        <Text>Nenhuma venda encontrada para o período.</Text>
      )}
    </Box>
  )
}
