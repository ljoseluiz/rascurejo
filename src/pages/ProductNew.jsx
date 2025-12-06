import React from 'react'
import { Box, Heading, Button, HStack } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import ProductForm from '../components/ProductForm'

export default function ProductNew() {
  const navigate = useNavigate()

  const handleSubmit = (product) => {
    // Após criar, redireciona para a lista
    navigate('/products-advanced')
  }

  return (
    <Box p={6} w="full">
      <HStack spacing={4} mb={6}>
        <Button
          leftIcon={<FiArrowLeft />}
          variant="ghost"
          onClick={() => navigate('/products-advanced')}
        >
          Voltar
        </Button>
        <Heading size="lg">Criar Novo Produto</Heading>
      </HStack>

      <Box bg="white" p={6} borderRadius="md" boxShadow="md">
        <ProductForm product={null} onSubmit={handleSubmit} />
      </Box>
    </Box>
  )
}
