import React from 'react'
import { Box, Heading, Text, Badge, HStack, IconButton, VStack, Image } from '@chakra-ui/react'
import { EditIcon, DeleteIcon } from '@chakra-ui/icons'

export default function ProductCard({ product, onEdit, onDelete, onView }) {
  const { name, sku, prices, stock, active, category, brand, images } = product || {}
  const imageUrl = images && images[0]?.url

  return (
    <Box 
      bg="white" 
      borderRadius="md" 
      boxShadow="md" 
      overflow="hidden"
      _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
      transition="all 0.2s"
    >
      {imageUrl && (
        <Image 
          src={imageUrl} 
          alt={name} 
          w="full" 
          h="180px" 
          objectFit="cover"
          fallbackSrc="https://via.placeholder.com/300x180?text=Sem+Imagem"
        />
      )}
      
      <VStack align="start" p={4} spacing={2}>
        <HStack justify="space-between" w="full">
          <Heading size="sm" noOfLines={1}>{name}</Heading>
          <Badge colorScheme={active ? 'green' : 'gray'}>
            {active ? 'Ativo' : 'Inativo'}
          </Badge>
        </HStack>
        
        <Text fontSize="xs" color="gray.600">SKU: {sku}</Text>
        <Text fontSize="xs" color="gray.600">{category} • {brand}</Text>
        
        <HStack justify="space-between" w="full" pt={2}>
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color="blue.600">
              R$ {(prices?.sale || 0).toFixed(2)}
            </Text>
            <Badge colorScheme={stock > 10 ? 'green' : stock > 0 ? 'yellow' : 'red'}>
              Estoque: {stock}
            </Badge>
          </VStack>
          
          <HStack spacing={1}>
            {onEdit && (
              <IconButton
                icon={<EditIcon />}
                size="sm"
                colorScheme="blue"
                variant="ghost"
                onClick={() => onEdit(product)}
                aria-label="Editar produto"
              />
            )}
            {onDelete && (
              <IconButton
                icon={<DeleteIcon />}
                size="sm"
                colorScheme="red"
                variant="ghost"
                onClick={() => onDelete(product.id)}
                aria-label="Deletar produto"
              />
            )}
          </HStack>
        </HStack>
      </VStack>
    </Box>
  )
}

