import React, { useEffect, useState } from 'react'
import { Box, Input, Button, SimpleGrid, Text, Spinner, HStack, Heading, useDisclosure } from '@chakra-ui/react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import ProductForm from '../components/ProductForm'
import ProductEdit from '../components/ProductEdit'

export default function Products() {
  const auth = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(6)
  const [total, setTotal] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const path = `/products?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`
        const data = await api.get(path)
        if (mounted) {
          setItems(data.items || [])
          setTotal(data.total || 0)
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
  }, [q, page, limit, refreshKey])

  const totalPages = Math.max(1, Math.ceil((total || items.length) / limit))

  function handleEditClick(product) {
    setSelectedProduct(product)
    onOpen()
  }

  function handleDeleted(productId) {
    setItems(prev => prev.filter(p => p.id !== productId))
    setTotal(t => Math.max(0, t - 1))
  }

  function handleSaved(updatedProduct) {
    setItems(prev =>
      prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    )
  }

  return (
    <Box p={4}>
      <Heading mb={6}>Produtos</Heading>
      
      <ProductForm onCreated={() => setRefreshKey(k => k + 1)} />

      <HStack spacing={3} mb={4} mt={4}>
        <Input placeholder="Pesquisar produtos (nome, SKU)" value={q} onChange={e => setQ(e.target.value)} />
        <Button onClick={() => setPage(1)} colorScheme="blue">Buscar</Button>
      </HStack>

      {loading && <Spinner />}
      {error && <Text color="red.500">Erro: {error}</Text>}

      {!loading && !error && (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {items.map(p => (
              <ProductCard key={p.id} product={p} onEdit={handleEditClick} onDeleted={handleDeleted} />
            ))}
          </SimpleGrid>

          <HStack mt={4} spacing={3}>
            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Anterior
            </Button>
            <Text>Página {page} de {totalPages}</Text>
            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Próxima
            </Button>
          </HStack>
        </>
      )}

      <ProductEdit isOpen={isOpen} product={selectedProduct} onClose={onClose} onSaved={handleSaved} />
    </Box>
  )
}
