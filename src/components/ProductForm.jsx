import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Input,
  Select,
  Spinner,
  Switch,
  Textarea,
  VStack,
  useToast
} from '@chakra-ui/react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import PriceSettings from './PriceSettings'
import ProductVariations from './ProductVariations'
import ProductImages from './ProductImages'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const priceSchema = z.object({
  sale: z.coerce.number().positive('Preço de venda é obrigatório'),
  promotion: z.coerce.number().optional().default(0),
  wholesale: z.coerce.number().optional().default(0)
})

const variationSchema = z.object({
  id: z.number().optional(),
  type: z.string().trim().min(1, 'Tipo é obrigatório'),
  value: z.string().trim().min(1, 'Valor é obrigatório')
})

const productSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  sku: z.string().trim().min(1, 'SKU é obrigatório'),
  barcode: z.string().optional().default(''),
  category: z.string().trim().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().optional().default(''),
  brand: z.string().trim().min(1, 'Marca é obrigatória'),
  supplier: z.string().optional().default(''),
  description: z.string().optional().default(''),
  prices: priceSchema,
  unit: z.string().trim().min(1, 'Unidade é obrigatória'),
  variations: z.array(variationSchema).optional().default([]),
  images: z
    .array(z.object({ id: z.number().optional(), url: z.string().optional(), alt: z.string().optional() }))
    .optional()
    .default([]),
  active: z.boolean().default(true),
  stock: z.coerce.number().nonnegative('Estoque deve ser maior ou igual a 0').default(0)
})

function buildDefaults(product) {
  return {
    name: product?.name || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    category: product?.category || '',
    subcategory: product?.subcategory || '',
    brand: product?.brand || '',
    supplier: product?.supplier || '',
    description: product?.description || '',
    prices: product?.prices || { sale: 0, promotion: 0, wholesale: 0 },
    unit: product?.unit || 'un',
    variations: product?.variations || [],
    images: product?.images || [],
    active: product?.active !== false,
    stock: Number.isFinite(product?.stock) ? product.stock : 0
  }
}

