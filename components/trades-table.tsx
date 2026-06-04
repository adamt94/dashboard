"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Pencil, Trash2, TrendingDown } from "lucide-react"
import { type Trade, deleteTrade } from "@/app/actions/trades"
import { EditTradeDialog } from "./edit-trade-dialog"
import { PartialSellDialog } from "./partial-sell-dialog"
import { formatConvertedAmount } from "@/lib/exchange-rates"

interface TradesTableProps {
  trades: Trade[]
  displayCurrency: string
}

export function TradesTable({ trades, displayCurrency }: TradesTableProps) {
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
  const [sellingTrade, setSellingTrade] = useState<Trade | null>(null)
  const [deletingTradeId, setDeletingTradeId] = useState<number | null>(null)

  async function handleDelete() {
    if (deletingTradeId) {
      await deleteTrade(deletingTradeId)
      setDeletingTradeId(null)
    }
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No trades recorded yet. Add your first trade to get started!</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Buy Price</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Sell Price</TableHead>
              <TableHead className="text-right">P&L</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => {
              const profitLoss = trade.profit_loss ? Number.parseFloat(trade.profit_loss) : null
              const isProfitable = profitLoss !== null && profitLoss > 0
              const tradeCurrency = trade.currency || "USD"

              return (
                <TableRow key={trade.id}>
                  <TableCell className="font-medium">{trade.asset_name}</TableCell>
                  <TableCell className="capitalize">{trade.asset_type}</TableCell>
                  <TableCell className="text-right">
                    {formatConvertedAmount(Number.parseFloat(trade.buy_price), tradeCurrency, displayCurrency)}
                  </TableCell>
                  <TableCell className="text-right">{Number.parseFloat(trade.quantity).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {trade.sell_price
                      ? formatConvertedAmount(Number.parseFloat(trade.sell_price), tradeCurrency, displayCurrency)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {profitLoss !== null ? (
                      <span
                        className={
                          isProfitable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        }
                      >
                        {isProfitable ? "+" : ""}
                        {formatConvertedAmount(profitLoss, tradeCurrency, displayCurrency)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={trade.status === "open" ? "secondary" : "default"}>
                      {trade.status === "open" ? "Open" : "Closed"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(trade.buy_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTrade(trade)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {trade.status === "open" && (
                          <DropdownMenuItem onClick={() => setSellingTrade(trade)}>
                            <TrendingDown className="h-4 w-4 mr-2" />
                            Sell
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setDeletingTradeId(trade.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {editingTrade && (
        <EditTradeDialog trade={editingTrade} open={!!editingTrade} onOpenChange={() => setEditingTrade(null)} />
      )}

      {sellingTrade && (
        <PartialSellDialog trade={sellingTrade} open={!!sellingTrade} onOpenChange={() => setSellingTrade(null)} />
      )}

      <AlertDialog open={!!deletingTradeId} onOpenChange={() => setDeletingTradeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trade? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
