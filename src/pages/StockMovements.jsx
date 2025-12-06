import { useState, useEffect } from 'react'
import {
  Box,
  Heading,
  HStack,
  VStack,
  Button,
  Input,
  Select,
  Flex,
  Text,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useDisclosure,
  InputGroup,
  InputLeftElement,
  Spinner,
  Badge
} from '@chakra-ui/react'
import { FiPlus, FiSearch, FiTrendingUp, FiTrendingDown, FiPackage } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import StockMovementForm from '../components/StockMovementForm'
import StockMovementTable from '../components/StockMovementTable'

export default function StockMovements() {
  const auth = useAuth()
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const [loading, setLoading] = useState(true)
  const [movements, setMovements] = useState([])
  const [stats, setStats] = useState({ totalIn: 0, totalOut: 0, totalMovements: 0, netChange: 0 })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  
  const [filters, setFilters] = useState({
    q: '',
    type: '',
    location_id: '',
    product_id: '',
    start_date: '',
    end_date: ''
  })
  
  const [locations, setLocations] = useState([])
  const [products, setProducts] = useState([])
  
  useEffect(() => {
    loadLocations()
    loadProducts()
  }, [])
  
  useEffect(() => {
    loadMovements()
  }, [auth.csrfToken, pagination.page, filters])
  
  async function loadLocations() {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get('/stock/locations?active=true', opts)
      setLocations(data || [])
    } catch (err) {
      console.error('Erro ao carregar locais:', err)
    }
  }
  
  async function loadProducts() {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get('/products?limit=1000', opts)
      setProducts(data.items || [])
    } catch (err) {
      console.error('Erro ao carregar produtos:', err)
    }
  }
  
  async function loadMovements() {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      })
      
      // Remove empty filters
      for (const [key, value] of [...params.entries()]) {
        if (!value) params.delete(key)
      }
      
      const data = await api.get(`/stock/movements?${params.toString()}`, opts)
      
      setMovements(data.items || [])
      setPagination(prev => ({ ...prev, total: data.total || 0 }))
      
      // Calculate stats
      const totalIn = (data.items || [])
        .filter(m => m.type === 'in')
        .reduce((sum, m) => sum + m.quantity, 0)
      
      const totalOut = (data.items || [])
        .filter(m => m.type === 'out')
        .reduce((sum, m) => sum + m.quantity, 0)
      
      setStats({
        totalIn,
        totalOut,
        totalMovements: data.total || 0,
        netChange: totalIn - totalOut
      })
      
    } catch (err) {
      console.error('Erro ao carregar movimentações:', err)
    } finally {
      setLoading(false)
    }
  }
  
  function handleFilterChange(field, value) {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }
  
  function handleSuccess() {
    loadMovements()
  }
  
  function nextPage() {
    const maxPage = Math.ceil(pagination.total / pagination.limit)
    if (pagination.page < maxPage) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
    }
  }
  
  function prevPage() {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }))
    }
  }
  
  return (
    <Box w="full" p={6}>
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Heading size="lg">Movimentações de Estoque</Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={onOpen}
          >
            Nova Movimentação
          </Button>
        </Flex>
        
        {/* Stats */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel>Total de Movimentações</StatLabel>
            <StatNumber>{stats.totalMovements}</StatNumber>
            <StatHelpText>
              <FiPackage style={{ display: 'inline', marginRight: 4 }} />
              Todas as operações
            </StatHelpText>
          </Stat>
          
          <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel>Total de Entradas</StatLabel>
            <StatNumber color="green.500">+{stats.totalIn}</StatNumber>
            <StatHelpText>
              <FiTrendingUp style={{ display: 'inline', marginRight: 4 }} />
              Unidades adicionadas
            </StatHelpText>
          </Stat>
          
          <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel>Total de Saídas</StatLabel>
            <StatNumber color="red.500">-{stats.totalOut}</StatNumber>
            <StatHelpText>
              <FiTrendingDown style={{ display: 'inline', marginRight: 4 }} />
              Unidades removidas
            </StatHelpText>
          </Stat>
          
          <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel>Saldo Líquido</StatLabel>
            <StatNumber color={stats.netChange >= 0 ? 'green.500' : 'red.500'}>
              {stats.netChange >= 0 ? '+' : ''}{stats.netChange}
            </StatNumber>
            <StatHelpText>Diferença entrada/saída</StatHelpText>
          </Stat>
        </Grid>
        
        {/* Filters */}
        <Box bg="white" p={4} borderRadius="lg" boxShadow="sm">
          <VStack spacing={4} align="stretch">
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray" />
                </InputLeftElement>
                <Input
                  placeholder="Buscar por produto, local, documento..."
                  value={filters.q}
                  onChange={(e) => handleFilterChange('q', e.target.value)}
                />
              </InputGroup>
              
              <Select
                placeholder="Tipo"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="in">Entrada</option>
                <option value="out">Saída</option>
              </Select>
              
              <Select
                placeholder="Local"
                value={filters.location_id}
                onChange={(e) => handleFilterChange('location_id', e.target.value)}
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </Select>
              
              <Select
                placeholder="Produto"
                value={filters.product_id}
                onChange={(e) => handleFilterChange('product_id', e.target.value)}
              >
                {products.slice(0, 50).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </Grid>
            
            <HStack>
              <Input
                type="date"
                placeholder="Data inicial"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
              <Text>até</Text>
              <Input
                type="date"
                placeholder="Data final"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </HStack>
          </VStack>
        </Box>
        
        {/* Table */}
        <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
          {loading ? (
            <Flex justify="center" align="center" p={10}>
              <Spinner size="xl" />
            </Flex>
          ) : (
            <StockMovementTable movements={movements} loading={loading} />
          )}
        </Box>
        
        {/* Pagination */}
        <Flex justify="space-between" align="center">
          <Text fontSize="sm" color="gray.600">
            Mostrando {movements.length} de {pagination.total} movimentações
          </Text>
          <HStack>
            <Button
              size="sm"
              onClick={prevPage}
              isDisabled={pagination.page === 1}
            >
              Anterior
            </Button>
            <Badge colorScheme="blue" px={3} py={1}>
              Página {pagination.page}
            </Badge>
            <Button
              size="sm"
              onClick={nextPage}
              isDisabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            >
              Próxima
            </Button>
          </HStack>
        </Flex>
      </VStack>
      
      <StockMovementForm
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={handleSuccess}
      />
    </Box>
  )
}
