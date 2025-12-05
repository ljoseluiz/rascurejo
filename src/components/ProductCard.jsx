import React, { useState } from 'react'
import { Box, Heading, Text, Badge, HStack, Button, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useDisclosure, useToast } from '@chakra-ui/react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function ProductCard({ product, onEdit, onDeleted }) {
  const auth = useAuth()
  const toast = useToast()
  const [deleting, setDeleting] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = React.useRef()

  async function handleDelete() {
    setDeleting(true)
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      await api.delete(`/products/${product.id}`, undefined, opts)
      toast({ title: 'Deletado', description: `${product.name} foi removido.`, status: 'success', duration: 2000, isClosable: true })
      if (onDeleted) onDeleted(product.id)
    } catch (err) {
      toast({ title: 'Erro', description: err.message, status: 'error', duration: 3000, isClosable: true })
    } finally {
      setDeleting(false)
      onClose()
    }
  }

  const { id, name, sku, price } = product || {}
  return (
    <>
      <Box bg="white" p={4} borderRadius="md" boxShadow="xs">
        <Heading size="sm" mb={2}>{name}</Heading>
        <Text fontSize="sm">SKU: <Badge ml={2}>{sku}</Badge></Text>
        <Text mt={2} fontWeight="bold">R$ {price}</Text>
        <HStack mt={3} spacing={2}>
          <Button size="sm" colorScheme="blue" onClick={() => onEdit && onEdit(product)}>Editar</Button>
          <Button size="sm" colorScheme="red" onClick={onOpen}>Deletar</Button>
        </HStack>
      </Box>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Deletar {name}
            </AlertDialogHeader>
            <AlertDialogBody>
              Tem certeza? Esta ação não pode ser desfeita.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>Cancelar</Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3} isLoading={deleting}>Deletar</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}

