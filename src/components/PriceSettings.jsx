import React from 'react'
import { FormControl, FormLabel, Input, FormHelperText, Grid } from '@chakra-ui/react'

/**
 * PriceSettings.jsx
 * Componente para configurar múltiplos preços de um produto
 * Props:
 *   - prices: { sale, promotion, wholesale }
 *   - onChange: callback quando algum preço muda
 */
export default function PriceSettings({ prices = {}, onChange }) {
  const handlePriceChange = (priceType, value) => {
    const newPrices = { ...prices, [priceType]: parseFloat(value) || 0 }
    onChange(newPrices)
  }

  return (
    <Grid templateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }} gap={4}>
      <FormControl>
        <FormLabel fontWeight="bold">Preço de Venda *</FormLabel>
        <Input
          type="number"
          step={0.01}
          min={0}
          value={prices.sale || ''}
          onChange={(e) => handlePriceChange('sale', e.target.value)}
          placeholder="29.90"
          bg="white"
        />
        <FormHelperText>Preço base de venda</FormHelperText>
      </FormControl>

      <FormControl>
        <FormLabel fontWeight="bold">Preço de Promoção</FormLabel>
        <Input
          type="number"
          step={0.01}
          min={0}
          value={prices.promotion || ''}
          onChange={(e) => handlePriceChange('promotion', e.target.value)}
          placeholder="24.90"
          bg="white"
        />
        <FormHelperText>Preço com desconto/promoção</FormHelperText>
      </FormControl>

      <FormControl>
        <FormLabel fontWeight="bold">Preço Atacado</FormLabel>
        <Input
          type="number"
          step={0.01}
          min={0}
          value={prices.wholesale || ''}
          onChange={(e) => handlePriceChange('wholesale', e.target.value)}
          placeholder="15.00"
          bg="white"
        />
        <FormHelperText>Preço para compras em quantidade</FormHelperText>
      </FormControl>
    </Grid>
  )
}
