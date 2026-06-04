"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getCurrencySymbol, CURRENCIES } from "@/lib/currencies"
import { updateCurrency } from "@/app/actions/balance"

interface CurrencySelectorProps {
  currentCurrency: string
}

export function CurrencySelector({ currentCurrency }: CurrencySelectorProps) {
  const [open, setOpen] = useState(false)
  const [currency, setCurrency] = useState(currentCurrency)
  const [loading, setLoading] = useState(false)

  async function handleUpdate() {
    setLoading(true)
    const result = await updateCurrency(currency)

    if (!result?.error) {
      setOpen(false)
      // Force a page refresh to update all currency displays
      window.location.reload()
    }
    setLoading(false)
  }

  const currentSymbol = getCurrencySymbol(currentCurrency)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <span className="mr-2 font-semibold">{currentSymbol}</span>
          {currentCurrency}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Currency</DialogTitle>
          <DialogDescription>Select your preferred currency for displaying balances and trades</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={currency} onValueChange={setCurrency} disabled={loading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.code} - {curr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "Updating..." : "Update Currency"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
