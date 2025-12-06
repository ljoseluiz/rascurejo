import React, { useEffect, useState } from 'react'
import { Box, SimpleGrid, Text, Spinner, HStack, Heading, useToast } from '@chakra-ui/react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'

export default function Products() {
  const auth = useAuth()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await api.get('/products?limit=100')
        if (mounted) {
          setItems(data.items || [])
        }
      } catch (err) {
        console.error('Failed to load products', err)
        if (mounted) setError(err.message || String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return

    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      await api.delete(`/products/${id}`, {}, opts)
      setItems(prev => prev.filter(p => p.id !== id))
      toast({ title: 'Produto deletado', status: 'success', duration: 2000, isClosable: true })
    } catch (err) {
      console.error('Erro ao deletar:', err)
      toast({ title: 'Erro ao deletar', description: err.message, status: 'error', duration: 3000, isClosable: true })
    }
  }

  return (
    <Box p={6} w="full">
      <Heading mb={6}>Produtos</Heading>

      {loading && (
        <Box display="flex" justifyContent="center" py={10}>
          <Spinner size="xl" />
        </Box>
      )}
      
      {error && <Text color="red.500">Erro: {error}</Text>}

      {!loading && !error && items.length === 0 && (
        <Box p={8} textAlign="center" borderWidth={1} borderRadius="md" borderColor="gray.200">
          <Text color="gray.500">Nenhum produto cadastrado</Text>
        </Box>
      )}

      {!loading && !error && items.length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
          {items.map(p => (
            <ProductCard 
              key={p.id} 
              product={p} 
              onEdit={() => window.location.href = `/products/${p.id}`}
              onDelete={() => handleDelete(p.id)}
            />
          ))}
        </SimpleGrid>
      )}
    </Box>
  )
}
