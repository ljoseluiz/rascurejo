import React from 'react'
import { Box, Flex, Heading, Spacer, Button, Text, HStack, IconButton } from '@chakra-ui/react'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { FiMenu } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

export default function Header({ onToggleSidebar }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/products', label: 'Produtos' },
    { to: '/inventory', label: 'Estoque' },
    { to: '/sales', label: 'Vendas' },
    { to: '/reports', label: 'Relatórios' }
  ]

  const isActive = (path) => location.pathname === path

  async function onLogout() {
    await auth.logout()
    navigate('/login')
  }

  return (
    <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
      <Flex align="center" gap={4} wrap="wrap">
        <IconButton
          aria-label="Alternar menu lateral"
          icon={<FiMenu />}
          variant="ghost"
          colorScheme="blue"
          onClick={onToggleSidebar}
          display={{ base: 'inline-flex', md: 'inline-flex' }}
        />
        <Heading size="md" whiteSpace="nowrap">Varejix — Gestão Varejista</Heading>
        <Spacer />

        <HStack spacing={2} wrap="wrap" display={{ base: 'none', md: 'flex' }}>
          {links.map((link) => (
            <Button
              key={link.to}
              as={RouterLink}
              to={link.to}
              variant={isActive(link.to) ? 'solid' : 'ghost'}
              colorScheme="blue"
              size="sm"
            >
              {link.label}
            </Button>
          ))}
        </HStack>

        {auth.isAuthenticated ? (
          <HStack spacing={3} ml={2}>
            <Text color="gray.600">Olá, {auth.user?.name || auth.user?.username || 'Usuário'}</Text>
            <Button size="sm" onClick={onLogout} variant="outline">Sair</Button>
          </HStack>
        ) : (
          <Button as={RouterLink} to="/login" size="sm" colorScheme="blue">Entrar</Button>
        )}
      </Flex>
    </Box>
  )
}
