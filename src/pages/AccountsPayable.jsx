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

        {/* Filters */}
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

        {/* Table */}
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
                        <Button colorScheme="blue">Detalhes</Button>
                      </ButtonGroup>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>

        {/* Pagination */}
        {pageCount > 1 && (
          <HStack justify="center" spacing={2}>
            <Button
              isDisabled={page === 1}
              onClick={() => setPage(page - 1)}
              size="sm"
            >
              Anterior
            </Button>
            <Text fontSize="sm">
              Página {page} de {pageCount}
            </Text>
            <Button
              isDisabled={page === pageCount}
              onClick={() => setPage(page + 1)}
              size="sm"
            >
              Próxima
            </Button>
          </HStack>
        )}
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
