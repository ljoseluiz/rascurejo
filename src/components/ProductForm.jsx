import React, { useState } from 'react'
import { Box, Input, Button, HStack, VStack, Text, useToast } from '@chakra-ui/react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function ProductForm({ onCreated }) {
  const auth = useAuth()
  const toast = useToast()
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const body = { name, sku, price: parseFloat(price) || 0 }
      const opts = api.injectCsrf({}, auth.csrfToken)
      await api.post('/products', body, opts)
      
      toast({
        title: 'Produto criado',
        description: `${name} foi adicionado com sucesso.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      setName('')
      setSku('')
      setPrice('')
      if (onCreated) onCreated()
    } catch (err) {
      const msg = err.message || String(err)
      setError(msg)
      toast({
        title: 'Erro',
        description: msg,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box as="form" onSubmit={onSubmit}>
      <VStack spacing={3} align="stretch">
        <Input placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="SKU" value={sku} onChange={e => setSku(e.target.value)} />
        <Input placeholder="Preço" value={price} onChange={e => setPrice(e.target.value)} />
        {error && <Text color="red.500">{error}</Text>}
        <HStack>
          <Button type="submit" colorScheme="green" isLoading={loading}>Criar</Button>
        </HStack>
      </VStack>
    </Box>
  )
}
