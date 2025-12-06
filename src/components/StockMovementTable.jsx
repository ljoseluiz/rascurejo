import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Box,
  HStack,
  VStack,
  IconButton,
  Tooltip
} from '@chakra-ui/react'
import { FiInfo } from 'react-icons/fi'

const TYPE_CONFIG = {
  in: { label: 'Entrada', color: 'green' },
  out: { label: 'Saída', color: 'red' }
}

const SUBTYPE_LABELS = {
  purchase: 'Compra',
  return: 'Devolução',
  transfer_in: 'Transferência (entrada)',
  adjustment_positive: 'Ajuste +',
  sale: 'Venda',
  loss: 'Perda',
  transfer_out: 'Transferência (saída)',
  adjustment_negative: 'Ajuste -'
}

export default function StockMovementTable({ movements, loading }) {
  if (loading) {
    return <Text>Carregando movimentações...</Text>
  }
  
  if (!movements || movements.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="gray.500">Nenhuma movimentação encontrada</Text>
      </Box>
    )
  }
  
  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead bg="gray.50">
          <Tr>
            <Th>Data</Th>
            <Th>Produto</Th>
            <Th>Local</Th>
            <Th>Tipo</Th>
            <Th isNumeric>Qtd</Th>
            <Th isNumeric>Custo Unit.</Th>
            <Th isNumeric>Valor Total</Th>
            <Th>Lote</Th>
            <Th>Documento</Th>
            <Th>Usuário</Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          {movements.map((movement) => {
            const typeConfig = TYPE_CONFIG[movement.type] || {}
            const subtypeLabel = SUBTYPE_LABELS[movement.subtype] || movement.subtype
            
            return (
              <Tr key={movement.id}>
                <Td>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium">
                      {new Date(movement.created_at).toLocaleDateString('pt-BR')}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {new Date(movement.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </VStack>
                </Td>
                
                <Td>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium">
                      {movement.product_name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {movement.product_sku}
                    </Text>
                  </VStack>
                </Td>
                
                <Td>
                  <Text fontSize="sm">{movement.location_name}</Text>
                </Td>
                
                <Td>
                  <VStack align="start" spacing={1}>
                    <Badge colorScheme={typeConfig.color}>
                      {typeConfig.label}
                    </Badge>
                    <Text fontSize="xs" color="gray.600">
                      {subtypeLabel}
                    </Text>
                  </VStack>
                </Td>
                
                <Td isNumeric>
                  <Text fontSize="sm" fontWeight="bold" color={typeConfig.color + '.600'}>
                    {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                  </Text>
                </Td>
                
                <Td isNumeric>
                  <Text fontSize="sm">
                    R$ {movement.unit_cost?.toFixed(2) || '0.00'}
                  </Text>
                </Td>
                
                <Td isNumeric>
                  <Text fontSize="sm" fontWeight="medium">
                    R$ {movement.total_cost?.toFixed(2) || '0.00'}
                  </Text>
                </Td>
                
                <Td>
                  {movement.batch_number ? (
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs">{movement.batch_number}</Text>
                      {movement.expiration_date && (
                        <Text fontSize="xs" color="gray.500">
                          Val: {new Date(movement.expiration_date).toLocaleDateString('pt-BR')}
                        </Text>
                      )}
                    </VStack>
                  ) : (
                    <Text fontSize="xs" color="gray.400">-</Text>
                  )}
                </Td>
                
                <Td>
                  <Text fontSize="xs">{movement.reference_doc || '-'}</Text>
                </Td>
                
                <Td>
                  <Text fontSize="xs" color="gray.600">
                    {movement.created_by}
                  </Text>
                </Td>
                
                <Td>
                  {movement.notes && (
                    <Tooltip label={movement.notes} hasArrow>
                      <IconButton
                        icon={<FiInfo />}
                        size="xs"
                        variant="ghost"
                        aria-label="Ver observações"
                      />
                    </Tooltip>
                  )}
                </Td>
              </Tr>
            )
          })}
        </Tbody>
      </Table>
    </Box>
  )
}
