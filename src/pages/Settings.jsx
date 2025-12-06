import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useToast,
  HStack,
  VStack,
  Text,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Image,
  Card,
  CardBody,
  SimpleGrid,
  Divider,
  Badge,
  useColorMode,
  Icon,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react'
import { FiUpload, FiDroplet, FiType, FiMoon, FiSun, FiSave, FiRefreshCw } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const auth = useAuth()
  const toast = useToast()
  const { colorMode, toggleColorMode } = useColorMode()
  
  const [config, setConfig] = useState({
    logo: null,
    logoPreview: '/logo-placeholder.png',
    logoData: null,
    primaryColor: '#3182CE',
    secondaryColor: '#48BB78',
    accentColor: '#ED8936',
    fontFamily: 'Inter',
    fontSize: 'md',
    darkMode: false,
    companyName: 'Varejix',
    companySlogan: 'Sistema de Gestão Comercial',
  })

  const [logoFile, setLogoFile] = useState(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const applyTheme = (cfg) => {
    if (!cfg) return
    document.documentElement.style.setProperty('--primary-color', cfg.primaryColor)
    document.documentElement.style.setProperty('--secondary-color', cfg.secondaryColor)
    document.documentElement.style.setProperty('--accent-color', cfg.accentColor)
    if (cfg.fontFamily) {
      document.body.style.fontFamily = cfg.fontFamily
    }
    if (cfg.fontSize) {
      document.documentElement.style.setProperty('font-size', cfg.fontSize === 'sm' ? '14px' : cfg.fontSize === 'md' ? '16px' : cfg.fontSize === 'lg' ? '18px' : '20px')
    }
    if (cfg.companyName) {
      document.title = cfg.companyName
    }
  }

  const loadSettings = () => {
    // Carregar configurações do localStorage
    const saved = localStorage.getItem('varejix_settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      setConfig((prev) => ({ ...prev, ...parsed }))
      applyTheme(parsed)
      
      // Aplicar tema
      if (parsed.darkMode && colorMode === 'light') {
        toggleColorMode()
      } else if (!parsed.darkMode && colorMode === 'dark') {
        toggleColorMode()
      }
    }
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'A logo deve ter no máximo 2MB',
          status: 'error',
        })
        return
      }

      setLogoFile(file)
      
      // Preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setConfig((prev) => ({ ...prev, logoPreview: reader.result, logoData: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveSettings = () => {
    // Salvar no localStorage
    const toSave = { ...config }
    localStorage.setItem('varejix_settings', JSON.stringify(toSave))
    
    // Aplicar cores CSS
    applyTheme(config)

    // Informar outros componentes para recarregar branding
    window.dispatchEvent(new Event('varejix-settings-changed'))
    
    toast({
      title: 'Configurações salvas',
      description: 'As alterações foram aplicadas com sucesso',
      status: 'success',
    })
  }

  const handleResetSettings = () => {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      localStorage.removeItem('varejix_settings')
      setConfig({
        logo: null,
        logoPreview: '/logo-placeholder.png',
        logoData: null,
        primaryColor: '#3182CE',
        secondaryColor: '#48BB78',
        accentColor: '#ED8936',
        fontFamily: 'Inter',
        fontSize: 'md',
        darkMode: false,
        companyName: 'Varejix',
        companySlogan: 'Sistema de Gestão Comercial',
      })
      
      if (colorMode === 'dark') {
        toggleColorMode()
      }

      applyTheme({
        primaryColor: '#3182CE',
        secondaryColor: '#48BB78',
        accentColor: '#ED8936',
        companyName: 'Varejix',
      })

      window.dispatchEvent(new Event('varejix-settings-changed'))
      
      toast({
        title: 'Configurações restauradas',
        status: 'info',
      })
    }
  }

  const handleDarkModeToggle = () => {
    toggleColorMode()
    setConfig({ ...config, darkMode: !config.darkMode })
  }

  const fontOptions = [
    { value: 'Inter', label: 'Inter (Padrão)' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Montserrat', label: 'Montserrat' },
  ]

  const fontSizeOptions = [
    { value: 'sm', label: 'Pequeno' },
    { value: 'md', label: 'Médio (Padrão)' },
    { value: 'lg', label: 'Grande' },
    { value: 'xl', label: 'Extra Grande' },
  ]

  return (
    <Box p={6} w="full" bg={colorMode === 'dark' ? 'gray.800' : 'gray.50'} minH="100vh">
      <HStack justify="space-between" mb={6}>
        <Box>
          <Heading size="xl" color={colorMode === 'dark' ? 'white' : 'gray.800'}>
            Configurações
          </Heading>
          <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} mt={1}>
            Personalize a aparência do sistema
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button
            leftIcon={<FiRefreshCw />}
            variant="outline"
            onClick={handleResetSettings}
          >
            Restaurar Padrão
          </Button>
          <Button
            leftIcon={<FiSave />}
            colorScheme="blue"
            onClick={handleSaveSettings}
          >
            Salvar Alterações
          </Button>
        </HStack>
      </HStack>

      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>
            <Icon as={FiUpload} mr={2} />
            Logo e Identidade
          </Tab>
          <Tab>
            <Icon as={FiDroplet} mr={2} />
            Cores e Tema
          </Tab>
          <Tab>
            <Icon as={FiType} mr={2} />
            Tipografia
          </Tab>
        </TabList>

        <TabPanels>
          {/* Tab 1: Logo e Identidade */}
          <TabPanel>
            <Card bg={colorMode === 'dark' ? 'gray.700' : 'white'} boxShadow="md">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={4}>Logo da Empresa</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <VStack spacing={4}>
                        <FormControl>
                          <FormLabel>Upload da Logo</FormLabel>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            p={1}
                          />
                          <Text fontSize="xs" color="gray.500" mt={2}>
                            Formatos aceitos: PNG, JPG, SVG (máx. 2MB)
                          </Text>
                        </FormControl>

                        <Box
                          w="full"
                          h="200px"
                          bg={colorMode === 'dark' ? 'gray.600' : 'gray.100'}
                          borderRadius="md"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          border="2px dashed"
                          borderColor="gray.300"
                        >
                          {config.logoPreview ? (
                            <Image
                              src={config.logoPreview}
                              alt="Logo preview"
                              maxH="180px"
                              maxW="90%"
                              objectFit="contain"
                            />
                          ) : (
                            <VStack>
                              <Icon as={FiUpload} boxSize={10} color="gray.400" />
                              <Text color="gray.500">Preview da logo</Text>
                            </VStack>
                          )}
                        </Box>
                      </VStack>

                      <VStack spacing={4} align="stretch">
                        <FormControl>
                          <FormLabel>Nome da Empresa</FormLabel>
                          <Input
                            value={config.companyName}
                            onChange={(e) =>
                              setConfig({ ...config, companyName: e.target.value })
                            }
                            placeholder="Digite o nome da empresa"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Slogan</FormLabel>
                          <Input
                            value={config.companySlogan}
                            onChange={(e) =>
                              setConfig({ ...config, companySlogan: e.target.value })
                            }
                            placeholder="Digite o slogan"
                          />
                        </FormControl>

                        <Box
                          p={4}
                          bg={colorMode === 'dark' ? 'gray.600' : 'blue.50'}
                          borderRadius="md"
                          borderLeft="4px"
                          borderColor="blue.500"
                        >
                          <Text fontWeight="bold" mb={2}>
                            Preview do Header
                          </Text>
                          <HStack spacing={3}>
                            {config.logoPreview && (
                              <Image
                                src={config.logoPreview}
                                alt="Logo"
                                h="40px"
                                objectFit="contain"
                              />
                            )}
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold" fontSize="lg">
                                {config.companyName}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                {config.companySlogan}
                              </Text>
                            </VStack>
                          </HStack>
                        </Box>
                      </VStack>
                    </SimpleGrid>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Tab 2: Cores e Tema */}
          <TabPanel>
            <Card bg={colorMode === 'dark' ? 'gray.700' : 'white'} boxShadow="md">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={4}>Modo de Cor</Heading>
                    <HStack
                      p={4}
                      bg={colorMode === 'dark' ? 'gray.600' : 'gray.50'}
                      borderRadius="md"
                      justify="space-between"
                    >
                      <HStack>
                        <Icon
                          as={colorMode === 'dark' ? FiMoon : FiSun}
                          boxSize={6}
                          color={colorMode === 'dark' ? 'blue.300' : 'orange.400'}
                        />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold">
                            Modo {colorMode === 'dark' ? 'Escuro' : 'Claro'}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            {colorMode === 'dark'
                              ? 'Reduz o cansaço visual em ambientes escuros'
                              : 'Ideal para uso durante o dia'}
                          </Text>
                        </VStack>
                      </HStack>
                      <Switch
                        size="lg"
                        isChecked={colorMode === 'dark'}
                        onChange={handleDarkModeToggle}
                        colorScheme="blue"
                      />
                    </HStack>
                  </Box>

                  <Divider />

                  <Box>
                    <Heading size="md" mb={4}>Paleta de Cores</Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                      <FormControl>
                        <FormLabel>Cor Primária</FormLabel>
                        <HStack>
                          <Input
                            type="color"
                            value={config.primaryColor}
                            onChange={(e) =>
                              setConfig({ ...config, primaryColor: e.target.value })
                            }
                            w="60px"
                            h="40px"
                            p={1}
                          />
                          <Input
                            value={config.primaryColor}
                            onChange={(e) =>
                              setConfig({ ...config, primaryColor: e.target.value })
                            }
                            placeholder="#3182CE"
                          />
                        </HStack>
                        <Box
                          mt={2}
                          h="40px"
                          bg={config.primaryColor}
                          borderRadius="md"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color="white" fontWeight="bold">
                            Primária
                          </Text>
                        </Box>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Cor Secundária</FormLabel>
                        <HStack>
                          <Input
                            type="color"
                            value={config.secondaryColor}
                            onChange={(e) =>
                              setConfig({ ...config, secondaryColor: e.target.value })
                            }
                            w="60px"
                            h="40px"
                            p={1}
                          />
                          <Input
                            value={config.secondaryColor}
                            onChange={(e) =>
                              setConfig({ ...config, secondaryColor: e.target.value })
                            }
                            placeholder="#48BB78"
                          />
                        </HStack>
                        <Box
                          mt={2}
                          h="40px"
                          bg={config.secondaryColor}
                          borderRadius="md"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color="white" fontWeight="bold">
                            Secundária
                          </Text>
                        </Box>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Cor de Destaque</FormLabel>
                        <HStack>
                          <Input
                            type="color"
                            value={config.accentColor}
                            onChange={(e) =>
                              setConfig({ ...config, accentColor: e.target.value })
                            }
                            w="60px"
                            h="40px"
                            p={1}
                          />
                          <Input
                            value={config.accentColor}
                            onChange={(e) =>
                              setConfig({ ...config, accentColor: e.target.value })
                            }
                            placeholder="#ED8936"
                          />
                        </HStack>
                        <Box
                          mt={2}
                          h="40px"
                          bg={config.accentColor}
                          borderRadius="md"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color="white" fontWeight="bold">
                            Destaque
                          </Text>
                        </Box>
                      </FormControl>
                    </SimpleGrid>
                  </Box>

                  <Divider />

                  <Box>
                    <Heading size="md" mb={4}>Preview do Tema</Heading>
                    <Box
                      p={6}
                      bg={colorMode === 'dark' ? 'gray.600' : 'white'}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                    >
                      <HStack spacing={4} mb={4}>
                        <Button colorScheme="blue" bg={config.primaryColor}>
                          Botão Primário
                        </Button>
                        <Button colorScheme="green" bg={config.secondaryColor}>
                          Botão Secundário
                        </Button>
                        <Button colorScheme="orange" bg={config.accentColor}>
                          Botão Destaque
                        </Button>
                      </HStack>
                      <HStack spacing={2}>
                        <Badge colorScheme="blue" bg={config.primaryColor} color="white">
                          Badge 1
                        </Badge>
                        <Badge colorScheme="green" bg={config.secondaryColor} color="white">
                          Badge 2
                        </Badge>
                        <Badge colorScheme="orange" bg={config.accentColor} color="white">
                          Badge 3
                        </Badge>
                      </HStack>
                    </Box>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Tab 3: Tipografia */}
          <TabPanel>
            <Card bg={colorMode === 'dark' ? 'gray.700' : 'white'} boxShadow="md">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={4}>Fonte do Sistema</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel>Família da Fonte</FormLabel>
                        <Select
                          value={config.fontFamily}
                          onChange={(e) =>
                            setConfig({ ...config, fontFamily: e.target.value })
                          }
                        >
                          {fontOptions.map((font) => (
                            <option key={font.value} value={font.value}>
                              {font.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Tamanho Base</FormLabel>
                        <Select
                          value={config.fontSize}
                          onChange={(e) =>
                            setConfig({ ...config, fontSize: e.target.value })
                          }
                        >
                          {fontSizeOptions.map((size) => (
                            <option key={size.value} value={size.value}>
                              {size.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </SimpleGrid>
                  </Box>

                  <Divider />

                  <Box>
                    <Heading size="md" mb={4}>Preview da Tipografia</Heading>
                    <VStack
                      align="stretch"
                      spacing={4}
                      p={6}
                      bg={colorMode === 'dark' ? 'gray.600' : 'gray.50'}
                      borderRadius="md"
                      fontFamily={config.fontFamily}
                    >
                      <Text fontSize="3xl" fontWeight="bold">
                        Heading Grande - {config.fontFamily}
                      </Text>
                      <Text fontSize="2xl" fontWeight="semibold">
                        Heading Médio - {config.fontFamily}
                      </Text>
                      <Text fontSize="xl">
                        Heading Pequeno - {config.fontFamily}
                      </Text>
                      <Text fontSize={config.fontSize}>
                        Texto corpo padrão - Lorem ipsum dolor sit amet, consectetur
                        adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                        dolore magna aliqua.
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Texto auxiliar - Informações adicionais e legendas
                      </Text>
                    </VStack>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}
