"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { partialSellTrade, type Trade } from "@/app/actions/trades"
import { getCurrencySymbol } from "@/lib/currencies"

interface PartialSellDialogProps {
  trade: Trade
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PartialSellDialog({ trade, open, onOpenChange }: PartialSellDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sellQuantity, setSellQuantity] = useState("")
  const [sellPrice, setSellPrice] = useState("")
  
  const currency = trade.currency || "USD"
  const currencySymbol = getCurrencySymbol(currency)
  const maxQuantity = Number.parseFloat(trade.quantity)
  const buyPrice = Number.parseFloat(trade.buy_price)
  
  const sellQty = Number.parseFloat(sellQuantity) || 0
  const sellPriceNum = Number.parseFloat(sellPrice) || 0
  const estimatedPL = sellQty > 0 && sellPriceNum > 0 ? (sellPriceNum - buyPrice) * sellQty : 0
  const remainingQty = maxQuantity - sellQty

  const today = new Date().toISOString().split("T")[0]
  const currentTime = new Date().toTimeString().slice(0, 5)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await partialSellTrade(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onOpenChange(false)
      setLoading(false)
      setSellQuantity("")
      setSellPrice("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sell {trade.asset_name}</DialogTitle>
          <DialogDescription>
            Sell some or all of your position. You currently own {maxQuantity.toLocaleString()} units at {currencySymbol}{buyPrice.toFixed(2)} each.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="tradeId" value={trade.id} />
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="sellQuantity">Quantity to Sell</Label>
            <Input
              id="sellQuantity"
              name="sellQuantity"
              type="number"
              step="0.00000001"
              min="0.00000001"
              max={maxQuantity}
              value={sellQuantity}
              onChange={(e) => setSellQuantity(e.target.value)}
              placeholder={`Max: ${maxQuantity}`}
              required
              disabled={loading}
            />
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setSellQuantity((maxQuantity * 0.25).toString())}
                disabled={loading}
              >
                25%
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setSellQuantity((maxQuantity * 0.5).toString())}
                disabled={loading}
              >
                50%
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setSellQuantity((maxQuantity * 0.75).toString())}
                disabled={loading}
              >
                75%
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setSellQuantity(maxQuantity.toString())}
                disabled={loading}
              >
                100%
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sellPrice">Sell Price ({currency})</Label>
            <Input
              id="sellPrice"
              name="sellPrice"
              type="number"
              step="0.01"
              min="0.01"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder={`Buy price was ${currencySymbol}${buyPrice.toFixed(2)}`}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Sell Date & Time</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input 
                id="sellDate" 
                name="sellDate" 
                type="date" 
                defaultValue={today}
                required 
                disabled={loading} 
              />
              <Input 
                id="sellTime" 
                name="sellTime" 
                type="time" 
                defaultValue={currentTime}
                required 
                disabled={loading} 
              />
            </div>
          </div>

          {sellQty > 0 && sellPriceNum > 0 && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Selling</span>
                <span>{sellQty.toLocaleString()} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span>{remainingQty > 0 ? remainingQty.toLocaleString() : "0 (closing position)"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Value</span>
                <span>{currencySymbol}{(sellQty * sellPriceNum).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2 mt-2">
                <span>Estimated P&L</span>
                <span className={estimatedPL >= 0 ? "text-green-600" : "text-red-600"}>
                  {estimatedPL >= 0 ? "+" : ""}{currencySymbol}{estimatedPL.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || sellQty <= 0 || sellPriceNum <= 0}>
              {loading ? "Processing..." : remainingQty > 0 ? "Partial Sell" : "Close Position"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
