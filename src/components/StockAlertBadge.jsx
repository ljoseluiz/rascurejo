import { Badge, HStack, Text, Tooltip, Icon } from '@chakra-ui/react'
import { FiAlertTriangle, FiAlertCircle, FiInfo } from 'react-icons/fi'

const ALERT_CONFIG = {
  out_of_stock: {
    label: 'RUPTURA',
    color: 'red',
    icon: FiAlertTriangle,
    severity: 'critical'
  },
  low_stock: {
    label: 'Estoque Baixo',
    color: 'orange',
    icon: FiAlertCircle,
    severity: 'warning'
  },
  high_stock: {
    label: 'Estoque Alto',
    color: 'blue',
    icon: FiInfo,
    severity: 'info'
  }
}

export default function StockAlertBadge({ level, showDetails = false }) {
  if (!level) return null
  
  let alertType = null
  
  if (level.quantity <= 0) {
    alertType = 'out_of_stock'
  } else if (level.quantity < level.min_stock) {
    alertType = 'low_stock'
  } else if (level.quantity > level.max_stock) {
    alertType = 'high_stock'
  }
  
  if (!alertType) return null
  
  const config = ALERT_CONFIG[alertType]
  
  const badgeContent = (
    <HStack spacing={1}>
      <Icon as={config.icon} boxSize={3} />
      <Text fontSize="xs" fontWeight="bold">{config.label}</Text>
    </HStack>
  )
  
  const tooltipText = alertType === 'out_of_stock' 
    ? `Produto em RUPTURA! Estoque: 0`
    : alertType === 'low_stock'
    ? `Estoque abaixo do mínimo! Atual: ${level.quantity}, Mínimo: ${level.min_stock}`
    : `Estoque acima do máximo! Atual: ${level.quantity}, Máximo: ${level.max_stock}`
  
  if (showDetails) {
    return (
      <Tooltip label={tooltipText} hasArrow>
        <Badge colorScheme={config.color} px={2} py={1} borderRadius="md">
          {badgeContent}
        </Badge>
      </Tooltip>
    )
  }
  
  return (
    <Badge colorScheme={config.color} px={2} py={1} borderRadius="md">
      {badgeContent}
    </Badge>
  )
}