export default function ProductForm({ product = null, onSubmit = () => {}, onCreated = () => {}, onCancel = null }) {
  const auth = useAuth()
  const toast = useToast()
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [units, setUnits] = useState([])

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(productSchema), defaultValues: buildDefaults(product) })

  useEffect(() => {
    reset(buildDefaults(product))
  }, [product, reset])

  useEffect(() => {
    async function loadMeta() {
      setLoadingMeta(true)
      try {
        const [catsRes, brandsRes, suppliersRes, unitsRes] = await Promise.all([
          api.get('/products/categories'),
          api.get('/products/brands'),
          api.get('/products/suppliers'),
          api.get('/products/units')
        ])
        setCategories(catsRes)
        setBrands(brandsRes)
        setSuppliers(suppliersRes)
        setUnits(unitsRes)
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        toast({ title: 'Erro ao carregar listas', description: err.message, status: 'error', duration: 3000, isClosable: true })
      } finally {
        setLoadingMeta(false)
      }
    }

    loadMeta()
  }, [toast])

  const prices = watch('prices')
  const variations = watch('variations')
  const images = watch('images')

  const onSubmitForm = async (data) => {
    try {
      const opts = api.injectCsrf({}, auth.csrfToken)
      let result

      if (product && product.id) {
        result = await api.put(`/products/${product.id}`, data, opts)
      } else {
        result = await api.post('/products', data, opts)
      }

      onSubmit(result)
      onCreated(result)
    } catch (err) {
      console.error('Erro ao salvar:', err)
      toast({ title: 'Erro ao salvar', description: err.message || 'Tente novamente', status: 'error', duration: 4000, isClosable: true })
    }
  }

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmitForm)} w="full">
      {(isSubmitting || loadingMeta) && <Spinner mb={4} />}

      <VStack spacing={6} align="start" w="full">
        <VStack spacing={4} w="full">
          <Heading size="md">Informações Básicas</Heading>
          <Grid templateColumns={{ base: '1fr', md: '2fr 1fr' }} gap={4} w="full">
            <FormControl isInvalid={!!errors.name} isRequired>
              <FormLabel>Nome do Produto *</FormLabel>
              <Input placeholder="ex: Camiseta básica" bg="white" {...register('name')} />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.sku} isRequired>
              <FormLabel>SKU *</FormLabel>
              <Input placeholder="ex: CAM-001" bg="white" {...register('sku')} />
              <FormErrorMessage>{errors.sku?.message}</FormErrorMessage>
            </FormControl>
          </Grid>

          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }} gap={4} w="full">
            <FormControl>
              <FormLabel>Código de Barras</FormLabel>
              <Input placeholder="789..." bg="white" {...register('barcode')} />
            </FormControl>

            <FormControl isInvalid={!!errors.category} isRequired>
              <FormLabel>Categoria *</FormLabel>
              <Select placeholder="Selecione" bg="white" {...register('category')}>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
              <FormErrorMessage>{errors.category?.message}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Subcategoria</FormLabel>
              <Input placeholder="ex: Camisetas" bg="white" {...register('subcategory')} />
            </FormControl>
          </Grid>

          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }} gap={4} w="full">
            <FormControl isInvalid={!!errors.brand} isRequired>
              <FormLabel>Marca *</FormLabel>
              <Select placeholder="Selecione" bg="white" {...register('brand')}>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </Select>
              <FormErrorMessage>{errors.brand?.message}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Fornecedor</FormLabel>
              <Select placeholder="Selecione" bg="white" {...register('supplier')}>
                {suppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl isInvalid={!!errors.unit} isRequired>
              <FormLabel>Unidade *</FormLabel>
              <Select placeholder="Selecione" bg="white" {...register('unit')}>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.name}>
                    {unit.label} ({unit.name})
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.unit?.message}</FormErrorMessage>
            </FormControl>
          </Grid>

          <FormControl>
            <FormLabel>Descrição</FormLabel>
            <Textarea placeholder="Detalhes do produto" bg="white" rows={4} {...register('description')} />
          </FormControl>
        </VStack>

        <Divider />

        <VStack align="start" spacing={4} w="full">
          <Heading size="md">Preços</Heading>
          <PriceSettings
            prices={prices}
            onChange={(next) => setValue('prices', next, { shouldValidate: true, shouldDirty: true })}
          />
          <FormControl isInvalid={!!errors.prices?.sale}>
            <FormErrorMessage>{errors.prices?.sale?.message}</FormErrorMessage>
          </FormControl>
        </VStack>

        <Divider />

        <VStack align="start" spacing={4} w="full">
          <Heading size="md">Variações</Heading>
          <ProductVariations
            variations={variations}
            onChange={(next) => setValue('variations', next, { shouldValidate: true, shouldDirty: true })}
          />
          <FormControl isInvalid={!!errors.variations}>
            <FormErrorMessage>{errors.variations?.message}</FormErrorMessage>
          </FormControl>
        </VStack>

        <Divider />

        <VStack align="start" spacing={4} w="full">
          <Heading size="md">Imagens</Heading>
          <ProductImages
            images={images}
            onChange={(next) => setValue('images', next, { shouldValidate: true, shouldDirty: true })}
          />
          <FormControl isInvalid={!!errors.images}>
            <FormErrorMessage>{errors.images?.message}</FormErrorMessage>
          </FormControl>
        </VStack>

        <Divider />

        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4} w="full">
          <FormControl isInvalid={!!errors.stock}>
            <FormLabel>Estoque</FormLabel>
            <Input type="number" min={0} bg="white" {...register('stock', { valueAsNumber: true })} />
            <FormHelperText>Quantidade disponível</FormHelperText>
            <FormErrorMessage>{errors.stock?.message}</FormErrorMessage>
          </FormControl>

          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="active" mb="0">
              Produto ativo?
            </FormLabel>
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Switch id="active" isChecked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
              )}
            />
          </FormControl>
        </Grid>

        <Divider />

        <HStack spacing={4} justify="flex-end" w="full">
          <Button 
            variant="outline" 
            onClick={() => {
              if (onCancel) {
                onCancel()
              } else {
                reset(buildDefaults(product))
              }
            }} 
            isDisabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button colorScheme="blue" type="submit" isLoading={isSubmitting}>
            {product ? 'Atualizar' : 'Criar'} Produto
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
}
