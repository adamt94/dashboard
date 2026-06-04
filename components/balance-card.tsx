"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, Pencil, TrendingUp, TrendingDown } from "lucide-react"
import { updateBalance } from "@/app/actions/balance"
import { formatCurrency } from "@/lib/currencies"

interface BalanceCardProps {
  balance: number
  baseBalance?: number
  tradeProfitLoss?: number
  updatedAt: Date
  currency: string
}

export function BalanceCard({ balance, baseBalance, tradeProfitLoss = 0, updatedAt, currency }: BalanceCardProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await updateBalance(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setOpen(false)
      setLoading(false)
    }
  }

  const editableBalance = baseBalance !== undefined ? baseBalance : balance

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
          <CardDescription>Your current trading capital</CardDescription>
        </div>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <div className="text-3xl font-bold">{formatCurrency(balance, currency)}</div>
            {baseBalance !== undefined && tradeProfitLoss !== 0 && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <span>Base: {formatCurrency(baseBalance, currency)}</span>
                </div>
                <div className={`flex items-center gap-1 ${tradeProfitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {tradeProfitLoss >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>Trades: {formatCurrency(tradeProfitLoss, currency)}</span>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Last updated {new Date(updatedAt).toLocaleDateString()}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Base Balance</DialogTitle>
                <DialogDescription>
                  Update your base balance to reflect deposits or withdrawals. Trade profits/losses will be added
                  automatically.
                </DialogDescription>
              </DialogHeader>
              <form action={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="balance">Base Balance ({currency})</Label>
                  <Input
                    id="balance"
                    name="balance"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editableBalance}
                    required
                    disabled={loading}
                  />
                  {tradeProfitLoss !== 0 && (
                    <p className="text-xs text-muted-foreground">
                      Current trade P&L: {formatCurrency(tradeProfitLoss, currency)} (will be added automatically)
                    </p>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Balance"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
