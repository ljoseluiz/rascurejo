import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Heading,
  Stack,
  useToast,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  HStack,
  Text,
  Badge,
  Select,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  VStack,
  Divider,
  IconButton,
  ButtonGroup,
} from '@chakra-ui/react'
import { FiEye, FiX, FiRefreshCw } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const statusColors = {
  completed: 'green',
  cancelled: 'red',
  returned: 'orange',
  pending: 'yellow',
}

const statusLabels = {
  completed: 'Concluída',
  cancelled: 'Cancelada',
  returned: 'Devolvida',
  pending: 'Pendente',
}

export default function SalesManagement() {
  const auth = useAuth()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [sales, setSales] = useState([])
  const [stats, setStats] = useState({})
  const [selectedSale, setSelectedSale] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    seller: '',
    channel: '',
  })

  useEffect(() => {
    loadSales()
    loadStats()
  }, [auth.csrfToken, filters])

  const loadSales = async () => {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.seller) params.append('seller', filters.seller)
      if (filters.channel) params.append('channel', filters.channel)

      const data = await api.get(`/sales?${params.toString()}`, opts)
      setSales(data.items || [])
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao carregar vendas',
        status: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get('/sales/stats', opts)
      setStats(data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas', error)
    }
  }

  const viewSaleDetails = async (saleId) => {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get(`/sales/${saleId}`, opts)
      setSelectedSale(data)
      onOpen()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message,
        status: 'error',
      })
    }
  }

  const handleCancelSale = async (saleId) => {
    if (!confirm('Tem certeza que deseja cancelar esta venda? O estoque será devolvido.')) {
      return
    }

    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      await api.put(`/sales/${saleId}/cancel`, {}, opts)

      toast({
        title: 'Venda cancelada',
        description: 'Estoque devolvido com sucesso',
        status: 'success',
      })

      loadSales()
      loadStats()
      onClose()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message,
        status: 'error',
      })
    }
  }

  const formatCurrency = (value) => {
    return (value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Box p={6}>
      <Stack spacing={6}>
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="lg">Gerenciamento de Vendas</Heading>
          <Button colorScheme="blue" leftIcon={<FiRefreshCw />} onClick={loadSales}>
            Atualizar
          </Button>
        </HStack>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Vendas Hoje</StatLabel>
                <StatNumber color="blue.600">{stats.today_sales || 0}</StatNumber>
                <Text fontSize="sm" color="gray.600">
                  {formatCurrency(stats.today_revenue)}
                </Text>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total de Vendas</StatLabel>
                <StatNumber color="green.600">{stats.total_sales || 0}</StatNumber>
                <Text fontSize="sm" color="gray.600">
                  {formatCurrency(stats.total_revenue)}
                </Text>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Ticket Médio</StatLabel>
                <StatNumber color="purple.600">
                  {formatCurrency(stats.avg_ticket)}
                </StatNumber>
                <Text fontSize="sm" color="gray.600">
                  Por venda
                </Text>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Vendas Canceladas</StatLabel>
                <StatNumber color="red.600">{stats.cancelled_sales || 0}</StatNumber>
                <Text fontSize="sm" color="gray.600">
                  Total
                </Text>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters */}
        <Card>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
              <Select
                placeholder="Todos os status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">Todos</option>
                <option value="completed">Concluídas</option>
                <option value="cancelled">Canceladas</option>
                <option value="returned">Devolvidas</option>
              </Select>

              <Input
                type="date"
                placeholder="Data inicial"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />

              <Input
                type="date"
                placeholder="Data final"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />

              <Select
                placeholder="Canal"
                value={filters.channel}
                onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
              </Select>

              <Button colorScheme="blue" onClick={loadSales}>
                Filtrar
              </Button>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Sales Table */}
        <Card>
          <CardBody>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Data/Hora</Th>
                    <Th>Cliente</Th>
                    <Th>Vendedor</Th>
                    <Th>Canal</Th>
                    <Th>Pagamento</Th>
                    <Th isNumeric>Total</Th>
                    <Th>Status</Th>
                    <Th>Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {loading ? (
                    <Tr>
                      <Td colSpan={9} textAlign="center">
                        Carregando...
                      </Td>
                    </Tr>
                  ) : sales.length === 0 ? (
                    <Tr>
                      <Td colSpan={9} textAlign="center">
                        Nenhuma venda encontrada
                      </Td>
                    </Tr>
                  ) : (
                    sales.map((sale) => (
                      <Tr key={sale.id}>
                        <Td fontWeight="bold">#{sale.id}</Td>
                        <Td fontSize="sm">{formatDate(sale.date)}</Td>
                        <Td>{sale.customer_name || 'Cliente Avulso'}</Td>
                        <Td>{sale.seller_name}</Td>
                        <Td>
                          <Badge colorScheme={sale.channel === 'presencial' ? 'blue' : 'purple'}>
                            {sale.channel === 'presencial' ? '🏪 Presencial' : '🌐 Online'}
                          </Badge>
                        </Td>
                        <Td fontSize="sm" textTransform="capitalize">
                          {sale.payment_method?.replace('_', ' ') || 'N/A'}
                        </Td>
                        <Td isNumeric fontWeight="bold" color="green.600">
                          {formatCurrency(sale.total)}
                        </Td>
                        <Td>
                          <Badge colorScheme={statusColors[sale.status]}>
                            {statusLabels[sale.status]}
                          </Badge>
                        </Td>
                        <Td>
                          <ButtonGroup size="sm" spacing={1}>
                            <IconButton
                              icon={<FiEye />}
                              colorScheme="blue"
                              variant="ghost"
                              onClick={() => viewSaleDetails(sale.id)}
                            />
                            {sale.status === 'completed' && (
                              <IconButton
                                icon={<FiX />}
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleCancelSale(sale.id)}
                              />
                            )}
                          </ButtonGroup>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      </Stack>

      {/* Sale Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalhes da Venda #{selectedSale?.id}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedSale && (
              <VStack spacing={4} align="stretch">
                {/* Sale Info */}
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Data/Hora
                    </Text>
                    <Text fontWeight="bold">{formatDate(selectedSale.date)}</Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Status
                    </Text>
                    <Badge colorScheme={statusColors[selectedSale.status]} fontSize="md">
                      {statusLabels[selectedSale.status]}
                    </Badge>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Cliente
                    </Text>
                    <Text fontWeight="bold">
                      {selectedSale.customer_name || 'Cliente Avulso'}
                    </Text>
                    {selectedSale.customer_cpf && (
                      <Text fontSize="xs">{selectedSale.customer_cpf}</Text>
                    )}
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Vendedor
                    </Text>
                    <Text fontWeight="bold">{selectedSale.seller_name}</Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Canal
                    </Text>
                    <Badge colorScheme={selectedSale.channel === 'presencial' ? 'blue' : 'purple'}>
                      {selectedSale.channel === 'presencial' ? '🏪 Presencial' : '🌐 Online'}
                    </Badge>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.600">
                      Forma de Pagamento
                    </Text>
                    <Text fontWeight="bold" textTransform="capitalize">
                      {selectedSale.payment_method?.replace('_', ' ') || 'N/A'}
                    </Text>
                  </Box>
                </SimpleGrid>

                <Divider />

                {/* Items */}
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Itens da Venda
                  </Text>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Produto</Th>
                        <Th isNumeric>Qtd</Th>
                        <Th isNumeric>Preço Unit.</Th>
                        <Th isNumeric>Total</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {selectedSale.items?.map((item) => (
                        <Tr key={item.id}>
                          <Td>{item.product_name}</Td>
                          <Td isNumeric>{item.quantity}</Td>
                          <Td isNumeric>{formatCurrency(item.unit_price)}</Td>
                          <Td isNumeric fontWeight="bold">
                            {formatCurrency(item.total)}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                <Divider />

                {/* Totals */}
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Text>Subtotal:</Text>
                    <Text fontWeight="bold">{formatCurrency(selectedSale.subtotal)}</Text>
                  </HStack>

                  {selectedSale.discount > 0 && (
                    <HStack justify="space-between">
                      <Text>Desconto:</Text>
                      <Text color="red.600">
                        - {formatCurrency(selectedSale.discount)}
                      </Text>
                    </HStack>
                  )}

                  <HStack justify="space-between">
                    <Text>Impostos:</Text>
                    <Text>{formatCurrency(selectedSale.tax)}</Text>
                  </HStack>

                  <Divider />

                  <HStack justify="space-between">
                    <Text fontSize="xl" fontWeight="bold">
                      TOTAL:
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                      {formatCurrency(selectedSale.total)}
                    </Text>
                  </HStack>
                </VStack>

                {selectedSale.notes && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Observações:
                      </Text>
                      <Text>{selectedSale.notes}</Text>
                    </Box>
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            {selectedSale?.status === 'completed' && (
              <Button
                colorScheme="red"
                mr={3}
                onClick={() => handleCancelSale(selectedSale.id)}
              >
                Cancelar Venda
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
