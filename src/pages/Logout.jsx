import React from 'react'
import { Box, Button, Heading, Text } from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Logout() {
  const auth = useAuth()
  const navigate = useNavigate()

  async function onConfirm() {
    await auth.logout()
    navigate('/login')
  }

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} bg="white" borderRadius="md" boxShadow="sm">
      <Heading size="md" mb={4}>Sair</Heading>
      <Text mb={4}>Tem certeza que deseja sair da sua conta?</Text>
      <Button colorScheme="red" onClick={onConfirm}>Sair</Button>
    </Box>
  )
}
