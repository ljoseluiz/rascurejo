import { useState, useEffect } from 'react'
import {
  Box,
  Heading,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  Spinner,
  Flex,
  Button,
  HStack,
  Select,
  Input,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast
} from '@chakra-ui/react'
import { FiDownload, FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function StockReports() {
  const auth = useAuth()
  const toast = useToast()
  
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState([])
  
  // Turnover report
  const [turnoverData, setTurnoverData] = useState([])
  const [turnoverFilters, setTurnoverFilters] = useState({
    start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    location_id: ''
  })
  
  // Top sellers report
  const [topSellersData, setTopSellersData] = useState([])
  const [topSellersFilters, setTopSellersFilters] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    location_id: '',
    limit: 10
  })
  
  // Slow movers report
  const [slowMoversData, setSlowMoversData] = useState([])
  const [slowMoversFilters, setSlowMoversFilters] = useState({
    days: 30,
    location_id: ''
  })
  
  // Profit margin report
  const [profitMarginData, setProfitMarginData] = useState([])
  
  // Stockout report
  const [stockoutData, setStockoutData] = useState([])
  const [stockoutFilters, setStockoutFilters] = useState({
    location_id: ''
  })
  
  // Audit report
  const [auditData, setAuditData] = useState([])
  const [auditSummary, setAuditSummary] = useState(null)
  const [auditFilters, setAuditFilters] = useState({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    location_id: ''
  })
  
  useEffect(() => {
    loadLocations()
  }, [])
  
  async function loadLocations() {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get('/stock/locations?active=true', opts)
      setLocations(data || [])
    } catch (err) {
      console.error('Erro ao carregar locais:', err)
    }
  }
  
  async function loadTurnoverReport() {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const params = new URLSearchParams(turnoverFilters)
      for (const [key, value] of [...params.entries()]) {
        if (!value) params.delete(key)
      }
      
      const data = await api.get(`/stock/reports/turnover?${params.toString()}`, opts)
      setTurnoverData(data.items || [])
    } catch (err) {
      console.error('Erro ao carregar relatório de giro:', err)
      toast({
        title: 'Erro ao carregar relatório',
        description: err.message,
        status: 'error',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }
  
  async function loadTopSellersReport() {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const params = new URLSearchParams(topSellersFilters)
      for (const [key, value] of [...params.entries()]) {
        if (!value) params.delete(key)
      }
      
      const data = await api.get(`/stock/reports/top-sellers?${params.toString()}`, opts)
      setTopSellersData(data.items || [])
    } catch (err) {
      console.error('Erro ao carregar mais vendidos:', err)
      toast({
        title: 'Erro ao carregar relatório',
        description: err.message,
        status: 'error',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }
  
  async function loadSlowMoversReport() {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const params = new URLSearchParams(slowMoversFilters)
      for (const [key, value] of [...params.entries()]) {
        if (!value) params.delete(key)
      }
      
      const data = await api.get(`/stock/reports/slow-movers?${params.toString()}`, opts)
      setSlowMoversData(data.items || [])
    } catch (err) {
      console.error('Erro ao carregar produtos parados:', err)
      toast({
        title: 'Erro ao carregar relatório',
        description: err.message,
        status: 'error',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }
  
  async function loadProfitMarginReport() {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get('/stock/reports/profit-margin', opts)
      setProfitMarginData(data.items || [])
    } catch (err) {
      console.error('Erro ao carregar margem de lucro:', err)
      toast({
        title: 'Erro ao carregar relatório',
        description: err.message,
        status: 'error',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }
  
  async function loadStockoutReport() {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const params = new URLSearchParams(stockoutFilters)
      for (const [key, value] of [...params.entries()]) {
        if (!value) params.delete(key)
      }
      
      const data = await api.get(`/stock/reports/stockout?${params.toString()}`, opts)
      setStockoutData(data.items || [])
    } catch (err) {
      console.error('Erro ao carregar ruptura de estoque:', err)
      toast({
        title: 'Erro ao carregar relatório',
        description: err.message,
        status: 'error',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }
  
  async function loadAuditReport() {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const params = new URLSearchParams(auditFilters)
      for (const [key, value] of [...params.entries()]) {
        if (!value) params.delete(key)
      }
      
      const data = await api.get(`/stock/reports/audit?${params.toString()}`, opts)
      setAuditData(data.items || [])
      setAuditSummary(data.summary || null)
    } catch (err) {
      console.error('Erro ao carregar auditoria:', err)
      toast({
        title: 'Erro ao carregar relatório',
        description: err.message,
        status: 'error',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }
  
  function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        status: 'warning',
        duration: 3000
      })
      return
    }
    
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(',')).join('\n')
    const csv = `${headers}\n${rows}`
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: 'Relatório exportado',
      status: 'success',
      duration: 3000
    })
  }
  
  return (
    <Box w="full" p={6}>
      <VStack align="stretch" spacing={6}>
        <Heading size="lg">Relatórios de Estoque</Heading>
        
        <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
          <Tabs colorScheme="blue">
            <TabList>
              <Tab onClick={loadTurnoverReport}>Giro de Estoque</Tab>
              <Tab onClick={loadTopSellersReport}>Mais Vendidos</Tab>
              <Tab onClick={loadSlowMoversReport}>Produtos Parados</Tab>
              <Tab onClick={loadProfitMarginReport}>Margem de Lucro</Tab>
              <Tab onClick={loadStockoutReport}>Ruptura</Tab>
              <Tab onClick={loadAuditReport}>Auditoria</Tab>
            </TabList>
            
            <TabPanels>
              {/* Turnover Report */}
              <TabPanel>
                <VStack align="stretch" spacing={4}>
                  <HStack>
                    <Input
                      type="date"
                      value={turnoverFilters.start_date}
                      onChange={(e) => setTurnoverFilters(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                    <Text>até</Text>
                    <Input
                      type="date"
                      value={turnoverFilters.end_date}
                      onChange={(e) => setTurnoverFilters(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                    <Select
                      placeholder="Local"
                      value={turnoverFilters.location_id}
                      onChange={(e) => setTurnoverFilters(prev => ({ ...prev, location_id: e.target.value }))}
                    >
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </Select>
                    <Button onClick={loadTurnoverReport} colorScheme="blue" size="md" minW="100px">
                      Filtrar
                    </Button>
                    <Button
                      leftIcon={<FiDownload />}
                      onClick={() => exportToCSV(turnoverData, 'giro_estoque')}
                      colorScheme="green"
                      size="md"
                      minW="120px"
                    >
                      Exportar CSV
                    </Button>
                  </HStack>
                  
                  {loading ? (
                    <Flex justify="center" p={10}>
                      <Spinner size="xl" />
                    </Flex>
                  ) : turnoverData.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={10}>
                      Nenhum dado encontrado
                    </Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table size="sm">
                        <Thead bg="gray.50">
                          <Tr>
                            <Th>Produto</Th>
                            <Th isNumeric>Vendido</Th>
                            <Th isNumeric>Estoque Médio</Th>
                            <Th isNumeric>Giro</Th>
                            <Th isNumeric>Dias</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {turnoverData.map((item, i) => (
                            <Tr key={i}>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="medium">{item.product_name}</Text>
                                  <Text fontSize="xs" color="gray.500">{item.product_sku}</Text>
                                </VStack>
                              </Td>
                              <Td isNumeric>{item.total_sold}</Td>
                              <Td isNumeric>{item.average_stock.toFixed(0)}</Td>
                              <Td isNumeric>
                                <Badge colorScheme={parseFloat(item.turnover_rate) > 1 ? 'green' : 'orange'}>
                                  {item.turnover_rate}x
                                </Badge>
                              </Td>
                              <Td isNumeric>{item.days_in_period}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </VStack>
              </TabPanel>
              
              {/* Top Sellers Report */}
              <TabPanel>
                <VStack align="stretch" spacing={4}>
                  <HStack>
                    <Input
                      type="date"
                      value={topSellersFilters.start_date}
                      onChange={(e) => setTopSellersFilters(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                    <Text>até</Text>
                    <Input
                      type="date"
                      value={topSellersFilters.end_date}
                      onChange={(e) => setTopSellersFilters(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                    <Select
                      placeholder="Local"
                      value={topSellersFilters.location_id}
                      onChange={(e) => setTopSellersFilters(prev => ({ ...prev, location_id: e.target.value }))}
                    >
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </Select>
                    <Button onClick={loadTopSellersReport} colorScheme="blue" size="md" minW="100px">
                      Filtrar
                    </Button>
                    <Button
                      leftIcon={<FiDownload />}
                      onClick={() => exportToCSV(topSellersData, 'mais_vendidos')}
                      colorScheme="green"
                      size="md"
                      minW="120px"
                    >
                      Exportar CSV
                    </Button>
                  </HStack>
                  
                  {loading ? (
                    <Flex justify="center" p={10}>
                      <Spinner size="xl" />
                    </Flex>
                  ) : topSellersData.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={10}>
                      Nenhum dado encontrado
                    </Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table size="sm">
                        <Thead bg="gray.50">
                          <Tr>
                            <Th>#</Th>
                            <Th>Produto</Th>
                            <Th>Categoria</Th>
                            <Th isNumeric>Qtd Vendida</Th>
                            <Th isNumeric>Receita</Th>
                            <Th isNumeric>Lucro</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {topSellersData.map((item, i) => (
                            <Tr key={i}>
                              <Td>
                                <Badge colorScheme="blue" fontSize="xs">#{i + 1}</Badge>
                              </Td>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="medium">{item.product_name}</Text>
                                  <Text fontSize="xs" color="gray.500">{item.product_sku}</Text>
                                </VStack>
                              </Td>
                              <Td><Text fontSize="sm">{item.category}</Text></Td>
                              <Td isNumeric>
                                <Text fontSize="sm" fontWeight="bold" color="blue.600">
                                  {item.quantity_sold}
                                </Text>
                              </Td>
                              <Td isNumeric>
                                <Text fontSize="sm" color="green.600">
                                  R$ {item.revenue.toFixed(2)}
                                </Text>
                              </Td>
                              <Td isNumeric>
                                <Text fontSize="sm" fontWeight="medium">
                                  R$ {item.profit.toFixed(2)}
                                </Text>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </VStack>
              </TabPanel>
              
              {/* Slow Movers Report */}
              <TabPanel>
                <VStack align="stretch" spacing={4}>
                  <HStack>
                    <Select
                      value={slowMoversFilters.days}
                      onChange={(e) => setSlowMoversFilters(prev => ({ ...prev, days: e.target.value }))}
                    >
                      <option value="30">Últimos 30 dias</option>
                      <option value="60">Últimos 60 dias</option>
                      <option value="90">Últimos 90 dias</option>
                      <option value="180">Últimos 180 dias</option>
                    </Select>
                    <Select
                      placeholder="Local"
                      value={slowMoversFilters.location_id}
                      onChange={(e) => setSlowMoversFilters(prev => ({ ...prev, location_id: e.target.value }))}
                    >
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </Select>
                    <Button onClick={loadSlowMoversReport} colorScheme="blue" size="md" minW="100px">
                      Filtrar
                    </Button>
                    <Button
                      leftIcon={<FiDownload />}
                      onClick={() => exportToCSV(slowMoversData, 'produtos_parados')}
                      colorScheme="green"
                      size="md"
                      minW="120px"
                    >
                      Exportar CSV
                    </Button>
                  </HStack>
                  
                  {loading ? (
                    <Flex justify="center" p={10}>
                      <Spinner size="xl" />
                    </Flex>
                  ) : slowMoversData.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={10}>
                      Nenhum produto parado encontrado
                    </Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table size="sm">
                        <Thead bg="gray.50">
                          <Tr>
                            <Th>Produto</Th>
                            <Th>Local</Th>
                            <Th isNumeric>Qtd</Th>
                            <Th isNumeric>Valor Custo</Th>
                            <Th isNumeric>Valor Venda</Th>
                            <Th isNumeric>Dias Parado</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {slowMoversData.map((item, i) => (
                            <Tr key={i}>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="medium">{item.product_name}</Text>
                                  <Text fontSize="xs" color="gray.500">{item.product_sku}</Text>
                                </VStack>
                              </Td>
                              <Td><Text fontSize="sm">{item.location_name}</Text></Td>
                              <Td isNumeric>{item.quantity}</Td>
                              <Td isNumeric>R$ {item.value_at_cost.toFixed(2)}</Td>
                              <Td isNumeric>R$ {item.value_at_sale.toFixed(2)}</Td>
                              <Td isNumeric>
                                <Badge colorScheme={item.days_without_movement > 90 ? 'red' : 'orange'}>
                                  {item.days_without_movement} dias
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </VStack>
              </TabPanel>
              
              {/* Profit Margin Report */}
              <TabPanel>
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between">
                    <Heading size="md">Margem de Lucro por Produto</Heading>
                    <Button
                      leftIcon={<FiDownload />}
                      onClick={() => exportToCSV(profitMarginData, 'margem_lucro')}
                      colorScheme="green"
                      size="md"
                      minW="120px"
                    >
                      Exportar CSV
                    </Button>
                  </HStack>
                  
                  {loading ? (
                    <Flex justify="center" p={10}>
                      <Spinner size="xl" />
                    </Flex>
                  ) : profitMarginData.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={10}>
                      Nenhum dado encontrado
                    </Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table size="sm">
                        <Thead bg="gray.50">
                          <Tr>
                            <Th>Produto</Th>
                            <Th>Categoria</Th>
                            <Th isNumeric>Preço Venda</Th>
                            <Th isNumeric>Preço Custo</Th>
                            <Th isNumeric>Lucro Unit.</Th>
                            <Th isNumeric>Margem %</Th>
                            <Th isNumeric>Estoque</Th>
                            <Th isNumeric>Lucro Potencial</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {profitMarginData.map((item, i) => (
                            <Tr key={i}>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="medium">{item.product_name}</Text>
                                  <Text fontSize="xs" color="gray.500">{item.product_sku}</Text>
                                </VStack>
                              </Td>
                              <Td><Text fontSize="sm">{item.category}</Text></Td>
                              <Td isNumeric>R$ {item.sale_price.toFixed(2)}</Td>
                              <Td isNumeric>R$ {item.cost_price.toFixed(2)}</Td>
                              <Td isNumeric>
                                <Text color={item.profit_per_unit > 0 ? 'green.600' : 'red.600'}>
                                  R$ {item.profit_per_unit.toFixed(2)}
                                </Text>
                              </Td>
                              <Td isNumeric>
                                <Badge colorScheme={item.margin_percent > 30 ? 'green' : item.margin_percent > 15 ? 'yellow' : 'red'}>
                                  {item.margin_percent}%
                                </Badge>
                              </Td>
                              <Td isNumeric>{item.current_stock}</Td>
                              <Td isNumeric>
                                <Text fontWeight="bold" color="green.600">
                                  R$ {item.potential_profit.toFixed(2)}
                                </Text>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </VStack>
              </TabPanel>
              
              {/* Stockout Report */}
              <TabPanel>
                <VStack align="stretch" spacing={4}>
                  <HStack>
                    <Select
                      placeholder="Local"
                      value={stockoutFilters.location_id}
                      onChange={(e) => setStockoutFilters(prev => ({ ...prev, location_id: e.target.value }))}
                    >
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </Select>
                    <Button onClick={loadStockoutReport} colorScheme="blue" size="md" minW="100px">
                      Filtrar
                    </Button>
                    <Button
                      leftIcon={<FiDownload />}
                      onClick={() => exportToCSV(stockoutData, 'produtos_ruptura')}
                      colorScheme="green"
                      size="md"
                      minW="120px"
                    >
                      Exportar CSV
                    </Button>
                  </HStack>
                  
                  {loading ? (
                    <Flex justify="center" p={10}>
                      <Spinner size="xl" />
                    </Flex>
                  ) : stockoutData.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={10}>
                      Nenhum produto crítico encontrado
                    </Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table size="sm">
                        <Thead bg="gray.50">
                          <Tr>
                            <Th>Produto</Th>
                            <Th>Local</Th>
                            <Th isNumeric>Qtd Atual</Th>
                            <Th isNumeric>Mínimo</Th>
                            <Th>Status</Th>
                            <Th isNumeric>Reposição</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {stockoutData.map((item, i) => (
                            <Tr key={i}>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="medium">{item.product_name}</Text>
                                  <Text fontSize="xs" color="gray.500">{item.product_sku}</Text>
                                </VStack>
                              </Td>
                              <Td><Text fontSize="sm">{item.location_name}</Text></Td>
                              <Td isNumeric>
                                <Text fontWeight="bold" color={item.current_quantity <= 0 ? 'red.500' : 'orange.500'}>
                                  {item.current_quantity}
                                </Text>
                              </Td>
                              <Td isNumeric>{item.min_stock}</Td>
                              <Td>
                                <Badge colorScheme={item.status === 'out_of_stock' ? 'red' : 'orange'}>
                                  {item.status === 'out_of_stock' ? 'RUPTURA' : 'Baixo'}
                                </Badge>
                              </Td>
                              <Td isNumeric>
                                <Text fontWeight="medium">
                                  {item.reorder_quantity}
                                </Text>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </VStack>
              </TabPanel>
              
              {/* Audit Report */}
              <TabPanel>
                <VStack align="stretch" spacing={4}>
                  <HStack>
                    <Input
                      type="date"
                      value={auditFilters.start_date}
                      onChange={(e) => setAuditFilters(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                    <Text>até</Text>
                    <Input
                      type="date"
                      value={auditFilters.end_date}
                      onChange={(e) => setAuditFilters(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                    <Select
                      placeholder="Local"
                      value={auditFilters.location_id}
                      onChange={(e) => setAuditFilters(prev => ({ ...prev, location_id: e.target.value }))}
                    >
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </Select>
                    <Button onClick={loadAuditReport} colorScheme="blue" size="md" minW="100px">
                      Filtrar
                    </Button>
                    <Button
                      leftIcon={<FiDownload />}
                      onClick={() => exportToCSV(auditData, 'auditoria_estoque')}
                      colorScheme="green"
                      size="md"
                      minW="120px"
                    >
                      Exportar CSV
                    </Button>
                  </HStack>
                  
                  {auditSummary && (
                    <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4}>
                      <Stat bg="gray.50" p={3} borderRadius="md">
                        <StatLabel fontSize="xs">Total Movim.</StatLabel>
                        <StatNumber fontSize="lg">{auditSummary.total_movements}</StatNumber>
                      </Stat>
                      <Stat bg="green.50" p={3} borderRadius="md">
                        <StatLabel fontSize="xs">Entradas</StatLabel>
                        <StatNumber fontSize="lg" color="green.600">+{auditSummary.total_in}</StatNumber>
                      </Stat>
                      <Stat bg="red.50" p={3} borderRadius="md">
                        <StatLabel fontSize="xs">Saídas</StatLabel>
                        <StatNumber fontSize="lg" color="red.600">-{auditSummary.total_out}</StatNumber>
                      </Stat>
                      <Stat bg="blue.50" p={3} borderRadius="md">
                        <StatLabel fontSize="xs">Valor Entrada</StatLabel>
                        <StatNumber fontSize="lg" color="blue.600">R$ {auditSummary.total_value_in.toFixed(2)}</StatNumber>
                      </Stat>
                      <Stat bg="orange.50" p={3} borderRadius="md">
                        <StatLabel fontSize="xs">Valor Saída</StatLabel>
                        <StatNumber fontSize="lg" color="orange.600">R$ {auditSummary.total_value_out.toFixed(2)}</StatNumber>
                      </Stat>
                    </Grid>
                  )}
                  
                  {loading ? (
                    <Flex justify="center" p={10}>
                      <Spinner size="xl" />
                    </Flex>
                  ) : auditData.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={10}>
                      Nenhuma movimentação encontrada
                    </Text>
                  ) : (
                    <Box overflowX="auto" maxH="500px" overflowY="auto">
                      <Table size="sm">
                        <Thead bg="gray.50" position="sticky" top={0}>
                          <Tr>
                            <Th>Data</Th>
                            <Th>Produto</Th>
                            <Th>Local</Th>
                            <Th>Tipo</Th>
                            <Th isNumeric>Qtd</Th>
                            <Th isNumeric>Valor</Th>
                            <Th>Documento</Th>
                            <Th>Usuário</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {auditData.map((item, i) => (
                            <Tr key={i}>
                              <Td>
                                <Text fontSize="xs">
                                  {new Date(item.created_at).toLocaleString('pt-BR')}
                                </Text>
                              </Td>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="xs" fontWeight="medium">{item.product_name}</Text>
                                  <Text fontSize="xs" color="gray.500">{item.product_sku}</Text>
                                </VStack>
                              </Td>
                              <Td><Text fontSize="xs">{item.location_name}</Text></Td>
                              <Td>
                                <Badge colorScheme={item.type === 'in' ? 'green' : 'red'} fontSize="xs">
                                  {item.direction}
                                </Badge>
                              </Td>
                              <Td isNumeric>
                                <Text fontSize="xs" fontWeight="bold">
                                  {item.type === 'in' ? '+' : '-'}{item.quantity}
                                </Text>
                              </Td>
                              <Td isNumeric>
                                <Text fontSize="xs">R$ {item.total_cost.toFixed(2)}</Text>
                              </Td>
                              <Td><Text fontSize="xs">{item.reference_doc || '-'}</Text></Td>
                              <Td><Text fontSize="xs">{item.created_by}</Text></Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </VStack>
    </Box>
  )
}
