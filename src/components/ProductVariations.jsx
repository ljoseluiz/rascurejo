import React, { useState } from 'react'
import {
  FormControl,
  FormLabel,
  Input,
  Button,
  Grid,
  HStack,
  Box,
  Table,
  Tbody,
  Tr,
  Td,
  IconButton,
  Text,
  VStack
} from '@chakra-ui/react'
import { DeleteIcon, AddIcon, EditIcon } from '@chakra-ui/icons'

/**
 * ProductVariations.jsx
 * Componente para gerenciar variações de produto (tamanho, cor, modelo, etc)
 * Props:
 *   - variations: array de { id, type, value }
 *   - onChange: callback quando variações mudam
 */
export default function ProductVariations({ variations = [], onChange }) {
  const [newType, setNewType] = useState('')
  const [newValue, setNewValue] = useState('')

  const addVariation = () => {
    if (!newType.trim() || !newValue.trim()) return
    
    const newVariation = {
      id: Date.now(),
      type: newType.trim(),
      value: newValue.trim()
    }
    
    onChange([...variations, newVariation])
    setNewType('')
    setNewValue('')
  }

  const removeVariation = (id) => {
    onChange(variations.filter(v => v.id !== id))
  }

  return (
    <VStack align="start" spacing={4} w="full">
      <Text fontSize="md" fontWeight="bold">Variações do Produto</Text>

      {/* Form para adicionar variação */}
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr auto' }} gap={3} w="full">
        <FormControl>
          <FormLabel fontSize="sm">Tipo (ex: Cor, Tamanho)</FormLabel>
          <Input
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="Cor"
            bg="white"
            size="sm"
          />
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm">Valor (ex: Azul, P)</FormLabel>
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Azul escuro"
            bg="white"
            size="sm"
          />
        </FormControl>

        <Button
          colorScheme="blue"
          size="sm"
          onClick={addVariation}
          mt={6}
          leftIcon={<AddIcon />}
          isDisabled={!newType.trim() || !newValue.trim()}
        >
          Adicionar
        </Button>
      </Grid>

      {/* Tabela de variações */}
      {variations.length > 0 ? (
        <Box w="full" overflowX="auto" borderWidth={1} borderRadius="md" borderColor="gray.200">
          <Table size="sm">
            <Tbody>
              <Tr bg="gray.50">
                <Td fontWeight="bold" width="40%">Tipo</Td>
                <Td fontWeight="bold" width="40%">Valor</Td>
                <Td fontWeight="bold" width="20%" textAlign="center">Ações</Td>
              </Tr>
              {variations.map((variation) => (
                <Tr key={variation.id} _hover={{ bg: 'gray.50' }}>
                  <Td>{variation.type}</Td>
                  <Td>{variation.value}</Td>
                  <Td textAlign="center">
                    <IconButton
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => removeVariation(variation.id)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      ) : (
        <Box w="full" p={4} borderWidth={2} borderStyle="dashed" borderColor="gray.300" borderRadius="md" textAlign="center" color="gray.400">
          <Text fontSize="sm">Nenhuma variação adicionada</Text>
        </Box>
      )}
    </VStack>
  )
}
