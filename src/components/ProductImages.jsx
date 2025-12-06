import React, { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  IconButton,
  Image,
  Input,
  SimpleGrid,
  Text,
  VStack,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  useToast
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, AttachmentIcon } from '@chakra-ui/icons'

/**
 * ProductImages.jsx
 * Componente para gerenciar imagens do produto (URL ou upload)
 * Props:
 *   - images: array de { id, url, alt }
 *   - onChange: callback quando imagens mudam
 */
export default function ProductImages({ images = [], onChange }) {
  const toast = useToast()
  const [newUrl, setNewUrl] = useState('')
  const [newAlt, setNewAlt] = useState('')

  const addImageFromUrl = () => {
    if (!newUrl.trim()) return
    
    const newImage = {
      id: Date.now(),
      url: newUrl.trim(),
      alt: newAlt.trim() || 'Imagem do produto'
    }
    
    onChange([...images, newImage])
    setNewUrl('')
    setNewAlt('')
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erro', description: 'Arquivo deve ser uma imagem', status: 'error', duration: 3000, isClosable: true })
      return
    }

    // Validar tamanho (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Erro', description: 'Imagem deve ter no máximo 5MB', status: 'error', duration: 3000, isClosable: true })
      return
    }

    try {
      // Converter imagem para base64
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64Url = event.target.result
        const newImage = {
          id: Date.now(),
          url: base64Url,
          alt: file.name || 'Imagem do produto'
        }
        onChange([...images, newImage])
        toast({ title: 'Imagem adicionada', status: 'success', duration: 2000, isClosable: true })
      }
      reader.onerror = () => {
        toast({ title: 'Erro ao ler arquivo', status: 'error', duration: 3000, isClosable: true })
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Erro ao processar imagem:', err)
      toast({ title: 'Erro ao processar imagem', status: 'error', duration: 3000, isClosable: true })
    }

    // Limpar input
    e.target.value = ''
  }

  const removeImage = (id) => {
    onChange(images.filter(img => img.id !== id))
  }

  return (
    <VStack align="start" spacing={4} w="full">
      <Text fontSize="md" fontWeight="bold">Imagens do Produto</Text>

      {/* Tabs para escolher entre URL e Upload */}
      <Box w="full" borderWidth={1} borderRadius="md" borderColor="gray.200" bg="gray.50">
        <Tabs colorScheme="blue" size="sm">
          <TabList>
            <Tab>URL da Imagem</Tab>
            <Tab>Upload de Arquivo</Tab>
          </TabList>

          <TabPanels>
            {/* Tab 1: URL */}
            <TabPanel>
              <VStack spacing={3} align="start">
                <FormControl>
                  <FormLabel fontSize="sm">URL da Imagem</FormLabel>
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    bg="white"
                    size="sm"
                  />
                  <FormHelperText>Cole o link da imagem hospedada online</FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm">Descrição (alt text)</FormLabel>
                  <Input
                    value={newAlt}
                    onChange={(e) => setNewAlt(e.target.value)}
                    placeholder="Vista frontal do produto"
                    bg="white"
                    size="sm"
                  />
                </FormControl>

                <Button
                  colorScheme="blue"
                  size="sm"
                  onClick={addImageFromUrl}
                  leftIcon={<AddIcon />}
                  isDisabled={!newUrl.trim()}
                >
                  Adicionar Imagem
                </Button>
              </VStack>
            </TabPanel>

            {/* Tab 2: Upload */}
            <TabPanel>
              <VStack spacing={3} align="start">
                <FormControl>
                  <FormLabel fontSize="sm">Selecionar Arquivo</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    size="sm"
                    p={1}
                    bg="white"
                  />
                  <FormHelperText>
                    Formatos aceitos: JPG, PNG, GIF, WebP. Tamanho máximo: 5MB
                  </FormHelperText>
                </FormControl>

                <Button
                  as="label"
                  htmlFor="file-upload-hidden"
                  colorScheme="blue"
                  size="sm"
                  leftIcon={<AttachmentIcon />}
                  cursor="pointer"
                >
                  Escolher Arquivo
                  <Input
                    id="file-upload-hidden"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    display="none"
                  />
                </Button>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Grid de imagens */}
      {images.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} w="full">
          {images.map((image) => (
            <Box
              key={image.id}
              position="relative"
              borderWidth={1}
              borderRadius="md"
              overflow="hidden"
              bg="white"
              _hover={{ boxShadow: 'md' }}
            >
              <Image
                src={image.url}
                alt={image.alt}
                w="full"
                h="150px"
                objectFit="cover"
                fallbackSrc="https://via.placeholder.com/300x150?text=Imagem+Inválida"
              />
              <Box p={2} bg="gray.50">
                <HStack justify="space-between" align="start">
                  <Text fontSize="xs" color="gray.600" noOfLines={2} flex="1">
                    {image.alt || 'Sem descrição'}
                  </Text>
                  <IconButton
                    icon={<DeleteIcon />}
                    size="xs"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => removeImage(image.id)}
                    aria-label="Remover imagem"
                  />
                </HStack>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      ) : (
        <Box
          w="full"
          p={6}
          borderWidth={2}
          borderStyle="dashed"
          borderColor="gray.300"
          borderRadius="md"
          textAlign="center"
        >
          <Text fontSize="sm" color="gray.400">
            Nenhuma imagem adicionada
          </Text>
        </Box>
      )}
    </VStack>
  )
}
