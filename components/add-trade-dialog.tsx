"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus } from "lucide-react"
import { createTrade } from "@/app/actions/trades"
import { CURRENCIES } from "@/lib/currencies"

interface AddTradeDialogProps {
  defaultCurrency: string
}

export function AddTradeDialog({ defaultCurrency }: AddTradeDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [assetType, setAssetType] = useState("stock")
  const [currency, setCurrency] = useState(defaultCurrency)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await createTrade(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setOpen(false)
      setLoading(false)
      setAssetType("stock")
      setCurrency(defaultCurrency)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Trade
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record New Trade</DialogTitle>
          <DialogDescription>
            Add a new trade to your portfolio. Leave sell price empty for open positions.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="assetName">Asset Name</Label>
            <Input id="assetName" name="assetName" placeholder="e.g., AAPL, BTC, Gold" required disabled={loading} />
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
                placeholder="0.00"
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
                placeholder="0"
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Buy Date & Time</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="buyDate"
                name="buyDate"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
                disabled={loading}
              />
              <Input
                id="buyTime"
                name="buyTime"
                type="time"
                defaultValue={new Date().toTimeString().slice(0, 5)}
                required
                disabled={loading}
              />
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
              placeholder="Leave empty for open position"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Sell Date & Time - Optional</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input id="sellDate" name="sellDate" type="date" disabled={loading} />
              <Input id="sellTime" name="sellTime" type="time" disabled={loading} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Trade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
