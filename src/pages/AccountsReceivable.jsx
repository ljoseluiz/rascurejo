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
  received: 'green',
}

const statusLabels = {
  pending: 'Pendente',
  overdue: 'Vencido',
  received: 'Recebido',
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
  const [formData, setFormData] = useState({
    customer_name: '',
    amount: '',
    due_date: '',
    payment_method: 'check',
    description: '',
    installments: '1',
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
        description: `Pagamento marcado como recebido`,
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
        description: formData.description,
        installments: parseInt(formData.installments),
      }, opts)

      toast({
        title: 'Sucesso',
        description: 'Cobrança criada com sucesso',
        status: 'success',
        duration: 3000,
      })

      setFormData({
        customer_name: '',
        amount: '',
        due_date: '',
        payment_method: 'check',
        description: '',
        installments: '1',
      })
      onFormClose()
      loadReceivables()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao criar cobrança',
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
          <Heading size="lg">Contas a Receber</Heading>
          <Button colorScheme="green" size="md" onClick={onFormOpen}>
            + Nova Cobrança
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
                <StatLabel>Recebido</StatLabel>
                <StatNumber color="green.600">
                  {(summary.received || 0).toLocaleString('pt-BR', {
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
            <option value="received">Recebido</option>
          </Select>
        </HStack>

        {/* Table */}
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
                    Nenhuma cobrança encontrada
                  </Td>
                </Tr>
              ) : (
                receivables.map((receivable) => (
                  <Tr key={receivable.id}>
                    <Td>{receivable.customer_name}</Td>
                    <Td>
                      {receivable.amount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </Td>
                    <Td>{receivable.due_date}</Td>
                    <Td>{receivable.installments}</Td>
                    <Td>
                      <Badge colorScheme={statusColors[receivable.status]}>
                        {statusLabels[receivable.status]}
                      </Badge>
                    </Td>
                    <Td>
                      <ButtonGroup size="sm" spacing={2}>
                        {receivable.status !== 'received' && (
                          <Button
                            colorScheme="green"
                            onClick={() => {
                              setSelectedReceivable(receivable)
                              onOpen()
                            }}
                          >
                            Marcar Recebido
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

      {/* Mark as Received Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar Recebimento</ModalHeader>
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
            </VStack>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                colorScheme="green"
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
          <ModalHeader>Nova Cobrança</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nome do Cliente</FormLabel>
                <Input
                  placeholder="Ex: Empresa XYZ"
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
                  <option value="check">Cheque</option>
                  <option value="transfer">Transferência</option>
                  <option value="cash">Dinheiro</option>
                  <option value="card">Cartão</option>
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
              <Button colorScheme="green" onClick={handleCreateReceivable}>
                Salvar
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
