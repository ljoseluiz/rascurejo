import React, { useState } from 'react'
import { Box, VStack, Button, Text, Icon, Flex, IconButton, Divider, Collapse } from '@chakra-ui/react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { FiHome, FiBox, FiLayers, FiShoppingCart, FiBarChart2, FiSettings, FiX, FiChevronDown, FiChevronRight, FiList, FiPlus, FiPackage, FiTrendingUp, FiFileText } from 'react-icons/fi'

const links = [
  { to: '/', label: 'Dashboard', icon: FiHome },
  { 
    label: 'Produtos', 
    icon: FiBox, 
    submenu: [
      { to: '/products-advanced', label: 'Lista de Produtos', icon: FiList },
      { to: '/products/new', label: 'Criar Produto', icon: FiPlus }
    ]
  },
  { 
    label: 'Estoque', 
    icon: FiLayers, 
    submenu: [
      { to: '/stock/movements', label: 'Movimentações', icon: FiPackage },
      { to: '/stock/levels', label: 'Níveis de Estoque', icon: FiTrendingUp },
      { to: '/stock/reports', label: 'Relatórios', icon: FiFileText }
    ]
  },
  { to: '/inventory', label: 'Inventário', icon: FiLayers },
  { to: '/sales', label: 'Vendas', icon: FiShoppingCart },
  { to: '/reports', label: 'Relatórios', icon: FiBarChart2 },
  { to: '/settings', label: 'Configurações', icon: FiSettings }
]

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState({ Produtos: true, Estoque: true })

  const isActive = (path) => location.pathname === path
  
  const isSubmenuActive = (submenu) => {
    return submenu?.some(item => location.pathname === item.to)
  }

  const toggleMenu = (label) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <Box
      as="aside"
      bg="gray.50"
      borderRight="1px solid"
      borderColor="gray.200"
      boxShadow="sm"
      width="240px"
      minH="100vh"
      display={isOpen ? 'block' : 'none'}
      position="sticky"
      top="0"
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
        {links.map((link) => {
          if (link.submenu) {
            const isExpanded = expandedMenus[link.label]
            const hasActiveSubmenu = isSubmenuActive(link.submenu)
            
            return (
              <Box key={link.label}>
                <Button
                  justifyContent="space-between"
                  leftIcon={<Icon as={link.icon} />}
                  rightIcon={<Icon as={isExpanded ? FiChevronDown : FiChevronRight} />}
                  variant={hasActiveSubmenu ? 'solid' : 'ghost'}
                  colorScheme={hasActiveSubmenu ? 'blue' : 'gray'}
                  size="md"
                  width="full"
                  onClick={() => toggleMenu(link.label)}
                >
                  {link.label}
                </Button>
                <Collapse in={isExpanded} animateOpacity>
                  <VStack align="stretch" spacing={1} pl={4} pt={1}>
                    {link.submenu.map((sublink) => (
                      <Button
                        key={sublink.to}
                        as={RouterLink}
                        to={sublink.to}
                        justifyContent="flex-start"
                        leftIcon={<Icon as={sublink.icon} boxSize={3} />}
                        variant={isActive(sublink.to) ? 'solid' : 'ghost'}
                        colorScheme={isActive(sublink.to) ? 'blue' : 'gray'}
                        size="sm"
                      >
                        {sublink.label}
                      </Button>
                    ))}
                  </VStack>
                </Collapse>
              </Box>
            )
          }
          
          return (
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
          )
        })}
      </VStack>
    </Box>
  )
}
