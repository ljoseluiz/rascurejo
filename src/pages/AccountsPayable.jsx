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
  paid: 'green',
}

const statusLabels = {
  pending: 'Pendente',
  overdue: 'Vencido',
  paid: 'Pago',
}

export default function AccountsPayable() {
  const auth = useAuth()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure()

  const [payables, setPayables] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({})
  const [selectedPayable, setSelectedPayable] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [activeTab, setActiveTab] = useState(0)
  const [formData, setFormData] = useState({
    supplier_id: '',
    invoice_number: '',
    amount: '',
    due_date: '',
    payment_method: 'boleto',
    description: '',
  })

  useEffect(() => {
    loadPayables()
    loadSuppliers()
  }, [auth.csrfToken, status, page])

  const loadSuppliers = async () => {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get('/suppliers', opts)
      setSuppliers(data.items || [])
    } catch (error) {
      console.log('Não foi possível carregar fornecedores')
    }
  }

  const loadPayables = async () => {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const query = new URLSearchParams()
      if (status) query.append('status', status)
      query.append('page', page)
      query.append('limit', 10)

      const data = await api.get(`/financial/accounts-payable?${query}`, opts)
      setPayables(data.items || [])
      setTotal(data.total || 0)

      // Calculate summary
      const allOpts = api.injectCsrf({}, auth.csrfToken)
      const allData = await api.get('/financial/accounts-payable', allOpts)
      const allItems = allData.items || []
      setSummary({
        total: allItems.reduce((sum, a) => sum + a.amount, 0),
        pending: allItems
          .filter(a => a.status === 'pending')
          .reduce((sum, a) => sum + a.amount, 0),
        overdue: allItems
          .filter(a => a.status === 'overdue')
          .reduce((sum, a) => sum + a.amount, 0),
        paid: allItems
          .filter(a => a.status === 'paid')
          .reduce((sum, a) => sum + a.amount, 0),
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao carregar contas a pagar',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (payable) => {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      await api.put(
        `/financial/accounts-payable/${payable.id}/pay`,
        {},
        opts
      )
      toast({
        title: 'Sucesso',
        description: `Pagamento marcado como realizado`,
        status: 'success',
        duration: 3000,
      })
      setSelectedPayable(null)
      onClose()
      loadPayables()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message,
        status: 'error',
      })
    }
  }

  const handleCreatePayable = async () => {
    if (!formData.supplier_id || !formData.amount || !formData.due_date) {
      toast({
        title: 'Validação',
        description: 'Preencha todos os campos obrigatórios',
        status: 'warning',
      })
      return
    }

    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      await api.post('/financial/accounts-payable', {
        supplier_id: parseInt(formData.supplier_id),
        invoice_number: formData.invoice_number,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        payment_method: formData.payment_method,
        description: formData.description,
      }, opts)

      toast({
        title: 'Sucesso',
        description: 'Conta a pagar criada com sucesso',
        status: 'success',
        duration: 3000,
      })

      setFormData({
        supplier_id: '',
        invoice_number: '',
        amount: '',
        due_date: '',
        payment_method: 'boleto',
        description: '',
      })
      onFormClose()
      loadPayables()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao criar conta a pagar',
        status: 'error',
      })
    }
  }

  const pageCount = Math.ceil(total / 10)

  // Agrupar por fornecedor
  const payablesBySupplier = () => {
    const grouped = {}
    payables.forEach((p) => {
      if (!grouped[p.supplier_name]) {
        grouped[p.supplier_name] = []
      }
      grouped[p.supplier_name].push(p)
    })
    return grouped
  }

  // Agenda de pagamentos (próximos 30 dias)
  const paymentSchedule = () => {
    return payables
      .filter(p => p.status !== 'paid')
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 20)
  }

  // Situação dos títulos
  const titlesStatus = () => {
    const byStatus = {
      pending: payables.filter(p => p.status === 'pending'),
      overdue: payables.filter(p => p.status === 'overdue'),
      paid: payables.filter(p => p.status === 'paid'),
    }
    return byStatus
  }

  return (
    <Box p={6}>
      <Stack spacing={6}>
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="lg">Contas a Pagar</Heading>
          <Button colorScheme="green" size="md" onClick={onFormOpen}>
            + Nova Conta
          </Button>
        </HStack>

        {/* Summary Cards */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total</StatLabel>
                <StatNumber>
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
                <StatNumber color="orange.600">
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
                <StatNumber color="red.600">
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
                <StatLabel>Pago</StatLabel>
                <StatNumber color="green.600">
                  {(summary.paid || 0).toLocaleString('pt-BR', {
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
            <Tab>Fornecedores</Tab>
            <Tab>Faturas e Boletos</Tab>
            <Tab>Agenda de Pagamentos</Tab>
            <Tab>Situação dos Títulos</Tab>
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
                    <option value="paid">Pago</option>
                  </Select>
                </HStack>

                <Box overflowX="auto">
                  <Table variant="striped">
                    <Thead>
                      <Tr>
                        <Th>Fornecedor</Th>
                        <Th>NF</Th>
                        <Th>Valor</Th>
                        <Th>Vencimento</Th>
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
                      ) : payables.length === 0 ? (
                        <Tr>
                          <Td colSpan={6} textAlign="center">
                            Nenhuma conta encontrada
                          </Td>
                        </Tr>
                      ) : (
                        payables.map((payable) => (
                          <Tr key={payable.id}>
                            <Td>{payable.supplier_name}</Td>
                            <Td>{payable.invoice_number}</Td>
                            <Td>
                              {payable.amount.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Td>
                            <Td>{payable.due_date}</Td>
                            <Td>
                              <Badge colorScheme={statusColors[payable.status]}>
                                {statusLabels[payable.status]}
                              </Badge>
                            </Td>
                            <Td>
                              <ButtonGroup size="sm" spacing={2}>
                                {payable.status !== 'paid' && (
                                  <Button
                                    colorScheme="green"
                                    onClick={() => {
                                      setSelectedPayable(payable)
                                      onOpen()
                                    }}
                                  >
                                    Marcar Pago
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

            {/* ABA 2: Fornecedores */}
            <TabPanel>
              <Box overflowX="auto">
                <Table variant="striped">
                  <Thead>
                    <Tr>
                      <Th>Fornecedor</Th>
                      <Th>Documentos</Th>
                      <Th>Total Devido</Th>
                      <Th>Pendente</Th>
                      <Th>Vencido</Th>
                      <Th>Pago</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {Object.entries(payablesBySupplier()).map(([supplier, items]) => {
                      const total = items.reduce((sum, p) => sum + p.amount, 0)
                      const pending = items
                        .filter(p => p.status === 'pending')
                        .reduce((sum, p) => sum + p.amount, 0)
                      const overdue = items
                        .filter(p => p.status === 'overdue')
                        .reduce((sum, p) => sum + p.amount, 0)
                      const paid = items
                        .filter(p => p.status === 'paid')
                        .reduce((sum, p) => sum + p.amount, 0)

                      return (
                        <Tr key={supplier}>
                          <Td fontWeight="bold">{supplier}</Td>
                          <Td>{items.length}</Td>
                          <Td>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                          <Td color="orange.600">{pending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                          <Td color="red.600">{overdue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                          <Td color="green.600">{paid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Td>
                        </Tr>
                      )
                    })}
                  </Tbody>
                </Table>
              </Box>
            </TabPanel>

            {/* ABA 3: Faturas e Boletos */}
            <TabPanel>
              <Stack spacing={4}>
                <Box overflowX="auto">
                  <Table variant="striped" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Fornecedor</Th>
                        <Th>NF/Boleto</Th>
                        <Th>Valor</Th>
                        <Th>Descrição</Th>
                        <Th>Método</Th>
                        <Th>Status</Th>
                        <Th>Ação</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {payables.map((payable) => (
                        <Tr key={payable.id}>
                          <Td fontSize="sm">{payable.supplier_name}</Td>
                          <Td fontSize="sm" fontWeight="bold">
                            {payable.invoice_number}
                          </Td>
                          <Td fontSize="sm">
                            {payable.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </Td>
                          <Td fontSize="sm">{payable.description || '-'}</Td>
                          <Td fontSize="sm">
                            <Badge colorScheme="blue" fontSize="xs">
                              {payable.payment_method === 'boleto' && '📄 Boleto'}
                              {payable.payment_method === 'transfer' && '🏦 Transferência'}
                              {payable.payment_method === 'check' && '📋 Cheque'}
                              {payable.payment_method === 'cash' && '💵 Dinheiro'}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme={statusColors[payable.status]}>
                              {statusLabels[payable.status]}
                            </Badge>
                          </Td>
                          <Td>
                            {payable.status !== 'paid' && (
                              <Button
                                size="xs"
                                colorScheme="green"
                                onClick={() => {
                                  setSelectedPayable(payable)
                                  onOpen()
                                }}
                              >
                                Pagar
                              </Button>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Stack>
            </TabPanel>

            {/* ABA 4: Agenda de Pagamentos */}
            <TabPanel>
              <Stack spacing={4}>
                <Heading size="sm">Próximos Pagamentos (30 dias)</Heading>
                <Box overflowX="auto">
                  <Table variant="striped" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Data Vencimento</Th>
                        <Th>Fornecedor</Th>
                        <Th>NF</Th>
                        <Th>Valor</Th>
                        <Th>Dias para Vencer</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {paymentSchedule().map((payable) => {
                        const today = new Date()
                        const dueDate = new Date(payable.due_date)
                        const daysToVencimento = Math.ceil(
                          (dueDate - today) / (1000 * 60 * 60 * 24)
                        )
                        const isOverdue = daysToVencimento < 0
                        const isUrgent = daysToVencimento <= 5 && daysToVencimento >= 0

                        return (
                          <Tr
                            key={payable.id}
                            bg={isOverdue ? 'red.50' : isUrgent ? 'yellow.50' : 'transparent'}
                          >
                            <Td fontWeight="bold">{payable.due_date}</Td>
                            <Td>{payable.supplier_name}</Td>
                            <Td>{payable.invoice_number}</Td>
                            <Td fontWeight="bold">
                              {payable.amount.toLocaleString('pt-BR', {
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
                            <Td>
                              <Badge colorScheme={statusColors[payable.status]}>
                                {statusLabels[payable.status]}
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

            {/* ABA 5: Situação dos Títulos */}
            <TabPanel>
              <Stack spacing={6}>
                {/* Pendentes */}
                <Box>
                  <Heading size="sm" mb={4}>
                    📋 Pendente ({titlesStatus().pending.length})
                  </Heading>
                  {titlesStatus().pending.length === 0 ? (
                    <Text color="gray.500">Nenhum título pendente</Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table variant="striped" size="sm">
                        <Thead>
                          <Tr bg="yellow.50">
                            <Th>Fornecedor</Th>
                            <Th>NF</Th>
                            <Th>Valor</Th>
                            <Th>Vencimento</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {titlesStatus().pending.map((p) => (
                            <Tr key={p.id}>
                              <Td>{p.supplier_name}</Td>
                              <Td>{p.invoice_number}</Td>
                              <Td>
                                {p.amount.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </Td>
                              <Td>{p.due_date}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </Box>

                {/* Vencidos */}
                <Box>
                  <Heading size="sm" mb={4}>
                    🔴 Vencido ({titlesStatus().overdue.length})
                  </Heading>
                  {titlesStatus().overdue.length === 0 ? (
                    <Text color="gray.500">Nenhum título vencido</Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table variant="striped" size="sm">
                        <Thead>
                          <Tr bg="red.50">
                            <Th>Fornecedor</Th>
                            <Th>NF</Th>
                            <Th>Valor</Th>
                            <Th>Vencimento</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {titlesStatus().overdue.map((p) => (
                            <Tr key={p.id}>
                              <Td>{p.supplier_name}</Td>
                              <Td>{p.invoice_number}</Td>
                              <Td fontWeight="bold">
                                {p.amount.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </Td>
                              <Td>{p.due_date}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </Box>

                {/* Pagos */}
                <Box>
                  <Heading size="sm" mb={4}>
                    ✅ Pago ({titlesStatus().paid.length})
                  </Heading>
                  {titlesStatus().paid.length === 0 ? (
                    <Text color="gray.500">Nenhum título pago</Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table variant="striped" size="sm">
                        <Thead>
                          <Tr bg="green.50">
                            <Th>Fornecedor</Th>
                            <Th>NF</Th>
                            <Th>Valor</Th>
                            <Th>Vencimento</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {titlesStatus().paid.map((p) => (
                            <Tr key={p.id}>
                              <Td>{p.supplier_name}</Td>
                              <Td>{p.invoice_number}</Td>
                              <Td>
                                {p.amount.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </Td>
                              <Td>{p.due_date}</Td>
                            </Tr>
                          ))}
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

      {/* Mark as Paid Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar Pagamento</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="start">
              <Box>
                <Text fontWeight="bold">Fornecedor:</Text>
                <Text>{selectedPayable?.supplier_name}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Valor:</Text>
                <Text>
                  {(selectedPayable?.amount || 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Vencimento:</Text>
                <Text>{selectedPayable?.due_date}</Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                colorScheme="green"
                onClick={() => handleMarkAsPaid(selectedPayable)}
              >
                Confirmar Pagamento
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create/Edit Payable Modal */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nova Conta a Pagar</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Fornecedor</FormLabel>
                <Select
                  placeholder="Selecione um fornecedor"
                  value={formData.supplier_id}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier_id: e.target.value })
                  }
                >
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Número da NF</FormLabel>
                <Input
                  placeholder="Ex: NF-001"
                  value={formData.invoice_number}
                  onChange={(e) =>
                    setFormData({ ...formData, invoice_number: e.target.value })
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
                <FormLabel>Método de Pagamento</FormLabel>
                <Select
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_method: e.target.value })
                  }
                >
                  <option value="boleto">Boleto</option>
                  <option value="transfer">Transferência</option>
                  <option value="check">Cheque</option>
                  <option value="cash">Dinheiro</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Descrição</FormLabel>
                <Input
                  placeholder="Descrição da compra"
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
              <Button colorScheme="green" onClick={handleCreatePayable}>
                Salvar
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
