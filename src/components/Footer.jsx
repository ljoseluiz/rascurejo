import React from 'react'
import { Box, Container, Grid, Heading, Text, Link, HStack, VStack, Divider, Icon, Stack } from '@chakra-ui/react'
import { FaGithub, FaLinkedin, FaTwitter, FaEnvelope, FaPhone, FaMapMarkerAlt, FaShoppingCart, FaChartLine, FaBoxes, FaFileInvoice } from 'react-icons/fa'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <Box bg="gray.900" color="white" mt={16}>
      <Container maxW="container.xl" py={12}>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={8} mb={8}>
          {/* About Section */}
          <VStack align="start" spacing={4}>
            <Heading size="md" color="blue.400" fontWeight="bold">
              <Icon as={FaShoppingCart} mr={2} />
              Varejix
            </Heading>
            <Text fontSize="sm" color="gray.400">
              Sistema completo de gestão varejista com controle de estoque, vendas, relatórios e dashboards analíticos.
            </Text>
            <HStack spacing={4} mt={2}>
              <Link href="https://github.com" isExternal _hover={{ color: 'blue.400' }}>
                <Icon as={FaGithub} boxSize={5} />
              </Link>
              <Link href="https://linkedin.com" isExternal _hover={{ color: 'blue.400' }}>
                <Icon as={FaLinkedin} boxSize={5} />
              </Link>
              <Link href="https://twitter.com" isExternal _hover={{ color: 'blue.400' }}>
                <Icon as={FaTwitter} boxSize={5} />
              </Link>
            </HStack>
          </VStack>

          {/* Quick Links */}
          <VStack align="start" spacing={3}>
            <Heading size="sm" mb={2}>Links Rápidos</Heading>
            <Link href="/dashboard" fontSize="sm" color="gray.400" _hover={{ color: 'white', textDecoration: 'none' }}>
              <Icon as={FaChartLine} mr={2} />
              Dashboard
            </Link>
            <Link href="/products" fontSize="sm" color="gray.400" _hover={{ color: 'white', textDecoration: 'none' }}>
              <Icon as={FaShoppingCart} mr={2} />
              Produtos
            </Link>
            <Link href="/inventory" fontSize="sm" color="gray.400" _hover={{ color: 'white', textDecoration: 'none' }}>
              <Icon as={FaBoxes} mr={2} />
              Estoque
            </Link>
            <Link href="/sales" fontSize="sm" color="gray.400" _hover={{ color: 'white', textDecoration: 'none' }}>
              <Icon as={FaFileInvoice} mr={2} />
              Vendas
            </Link>
          </VStack>

          {/* Support */}
          <VStack align="start" spacing={3}>
            <Heading size="sm" mb={2}>Suporte</Heading>
            <Link href="#" fontSize="sm" color="gray.400" _hover={{ color: 'white', textDecoration: 'none' }}>
              Central de Ajuda
            </Link>
            <Link href="#" fontSize="sm" color="gray.400" _hover={{ color: 'white', textDecoration: 'none' }}>
              Documentação
            </Link>
            <Link href="#" fontSize="sm" color="gray.400" _hover={{ color: 'white', textDecoration: 'none' }}>
              API Reference
            </Link>
            <Link href="#" fontSize="sm" color="gray.400" _hover={{ color: 'white', textDecoration: 'none' }}>
              Política de Privacidade
            </Link>
          </VStack>

          {/* Contact */}
          <VStack align="start" spacing={3}>
            <Heading size="sm" mb={2}>Contato</Heading>
            <HStack spacing={2}>
              <Icon as={FaEnvelope} color="blue.400" />
              <Text fontSize="sm" color="gray.400">contato@varejix.com.br</Text>
            </HStack>
            <HStack spacing={2}>
              <Icon as={FaPhone} color="blue.400" />
              <Text fontSize="sm" color="gray.400">(11) 3456-7890</Text>
            </HStack>
            <HStack spacing={2}>
              <Icon as={FaMapMarkerAlt} color="blue.400" />
              <Text fontSize="sm" color="gray.400">São Paulo, SP - Brasil</Text>
            </HStack>
          </VStack>
        </Grid>

        <Divider borderColor="gray.700" my={6} />

        {/* Bottom Bar */}
        <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" spacing={4}>
          <Text fontSize="sm" color="gray.500">
            © {currentYear} Varejix. Todos os direitos reservados.
          </Text>
          <HStack spacing={6}>
            <Link href="#" fontSize="sm" color="gray.500" _hover={{ color: 'white' }}>
              Termos de Uso
            </Link>
            <Link href="#" fontSize="sm" color="gray.500" _hover={{ color: 'white' }}>
              Privacidade
            </Link>
            <Link href="#" fontSize="sm" color="gray.500" _hover={{ color: 'white' }}>
              Cookies
            </Link>
          </HStack>
        </Stack>

        {/* Tech Badge */}
        <Box mt={6} textAlign="center">
          <Text fontSize="xs" color="gray.600">
            Desenvolvido com React + Vite • Powered by Chakra UI
          </Text>
        </Box>
      </Container>
    </Box>
  )
}