import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Heading,
  HStack,
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
  Input,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  FormControl,
  FormLabel,
  Select,
} from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const typeLabels = {
  entry: 'Entrada',
  exit: 'Saída',
  transfer: 'Transferência',
}

export default function CashBox() {
  const auth = useAuth()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [cashBoxes, setCashBoxes] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalBalance, setTotalBalance] = useState(0)
  const [selectedBox, setSelectedBox] = useState(null)
  const [showMovements, setShowMovements] = useState(false)

  const [form, setForm] = useState({
    type: 'entry',
    category: '',
    amount: '',
    description: '',
    reference: '',
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

      const balance = (data.items || []).reduce((sum, b) => sum + b.balance, 0)
      setTotalBalance(balance)
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

  const handleRecordMovement = async () => {
    if (!selectedBox || !form.type || !form.amount) {
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
        cash_box_id: selectedBox.id,
        type: form.type,
        category: form.category,
        amount: parseFloat(form.amount),
        description: form.description,
        reference: form.reference,
      }, opts)

      toast({
        title: 'Sucesso',
        description: 'Movimentação registrada',
        status: 'success',
        duration: 3000,
      })

      setForm({
        type: 'entry',
        category: '',
        amount: '',
        description: '',
        reference: '',
      })
      setSelectedBox(null)
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

  const handleViewMovements = async (box) => {
    setSelectedBox(box)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get(`/financial/cash-boxes/${box.id}/balance`, opts)
      setMovements(data.movements || [])
      setShowMovements(true)
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message,
        status: 'error',
      })
    }
  }

  return (
    <Box p={6}>
      <Stack spacing={6}>
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="lg">Caixa</Heading>
          <Button colorScheme="green" size="md" onClick={onOpen}>
            + Registrar Movimentação
          </Button>
        </HStack>

        {/* Total Balance Card */}
        <Card bg="blue.50">
          <CardBody>
            <Stat>
              <StatLabel>Saldo Total em Caixa</StatLabel>
              <StatNumber color="blue.600" fontSize="4xl">
                {totalBalance.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>

        {/* Cash Boxes Grid */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          {loading ? (
            <Text>Carregando caixas...</Text>
          ) : cashBoxes.length === 0 ? (
            <Text>Nenhuma caixa configurada</Text>
          ) : (
            cashBoxes.map((box) => (
              <Card key={box.id} borderLeft="4px" borderColor="blue.400">
                <CardBody>
                  <VStack align="start" spacing={3}>
                    <Box>
                      <Text fontSize="sm" color="gray.500">
                        {box.type === 'cash' ? '💰 Caixa Física' : '🏦 Conta Bancária'}
                      </Text>
                      <Heading size="md">{box.name}</Heading>
                    </Box>
                    <Box>
                      <Text fontSize="lg" fontWeight="bold">
                        {box.balance.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </Text>
                    </Box>
                    <Badge colorScheme={box.active ? 'green' : 'red'}>
                      {box.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <ButtonGroup size="sm" w="100%">
                      <Button
                        flex={1}
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => handleViewMovements(box)}
                      >
                        Movimentações
                      </Button>
                      <Button
                        flex={1}
                        colorScheme="green"
                        onClick={() => {
                          setSelectedBox(box)
                          onOpen()
                        }}
                      >
                        Registrar
                      </Button>
                    </ButtonGroup>
                  </VStack>
                </CardBody>
              </Card>
            ))
          )}
        </SimpleGrid>

        {/* Movements Table */}
        {showMovements && selectedBox && (
          <Box>
            <HStack justify="space-between" mb={4}>
              <Heading size="md">
                Movimentações - {selectedBox.name}
              </Heading>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowMovements(false)}
              >
                Fechar
              </Button>
            </HStack>

            <Box overflowX="auto">
              <Table variant="striped" size="sm">
                <Thead>
                  <Tr>
                    <Th>Data</Th>
                    <Th>Tipo</Th>
                    <Th>Categoria</Th>
                    <Th>Valor</Th>
                    <Th>Descrição</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {movements.length === 0 ? (
                    <Tr>
                      <Td colSpan={5} textAlign="center">
                        Nenhuma movimentação
                      </Td>
                    </Tr>
                  ) : (
                    movements.map((mov) => (
                      <Tr key={mov.id}>
                        <Td fontSize="sm">
                          {new Date(mov.created_at).toLocaleDateString('pt-BR')}
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={
                              mov.type === 'entry'
                                ? 'green'
                                : mov.type === 'exit'
                                ? 'red'
                                : 'blue'
                            }
                          >
                            {typeLabels[mov.type]}
                          </Badge>
                        </Td>
                        <Td fontSize="sm">{mov.category}</Td>
                        <Td fontWeight="bold">
                          {mov.amount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </Td>
                        <Td fontSize="sm">{mov.description}</Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          </Box>
        )}
      </Stack>

      {/* Record Movement Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Registrar Movimentação
            {selectedBox && ` - ${selectedBox.name}`}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Tipo</FormLabel>
                <Select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value })
                  }
                >
                  <option value="entry">Entrada</option>
                  <option value="exit">Saída</option>
                  <option value="transfer">Transferência</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Categoria</FormLabel>
                <Select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="Selecione a categoria"
                >
                  <option value="sales">Vendas</option>
                  <option value="supplies">Compras</option>
                  <option value="salary">Salários</option>
                  <option value="rent">Aluguel</option>
                  <option value="utilities">Utilidades</option>
                  <option value="transfer">Transferência</option>
                  <option value="other">Outro</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Valor</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Descrição</FormLabel>
                <Input
                  placeholder="Ex: Venda no caixa"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Referência</FormLabel>
                <Input
                  placeholder="Ex: Número do recibo"
                  value={form.reference}
                  onChange={(e) =>
                    setForm({ ...form, reference: e.target.value })
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
              <Button
                colorScheme="green"
                onClick={handleRecordMovement}
              >
                Registrar
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
