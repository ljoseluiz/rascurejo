import { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Select,
  Input,
  Textarea,
  VStack,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Text,
  Badge
} from '@chakra-ui/react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const MOVEMENT_TYPES = {
  in: {
    label: 'Entrada',
    color: 'green',
    subtypes: [
      { value: 'purchase', label: 'Compra' },
      { value: 'return', label: 'Devolução' },
      { value: 'transfer_in', label: 'Transferência (entrada)' },
      { value: 'adjustment_positive', label: 'Ajuste positivo' }
    ]
  },
  out: {
    label: 'Saída',
    color: 'red',
    subtypes: [
      { value: 'sale', label: 'Venda' },
      { value: 'loss', label: 'Perda' },
      { value: 'transfer_out', label: 'Transferência (saída)' },
      { value: 'adjustment_negative', label: 'Ajuste negativo' }
    ]
  }
}

export default function StockMovementForm({ isOpen, onClose, onSuccess }) {
  const auth = useAuth()
  const toast = useToast()
  
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
  const [currentStock, setCurrentStock] = useState(null)
  
  const [formData, setFormData] = useState({
    product_id: '',
    location_id: '',
    type: 'in',
    subtype: '',
    quantity: 1,
    unit_cost: '',
    batch_number: '',
    expiration_date: '',
    reference_doc: '',
    notes: ''
  })
  
  useEffect(() => {
    if (isOpen) {
      loadProducts()
      loadLocations()
    }
  }, [isOpen])
  
  useEffect(() => {
    if (formData.product_id && formData.location_id) {
      checkCurrentStock()
    }
  }, [formData.product_id, formData.location_id])
  
  async function loadProducts() {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get('/products?limit=1000', opts)
      setProducts(data.items || [])
    } catch (err) {
      console.error('Erro ao carregar produtos:', err)
    }
  }
  
  async function loadLocations() {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get('/stock/locations?active=true', opts)
      setLocations(data || [])
    } catch (err) {
      console.error('Erro ao carregar locais:', err)
    }
  }
  
  async function checkCurrentStock() {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const data = await api.get(
        `/stock/levels?product_id=${formData.product_id}&location_id=${formData.location_id}`,
        opts
      )
      
      if (data.items && data.items.length > 0) {
        setCurrentStock(data.items[0].quantity)
      } else {
        setCurrentStock(0)
      }
    } catch (err) {
      console.error('Erro ao verificar estoque:', err)
      setCurrentStock(null)
    }
  }
  
  function handleChange(field, value) {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Reset subtype when type changes
      if (field === 'type') {
        updated.subtype = ''
      }
      
      return updated
    })
  }
  
  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.product_id || !formData.location_id || !formData.type || !formData.subtype) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha produto, local, tipo e subtipo',
        status: 'warning',
        duration: 3000
      })
      return
    }
    
    if (formData.quantity <= 0) {
      toast({
        title: 'Quantidade inválida',
        description: 'A quantidade deve ser maior que zero',
        status: 'warning',
        duration: 3000
      })
      return
    }
    
    setLoading(true)
    
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const payload = {
        ...formData,
        product_id: parseInt(formData.product_id, 10),
        location_id: parseInt(formData.location_id, 10),
        quantity: parseInt(formData.quantity, 10),
        unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : 0
      }
      
      await api.post('/stock/movements', payload, opts)
      
      toast({
        title: 'Movimentação registrada',
        description: 'Estoque atualizado com sucesso',
        status: 'success',
        duration: 3000
      })
      
      // Reset form
      setFormData({
        product_id: '',
        location_id: '',
        type: 'in',
        subtype: '',
        quantity: 1,
        unit_cost: '',
        batch_number: '',
        expiration_date: '',
        reference_doc: '',
        notes: ''
      })
      setCurrentStock(null)
      
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Erro ao registrar movimentação:', err)
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao registrar movimentação',
        status: 'error',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }
  
  const selectedProduct = products.find(p => p.id === parseInt(formData.product_id, 10))
  const availableSubtypes = formData.type ? MOVEMENT_TYPES[formData.type].subtypes : []
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Nova Movimentação de Estoque</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Produto</FormLabel>
                <Select
                  value={formData.product_id}
                  onChange={(e) => handleChange('product_id', e.target.value)}
                  placeholder="Selecione o produto"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </Select>
                {selectedProduct && (
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    Preço: R$ {selectedProduct.prices?.sale?.toFixed(2)}
                  </Text>
                )}
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Local</FormLabel>
                <Select
                  value={formData.location_id}
                  onChange={(e) => handleChange('location_id', e.target.value)}
                  placeholder="Selecione o local"
                >
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.type === 'warehouse' ? 'Depósito' : 'Loja'})
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              {currentStock !== null && (
                <Badge colorScheme="blue" p={2} borderRadius="md">
                  Estoque atual neste local: {currentStock} unidades
                </Badge>
              )}
              
              <HStack spacing={4}>
                <FormControl isRequired flex={1}>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                  >
                    {Object.entries(MOVEMENT_TYPES).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl isRequired flex={1}>
                  <FormLabel>Subtipo</FormLabel>
                  <Select
                    value={formData.subtype}
                    onChange={(e) => handleChange('subtype', e.target.value)}
                    placeholder="Selecione o subtipo"
                  >
                    {availableSubtypes.map(st => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>
              
              <HStack spacing={4}>
                <FormControl isRequired flex={1}>
                  <FormLabel>Quantidade</FormLabel>
                  <NumberInput
                    value={formData.quantity}
                    onChange={(val) => handleChange('quantity', val)}
                    min={1}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                
                <FormControl flex={1}>
                  <FormLabel>Custo unitário (R$)</FormLabel>
                  <NumberInput
                    value={formData.unit_cost}
                    onChange={(val) => handleChange('unit_cost', val)}
                    min={0}
                    precision={2}
                  >
                    <NumberInputField placeholder="0.00" />
                  </NumberInput>
                </FormControl>
              </HStack>
              
              <HStack spacing={4}>
                <FormControl flex={1}>
                  <FormLabel>Número do lote</FormLabel>
                  <Input
                    value={formData.batch_number}
                    onChange={(e) => handleChange('batch_number', e.target.value)}
                    placeholder="Ex: LOTE-2024-001"
                  />
                </FormControl>
                
                <FormControl flex={1}>
                  <FormLabel>Data de validade</FormLabel>
                  <Input
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => handleChange('expiration_date', e.target.value)}
                  />
                </FormControl>
              </HStack>
              
              <FormControl>
                <FormLabel>Documento de referência</FormLabel>
                <Input
                  value={formData.reference_doc}
                  onChange={(e) => handleChange('reference_doc', e.target.value)}
                  placeholder="Ex: NF-12345"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Observações</FormLabel>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Informações adicionais..."
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={loading}
            >
              Registrar Movimentação
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
