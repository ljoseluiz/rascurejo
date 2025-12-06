import { useState, useEffect } from 'react'
import {
  Box,
  Heading,
  VStack,
  Input,
  Select,
  Flex,
  Text,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  InputGroup,
  InputLeftElement,
  Spinner,
  HStack,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { FiSearch, FiAlertTriangle, FiEdit2, FiPackage, FiTrendingDown } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import StockAlertBadge from '../components/StockAlertBadge'

export default function StockLevels() {
  const auth = useAuth()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const [loading, setLoading] = useState(true)
  const [levels, setLevels] = useState([])
  const [stats, setStats] = useState({ total: 0, lowStock: 0, outOfStock: 0, totalValue: 0 })
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 })
  
  const [filters, setFilters] = useState({
    q: '',
    alert_type: '',
    location_id: ''
  })
  
  const [locations, setLocations] = useState([])
  const [editingLevel, setEditingLevel] = useState(null)
  const [thresholds, setThresholds] = useState({ min_stock: 0, max_stock: 0 })
  
  useEffect(() => {
    loadLocations()
  }, [])
  
  useEffect(() => {
    loadLevels()
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
  
  async function loadLevels() {
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
      
      const data = await api.get(`/stock/levels?${params.toString()}`, opts)
      
      // Apply search filter on frontend if provided
      let items = data.items || []
      if (filters.q) {
        const query = filters.q.toLowerCase()
        items = items.filter(item =>
          item.product_name.toLowerCase().includes(query) ||
          item.product_sku.toLowerCase().includes(query) ||
          item.location_name.toLowerCase().includes(query)
        )
      }
      
      setLevels(items)
      setPagination(prev => ({ ...prev, total: data.total || 0 }))
      
      // Calculate stats
      const lowStock = items.filter(l => l.quantity < l.min_stock && l.quantity > 0).length
      const outOfStock = items.filter(l => l.quantity <= 0).length
      const totalValue = items.reduce((sum, l) => sum + (l.quantity * l.product_price), 0)
      
      setStats({
        total: items.length,
        lowStock,
        outOfStock,
        totalValue
      })
      
    } catch (err) {
      console.error('Erro ao carregar níveis:', err)
    } finally {
      setLoading(false)
    }
  }
  
  function handleFilterChange(field, value) {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }
  
  function openEditModal(level) {
    setEditingLevel(level)
    setThresholds({
      min_stock: level.min_stock,
      max_stock: level.max_stock
    })
    onOpen()
  }
  
  async function handleUpdateThresholds() {
    if (!editingLevel) return
    
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      await api.put(
        `/stock/levels/${editingLevel.product_id}/${editingLevel.location_id}`,
        thresholds,
        opts
      )
      
      toast({
        title: 'Limites atualizados',
        status: 'success',
        duration: 3000
      })
      
      onClose()
      loadLevels()
    } catch (err) {
      console.error('Erro ao atualizar limites:', err)
      toast({
        title: 'Erro ao atualizar',
        description: err.message,
        status: 'error',
        duration: 5000
      })
    }
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
        <Heading size="lg">Níveis de Estoque</Heading>
        
        {/* Stats */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel>Total de Itens</StatLabel>
            <StatNumber>{stats.total}</StatNumber>
            <StatHelpText>
              <FiPackage style={{ display: 'inline', marginRight: 4 }} />
              Produtos cadastrados
            </StatHelpText>
          </Stat>
          
          <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel>Estoque Baixo</StatLabel>
            <StatNumber color="orange.500">{stats.lowStock}</StatNumber>
            <StatHelpText>
              <FiTrendingDown style={{ display: 'inline', marginRight: 4 }} />
              Abaixo do mínimo
            </StatHelpText>
          </Stat>
          
          <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel>Sem Estoque</StatLabel>
            <StatNumber color="red.500">{stats.outOfStock}</StatNumber>
            <StatHelpText>
              <FiAlertTriangle style={{ display: 'inline', marginRight: 4 }} />
              Em ruptura
            </StatHelpText>
          </Stat>
          
          <Stat bg="white" p={4} borderRadius="lg" boxShadow="sm">
            <StatLabel>Valor Total</StatLabel>
            <StatNumber fontSize="lg">R$ {stats.totalValue.toFixed(2)}</StatNumber>
            <StatHelpText>Estoque valorizado</StatHelpText>
          </Stat>
        </Grid>
        
        {/* Filters */}
        <Box bg="white" p={4} borderRadius="lg" boxShadow="sm">
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray" />
              </InputLeftElement>
              <Input
                placeholder="Buscar produto ou local..."
                value={filters.q}
                onChange={(e) => handleFilterChange('q', e.target.value)}
              />
            </InputGroup>
            
            <Select
              placeholder="Tipo de alerta"
              value={filters.alert_type}
              onChange={(e) => handleFilterChange('alert_type', e.target.value)}
            >
              <option value="out">Sem estoque</option>
              <option value="low">Estoque baixo</option>
              <option value="high">Estoque alto</option>
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
          </Grid>
        </Box>
        
        {/* Table */}
        <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
          {loading ? (
            <Flex justify="center" align="center" p={10}>
              <Spinner size="xl" />
            </Flex>
          ) : levels.length === 0 ? (
            <Box textAlign="center" py={10}>
              <Text color="gray.500">Nenhum item encontrado</Text>
            </Box>
          ) : (
            <Box overflowX="auto">
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
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {levels.map((level) => {
                    const totalValue = level.quantity * level.product_price
                    
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
                            fontSize="sm"
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
                          <Text fontSize="sm">R$ {level.product_price?.toFixed(2)}</Text>
                        </Td>
                        
                        <Td isNumeric>
                          <Text fontSize="sm" fontWeight="medium">
                            R$ {totalValue.toFixed(2)}
                          </Text>
                        </Td>
                        
                        <Td>
                          <StockAlertBadge level={level} showDetails />
                        </Td>
                        
                        <Td>
                          <Tooltip label="Editar limites">
                            <IconButton
                              icon={<FiEdit2 />}
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditModal(level)}
                              aria-label="Editar limites"
                            />
                          </Tooltip>
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>
        
        {/* Pagination */}
        <Flex justify="space-between" align="center">
          <Text fontSize="sm" color="gray.600">
            Mostrando {levels.length} de {pagination.total} itens
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
      
      {/* Edit Thresholds Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Limites de Estoque</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingLevel && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold">{editingLevel.product_name}</Text>
                  <Text fontSize="sm" color="gray.600">
                    {editingLevel.location_name}
                  </Text>
                </Box>
                
                <FormControl>
                  <FormLabel>Estoque Mínimo</FormLabel>
                  <NumberInput
                    value={thresholds.min_stock}
                    onChange={(val) => setThresholds(prev => ({ ...prev, min_stock: parseInt(val) || 0 }))}
                    min={0}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Estoque Máximo</FormLabel>
                  <NumberInput
                    value={thresholds.max_stock}
                    onChange={(val) => setThresholds(prev => ({ ...prev, max_stock: parseInt(val) || 0 }))}
                    min={0}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateThresholds}>
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
