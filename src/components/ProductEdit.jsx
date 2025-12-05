import React, { useState, useEffect } from 'react'
import { Box, Button, FormControl, FormLabel, Input, VStack, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter } from '@chakra-ui/react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function ProductEdit({ isOpen, product, onClose, onSaved }) {
  const auth = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', sku: '', price: '' })

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        sku: product.sku || '',
        price: product.price || ''
      })
    }
  }, [product, isOpen])

  async function handleSave() {
    if (!form.name || !form.sku || !form.price) {
      toast({ title: 'Validação', description: 'Preencha todos os campos', status: 'warning', duration: 2000, isClosable: true })
      return
    }
    
    setLoading(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      const response = await api.put(`/products/${product.id}`, form, opts)
      toast({ title: 'Sucesso', description: 'Produto atualizado', status: 'success', duration: 2000, isClosable: true })
      if (onSaved) onSaved(response)
      onClose()
    } catch (err) {
      toast({ title: 'Erro', description: err.message, status: 'error', duration: 3000, isClosable: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Editar Produto</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Nome</FormLabel>
              <Input
                placeholder="Nome do produto"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel>SKU</FormLabel>
              <Input
                placeholder="Código SKU"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Preço</FormLabel>
              <Input
                type="number"
                placeholder="Preço"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
          <Button colorScheme="blue" onClick={handleSave} isLoading={loading}>Salvar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
