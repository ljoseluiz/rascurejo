import React from 'react'
import { Box, VStack, Button, Text, Icon, Flex, IconButton, Divider } from '@chakra-ui/react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { FiHome, FiBox, FiLayers, FiShoppingCart, FiBarChart2, FiX } from 'react-icons/fi'

const links = [
  { to: '/', label: 'Dashboard', icon: FiHome },
  { to: '/products', label: 'Produtos Simples', icon: FiBox },
  { to: '/products-advanced', label: 'Gestão de Produtos', icon: FiBox },
  { to: '/inventory', label: 'Estoque', icon: FiLayers },
  { to: '/sales', label: 'Vendas', icon: FiShoppingCart },
  { to: '/reports', label: 'Relatórios', icon: FiBarChart2 }
]

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <Box
      as="aside"
      bg="gray.50"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      boxShadow="sm"
      width="240px"
      minH="calc(100vh - 140px)"
      display={isOpen ? 'block' : 'none'}
      position="relative"
    >
      <Flex align="center" justify="space-between" p={4}>
        <Text fontWeight="bold">Menu</Text>
        <IconButton
          aria-label="Fechar menu"
          icon={<FiX />}
          size="sm"
          variant="ghost"
          onClick={onClose}
        />
      </Flex>

      <Divider />

      <VStack align="stretch" spacing={1} p={3}>
        {links.map((link) => (
          <Button
            key={link.to}
            as={RouterLink}
            to={link.to}
            justifyContent="flex-start"
            leftIcon={<Icon as={link.icon} />}
            variant={isActive(link.to) ? 'solid' : 'ghost'}
            colorScheme={isActive(link.to) ? 'blue' : 'gray'}
            size="md"
          >
            {link.label}
          </Button>
        ))}
      </VStack>
    </Box>
  )
}
