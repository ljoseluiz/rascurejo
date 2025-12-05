import React, { useState } from 'react'
import { Box, Input, Button, Heading, Text, VStack } from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Login() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/'

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // login will set httpOnly cookie on success and return user
      await auth.login(username, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Falha ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} bg="white" borderRadius="md" boxShadow="sm">
      <Heading size="md" mb={4}>Entrar</Heading>
      <form onSubmit={onSubmit}>
        <VStack spacing={3} align="stretch">
          <Input placeholder="Usuário" value={username} onChange={e => setUsername(e.target.value)} />
          <Input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <Text color="red.500">{error}</Text>}
          <Button type="submit" colorScheme="blue" isLoading={loading}>Entrar</Button>
        </VStack>
      </form>
    </Box>
  )
}
