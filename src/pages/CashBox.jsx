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
  Divider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const movementTypeColors = {
  entry: 'green',
  exit: 'red',
  transfer: 'blue',
}

const movementTypeLabels = {
  entry: 'Entrada',
  exit: 'Saída',
  transfer: 'Transferência',
}

export default function CashBox() {
  const auth = useAuth()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isTransferOpen, onOpen: onTransferOpen, onClose: onTransferClose } = useDisclosure()
  const { isOpen: isCloseOpen, onOpen: onCloseOpen, onClose: onCloseClose } = useDisclosure()

  const [cashBoxes, setCashBoxes] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBox, setSelectedBox] = useState(null)
  const [activeTab, setActiveTab] = useState(0)

  const [formData, setFormData] = useState({
    cash_box_id: '',
    type: 'entry',
    category: 'sales',
    amount: '',
    description: '',
    reference: '',
  })

  const [transferData, setTransferData] = useState({
    from_cash_box_id: '',
    to_cash_box_id: '',
    amount: '',
    description: '',
  })

  const [closeData, setCloseData] = useState({
    cash_box_id: '',
    opening_balance: '',
    closing_balance: '',
    expected_balance: '',
    difference: '',
    notes: '',
  })

  useEffect(() => {
    loadCashBoxes()
  }, [auth.csrfToken])

  const loadCashBoxes = async () => {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get('/financial/cash-boxes', opts)
      setCashBoxes(data.items || [])
      
      if (data.items && data.items.length > 0) {
        setSelectedBox(data.items[0])
        loadMovements(data.items[0].id)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao carregar caixas',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMovements = async (boxId) => {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get(`/financial/cash-boxes/${boxId}/balance`, opts)
      setMovements(data.movements || [])
    } catch (error) {
      console.error('Erro ao carregar movimentos', error)
    }
  }

  const handleAddMovement = async () => {
    if (!formData.cash_box_id || !formData.amount) {
      toast({
        title: 'Validação',
        description: 'Preencha todos os campos obrigatórios',
        status: 'warning',
      })
      return
    }

    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      await api.post('/financial/cash-movements', {
        cash_box_id: parseInt(formData.cash_box_id),
        type: formData.type,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        reference: formData.reference,
      }, opts)

      toast({
        title: 'Sucesso',
        description: 'Movimento registrado com sucesso',
        status: 'success',
        duration: 3000,
      })

      setFormData({
        cash_box_id: '',
        type: 'entry',
        category: 'sales',
        amount: '',
        description: '',
        reference: '',
      })
      onClose()
      loadCashBoxes()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message,
        status: 'error',
      })
    }
  }

  const handleTransfer = async () => {
    if (!transferData.from_cash_box_id || !transferData.to_cash_box_id || !transferData.amount) {
      toast({
        title: 'Validação',
        description: 'Preencha todos os campos obrigatórios',
        status: 'warning',
      })
      return
    }

    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      
      // Saída do caixa de origem
      await api.post('/financial/cash-movements', {
        cash_box_id: parseInt(transferData.from_cash_box_id),
        type: 'transfer',
        category: 'transfer',
        amount: parseFloat(transferData.amount),
        description: `Transferência para Caixa ${transferData.to_cash_box_id}`,
        reference: `TRANSFER-${Date.now()}`,
      }, opts)

      // Entrada no caixa de destino
      await api.post('/financial/cash-movements', {
        cash_box_id: parseInt(transferData.to_cash_box_id),
        type: 'entry',
        category: 'transfer',
        amount: parseFloat(transferData.amount),
        description: `Transferência recebida de Caixa ${transferData.from_cash_box_id}`,
        reference: `TRANSFER-${Date.now()}`,
      }, opts)

      toast({
        title: 'Sucesso',
        description: 'Transferência realizada com sucesso',
        status: 'success',
        duration: 3000,
      })

      setTransferData({
        from_cash_box_id: '',
        to_cash_box_id: '',
        amount: '',
        description: '',
      })
      onTransferClose()
      loadCashBoxes()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message,
        status: 'error',
      })
    }
  }

  const handleCloseCashBox = async () => {
    if (!closeData.cash_box_id || closeData.closing_balance === '') {
      toast({
        title: 'Validação',
        description: 'Preencha todos os campos obrigatórios',
        status: 'warning',
      })
      return
    }

    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const closingBalance = parseFloat(closeData.closing_balance)
      const expectedBalance = parseFloat(closeData.expected_balance)
      const difference = closingBalance - expectedBalance

      await api.post('/financial/cash-movements', {
        cash_box_id: parseInt(closeData.cash_box_id),
        type: difference > 0 ? 'entry' : 'exit',
        category: 'closing_adjustment',
        amount: Math.abs(difference),
        description: `Fechamento de caixa - Diferença: ${difference > 0 ? '+' : ''}${difference.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        reference: `CLOSE-${new Date().toISOString().split('T')[0]}`,
      }, opts)

      toast({
        title: 'Sucesso',
        description: `Caixa fechado. Diferença: ${difference.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        status: 'success',
        duration: 3000,
      })

      setCloseData({
        cash_box_id: '',
        opening_balance: '',
        closing_balance: '',
        expected_balance: '',
        difference: '',
        notes: '',
      })
      onCloseClose()
      loadCashBoxes()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message,
        status: 'error',
      })
    }
  }

  const totalEntries = movements
    .filter(m => m.type === 'entry')
    .reduce((sum, m) => sum + m.amount, 0)

  const totalExits = movements
    .filter(m => m.type === 'exit')
    .reduce((sum, m) => sum + m.amount, 0)

  const totalTransfers = movements
    .filter(m => m.type === 'transfer')
    .reduce((sum, m) => sum + m.amount, 0)

  const netMovement = totalEntries - totalExits - totalTransfers

  return (
    <Box p={6}>
      <Stack spacing={6}>
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="lg">Caixa</Heading>
          <HStack spacing={2}>
            <Button colorScheme="green" size="md" onClick={onOpen}>
              + Entrada/Saída
            </Button>
            <Button colorScheme="blue" size="md" onClick={onTransferOpen}>
              ⇄ Transferência
            </Button>
            <Button colorScheme="purple" size="md" onClick={onCloseOpen}>
              📊 Fechamento Diário
            </Button>
          </HStack>
        </HStack>

        {/* Summary Cards */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Saldo Total</StatLabel>
                <StatNumber color="blue.600">
                  {(cashBoxes.reduce((sum, c) => sum + c.balance, 0) || 0).toLocaleString('pt-BR', {
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
                <StatLabel>Entradas (Hoje)</StatLabel>
                <StatNumber color="green.600" fontSize="sm">
                  {totalEntries.toLocaleString('pt-BR', {
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
                <StatLabel>Saídas (Hoje)</StatLabel>
                <StatNumber color="red.600" fontSize="sm">
                  {totalExits.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card bg="blue.50">
            <CardBody>
              <Stat>
                <StatLabel>Movimento Líquido</StatLabel>
                <StatNumber color={netMovement >= 0 ? 'green.600' : 'red.600'} fontSize="sm">
                  {netMovement.toLocaleString('pt-BR', {
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
            <Tab>Caixas</Tab>
            <Tab>Movimentos do Dia</Tab>
            <Tab>Relatório de Movimentos</Tab>
          </TabList>

          <TabPanels>
            {/* ABA 1: Caixas */}
            <TabPanel>
              <Stack spacing={4}>
                <Box overflowX="auto">
                  <Table variant="striped">
                    <Thead>
                      <Tr>
                        <Th>Caixa</Th>
                        <Th>Tipo</Th>
                        <Th>Saldo Atual</Th>
                        <Th>Responsável</Th>
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
                      ) : cashBoxes.length === 0 ? (
                        <Tr>
                          <Td colSpan={6} textAlign="center">
                            Nenhum caixa cadastrado
                          </Td>
                        </Tr>
                      ) : (
                        cashBoxes.map((box) => (
                          <Tr key={box.id}>
                            <Td fontWeight="bold">{box.name}</Td>
                            <Td>{box.type === 'physical' ? '🏪 Físico' : '💻 Virtual'}</Td>
                            <Td fontWeight="bold" color="blue.600">
                              {box.balance.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })}
                            </Td>
                            <Td>{box.responsible || '-'}</Td>
                            <Td>
                              <Badge colorScheme={box.status === 'open' ? 'green' : 'red'}>
                                {box.status === 'open' ? 'Aberto' : 'Fechado'}
                              </Badge>
                            </Td>
                            <Td>
                              <ButtonGroup size="sm" spacing={1}>
                                <Button
                                  colorScheme="blue"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedBox(box)
                                    loadMovements(box.id)
                                    setActiveTab(1)
                                  }}
                                >
                                  Ver Movimentos
                                </Button>
                              </ButtonGroup>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </Stack>
            </TabPanel>

            {/* ABA 2: Movimentos do Dia */}
            <TabPanel>
              <Stack spacing={4}>
                {selectedBox && (
                  <>
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="bold">{selectedBox.name}</Text>
                        <Text fontSize="sm">
                          Saldo: {selectedBox.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Text>
                      </Box>
                    </Alert>

                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <Card bg="green.50">
                        <CardBody>
                          <Text fontSize="sm" color="gray.600">Entradas</Text>
                          <Text fontSize="2xl" fontWeight="bold" color="green.600">
                            {totalEntries.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </Text>
                        </CardBody>
                      </Card>
                      <Card bg="red.50">
                        <CardBody>
                          <Text fontSize="sm" color="gray.600">Saídas</Text>
                          <Text fontSize="2xl" fontWeight="bold" color="red.600">
                            {totalExits.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </Text>
                        </CardBody>
                      </Card>
                      <Card bg="blue.50">
                        <CardBody>
                          <Text fontSize="sm" color="gray.600">Transferências</Text>
                          <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                            {totalTransfers.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </Text>
                        </CardBody>
                      </Card>
                    </SimpleGrid>

                    <Divider />

                    <Box overflowX="auto">
                      <Table variant="striped" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Horário</Th>
                            <Th>Tipo</Th>
                            <Th>Categoria</Th>
                            <Th>Valor</Th>
                            <Th>Descrição</Th>
                            <Th>Usuário</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {movements.length === 0 ? (
                            <Tr>
                              <Td colSpan={6} textAlign="center">
                                Nenhum movimento registrado
                              </Td>
                            </Tr>
                          ) : (
                            movements.map((m) => (
                              <Tr key={m.id}>
                                <Td fontSize="sm">
                                  {new Date(m.created_at).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Td>
                                <Td>
                                  <Badge colorScheme={movementTypeColors[m.type]}>
                                    {movementTypeLabels[m.type]}
                                  </Badge>
                                </Td>
                                <Td fontSize="sm" textTransform="capitalize">
                                  {m.category}
                                </Td>
                                <Td fontWeight="bold" color={m.type === 'entry' ? 'green.600' : 'red.600'}>
                                  {(m.type === 'entry' ? '+' : '-')}
                                  {m.amount.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })}
                                </Td>
                                <Td fontSize="sm">{m.description}</Td>
                                <Td fontSize="xs">{m.created_by}</Td>
                              </Tr>
                            ))
                          )}
                        </Tbody>
                      </Table>
                    </Box>
                  </>
                )}
              </Stack>
            </TabPanel>

            {/* ABA 3: Relatório de Movimentos */}
            <TabPanel>
              <Stack spacing={4}>
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Resumo Consolidado</Text>
                    <Text fontSize="sm">Todos os caixas e tipos de movimento</Text>
                  </Box>
                </Alert>

                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>Saldo Geral</StatLabel>
                        <StatNumber color="blue.600" fontSize="2xl">
                          {(cashBoxes.reduce((sum, c) => sum + c.balance, 0) || 0).toLocaleString('pt-BR', {
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
                        <StatLabel>Caixas Abertos</StatLabel>
                        <StatNumber color="green.600" fontSize="2xl">
                          {cashBoxes.filter(c => c.status === 'open').length}
                        </StatNumber>
                      </Stat>
                    </CardBody>
                  </Card>
                  <Card bg="red.50">
                    <CardBody>
                      <Stat>
                        <StatLabel>Caixas Fechados</StatLabel>
                        <StatNumber color="red.600" fontSize="2xl">
                          {cashBoxes.filter(c => c.status === 'closed').length}
                        </StatNumber>
                      </Stat>
                    </CardBody>
                  </Card>
                  <Card bg="purple.50">
                    <CardBody>
                      <Stat>
                        <StatLabel>Total de Caixas</StatLabel>
                        <StatNumber color="purple.600" fontSize="2xl">
                          {cashBoxes.length}
                        </StatNumber>
                      </Stat>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                <Divider />

                <Box overflowX="auto">
                  <Table variant="striped" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Caixa</Th>
                        <Th>Saldo</Th>
                        <Th>Movimentações</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {cashBoxes.map((box) => (
                        <Tr key={box.id}>
                          <Td fontWeight="bold">{box.name}</Td>
                          <Td>
                            {box.balance.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </Td>
                          <Td fontSize="sm">{movements.filter(m => m.cash_box_id === box.id).length}</Td>
                          <Td>
                            <Badge colorScheme={box.status === 'open' ? 'green' : 'red'}>
                              {box.status === 'open' ? 'Aberto' : 'Fechado'}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Stack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>

      {/* Add Movement Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Entrada/Saída</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Caixa</FormLabel>
                <Select
                  placeholder="Selecione um caixa"
                  value={formData.cash_box_id}
                  onChange={(e) =>
                    setFormData({ ...formData, cash_box_id: e.target.value })
                  }
                >
                  {cashBoxes.map((box) => (
                    <option key={box.id} value={box.id}>
                      {box.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Tipo de Movimento</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  <option value="entry">Entrada</option>
                  <option value="exit">Saída</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Categoria</FormLabel>
                <Select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  <option value="sales">Vendas</option>
                  <option value="return">Devoluções</option>
                  <option value="supplier">Fornecedor</option>
                  <option value="expense">Despesa</option>
                  <option value="other">Outro</option>
                </Select>
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

              <FormControl>
                <FormLabel>Descrição</FormLabel>
                <Input
                  placeholder="Descrição do movimento"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Referência</FormLabel>
                <Input
                  placeholder="Referência (NF, Cheque, etc)"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button colorScheme="green" onClick={handleAddMovement}>
                Registrar
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={isTransferOpen} onClose={onTransferClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transferência entre Caixas</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>De (Caixa Origem)</FormLabel>
                <Select
                  placeholder="Selecione o caixa de origem"
                  value={transferData.from_cash_box_id}
                  onChange={(e) =>
                    setTransferData({ ...transferData, from_cash_box_id: e.target.value })
                  }
                >
                  {cashBoxes.map((box) => (
                    <option key={box.id} value={box.id}>
                      {box.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Para (Caixa Destino)</FormLabel>
                <Select
                  placeholder="Selecione o caixa de destino"
                  value={transferData.to_cash_box_id}
                  onChange={(e) =>
                    setTransferData({ ...transferData, to_cash_box_id: e.target.value })
                  }
                >
                  {cashBoxes.map((box) => (
                    <option key={box.id} value={box.id}>
                      {box.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Valor</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={transferData.amount}
                  onChange={(e) =>
                    setTransferData({ ...transferData, amount: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Descrição</FormLabel>
                <Input
                  placeholder="Motivo da transferência"
                  value={transferData.description}
                  onChange={(e) =>
                    setTransferData({ ...transferData, description: e.target.value })
                  }
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button variant="outline" onClick={onTransferClose}>
                Cancelar
              </Button>
              <Button colorScheme="blue" onClick={handleTransfer}>
                Transferir
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Close Cash Box Modal */}
      <Modal isOpen={isCloseOpen} onClose={onCloseClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Fechamento de Caixa Diário</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Atenção</Text>
                  <Text fontSize="sm">Confira o saldo físico antes de fechar</Text>
                </Box>
              </Alert>

              <FormControl isRequired>
                <FormLabel>Caixa</FormLabel>
                <Select
                  placeholder="Selecione um caixa"
                  value={closeData.cash_box_id}
                  onChange={(e) => {
                    const boxId = parseInt(e.target.value)
                    const box = cashBoxes.find(c => c.id === boxId)
                    setCloseData({
                      ...closeData,
                      cash_box_id: e.target.value,
                      opening_balance: box?.balance || 0,
                      expected_balance: box?.balance || 0,
                    })
                  }}
                >
                  {cashBoxes.map((box) => (
                    <option key={box.id} value={box.id}>
                      {box.name} - {box.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Saldo Esperado</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  isReadOnly
                  value={closeData.expected_balance}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Saldo Físico (Contado)</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={closeData.closing_balance}
                  onChange={(e) => {
                    const closing = parseFloat(e.target.value) || 0
                    const expected = parseFloat(closeData.expected_balance) || 0
                    setCloseData({
                      ...closeData,
                      closing_balance: e.target.value,
                      difference: (closing - expected).toString(),
                    })
                  }}
                />
              </FormControl>

              {closeData.difference && (
                <Alert status={Math.abs(parseFloat(closeData.difference)) > 0 ? 'warning' : 'success'}>
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">
                      Diferença: {(parseFloat(closeData.difference) || 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </Text>
                    <Text fontSize="sm">
                      {Math.abs(parseFloat(closeData.difference)) > 0 
                        ? parseFloat(closeData.difference) > 0 
                          ? 'Sobra' 
                          : 'Falta'
                        : 'Sem diferença'}
                    </Text>
                  </Box>
                </Alert>
              )}

              <FormControl>
                <FormLabel>Observações</FormLabel>
                <Input
                  placeholder="Observações do fechamento"
                  value={closeData.notes}
                  onChange={(e) =>
                    setCloseData({ ...closeData, notes: e.target.value })
                  }
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button variant="outline" onClick={onCloseClose}>
                Cancelar
              </Button>
              <Button colorScheme="purple" onClick={handleCloseCashBox}>
                Fechar Caixa
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
