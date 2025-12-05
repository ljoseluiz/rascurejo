import React, { useEffect, useState } from 'react'
import { Box, Button, Input, HStack, Heading, Table, Thead, Tbody, Tr, Th, Td, useToast, VStack, Text } from '@chakra-ui/react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Reports() {
  const auth = useAuth()
  const toast = useToast()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

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

  return (
    <Box>
      <Heading mb={6}>Relatórios de Vendas</Heading>

      {/* Filter controls */}
      <Box bg="white" p={4} borderRadius="md" boxShadow="sm" mb={6}>
        <VStack spacing={3} align="stretch">
          <HStack spacing={3}>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="Data Inicial" />
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="Data Final" />
            <Button onClick={loadReport} colorScheme="blue" isLoading={loading}>Gerar</Button>
            <Button onClick={exportCSV} colorScheme="green">Exportar CSV</Button>
          </HStack>
        </VStack>
      </Box>

      {/* Sales table */}
      {sales.length > 0 ? (
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
