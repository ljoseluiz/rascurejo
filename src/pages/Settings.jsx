import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  HStack,
  VStack,
  Text,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react'
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Settings() {
  const auth = useAuth()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  
  // Data states
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [suppliers, setSuppliers] = useState([])
  
  // Form states
  const [editMode, setEditMode] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', contact: '', phone: '' })

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [catsRes, brandsRes, suppliersRes] = await Promise.all([
        api.get('/categories'),
        api.get('/brands'),
        api.get('/suppliers')
      ])
      setCategories(catsRes)
      setBrands(brandsRes)
      setSuppliers(suppliersRes)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      toast({ title: 'Erro ao carregar dados', description: err.message, status: 'error', duration: 3000, isClosable: true })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = (type) => {
    setEditMode(false)
    setCurrentItem(null)
    setFormData({ name: '', description: '', contact: '', phone: '' })
    onOpen()
  }

  const handleEdit = (item, type) => {
    setEditMode(true)
    setCurrentItem({ ...item, type })
    setFormData({
      name: item.name || '',
      description: item.description || '',
      contact: item.contact || '',
      phone: item.phone || ''
    })
    onOpen()
  }

  const handleDelete = async (id, type) => {
    if (!confirm(`Tem certeza que deseja deletar este item?`)) return

    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const endpoint = type === 'category' ? '/categories' : type === 'brand' ? '/brands' : '/suppliers'
      await api.delete(`${endpoint}/${id}`, {}, opts)
      
      toast({ title: 'Item deletado', status: 'success', duration: 2000, isClosable: true })
      loadAll()
    } catch (err) {
      console.error('Erro ao deletar:', err)
      toast({ title: 'Erro ao deletar', description: err.message, status: 'error', duration: 3000, isClosable: true })
    }
  }

  const handleSubmit = async () => {
    const type = activeTab === 0 ? 'category' : activeTab === 1 ? 'brand' : 'supplier'
    const endpoint = activeTab === 0 ? '/categories' : activeTab === 1 ? '/brands' : '/suppliers'
    
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      
      if (editMode && currentItem) {
        // Editar
        await api.put(`${endpoint}/${currentItem.id}`, formData, opts)
        toast({ title: 'Item atualizado', status: 'success', duration: 2000, isClosable: true })
      } else {
        // Criar
        await api.post(endpoint, formData, opts)
        toast({ title: 'Item criado', status: 'success', duration: 2000, isClosable: true })
      }
      
      onClose()
      loadAll()
    } catch (err) {
      console.error('Erro ao salvar:', err)
      toast({ title: 'Erro ao salvar', description: err.message, status: 'error', duration: 3000, isClosable: true })
    }
  }

  const renderTable = (data, type) => {
    const isCategory = type === 'category'
    const isSupplier = type === 'supplier'

    return (
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Nome</Th>
            {isCategory && <Th>Descrição</Th>}
            {isSupplier && <Th>Contato</Th>}
            {isSupplier && <Th>Telefone</Th>}
            <Th textAlign="right">Ações</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((item) => (
            <Tr key={item.id}>
              <Td fontWeight="medium">{item.name}</Td>
              {isCategory && <Td color="gray.600">{item.description || '—'}</Td>}
              {isSupplier && <Td>{item.contact || '—'}</Td>}
              {isSupplier && <Td>{item.phone || '—'}</Td>}
              <Td textAlign="right">
                <HStack spacing={2} justify="flex-end">
                  <IconButton
                    icon={<EditIcon />}
                    size="sm"
                    colorScheme="blue"
                    variant="ghost"
                    onClick={() => handleEdit(item, type)}
                  />
                  <IconButton
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => handleDelete(item.id, type)}
                  />
                </HStack>
              </Td>
            </Tr>
          ))}
          {data.length === 0 && (
            <Tr>
              <Td colSpan={isSupplier ? 4 : isCategory ? 3 : 2} textAlign="center" py={8}>
                <Text color="gray.400">Nenhum item cadastrado</Text>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    )
  }

  return (
    <Box w="full" py={8} px={6}>
      <VStack spacing={6} align="start" w="full">
        <Heading size="lg">Configurações</Heading>
        
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Gerencie as opções disponíveis para categorias, marcas e fornecedores.
        </Alert>

        {loading ? (
          <Box w="full" textAlign="center" py={10}>
            <Spinner size="xl" />
          </Box>
        ) : (
          <Tabs w="full" colorScheme="blue" index={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab>Categorias</Tab>
              <Tab>Marcas</Tab>
              <Tab>Fornecedores</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <VStack spacing={4} align="start" w="full">
                  <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={() => handleAdd('category')}>
                    Nova Categoria
                  </Button>
                  <Box w="full" borderWidth={1} borderRadius="md" overflow="hidden">
                    {renderTable(categories, 'category')}
                  </Box>
                </VStack>
              </TabPanel>

              <TabPanel>
                <VStack spacing={4} align="start" w="full">
                  <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={() => handleAdd('brand')}>
                    Nova Marca
                  </Button>
                  <Box w="full" borderWidth={1} borderRadius="md" overflow="hidden">
                    {renderTable(brands, 'brand')}
                  </Box>
                </VStack>
              </TabPanel>

              <TabPanel>
                <VStack spacing={4} align="start" w="full">
                  <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={() => handleAdd('supplier')}>
                    Novo Fornecedor
                  </Button>
                  <Box w="full" borderWidth={1} borderRadius="md" overflow="hidden">
                    {renderTable(suppliers, 'supplier')}
                  </Box>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </VStack>

      {/* Modal de Criar/Editar */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editMode ? 'Editar' : 'Novo'}{' '}
            {activeTab === 0 ? 'Categoria' : activeTab === 1 ? 'Marca' : 'Fornecedor'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nome</FormLabel>
                <Input
                  placeholder="Digite o nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </FormControl>

              {activeTab === 0 && (
                <FormControl>
                  <FormLabel>Descrição</FormLabel>
                  <Textarea
                    placeholder="Descrição opcional"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </FormControl>
              )}

              {activeTab === 2 && (
                <>
                  <FormControl>
                    <FormLabel>Contato (Email)</FormLabel>
                    <Input
                      type="email"
                      placeholder="contato@fornecedor.com"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Telefone</FormLabel>
                    <Input
                      placeholder="(11) 98765-4321"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </FormControl>
                </>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit} isDisabled={!formData.name.trim()}>
              {editMode ? 'Atualizar' : 'Criar'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
