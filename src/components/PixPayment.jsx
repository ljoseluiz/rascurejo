import React, { useEffect, useState, useRef } from 'react'
import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Text,
  Divider,
  useToast,
  Spinner,
  Badge,
  Flex,
  Icon,
  Code,
  Tooltip,
  IconButton
} from '@chakra-ui/react'
import { FiCheck, FiClock, FiCopy, FiX } from 'react-icons/fi'
import QRCode from 'qrcode'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function PixPayment({ amount, onPaymentConfirmed, onCancel }) {
  const auth = useAuth()
  const toast = useToast()
  const canvasRef = useRef(null)
  const [pixData, setPixData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending') // pending, paid, expired, cancelled
  const [qrGenerated, setQrGenerated] = useState(false) // Rastrear se QR foi gerado
  const [pollInterval, setPollInterval] = useState(null)
  const [remainingTime, setRemainingTime] = useState(300) // 5 minutos

  // Formata valor para PIX
  const formatPixAmount = (value) => {
    return (value / 100).toFixed(2).replace('.', ',')
  }

  // Gera QR Code no canvas
  useEffect(() => {
    if (!pixData || status !== 'pending' || loading) {
      console.log('⚠️ Aguardando condições:', { 
        pixData: !!pixData, 
        status, 
        loading,
        canvasExists: !!canvasRef.current 
      })
      return
    }

    // Aguardar o canvas estar disponível no DOM
    const timer = setTimeout(() => {
      if (!canvasRef.current) {
        console.error('❌ Canvas ref não disponível após timeout!')
        console.error('   - Tentando novamente em 200ms...')
        
        // Tentar novamente após mais tempo
        setTimeout(() => {
          if (!canvasRef.current) {
            console.error('❌ Canvas ref ainda não disponível!')
            setQrGenerated(false)
            return
          }
          generateQRCode()
        }, 200)
        return
      }

      generateQRCode()
    }, 100) // Aguardar 100ms para o canvas estar no DOM

    function generateQRCode() {
      console.log('🎯 Tentando gerar QR Code...')
      console.log('📦 pixData completo:', pixData)
    
    try {
      // Usar a string PIX do backend
      const qrString = pixData.qr_code_string || pixData.qr_code
      
      console.log('🔍 String PIX para QR Code:')
      console.log('   - Primeiros 100 chars:', qrString?.substring(0, 100))
      console.log('   - Últimos 50 chars:', qrString?.substring(qrString.length - 50))
      console.log('   - Tamanho total:', qrString?.length)
      console.log('   - Tipo:', typeof qrString)
      
      if (!qrString || typeof qrString !== 'string') {
        console.error('❌ String PIX inválida ou ausente!')
        console.error('   - qr_code_string:', pixData.qr_code_string)
        console.error('   - qr_code:', pixData.qr_code)
        setQrGenerated(false)
        return
      }

      console.log('🚀 Chamando QRCode.toCanvas...')
      QRCode.toCanvas(canvasRef.current, qrString, {
        width: 250,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) {
          console.error('❌ Erro no callback do QRCode.toCanvas:', error)
          console.error('   - Mensagem:', error.message)
          console.error('   - Stack:', error.stack)
          setQrGenerated(false)
        } else {
          console.log('✅ QR Code gerado com sucesso no canvas!')
          setQrGenerated(true)
        }
      })
    } catch (err) {
      console.error('❌ Exceção ao renderizar QR Code:', err)
      console.error('   - Mensagem:', err.message)
      console.error('   - Stack:', err.stack)
      setQrGenerated(false)
    }
    }

    return () => clearTimeout(timer)
  }, [pixData, status, loading])

  // Gera chave PIX e QR Code
  useEffect(() => {
    async function generatePix() {
      try {
        console.log('🚀 Iniciando geração de PIX...')
        setLoading(true)
        const opts = api.injectCsrf({}, auth.csrfToken)
        
        console.log('📤 Enviando requisição POST /payments/pix/generate')
        const response = await api.post('/payments/pix/generate', {
          amount: Math.round(amount * 100), // em centavos
          description: 'Venda Varejix'
        }, opts)

        console.log('📥 Resposta recebida:', response)
        setPixData(response)
        setStatus('pending')
        setRemainingTime(300)

        // Aguardar um pouco para garantir que o canvas renderize
        setTimeout(() => {
          console.log('✅ Canvas renderizado, removendo loading')
          setLoading(false)
        }, 500)

        // Iniciar polling para verificar pagamento
        pollPaymentStatus(response.transaction_id)
      } catch (err) {
        console.error('❌ Erro ao gerar PIX:', err)
        toast({
          title: 'Erro ao gerar QR Code PIX',
          description: err.message,
          status: 'error',
          duration: 4000,
          isClosable: true
        })
        setLoading(false)
      }
    }

    generatePix()

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [amount, auth.csrfToken, toast])

  // Polling para verificar status do pagamento
  const pollPaymentStatus = (transactionId) => {
    let timeRemaining = 300
    
    const interval = setInterval(async () => {
      timeRemaining--
      setRemainingTime(timeRemaining)

      if (timeRemaining <= 0) {
        clearInterval(interval)
        setStatus('expired')
        return
      }

      try {
        const opts = api.injectCsrf({}, auth.csrfToken)
        const response = await api.get(`/payments/pix/status/${transactionId}`, opts)

        console.log('Status do pagamento:', response.status)

        if (response.status === 'paid') {
          console.log('Pagamento confirmado!')
          clearInterval(interval)
          setStatus('paid')
          // Esperar 3 segundos antes de chamar callback para o usuário ver a confirmação
          setTimeout(() => {
            console.log('Finalizando venda após confirmação PIX')
            onPaymentConfirmed(response)
          }, 3000)
        }
      } catch (err) {
        console.error('Erro ao verificar status:', err)
      }
    }, 2000) // Verifica a cada 2 segundos

    setPollInterval(interval)
  }

  // Copia texto para clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copiado!',
      description: 'QR Code PIX copiado para área de transferência',
      status: 'success',
      duration: 2000,
      isClosable: true
    })
  }

  // Download do QR Code
  const downloadQRCode = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = url
      link.download = `pix-qrcode-${Date.now()}.png`
      link.click()
    }
  }

  if (loading) {
    return (
      <VStack spacing={4} p={6} align="center" justify="center" minH="400px">
        <Spinner size="lg" color="blue.500" />
        <Text>Gerando QR Code PIX...</Text>
      </VStack>
    )
  }

  return (
    <VStack spacing={6} p={6} align="center" w="full" maxW="400px" mx="auto">
      {/* Status Badge */}
      <Flex justify="space-between" align="center" w="full">
        <Heading size="md">Pagamento PIX</Heading>
        {status === 'pending' && (
          <Badge colorScheme="blue" fontSize="sm">
            <HStack spacing={1}>
              <Icon as={FiClock} />
              <Text>Aguardando</Text>
            </HStack>
          </Badge>
        )}
        {status === 'paid' && (
          <Badge colorScheme="green" fontSize="sm">
            <HStack spacing={1}>
              <Icon as={FiCheck} />
              <Text>Pago!</Text>
            </HStack>
          </Badge>
        )}
        {status === 'expired' && (
          <Badge colorScheme="red" fontSize="sm">
            <HStack spacing={1}>
              <Icon as={FiX} />
              <Text>Expirado</Text>
            </HStack>
          </Badge>
        )}
      </Flex>

      {/* Valor */}
      <VStack spacing={2} w="full" bg="gray.50" p={4} borderRadius="md">
        <Text fontSize="sm" color="gray.600">Valor a pagar</Text>
        <Heading size="lg" color="green.600">
          R$ {amount.toFixed(2)}
        </Heading>
      </VStack>

      {/* QR Code */}
      {pixData && status === 'pending' && (
        <>
          <Box
            p={4}
            borderWidth="2px"
            borderStyle="dashed"
            borderColor="blue.300"
            borderRadius="lg"
            bg="white"
            display="flex"
            justifyContent="center"
            alignItems="center"
            minH="270px"
            minW="270px"
            position="relative"
          >
            {/* Canvas sempre renderizado, mas pode estar invisível */}
            <canvas 
              ref={canvasRef} 
              style={{ 
                maxWidth: '100%',
                display: (loading || !qrGenerated) ? 'none' : 'block'
              }} 
            />
            
            {/* Spinner por cima durante loading */}
            {loading && (
              <Box position="absolute" top="0" left="0" right="0" bottom="0" display="flex" alignItems="center" justifyContent="center" bg="white" zIndex={2}>
                <Spinner size="lg" color="blue.500" />
              </Box>
            )}
            
            {/* Mensagem de erro se falhou */}
            {!loading && !qrGenerated && (
              <VStack spacing={2}>
                <Text color="red.500" textAlign="center" fontWeight="bold">
                  Erro ao gerar QR Code
                </Text>
                <Text color="gray.600" fontSize="sm" textAlign="center">
                  Use "Copia e Cola" abaixo para realizar o pagamento
                </Text>
              </VStack>
            )}
          </Box>
        </>
      )}

      {/* QR Code String (para copiar) */}
      {pixData?.qr_code_string && status === 'pending' && (
        <VStack spacing={2} w="full" bg="gray.50" p={3} borderRadius="md">
          <Text fontSize="xs" color="gray.600" fontWeight="bold">
            Copia e Cola
          </Text>
          <HStack spacing={2} w="full">
            <Code p={2} fontSize="xs" flex={1} wordBreak="break-all" bg="white">
              {pixData.qr_code_string.substring(0, 40)}...
            </Code>
            <Tooltip label="Copiar código PIX">
              <IconButton
                icon={<FiCopy />}
                size="sm"
                onClick={() => copyToClipboard(pixData.qr_code_string)}
                colorScheme="blue"
                variant="outline"
              />
            </Tooltip>
          </HStack>
        </VStack>
      )}

      {/* Timer */}
      {status === 'pending' && (
        <VStack spacing={1} w="full">
          <Text fontSize="sm" color="gray.600">
            Tempo restante: {Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')}
          </Text>
          <Box w="full" h="2px" bg="gray.200" borderRadius="full" overflow="hidden">
            <Box
              h="full"
              bg="green.500"
              w={`${(remainingTime / 300) * 100}%`}
              transition="width 0.3s ease"
            />
          </Box>
        </VStack>
      )}

      {/* ID da Transação */}
      {pixData && (
        <VStack spacing={1} w="full" bg="gray.50" p={3} borderRadius="md">
          <Text fontSize="xs" color="gray.600">ID da Transação</Text>
          <Code fontSize="xs" p={2} bg="white" w="full" textAlign="center">
            {pixData.transaction_id}
          </Code>
        </VStack>
      )}

      {/* Mensagem de Sucesso */}
      {status === 'paid' && (
        <VStack spacing={3} w="full" bg="green.50" p={4} borderRadius="lg" borderLeftWidth="4px" borderLeftColor="green.500">
          <Icon as={FiCheck} fontSize="32px" color="green.600" />
          <VStack spacing={1}>
            <Text fontWeight="bold" color="green.800">Pagamento Confirmado!</Text>
            <Text fontSize="sm" color="green.700">
              A transação foi processada com sucesso.
            </Text>
          </VStack>
        </VStack>
      )}

      {/* Mensagem de Expiração */}
      {status === 'expired' && (
        <VStack spacing={3} w="full" bg="red.50" p={4} borderRadius="lg" borderLeftWidth="4px" borderLeftColor="red.500">
          <Icon as={FiX} fontSize="32px" color="red.600" />
          <VStack spacing={1}>
            <Text fontWeight="bold" color="red.800">QR Code Expirado</Text>
            <Text fontSize="sm" color="red.700">
              O tempo para realizar o pagamento acabou.
            </Text>
          </VStack>
        </VStack>
      )}

      <Divider />

      {/* Botões */}
      <HStack spacing={3} w="full">
        {status === 'pending' && (
          <>
            <Button
              flex={1}
              onClick={downloadQRCode}
              colorScheme="blue"
              variant="outline"
              size="sm"
            >
              Baixar QR Code
            </Button>
            <Button
              flex={1}
              onClick={() => {
                if (pollInterval) clearInterval(pollInterval)
                onCancel()
              }}
              colorScheme="red"
              variant="outline"
              size="sm"
            >
              Cancelar
            </Button>
          </>
        )}

        {(status === 'expired' || status === 'cancelled') && (
          <>
            <Button
              flex={1}
              onClick={() => window.location.reload()}
              colorScheme="blue"
              size="sm"
            >
              Tentar Novamente
            </Button>
            <Button
              flex={1}
              onClick={onCancel}
              colorScheme="red"
              variant="outline"
              size="sm"
            >
              Cancelar
            </Button>
          </>
        )}

        {status === 'paid' && (
          <Button
            w="full"
            onClick={() => onPaymentConfirmed(pixData)}
            colorScheme="green"
            size="sm"
          >
            Continuar
          </Button>
        )}
      </HStack>

      {/* Instruções */}
      {status === 'pending' && (
        <Box w="full" bg="blue.50" p={3} borderRadius="md" borderLeftWidth="4px" borderLeftColor="blue.500">
          <Text fontSize="xs" color="blue.800" lineHeight="1.5">
            <strong>Como pagar:</strong><br/>
            1️⃣ Abra o app do seu banco<br/>
            2️⃣ Escolha a opção PIX<br/>
            3️⃣ Leia o QR Code acima<br/>
            4️⃣ Confirme o pagamento
          </Text>
        </Box>
      )}
    </VStack>
  )
}
