import React from 'react'
import { Box, Flex, Heading, Spacer, Link, Button, Text } from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const auth = useAuth()
  const navigate = useNavigate()

  async function onLogout() {
    await auth.logout()
    navigate('/login')
  }

  return (
    <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
      <Flex align="center">
        <Heading size="md">Varejix — Gestão Varejista</Heading>
        <Spacer />
        <Link as={RouterLink} to="/" mr={4}>Dashboard</Link>
        <Link as={RouterLink} to="/products" mr={4}>Produtos</Link>
        <Link as={RouterLink} to="/inventory" mr={4}>Estoque</Link>
        <Link as={RouterLink} to="/sales" mr={4}>Vendas</Link>

        {auth.isAuthenticated ? (
          <>
            <Text mr={3}>Olá, {auth.user?.name || auth.user?.username || 'Usuário'}</Text>
            <Button size="sm" onClick={onLogout}>Sair</Button>
          </>
        ) : (
          <Button as={RouterLink} to="/login" size="sm" colorScheme="blue">Entrar</Button>
        )}
      </Flex>
    </Box>
  )
}
