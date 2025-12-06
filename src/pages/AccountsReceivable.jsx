import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Heading,
  HStack,
  Input,
  Select,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  FormControl,
  FormLabel,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const statusColors = {
  pending: 'yellow',
  overdue: 'red',
  received: 'green',
  default_payer: 'orange',
}

const statusLabels = {
  pending: 'Pendente',
  overdue: 'Vencido',
  received: 'Recebido',
  default_payer: 'Inadimplente',
}

const paymentMethodIcons = {
  boleto: '📄 Boleto',
  credit_card: '💳 Cartão',
  pix: '📲 PIX',
  transfer: '🏦 Transferência',
  cash: '💵 Dinheiro',
  check: '📋 Cheque',
}

export default function AccountsReceivable() {
  const auth = useAuth()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure()

  const [receivables, setReceivables] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({})
  const [selectedReceivable, setSelectedReceivable] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [formData, setFormData] = useState({
    customer_name: '',
    amount: '',
    due_date: '',
    payment_method: 'credit_card',
    installments: 1,
    description: '',
  })

  useEffect(() => {
    loadReceivables()
  }, [auth.csrfToken, status, page])

  const loadReceivables = async () => {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const query = new URLSearchParams()
      if (status) query.append('status', status)
      query.append('page', page)
      query.append('limit', 10)

      const data = await api.get(`/financial/accounts-receivable?${query}`, opts)
      setReceivables(data.items || [])
      setTotal(data.total || 0)

      // Calculate summary
      const allOpts = api.injectCsrf({}, auth.csrfToken)
      const allData = await api.get('/financial/accounts-receivable', allOpts)
      const allItems = allData.items || []
      
      setSummary({
        total: allItems.reduce((sum, a) => sum + a.amount, 0),
        pending: allItems
          .filter(a => a.status === 'pending')
          .reduce((sum, a) => sum + a.amount, 0),
        overdue: allItems
          .filter(a => a.status === 'overdue')
          .reduce((sum, a) => sum + a.amount, 0),
        received: allItems
          .filter(a => a.status === 'received')
          .reduce((sum, a) => sum + a.amount, 0),
        defaultPayers: allItems
          .filter(a => a.status === 'default_payer')
          .reduce((sum, a) => sum + a.amount, 0),
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao carregar contas a receber',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsReceived = async (receivable) => {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      await api.put(
        `/financial/accounts-receivable/${receivable.id}/receive`,
        {},
        opts
      )
      toast({
        title: 'Sucesso',
        description: `Recebimento registrado de ${receivable.customer_name}`,
        status: 'success',
        duration: 3000,
      })
      setSelectedReceivable(null)
      onClose()
      loadReceivables()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message,
        status: 'error',
      })
    }
  }

  const handleCreateReceivable = async () => {
    if (!formData.customer_name || !formData.amount || !formData.due_date) {
      toast({
        title: 'Validação',
        description: 'Preencha todos os campos obrigatórios',
        status: 'warning',
      })
      return
    }

    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      await api.post('/financial/accounts-receivable', {
        customer_name: formData.customer_name,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        payment_method: formData.payment_method,
        installments: parseInt(formData.installments),
        description: formData.description,
      }, opts)

      toast({
        title: 'Sucesso',
        description: 'Conta a receber criada com sucesso',
        status: 'success',
        duration: 3000,
      })

      setFormData({
        customer_name: '',
        amount: '',
        due_date: '',
        payment_method: 'credit_card',
        installments: 1,
        description: '',
      })
      onFormClose()
      loadReceivables()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao criar conta a receber',
        status: 'error',
      })
    }
  }

  const pageCount = Math.ceil(total / 10)

  // Agrupar por cliente
  const receivablesByCustomer = () => {
    const grouped = {}
    receivables.forEach((r) => {
      if (!grouped[r.customer_name]) {
        grouped[r.customer_name] = []
      }
      grouped[r.customer_name].push(r)
    })
    return grouped
  }

  // Agenda de recebimentos (próximos 30 dias)
  const receivableSchedule = () => {
    return receivables
      .filter(r => r.status !== 'received')
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 20)
  }

  // Situação dos recebimentos
  const receivablesStatus = () => {
    const byStatus = {
      pending: receivables.filter(r => r.status === 'pending'),
      overdue: receivables.filter(r => r.status === 'overdue'),
      received: receivables.filter(r => r.status === 'received'),
      default_payer: receivables.filter(r => r.status === 'default_payer'),
    }
    return byStatus
  }

  return (
    <Box p={6}>
      <Stack spacing={6}>
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="lg">Contas a Receber</Heading>
          <Button colorScheme="blue" size="md" onClick={onFormOpen}>
            + Novo Recebimento
          </Button>
        </HStack>

        {/* Summary Cards */}
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total</StatLabel>
                <StatNumber fontSize="sm">
                  {(summary.total || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card bg="yellow.50">
            <CardBody>
              <Stat>
                <StatLabel>Pendente</StatLabel>
                <StatNumber color="orange.600" fontSize="sm">
                  {(summary.pending || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card bg="red.50">
            <CardBody>
              <Stat>
                <StatLabel>Vencido</StatLabel>
                <StatNumber color="red.600" fontSize="sm">
                  {(summary.overdue || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card bg="green.50">
            <CardBody>
              <Stat>
                <StatLabel>Recebido</StatLabel>
                <StatNumber color="green.600" fontSize="sm">
                  {(summary.received || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card bg="orange.50">
            <CardBody>
              <Stat>
                <StatLabel>Inadimplência</StatLabel>
                <StatNumber color="orange.700" fontSize="sm">
                  {(summary.defaultPayers || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Abas */}
        <Tabs index={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab>Listagem</Tab>
            <Tab>Clientes</Tab>
            <Tab>Métodos de Pagamento</Tab>
            <Tab>Agenda de Recebimentos</Tab>
            <Tab>Controle de Inadimplência</Tab>
          </TabList>

          <TabPanels>
            {/* ABA 1: Listagem */}
            <TabPanel>
              <Stack spacing={4}>
                <HStack spacing={4}>
                  <Select
                    placeholder="Filtrar por status"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value)
                      setPage(1)
                    }}
                    maxW="200px"
                  >
                    <option value="pending">Pendente</option>
                    <option value="overdue">Vencido</option>
                    <option value="received">Recebido</option>
                    <option value="default_payer">Inadimplente</option>
                  </Select>
                </HStack>

                <Box overflowX="auto">
                  <Table variant="striped">
                    <Thead>
                      <Tr>
                        <Th>Cliente</Th>
                        <Th>Valor</Th>
                        <Th>Vencimento</Th>
                        <Th>Parcelas</Th>
                        <Th>Status</Th>
                        <Th>Ações</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {loading ? (
                        <Tr>
                          <Td colSpan={6} textAlign="center">
                            Carregando...
                          </Td>
                        </Tr>
                      ) : receivables.length === 0 ? (
                        <Tr>
                          <Td colSpan={6} textAlign="center">
                            Nenhuma conta encontrada
                          </Td>
                        </Tr>
                      ) : (
                        receivables.map((receivable) => (
                          <Tr key={receivable.id}>
                            <Td fontWeight="bold">{receivable.customer_name}</Td>
                            <Td>
                              {receivable.amount.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Td>
                            <Td>{receivable.due_date}</Td>
                            <Td>{receivable.installments}x</Td>
                            <Td>
                              <Badge colorScheme={statusColors[receivable.status] || 'gray'}>
                                {statusLabels[receivable.status] || receivable.status}
                              </Badge>
                            </Td>
                            <Td>
                              <ButtonGroup size="sm" spacing={2}>
                                {receivable.status !== 'received' && (
                                  <Button
                                    colorScheme="blue"
                                    onClick={() => {
                                      setSelectedReceivable(receivable)
                                      onOpen()
                                    }}
                                  >
                                    Registrar
                                  </Button>
                                )}
                              </ButtonGroup>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </Box>

                {/* Paginação */}
                {pageCount > 1 && (
                  <HStack justify="center" spacing={4}>
                    <Button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      isDisabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Text>
                      Página {page} de {pageCount}
                    </Text>
                    <Button
                      onClick={() => setPage(Math.min(pageCount, page + 1))}
                      isDisabled={page === pageCount}
                    >
                      Próxima
                    </Button>
                  </HStack>
                )}
              </Stack>
            </TabPanel>

            {/* ABA 2: Clientes */}
            <TabPanel>
              <Box overflowX="auto">
                <Table variant="striped">
                  <Thead>
                    <Tr>
                      <Th>Cliente</Th>
                      <Th>Documentos</Th>
                      <Th>Total a Receber</Th>
                      <Th>Pendente</Th>
                      <Th>Vencido</Th>
                      <Th>Recebido</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {Object.entries(receivablesByCustomer()).map(([customer, items]) => {
                      const total = items.reduce((sum, r) => sum + r.amount, 0)
                      const pending = items
                        .filter(r => r.status === 'pending')
                        .reduce((sum, r) => sum + r.amount, 0)
                      const overdue = items
                        .filter(r => r.status === 'overdue')
                        .reduce((sum, r) => sum + r.amount, 0)
                      const received = items
                        .filter(r => r.status === 'received')
                        .reduce((sum, r) => sum + r.amount, 0)

                      return (
                        <Tr key={customer}>
                          <Td fontWeight="bold">{customer}</Td>
                          <Td>{items.length}</Td>
                          <Td>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                          <Td color="orange.600">{pending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                          <Td color="red.600">{overdue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                          <Td color="green.600">{received.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                        </Tr>
                      )
                    })}
                  </Tbody>
                </Table>
              </Box>
            </TabPanel>

            {/* ABA 3: Métodos de Pagamento */}
            <TabPanel>
              <Stack spacing={4}>
                <Box overflowX="auto">
                  <Table variant="striped" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Cliente</Th>
                        <Th>Valor</Th>
                        <Th>Data Venda</Th>
                        <Th>Vencimento</Th>
                        <Th>Método</Th>
                        <Th>Parcelas</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {receivables.map((receivable) => (
                        <Tr key={receivable.id}>
                          <Td fontSize="sm" fontWeight="bold">
                            {receivable.customer_name}
                          </Td>
                          <Td fontSize="sm">
                            {receivable.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </Td>
                          <Td fontSize="sm">{receivable.sale_date}</Td>
                          <Td fontSize="sm">{receivable.due_date}</Td>
                          <Td fontSize="sm">
                            <Badge colorScheme="blue" fontSize="xs">
                              {paymentMethodIcons[receivable.payment_method] || receivable.payment_method}
                            </Badge>
                          </Td>
                          <Td fontSize="sm" fontWeight="bold">
                            {receivable.current_installment}/{receivable.installments}
                          </Td>
                          <Td>
                            <Badge colorScheme={statusColors[receivable.status] || 'gray'}>
                              {statusLabels[receivable.status] || receivable.status}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Stack>
            </TabPanel>

            {/* ABA 4: Agenda de Recebimentos */}
            <TabPanel>
              <Stack spacing={4}>
                <Heading size="sm">Próximos Recebimentos (30 dias)</Heading>
                <Box overflowX="auto">
                  <Table variant="striped" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Data Vencimento</Th>
                        <Th>Cliente</Th>
                        <Th>Valor</Th>
                        <Th>Dias para Vencer</Th>
                        <Th>Método</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {receivableSchedule().map((receivable) => {
                        const today = new Date()
                        const dueDate = new Date(receivable.due_date)
                        const daysToVencimento = Math.ceil(
                          (dueDate - today) / (1000 * 60 * 60 * 24)
                        )
                        const isOverdue = daysToVencimento < 0
                        const isUrgent = daysToVencimento <= 5 && daysToVencimento >= 0

                        return (
                          <Tr
                            key={receivable.id}
                            bg={isOverdue ? 'red.50' : isUrgent ? 'yellow.50' : 'transparent'}
                          >
                            <Td fontWeight="bold">{receivable.due_date}</Td>
                            <Td>{receivable.customer_name}</Td>
                            <Td fontWeight="bold">
                              {receivable.amount.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  isOverdue ? 'red' : isUrgent ? 'orange' : 'green'
                                }
                              >
                                {isOverdue ? `Vencido há ${Math.abs(daysToVencimento)}d` : `${daysToVencimento}d`}
                              </Badge>
                            </Td>
                            <Td fontSize="sm">
                              {paymentMethodIcons[receivable.payment_method] || receivable.payment_method}
                            </Td>
                            <Td>
                              <Badge colorScheme={statusColors[receivable.status] || 'gray'}>
                                {statusLabels[receivable.status] || receivable.status}
                              </Badge>
                            </Td>
                          </Tr>
                        )
                      })}
                    </Tbody>
                  </Table>
                </Box>
              </Stack>
            </TabPanel>

            {/* ABA 5: Controle de Inadimplência */}
            <TabPanel>
              <Stack spacing={6}>
                {/* Pendentes */}
                <Box>
                  <Heading size="sm" mb={4}>
                    ⏳ Pendente ({receivablesStatus().pending.length})
                  </Heading>
                  {receivablesStatus().pending.length === 0 ? (
                    <Text color="gray.500">Nenhum recebimento pendente</Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table variant="striped" size="sm">
                        <Thead>
                          <Tr bg="yellow.50">
                            <Th>Cliente</Th>
                            <Th>Valor</Th>
                            <Th>Vencimento</Th>
                            <Th>Dias</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {receivablesStatus().pending.map((r) => {
                            const today = new Date()
                            const dueDate = new Date(r.due_date)
                            const days = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
                            return (
                              <Tr key={r.id}>
                                <Td fontWeight="bold">{r.customer_name}</Td>
                                <Td>
                                  {r.amount.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })}
                                </Td>
                                <Td>{r.due_date}</Td>
                                <Td>
                                  <Badge colorScheme={days <= 5 ? 'orange' : 'yellow'}>
                                    {days > 0 ? `${days}d` : 'Hoje'}
                                  </Badge>
                                </Td>
                              </Tr>
                            )
                          })}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </Box>

                {/* Vencidos */}
                <Box>
                  <Heading size="sm" mb={4}>
                    🔴 Vencido ({receivablesStatus().overdue.length})
                  </Heading>
                  {receivablesStatus().overdue.length === 0 ? (
                    <Text color="gray.500">Nenhum recebimento vencido</Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table variant="striped" size="sm">
                        <Thead>
                          <Tr bg="red.50">
                            <Th>Cliente</Th>
                            <Th>Valor</Th>
                            <Th>Vencimento</Th>
                            <Th>Dias em Atraso</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {receivablesStatus().overdue.map((r) => {
                            const today = new Date()
                            const dueDate = new Date(r.due_date)
                            const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24))
                            return (
                              <Tr key={r.id} bg="red.50">
                                <Td fontWeight="bold">{r.customer_name}</Td>
                                <Td fontWeight="bold" color="red.700">
                                  {r.amount.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })}
                                </Td>
                                <Td>{r.due_date}</Td>
                                <Td>
                                  <Badge colorScheme="red">
                                    {daysOverdue}d em atraso
                                  </Badge>
                                </Td>
                              </Tr>
                            )
                          })}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </Box>

                {/* Recebidos */}
                <Box>
                  <Heading size="sm" mb={4}>
                    ✅ Recebido ({receivablesStatus().received.length})
                  </Heading>
                  {receivablesStatus().received.length === 0 ? (
                    <Text color="gray.500">Nenhum recebimento realizado</Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table variant="striped" size="sm">
                        <Thead>
                          <Tr bg="green.50">
                            <Th>Cliente</Th>
                            <Th>Valor</Th>
                            <Th>Vencimento</Th>
                            <Th>Recebido em</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {receivablesStatus().received.map((r) => (
                            <Tr key={r.id}>
                              <Td>{r.customer_name}</Td>
                              <Td color="green.600" fontWeight="bold">
                                {r.amount.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </Td>
                              <Td>{r.due_date}</Td>
                              <Td>{r.received_at ? r.received_at.split('T')[0] : '-'}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </Box>

                {/* Inadimplentes */}
                <Box>
                  <Heading size="sm" mb={4}>
                    ⚠️ Inadimplentes ({receivablesStatus().default_payer.length})
                  </Heading>
                  {receivablesStatus().default_payer.length === 0 ? (
                    <Text color="gray.500">Nenhum cliente inadimplente</Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table variant="striped" size="sm">
                        <Thead>
                          <Tr bg="orange.50">
                            <Th>Cliente</Th>
                            <Th>Valor em Atraso</Th>
                            <Th>Desde</Th>
                            <Th>Dias em Atraso</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {receivablesStatus().default_payer.map((r) => {
                            const today = new Date()
                            const dueDate = new Date(r.due_date)
                            const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24))
                            return (
                              <Tr key={r.id} bg="orange.50">
                                <Td fontWeight="bold">{r.customer_name}</Td>
                                <Td color="orange.700" fontWeight="bold">
                                  {r.amount.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })}
                                </Td>
                                <Td>{r.due_date}</Td>
                                <Td>
                                  <Badge colorScheme="orange">
                                    {daysOverdue}d em atraso
                                  </Badge>
                                </Td>
                              </Tr>
                            )
                          })}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </Box>
              </Stack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>

      {/* Receive Payment Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Registrar Recebimento</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="start">
              <Box>
                <Text fontWeight="bold">Cliente:</Text>
                <Text>{selectedReceivable?.customer_name}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Valor:</Text>
                <Text>
                  {(selectedReceivable?.amount || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Vencimento:</Text>
                <Text>{selectedReceivable?.due_date}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Método:</Text>
                <Text>{paymentMethodIcons[selectedReceivable?.payment_method] || selectedReceivable?.payment_method}</Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                colorScheme="blue"
                onClick={() => handleMarkAsReceived(selectedReceivable)}
              >
                Confirmar Recebimento
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Receivable Modal */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Novo Recebimento</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Cliente</FormLabel>
                <Input
                  placeholder="Nome do cliente"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Valor</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Data de Vencimento</FormLabel>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Parcelas</FormLabel>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.installments}
                  onChange={(e) =>
                    setFormData({ ...formData, installments: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Método de Pagamento</FormLabel>
                <Select
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_method: e.target.value })
                  }
                >
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="pix">PIX</option>
                  <option value="transfer">Transferência</option>
                  <option value="boleto">Boleto</option>
                  <option value="cash">Dinheiro</option>
                  <option value="check">Cheque</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Descrição</FormLabel>
                <Input
                  placeholder="Descrição da venda"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button variant="outline" onClick={onFormClose}>
                Cancelar
              </Button>
              <Button colorScheme="blue" onClick={handleCreateReceivable}>
                Salvar
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
