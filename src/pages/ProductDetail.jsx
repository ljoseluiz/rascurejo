import React, { useEffect, useState } from 'react'
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  VStack,
  HStack,
  Button,
  Spinner,
  Text,
  Table,
  Tbody,
  Tr,
  Td,
  Badge,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter
} from '@chakra-ui/react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import ProductForm from '../components/ProductForm'

/**
 * ProductDetail.jsx
 * Página de detalhe e edição de produto com abas:
 * - Informações gerais
 * - Preços
 * - Variações
 * - Imagens
 * - Histórico de alterações
 */
export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const auth = useAuth()
  const toast = useToast()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()

  useEffect(() => {
    loadProduct()
  }, [id])

  async function loadProduct() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get(`/products/${id}`)
      setProduct(data)
    } catch (err) {
      console.error('Erro ao carregar produto:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Tem certeza que deseja deletar este produto?')) return

    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      await api.delete(`/products/${id}`, {}, opts)
      toast({ title: 'Sucesso', description: 'Produto deletado', status: 'success', duration: 3000, isClosable: true })
      navigate('/products-advanced')
    } catch (err) {
      toast({ title: 'Erro', description: err.message, status: 'error', duration: 3000, isClosable: true })
    }
  }

  const handleFormSubmit = () => {
    onEditClose()
    loadProduct()
    toast({ title: 'Sucesso', description: 'Produto atualizado', status: 'success', duration: 3000, isClosable: true })
  }

  if (loading) {
    return (
      <Box p={6} display="flex" justifyContent="center" alignItems="center" h="400px">
        <Spinner size="xl" />
      </Box>
    )
  }

  if (error || !product) {
    return (
      <Box p={6}>
        <Text color="red.600">Erro: {error || 'Produto não encontrado'}</Text>
        <Button mt={4} onClick={() => navigate('/products-advanced')}>Voltar</Button>
      </Box>
    )
  }

  return (
    <Box p={6} w="full">
      {/* Cabeçalho */}
      <HStack justify="space-between" mb={6} align="start">
        <Box>
          <Heading mb={2}>{product.name}</Heading>
          <HStack spacing={3}>
            <Text fontSize="sm" color="gray.600">SKU: <strong>{product.sku}</strong></Text>
            <Badge colorScheme={product.active ? 'green' : 'gray'}>
              {product.active ? 'Ativo' : 'Inativo'}
            </Badge>
          </HStack>
        </Box>
        <HStack spacing={2}>
          <Button colorScheme="blue" onClick={onEditOpen}>Editar</Button>
          <Button colorScheme="red" onClick={handleDelete}>Deletar</Button>
          <Button variant="outline" onClick={() => navigate('/products-advanced')}>Voltar</Button>
        </HStack>
      </HStack>

      {/* Abas */}
      <Tabs colorScheme="blue">
        <TabList>
          <Tab>Informações</Tab>
          <Tab>Preços</Tab>
          <Tab>Variações</Tab>
          <Tab>Imagens</Tab>
          <Tab>Histórico</Tab>
        </TabList>

        <TabPanels>
          {/* Aba: Informações */}
          <TabPanel>
            <VStack align="start" spacing={4}>
              <HStack spacing={6} w="full">
                <Box flex="1">
                  <Text fontSize="sm" color="gray.600">Categoria</Text>
                  <Text fontWeight="bold">{product.category}</Text>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm" color="gray.600">Subcategoria</Text>
                  <Text fontWeight="bold">{product.subcategory || '-'}</Text>
                </Box>
              </HStack>

              <HStack spacing={6} w="full">
                <Box flex="1">
                  <Text fontSize="sm" color="gray.600">Marca</Text>
                  <Text fontWeight="bold">{product.brand}</Text>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm" color="gray.600">Fornecedor</Text>
                  <Text fontWeight="bold">{product.supplier || '-'}</Text>
                </Box>
              </HStack>

              <HStack spacing={6} w="full">
                <Box flex="1">
                  <Text fontSize="sm" color="gray.600">Código de Barras</Text>
                  <Text fontWeight="bold">{product.barcode || '-'}</Text>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm" color="gray.600">Unidade de Medida</Text>
                  <Text fontWeight="bold">{product.unit}</Text>
                </Box>
              </HStack>

              <Box w="full">
                <Text fontSize="sm" color="gray.600">Descrição</Text>
                <Text mt={2}>{product.description || '-'}</Text>
              </Box>

              <HStack spacing={6} w="full">
                <Box flex="1">
                  <Text fontSize="sm" color="gray.600">Estoque</Text>
                  <Badge colorScheme={product.stock > 10 ? 'green' : product.stock > 0 ? 'yellow' : 'red'} fontSize="md" py={1} px={2}>
                    {product.stock} {product.unit}
                  </Badge>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm" color="gray.600">Criado em</Text>
                  <Text>{new Date(product.createdAt).toLocaleDateString('pt-BR')}</Text>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm" color="gray.600">Atualizado em</Text>
                  <Text>{new Date(product.updatedAt).toLocaleDateString('pt-BR')}</Text>
                </Box>
              </HStack>
            </VStack>
          </TabPanel>

          {/* Aba: Preços */}
          <TabPanel>
            <VStack align="start" spacing={4}>
              <Box w="full" p={4} bg="blue.50" borderRadius="md">
                <Text fontSize="sm" color="gray.600">Preço de Venda</Text>
                <Heading size="lg" color="blue.600">
                  R$ {(product.prices?.sale || 0).toFixed(2)}
                </Heading>
              </Box>

              <Box w="full" p={4} bg="green.50" borderRadius="md">
                <Text fontSize="sm" color="gray.600">Preço de Promoção</Text>
                <Heading size="lg" color="green.600">
                  R$ {(product.prices?.promotion || 0).toFixed(2)}
                </Heading>
                {product.prices?.promotion && product.prices?.promotion < product.prices?.sale && (
                  <Text fontSize="sm" color="green.600" mt={2}>
                    Desconto: {(((product.prices.sale - product.prices.promotion) / product.prices.sale) * 100).toFixed(1)}%
                  </Text>
                )}
              </Box>

              <Box w="full" p={4} bg="purple.50" borderRadius="md">
                <Text fontSize="sm" color="gray.600">Preço Atacado</Text>
                <Heading size="lg" color="purple.600">
                  R$ {(product.prices?.wholesale || 0).toFixed(2)}
                </Heading>
              </Box>
            </VStack>
          </TabPanel>

          {/* Aba: Variações */}
          <TabPanel>
            {product.variations && product.variations.length > 0 ? (
              <Box overflowX="auto" borderWidth={1} borderRadius="md" borderColor="gray.200">
                <Table size="sm">
                  <Tbody>
                    <Tr bg="gray.50">
                      <Td fontWeight="bold">Tipo</Td>
                      <Td fontWeight="bold">Valor</Td>
                    </Tr>
                    {product.variations.map(variation => (
                      <Tr key={variation.id}>
                        <Td>{variation.type}</Td>
                        <Td>{variation.value}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Text color="gray.500">Nenhuma variação cadastrada</Text>
            )}
          </TabPanel>

          {/* Aba: Imagens */}
          <TabPanel>
            {product.images && product.images.length > 0 ? (
              <VStack spacing={4}>
                {product.images.map(image => (
                  <Box key={image.id}>
                    <img src={image.url} alt={image.alt} style={{ maxWidth: '400px', borderRadius: '8px' }} />
                    <Text fontSize="sm" color="gray.600" mt={2}>{image.alt}</Text>
                  </Box>
                ))}
              </VStack>
            ) : (
              <Text color="gray.500">Nenhuma imagem cadastrada</Text>
            )}
          </TabPanel>

          {/* Aba: Histórico */}
          <TabPanel>
            {product.history && product.history.length > 0 ? (
              <VStack align="start" spacing={4}>
                {product.history.slice().reverse().map(entry => (
                  <Box key={entry.id} p={3} bg="gray.50" borderRadius="md" w="full" borderLeft="4px" borderColor="blue.400">
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="bold">
                        {entry.type === 'created' ? 'Produto criado' : `Campo alterado: ${entry.field}`}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {new Date(entry.changedAt).toLocaleDateString('pt-BR')} {new Date(entry.changedAt).toLocaleTimeString('pt-BR')}
                      </Text>
                    </HStack>
                    {entry.field && (
                      <VStack align="start" spacing={1} fontSize="sm">
                        <Text>Antes: <strong>{entry.oldValue || '-'}</strong></Text>
                        <Text>Depois: <strong>{entry.newValue || '-'}</strong></Text>
                      </VStack>
                    )}
                    <Text fontSize="xs" color="gray.600" mt={2}>Por: {entry.changedBy}</Text>
                  </Box>
                ))}
              </VStack>
            ) : (
              <Text color="gray.500">Nenhuma alteração registrada</Text>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal de Edição */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl">
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader>Editar Produto</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <ProductForm
              product={product}
              onSubmit={handleFormSubmit}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}
