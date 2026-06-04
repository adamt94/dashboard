"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updateTrade, type Trade } from "@/app/actions/trades"
import { CURRENCIES } from "@/lib/currencies"

interface EditTradeDialogProps {
  trade: Trade
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTradeDialog({ trade, open, onOpenChange }: EditTradeDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [assetType, setAssetType] = useState(trade.asset_type)
  const [currency, setCurrency] = useState(trade.currency || "USD")

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await updateTrade(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onOpenChange(false)
      setLoading(false)
    }
  }

  const buyDateTime = new Date(trade.buy_date)
  const buyDateStr = buyDateTime.toISOString().split("T")[0]
  const buyTimeStr = buyDateTime.toTimeString().slice(0, 5)

  const sellDateTime = trade.sell_date ? new Date(trade.sell_date) : null
  const sellDateStr = sellDateTime ? sellDateTime.toISOString().split("T")[0] : ""
  const sellTimeStr = sellDateTime ? sellDateTime.toTimeString().slice(0, 5) : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trade</DialogTitle>
          <DialogDescription>Update trade details. Add sell price to close the position.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="tradeId" value={trade.id} />
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="assetName">Asset Name</Label>
            <Input
              id="assetName"
              name="assetName"
              defaultValue={trade.asset_name}
              placeholder="e.g., AAPL, BTC, Gold"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assetType">Asset Type</Label>
            <Select name="assetType" value={assetType} onValueChange={setAssetType} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select name="currency" value={currency} onValueChange={setCurrency} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyPrice">Buy Price ({currency})</Label>
              <Input
                id="buyPrice"
                name="buyPrice"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={trade.buy_price}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.00000001"
                min="0.00000001"
                defaultValue={trade.quantity}
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Buy Date & Time</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input id="buyDate" name="buyDate" type="date" defaultValue={buyDateStr} required disabled={loading} />
              <Input id="buyTime" name="buyTime" type="time" defaultValue={buyTimeStr} required disabled={loading} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sellPrice">Sell Price ({currency}) - Optional</Label>
            <Input
              id="sellPrice"
              name="sellPrice"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={trade.sell_price || ""}
              placeholder="Leave empty for open position"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Sell Date & Time - Optional</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input id="sellDate" name="sellDate" type="date" defaultValue={sellDateStr} disabled={loading} />
              <Input id="sellTime" name="sellTime" type="time" defaultValue={sellTimeStr} disabled={loading} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Trade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
