import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Heading, 
  SimpleGrid, 
  Text, 
  Badge, 
  Input, 
  HStack, 
  Button, 
  Spinner, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  TableContainer, 
  useToast,
  VStack,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react'
import { FiAlertTriangle, FiPackage, FiDollarSign } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import StockAlertBadge from '../components/StockAlertBadge'

export default function Inventory() {
  const auth = useAuth()
  const toast = useToast()
  
  const [levels, setLevels] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadLocations()
  }, [])

  useEffect(() => {
    loadInventory()
  }, [page, search, locationFilter, auth.csrfToken])

  async function loadLocations() {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get('/stock/locations?active=true', opts)
      setLocations(data || [])
    } catch (err) {
      console.error('Erro ao carregar locais:', err)
    }
  }

  async function loadInventory() {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const params = new URLSearchParams({
        page,
        limit,
        ...(locationFilter && { location_id: locationFilter })
      })
      
      const data = await api.get(`/stock/levels?${params.toString()}`, opts)
      
      // Apply search filter on frontend
      let items = data.items || []
      if (search) {
        const query = search.toLowerCase()
        items = items.filter(item =>
          item.product_name.toLowerCase().includes(query) ||
          item.product_sku.toLowerCase().includes(query) ||
          item.location_name.toLowerCase().includes(query)
        )
      }
      
      setLevels(items)
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Erro ao carregar inventário:', err)
      toast({ 
        title: 'Erro', 
        description: err.message, 
        status: 'error', 
        duration: 3000 
      })
    } finally {
      setLoading(false)
    }
  }

  function getStockStatus(level) {
    if (level.quantity <= 0) return { color: 'red', label: 'RUPTURA' }
    if (level.quantity < level.min_stock) return { color: 'orange', label: 'Baixo' }
    if (level.quantity > level.max_stock) return { color: 'blue', label: 'Alto' }
    return { color: 'green', label: 'OK' }
  }

  const totalItems = levels.length
  const totalValue = levels.reduce((sum, l) => sum + (l.quantity * (l.product_price || 0)), 0)
  const lowStock = levels.filter(l => l.quantity < l.min_stock).length
  const outOfStock = levels.filter(l => l.quantity <= 0).length

  return (
    <Box p={6} w="full">
      <VStack align="stretch" spacing={6}>
        <Heading>Inventário Geral</Heading>

        {/* KPIs */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel>Total de Itens</StatLabel>
            <StatNumber>{totalItems}</StatNumber>
            <StatHelpText>
              <FiPackage style={{ display: 'inline', marginRight: 4 }} />
              Em todos os locais
            </StatHelpText>
          </Stat>
          
          <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel>Valor em Estoque</StatLabel>
            <StatNumber fontSize="lg">R$ {totalValue.toFixed(2)}</StatNumber>
            <StatHelpText>
              <FiDollarSign style={{ display: 'inline', marginRight: 4 }} />
              Valorizado
            </StatHelpText>
          </Stat>
          
          <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel>Estoque Baixo</StatLabel>
            <StatNumber color="orange.500">{lowStock}</StatNumber>
            <StatHelpText>
              <FiAlertTriangle style={{ display: 'inline', marginRight: 4 }} />
              Abaixo do mínimo
            </StatHelpText>
          </Stat>
          
          <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel>Em Ruptura</StatLabel>
            <StatNumber color="red.500">{outOfStock}</StatNumber>
            <StatHelpText>
              <FiAlertTriangle style={{ display: 'inline', marginRight: 4 }} />
              Sem estoque
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Filtros */}
        <Box bg="white" p={4} borderRadius="lg" boxShadow="sm">
          <HStack spacing={3}>
            <Input
              placeholder="Buscar por produto, SKU ou local..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
            <Select
              placeholder="Todos os locais"
              value={locationFilter}
              onChange={(e) => { setLocationFilter(e.target.value); setPage(1) }}
              maxW="300px"
            >
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </Select>
            <Button onClick={loadInventory} colorScheme="blue">
              Atualizar
            </Button>
          </HStack>
        </Box>

        {/* Tabela de Estoque */}
        <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
          {loading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" />
            </Box>
          ) : levels.length === 0 ? (
            <Box textAlign="center" py={10}>
              <Text color="gray.500">Nenhum item encontrado</Text>
            </Box>
          ) : (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Produto</Th>
                    <Th>Local</Th>
                    <Th isNumeric>Qtd Atual</Th>
                    <Th isNumeric>Mínimo</Th>
                    <Th isNumeric>Máximo</Th>
                    <Th isNumeric>Valor Unit.</Th>
                    <Th isNumeric>Valor Total</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {levels.map((level) => {
                    const totalValue = level.quantity * (level.product_price || 0)
                    
                    return (
                      <Tr key={`${level.product_id}-${level.location_id}`}>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="medium">
                              {level.product_name}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {level.product_sku}
                            </Text>
                          </VStack>
                        </Td>
                        
                        <Td>
                          <Text fontSize="sm">{level.location_name}</Text>
                        </Td>
                        
                        <Td isNumeric>
                          <Text 
                            fontWeight="bold"
                            color={
                              level.quantity <= 0 ? 'red.500' :
                              level.quantity < level.min_stock ? 'orange.500' :
                              'green.600'
                            }
                          >
                            {level.quantity}
                          </Text>
                        </Td>
                        
                        <Td isNumeric>
                          <Text fontSize="sm" color="gray.600">{level.min_stock}</Text>
                        </Td>
                        
                        <Td isNumeric>
                          <Text fontSize="sm" color="gray.600">{level.max_stock}</Text>
                        </Td>
                        
                        <Td isNumeric>
                          <Text fontSize="sm">R$ {(level.product_price || 0).toFixed(2)}</Text>
                        </Td>
                        
                        <Td isNumeric>
                          <Text fontSize="sm" fontWeight="medium">
                            R$ {totalValue.toFixed(2)}
                          </Text>
                        </Td>
                        
                        <Td>
                          <StockAlertBadge level={level} />
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Paginação */}
        <HStack justify="space-between" align="center">
          <Text fontSize="sm" color="gray.600">
            Mostrando {levels.length} de {total} itens
          </Text>
          <HStack>
            <Button
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              isDisabled={page === 1}
            >
              Anterior
            </Button>
            <Badge colorScheme="blue" px={3} py={1}>
              Página {page}
            </Badge>
            <Button
              size="sm"
              onClick={() => setPage(p => p + 1)}
              isDisabled={levels.length < limit}
            >
              Próxima
            </Button>
          </HStack>
        </HStack>
      </VStack>
    </Box>
  )
}
