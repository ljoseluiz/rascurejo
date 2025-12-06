import React, { useEffect, useState } from 'react'
import {
  Box,
  Input,
  Button,
  SimpleGrid,
  Text,
  Spinner,
  HStack,
  VStack,
  Heading,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Select,
  Badge,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  InputGroup,
  InputLeftElement,
  Grid,
  useToast
} from '@chakra-ui/react'
import { DeleteIcon, EditIcon, AddIcon, SearchIcon } from '@chakra-ui/icons'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import ProductForm from '../components/ProductForm'
import ProductCard from '../components/ProductCard'

/**
 * ProductsAdvanced.jsx
 * Página avançada de gestão de produtos com:
 * - Busca por nome, SKU, marca
 * - Filtros: categoria, marca, status ativo/inativo
 * - Listagem em tabela ou grid
 * - CRUD completo (criar, editar, deletar)
 * - Paginação
 * - Histórico de alterações
 */
export default function ProductsAdvanced() {
  const auth = useAuth()
  const toast = useToast()
  
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [viewMode, setViewMode] = useState('table') // 'table' ou 'grid'

  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)

  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure()
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure()

  // Carregar lista de produtos
  useEffect(() => {
    loadProducts()
  }, [q, category, brand, activeFilter, page, limit])

  // Carregar categorias e marcas
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          api.get('/products/categories'),
          api.get('/products/brands')
        ])
        setCategories(catsRes)
        setBrands(brandsRes)
      } catch (err) {
        console.error('Erro ao carregar metadados:', err)
      }
    }
    loadMetadata()
  }, [])

  async function loadProducts() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        q,
        page,
        limit
      })
      if (category) params.append('category', category)
      if (brand) params.append('brand', brand)
      if (activeFilter !== 'all') params.append('active', activeFilter === 'active')

      const data = await api.get(`/products?${params}`)
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Erro ao carregar produtos:', err)
      setError(err.message || 'Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(productId) {
    if (!window.confirm('Tem certeza que deseja deletar este produto?')) return

    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      await api.delete(`/products/${productId}`, {}, opts)
      toast({ title: 'Sucesso', description: 'Produto deletado', status: 'success', duration: 3000, isClosable: true })
      loadProducts()
    } catch (err) {
      toast({ title: 'Erro', description: err.message, status: 'error', duration: 3000, isClosable: true })
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const handleNewProduct = () => {
    setSelectedProduct(null)
    onFormOpen()
  }

  const handleEditProduct = (product) => {
    setSelectedProduct(product)
    onFormOpen()
  }

  const handleViewDetails = (product) => {
    setSelectedProduct(product)
    onDetailOpen()
  }

  const handleFormSubmit = () => {
    toast({ title: 'Sucesso', description: 'Produto salvo com sucesso', status: 'success', duration: 3000, isClosable: true })
    onFormClose()
    setPage(1)
    loadProducts()
  }

  return (
    <Box p={6} w="full">
      <Heading mb={6}>Gestão de Produtos</Heading>

      {/* Barra de Busca e Filtros */}
      <VStack spacing={4} mb={6} align="start" w="full">
        <HStack spacing={2} w="full">
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder="Buscar por nome, SKU ou marca..."
              bg="white"
            />
          </InputGroup>
          <Button colorScheme="blue" leftIcon={<AddIcon />} onClick={handleNewProduct}>
            Novo Produto
          </Button>
        </HStack>

        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr 1fr 1fr' }} gap={3} w="full">
          <Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
            placeholder="Filtrar por categoria"
            bg="white"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </Select>

          <Select
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value)
              setPage(1)
            }}
            placeholder="Filtrar por marca"
            bg="white"
          >
            {brands.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </Select>

          <Select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value)
              setPage(1)
            }}
            bg="white"
          >
            <option value="all">Todos (ativo/inativo)</option>
            <option value="active">Apenas Ativos</option>
            <option value="inactive">Apenas Inativos</option>
          </Select>

          <HStack spacing={2}>
            <Button
              variant={viewMode === 'table' ? 'solid' : 'outline'}
              colorScheme="blue"
              size="sm"
              onClick={() => setViewMode('table')}
            >
              Tabela
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'solid' : 'outline'}
              colorScheme="blue"
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
          </HStack>
        </Grid>
      </VStack>

      {/* Conteúdo */}
      {error && (
        <Box bg="red.50" p={4} borderRadius="md" mb={4} borderLeft="4px" borderColor="red.500">
          <Text color="red.600">Erro: {error}</Text>
        </Box>
      )}

      {loading ? (
        <Flex justify="center" align="center" h="400px">
          <Spinner size="xl" />
        </Flex>
      ) : items.length === 0 ? (
        <Box p={8} textAlign="center" borderWidth={1} borderRadius="md" borderColor="gray.200">
          <Text color="gray.500">Nenhum produto encontrado</Text>
        </Box>
      ) : viewMode === 'table' ? (
        // Visualização em Tabela
        <VStack spacing={4} w="full" align="start">
          <Box w="full" overflowX="auto" borderWidth={1} borderRadius="md" borderColor="gray.200">
            <Table size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>SKU</Th>
                  <Th>Nome</Th>
                  <Th>Categoria</Th>
                  <Th>Marca</Th>
                  <Th>Preço Venda</Th>
                  <Th>Estoque</Th>
                  <Th>Status</Th>
                  <Th>Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {items.map(product => (
                  <Tr key={product.id} _hover={{ bg: 'gray.50' }}>
                    <Td fontWeight="bold">{product.sku}</Td>
                    <Td>{product.name}</Td>
                    <Td>{product.category}</Td>
                    <Td>{product.brand}</Td>
                    <Td>R$ {(product.prices?.sale || 0).toFixed(2)}</Td>
                    <Td>
                      <Badge colorScheme={product.stock > 10 ? 'green' : product.stock > 0 ? 'yellow' : 'red'}>
                        {product.stock} un
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={product.active ? 'green' : 'gray'}>
                        {product.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <IconButton
                          icon={<EditIcon />}
                          size="sm"
                          colorScheme="blue"
                          variant="ghost"
                          onClick={() => handleEditProduct(product)}
                        />
                        <IconButton
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDelete(product.id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>

          {/* Paginação */}
          <HStack spacing={4} w="full" justify="center">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              isDisabled={page === 1}
            >
              Anterior
            </Button>
            <Text>
              Página {page} de {totalPages} ({total} produtos)
            </Text>
            <Button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              isDisabled={page === totalPages}
            >
              Próxima
            </Button>
          </HStack>
        </VStack>
      ) : (
        // Visualização em Grid
        <VStack spacing={4} align="start" w="full">
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} w="full">
            {items.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => handleEditProduct(product)}
                onDelete={() => handleDelete(product.id)}
                onView={() => handleViewDetails(product)}
              />
            ))}
          </SimpleGrid>

          {/* Paginação */}
          <HStack spacing={4} w="full" justify="center">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              isDisabled={page === 1}
            >
              Anterior
            </Button>
            <Text>
              Página {page} de {totalPages} ({total} produtos)
            </Text>
            <Button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              isDisabled={page === totalPages}
            >
              Próxima
            </Button>
          </HStack>
        </VStack>
      )}

      {/* Modal para Criar/Editar Produto */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="2xl">
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader>{selectedProduct?.id ? 'Editar Produto' : 'Novo Produto'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <ProductForm
              product={selectedProduct}
              onSubmit={handleFormSubmit}
              onCancel={onFormClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal para Visualizar Detalhes */}
      {selectedProduct && (
        <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Detalhes do Produto</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="start">
                <Box>
                  <Text fontSize="sm" color="gray.600">Nome</Text>
                  <Heading size="md">{selectedProduct.name}</Heading>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">SKU</Text>
                  <Text fontWeight="bold">{selectedProduct.sku}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">Categoria</Text>
                  <Text>{selectedProduct.category} / {selectedProduct.subcategory}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">Marca / Fornecedor</Text>
                  <Text>{selectedProduct.brand} / {selectedProduct.supplier}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">Preços</Text>
                  <VStack align="start" spacing={1}>
                    <Text>Venda: R$ {selectedProduct.prices?.sale?.toFixed(2)}</Text>
                    <Text>Promoção: R$ {selectedProduct.prices?.promotion?.toFixed(2)}</Text>
                    <Text>Atacado: R$ {selectedProduct.prices?.wholesale?.toFixed(2)}</Text>
                  </VStack>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">Estoque</Text>
                  <Badge colorScheme={selectedProduct.stock > 0 ? 'green' : 'red'}>
                    {selectedProduct.stock} {selectedProduct.unit}
                  </Badge>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onDetailClose}>Fechar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  )
}
