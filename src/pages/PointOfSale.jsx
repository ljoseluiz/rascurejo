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
  Input,
  Select,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  HStack,
  Text,
  VStack,
  IconButton,
  Badge,
  Divider,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftElement,
  NumberInput,
  NumberInputField,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react'
import { FiSearch, FiPlus, FiMinus, FiTrash2, FiShoppingCart } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import PixPayment from '../components/PixPayment'

export default function PointOfSale() {
  const auth = useAuth()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isPixOpen, onOpen: onPixOpen, onClose: onPixClose } = useDisclosure()

  const [products, setProducts] = useState([])
  const [sellers, setSellers] = useState([])
  const [cart, setCart] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPixPayment, setShowPixPayment] = useState(false)

  const [saleData, setSaleData] = useState({
    customer_name: '',
    customer_cpf: '',
    seller_id: 1,
    channel: 'presencial',
    payment_method: 'dinheiro',
    discount: 0,
    notes: '',
  })

  useEffect(() => {
    loadProducts()
    loadSellers()
  }, [auth.csrfToken])

  const loadProducts = async (q = '') => {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get(`/products?q=${q}&active=true&limit=50`, opts)
      setProducts(data.items || [])
    } catch (error) {
      console.error('Erro ao carregar produtos', error)
    }
  }

  const loadSellers = async () => {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get('/sellers?active=true', opts)
      setSellers(data.items || [])
    } catch (error) {
      console.error('Erro ao carregar vendedores', error)
    }
  }

  const handleSearch = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.length >= 2) {
      loadProducts(query)
    } else if (query.length === 0) {
      loadProducts()
    }
  }

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.product_id === product.id)
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast({
          title: 'Estoque insuficiente',
          description: `Apenas ${product.stock} unidades disponíveis`,
          status: 'warning',
          duration: 3000,
        })
        return
      }
      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      if (product.stock === 0) {
        toast({
          title: 'Sem estoque',
          description: 'Produto sem estoque disponível',
          status: 'error',
          duration: 3000,
        })
        return
      }
      setCart([
        ...cart,
        {
          product_id: product.id,
          name: product.name,
          quantity: 1,
          unit_price: product.prices?.sale || 0,
          stock: product.stock,
        },
      ])
    }
  }

  const updateQuantity = (productId, newQuantity) => {
    const item = cart.find((i) => i.product_id === productId)
    if (newQuantity > item.stock) {
      toast({
        title: 'Estoque insuficiente',
        status: 'warning',
        duration: 2000,
      })
      return
    }
    
    if (newQuantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(
        cart.map((item) =>
          item.product_id === productId ? { ...item, quantity: newQuantity } : item
        )
      )
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product_id !== productId))
  }

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  }

  const calculateTax = () => {
    const subtotal = calculateSubtotal()
    const discount = parseFloat(saleData.discount) || 0
    return (subtotal - discount) * 0.08 // 8% de imposto
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discount = parseFloat(saleData.discount) || 0
    const tax = calculateTax()
    return subtotal - discount + tax
  }

  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione produtos ao carrinho',
        status: 'warning',
      })
      return
    }

    // Se for PIX, mostrar modal de pagamento PIX
    if (saleData.payment_method === 'pix') {
      setShowPixPayment(true)
      onPixOpen()
      return
    }

    // Para outros métodos, finalizar venda normalmente
    await completeAndFinalizeSale()
  }

  const completeAndFinalizeSale = async () => {
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const payload = {
        ...saleData,
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      }

      await api.post('/sales', payload, opts)

      toast({
        title: 'Venda finalizada!',
        description: `Total: ${calculateTotal().toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })}`,
        status: 'success',
        duration: 5000,
      })

      // Limpar carrinho e dados
      setCart([])
      setSaleData({
        customer_name: '',
        customer_cpf: '',
        seller_id: 1,
        channel: 'presencial',
        payment_method: 'dinheiro',
        discount: 0,
        notes: '',
      })
      onClose()
      setShowPixPayment(false)
      onPixClose()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message,
        status: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePixPaymentConfirmed = async () => {
    // Após pagamento PIX confirmado, finalizar venda
    await completeAndFinalizeSale()
  }

  const clearCart = () => {
    setCart([])
  }

  return (
    <Box p={6}>
      <Stack spacing={6}>
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="lg">PDV - Ponto de Venda</Heading>
          <HStack>
            <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
              {cart.length} {cart.length === 1 ? 'item' : 'itens'}
            </Badge>
            <Button
              colorScheme="green"
              size="lg"
              leftIcon={<FiShoppingCart />}
              onClick={onOpen}
              isDisabled={cart.length === 0}
            >
              Finalizar Venda
            </Button>
          </HStack>
        </HStack>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Products Panel */}
          <Card>
            <CardBody>
              <Stack spacing={4}>
                <Heading size="md">Produtos</Heading>
                
                {/* Search */}
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray" />
                  </InputLeftElement>
                  <Input
                    placeholder="Buscar produto por nome, SKU ou código de barras..."
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </InputGroup>

                {/* Products List */}
                <Box maxH="500px" overflowY="auto">
                  <Table variant="simple" size="sm">
                    <Thead position="sticky" top={0} bg="white" zIndex={1}>
                      <Tr>
                        <Th>Produto</Th>
                        <Th>Estoque</Th>
                        <Th isNumeric>Preço</Th>
                        <Th></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {products.map((product) => (
                        <Tr key={product.id}>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold" fontSize="sm">
                                {product.name}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                {product.sku}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={product.stock > 10 ? 'green' : product.stock > 0 ? 'orange' : 'red'}
                            >
                              {product.stock}
                            </Badge>
                          </Td>
                          <Td isNumeric fontWeight="bold" color="green.600">
                            {(product.prices?.sale || 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </Td>
                          <Td>
                            <IconButton
                              size="sm"
                              colorScheme="blue"
                              icon={<FiPlus />}
                              onClick={() => addToCart(product)}
                              isDisabled={product.stock === 0}
                            />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Stack>
            </CardBody>
          </Card>

          {/* Cart Panel */}
          <Card>
            <CardBody>
              <Stack spacing={4}>
                <HStack justify="space-between">
                  <Heading size="md">Carrinho</Heading>
                  {cart.length > 0 && (
                    <Button size="sm" variant="ghost" colorScheme="red" onClick={clearCart}>
                      Limpar
                    </Button>
                  )}
                </HStack>

                {cart.length === 0 ? (
                  <Box textAlign="center" py={10}>
                    <Text color="gray.500">Carrinho vazio</Text>
                    <Text fontSize="sm" color="gray.400">
                      Adicione produtos para iniciar a venda
                    </Text>
                  </Box>
                ) : (
                  <>
                    <Box maxH="300px" overflowY="auto">
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Item</Th>
                            <Th>Qtd</Th>
                            <Th isNumeric>Total</Th>
                            <Th></Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {cart.map((item) => (
                            <Tr key={item.product_id}>
                              <Td>
                                <Text fontSize="sm" fontWeight="bold">
                                  {item.name}
                                </Text>
                                <Text fontSize="xs" color="gray.600">
                                  {item.unit_price.toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })}
                                </Text>
                              </Td>
                              <Td>
                                <HStack spacing={1}>
                                  <IconButton
                                    size="xs"
                                    icon={<FiMinus />}
                                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                  />
                                  <Input
                                    size="xs"
                                    w="50px"
                                    textAlign="center"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0
                                      updateQuantity(item.product_id, val)
                                    }}
                                  />
                                  <IconButton
                                    size="xs"
                                    icon={<FiPlus />}
                                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                  />
                                </HStack>
                              </Td>
                              <Td isNumeric fontWeight="bold">
                                {(item.unit_price * item.quantity).toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </Td>
                              <Td>
                                <IconButton
                                  size="xs"
                                  colorScheme="red"
                                  variant="ghost"
                                  icon={<FiTrash2 />}
                                  onClick={() => removeFromCart(item.product_id)}
                                />
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
                        <Text fontWeight="bold">
                          {calculateSubtotal().toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </Text>
                      </HStack>

                      <HStack justify="space-between">
                        <Text>Desconto:</Text>
                        <NumberInput
                          size="sm"
                          w="120px"
                          min={0}
                          value={saleData.discount}
                          onChange={(val) => setSaleData({ ...saleData, discount: parseFloat(val) || 0 })}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </HStack>

                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          Impostos (8%):
                        </Text>
                        <Text fontSize="sm">
                          {calculateTax().toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </Text>
                      </HStack>

                      <Divider />

                      <HStack justify="space-between">
                        <Text fontSize="xl" fontWeight="bold">
                          TOTAL:
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold" color="green.600">
                          {calculateTotal().toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </Text>
                      </HStack>
                    </VStack>
                  </>
                )}
              </Stack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Stack>

      {/* Finalize Sale Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Finalizar Venda</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Cliente (Opcional)</FormLabel>
                <Input
                  placeholder="Nome do cliente"
                  value={saleData.customer_name}
                  onChange={(e) =>
                    setSaleData({ ...saleData, customer_name: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>CPF/CNPJ (Opcional)</FormLabel>
                <Input
                  placeholder="000.000.000-00"
                  value={saleData.customer_cpf}
                  onChange={(e) =>
                    setSaleData({ ...saleData, customer_cpf: e.target.value })
                  }
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Vendedor</FormLabel>
                <Select
                  value={saleData.seller_id}
                  onChange={(e) =>
                    setSaleData({ ...saleData, seller_id: parseInt(e.target.value) })
                  }
                >
                  {sellers.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      {seller.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Canal de Venda</FormLabel>
                <Select
                  value={saleData.channel}
                  onChange={(e) => setSaleData({ ...saleData, channel: e.target.value })}
                >
                  <option value="presencial">Presencial</option>
                  <option value="online">Online</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Forma de Pagamento</FormLabel>
                <Select
                  value={saleData.payment_method}
                  onChange={(e) =>
                    setSaleData({ ...saleData, payment_method: e.target.value })
                  }
                >
                  <option value="dinheiro">💵 Dinheiro</option>
                  <option value="cartao_credito">💳 Cartão de Crédito</option>
                  <option value="cartao_debito">💳 Cartão de Débito</option>
                  <option value="pix">📲 PIX</option>
                  <option value="boleto">📄 Boleto</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Observações</FormLabel>
                <Input
                  placeholder="Observações da venda"
                  value={saleData.notes}
                  onChange={(e) => setSaleData({ ...saleData, notes: e.target.value })}
                />
              </FormControl>

              <Box w="100%" p={4} bg="blue.50" rounded="md">
                <HStack justify="space-between">
                  <Text fontWeight="bold" fontSize="lg">
                    TOTAL A PAGAR:
                  </Text>
                  <Text fontWeight="bold" fontSize="2xl" color="green.600">
                    {calculateTotal().toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </Text>
                </HStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="green"
              onClick={handleFinalizeSale}
              isLoading={loading}
              size="lg"
            >
              Confirmar Venda
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Pagamento PIX */}
      <Modal isOpen={isPixOpen} onClose={() => {}} size="lg" isCentered closeOnEsc={false} closeOnOverlayClick={false}>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="white" borderRadius="lg" boxShadow="2xl">
          <ModalBody p={0}>
            {showPixPayment && (
              <PixPayment
                amount={calculateTotal()}
                onPaymentConfirmed={handlePixPaymentConfirmed}
                onCancel={() => {
                  setShowPixPayment(false)
                  onPixClose()
                }}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}
